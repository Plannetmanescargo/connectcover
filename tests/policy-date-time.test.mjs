import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";
import ts from "typescript";

// Compile the actual production helper without requiring a TS test runner.
const source = readFileSync(new URL("../lib/policy/dateTime.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const helperUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
const { formatPolicyDateTime, hasExplicitTimeZone } = await import(helperUrl);

for (const serverTZ of ["UTC", "Europe/London", "America/New_York"]) {
  test(`UK cover times survive browser → UTC storage → documents on ${serverTZ}`, () => {
    for (const [date, expectedUTC, month] of [
      ["2026-09-12", "02:00", "September"],
      ["2026-01-12", "03:00", "January"],
    ]) {
      const payload = JSON.parse(execFileSync(process.execPath, ["-e", `
        console.log(JSON.stringify({
          start: new Date('${date}T03:00').toISOString(),
          end: new Date('${date}T04:00').toISOString()
        }));
      `], { env: { ...process.env, TZ: "Europe/London" }, encoding: "utf8" }));
      assert.equal(payload.start.slice(11, 16), expectedUTC);
      assert.equal(new Date(payload.end) - new Date(payload.start), 3_600_000);
      const rendered = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", `
        const { formatPolicyDateTime } = await import(${JSON.stringify(helperUrl)});
        console.log(JSON.stringify([
          formatPolicyDateTime(${JSON.stringify(payload.start)}, 'certificate'),
          formatPolicyDateTime(${JSON.stringify(payload.end)}, 'proposal')
        ]));
      `], { env: { ...process.env, TZ: serverTZ }, encoding: "utf8" }));
      assert.deepEqual(rendered, [
        `03:00 hours - 12 ${month} 2026`,
        `12 ${month} 2026 at 04:00`,
      ]);
    }
  });
}

test("UK dates roll over at midnight and offsets change at both DST boundaries", () => {
  const cases = [
    ["2026-09-12T23:30:00Z", "13 September 2026 at 00:30"],
    ["2026-03-29T00:30:00Z", "29 March 2026 at 00:30"],
    ["2026-03-29T01:30:00Z", "29 March 2026 at 02:30"],
    ["2026-10-25T00:30:00Z", "25 October 2026 at 01:30"],
    ["2026-10-25T01:30:00Z", "25 October 2026 at 01:30"],
    ["2026-10-25T02:30:00Z", "25 October 2026 at 02:30"],
  ];
  for (const [iso, expected] of cases) {
    assert.equal(formatPolicyDateTime(iso, "proposal"), expected);
  }
});

test("checkout requires an explicit timezone instead of guessing the server timezone", () => {
  for (const value of ["2026-09-12T02:00:00.000Z", "2026-09-12T03:00:00+01:00"]) {
    assert.equal(hasExplicitTimeZone(value), true);
  }
  for (const value of ["2026-09-12T03:00", "2026-09-12", "", "invalid"]) {
    assert.equal(hasExplicitTimeZone(value), false);
  }
  assert.equal(formatPolicyDateTime("invalid", "certificate"), "invalid");
});
