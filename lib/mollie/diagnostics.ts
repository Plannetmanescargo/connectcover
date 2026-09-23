// SDK errors can contain authenticated Request objects and customer data.
// Return only fixed labels, numeric HTTP status and known field names.
export function mollieDiagnostic(error: unknown) {
  const e = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const status = e.statusCode ?? e.status;
  const httpStatus = typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599 ? status : undefined;
  const code = typeof e.code === "string" && /^P\d{4}$/.test(e.code) ? e.code : undefined;
  const names = ["ErrorResponse", "ClientDefaultError", "SDKValidationError", "ResponseValidationError", "ConnectionError", "RequestTimeoutError", "RequestAbortedError", "PrismaClientKnownRequestError", "PrismaClientInitializationError", "PrismaClientValidationError"];
  const kind = typeof e.name === "string" && names.includes(e.name) ? e.name : "Error";
  const fields = ["method", "amount", "amount.currency", "amount.value", "currency", "billingAddress", "billingAddress.email", "locale", "captureMode", "sequenceType", "redirectUrl", "webhookUrl", "description", "metadata", "profileId", "testmode", "idempotencyKey"];
  const field = typeof e.field === "string" && fields.includes(e.field) ? e.field : undefined;
  const detail = typeof e.detail === "string" ? e.detail.toLowerCase() : "";
  const topics = ["api key", "payment method", "creditcard", "currency", "profile", "webhook", "capture", "idempotency", "billing", "activated", "enabled", "approved"].filter(word => detail.includes(word));
  const messages = ["Mollie payment does not match the stored checkout", "Invalid Mollie checkout URL", "Invalid payment amount", "Checkout creation needs manual reconciliation", "Checkout mode mismatch"];
  const reason = typeof e.message === "string" && messages.includes(e.message) ? e.message : undefined;
  return { kind, httpStatus, code, field, topics, reason };
}
