import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, '..');
function load(path, mocks = {}, cache = new Map()) {
  const file = resolve(root, path);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = spec => {
    if (spec in mocks) return mocks[spec];
    if (spec.startsWith('@/')) return load(`${spec.slice(2)}.ts`, mocks, cache);
    if (spec.startsWith('.')) return load(resolve(dirname(file), `${spec}.ts`), mocks, cache);
    return require(spec);
  };
  new Function('require', 'module', 'exports', code)(localRequire, mod, mod.exports);
  return mod.exports;
}
const { getMollieConfig } = load('lib/mollie/config.ts');
const { assertMolliePayment, amountPence, checkoutUrl } = load('lib/mollie/payment.ts');
const { validateCheckout } = load('lib/payments/checkout.ts');
const config = getMollieConfig({ MOLLIE_API_KEY: 'test_FAKE_KEY_FOR_TESTS', MOLLIE_ENVIRONMENT: 'test', NEXT_PUBLIC_BASE_URL: 'https://example.com' });
const payload = () => ({
  quote: { vrm: 'AB12 CDE', startAt: '2026-11-01T12:00:00Z', endAt: '2026-11-01T13:00:00Z', durationMs: 3600000, totalAmountPence: 199 },
  customer: { fullName: 'Test Customer', dob: '1990-01-01', email: 'test@example.com', licenceType: 'Full UK', address: 'Test address' },
  pricing: { rateType: 'hourly', units: 1, timeZone: 'Europe/London' },
});
function fixture({ created = true } = {}) {
  const row = { ...validateCheckout(payload()), id: 'checkout_test_123', brand: 'coverza', status: 'PENDING', paymentProvider: 'MOLLIE', currency: 'GBP',
    molliePaymentId: created ? 'tr_test12345' : null, mollieProfileId: created ? 'pfl_test123' : null,
    mollieConfigHash: config.fingerprint, mollieMode: 'test', mollieProcessingUntil: null,
    mollieFulfilledAt: null, mollieNextAttemptAt: new Date(0), createdAt: new Date(), mollieReviewReason: null };
  const payment = { id: 'tr_test12345', status: 'paid', mode: 'test', profileId: 'pfl_test123', amount: { value: '1.99', currency: 'GBP' },
    metadata: { checkoutId: row.id, brand: 'coverza' }, links: { checkout: { href: 'https://www.mollie.com/checkout/test12345' } } };
  const calls = { create: [], get: 0, finalize: 0, fulfill: 0, failFulfill: false, finalInputs: [], policies: new Set() };
  const matches = where => {
    if (where.mollieMode && row.mollieMode !== where.mollieMode) return false;
    if (where.mollieNextAttemptAt && (!row.mollieNextAttemptAt || row.mollieNextAttemptAt > where.mollieNextAttemptAt.lte)) return false;
    if (where.OR && row.mollieProcessingUntil && row.mollieProcessingUntil > new Date()) return false;
    if (where.mollieProcessingUntil instanceof Date && row.mollieProcessingUntil?.getTime() !== where.mollieProcessingUntil.getTime()) return false;
    if (where.status?.not === row.status) return false;
    return true;
  };
  const db = { paymentCheckout: {
    findUniqueOrThrow: async () => ({ ...row }),
    findUnique: async () => ({ ...row }),
    update: async ({ data }) => ({ ...Object.assign(row, data) }),
    updateMany: async ({ where, data }) => { if (!matches(where)) return { count: 0 }; Object.assign(row, data); return { count: 1 }; },
  } };
  const mocks = {
    '@/db/prisma': { prisma: db },
    './config': { getMollieConfig: () => config },
    '@/lib/mollie/config': { getMollieConfig: () => config },
    './client': { mollieClient: () => ({ payments: {
      create: async request => { calls.create.push(request); return structuredClone(payment); },
      get: async () => { calls.get++; return structuredClone(payment); },
    } }) },
    '@/lib/policy/finalize': { finalizePolicy: async input => { calls.finalize++; calls.finalInputs.push(input); calls.policies.add(input.paymentId); return { policyId: 'policy_1' }; } },
    '@/lib/policy/fulfill': { fulfillPolicy: async (_, options) => { assert.equal(options.durableEmail, true); calls.fulfill++; if (calls.failFulfill) throw new Error('Supabase/Resend failure'); } },
  };
  return { row, payment, calls, db, mocks, ...load('lib/mollie/process.ts', mocks) };
}

test('configuration rejects mismatched key modes and unsafe callback origins', () => {
  for (const env of [{}, { MOLLIE_API_KEY: 'live_FAKE_KEY', MOLLIE_ENVIRONMENT: 'test', NEXT_PUBLIC_BASE_URL: 'https://example.com' },
    { MOLLIE_API_KEY: 'test_FAKE_KEY', NEXT_PUBLIC_BASE_URL: 'http://example.com' },
    { MOLLIE_API_KEY: 'test_FAKE_KEY', NEXT_PUBLIC_BASE_URL: 'https://localhost' },
    { MOLLIE_API_KEY: 'test_FAKE_KEY', NEXT_PUBLIC_BASE_URL: 'https://example.com/path' }]) assert.throws(() => getMollieConfig(env));
  assert.equal(config.mode, 'test'); assert.equal(config.origin, 'https://example.com');
});

test('amount parsing is exact and mismatches cannot fulfil another checkout', () => {
  const { row, payment } = fixture();
  assert.equal(amountPence('149.99'), 14999);
  for (const value of ['1e2', '1.999', '-1.00', 'NaN', '9007199254740999.00']) assert.throws(() => amountPence(value));
  for (const patch of [{ amount: { value: '0.01', currency: 'GBP' } }, { amount: { value: '1.99', currency: 'EUR' } },
    { id: 'tr_other123' }, { mode: 'live' }, { profileId: 'pfl_other' }, { metadata: { checkoutId: 'other', brand: 'coverza' } }, { metadata: null }]) {
    assert.throws(() => assertMolliePayment({ ...payment, ...patch }, row));
  }
  for (const href of ['http://www.mollie.com/x','https://mollie.com.evil.test/x','https://evil.test/x']) {
    assert.throws(() => checkoutUrl({ ...payment, links: { checkout: { href } } }));
  }
});

test('creation uses the official SDK request fields, a stable key and the configured webhook', async () => {
  const f = fixture({ created: false });
  await f.ensureMolliePayment(f.row);
  const request = f.calls.create[0];
  assert.equal(request.idempotencyKey, `coverza-mollie-${f.row.id}`);
  assert.deepEqual(request.paymentRequest.amount, { currency: 'GBP', value: '1.99' });
  assert.equal(request.paymentRequest.webhookUrl, 'https://example.com/api/mollie/webhook');
  assert.equal(request.paymentRequest.method, 'creditcard');
  assert.equal(request.paymentRequest.testmode, undefined); assert.equal(request.paymentRequest.profileId, undefined);
  assert.equal(f.row.molliePaymentId, f.payment.id);
  await f.ensureMolliePayment(f.row); assert.equal(f.calls.create.length, 1);
});

test('ambiguous creation retries reuse one key, but stop before one-hour retention or key rotation', async () => {
  const f = fixture({ created: false }); const original = { ...f.row };
  await f.ensureMolliePayment(original); await f.ensureMolliePayment(original);
  assert.equal(f.calls.create[0].idempotencyKey, f.calls.create[1].idempotencyKey);
  for (const patch of [{ createdAt: new Date(Date.now() - 51 * 60_000) }, { mollieConfigHash: 'rotated' }]) {
    const g = fixture({ created: false }); Object.assign(g.row, patch);
    await assert.rejects(g.ensureMolliePayment(g.row));
    assert.equal(g.calls.create.length, 0); assert.ok(g.row.mollieReviewReason); assert.equal(g.row.mollieNextAttemptAt, null);
  }
});

test('only paid payments fulfil; authorization, pending, failure and refunds do not', async () => {
  for (const status of ['open', 'pending', 'authorized', 'failed', 'canceled', 'expired']) {
    const f = fixture(); f.payment.status = status;
    await f.reconcileMollieCheckout(f.row.id);
    assert.equal(f.calls.finalize, 0); assert.equal(f.calls.fulfill, 0);
    if (['failed','canceled'].includes(status)) assert.equal(f.row.status, 'FAILED');
    if (status === 'expired') assert.equal(f.row.status, 'EXPIRED');
  }
  for (const field of ['amountRefunded','amountChargedBack']) {
    const f = fixture(); f.payment[field] = { value: '0.50' };
    await f.reconcileMollieCheckout(f.row.id);
    assert.equal(f.calls.finalize, 0); assert.ok(f.row.mollieReviewReason);
  }
});

test('concurrent and duplicate notifications fulfil once, paid status cannot be downgraded', async () => {
  const f = fixture();
  await Promise.all([f.reconcileMollieCheckout(f.row.id), f.reconcileMollieCheckout(f.row.id)]);
  assert.equal(f.calls.finalize, 1); assert.equal(f.calls.fulfill, 1); assert.equal(f.row.status, 'PAID');
  assert.ok(f.row.mollieFulfilledAt); assert.equal(f.row.mollieProcessingUntil, null);
  assert.equal(f.calls.finalInputs[0].paymentProvider, 'MOLLIE');
  f.row.mollieNextAttemptAt = new Date(0);
  await f.reconcileMollieCheckout(f.row.id); assert.equal(f.calls.fulfill, 1);
  f.payment.status = 'failed'; f.row.mollieNextAttemptAt = new Date(0);
  await f.reconcileMollieCheckout(f.row.id); assert.equal(f.row.status, 'PAID');
});

test('fulfilment failure leaves durable retry work and reuses the same payment identity', async () => {
  const f = fixture(); f.calls.failFulfill = true;
  await assert.rejects(f.reconcileMollieCheckout(f.row.id));
  assert.equal(f.row.status, 'PAID'); assert.equal(f.row.mollieFulfilledAt, null);
  assert.equal(f.row.mollieProcessingUntil, null); assert.ok(f.row.mollieNextAttemptAt);
  f.calls.failFulfill = false; f.row.mollieNextAttemptAt = new Date(0);
  await f.reconcileMollieCheckout(f.row.id);
  assert.equal(f.calls.policies.size, 1); assert.ok(f.row.mollieFulfilledAt);
});

test('payment mismatch and environment isolation prevent fulfilment', async () => {
  const f = fixture(); f.payment.amount.value = '0.01';
  await assert.rejects(f.reconcileMollieCheckout(f.row.id)); assert.equal(f.calls.fulfill, 0);
  const other = fixture(); other.row.mollieMode = 'live';
  await other.reconcileMollieCheckout(other.row.id); assert.equal(other.calls.get, 0);
});

test('classic webhook persists work before acknowledgement and ignores posted status', async () => {
  const f = fixture(); const scheduled = [];
  let reconciles = 0;
  const { POST } = load('app/api/mollie/webhook/route.ts', { ...f.mocks,
    'next/server': { NextResponse: require('next/server').NextResponse, after: task => scheduled.push(task) },
    '@/lib/mollie/process': { reconcileMollieCheckout: async () => { reconciles++; } },
  });
  const req = body => new Request('https://example.com/api/mollie/webhook', { method: 'POST', headers: { 'content-type':'application/x-www-form-urlencoded' }, body });
  assert.equal((await POST(req('id=tr_test12345&status=paid'))).status, 200);
  assert.equal(f.row.status, 'PENDING'); assert.ok(f.row.mollieNextAttemptAt); assert.equal(reconciles, 0);
  await scheduled[0](); assert.equal(reconciles, 1);
  assert.equal((await POST(req('id=invalid'))).status, 400);
  assert.equal((await POST(new Request('https://example.com', { method: 'POST', headers: { 'content-type':'application/json' }, body: '{}' }))).status, 415);
  f.db.paymentCheckout.findUnique = async () => null;
  assert.equal((await POST(req('id=tr_unknown123'))).status, 200);
  f.db.paymentCheckout.findUnique = async () => ({ id: f.row.id });
  f.db.paymentCheckout.update = async () => { throw new Error('DB unavailable'); };
  assert.equal((await POST(req('id=tr_test12345'))).status, 503);
});

test('checkout validates server price, origin and attempt key, and reuses persisted attempts', async () => {
  const f = fixture(); const rows = new Map(); let creations = 0;
  f.db.paymentCheckout.upsert = async ({ where, create }) => {
    if (!rows.has(where.mollieRequestKey)) { creations++; rows.set(where.mollieRequestKey, { ...f.row, ...create }); }
    return rows.get(where.mollieRequestKey);
  };
  const { POST } = load('app/api/mollie/checkout/route.ts', { ...f.mocks,
    '@/lib/mollie/process': { ensureMolliePayment: async row => ({ ...row, mollieCheckoutUrl: 'https://www.mollie.com/checkout/test' }) },
  });
  const previous = process.env.MOLLIE_ENABLED; process.env.MOLLIE_ENABLED = 'true';
  try {
    const key = randomUUID();
    const req = (body = payload(), origin = 'https://example.com', id = key) => new Request('https://example.com/api/mollie/checkout', { method:'POST', headers: { origin, 'content-type':'application/json','idempotency-key':id }, body:JSON.stringify(body) });
    assert.equal((await POST(req())).status, 200); assert.equal((await POST(req())).status, 200); assert.equal(creations, 1);
    const changed = payload(); changed.customer.email = 'changed@example.com';
    assert.equal((await POST(req(changed))).status, 409);
    const cheap = payload(); cheap.quote.totalAmountPence = 1;
    assert.equal((await POST(req(cheap))).status, 400);
    assert.equal((await POST(req(payload(), 'https://evil.test'))).status, 403);
    assert.equal((await POST(req(payload(), 'https://example.com', 'invalid'))).status, 400);
  } finally { if (previous === undefined) delete process.env.MOLLIE_ENABLED; else process.env.MOLLIE_ENABLED = previous; }
});
test('SEPT10 server pricing reaches Mollie payment and finalization', async () => {
 const body = payload(); body.pricing.promoCode = 'SEPT10'; body.quote.totalAmountPence = 179;
 const f = fixture({ created: false }); Object.assign(f.row, validateCheckout(body)); f.payment.amount.value = '1.79';
 await f.ensureMolliePayment(f.row);
 assert.equal(f.calls.create[0].paymentRequest.amount.value, '1.79');
 await f.reconcileMollieCheckout(f.row.id, true);
 assert.equal(f.calls.finalInputs[0].totalAmountPence, 179); assert.ok(f.row.mollieFulfilledAt);
});
