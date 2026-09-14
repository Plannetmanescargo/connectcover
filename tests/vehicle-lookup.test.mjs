import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function moduleUrl(path, replacements = {}) {
  let source = readFileSync(new URL(path, import.meta.url), 'utf8');
  for (const [from, to] of Object.entries(replacements)) source = source.replaceAll(`"${from}"`, `"${to}"`);
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
}
const registrationUrl = moduleUrl('../lib/vehicle/registration.ts');
const providerUrl = moduleUrl('../lib/vehicle/rapidCarCheck.ts', { './registration': registrationUrl });
const { normaliseRegistration, parseRapidCarCheck, fetchRapidCarCheck } = await import(providerUrl);
const env = { RAPID_CAR_CHECK_API_KEY: 'TEST_KEY_NEVER_LIVE', RAPID_CAR_CHECK_DOMAIN: 'example.com' };
const fixture = (basic = {}, vrm = 'AB12CDE') => ({
  HasError: false, Results: { HasVehicleResults: true, InitialVehicleCheckModel: {
    Vrm: vrm, BasicVehicleDetailsModel: { Make: 'BMW', Model: 'X5', YearOfManufacture: '2012', Colour: 'BLUE', FuelType: 'DIESEL', ...basic },
  } },
});

test('normalises registrations and blocks invalid requests', () => {
  for (const [input, expected] of [[' ab12 cde ', 'AB12CDE'], ['A1', 'A1'], ['ABC 1234', 'ABC1234'], ['1234 AB', '1234AB']]) assert.equal(normaliseRegistration(input), expected);
  for (const input of ['', null, 123, 'ABCDEFG', '123456', 'AB12&CDE', 'AB1234567']) assert.equal(normaliseRegistration(input), null);
});

test('maps documented BasicVehicleDetailsModel fields and preserves acronyms', () => {
  assert.deepEqual(parseRapidCarCheck(fixture(), 'AB12CDE'), { make: 'BMW', model: 'X5', year: 2012, colour: 'BLUE', fuelType: 'DIESEL' });
  const partial = parseRapidCarCheck(fixture({ Model: 'Not Available', YearOfManufacture: 'unknown', Colour: '' }), 'AB12CDE');
  assert.equal(partial.model, null); assert.equal(partial.year, null); assert.equal(partial.colour, null);
});

test('does not report provider errors, empty results or another plate as a found vehicle', () => {
  for (const payload of [null, {}, { ...fixture(), HasError: true }, { HasError: false, Results: { HasVehicleResults: false } }, fixture({}, 'XY99ZZZ'), fixture({ Make: '', Model: '' })]) {
    assert.throws(() => parseRapidCarCheck(payload, 'AB12CDE'));
  }
});

test('uses the documented GET parameters, verified HTTPS, timeout and no automatic retries', async () => {
  let count = 0;
  const summary = await fetchRapidCarCheck('AB12CDE', env, async (url, options) => {
    count++;
    assert.equal(url.origin + url.pathname, 'https://www.rapidcarcheck.co.uk/api/');
    assert.deepEqual(Object.fromEntries(url.searchParams), { key: env.RAPID_CAR_CHECK_API_KEY, domain: 'example.com', plate: 'AB12CDE' });
    assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'error'); assert.ok(options.signal);
    return Response.json(fixture());
  });
  assert.equal(count, 1); assert.equal(summary.make, 'BMW');
  for (const [status, expected] of [[202,503], [204,404], [206,503], [403,503], [429,429], [500,503]]) {
    let calls = 0;
    await assert.rejects(fetchRapidCarCheck('AB12CDE', env, async () => { calls++; return new Response(null, { status }); }), error => error.status === expected);
    assert.equal(calls, 1);
  }
});

test('configuration failures and upstream errors never expose credentials or make unintended calls', async () => {
  const fail = () => { throw new Error('must not request'); };
  for (const config of [{}, { ...env, RAPID_CAR_CHECK_ENDPOINT: 'http://www.rapidcarcheck.co.uk/api/' }, { ...env, RAPID_CAR_CHECK_ENDPOINT: 'https://example.org/' }, { ...env, RAPID_CAR_CHECK_ENDPOINT: 'https://www.rapidcarcheck.co.uk/api/?sandbox_mode=1' }]) {
    await assert.rejects(fetchRapidCarCheck('AB12CDE', config, fail), error => error.status === 503);
  }
  for (const request of [async () => { throw new Error(env.RAPID_CAR_CHECK_API_KEY); }, async () => new Response('<html>bad gateway</html>')]) {
    await assert.rejects(fetchRapidCarCheck('AB12CDE', env, request), error => error.status === 503 && !error.message.includes(env.RAPID_CAR_CHECK_API_KEY));
  }
});

test('route validates before lookup, coalesces concurrent calls, returns only summary and throttles bursts', async () => {
  const oldFetch = globalThis.fetch;
  const oldEnv = { ...process.env };
  Object.assign(process.env, env); delete process.env.VERCEL;
  let calls = 0;
  globalThis.fetch = async () => { calls++; await new Promise(resolve => setTimeout(resolve, 10)); return Response.json(fixture()); };
  try {
    const { POST } = await import(moduleUrl('../app/api/vehicle/lookup/route.ts', {
      '@/lib/vehicle/rapidCarCheck': providerUrl,
      'next/server': pathToFileURL(require.resolve('next/server')).href,
    }));
    const req = (vrm = 'AB12CDE', origin = 'https://example.com') => new Request('https://example.com/api/vehicle/lookup', {
      method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ vrm }),
    });
    assert.equal((await POST(req('???'))).status, 400);
    assert.equal((await POST(req('AB12CDE', 'https://other.example'))).status, 403);
    assert.equal(calls, 0);
    const responses = await Promise.all([POST(req()), POST(req())]);
    assert.equal(calls, 1);
    for (const response of responses) {
      assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
      const result = await response.json();
      assert.deepEqual(Object.keys(result).sort(), ['ok', 'summary', 'vrm']);
      assert.equal(result.summary.model, 'X5'); assert.ok(!JSON.stringify(result).includes(env.RAPID_CAR_CHECK_API_KEY));
    }
    for (let i = 0; i < 8; i++) await POST(req());
    const before = calls;
    assert.equal((await POST(req())).status, 429); assert.equal(calls, before);
  } finally {
    globalThis.fetch = oldFetch;
    for (const key of Object.keys(env)) { if (oldEnv[key] === undefined) delete process.env[key]; else process.env[key] = oldEnv[key]; }
    if (oldEnv.VERCEL !== undefined) process.env.VERCEL = oldEnv.VERCEL;
  }
});
