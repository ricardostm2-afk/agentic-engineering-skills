// Exercise the comparison wrapper with a local CLI double: no model calls or credentials.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";

const SCRIPT = path.join(import.meta.dirname, "..", "evals", "compare.sh");
const PREPARE = path.join(import.meta.dirname, "..", "evals", "prepare-quality-suite.mjs");
const GRADERS = {
  "01-outcome.md": "---\ntype: llm\nfocus: trace\n---\nPASS for the requested behavior.\n",
  "02-budget.md": "---\ntype: tool_used\ntool: Agent\nmin: 0\nmax: 0\n---\n",
  "03-routing.md": "---\ntype: tool_used\ntool: Skill\n---\n",
  "04-verification.md": "---\ntype: tool_used\ntool: Bash\n---\n",
  "05-code.md": "---\ntype: regex\npattern: 'correct'\n---\nA rubric mentioning type: tool_used and tool: Agent is retained.\n",
};

function snapshot(dir) {
  const files = {};
  function visit(folder, relative = "") {
    for (const entry of readdirSync(folder, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
      const name = relative + entry.name, full = path.join(folder, entry.name);
      if (name === "results") continue;
      if (entry.isDirectory()) visit(full, name + "/");
      else files[name] = readFileSync(full, "utf8");
    }
  }
  visit(dir);
  return files;
}

function digest(files) {
  const hash = createHash("sha256");
  for (const [name, contents] of Object.entries(files)) hash.update(name + "\0").update(contents).update("\0");
  return hash.digest("hex");
}

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "eval-compare-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, "repo"), bin = path.join(root, "bin"), home = path.join(root, "home");
  for (const dir of [path.join(repo, "evals"), bin, home]) mkdirSync(dir, { recursive: true });
  copyFileSync(SCRIPT, path.join(repo, "evals", "compare.sh"));
  if (existsSync(PREPARE)) copyFileSync(PREPARE, path.join(repo, "evals", "prepare-quality-suite.mjs"));
  mkdirSync(path.join(repo, "evals", "case-a", "graders"), { recursive: true });
  writeFileSync(path.join(repo, "evals", "case-a", "prompt.md"), "---\nruns: 2\n---\nPerform the task.\n");
  for (const [name, contents] of Object.entries(GRADERS)) writeFileSync(path.join(repo, "evals", "case-a", "graders", name), contents);
  writeFileSync(path.join(repo, ".gitignore"), "evals/results/\nignored.txt\n");
  writeFileSync(path.join(repo, "skill.txt"), "before\n");
  writeFileSync(path.join(repo, "evals", "case.txt"), "same cases\n");
  writeFileSync(path.join(bin, "claude"), `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
if (process.argv[2] === "--version") { console.log("fake-claude 2.1.299"); process.exit(0); }
const side = path.basename(process.cwd()) === "before" ? "before" : "after";
const args = process.argv.slice(2);
const evalDirectory = args.includes("--eval-dir") ? args[args.indexOf("--eval-dir") + 1] : "evals";
const graders = Object.fromEntries(fs.readdirSync(path.join(evalDirectory, "case-a/graders")).sort().map(name => [name, fs.readFileSync(path.join(evalDirectory, "case-a/graders", name), "utf8")]));
const run = { side, args, effort: process.env.CLAUDE_CODE_EFFORT_LEVEL || null,
  cases: fs.readFileSync(path.join(evalDirectory, "case.txt"), "utf8"), graders,
  skill: fs.readFileSync("skill.txt", "utf8"),
  localInput: fs.existsSync("ignored.txt") ? fs.readFileSync("ignored.txt", "utf8") : null,
  copiedResults: fs.existsSync(path.join(evalDirectory, "results/previous.txt")),
  hasOriginalEvals: evalDirectory !== "evals" && fs.existsSync("evals") };
fs.appendFileSync(process.env.COMPARE_CALLS, JSON.stringify(run) + "\\n");
if (side === "before" && process.env.MUTATE_SOURCE) {
  fs.writeFileSync(path.join(process.env.SOURCE_REPO, "evals/case.txt"), "changed during run\\n");
  fs.writeFileSync(path.join(process.env.SOURCE_REPO, "skill.txt"), "changed during run\\n");
}
console.log(JSON.stringify({ schemaVersion: 1, side, partial: false, cases: [] }));
console.error(side + " diagnostic");
process.exitCode = Number(process.env[side.toUpperCase() + "_STATUS"] || 0);
`);
  chmodSync(path.join(bin, "claude"), 0o755);
  const env = { ...process.env, HOME: home, PATH: `${bin}${path.delimiter}${process.env.PATH}`,
    GIT_CONFIG_GLOBAL: path.join(root, "gitconfig"), GIT_CONFIG_NOSYSTEM: "1",
    GIT_AUTHOR_NAME: "test", GIT_AUTHOR_EMAIL: "test@example.test", GIT_COMMITTER_NAME: "test", GIT_COMMITTER_EMAIL: "test@example.test",
    EVAL_MODEL: "fixed-model", COMPARE_CALLS: path.join(root, "calls.jsonl"), SOURCE_REPO: repo };
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
  assert.equal(metadata.comparisonProfile, "quality-only-v1");
  assert.deepEqual(metadata.excludedGraders, ["case-a/graders/02-budget.md"]);
  assert.equal(metadata.suiteSnapshot, "effective-suite");
  assert.equal(metadata.suiteDigest, digest(snapshot(path.join(dir, metadata.suiteSnapshot))));
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
  for (const arg of ["--model", "--model=another", "--judge-model=another", "--json", "--output-dir=elsewhere", "--eval-dir", "--eval-dir=other", "--"]) {
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

test("both sides use the same explicit quality suite and keep original sources intact", (t) => {
  const f = fixture(t), original = snapshot(path.join(f.repo, "evals"));
  const sourceStatus = f.git("status", "--porcelain");
  const beforeTree = f.git("ls-tree", "-r", f.beforeSha);
  const run = f.run();
  assert.equal(run.status, 0, run.stderr);
  const calls = f.calls();
  const expected = { ...GRADERS }; delete expected["02-budget.md"];
  for (const call of calls) {
    assert.equal(call.args.filter((arg) => arg === "--eval-dir").length, 1);
    assert.equal(call.args[call.args.indexOf("--eval-dir") + 1], "agentic-quality-evals");
    assert.deepEqual(call.graders, expected, "only the Agent budget is removed; Skill and Bash remain");
    assert.equal(call.hasOriginalEvals, false, "unfiltered graders cannot leak from the default evals folder");
  }
  assert.deepEqual(calls.map((call) => call.skill), ["before\n", "after\n"]);
  assert.deepEqual(snapshot(path.join(f.repo, "evals")), original);
  assert.equal(f.git("status", "--porcelain"), sourceStatus);
  assert.equal(f.git("ls-tree", "-r", f.beforeSha), beforeTree);
});

test("the candidate and common suite stay frozen if originals change between native runs", (t) => {
  const f = fixture(t);
  writeFileSync(path.join(f.repo, "evals/case.txt"), "current cases\n");
  writeFileSync(path.join(f.repo, "skill.txt"), "working candidate\n");
  writeFileSync(path.join(f.repo, "ignored.txt"), "local input\n");
  const run = f.run({ MUTATE_SOURCE: "1" });
  assert.equal(run.status, 0, run.stderr);
  const calls = f.calls();
  assert.deepEqual(calls.map((call) => call.cases), ["current cases\n", "current cases\n"]);
  assert.deepEqual(calls.map((call) => call.skill), ["before\n", "working candidate\n"]);
  assert.equal(calls[1].localInput, "local input\n");
  assert.equal(readFileSync(path.join(f.repo, "evals/case.txt"), "utf8"), "changed during run\n", "double really changed the original");
  const { dir, metadata } = f.output();
  assert.equal(readFileSync(path.join(dir, metadata.suiteSnapshot, "case.txt"), "utf8"), "current cases\n");
});

test("quality preparation rejects a case left with only an Agent budget before any native run", (t) => {
  const f = fixture(t);
  for (const name of Object.keys(GRADERS).filter((name) => name !== "02-budget.md")) rmSync(path.join(f.repo, "evals/case-a/graders", name));
  const original = snapshot(path.join(f.repo, "evals"));
  const run = f.run();
  assert.equal(run.status, 1, run.stdout + run.stderr);
  assert.match(run.stderr, /case-a.*no remaining quality graders/);
  assert.deepEqual(f.calls(), []);
  assert.deepEqual(snapshot(path.join(f.repo, "evals")), original);
});

test("quality preparation handles quoted budget metadata and does not remove a different tool", (t) => {
  const f = fixture(t);
  writeFileSync(path.join(f.repo, "evals/case-a/graders/02-budget.md"), "---\r\ntype: 'tool_used' # exact type\r\ntool: \"Agent\" # budget\r\n---\r\n");
  writeFileSync(path.join(f.repo, "evals/case-a/graders/06-other.md"), "---\ntype: tool_used\ntool: AgentOther\n---\n");
  const run = f.run();
  assert.equal(run.status, 0, run.stderr);
  for (const call of f.calls()) {
    assert.equal(call.graders["02-budget.md"], undefined);
    assert.ok(call.graders["06-other.md"]);
  }
});

test("quality preparation fails clearly for inline graders it cannot classify", (t) => {
  const f = fixture(t);
  writeFileSync(path.join(f.repo, "evals/case-a/case.yaml"), 'schema_version: "1.1"\nname: case-a\ngraders:\n  - name: inline-budget\n    type: tool_used\n    tool: Agent\n');
  const run = f.run();
  assert.equal(run.status, 1, run.stdout + run.stderr);
  assert.match(run.stderr, /inline case.yaml graders.*use graders\/\*\.md/);
  assert.deepEqual(f.calls(), []);
});

test("quality profile rejects quoted/escaped keys, flow roots and structural aliases", (t) => {
  const header = 'schema_version: "1.1"\nname: case-a\n';
  const budget = '[{name: budget, type: tool_used, tool: Agent, max: 0}]';
  const variants = {
    "double-quoted graders key": header + '"graders": ' + budget + '\n',
    "single-quoted graders key": header + "'graders': " + budget + '\n',
    "Unicode-escaped graders key": header + String.raw`"gra\u0064ers": ` + budget + '\n',
    "hex-escaped graders key": header + String.raw`"gra\x64ers": ` + budget + '\n',
    "JSON root": JSON.stringify({ schema_version: "1.1", name: "case-a", graders: [{ name: "budget", type: "tool_used", tool: "Agent", max: 0 }] }),
    "flow mapping root": '{schema_version: "1.1", name: case-a, graders: ' + budget + '}\n',
    "merge alias": header + 'defaults: &defaults\n  graders: ' + budget + '\n<<: *defaults\n',
    "quoted merge key": header + 'defaults: &defaults\n  graders: ' + budget + '\n"<<": *defaults\n',
    "root anchor": '&case\n' + header + 'graders: ' + budget + '\n',
    "tagged mapping": '!!map\n' + header + 'graders: ' + budget + '\n',
    "second document": header + '---\nname: another-case\ngraders: ' + budget + '\n',
    "carriage-return boundary hidden after literal text": header + 'expected_outcome: |\n  Safe text\rgraders:\r  - name: budget\r    type: tool_used\r    tool: Agent\r',
  };
  for (const [name, yaml] of Object.entries(variants)) {
    const f = fixture(t);
    writeFileSync(path.join(f.repo, "evals/case-a/case.yaml"), yaml);
    const run = f.run();
    assert.equal(run.status, 1, `${name}: ${run.stdout}\n${run.stderr}`);
    assert.match(run.stderr, /single block mapping.*graders\/\*\.md/, name);
    assert.deepEqual(f.calls(), [], name + ": no native eval before a profile is established");
  }
});

test("quality profile accepts the case format with literal outcome text and scalar context", (t) => {
  const f = fixture(t);
  writeFileSync(path.join(f.repo, "evals/case-a/case.yaml"), 'schema_version: "1.1"\nname: case-a\nexpected_outcome: |\n  Text can mention "graders":, &anchors and *aliases without defining YAML structure.\ncontext:\n  scaffold_script: place-fixture.sh\n');
  const run = f.run();
  assert.equal(run.status, 0, run.stderr);
  assert.equal(f.output().metadata.comparisonProfile, "quality-only-v1");
});

test("repository-local temporary directories do not recurse into snapshots or mark the source dirty", (t) => {
  const f = fixture(t), localTemp = path.join(f.repo, "local-tmp");
  mkdirSync(localTemp);
  const run = f.run({ TMPDIR: localTemp });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(f.output().metadata.afterDirty, false);
  assert.deepEqual(readdirSync(localTemp), [], "comparison temporary tree was removed");
});
