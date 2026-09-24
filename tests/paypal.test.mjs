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
const { getPayPalConfig } = load('lib/paypal/config.ts');
const { assertPayPalOrder, assertGoogleAuthentication, assertCardAuthentication } = load('lib/paypal/payment.ts');
const { validateCheckout } = load('lib/payments/checkout.ts');
const config = getPayPalConfig({ PAYPAL_CLIENT_ID: 'test_client', PAYPAL_CLIENT_SECRET: 'test_secret', PAYPAL_MERCHANT_ID: 'MERCHANT12345', PAYPAL_WEBHOOK_ID: 'webhook_test', NEXT_PUBLIC_BASE_URL: 'https://example.com' });
const payload = () => ({ quote: { vrm: 'AB12 CDE', startAt: '2026-11-01T12:00:00Z', endAt: '2026-11-01T13:00:00Z', durationMs: 3600000, totalAmountPence: 199 },
 customer: { fullName: 'Test Customer', dob: '1990-01-01', email: 'test@example.com', licenceType: 'Full UK', address: 'Test address' },
 pricing: { rateType: 'hourly', units: 1, timeZone: 'Europe/London' } });
function fixture({ created = true, status = 'COMPLETED' } = {}) {
 const row = { ...validateCheckout(payload()), id: 'checkout_test_123', brand: 'coverza', status: 'PENDING', paymentProvider: 'PAYPAL', currency: 'GBP',
   paypalOrderId: created ? 'ORDER123456789' : null, paypalCaptureId: null, paypalMerchantId: config.merchantId, paypalMode: config.mode, paypalConfigHash: config.fingerprint,
   paypalCaptureStartedAt: null, paypalProcessingUntil: null, paypalFulfilledAt: null, paypalNextAttemptAt: new Date(0), paypalReviewReason: null, createdAt: new Date() };
 const capture = { id: 'CAPTURE123456789', status: 'COMPLETED', final_capture: true, amount: { currency_code: 'GBP', value: '1.99' } };
 const order = { id: 'ORDER123456789', intent: 'CAPTURE', status, purchase_units: [{ reference_id: row.id, custom_id: `coverza:${row.id}`, payee: { merchant_id: config.merchantId },
   amount: { currency_code: 'GBP', value: '1.99' }, payments: { captures: status === 'COMPLETED' ? [capture] : [] } }] };
 const calls = { create: [], capture: [], reads: 0, finalize: [], fulfill: 0, failFulfill: false, loseCaptureResponse: false, verified: true, policies: new Set() };
 const matches = where => {
   for (const field of ['paypalMode','paypalConfigHash','paypalReviewReason']) if (field in where && row[field] !== where[field]) return false;
   if (where.paypalNextAttemptAt && (!row.paypalNextAttemptAt || row.paypalNextAttemptAt > where.paypalNextAttemptAt.lte)) return false;
   if (where.OR && row.paypalProcessingUntil && row.paypalProcessingUntil > new Date()) return false;
   if (where.paypalProcessingUntil instanceof Date && row.paypalProcessingUntil?.getTime() !== where.paypalProcessingUntil.getTime()) return false;
   if (where.status?.not === row.status) return false;
   return true;
 };
 const db = { paymentCheckout: {
   findUnique: async () => ({ ...row }), findUniqueOrThrow: async () => ({ ...row }), findMany: async () => [{ ...row }],
   update: async ({ data }) => ({ ...Object.assign(row, data) }),
   updateMany: async ({ where, data }) => { if (!matches(where)) return { count: 0 }; Object.assign(row, data); return { count: 1 }; },
 } };
 const mocks = { '@/db/prisma': { prisma: db }, './config': { getPayPalConfig: () => config }, '@/lib/paypal/config': { getPayPalConfig: () => config },
   './client': { PayPalError: class extends Error {}, paypalRequest: async (path, body, key) => {
     if (path.endsWith('/capture')) { calls.capture.push({ path, body, key }); order.status = 'COMPLETED'; order.purchase_units[0].payments.captures = [capture]; if (calls.loseCaptureResponse) throw new Error('Lost response'); }
     else if (body) calls.create.push({ path, body, key }); else calls.reads++;
     if (path.includes("?fields=payment_source")) return structuredClone({ id: order.id, payment_source: order.payment_source });
     return structuredClone(order);
   } },
   '@/lib/paypal/webhook': { verifyPayPalWebhook: async () => calls.verified },
   '@/lib/policy/finalize': { finalizePolicy: async input => { calls.finalize.push(input); calls.policies.add(input.paymentId); return { policyId: 'policy_1' }; } },
   '@/lib/policy/fulfill': { fulfillPolicy: async (_, options) => { assert.equal(options.durableEmail, true); calls.fulfill++; if (calls.failFulfill) throw new Error('Delivery failed'); } },
 };
 return { row, order, capture, calls, mocks, db, ...load('lib/paypal/process.ts', mocks) };
}
test('PayPal requires complete credentials and a safe HTTPS origin', () => {
 assert.equal(config.mode, 'sandbox'); assert.equal(config.api, 'https://api-m.sandbox.paypal.com');
 const env = { PAYPAL_CLIENT_ID: 'client', PAYPAL_CLIENT_SECRET: 'secret', PAYPAL_MERCHANT_ID: 'merchant', PAYPAL_WEBHOOK_ID: 'hook', NEXT_PUBLIC_BASE_URL: 'https://example.com' };
 for (const patch of [{ PAYPAL_CLIENT_SECRET: '' }, { PAYPAL_WEBHOOK_ID: '' }, { PAYPAL_ENVIRONMENT: 'production' }, { NEXT_PUBLIC_BASE_URL: 'http://example.com' }, { NEXT_PUBLIC_BASE_URL: 'https://example.com/path' }]) assert.throws(() => getPayPalConfig({ ...env, ...patch }));
 assert.equal(getPayPalConfig({ ...env, PAYPAL_ENVIRONMENT: 'live' }).api, 'https://api-m.paypal.com');
});
test('binding rejects wrong order, merchant, amount, currency, custom ID and split captures', () => {
 const f = fixture(); assert.equal(assertPayPalOrder(f.order, f.row).id, f.capture.id);
 const patches = [o => o.id = 'OTHER123456789', o => o.intent = 'AUTHORIZE', o => o.purchase_units[0].payee.merchant_id = 'OTHER',
   o => o.purchase_units[0].amount.value = '0.01', o => o.purchase_units[0].amount.currency_code = 'EUR', o => o.purchase_units[0].custom_id = 'other',
   o => o.purchase_units[0].payments.captures[0].amount.value = '0.01', o => o.purchase_units.push(o.purchase_units[0]), o => o.purchase_units[0].payments.captures.push(f.capture)];
 for (const patch of patches) { const order = structuredClone(f.order); patch(order); assert.throws(() => assertPayPalOrder(order, f.row)); }
 f.row.paypalCaptureId = 'OTHER123456789'; assert.throws(() => assertPayPalOrder(f.order, f.row));
});
test('creation uses stable idempotency and refuses recreation after retention or account changes', async () => {
 const f = fixture({ created: false, status: 'CREATED' }); const original = { ...f.row };
 await f.ensurePayPalOrder(original); await f.ensurePayPalOrder(original);
 assert.equal(f.calls.create[0].key, f.calls.create[1].key); assert.equal(f.calls.create[0].body.intent, 'CAPTURE');
 assert.equal(f.calls.create[0].body.purchase_units[0].amount.value, '1.99');
 await f.ensurePayPalOrder(f.row); assert.equal(f.calls.create.length, 2);
 for (const patch of [{ createdAt: new Date(Date.now() - 6 * 3600_000) }, { paypalConfigHash: 'changed' }]) {
   const g = fixture({ created: false }); Object.assign(g.row, patch); await assert.rejects(g.ensurePayPalOrder(g.row)); assert.equal(g.calls.create.length, 0);
 }
});
test('only completed capture fulfils, pending/declined/refunded payments do not', async () => {
 for (const status of ['CREATED','PAYER_ACTION_REQUIRED','VOIDED']) { const f = fixture({ status }); await f.reconcilePayPalCheckout(f.row.id); assert.equal(f.calls.fulfill, 0); }
 for (const status of ['PENDING','DECLINED','REFUNDED','PARTIALLY_REFUNDED']) {
   const f = fixture(); f.capture.status = status; await f.reconcilePayPalCheckout(f.row.id); assert.equal(f.calls.fulfill, 0);
   if (status.includes('REFUNDED')) assert.ok(f.row.paypalReviewReason);
 }
});
test('approval captures once and duplicate/concurrent delivery fulfils once', async () => {
 const f = fixture({ status: 'APPROVED' });
 await Promise.all([f.reconcilePayPalCheckout(f.row.id), f.reconcilePayPalCheckout(f.row.id)]);
 assert.equal(f.calls.capture.length, 1); assert.equal(f.calls.fulfill, 1); assert.equal(f.row.status, 'PAID');
 assert.equal(f.calls.finalize[0].paymentProvider, 'PAYPAL'); assert.equal(f.calls.finalize[0].paymentId, f.capture.id);
 f.row.paypalNextAttemptAt = new Date(0); await f.reconcilePayPalCheckout(f.row.id); assert.equal(f.calls.fulfill, 1);
});
test('a lost capture response recovers without charging twice', async () => {
 const f = fixture({ status: 'APPROVED' }); f.calls.loseCaptureResponse = true;
 await assert.rejects(f.reconcilePayPalCheckout(f.row.id)); assert.ok(f.row.paypalCaptureStartedAt); assert.ok(f.row.paypalNextAttemptAt);
 f.row.paypalNextAttemptAt = new Date(0); await f.reconcilePayPalCheckout(f.row.id);
 assert.equal(f.calls.capture.length, 1); assert.equal(f.calls.fulfill, 1); assert.equal(f.row.status, 'PAID');
});
test('fulfilment failures remain retryable with the same capture/policy identity', async () => {
 const f = fixture(); f.calls.failFulfill = true;
 await assert.rejects(f.reconcilePayPalCheckout(f.row.id)); assert.equal(f.row.status, 'PAID'); assert.equal(f.row.paypalFulfilledAt, null);
 assert.equal(f.row.paypalProcessingUntil, null); assert.ok(f.row.paypalNextAttemptAt);
 f.calls.failFulfill = false; f.row.paypalNextAttemptAt = new Date(0); await f.reconcilePayPalCheckout(f.row.id);
 assert.equal(f.calls.policies.size, 1); assert.ok(f.row.paypalFulfilledAt);
});
test('review, account/mode mismatch, failed SCA and expired capture retry prevent charging', async () => {
 for (const patch of [{ paypalMode: 'live' }, { paypalConfigHash: 'other' }, { paypalReviewReason: 'dispute' }]) {
   const f = fixture({ status: 'APPROVED' }); Object.assign(f.row, patch); await f.reconcilePayPalCheckout(f.row.id, true); assert.equal(f.calls.capture.length, 0);
 }
 const f = fixture({ status: 'APPROVED' }); f.row.paypalCaptureStartedAt = new Date(Date.now() - 6 * 3600_000);
 await f.reconcilePayPalCheckout(f.row.id); assert.equal(f.calls.capture.length, 0); assert.ok(f.row.paypalReviewReason);
 assert.throws(() => assertGoogleAuthentication({ payment_source: { google_pay: { card: { authentication_result: { liability_shift: 'NO' } } } } }));
});
test('signature verification uses configured webhook identity and fails closed', async () => {
 let received; const { verifyPayPalWebhook } = load('lib/paypal/webhook.ts', { './config': { getPayPalConfig: () => config },
 './client': { paypalRequest: async (path, body) => { received = { path, body }; return { verification_status: 'SUCCESS' }; } } });
 assert.equal(await verifyPayPalWebhook(new Headers(), {}), false);
 const headers = new Headers(Object.fromEntries(['auth-algo','cert-url','transmission-id','transmission-sig','transmission-time'].map(k => [`paypal-${k}`, `test-${k}`])));
 assert.equal(await verifyPayPalWebhook(headers, { id: 'event' }), true); assert.equal(received.body.webhook_id, config.webhookId);
 assert.equal(received.path, '/v1/notifications/verify-webhook-signature');
});
test('webhook rejects bad signatures, persists work before ack and permanently flags reversals', async () => {
 const f = fixture(); const tasks = [];
 const { POST } = load('app/api/paypal/webhook/route.ts', { ...f.mocks, 'next/server': { NextResponse: require('next/server').NextResponse, after: task => tasks.push(task) }, '@/lib/paypal/process': { reconcilePayPalCheckout: async () => {} } });
 const req = (type = 'CHECKOUT.ORDER.APPROVED') => new Request('https://example.com/api/paypal/webhook', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: 'EVENT', event_type: type, resource: { id: f.order.id, supplementary_data: { related_ids: { order_id: f.order.id } } } }) });
 f.calls.verified = false; assert.equal((await POST(req())).status, 401); assert.equal(tasks.length, 0);
 f.calls.verified = true; assert.equal((await POST(req())).status, 200); assert.ok(f.row.paypalNextAttemptAt); assert.equal(tasks.length, 1);
 assert.equal((await POST(req('PAYMENT.CAPTURE.REVERSED'))).status, 200); assert.ok(f.row.paypalReviewReason); assert.equal(f.row.paypalNextAttemptAt, null);
 await POST(req()); assert.ok(f.row.paypalReviewReason);
 f.db.paymentCheckout.update = async () => { throw new Error('DB down'); }; assert.equal((await POST(req())).status, 503);
});
test('checkout validates price/origin/key and processor switch blocks new PayPal checkouts', async () => {
 const f = fixture(); const rows = new Map();
 f.db.paymentCheckout.upsert = async ({ where, create }) => { if (!rows.has(where.paypalRequestKey)) rows.set(where.paypalRequestKey, { ...f.row, ...create }); return rows.get(where.paypalRequestKey); };
 const { POST } = load('app/api/paypal/checkout/route.ts', { ...f.mocks, '@/lib/paypal/process': { ensurePayPalOrder: async row => row } });
 const previous = { provider: process.env.PAYMENT_PROVIDER, enabled: process.env.PAYPAL_ENABLED };
 process.env.PAYMENT_PROVIDER = 'paypal'; process.env.PAYPAL_ENABLED = 'true';
 const key = randomUUID(); const req = (data = payload(), origin = 'https://example.com', attempt = key) => new Request('https://example.com/api/paypal/checkout', { method: 'POST', headers: { origin, 'content-type': 'application/json', 'idempotency-key': attempt }, body: JSON.stringify(data) });
 try {
   assert.equal((await POST(req())).status, 200); assert.equal((await POST(req())).status, 200); assert.equal(rows.size, 1);
   const changed = payload(); changed.customer.email = 'changed@example.com'; assert.equal((await POST(req(changed))).status, 409);
   const cheap = payload(); cheap.quote.totalAmountPence = 1; assert.equal((await POST(req(cheap))).status, 400);
   assert.equal((await POST(req(payload(), 'https://evil.test'))).status, 403); assert.equal((await POST(req(payload(), 'https://example.com', 'bad'))).status, 400);
   process.env.PAYMENT_PROVIDER = 'mollie'; assert.equal((await POST(req())).status, 503);
 } finally {
   for (const [key, value] of [['PAYMENT_PROVIDER',previous.provider],['PAYPAL_ENABLED',previous.enabled]]) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
 }
});
test('refund link lookup accepts only a PayPal capture on the configured API origin', () => {
 const { captureIdFromLinks } = load('lib/paypal/payment.ts');
 const links = href => [{ rel: 'up', href }];
 assert.equal(captureIdFromLinks(links(`${config.api}/v2/payments/captures/CAPTURE123456789`), config.api), 'CAPTURE123456789');
 for (const href of ['https://evil.test/v2/payments/captures/CAPTURE123456789', `${config.api}/v2/checkout/orders/ORDER123456789`, 'not-a-url']) assert.equal(captureIdFromLinks(links(href), config.api), undefined);
});


test('successful capture uses its verified response without an extra PayPal lookup', async () => {
 const f = fixture({ status: 'APPROVED' });
 await f.reconcilePayPalCheckout(f.row.id, true);
 assert.equal(f.calls.reads, 2);
 assert.equal(f.calls.capture.length, 1);
 assert.equal(f.calls.fulfill, 1);
});

test('Card Fields rejects failed/incomplete SCA and accepts documented exemptions', () => {
 const order = (shift, enrollment, status) => ({ payment_source: { card: { authentication_result: {
   liability_shift: shift, three_d_secure: { enrollment_status: enrollment, authentication_status: status }
 } } } });
 for (const status of ['N', 'R', 'U', 'C', 'D']) assert.throws(() => assertCardAuthentication(order('NO', 'Y', status)));
 assert.throws(() => assertCardAuthentication(order('UNKNOWN', 'U', undefined)));
 assert.throws(() => assertCardAuthentication(order('NO', 'Y', undefined)));
 for (const status of ['Y', 'A']) assert.doesNotThrow(() => assertCardAuthentication(order('POSSIBLE', 'Y', status)));
 for (const enrollment of ['N', 'U', 'B']) assert.doesNotThrow(() => assertCardAuthentication(order('NO', enrollment, undefined)));
 assert.doesNotThrow(() => assertCardAuthentication({}));
});

test('capture acknowledges only after persisting recovery, then processes in after()', async () => {
 const f = fixture({ status: 'APPROVED' });
 const jobs = [];
 const { POST } = load('app/api/paypal/capture/route.ts', { ...f.mocks,
   'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) }, after: job => jobs.push(job) },
   '@/lib/paypal/process': { reconcilePayPalCheckout: f.reconcilePayPalCheckout },
 });
 const request = () => new Request('https://example.com/api/paypal/capture', { method: 'POST', headers: { origin: 'https://example.com' }, body: JSON.stringify({ checkoutId: f.row.id }) });
 const response = await POST(request());
 assert.equal(response.status, 200);
 assert.equal(f.calls.capture.length, 0);
 assert.equal(jobs.length, 1);
 assert.ok(f.row.paypalNextAttemptAt <= new Date());
 await jobs[0]();
 assert.equal(f.calls.capture.length, 1);
 assert.equal(f.row.status, 'PAID');
});

test('delivery readiness follows email acceptance and precedes newsletter work', async () => {
 const events = []; let failEmail = false;
 const prisma = {
  policy: { findUnique: async () => ({ id: 'policy_test', status: 'ACTIVE', paymentProvider: 'PAYPAL', email: 'test@example.com', policyNumber: 'TEST', startAt: new Date(), endAt: new Date(), documents: [{kind:'PROPOSAL',url:'https://example.com/p.pdf'},{kind:'CERTIFICATE',url:'https://example.com/c.pdf'}] }) },
  policyEvent: { create: async ({data}) => { events.push(data.type); return {}; }, updateMany: async()=>({count:1}), deleteMany:async()=>({count:1}) }
 };
 const { fulfillPolicy } = load('lib/policy/fulfill.ts', {
  '@/db/prisma': { prisma }, '@/lib/supabase/admin': {},
  '@/lib/email/sendPolicyEmail': { sendPolicyEmail: async()=>{ events.push('email'); if(failEmail) throw Error('not accepted'); return {id:'email_test'}; } }
 });
 const opts = {durableEmail:true,onDeliveryReady:async()=>{events.push('ready')}};
 await fulfillPolicy('policy_test',opts);
 assert.ok(events.indexOf('email') < events.indexOf('ready'));
 assert.ok(events.indexOf('ready') < events.indexOf('NEWSLETTER_CONTACT_ADDED'));
 events.length=0; failEmail=true;
 await assert.rejects(()=>fulfillPolicy('policy_test',opts));
 assert.ok(!events.includes('ready'));
});

test('filtered authentication response cannot replace the complete approved order', async () => {
 const f = fixture({ status: 'APPROVED' });
 f.order.payment_source = { card: { authentication_result: {
   liability_shift: 'POSSIBLE', three_d_secure: { enrollment_status: 'Y', authentication_status: 'Y' }
 } } };
 await f.reconcilePayPalCheckout(f.row.id, true);
 assert.equal(f.calls.capture.length, 1);
 assert.equal(f.calls.fulfill, 1);
 assert.equal(f.row.status, 'PAID');
});

test('filtered authentication remains bound to the same order and rejects failed SCA', async () => {
 for (const mismatch of [true, false]) {
   const f = fixture({ status: 'APPROVED' });
   const original = f.mocks['./client'].paypalRequest;
   f.mocks['./client'].paypalRequest = async (path, ...args) => path.includes('?fields=payment_source')
     ? { id: mismatch ? 'OTHER123456789' : f.order.id, payment_source: { card: { authentication_result: {
       liability_shift: 'NO', three_d_secure: { enrollment_status: 'Y', authentication_status: 'N' }
     } } } }
     : original(path, ...args);
   await assert.rejects(f.reconcilePayPalCheckout(f.row.id, true));
   assert.equal(f.calls.capture.length, 0);
   assert.equal(f.calls.fulfill, 0);
 }
});
