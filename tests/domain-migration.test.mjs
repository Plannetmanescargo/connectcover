import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require('next/server');
const mod = { exports: {} };
const code = ts.transpileModule(readFileSync(new URL('../middleware.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
new Function('require', 'module', 'exports', code)(name => {
  assert.equal(name, 'next/server');
  return { NextRequest, NextResponse };
}, mod, mod.exports);
const { middleware } = mod.exports;

for (const host of ['coverza.uk', 'www.coverza.uk', 'coverza.net']) {
  test(`${host} preserves checkout reference and query on canonical redirect`, () => {
    const response = middleware(new NextRequest(`https://${host}/checkout/success?provider=stripe&session_id=cs_example&checkout_id=example`));
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('location'), 'https://www.coverza.net/checkout/success?provider=stripe&session_id=cs_example&checkout_id=example');
  });
}

test('old API callbacks and wallet verification remain direct during maintenance', () => {
  const old = process.env.NEXT_PUBLIC_MAINTENANCE;
  process.env.NEXT_PUBLIC_MAINTENANCE = 'true';
  try {
    for (const host of ['coverza.uk', 'www.coverza.uk', 'coverza.net', 'www.coverza.net']) {
      for (const path of ['/api', '/api/stripe/webhook', '/api/paypal/webhook', '/api/mollie/webhook', '/api/internal/policy/render-certificate', '/.well-known/apple-developer-merchantid-domain-association']) {
        const response = middleware(new NextRequest(`https://${host}${path}`, { method: path.startsWith('/api') ? 'POST' : 'GET' }));
        assert.equal(response.headers.get('location'), null);
        assert.equal(response.headers.get('x-middleware-rewrite'), null);
        assert.equal(response.headers.get('x-middleware-next'), '1');
      }
    }
  } finally {
    if (old === undefined) delete process.env.NEXT_PUBLIC_MAINTENANCE;
    else process.env.NEXT_PUBLIC_MAINTENANCE = old;
  }
});

test('new canonical, preview and localhost hosts do not redirect domains', () => {
  for (const host of ['www.coverza.net', 'coverza-preview.vercel.app', 'localhost:3000']) {
    const response = middleware(new NextRequest(`https://${host}/`));
    assert.equal(response.headers.get('location'), null);
  }
});

test('old open-tab POSTs are not forwarded across origins', () => {
  const response = middleware(new NextRequest('https://www.coverza.uk/get-quote', { method: 'POST' }));
  assert.equal(response.headers.get('location'), null);
});
