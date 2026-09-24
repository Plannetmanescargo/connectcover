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
const { getStripeConfig } = load('lib/stripe/config.ts');
const { assertStripeSession, verifiedStripePayment, STRIPE_FLOW } = load('lib/stripe/payment.ts');
const { validateCheckout } = load('lib/payments/checkout.ts');
const config = getStripeConfig({ STRIPE_SECRET_KEY: 'sk_test_example', STRIPE_WEBHOOK_SECRET: 'whsec_example', NEXT_PUBLIC_BASE_URL: 'https://example.com' });
const payload = () => ({ quote: { vrm: 'AB12 CDE', startAt: '2026-11-01T12:00:00Z', endAt: '2026-11-01T13:00:00Z', durationMs: 3600000, totalAmountPence: 199 },
 customer: { fullName: 'Test Customer', dob: '1990-01-01', email: 'test@example.com', licenceType: 'Full UK', address: 'Test address' },
 pricing: { rateType: 'hourly', units: 1, timeZone: 'Europe/London' } });
function fixture({ created = true, paid = true } = {}) {
 const row = { ...validateCheckout(payload()), id: 'checkout_test_123', brand: 'coverza', paymentProvider: 'STRIPE', currency: 'GBP', status: 'PENDING',
   stripeCheckoutSessionId: created ? 'cs_test_session' : null, stripePaymentIntentId: null, stripeCheckoutUrl: 'https://checkout.stripe.com/test',
   stripeLivemode: false, stripeConfigHash: config.fingerprint, stripeProcessingUntil: null, stripeFulfilledAt: null,
   stripeNextAttemptAt: new Date(0), stripeReviewReason: null, createdAt: new Date() };
 const metadata = { brand: 'coverza', flow: STRIPE_FLOW, checkoutId: row.id };
 const intent = { id: 'pi_test_payment', metadata, status: 'succeeded', amount_received: 199, currency: 'gbp', livemode: false,
   latest_charge: { id: 'ch_test_charge', amount_refunded: 0, refunded: false, disputed: false } };
 const session = { id: 'cs_test_session', url: 'https://checkout.stripe.com/test', client_reference_id: row.id, mode: 'payment', livemode: false, metadata,
   amount_total: 199, amount_subtotal: 199, currency: 'gbp', status: paid ? 'complete' : 'open', payment_status: paid ? 'paid' : 'unpaid', payment_intent: paid ? intent : null };
 const calls = { creates: [], reads: 0, fulfill: 0, finalize: [], failDelivery: false, failCreate: false };
 const match = where => {
   for (const key of ['id','brand','paymentProvider','stripeConfigHash','stripeLivemode','stripeReviewReason','stripePaymentIntentId']) if (key in where && row[key] !== where[key]) return false;
   if (where.status?.not === row.status) return false;
   if (where.stripeNextAttemptAt && (!row.stripeNextAttemptAt || row.stripeNextAttemptAt > where.stripeNextAttemptAt.lte)) return false;
   if (where.OR?.[0] && 'stripeProcessingUntil' in where.OR[0] && row.stripeProcessingUntil && row.stripeProcessingUntil > new Date()) return false;
   if (where.OR?.[0] && 'stripeCheckoutSessionId' in where.OR[0] && row.stripeCheckoutSessionId && row.stripeCheckoutSessionId !== where.OR[1].stripeCheckoutSessionId) return false;
   if (where.stripeProcessingUntil instanceof Date && row.stripeProcessingUntil?.getTime() !== where.stripeProcessingUntil.getTime()) return false;
   return true;
 };
 const db = { paymentCheckout: {
   findUnique: async () => ({ ...row }), findUniqueOrThrow: async () => ({ ...row }),
   findMany: async () => [{ id: row.id }],
   update: async ({ data }) => ({ ...Object.assign(row, data) }),
   updateMany: async ({ where, data }) => { if (!match(where)) return { count: 0 }; Object.assign(row, data); return { count: 1 }; },
 } };
 const stripe = { checkout: { sessions: {
   create: async (body, options) => { calls.creates.push({ body, options }); if (calls.failCreate) throw new Error('Network'); return structuredClone(session); },
   retrieve: async () => { calls.reads++; return structuredClone(session); },
 } }, webhooks: new (require('stripe'))('sk_test_example').webhooks };
 const cfg = { getStripeConfig: () => config, getStripe: () => stripe };
 const mocks = { '@/db/prisma': { prisma: db }, './config': cfg, '@/lib/stripe/config': cfg,
   '@/lib/policy/finalize': { finalizePolicy: async data => { calls.finalize.push(data); return { policyId: 'policy_test' }; } },
   '@/lib/policy/fulfill': { fulfillPolicy: async (_, options) => { calls.fulfill++; assert.equal(options.durableEmail, true); if (calls.failDelivery) throw new Error('Email failure'); await options.onDeliveryReady(); } },
 };
 return { row, session, intent, calls, db, stripe, mocks, ...load('lib/stripe/process.ts', mocks) };
}
test('Stripe configuration validates keys, mode and origin', () => {
 assert.equal(config.livemode, false);
 const env = { STRIPE_SECRET_KEY: 'sk_live_example', STRIPE_WEBHOOK_SECRET: 'whsec_example', NEXT_PUBLIC_BASE_URL: 'https://example.com' };
 assert.equal(getStripeConfig(env).livemode, true);
 for (const patch of [{ STRIPE_SECRET_KEY: 'pk_live_example' }, { STRIPE_WEBHOOK_SECRET: '' }, { NEXT_PUBLIC_BASE_URL: 'http://example.com' }, { NEXT_PUBLIC_BASE_URL: 'https://example.com/path' }]) assert.throws(() => getStripeConfig({ ...env, ...patch }));
});
test('Stripe verifies brand, checkout, mode, amount, currency, intent and session binding', () => {
 const f = fixture(); assert.equal(verifiedStripePayment(f.session, f.row).id, f.intent.id);
 const patches = [s => s.metadata.brand = 'connectcover', s => s.metadata.flow = 'other', s => s.client_reference_id = 'other',
   s => s.metadata.checkoutId = 'other', s => s.livemode = true, s => s.id = 'cs_test_other', s => s.amount_total = 1,
   s => s.amount_subtotal = 1, s => s.currency = 'usd', s => s.payment_intent.amount_received = 1,
   s => s.payment_intent.status = 'processing', s => s.payment_intent.metadata.checkoutId = 'other', s => s.payment_intent.livemode = true];
 for (const patch of patches) { const s = structuredClone(f.session); patch(s); assert.throws(() => verifiedStripePayment(s, f.row)); }
});
test('session creation retries use identical payload/key and stop before retention expiry', async () => {
 const f = fixture({ created: false, paid: false }); const original = { ...f.row };
 f.calls.failCreate = true; await assert.rejects(f.ensureStripeSession(original));
 f.calls.failCreate = false; await f.ensureStripeSession(original);
 assert.deepEqual(f.calls.creates[0], f.calls.creates[1]);
 assert.equal(f.calls.creates[1].body.line_items[0].price_data.unit_amount, 199);
 assert.match(f.calls.creates[1].body.success_url, /provider=stripe&checkout_id=checkout_test_123/);
 await f.ensureStripeSession(f.row); assert.equal(f.calls.creates.length, 2);
 const g = fixture({ created: false }); g.row.createdAt = new Date(Date.now() - 23 * 3600_000);
 await assert.rejects(g.ensureStripeSession(g.row)); assert.equal(g.calls.creates.length, 0); assert.ok(g.row.stripeReviewReason);
});
test('unpaid and expired sessions cannot issue documents', async () => {
 for (const status of ['open','complete','expired']) {
   const f = fixture({ paid: false }); f.session.status = status;
   await f.reconcileStripeCheckout(f.row.id);
   assert.equal(f.calls.fulfill, 0); assert.equal(f.calls.finalize.length, 0);
   assert.equal(f.row.status, status === 'expired' ? 'EXPIRED' : 'PENDING');
 }
});
test('concurrent webhook/status/cron work delivers once and survives processor switch', async () => {
 const f = fixture(); const previous = process.env.PAYMENT_PROVIDER; process.env.PAYMENT_PROVIDER = 'paypal';
 try {
   await Promise.all([f.reconcileStripeCheckout(f.row.id), f.reconcileStripeCheckout(f.row.id)]);
   assert.equal(f.calls.fulfill, 1); assert.equal(f.row.status, 'PAID'); assert.ok(f.row.stripeFulfilledAt);
   await f.reconcileStripeCheckout(f.row.id, true); assert.equal(f.calls.fulfill, 1);
   assert.equal(f.calls.finalize[0].paymentId, f.session.id);
 } finally { if (previous === undefined) delete process.env.PAYMENT_PROVIDER; else process.env.PAYMENT_PROVIDER = previous; }
});
test('delivery failure stays recoverable without another payment/session', async () => {
 const f = fixture(); f.calls.failDelivery = true;
 await assert.rejects(f.reconcileStripeCheckout(f.row.id));
 assert.equal(f.row.status, 'PAID'); assert.equal(f.row.stripeFulfilledAt, null); assert.equal(f.row.stripeProcessingUntil, null); assert.ok(f.row.stripeNextAttemptAt);
 f.calls.failDelivery = false; await f.reconcileStripeCheckout(f.row.id, true);
 assert.ok(f.row.stripeFulfilledAt); assert.equal(f.calls.creates.length, 0);
 assert.equal(new Set(f.calls.finalize.map(x => x.paymentId)).size, 1);
});
test('refunds/disputes and mismatched configuration block delivery', async () => {
 for (const patch of [{ amount_refunded: 1 }, { refunded: true }, { disputed: true }]) {
   const f = fixture(); Object.assign(f.intent.latest_charge, patch); await f.reconcileStripeCheckout(f.row.id);
   assert.ok(f.row.stripeReviewReason); assert.equal(f.calls.fulfill, 0);
 }
 for (const patch of [{ stripeConfigHash: 'other' }, { stripeLivemode: true }, { stripeReviewReason: 'review' }]) {
   const f = fixture(); Object.assign(f.row, patch); await f.reconcileStripeCheckout(f.row.id, true); assert.equal(f.calls.reads, 0);
 }
});
function webhook(f) {
 const tasks = [];
 const { POST } = load('app/api/stripe/webhook/route.ts', { ...f.mocks,
   'next/server': { NextResponse: require('next/server').NextResponse, after: task => tasks.push(task) },
   '@/lib/payments/square-webhook': { POST: async () => new Response('square') },
   '@/lib/stripe/process': { reconcileStripeCheckout: f.reconcileStripeCheckout },
 });
 const req = ({ type = 'checkout.session.completed', livemode = false, object = f.session, valid = true } = {}) => {
   const body = JSON.stringify({ id: 'evt_test', type, livemode, data: { object } });
   const signature = f.stripe.webhooks.generateTestHeaderString({ payload: body, secret: valid ? config.webhookSecret : 'wrong' });
   return new Request('https://example.com/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': signature }, body });
 };
 return { POST, req, tasks };
}
test('real Stripe signature check rejects forged/wrong-mode events and persists work before acknowledgement', async () => {
 const f = fixture(); const w = webhook(f);
 assert.equal((await w.POST(w.req({ valid: false }))).status, 400);
 assert.equal((await w.POST(w.req({ livemode: true }))).status, 400); assert.equal(w.tasks.length, 0);
 assert.equal((await w.POST(w.req())).status, 200); assert.ok(f.row.stripeNextAttemptAt); assert.equal(w.tasks.length, 1);
 await w.tasks[0](); assert.equal(f.row.status, 'PAID'); assert.ok(f.row.stripeFulfilledAt);
 f.db.paymentCheckout.updateMany = async () => { throw new Error('DB down'); };
 assert.equal((await w.POST(w.req())).status, 500);
});
test('old failed event cannot downgrade completed payment; other brands ignored; Square callback preserved', async () => {
 const f = fixture(); const w = webhook(f);
 assert.equal((await w.POST(w.req({ type: 'checkout.session.async_payment_failed' }))).status, 200);
 await w.tasks[0](); assert.equal(f.row.status, 'PAID');
 const other = structuredClone(f.session); other.metadata.brand = 'connectcover';
 const count = w.tasks.length; await w.POST(w.req({ object: other })); assert.equal(w.tasks.length, count);
 const response = await w.POST(new Request('https://example.com/api/stripe/webhook', { method: 'POST', headers: { 'x-square-hmacsha256-signature': 'signed' }, body: '{}' }));
 assert.equal(await response.text(), 'square');
});
test('checkout rejects altered prices, cross-site requests, reused changed payloads and inactive Stripe', async () => {
 const f = fixture(); const rows = new Map();
 f.db.paymentCheckout.upsert = async ({ where, create }) => { if (!rows.has(where.stripeRequestKey)) rows.set(where.stripeRequestKey, { ...f.row, ...create }); return rows.get(where.stripeRequestKey); };
 const { POST } = load('app/api/stripe/checkout/route.ts', { ...f.mocks, '@/lib/stripe/process': { ensureStripeSession: async row => row } });
 const previous = process.env.PAYMENT_PROVIDER; process.env.PAYMENT_PROVIDER = 'stripe';
 const key = randomUUID(); const req = (body = payload(), origin = 'https://example.com') => new Request('https://example.com/api/stripe/checkout', { method: 'POST', headers: { origin, 'idempotency-key': key }, body: JSON.stringify(body) });
 try {
   assert.equal((await POST(req())).status, 200); assert.equal((await POST(req())).status, 200); assert.equal(rows.size, 1);
   const changed = payload(); changed.customer.email = 'new@example.com'; assert.equal((await POST(req(changed))).status, 409);
   const cheap = payload(); cheap.quote.totalAmountPence = 1; assert.equal((await POST(req(cheap))).status, 400);
   assert.equal((await POST(req(payload(), 'https://other.test'))).status, 403);
   process.env.PAYMENT_PROVIDER = 'paypal'; assert.equal((await POST(req())).status, 503);
 } finally { if (previous === undefined) delete process.env.PAYMENT_PROVIDER; else process.env.PAYMENT_PROVIDER = previous; }
});
test('provider dispatcher chooses each configured processor and fails closed for invalid values', async () => {
 const response = name => async () => new Response(name);
 const { POST } = load('app/api/payments/checkout/route.ts', {
   '@/app/api/stripe/checkout/route': { POST: response('stripe') }, '@/app/api/paypal/checkout/route': { POST: response('paypal') }, '@/app/api/mollie/checkout/route': { POST: response('mollie') },
 });
 const previous = process.env.PAYMENT_PROVIDER;
 try {
   for (const provider of ['stripe', 'paypal', 'mollie']) { process.env.PAYMENT_PROVIDER = provider; assert.equal(await (await POST(new Request('https://example.com'))).text(), provider); }
   process.env.PAYMENT_PROVIDER = 'invalid'; assert.equal((await POST(new Request('https://example.com'))).status, 503);
 } finally { if (previous === undefined) delete process.env.PAYMENT_PROVIDER; else process.env.PAYMENT_PROVIDER = previous; }
});
test('status confirms only after delivery readiness and schedules recovery without exposing customer data', async () => {
 const f = fixture(); const tasks = [];
 f.db.policyDocument = { findMany: async () => [{ kind: 'PROPOSAL' }, { kind: 'CERTIFICATE' }] };
 const { GET } = load('app/api/stripe/status/route.ts', { ...f.mocks,
   'next/server': { NextResponse: require('next/server').NextResponse, after: task => tasks.push(task) },
   '@/lib/stripe/process': { reconcileStripeCheckout: f.reconcileStripeCheckout },
 });
 const req = () => new Request(`https://example.com/api/stripe/status?checkout_id=${f.row.id}`);
 let response = await GET(req()); assert.match(response.headers.get('cache-control'), /no-store/);
 assert.deepEqual(await response.json(), { confirmed: false, documentsReady: false, status: 'PENDING', needsReview: false });
 assert.equal(tasks.length, 1); await tasks[0]();
 response = await GET(req()); const body = await response.json(); assert.equal(body.confirmed, true); assert.equal(body.documentsReady, true); assert.equal(body.email, undefined);
 f.row.stripeFulfilledAt = null; assert.equal((await (await GET(req())).json()).confirmed, false);
});
test('signed refund flags an existing Stripe checkout for review without changing other providers', async () => {
 const f = fixture(); f.row.stripePaymentIntentId = f.intent.id; const w = webhook(f);
 assert.equal((await w.POST(w.req({ type: 'charge.refunded', object: { payment_intent: f.intent.id } }))).status, 200);
 assert.ok(f.row.stripeReviewReason); assert.equal(f.row.stripeNextAttemptAt, null);
 const g = fixture(); g.row.paymentProvider = 'PAYPAL'; g.row.stripePaymentIntentId = g.intent.id; const x = webhook(g);
 await x.POST(x.req({ type: 'charge.refunded', object: { payment_intent: g.intent.id } })); assert.equal(g.row.stripeReviewReason, null);
});
