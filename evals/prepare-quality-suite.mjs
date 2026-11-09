#!/usr/bin/env node
// Prepare one frozen comparison suite and two disposable plugin snapshots.
// Native --eval-dir accepts relative paths only. Hardlinks expose the same suite bytes
// inside each snapshot without changing the original checkout or baseline worktree.
import { copyFileSync, cpSync, existsSync, linkSync, mkdirSync, readFileSync, readdirSync, readlinkSync, rmSync, symlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROFILE = "quality-only-v1";
const EVAL_DIRECTORY = "agentic-quality-evals";
const entries = (dir) => readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

function scalar(frontmatter, key, file) {
  const matches = frontmatter.split("\n").filter((line) => new RegExp(`^${key}[ \\t]*:`).test(line));
  if (matches.length !== 1) throw new Error(`${file}: expected one top-level ${key} field`);
  const value = matches[0].slice(matches[0].indexOf(":") + 1).trim();
  const parsed = /^(?:"([^"\\]*)"|'((?:[^']|'')*)'|([A-Za-z_][A-Za-z0-9_.:-]*))\s*(?:#.*)?$/.exec(value);
  if (!parsed) throw new Error(`${file}: unsupported ${key} syntax; use a plain or quoted scalar`);
  return parsed[1] ?? parsed[2]?.replaceAll("''", "'") ?? parsed[3];
}

function isAgentBudget(file) {
  const text = readFileSync(file, "utf8");
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)?.[1]?.replaceAll("\r\n", "\n");
  if (frontmatter == null) throw new Error(`${file}: missing grader frontmatter`);
  return scalar(frontmatter, "type", file) === "tool_used" && scalar(frontmatter, "tool", file) === "Agent";
}

export function prepareQualitySuite(source, destination) {
  mkdirSync(destination);
  cpSync(source, destination, { recursive: true, dereference: true,
    filter: (file) => path.relative(source, file).split(path.sep)[0] !== "results" });
  const excludedGraders = [];
  let caseCount = 0;
  function visit(dir, relative = "") {
    if (existsSync(path.join(dir, "prompt.md")) || existsSync(path.join(dir, "case.yaml"))) {
      caseCount++;
      const yaml = path.join(dir, "case.yaml");
      if (existsSync(yaml) && /^graders[ \t]*:/m.test(readFileSync(yaml, "utf8"))) {
        throw new Error(`${relative || "."}: inline case.yaml graders are not supported by ${PROFILE}; use graders/*.md`);
      }
      const graderDir = path.join(dir, "graders");
      const graders = existsSync(graderDir) ? entries(graderDir).filter((entry) => entry.isFile() && entry.name.endsWith(".md")) : [];
      let retained = 0;
      for (const entry of graders) {
        const file = path.join(graderDir, entry.name);
        if (isAgentBudget(file)) {
          excludedGraders.push(relative + "graders/" + entry.name);
          rmSync(file);
        } else retained++;
      }
      if (!retained) throw new Error(`${relative.replace(/\/$/, "") || "."}: no remaining quality graders after excluding Agent budgets`);
      return; // Native case discovery does not treat a case's fixture folders as other cases.
    }
    for (const entry of entries(dir)) if (entry.isDirectory()) visit(path.join(dir, entry.name), relative + entry.name + "/");
  }
  visit(destination);
  if (!caseCount) throw new Error("no eval cases found for quality comparison");
  const hash = createHash("sha256");
  function hashFiles(dir, relative = "") {
    for (const entry of entries(dir)) {
      const rel = relative + entry.name, file = path.join(dir, entry.name);
      if (entry.isDirectory()) hashFiles(file, rel + "/");
      else hash.update(rel + "\0").update(readFileSync(file)).update("\0");
    }
  }
  hashFiles(destination);
  return { comparisonProfile: PROFILE, excludedGraders: excludedGraders.sort(), suiteDigest: hash.digest("hex") };
}

function copyPlugin(source, destination, temporaryRoot) {
  // A recursive walk also handles TMPDIR inside the checkout: never copy our own temp tree.
  // Retain local/ignored plugin inputs and deletions from the working tree snapshot.
  function copy(dir, output, top = false) {
    mkdirSync(output);
    for (const entry of entries(dir)) {
      const file = path.join(dir, entry.name), target = path.join(output, entry.name);
      if (file === temporaryRoot || (top && [".git", "evals"].includes(entry.name))) continue;
      if (entry.isDirectory()) copy(file, target);
      else if (entry.isSymbolicLink()) symlinkSync(readlinkSync(file), target);
      else if (entry.isFile()) copyFileSync(file, target);
      else throw new Error(`${file}: unsupported plugin input type`);
    }
  }
  copy(source, destination, true);
}

function exposeSuite(source, destination) {
  mkdirSync(destination);
  for (const entry of entries(source)) {
    const file = path.join(source, entry.name), target = path.join(destination, entry.name);
    if (entry.isDirectory()) exposeSuite(file, target);
    else linkSync(file, target);
  }
}

export function prepareComparison(root, temporaryRoot) {
  root = path.resolve(root);
  temporaryRoot = path.resolve(temporaryRoot);
  if (root === temporaryRoot) throw new Error("comparison temporary directory must differ from the checkout");
  const suite = path.join(temporaryRoot, "quality-suite");
  const profile = prepareQualitySuite(path.join(root, "evals"), suite);
  for (const [side, source] of [["before", path.join(temporaryRoot, "baseline")], ["after", root]]) {
    const target = path.join(temporaryRoot, side);
    copyPlugin(source, target, temporaryRoot);
    exposeSuite(suite, path.join(target, EVAL_DIRECTORY));
  }
  return { ...profile, evalDirectory: EVAL_DIRECTORY };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [root, temporaryRoot, ...extra] = process.argv.slice(2);
    if (!root || !temporaryRoot || extra.length) throw new Error("Usage: node evals/prepare-quality-suite.mjs <checkout> <temporary-directory-with-baseline-worktree>");
    console.log(JSON.stringify(prepareComparison(root, temporaryRoot)));
  } catch (error) {
    console.error(`quality suite: ${error.message}`);
    process.exitCode = 1;
  }
}
