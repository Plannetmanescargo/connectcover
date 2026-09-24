"use client";
import { useEffect, useRef, useState } from "react";
import { LockKeyhole, CreditCard, LoaderCircle } from "lucide-react";
import PayPalProgress from "./PayPalProgress";
import styles from "./checkout.module.css";
import { loadScript, type WalletWindow, type AppleSession, type CardFields, type CardField } from "./sdk";
export default function PayPalCheckout(props: { checkoutId: string; orderId: string; clientId: string; mode: string; amount: string; applePay: boolean; googlePay: boolean }) {
  const cardNumber = useRef<HTMLDivElement>(null);
  const cardExpiry = useRef<HTMLDivElement>(null);
  const cardCvv = useRef<HTMLDivElement>(null);
  const submitCard = useRef<((form: HTMLFormElement) => Promise<void>) | null>(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [cardReady, setCardReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const paypalContainer = useRef<HTMLDivElement>(null);
  const appleContainer = useRef<HTMLDivElement>(null);
  const googleContainer = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  useEffect(() => {
    let stopped = false; let locked = false; let appleSession: AppleSession | undefined;
    const cardFields: CardField[] = [];
    let approved = false;
    let closeButtons: (() => Promise<void>) | undefined;
    const w = window as WalletWindow;
    const destination = `/checkout/success?provider=paypal&checkout_id=${encodeURIComponent(props.checkoutId)}`;
    const showError = (message = "This payment method is unavailable. Please try again or choose another method.") => { if (!stopped) setError(message); };
    const lock = () => { if (stopped || locked || approved) return false; locked = true; setBusy(true); setError(""); return true; };
    const unlock = () => { if (approved) return; locked = false; if (!stopped) setBusy(false); };
    async function capture() {
      approved = true;
      if (!stopped) setProcessing(true);
      // If the response is lost, go to status/recovery; never invite another payment.
      try { await fetch("/api/paypal/capture", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutId: props.checkoutId }), signal: AbortSignal.timeout(12000) }); }
      catch { /* status and cron recover an ambiguous result */ }
    }
    async function init() {
      const components = ["buttons", "card-fields", ...(props.applePay ? ["applepay"] : []), ...(props.googlePay ? ["googlepay"] : [])];
      await loadScript(`https://www.paypal.com/sdk/js?${new URLSearchParams({ "client-id": props.clientId, currency: "GBP", locale: "en_GB", intent: "capture", components: components.join(","), "disable-funding": "paylater,venmo" })}`);
      if (stopped || !w.paypal || !paypalContainer.current) return;
      const sdk = w.paypal;
      const buttons = sdk.Buttons({ fundingSource: "paypal", style: { layout: "vertical", shape: "rect", label: "pay", height: 48, color: "black", borderRadius: 8 },
        createOrder: async () => { if (!lock()) throw new Error("Payment in progress"); return props.orderId; },
        onApprove: async () => { await capture(); window.location.assign(destination); },
        onCancel: () => { unlock(); showError("Payment was cancelled. You can choose a payment method when you’re ready."); },
        onError: () => { unlock(); showError(); },
      });
      closeButtons = () => buttons.close();
      await buttons.render(paypalContainer.current);
      if (!stopped) setLoading(false);
      // Each method initializes independently, including card eligibility.
      // SCA_WHEN_REQUIRED is PayPal's default; CardFields handles the bank challenge.
      // Raw card details stay inside PayPal-hosted iframes.

      // Wallet setup is independent: an unsupported wallet cannot hide PayPal.
      await Promise.allSettled([
        (async () => {
          try {
          const cards: CardFields = sdk.CardFields({
            style: { input: { "font-family": "Arial, sans-serif", "font-size": "16px", color: "#182235", padding: "12px" }, ".invalid": { color: "#b42318" } },
            createOrder: async () => { if (stopped || approved) throw new Error("Payment already submitted"); return props.orderId; },
            onApprove: async () => { await capture(); window.location.assign(destination); },
            onCancel: () => { unlock(); showError("Bank verification was cancelled. Your card has not been submitted for capture."); },
            onError: () => { unlock(); showError("Please check your card and billing details, or choose another payment method."); },
          });
          if (!cards.isEligible() || !cardNumber.current || !cardExpiry.current || !cardCvv.current) return;
          const fields = [cards.NumberField({ placeholder: "Card number" }), cards.ExpiryField({ placeholder: "MM / YY" }), cards.CVVField({ placeholder: "Security code" })];
          cardFields.push(...fields);
          await Promise.all(fields.map((field, i) => field.render([cardNumber.current!, cardExpiry.current!, cardCvv.current!][i])));
          if (stopped) return;
          submitCard.current = async form => {
            if (!form.reportValidity() || !lock()) return;
            try {
              if (!(await cards.getState()).isFormValid) { unlock(); showError("Please check your card number, expiry date and security code."); return; }
              const data = new FormData(form);
              const value = (key: string) => String(data.get(key) || "").trim();
              await cards.submit({ name: value("cardholder"), billingAddress: {
                addressLine1: value("addressLine1"), addressLine2: value("addressLine2"),
                adminArea2: value("city"), postalCode: value("postcode").toUpperCase(), countryCode: "GB",
              } });
            } catch { unlock(); showError("We couldn’t complete your card payment. Check your details or choose another method."); }
          };
          setCardReady(true);
          } finally { if (!stopped) setCardLoading(false); }
        })(),
        (async () => {
          if (!props.applePay) return;
          await loadScript("https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js");
          const Apple = w.ApplePaySession;
          if (stopped || !Apple?.canMakePayments() || !Apple.supportsVersion(4)) return;
          const apple = sdk.Applepay(); const config = await apple.config();
          if (stopped || !config.isEligible || !appleContainer.current) return;
          const button = document.createElement("apple-pay-button");
          button.setAttribute("buttonstyle", "black"); button.setAttribute("type", "pay"); button.setAttribute("locale", "en-GB");
          button.style.cssText = "--apple-pay-button-width:100%;--apple-pay-button-height:48px;--apple-pay-button-border-radius:8px;display:block;width:100%";
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
    return () => { stopped = true; submitCard.current = null;
      for (const field of cardFields) void field.close().catch(() => {}); void closeButtons?.().catch(() => {}); try { appleSession?.abort(); } catch { /* already complete */ }
      appleNode?.replaceChildren(); googleNode?.replaceChildren(); };
  }, [props.checkoutId, props.orderId, props.clientId, props.mode, props.amount, props.applePay, props.googlePay]);
  return <div className={styles.payment} aria-busy={loading || busy}>
    {processing && <PayPalProgress state="PENDING" compact />}
    <div hidden={processing}>
      <div className={styles.methodHeading}><LockKeyhole size={17} aria-hidden="true" /><span>Choose how to pay</span></div>
      {loading && <div className={styles.loading} role="status"><LoaderCircle className={styles.spinner} size={18} />Loading secure payment options…</div>}
      {busy && <p role="status" className={styles.notice}>Complete the secure payment or bank verification window. Please don’t pay again.</p>}
      <div className={styles.wallets} aria-disabled={busy} style={busy ? { pointerEvents: "none", opacity: .65 } : undefined}>
        <div ref={appleContainer} /><div ref={googleContainer} /><div ref={paypalContainer} />
      </div>
      <div className={styles.divider}><span>or pay by card</span></div>
      <form onSubmit={event => { event.preventDefault(); void submitCard.current?.(event.currentTarget); }}>
        <fieldset disabled={busy || !cardReady} className={styles.fieldset}>
          <legend className={styles.cardTitle}><CreditCard size={19} aria-hidden="true" />Debit or credit card</legend>
          <div className={styles.fields}>
            <label className={styles.label}>Name on card<input name="cardholder" autoComplete="cc-name" required maxLength={100} placeholder="Full name" /></label>
            <div className={styles.label}>Card number<div ref={cardNumber} className={styles.hostedField} /></div>
            <div className={styles.fieldRow}>
              <div className={styles.label}>Expiry date<div ref={cardExpiry} className={styles.hostedField} /></div>
              <div className={styles.label}>Security code<div ref={cardCvv} className={styles.hostedField} /></div>
            </div>
            <div className={styles.billingHeading}><span>Billing address</span><span className={styles.country}>United Kingdom</span></div>
            <label className={styles.label}>Address line 1<input name="addressLine1" autoComplete="billing address-line1" required maxLength={300} placeholder="House number and street" /></label>
            <label className={styles.label}>Address line 2 <span className={styles.optional}>(optional)</span><input name="addressLine2" autoComplete="billing address-line2" maxLength={300} /></label>
            <div className={styles.fieldRow}>
              <label className={styles.label}>Town or city<input name="city" autoComplete="billing address-level2" required maxLength={120} /></label>
              <label className={styles.label}>Postcode<input name="postcode" autoComplete="billing postal-code" required maxLength={10} pattern="[A-Za-z0-9 ]{5,10}" placeholder="SW1A 1AA" /></label>
            </div>
            <button className={styles.payButton} type="submit" disabled={busy || !cardReady}><LockKeyhole size={16} aria-hidden="true" />{busy ? "Processing securely…" : `Pay £${props.amount}`}</button>
          </div>
        </fieldset>
      </form>
      {!loading && !cardLoading && !cardReady && <p className={styles.notice} role="status">Card entry isn’t available right now. Please use an available payment option above, or contact support.</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <p className={styles.securityNote}><LockKeyhole size={14} aria-hidden="true" />Encrypted payment, securely processed by PayPal.</p>
    </div>
  </div>;
}
