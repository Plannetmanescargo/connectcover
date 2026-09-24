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
const { promotionPrice, validatePrice } = load('lib/payments/pricing.ts');
test('SEPT10 applies a single 10 percent saving in integer pence, case-insensitively', () => {
 for (const [subtotal, total] of [[199,179],[2499,2249],[14999,13499],[29000,26100],[995,895]]) {
   for (const code of ['SEPT10','sept10',' SePt10 ']) {
     const result = promotionPrice(subtotal, code);
     assert.equal(result.totalAmountPence,total); assert.equal(result.code,'SEPT10');
     assert.equal(result.discountPence,subtotal-total);
   }
   assert.equal(promotionPrice(subtotal).totalAmountPence,subtotal);
   assert.equal(promotionPrice(subtotal,' ').totalAmountPence,subtotal);
 }
 for (const code of ['SUMMER10','SEPT100','SEPT10,SEPT10',null,[],{},10]) assert.throws(() => promotionPrice(199,code));
});
test('all price periods validate the discounted total and reject fabricated savings', () => {
 for (const [rateType, units, start, end, subtotal] of [
   ['hourly',1,'2026-10-01T12:00:00Z','2026-10-01T13:00:00Z',199],
   ['hourly',3,'2026-10-01T12:00:00Z','2026-10-01T15:00:00Z',597],
   ['daily',1,'2026-10-01T12:00:00Z','2026-10-02T12:00:00Z',2499],
   ['weekly',1,'2026-10-01T12:00:00Z','2026-10-08T12:00:00Z',14999],
   ['monthly',1,'2026-11-01T12:00:00Z','2026-12-01T12:00:00Z',29000],
 ]) {
   const input = {rateType,units,startAt:new Date(start),endAt:new Date(end),timeZone:'Europe/London',totalAmountPence:subtotal};
   assert.equal(validatePrice(input),subtotal);
   const discounted = promotionPrice(subtotal,'SEPT10').totalAmountPence;
   assert.equal(validatePrice({...input,promoCode:'SEPT10',totalAmountPence:discounted}),discounted);
   assert.throws(() => validatePrice({...input,totalAmountPence:discounted}));
   assert.throws(() => validatePrice({...input,promoCode:'SEPT10',totalAmountPence:discounted-1}));
   assert.throws(() => validatePrice({...input,promoCode:'INVALID',totalAmountPence:discounted}));
 }
});
