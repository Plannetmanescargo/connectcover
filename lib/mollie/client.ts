import { Client } from "mollie-api-typescript";
import { getMollieConfig } from "./config";

export function mollieClient() {
  const config = getMollieConfig();
  // API keys determine the profile and test/live mode; do not send testmode/profileId.
  return new Client({ security: { apiKey: config.apiKey }, timeoutMs: 8_000, retryConfig: { strategy: "none" } });
}
