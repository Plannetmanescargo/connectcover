"use client";
import { useEffect, useRef, useState } from "react";
import { loadScript, type WalletWindow, type AppleSession } from "./sdk";
export default function PayPalCheckout(props: { checkoutId: string; orderId: string; clientId: string; mode: string; amount: string; applePay: boolean; googlePay: boolean }) {
  const paypalContainer = useRef<HTMLDivElement>(null);
  const appleContainer = useRef<HTMLDivElement>(null);
  const googleContainer = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  useEffect(() => {
    let stopped = false; let locked = false; let appleSession: AppleSession | undefined;
    let closeButtons: (() => Promise<void>) | undefined;
    const w = window as WalletWindow;
    const destination = `/checkout/success?provider=paypal&checkout_id=${encodeURIComponent(props.checkoutId)}`;
    const showError = (message = "This payment method is unavailable. Please try again or choose another method.") => { if (!stopped) setError(message); };
    const lock = () => { if (locked) return false; locked = true; setBusy(true); setError(""); return true; };
    const unlock = () => { locked = false; if (!stopped) setBusy(false); };
    async function capture() {
      // If the response is lost, go to status/recovery; never invite another payment.
      try { await fetch("/api/paypal/capture", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutId: props.checkoutId }), signal: AbortSignal.timeout(45000) }); }
      catch { /* status and cron recover an ambiguous result */ }
    }
    async function init() {
      const components = ["buttons", ...(props.applePay ? ["applepay"] : []), ...(props.googlePay ? ["googlepay"] : [])];
      await loadScript(`https://www.paypal.com/sdk/js?${new URLSearchParams({ "client-id": props.clientId, currency: "GBP", intent: "capture", components: components.join(","), "disable-funding": "paylater,venmo" })}`);
      if (stopped || !w.paypal || !paypalContainer.current) return;
      const sdk = w.paypal;
      const buttons = sdk.Buttons({ style: { layout: "vertical", shape: "rect", label: "pay" },
        createOrder: async () => { if (!lock()) throw new Error("Payment in progress"); return props.orderId; },
        onApprove: async () => { await capture(); window.location.assign(destination); },
        onCancel: () => { unlock(); showError("Payment was cancelled. You can choose a payment method when you’re ready."); },
        onError: () => { unlock(); showError(); },
      });
      closeButtons = () => buttons.close();
      await buttons.render(paypalContainer.current);
      if (!stopped) setLoading(false);
      // Wallet setup is independent: an unsupported wallet cannot hide PayPal.
      await Promise.allSettled([
        (async () => {
          if (!props.applePay) return;
          await loadScript("https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js");
          const Apple = w.ApplePaySession;
          if (stopped || !Apple?.canMakePayments() || !Apple.supportsVersion(4)) return;
          const apple = sdk.Applepay(); const config = await apple.config();
          if (stopped || !config.isEligible || !appleContainer.current) return;
          const button = document.createElement("apple-pay-button");
          button.setAttribute("buttonstyle", "black"); button.setAttribute("type", "pay"); button.setAttribute("locale", "en-GB");
          button.style.cssText = "--apple-pay-button-width:100%;--apple-pay-button-height:48px;--apple-pay-button-border-radius:4px;display:block;width:100%";
          button.onclick = () => {
            if (!lock()) return;
            try {
              const session = new Apple(4, { countryCode: config.countryCode, merchantCapabilities: config.merchantCapabilities,
                supportedNetworks: config.supportedNetworks, currencyCode: "GBP", requiredBillingContactFields: ["postalAddress"],
                total: { label: "Coverza", type: "final", amount: props.amount } });
              appleSession = session;
              session.onvalidatemerchant = event => { void apple.validateMerchant({ validationUrl: event.validationURL, displayName: "Coverza" })
                .then(result => session.completeMerchantValidation(result.merchantSession)).catch(() => { session.abort(); unlock(); showError(); }); };
              session.oncancel = unlock;
              session.onpaymentauthorized = event => { void (async () => {
                try {
                  await apple.confirmOrder({ orderId: props.orderId, token: event.payment.token, billingContact: event.payment.billingContact });
                  // Wallet authorization completes the sheet; payment confirmation is
                  // shown separately, only after server-side capture verification.
                  session.completePayment(Apple.STATUS_SUCCESS);
                  await capture(); window.location.assign(destination);
                } catch { session.completePayment(Apple.STATUS_FAILURE); unlock(); showError(); }
              })(); };
              session.begin();
            } catch { unlock(); showError(); }
          };
          appleContainer.current.replaceChildren(button);
        })(),
        (async () => {
          if (!props.googlePay) return;
          await loadScript("https://pay.google.com/gp/p/js/pay.js");
          if (stopped || !w.google) return;
          const google = sdk.Googlepay(); const config = await google.config();
          if (stopped) return;
          const client = new w.google.payments.api.PaymentsClient({ environment: props.mode === "live" ? "PRODUCTION" : "TEST",
            paymentDataCallbacks: { onPaymentAuthorized: async (data: { paymentMethodData: unknown }) => {
              try {
                const confirmed = await google.confirmOrder({ orderId: props.orderId, paymentMethodData: data.paymentMethodData });
                if (confirmed.status === "PAYER_ACTION_REQUIRED") await google.initiatePayerAction({ orderId: props.orderId });
                else if (confirmed.status !== "APPROVED") throw new Error("Not approved");
                await capture();
                window.setTimeout(() => window.location.assign(destination), 0);
                return { transactionState: "SUCCESS" };
              } catch { unlock(); return { transactionState: "ERROR", error: { intent: "PAYMENT_AUTHORIZATION", message: "Unable to authorize this payment. Please try again." } }; }
            } } });
          const base = { apiVersion: 2, apiVersionMinor: 0, allowedPaymentMethods: config.allowedPaymentMethods };
          const ready = await client.isReadyToPay(base);
          if (stopped || !ready.result || !googleContainer.current) return;
          const request = { ...base, merchantInfo: config.merchantInfo, callbackIntents: ["PAYMENT_AUTHORIZATION"],
            transactionInfo: { countryCode: "GB", currencyCode: "GBP", totalPriceStatus: "FINAL", totalPrice: props.amount } };
          const button = client.createButton({ buttonColor: "black", buttonType: "pay", buttonSizeMode: "fill", allowedPaymentMethods: config.allowedPaymentMethods,
            onClick: () => { if (lock()) void client.loadPaymentData(request).catch(() => { unlock(); showError("Google Pay was closed or could not complete. You can try again."); }); } });
          googleContainer.current.replaceChildren(button);
        })(),
      ]);
    }
    void init().catch(() => { if (!stopped) { setLoading(false); showError("We couldn’t load secure checkout. Please refresh this page to try again."); } });
    const appleNode = appleContainer.current; const googleNode = googleContainer.current;
    return () => { stopped = true; void closeButtons?.().catch(() => {}); try { appleSession?.abort(); } catch { /* already complete */ }
      appleNode?.replaceChildren(); googleNode?.replaceChildren(); };
  }, [props.checkoutId, props.orderId, props.clientId, props.mode, props.amount, props.applePay, props.googlePay]);
  return <div aria-busy={loading || busy}>
    {loading && <p role="status" className="mb-4 text-slate-600">Loading secure payment options…</p>}
    {busy && <p role="status" className="mb-4 text-slate-600">Complete the payment window. Please don’t refresh or pay again.</p>}
    <div className="space-y-3"><div ref={appleContainer} /><div ref={googleContainer} /><div ref={paypalContainer} /></div>
    {error && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-950">{error}</p>}
  </div>;
}
