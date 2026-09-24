// Narrow interfaces for the externally hosted wallet SDKs. No payment tokens are
// sent to our server or logged; the PayPal SDK handles token confirmation.
type ObjectData = Record<string, unknown>;
export type AppleConfig = { isEligible: boolean; countryCode: string; merchantCapabilities: string[]; supportedNetworks: string[] };
export type GoogleConfig = { allowedPaymentMethods: ObjectData[]; merchantInfo: ObjectData };
export type CardField = { render(element: HTMLElement): Promise<void>; close(): Promise<void> };
export type CardFields = {
  isEligible(): boolean;
  getState(): Promise<{ isFormValid: boolean }>;
  submit(options: { name: string; billingAddress: { addressLine1: string; addressLine2: string; adminArea2: string; postalCode: string; countryCode: string } }): Promise<void>;
  NumberField(options?: ObjectData): CardField;
  ExpiryField(options?: ObjectData): CardField;
  CVVField(options?: ObjectData): CardField;
};
export type PayPalSDK = {
  CardFields(options: { style: ObjectData; createOrder: () => Promise<string>; onApprove: () => Promise<void>; onCancel: () => void; onError: () => void }): CardFields;
  Buttons(options: { fundingSource?: string; style: ObjectData; createOrder: () => Promise<string>; onApprove: () => Promise<void>; onCancel: () => void; onError: () => void }): { render(element: HTMLElement): Promise<void>; close(): Promise<void> };
  Applepay(): { config(): Promise<AppleConfig>; validateMerchant(data: ObjectData): Promise<{ merchantSession: unknown }>; confirmOrder(data: ObjectData): Promise<{ status: string }> };
  Googlepay(): { config(): Promise<GoogleConfig>; confirmOrder(data: ObjectData): Promise<{ status: string }>; initiatePayerAction(data: { orderId: string }): Promise<unknown> };
};
export type AppleSession = { onvalidatemerchant: (event: { validationURL: string }) => void;
  onpaymentauthorized: (event: { payment: { token: unknown; billingContact?: unknown } }) => void;
  oncancel: () => void; begin(): void; abort(): void; completeMerchantValidation(data: unknown): void; completePayment(status: number): void };
export type WalletWindow = Window & {
  paypal?: PayPalSDK;
  ApplePaySession?: { new(version: number, request: ObjectData): AppleSession; canMakePayments(): boolean; supportsVersion(version: number): boolean; STATUS_SUCCESS: number; STATUS_FAILURE: number };
  google?: { payments: { api: { PaymentsClient: new(options: ObjectData) => {
    isReadyToPay(data: ObjectData): Promise<{ result: boolean }>; createButton(data: ObjectData): HTMLElement; loadPaymentData(data: ObjectData): Promise<unknown>;
  } } } };
};
const scripts = new Map<string, Promise<void>>();
export function loadScript(src: string) {
  const existing = scripts.get(src); if (existing) return existing;
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script"); script.src = src; script.async = true;
    const timer = setTimeout(() => { script.remove(); scripts.delete(src); reject(new Error("Payment script timed out")); }, 20000);
    script.onload = () => { clearTimeout(timer); resolve(); };
    script.onerror = () => { clearTimeout(timer); script.remove(); scripts.delete(src); reject(new Error("Payment script unavailable")); };
    document.head.appendChild(script);
  });
  scripts.set(src, promise); return promise;
}
