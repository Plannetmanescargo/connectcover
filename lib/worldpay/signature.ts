import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWorldpaySignature(body: Buffer, header: string | null, keys: Record<string, string>): boolean {
  if (!header) return false;
  return header.split(",").some(entry => {
    const match = /^(\d+)\/SHA256\/(.+)$/.exec(entry.trim());
    if (!match || !Object.hasOwn(keys, match[1])) return false;
    const expected = createHmac("sha256", keys[match[1]]).update(body).digest();
    const signature = match[2];
    // Decode only canonical SHA-256 digests; splitting on every '/' breaks base64.
    const received = /^[a-fA-F0-9]{64}$/.test(signature)
      ? Buffer.from(signature, "hex")
      : /^[A-Za-z0-9+/]{43}=$/.test(signature) ? Buffer.from(signature, "base64") : null;
    return received !== null && received.length === expected.length && timingSafeEqual(received, expected);
  });
}
