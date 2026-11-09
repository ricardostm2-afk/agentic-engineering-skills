import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareResults, nativeSummary } from '../evals/metrics.mjs';

// Synthetic unit data, never a measured model run or a published benchmark.
const report = () => ({ schemaVersion: 1, partial: false, claudeVersion: 'test-runtime', costUsd: 2, durationSeconds: 20,
  aggregates: { casesTotal: 1 }, cases: [{ name: 'case-a', aggregates: { score: 1 }, arms: { with: [{ error: null }, { error: null }] } }] });
const meta = () => ({ schemaVersion: 1, comparisonProfile: 'quality-only-v1', excludedGraders: ['case-a/graders/agent-budget.md'], model: 'pinned-agent', judgeModel: 'pinned-judge', effort: 'medium',
  suiteDigest: 'a'.repeat(64), beforeSha: 'b'.repeat(40), afterSha: 'c'.repeat(40), statuses: { before: 0, after: 0 } });
const observed = () => ({ schemaVersion: 1, measurement: 'observed', source: 'synthetic test fixture', inputConvention: 'uncached-only',
  before: [1, 2].map((run) => ({ case: 'case-a', run, inputTokens: 100, outputTokens: 30, cacheReadTokens: 20, cacheWriteTokens: 10 })),
  after: [1, 2].map((run) => ({ case: 'case-a', run, inputTokens: 50, outputTokens: 30, cacheReadTokens: 20, cacheWriteTokens: 0 })) });

test('completed equivalent results report cost/time without inventing token usage', () => {
  const after = report(); after.costUsd = 1; after.durationSeconds = 10;
  const r = compareResults(report(), after, meta());
  assert.equal(r.passed, true); assert.equal(r.costChangePct, -50); assert.equal(r.durationChangePct, -50);
  assert.equal(r.usage, null); assert.equal(r.tokenChangePct, null);
});
test('unknown additive native fields do not break the documented schema', () => {
  const r = report(); r.futureField = { whatever: 123 };
  assert.equal(nativeSummary(r, 'before').cases.length, 1);
});
for (const mutation of [
  (r) => { r.partial = true; }, (r) => { delete r.partial; }, (r) => { r.schemaVersion = 2; },
  (r) => { r.cases = []; }, (r) => { r.cases[0].arms.with = []; },
  (r) => { r.cases[0].arms.with[0].error = 'timed out'; },
  (r) => { r.cases[0].arms.with[0].aborted = { reason: 'abort' }; },
  (r) => { r.cases[0].arms.with[0].skippedPaidGraders = true; },
  (r) => { r.cases[0].arms.without = [{}]; },
  (r) => { r.cases[0].aggregates.score = NaN; }, (r) => { delete r.costUsd; },
]) test('partial, malformed or abnormal native results cannot become a successful comparison: ' + mutation.toString(), () => {
  const r = report(); mutation(r); assert.throws(() => compareResults(report(), r, meta()));
});
test('quality regression is failure even when the candidate is cheaper', () => {
  const a = report(); a.costUsd = .1; a.cases[0].aggregates.score = .5;
  const r = compareResults(report(), a, meta());
  assert.equal(r.passed, false); assert.equal(r.efficiencyComparable, false);
  assert.ok(r.problems.some((p) => p.includes('regressed')));
});
test('an unsuccessful baseline is not an equivalent cheaper-completion benchmark', () => {
  const b = report(); b.cases[0].aggregates.score = .5;
  const r = compareResults(b, report(), meta()); assert.equal(r.baselineAccepted, false); assert.equal(r.passed, false);
});
test('unseparated agent-budget scores cannot be labeled task quality', () => {
  const m = meta(); delete m.comparisonProfile;
  assert.throws(() => compareResults(report(), report(), m), /quality-only-v1/);
});
test('case identity, sample sizes and runtime must be the same', () => {
  for (const mutate of [(r) => r.cases[0].name = 'different', (r) => r.cases[0].arms.with.pop(), (r) => r.claudeVersion = 'new']) {
    const a = report(); mutate(a); assert.throws(() => compareResults(report(), a, meta()));
  }
});
test('failed command status and insufficient repetitions fail the gate', () => {
  const m = meta(); m.statuses.after = 2;
  assert.equal(compareResults(report(), report(), m).passed, false);
  assert.equal(compareResults(report(), report(), meta(), { minimumRuns: 3 }).passed, false);
});
test('observed usage counts exclusive token categories once and leaves unobserved counts null', () => {
  const r = compareResults(report(), report(), meta(), {}, observed());
  assert.equal(r.usage.before.totalTokens, 320); assert.equal(r.usage.after.totalTokens, 200);
  assert.equal(r.usage.before.medianTokens, 160); assert.equal(r.usage.after.p95Tokens, 100);
  assert.equal(r.usage.after.toolCalls, null); assert.equal(r.tokenChangePct, -37.5);
});
test('missing, duplicate, estimated or ambiguous usage is rejected', () => {
  for (const mutate of [(u) => u.after.pop(), (u) => u.after[1].run = 1,
    (u) => delete u.after[0].cacheReadTokens, (u) => u.measurement = 'estimated',
    (u) => u.inputConvention = 'includes-cache', (u) => u.after[0].inputTokens = -1]) {
    const u = observed(); mutate(u); assert.throws(() => compareResults(report(), report(), meta(), {}, u));
  }
});
test('usage identity cannot collide by coercing a run number into a path', () => {
  const b = report(), a = report(); b.cases[0].name = a.cases[0].name = 'group/case';
  const u = observed();
  for (const side of ['before', 'after']) for (const row of u[side]) row.case = 'group/case';
  u.after[0].case = 'group'; u.after[0].run = 'case/1';
  assert.throws(() => compareResults(b, a, meta(), {}, u), /case\/run identity/);
});
test('optional cost and token gates reject regression or unavailable data', () => {
  const a = report(); a.costUsd = 3;
  assert.equal(compareResults(report(), a, meta(), { maxCostIncreasePct: 10 }).passed, false);
  assert.equal(compareResults(report(), report(), meta(), { maxTokenIncreasePct: 10 }).passed, false);
  assert.equal(compareResults(report(), report(), meta(), { maxTokenIncreasePct: 0 }, observed()).passed, true);
});
test('zero-cost baseline cannot hide newly incurred cost behind a null percentage', () => {
  const b = report(); b.costUsd = 0;
  const r = compareResults(b, report(), meta(), { maxCostIncreasePct: 10 });
  assert.equal(r.costChangePct, null); assert.equal(r.passed, false);
});
