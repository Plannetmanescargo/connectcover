import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { createHmac } from 'node:crypto';
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
const { verifyWorldpaySignature } = load('lib/worldpay/signature.ts');
const { validateWorldpayCheckout } = load('lib/worldpay/checkout.ts');
const { assertWorldpayPayment } = load('lib/worldpay/events.ts');
const keys = { '3': 'test-signing-secret' };
const sign = (body, encoding = 'hex') => `3/SHA256/${createHmac('sha256', keys['3']).update(body).digest(encoding)}`;
const payload = () => ({
  quote: { vrm: 'AB12 CDE', startAt: '2026-11-01T12:00:00Z', endAt: '2026-11-01T13:00:00Z', durationMs: 3600000, totalAmountPence: 199 },
  customer: { fullName: 'Test Customer', dob: '1990-01-01', email: 'test@example.com', licenceType: 'Full UK', address: 'Test address' },
  pricing: { rateType: 'hourly', units: 1, timeZone: 'Europe/London' },
});
const event = () => ({ eventId: 'event-1', eventDetails: {
  classification: 'payment', type: 'sentForSettlement', transactionReference: 'wp_try_test',
  merchant: { entity: 'test-entity' }, paymentId: 'payment-1', amount: { value: 199, currencyCode: 'GBP' },
} });
function fixture() {
  const checkout = { ...validateWorldpayCheckout(payload()), id: 'checkout-1', brand: 'coverza', status: 'PENDING',
    currency: 'GBP', paymentProvider: 'WORLDPAY', worldpayEnvironment: 'try',
    worldpayEntity: 'test-entity', worldpayTransactionReference: 'wp_try_test', worldpayPaymentId: null,
    worldpayProcessingUntil: null, worldpayFulfilledAt: null };
  const calls = { finalize: 0, fulfill: 0, policies: new Set(), failFulfill: false };
  const matches = where => {
    if (where.status?.not === checkout.status) return false;
    if ('worldpayFulfilledAt' in where && checkout.worldpayFulfilledAt !== null) return false;
    if (where.OR && checkout.worldpayProcessingUntil && checkout.worldpayProcessingUntil > where.OR[1].worldpayProcessingUntil.lte) return false;
    if (where.worldpayProcessingUntil instanceof Date && checkout.worldpayProcessingUntil?.getTime() !== where.worldpayProcessingUntil.getTime()) return false;
    return true;
  };
  const mocks = {
    '@/db/prisma': { prisma: { paymentCheckout: {
      findUnique: async () => ({ ...checkout }),
      update: async ({ data }) => Object.assign(checkout, data),
      updateMany: async ({ where, data }) => { if (!matches(where)) return { count: 0 }; Object.assign(checkout, data); return { count: 1 }; },
    } } },
    '@/lib/policy/finalize': { finalizePolicy: async input => { calls.finalize++; calls.policies.add(input.paymentId); return { policyId: 'policy-1' }; } },
    '@/lib/policy/fulfill': { fulfillPolicy: async () => { calls.fulfill++; if (calls.failFulfill) throw new Error('PDF/email unavailable'); } },
  };
  return { checkout, calls, mocks, process: load('lib/worldpay/process-event.ts', mocks).processWorldpayEvent };
}

test('raw-body HMAC supports key selection and rejects forgery, missing/unknown key and tampering', () => {
  const raw = Buffer.from('{"name":"Café / example"}');
  for (const encoding of ['hex', 'base64']) assert.equal(verifyWorldpaySignature(raw, `99/SHA256/ignored, ${sign(raw, encoding)}`, keys), true);
  for (const header of [null, '', '3/SHA256/bad', sign(raw).replace('3/', '4/'), sign(raw).replace('SHA256', 'SHA1')]) assert.equal(verifyWorldpaySignature(raw, header, keys), false);
  assert.equal(verifyWorldpaySignature(Buffer.from(`${raw} `), sign(raw), keys), false);
});

test('checkout recalculates price and validates runtime types, dates and durations', () => {
  assert.equal(validateWorldpayCheckout(payload()).totalAmountPence, 199);
  const cheap = payload(); cheap.quote.totalAmountPence = 1; assert.throws(() => validateWorldpayCheckout(cheap));
  const long = payload(); long.quote.endAt = '2026-11-02T12:00:00Z'; long.quote.durationMs = 86400000; assert.throws(() => validateWorldpayCheckout(long));
  const naive = payload(); naive.quote.startAt = '2026-11-01T12:00:00'; assert.throws(() => validateWorldpayCheckout(naive));
  for (const value of [null, [], { quote: 1 }, { ...payload(), customer: { ...payload().customer, email: 3 } }]) assert.throws(() => validateWorldpayCheckout(value));
});

test('calendar months handle month-end clamping and UK daylight saving', () => {
  for (const [startAt, endAt] of [['2026-01-31T12:00:00Z', '2026-02-28T12:00:00Z'], ['2026-03-01T12:00:00Z', '2026-04-01T11:00:00Z']]) {
    const p = payload(); Object.assign(p.quote, { startAt, endAt, durationMs: Date.parse(endAt) - Date.parse(startAt), totalAmountPence: 29000 });
    p.pricing = { rateType: 'monthly', units: 1, timeZone: 'Europe/London' };
    assert.equal(validateWorldpayCheckout(p).totalAmountPence, 29000);
  }
});

test('mismatched amount, currency, entity, reference and payment ID fail closed', () => {
  const { checkout } = fixture();
  for (const patch of [{ amount: { value: 1, currencyCode: 'GBP' } }, { amount: { value: 199, currencyCode: 'USD' } }, { amount: undefined }, { merchant: { entity: 'other' } }, { transactionReference: 'other' }, { type: 'authorized' }]) {
    const e = event(); Object.assign(e.eventDetails, patch); assert.throws(() => assertWorldpayPayment(e, checkout));
  }
  assert.throws(() => assertWorldpayPayment(event(), { ...checkout, worldpayPaymentId: 'different' }));
});

test('only settlement events issue policies; duplicate events and late failure cannot downgrade paid checkout', async () => {
  const f = fixture(); const e = event(); e.eventDetails.type = 'authorized'; await f.process(e, 'try'); assert.equal(f.calls.finalize, 0);
  await f.process(event(), 'try'); await f.process(event(), 'try');
  e.eventDetails.type = 'settled'; await f.process(e, 'try');
  e.eventDetails.type = 'refused'; await f.process(e, 'try');
  assert.equal(f.checkout.status, 'PAID'); assert.equal(f.calls.finalize, 1); assert.equal(f.calls.fulfill, 1);
});

test('fulfilment failure remains retryable and reuses stable policy identity', async () => {
  const f = fixture(); f.calls.failFulfill = true;
  await assert.rejects(f.process(event(), 'try'));
  assert.equal(f.checkout.status, 'PAID'); assert.equal(f.checkout.worldpayProcessingUntil, null); assert.equal(f.checkout.worldpayFulfilledAt, null);
  f.calls.failFulfill = false; await f.process(event(), 'try');
  assert.equal(f.calls.policies.size, 1); assert.ok(f.checkout.worldpayFulfilledAt);
});

test('active lease blocks duplicate workers and expired lease can recover', async () => {
  const f = fixture(); f.checkout.worldpayProcessingUntil = new Date(Date.now() + 60000);
  await assert.rejects(f.process(event(), 'try')); assert.equal(f.calls.finalize, 0);
  f.checkout.worldpayProcessingUntil = new Date(Date.now() - 1); await f.process(event(), 'try'); assert.equal(f.calls.finalize, 1);
});

test('wrong environment is ignored, mismatched paid amounts never reach finalization', async () => {
  const f = fixture(); await f.process(event(), 'live'); assert.equal(f.calls.finalize, 0);
  const e = event(); e.eventDetails.amount.value = 1;
  await assert.rejects(f.process(e, 'try')); assert.equal(f.calls.finalize, 0);
});

test('webhook route rejects unsigned requests and returns retryable errors for downstream failures', async () => {
  process.env.WORLDPAY_ENVIRONMENT = 'try'; process.env.WORLDPAY_WEBHOOK_KEY_ID = '3'; process.env.WORLDPAY_WEBHOOK_SECRET = keys['3'];
  const f = fixture(); const { POST } = load('app/api/worldpay/webhook/route.ts', { ...f.mocks, 'next/server': { NextResponse: Response } });
  const body = JSON.stringify(event());
  const req = signature => new Request('https://example.com/api/worldpay/webhook', { method: 'POST', body, headers: signature ? { 'Event-Signature': signature } : {} });
  assert.equal((await POST(req(null))).status, 400); assert.equal(f.calls.finalize, 0);
  f.calls.failFulfill = true; assert.equal((await POST(req(sign(body)))).status, 500);
  f.calls.failFulfill = false; assert.equal((await POST(req(sign(body)))).status, 200);
});

test('checkout route sends Basic Auth, server price and all result URLs to HPP without touching legacy provider records', async () => {
  Object.assign(process.env, { WORLDPAY_ENVIRONMENT: 'try', WORLDPAY_API_USERNAME: 'test-api-user', WORLDPAY_API_PASSWORD: 'test-api-password',
    WORLDPAY_ENTITY: 'test-entity', WORLDPAY_NARRATIVE: 'Test Merchant', NEXT_PUBLIC_BASE_URL: 'https://example.com',
    WORLDPAY_WEBHOOK_KEY_ID: '3', WORLDPAY_WEBHOOK_SECRET: keys['3'] });
  let saved; let sent;
  const { POST } = load('app/api/worldpay/checkout/route.ts', {
    'next/server': { NextResponse: Response },
    '@/db/prisma': { prisma: { paymentCheckout: { create: async ({ data }) => { saved = data; return { id: 'checkout-1', ...data }; }, updateMany: async () => ({ count: 1 }) } } },
  });
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => { sent = { url, ...options }; return Response.json({ url: 'https://payments.worldpay.com/test' }); };
  try {
    const response = await POST(new Request('https://example.com/api/worldpay/checkout', { method: 'POST', body: JSON.stringify(payload()), headers: { origin: 'https://attacker.example' } }));
    assert.equal(response.status, 200); assert.equal((await response.json()).provider, 'worldpay');
    assert.equal(saved.paymentProvider, 'WORLDPAY'); assert.equal(saved.totalAmountPence, 199);
    assert.match(saved.worldpayTransactionReference, /^wp_try_/); assert.equal(sent.url, 'https://try.access.worldpay.com/payment_pages');
    assert.equal(sent.headers.Authorization, `Basic ${Buffer.from('test-api-user:test-api-password').toString('base64')}`);
    const request = JSON.parse(sent.body); assert.equal(request.value.amount, 199); assert.equal(request.settlement.auto, true);
    assert.equal(request.transactionReference, saved.worldpayTransactionReference);
    for (const url of Object.values(request.resultURLs)) assert.equal(new URL(url).origin, 'https://example.com');
  } finally { globalThis.fetch = realFetch; }
});
