// lib/policy/policyNumber.ts
export function generatePolicyNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = () => chars[Math.floor(Math.random() * chars.length)];
  const year = new Date().getFullYear().toString().slice(-2);

  let mid = "";
  for (let i = 0; i < 8; i++) mid += pick();

  return `CVZ-${year}-${mid.slice(0, 4)}${mid.slice(4)}`;
}
