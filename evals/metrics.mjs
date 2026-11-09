#!/usr/bin/env node
// Compare completed native `claude plugin eval --json` results, with optional observed usage.
// No model calls. Unknown native fields are ignored; unavailable telemetry is never zero-filled.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const finite = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const fail = (message) => { throw new Error(message); };
const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
const change = (before, after) => before === 0 ? (after === 0 ? 0 : null) : (after / before - 1) * 100;
const percentile = (values, p) => values.slice().sort((a, b) => a - b)[Math.max(0, Math.ceil(values.length * p) - 1)];
const median = (values) => {
  const sorted = values.slice().sort((a, b) => a - b), mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export function nativeSummary(report, label) {
  if (report?.schemaVersion !== 1) fail(`${label}: unsupported native schemaVersion`);
  if (report.partial !== false) fail(`${label}: partial or missing completion status`);
  if (!Array.isArray(report.cases) || !report.cases.length) fail(`${label}: no evaluated cases`);
  if (!finite(report.costUsd) || !finite(report.durationSeconds)) fail(`${label}: missing cost/duration`);
  if (typeof report.claudeVersion !== 'string' || !report.claudeVersion) fail(`${label}: missing Claude version`);
  const names = new Set();
  const cases = report.cases.map((c) => {
    if (typeof c.name !== 'string' || !c.name || names.has(c.name)) fail(`${label}: invalid/duplicate case name`);
    names.add(c.name);
    const score = c.aggregates?.score;
    if (!finite(score) || score > 1) fail(`${label}/${c.name}: invalid score`);
    const runs = c.arms?.with;
    if (!Array.isArray(runs) || !runs.length) fail(`${label}/${c.name}: no with-plugin runs`);
    for (const [i, run] of runs.entries()) {
      if (run.error || run.aborted || run.skippedPaidGraders) fail(`${label}/${c.name}/${i + 1}: incomplete or abnormal run`);
    }
    // This comparison is between plugin versions; a no-plugin arm is a separate experiment.
    if (Array.isArray(c.arms.without) && c.arms.without.length) fail(`${label}/${c.name}: use --ablation none for version comparisons`);
    return { name: c.name, score, runs: runs.length };
  }).sort((a, b) => a.name.localeCompare(b.name));
  if (report.aggregates?.casesTotal !== cases.length) fail(`${label}: aggregate case count differs from cases`);
  return { costUsd: report.costUsd, durationSeconds: report.durationSeconds, claudeVersion: report.claudeVersion, cases };
}

const TOKEN_FIELDS = ['inputTokens', 'outputTokens', 'cacheReadTokens', 'cacheWriteTokens'];
const OPTIONAL_FIELDS = ['toolCalls', 'subagents', 'retries', 'humanTurns', 'durationSeconds'];
export function usageSummary(usage, side, cases) {
  if (usage?.schemaVersion !== 1 || usage.measurement !== 'observed') fail('usage: require schemaVersion 1 and measurement "observed"');
  if (typeof usage.source !== 'string' || !usage.source.trim()) fail('usage: name the real collection source');
  if (usage.inputConvention !== 'uncached-only') fail('usage: inputTokens must exclude cache reads/writes to prevent double counting');
  const expected = new Set(cases.flatMap((c) => Array.from({ length: c.runs }, (_, i) => `${c.name}/${i + 1}`)));
  const rows = usage[side];
  if (!Array.isArray(rows) || rows.length !== expected.size) fail(`usage/${side}: missing or extra runs`);
  for (const row of rows) {
    if (typeof row.case !== 'string' || !row.case || !Number.isSafeInteger(row.run) || row.run < 1) fail(`usage/${side}: invalid case/run identity`);
    const key = `${row.case}/${row.run}`;
    if (!expected.delete(key)) fail(`usage/${side}: unknown or duplicate run ${key}`);
    for (const field of TOKEN_FIELDS) {
      if (!Number.isSafeInteger(row[field]) || row[field] < 0) fail(`usage/${key}: missing/invalid ${field}`);
    }
    for (const field of OPTIONAL_FIELDS) {
      if (row[field] != null && (!finite(row[field]) || (field !== 'durationSeconds' && !Number.isSafeInteger(row[field])))) fail(`usage/${key}: invalid ${field}`);
    }
  }
  const total = (field) => rows.every((r) => r[field] != null) ? rows.reduce((n, r) => n + r[field], 0) : null;
  const tokens = rows.map((r) => TOKEN_FIELDS.reduce((n, k) => n + r[k], 0));
  return {
    source: usage.source,
    ...Object.fromEntries([...TOKEN_FIELDS, ...OPTIONAL_FIELDS].map((f) => [f, total(f)])),
    totalTokens: tokens.reduce((a, b) => a + b, 0), medianTokens: median(tokens), p95Tokens: percentile(tokens, .95),
    cases: cases.map((c) => {
      const values = rows.filter((r) => r.case === c.name).map((r) => TOKEN_FIELDS.reduce((n, k) => n + r[k], 0));
      return { name: c.name, runs: values.length, medianTokens: median(values), p95Tokens: percentile(values, .95) };
    }),
  };
}

export function compareResults(beforeReport, afterReport, metadata, options = {}, usage = null) {
  if (metadata?.schemaVersion !== 1) fail('metadata: unsupported schemaVersion');
  if (metadata.comparisonProfile !== 'quality-only-v1') fail('metadata: require quality-only-v1 comparison profile; agent budgets must not enter the quality score');
  for (const field of ['model', 'judgeModel', 'suiteDigest', 'beforeSha', 'afterSha']) {
    if (typeof metadata[field] !== 'string' || !metadata[field].trim()) fail(`metadata: missing ${field}`);
  }
  if (!/^[a-f0-9]{64}$/i.test(metadata.suiteDigest)) fail('metadata: suiteDigest must be SHA-256');
  for (const field of ['beforeSha', 'afterSha']) if (!/^[a-f0-9]{40,64}$/i.test(metadata[field])) fail(`metadata: invalid ${field}`);
  for (const side of ['before', 'after']) if (!Number.isInteger(metadata.statuses?.[side])) fail(`metadata: missing ${side} exit status`);
  const minimumRuns = options.minimumRuns ?? 2;
  if (!Number.isSafeInteger(minimumRuns) || minimumRuns < 1) fail('minimumRuns must be a positive integer');
  for (const field of ['maxCostIncreasePct', 'maxTokenIncreasePct']) {
    if (options[field] != null && !finite(options[field])) fail(`${field} must be nonnegative`);
  }
  const before = nativeSummary(beforeReport, 'before'), after = nativeSummary(afterReport, 'after');
  if (before.claudeVersion !== after.claudeVersion) fail('different Claude Code versions: rerun with a fixed runtime');
  if (JSON.stringify(before.cases.map((c) => [c.name, c.runs])) !== JSON.stringify(after.cases.map((c) => [c.name, c.runs]))) fail('case set or repetition counts differ');
  const problems = [];
  for (const side of ['before', 'after']) {
    if (metadata.statuses[side] !== 0) problems.push(`${side} process exited ${metadata.statuses[side]}`);
  }
  for (const [i, c] of after.cases.entries()) {
    if (c.runs < minimumRuns) problems.push(`${c.name}: ${c.runs} run(s), need ${minimumRuns}`);
    if (c.score < 1) problems.push(`${c.name}: quality criteria did not all pass (${c.score})`);
    if (c.score < before.cases[i].score) problems.push(`${c.name}: quality regressed`);
  }
  const baselineAccepted = before.cases.every((c) => c.score === 1);
  if (!baselineAccepted) problems.push('baseline did not meet all quality criteria: cost is not an equivalent-completion comparison');
  const result = {
    schemaVersion: 1, kind: 'agentic-eval-comparison',
    provenance: { comparisonProfile: metadata.comparisonProfile, excludedGraders: metadata.excludedGraders ?? [],
      model: metadata.model, judgeModel: metadata.judgeModel, requestedEffort: metadata.effort ?? null,
      suiteDigest: metadata.suiteDigest, beforeSha: metadata.beforeSha, afterSha: metadata.afterSha,
      claudeVersion: before.claudeVersion, beforeDirty: metadata.beforeDirty ?? null, afterDirty: metadata.afterDirty ?? null },
    before, after, baselineAccepted,
    costChangePct: change(before.costUsd, after.costUsd), durationChangePct: change(before.durationSeconds, after.durationSeconds),
    usage: null, tokenChangePct: null,
    limitations: ['Static size and agent count are not token usage.', 'List-price cost includes judge calls; it is not a subscription invoice.', 'Small samples describe this experiment, not a statistically established saving.'],
    problems,
  };
  if (usage) {
    const b = usageSummary(usage, 'before', before.cases), a = usageSummary(usage, 'after', after.cases);
    result.usage = { before: b, after: a };
    result.tokenChangePct = change(b.totalTokens, a.totalTokens);
  } else result.limitations.push('Token, tool, retry and human-intervention telemetry was not supplied.');
  for (const [limit, metric, beforeValue, afterValue] of [
    ['maxCostIncreasePct', 'costChangePct', before.costUsd, after.costUsd],
    ['maxTokenIncreasePct', 'tokenChangePct', result.usage?.before.totalTokens, result.usage?.after.totalTokens],
  ]) {
    if (options[limit] == null) continue;
    if (beforeValue == null || afterValue == null) problems.push(`${limit}: required telemetry is unavailable`);
    else if ((beforeValue === 0 && afterValue > 0) || result[metric] > options[limit]) problems.push(`${metric} exceeds ${options[limit]}%`);
  }
  result.passed = problems.length === 0;
  result.efficiencyComparable = result.passed && baselineAccepted;
  return result;
}

export function main(argv) {
  const args = [...argv], directory = args.shift();
  if (!directory || directory.startsWith('-')) fail('Usage: node evals/metrics.mjs <comparison-dir> [--usage <observed.json>] [--min-runs N] [--max-cost-increase PCT] [--max-token-increase PCT]');
  const options = {}, flags = { '--min-runs': 'minimumRuns', '--max-cost-increase': 'maxCostIncreasePct', '--max-token-increase': 'maxTokenIncreasePct' };
  let usage = null;
  while (args.length) {
    const flag = args.shift(), value = args.shift();
    if (!value || value.startsWith('--')) fail(`missing value for ${flag}`);
    if (flag === '--usage') usage = read(value);
    else if (flags[flag]) options[flags[flag]] = Number(value);
    else fail(`unknown option ${flag}`);
  }
  const result = compareResults(read(path.join(directory, 'before.json')), read(path.join(directory, 'after.json')), read(path.join(directory, 'metadata.json')), options, usage);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  return result.passed ? 0 : 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); }
  catch (e) { process.stderr.write(`metrics: ${e.message}\n`); process.exitCode = 2; }
}
