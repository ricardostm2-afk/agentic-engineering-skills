#!/usr/bin/env node
// Deterministic text-size budgets, not a tokenizer or a model-usage estimate.
import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const size = (text) => ({ bytes: Buffer.byteLength(text), characters: [...text].length });

export function measureContext(root, config) {
  if (config?.schemaVersion !== 1) throw new Error('unsupported context budget schema');
  const rootReal = realpathSync(root);
  const load = (relative) => {
    if (typeof relative !== 'string' || path.isAbsolute(relative)) throw new Error('budget paths must be relative');
    const file = realpathSync(path.resolve(rootReal, relative));
    if (!file.startsWith(rootReal + path.sep)) throw new Error('budget path leaves repository');
    return readFileSync(file, 'utf8');
  };
  const positive = (n) => Number.isSafeInteger(n) && n > 0;
  if (!positive(config.metadataMaxBytes) || !positive(config.skillMaxBytes)) throw new Error('invalid metadata/skill budget');
  const problems = [];
  const skills = readdirSync(path.join(rootReal, 'skills'), { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => {
    const relative = `skills/${x.name}/SKILL.md`, content = load(relative);
    const fm = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content);
    if (!fm) throw new Error(`invalid frontmatter: ${relative}`);
    const measured = { name: x.name, path: relative, ...size(content), metadataBytes: Buffer.byteLength(fm[1]),
      maxBytes: config.skills?.[x.name] ?? config.skillMaxBytes };
    if (!positive(measured.maxBytes)) throw new Error(`invalid budget for ${x.name}`);
    if (measured.bytes > measured.maxBytes) problems.push(`${relative}: ${measured.bytes} > ${measured.maxBytes} bytes`);
    return measured;
  }).sort((a, b) => a.name.localeCompare(b.name));
  for (const name of Object.keys(config.skills ?? {})) if (!skills.some((s) => s.name === name)) throw new Error(`budget names absent skill ${name}`);
  const metadataBytes = skills.reduce((n, s) => n + s.metadataBytes, 0);
  if (metadataBytes > config.metadataMaxBytes) problems.push(`metadata: ${metadataBytes} > ${config.metadataMaxBytes} bytes`);
  if (!Array.isArray(config.routes) || !config.routes.length) throw new Error('at least one context route is required');
  const names = new Set();
  const routes = config.routes.map((route) => {
    if (!route.name || names.has(route.name) || !positive(route.maxBytes)) throw new Error('invalid/duplicate route');
    names.add(route.name);
    if (!Array.isArray(route.files) || !route.files.length || new Set(route.files).size !== route.files.length) throw new Error(`${route.name}: unique nonempty file list required`);
    const files = route.files.map((f) => ({ path: f, ...size(load(f)) }));
    const bytes = files.reduce((n, f) => n + f.bytes, 0);
    if (bytes > route.maxBytes) problems.push(`${route.name}: ${bytes} > ${route.maxBytes} bytes`);
    return { name: route.name, bytes, maxBytes: route.maxBytes, files };
  });
  return { schemaVersion: 1, measurement: 'static-utf8-bytes', metadataBytes, metadataMaxBytes: config.metadataMaxBytes,
    skills, routes, problems, passed: !problems.length,
    limits: 'Explicit file sets only; excludes prompts, project files, tools, extra references, repeated reads and model output. These are not observed tokens.' };
}

export function main(argv) {
  let root = REPO, json = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') json = true;
    else if (argv[i] === '--root' && argv[i + 1]) root = path.resolve(argv[++i]);
    else throw new Error('Usage: node tools/context-budget.mjs [--json] [--root <repository>]');
  }
  const result = measureContext(root, JSON.parse(readFileSync(path.join(root, 'context-budget.json'), 'utf8')));
  if (json) process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  else {
    process.stdout.write(`Metadata: ${result.metadataBytes}/${result.metadataMaxBytes} bytes\n`);
    for (const r of result.routes) process.stdout.write(`${r.name}: ${r.bytes}/${r.maxBytes} bytes\n`);
    for (const problem of result.problems) process.stderr.write(problem + '\n');
    process.stdout.write(result.limits + '\n');
  }
  return result.passed ? 0 : 1;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); }
  catch (e) { process.stderr.write(`context-budget: ${e.message}\n`); process.exitCode = 2; }
}
