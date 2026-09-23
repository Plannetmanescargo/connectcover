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


// VDG's r2 response fields match the previous integration and the public
// VehicleDetails example. Accept PascalCase and camelCase envelopes.
function get(value: unknown, key: string): unknown {
  const obj = record(value);
  return obj[key] ?? obj[key[0].toLowerCase() + key.slice(1)];
}

export function parseVehicleDataGlobal(payload: unknown, plate: string): VehicleSummary {
  const root = record(payload);
  const info = get(root, "ResponseInformation");
  const status = get(info, "StatusCode");
  if (status != null && status !== 0 && status !== "0") throw unavailable();
  const results = get(root, "Results");
  if (!results || typeof results !== "object" || Array.isArray(results)) throw unavailable();
  const vehicle = get(results, "VehicleDetails");
  const vehicleStatus = get(vehicle, "StatusCode");
  if (vehicleStatus != null && vehicleStatus !== 0 && vehicleStatus !== "0") throw unavailable();
  const identification = get(vehicle, "VehicleIdentification");
  const returnedPlate = get(identification, "Vrm");
  if (returnedPlate != null && normaliseRegistration(returnedPlate) !== plate) throw unavailable();
  const modelDetails = get(results, "ModelDetails");
  const modelStatus = get(modelDetails, "StatusCode");
  const usableModel = modelStatus == null || modelStatus === 0 || modelStatus === "0" ? modelDetails : undefined;
  const model = get(usableModel, "ModelIdentification");
  const year = Number(get(identification, "YearOfManufacture"));
  const summary: VehicleSummary = {
    make: field(get(identification, "DvlaMake")) ?? field(get(model, "Make")),
    model: field(get(identification, "DvlaModel")) ?? field(get(model, "Model")),
    year: Number.isInteger(year) && year >= 1886 && year <= new Date().getUTCFullYear() + 1 ? year : null,
    colour: field(get(get(get(vehicle, "VehicleHistory"), "ColourDetails"), "CurrentColour")),
    fuelType: field(get(identification, "DvlaFuelType")) ?? field(get(get(usableModel, "Powertrain"), "FuelType")),
  };
  if (!summary.make && !summary.model) throw notFound();
  return summary;
}

export async function fetchVehicleDataGlobal(
  plate: string,
  env: Record<string, string | undefined> = process.env,
  request: typeof fetch = fetch,
): Promise<VehicleSummary> {
  const key = env.VEHICLE_DATA_GLOBAL_API_KEY?.trim();
  const packageName = env.VEHICLE_DATA_GLOBAL_PACKAGE?.trim() || "VehicleDetails";
  if (!key) throw unavailable();
  let url: URL;
  try {
    url = new URL(env.VEHICLE_DATA_GLOBAL_ENDPOINT?.trim() || "https://uk.api.vehicledataglobal.com/r2/lookup");
  } catch { throw unavailable(); }
  // Credentials go only to the provider over verified HTTPS. Supply the base
  // endpoint, not an account URL containing parameters or a sandbox flag.
  if (url.protocol !== "https:" || url.hostname !== "uk.api.vehicledataglobal.com"
    || url.pathname !== "/r2/lookup"
    || url.port || url.username || url.password || url.search || url.hash) throw unavailable();
  url.searchParams.set("apiKey", key);
  url.searchParams.set("packageName", packageName);
  url.searchParams.set("vrm", plate);
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
    return parseVehicleDataGlobal(await response.json(), plate);
  } catch (error) {
    if (error instanceof VehicleLookupError) throw error;
    // Fetch exceptions can contain the URL/API key; never expose or log them.
    throw unavailable();
  }
}
