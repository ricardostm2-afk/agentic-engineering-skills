// Exercise the comparison wrapper with a local CLI double: no model calls or credentials.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SCRIPT = path.join(import.meta.dirname, "..", "evals", "compare.sh");

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "eval-compare-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, "repo"), bin = path.join(root, "bin"), home = path.join(root, "home");
  for (const dir of [path.join(repo, "evals"), bin, home]) mkdirSync(dir, { recursive: true });
  copyFileSync(SCRIPT, path.join(repo, "evals", "compare.sh"));
  writeFileSync(path.join(repo, ".gitignore"), "evals/results/\nignored.txt\n");
  writeFileSync(path.join(repo, "skill.txt"), "before\n");
  writeFileSync(path.join(repo, "evals", "case.txt"), "same cases\n");
  writeFileSync(path.join(bin, "claude"), `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
if (process.argv[2] === "--version") { console.log("fake-claude 2.1.299"); process.exit(0); }
const side = path.basename(process.cwd()) === "before" ? "before" : "after";
const args = process.argv.slice(2);
const run = { side, args, effort: process.env.CLAUDE_CODE_EFFORT_LEVEL || null,
  cases: fs.readFileSync("evals/case.txt", "utf8"),
  copiedResults: fs.existsSync("evals/results/previous.txt") };
fs.appendFileSync(process.env.COMPARE_CALLS, JSON.stringify(run) + "\\n");
console.log(JSON.stringify({ schemaVersion: 1, side, partial: false, cases: [] }));
console.error(side + " diagnostic");
process.exitCode = Number(process.env[side.toUpperCase() + "_STATUS"] || 0);
`);
  chmodSync(path.join(bin, "claude"), 0o755);
  const env = { ...process.env, HOME: home, PATH: `${bin}${path.delimiter}${process.env.PATH}`,
    GIT_CONFIG_GLOBAL: path.join(root, "gitconfig"), GIT_CONFIG_NOSYSTEM: "1",
    GIT_AUTHOR_NAME: "test", GIT_AUTHOR_EMAIL: "test@example.test", GIT_COMMITTER_NAME: "test", GIT_COMMITTER_EMAIL: "test@example.test",
    EVAL_MODEL: "fixed-model", COMPARE_CALLS: path.join(root, "calls.jsonl") };
  delete env.EVAL_RESULTS_DIR;
  delete env.EVAL_JUDGE_MODEL;
  delete env.EVAL_EFFORT;
  delete env.CLAUDE_CODE_EFFORT_LEVEL;
  writeFileSync(env.GIT_CONFIG_GLOBAL, "");
  const git = (...args) => execFileSync("git", args, { cwd: repo, env, encoding: "utf8" });
  git("init", "-q", "-b", "main");
  git("add", ".");
  git("commit", "-qm", "baseline");
  const beforeSha = git("rev-parse", "HEAD").trim();
  writeFileSync(path.join(repo, "skill.txt"), "after\n");
  git("add", "skill.txt");
  git("commit", "-qm", "candidate");
  const run = (extra = {}, args = []) => spawnSync("bash", [path.join(repo, "evals", "compare.sh"), beforeSha, ...args], {
    cwd: repo, env: { ...env, ...extra }, encoding: "utf8",
  });
  const calls = () => existsSync(env.COMPARE_CALLS) ? readFileSync(env.COMPARE_CALLS, "utf8").trim().split("\n").map(JSON.parse) : [];
  const output = (base = path.join(repo, "evals", "results")) => {
    const dirs = readdirSync(base).filter((name) => name.startsWith("compare."));
    assert.equal(dirs.length, 1, `one saved comparison in ${base}`);
    const dir = path.join(base, dirs[0]);
    return { dir, metadata: JSON.parse(readFileSync(path.join(dir, "metadata.json"), "utf8")) };
  };
  return { root, repo, git, run, calls, output, beforeSha };
}

test("comparison saves both JSON reports, diagnostics and pinned run metadata", (t) => {
  const f = fixture(t);
  mkdirSync(path.join(f.repo, "evals", "results"));
  writeFileSync(path.join(f.repo, "evals", "results", "previous.txt"), "prior output\n");
  const run = f.run({ EVAL_JUDGE_MODEL: "fixed-judge", EVAL_EFFORT: "medium" }, ["--runs", "1"]);
  assert.equal(run.status, 0, run.stderr);
  assert.doesNotMatch(run.stdout, /uncommitted/);
  const calls = f.calls();
  assert.deepEqual(calls.map((call) => call.side), ["before", "after"]);
  for (const call of calls) {
    assert.equal(call.args[call.args.indexOf("--model") + 1], "fixed-model");
    assert.equal(call.args[call.args.indexOf("--judge-model") + 1], "fixed-judge");
    assert.equal(call.effort, "medium");
    assert.equal(call.args.at(-1), "--json");
    assert.equal(call.cases, "same cases\n");
  }
  assert.equal(calls[0].copiedResults, false);
  const { dir, metadata } = f.output();
  assert.equal(metadata.schemaVersion, 1);
  assert.equal(metadata.model, "fixed-model");
  assert.equal(metadata.judgeModel, "fixed-judge");
  assert.equal(metadata.effort, "medium");
  assert.equal(metadata.beforeSha, f.beforeSha);
  assert.equal(metadata.afterSha, f.git("rev-parse", "HEAD").trim());
  assert.equal(metadata.beforeDirty, false);
  assert.equal(metadata.afterDirty, false);
  assert.deepEqual(metadata.statuses, { before: 0, after: 0 });
  assert.deepEqual(metadata.extraOptions, ["--runs", "1"]);
  assert.match(metadata.suiteDigest, /^[0-9a-f]{64}$/);
  assert.equal(metadata.claudeVersion, "fake-claude 2.1.299");
  for (const side of ["before", "after"]) {
    assert.equal(JSON.parse(readFileSync(path.join(dir, `${side}.json`), "utf8")).side, side);
    assert.equal(readFileSync(path.join(dir, `${side}.stderr.log`), "utf8"), `${side} diagnostic\n`);
  }
  assert.equal(f.git("worktree", "list", "--porcelain").match(/^worktree /gm).length, 1, "temporary worktree was removed");
});

for (const statuses of [{ before: 1, after: 0 }, { before: 0, after: 2 }, { before: 1, after: 2 }]) {
  test(`comparison fails overall and keeps both native statuses ${JSON.stringify(statuses)}`, (t) => {
    const f = fixture(t);
    const run = f.run({ BEFORE_STATUS: String(statuses.before), AFTER_STATUS: String(statuses.after) });
    assert.equal(run.status, 1, run.stdout + run.stderr);
    assert.deepEqual(f.calls().map((call) => call.side), ["before", "after"]);
    assert.deepEqual(f.output().metadata.statuses, statuses);
    assert.match(run.stderr, /diagnostic/);
  });
}

for (const kind of ["unstaged", "staged", "untracked", "ignored"]) {
  test(`comparison labels only the working candidate dirty for ${kind} changes`, (t) => {
    const f = fixture(t);
    const name = kind === "untracked" ? "new.txt" : kind === "ignored" ? "ignored.txt" : "skill.txt";
    writeFileSync(path.join(f.repo, name), "local change\n");
    if (kind === "staged") f.git("add", name);
    const run = f.run();
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /^=== before \([^)]+\)$/m);
    assert.doesNotMatch(run.stdout, /^=== before .*uncommitted/m);
    assert.match(run.stdout, /^=== after .*\+ uncommitted/m);
    const { metadata } = f.output();
    assert.equal(metadata.beforeDirty, false);
    assert.equal(metadata.afterDirty, true);
  });
}

test("comparison requires the model and rejects options that replace its pinned outputs or models", (t) => {
  const f = fixture(t);
  const missing = f.run({ EVAL_MODEL: "" });
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /EVAL_MODEL/);
  for (const arg of ["--model", "--model=another", "--judge-model=another", "--json", "--output-dir=elsewhere", "--eval-dir=other", "--"]) {
    const run = f.run({}, [arg]);
    assert.equal(run.status, 2, `${arg}: ${run.stderr}`);
  }
  assert.deepEqual(f.calls(), []);
});

test("comparison supports a separate results directory and defaults judge to the explicit model", (t) => {
  const f = fixture(t);
  const output = path.join(f.root, "saved results");
  const run = f.run({ EVAL_RESULTS_DIR: output });
  assert.equal(run.status, 0, run.stderr);
  const { metadata } = f.output(output);
  assert.equal(metadata.judgeModel, "fixed-model");
  assert.equal(metadata.effort, null);
});
