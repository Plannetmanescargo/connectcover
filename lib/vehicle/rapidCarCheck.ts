import { normaliseRegistration } from "./registration";
export { normaliseRegistration } from "./registration";

export type VehicleSummary = {
  make: string | null;
  model: string | null;
  year: number | null;
  colour: string | null;
  fuelType: string | null;
};

export class VehicleLookupError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

const unavailable = () => new VehicleLookupError(503, "Vehicle lookup is temporarily unavailable. Please enter the details manually.");
const notFound = () => new VehicleLookupError(404, "We couldn't find this vehicle. Check the registration or enter the details manually.");

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

function field(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || /^(not available|unknown|n\/a|null|-)$/i.test(text)) return null;
  // Keep manufacturer/model spelling, including BMW, MG and EV acronyms.
  return text.slice(0, 160);
}


export function parseRapidCarCheck(payload: unknown, plate: string): VehicleSummary {
  const root = record(payload);
  if (root.HasError !== false) throw unavailable();
  const results = record(root.Results);
  if (results.HasVehicleResults === false) throw notFound();
  if (results.HasVehicleResults !== true) throw unavailable();
  const vehicle = record(results.InitialVehicleCheckModel);
  // Reject mismatched records, including an accidentally configured demo result.
  if (vehicle.Vrm != null && normaliseRegistration(vehicle.Vrm) !== plate) throw unavailable();
  const basic = record(vehicle.BasicVehicleDetailsModel);
  const year = Number(basic.YearOfManufacture);
  const summary: VehicleSummary = {
    make: field(basic.Make),
    model: field(basic.Model),
    year: Number.isInteger(year) && year >= 1886 && year <= new Date().getUTCFullYear() + 1 ? year : null,
    colour: field(basic.Colour),
    fuelType: field(basic.FuelType),
  };
  if (!summary.make && !summary.model) throw notFound();
  return summary;
}

export async function fetchRapidCarCheck(
  plate: string,
  env: Record<string, string | undefined> = process.env,
  request: typeof fetch = fetch,
): Promise<VehicleSummary> {
  const key = env.RAPID_CAR_CHECK_API_KEY?.trim();
  const domain = env.RAPID_CAR_CHECK_DOMAIN?.trim();
  if (!key || !domain) throw unavailable();
  let url: URL;
  try {
    url = new URL(env.RAPID_CAR_CHECK_ENDPOINT?.trim() || "https://www.rapidcarcheck.co.uk/api/");
  } catch { throw unavailable(); }
  // Credentials go only to the provider over verified HTTPS. Supply the base
  // endpoint, not an account URL containing parameters or a sandbox flag.
  if (url.protocol !== "https:" || !["www.rapidcarcheck.co.uk", "rapidcarcheck.co.uk"].includes(url.hostname)
    || url.port || url.username || url.password || url.search || url.hash) throw unavailable();
  url.searchParams.set("key", key);
  url.searchParams.set("domain", domain);
  url.searchParams.set("plate", plate);
  try {
    const response = await request(url, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    // No polling or retries: live requests may consume the account allowance.
    if (response.status === 204 || response.status === 404) throw notFound();
    if (response.status === 429) throw new VehicleLookupError(429, "Vehicle lookup is unavailable right now. Please enter the details manually.");
    if (response.status !== 200) throw unavailable();
    return parseRapidCarCheck(await response.json(), plate);
  } catch (error) {
    if (error instanceof VehicleLookupError) throw error;
    // Fetch exceptions can contain the URL/API key; never expose or log them.
    throw unavailable();
  }
}
