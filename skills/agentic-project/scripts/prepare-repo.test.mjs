// Tests for prepare-repo.sh and its generated pre-commit (node --test scripts/*.test.mjs,
// from the skill folder; leave the glob unquoted).
// Hermetic: each test creates a temporary repository (os.tmpdir(), honoring TMPDIR), with
// its own HOME (no user skills or plugins) and no global git configuration.
// The slop detector is a simple double (blocks lines containing "SLOP", unless the previous
// line contains "slop-ok:"); a separate test uses the real neighboring agentic-design detector.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, existsSync, rmSync, copyFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, "prepare-repo.sh");
const REAL_DETECTOR = [process.env.AGENTIC_DESIGN_DIR, path.join(HERE, "..", "..", "agentic-design")]
  .filter(Boolean)
  .map((d) => path.join(d, "scripts", "detect-slop.mjs"))
  .find((f) => existsSync(f));

const DOUBLE = `import { readFileSync } from "node:fs";
const files = process.argv.slice(2).filter((a) => a !== "--json");
const findings = [];
for (const f of files) {
  const lines = readFileSync(f, "utf8").split("\\n");
  lines.forEach((l, i) => {
    if (l.includes("SLOP") && !(lines[i - 1] || "").includes("slop-ok:"))
      findings.push({ file: f, line: i + 1, rule: "double", severity: "blocker", message: "SLOP", suggestion: "remove it" });
  });
}
const summary = { files: files.length, blockers: findings.length, notices: 0, byRule: {} };
process.stdout.write(JSON.stringify({ summary, findings }));
process.exitCode = findings.length ? 1 : 0;
`;

function environment(root) {
  const home = path.join(root, "home");
  mkdirSync(home, { recursive: true });
  const env = { ...process.env, HOME: home, GIT_CONFIG_GLOBAL: path.join(root, "empty-gitconfig"), GIT_CONFIG_NOSYSTEM: "1",
    GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
  delete env.AGENTIC_DESIGN_DIR;
  delete env.CLAUDE_CONFIG_DIR;
  writeFileSync(env.GIT_CONFIG_GLOBAL, "");
  return env;
}

function newRepo(t) {
  const root = mkdtempSync(path.join(tmpdir(), "prepare-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repo = path.join(root, "repo");
  mkdirSync(repo);
  const env = environment(root);
  const git = (...a) => execFileSync("git", a, { cwd: repo, env, encoding: "utf8" });
  const sh = (args, extra = {}) => spawnSync("bash", [SCRIPT, ...args], { cwd: repo, env: { ...env, ...extra }, encoding: "utf8" });
  // Git sends hook output to stderr: "out" combines both streams.
  const commit = (msg, extra = {}) => {
    const p = spawnSync("git", ["commit", "-qm", msg], { cwd: repo, env: { ...env, ...extra }, encoding: "utf8" });
    return { status: p.status, out: p.stdout + p.stderr };
  };
  const write = (rel, txt) => { mkdirSync(path.dirname(path.join(repo, rel)), { recursive: true }); writeFileSync(path.join(repo, rel), txt); };
  return { root, repo, env, git, sh, commit, write };
}

// Install hooks after committing existing CSS with SLOP. Seed data never bypasses a hook.
function repoWithHooks(t, { versioned = true, detector = DOUBLE, seed = {} } = {}) {
  const r = newRepo(t);
  r.git("init", "-q", "-b", "main");
  r.write("src/legacy.css", ".a { x: SLOP; }\n.b { color: var(--x); }\n");
  r.write("src/escaped.css", "/* slop-ok: approved by the owner, D-001 */\n.c { x: SLOP; }\n");
  for (const [file, text] of Object.entries(seed)) r.write(file, text);
  r.git("add", "src");
  r.git("commit", "-qm", "base");
  assert.equal(r.sh(["--apply", "--dir", r.repo]).status, 0);
  if (versioned) {
    r.write(".agentic/detect-slop.mjs", detector);
    r.git("add", ".agentic/detect-slop.mjs");
    r.git("commit", "-qm", "detector");
  }
  return r;
}

test("--show prints the current hook with its version marker; unknown name exits 2", () => {
  const ok = spawnSync("bash", [SCRIPT, "--show", "pre-commit"], { encoding: "utf8" });
  assert.equal(ok.status, 0);
  assert.match(ok.stdout, /^#!\/usr\/bin\/env bash/);
  assert.match(ok.stdout, /agentic-project:pre-commit:3/);
  assert.equal(spawnSync("bash", ["-n"], { input: ok.stdout }).status, 0, "generated hook has valid bash syntax");
  assert.equal(spawnSync("bash", [SCRIPT, "--show", "unknown"], { encoding: "utf8" }).status, 2);
});

test("dry run changes nothing; --apply creates; a second run has nothing left to do", (t) => {
  const r = newRepo(t);
  const sim = r.sh(["--dir", r.repo]);
  assert.equal(sim.status, 0);
  assert.match(sim.stdout, /would create\s+\.githooks\/pre-commit/);
  assert.ok(!existsSync(path.join(r.repo, ".git")), "dry run did not run git init");
  assert.equal(r.sh(["--apply", "--dir", r.repo]).status, 0);
  assert.equal(r.git("config", "--get", "core.hooksPath").trim(), ".githooks");
  assert.match(readFileSync(path.join(r.repo, ".gitignore"), "utf8"), /^\.claude\/settings\.local\.json$/m);
  const areas = JSON.parse(readFileSync(path.join(r.repo, ".agentic/areas.json"), "utf8"));
  assert.equal(areas.areas[0].risk, "medium");
  assert.deepEqual(areas.areas[0].folders, ["src/example/"]);
  assert.match(r.sh(["--dir", r.repo]).stdout, /nothing to do, the repository is already prepared/);
});

test("warnings count as pending: .gitignore without .env and pre-commit without detector", (t) => {
  const r = newRepo(t);
  r.git("init", "-q", "-b", "main");
  r.write(".gitignore", "node_modules/\n");
  r.write(".githooks/pre-commit", "#!/bin/sh\nexit 0\n");
  const out = r.sh(["--dir", r.repo]).stdout;
  assert.match(out, /warning\s+\.gitignore lacks the '\.env' line/);
  assert.match(out, /warning\s+\.githooks\/pre-commit does not run detect-slop/);
  assert.match(out, /Pending: 2 item\(s\)/);
  assert.doesNotMatch(out, /already prepared/);
  // Without UI, the n/a line closes the detector warning.
  r.write(".githooks/pre-commit", "#!/bin/sh\n# detect-slop: n/a (no UI, D-001)\nexit 0\n");
  assert.match(r.sh(["--dir", r.repo]).stdout, /Pending: 1 item\(s\)/);
});

test("pre-commit from an older version (no marker) produces a pending warning", (t) => {
  const r = newRepo(t);
  r.git("init", "-q", "-b", "main");
  const current = spawnSync("bash", [SCRIPT, "--show", "pre-commit"], { encoding: "utf8" }).stdout;
  r.write(".githooks/pre-commit", current.replace("agentic-project:pre-commit:3", "old-version"));
  const out = r.sh(["--dir", r.repo]).stdout;
  assert.match(out, /comes from an older version/);
  assert.match(out, /Pending: 1 item\(s\)/);
});

test("hook: an old blocker on an untouched line allows the commit and appears as Pre-existing", (t) => {
  const r = repoWithHooks(t);
  r.write("src/legacy.css", ".a { x: SLOP; }\n.b { color: var(--y); }\n");
  r.git("add", "src/legacy.css");
  const c = r.commit("change line 2");
  assert.equal(c.status, 0, c.out);
  assert.match(c.out, /src\/legacy\.css:1\s+Pre-existing/);
  assert.match(c.out, /0 blocker\(s\) on changed lines, 1 Pre-existing/);
});

test("hook: a blocker on an added line stops the commit", (t) => {
  const r = repoWithHooks(t);
  appendFileSync(path.join(r.repo, "src/legacy.css"), ".d { x: SLOP; }\n");
  r.git("add", "src/legacy.css");
  const c = r.commit("add slop");
  assert.equal(c.status, 1);
  assert.match(c.out, /src\/legacy\.css:3\s+blocker/);
  assert.match(c.out, /FAILED: detect-slop/);
});

test("hook: removing slop-ok above an old line exposes it and blocks", (t) => {
  const r = repoWithHooks(t);
  r.write("src/escaped.css", ".c { x: SLOP; }\n");
  r.git("add", "src/escaped.css");
  const c = r.commit("remove escape");
  assert.equal(c.status, 1, c.out);
  assert.match(c.out, /src\/escaped\.css:1\s+blocker/);
});

test("hook: a missing versioned copy fails closed; without a versioned copy it only warns", (t) => {
  const r = repoWithHooks(t);
  rmSync(path.join(r.repo, ".agentic/detect-slop.mjs"));
  appendFileSync(path.join(r.repo, "src/legacy.css"), ".e { color: blue; }\n");
  r.git("add", "src/legacy.css");
  const c = r.commit("without detector");
  assert.equal(c.status, 1);
  assert.match(c.out, /FAILED: detect-slop: detect-slop\.mjs not found/);

  const s = repoWithHooks(t, { versioned: false });
  appendFileSync(path.join(s.repo, "src/legacy.css"), ".e { color: blue; }\n");
  s.git("add", "src/legacy.css");
  const d = s.commit("without detector or copy");
  assert.equal(d.status, 0, d.out);
  assert.match(d.out, /WARNING: detect-slop\.mjs not found.*UI NOT checked/);
});

test("hook: finds the detector in $AGENTIC_DESIGN_DIR", (t) => {
  const r = repoWithHooks(t, { versioned: false });
  const design = path.join(r.root, "design");
  mkdirSync(path.join(design, "scripts"), { recursive: true });
  writeFileSync(path.join(design, "scripts", "detect-slop.mjs"), DOUBLE);
  r.write("src/new.css", ".f { x: SLOP; }\n");
  r.git("add", "src/new.css");
  const c = r.commit("new slop", { AGENTIC_DESIGN_DIR: design });
  assert.equal(c.status, 1);
  assert.match(c.out, /src\/new\.css:1\s+blocker/);
});

test("--with-ui copies detector and rules; a copy that differs from the skill produces a warning", (t) => {
  const r = newRepo(t);
  const design = path.join(r.root, "design");
  mkdirSync(path.join(design, "scripts"), { recursive: true });
  mkdirSync(path.join(design, "references"), { recursive: true });
  writeFileSync(path.join(design, "scripts", "detect-slop.mjs"), DOUBLE);
  writeFileSync(path.join(design, "references", "ui-without-slop.md"), "# Rules\n");
  // Isolated script: no sibling and no skills in the test HOME.
  const isolated = path.join(r.root, "isolated", "agentic-project", "scripts");
  mkdirSync(isolated, { recursive: true });
  copyFileSync(SCRIPT, path.join(isolated, "prepare-repo.sh"));
  const missing = spawnSync("bash", [path.join(isolated, "prepare-repo.sh"), "--with-ui", "--dir", r.repo], { cwd: r.repo, env: r.env, encoding: "utf8" });
  assert.match(missing.stdout, /--with-ui: agentic-design not found/);
  const applied = r.sh(["--apply", "--with-ui", "--dir", r.repo], { AGENTIC_DESIGN_DIR: design });
  assert.equal(applied.status, 0);
  assert.equal(readFileSync(path.join(r.repo, ".agentic/ui-without-slop.md"), "utf8"), "# Rules\n");
  appendFileSync(path.join(design, "references", "ui-without-slop.md"), "new rule\n");
  const again = r.sh(["--dir", r.repo], { AGENTIC_DESIGN_DIR: design });
  assert.match(again.stdout, /warning\s+\.agentic\/ui-without-slop\.md differs from installed agentic-design/);
});

test("hook: detector double reports zero notices, never undefined", (t) => {
  const r = repoWithHooks(t);
  r.write("src/clean.css", ".clean { color: var(--text); }\n");
  r.git("add", "src/clean.css");
  const c = r.commit("clean CSS");
  assert.equal(c.status, 0, c.out);
  assert.match(c.out, /0 notice\(s\)\./);
  assert.doesNotMatch(c.out, /undefined/);
});

test("hook with real agentic-design detector: old 10px passes, new 9px blocks", { skip: REAL_DETECTOR ? false : "agentic-design is not beside this skill or in $AGENTIC_DESIGN_DIR" }, (t) => {
  const r = repoWithHooks(t, { detector: readFileSync(REAL_DETECTOR, "utf8"), seed: { "src/screen.css": ".a { font-size: 10px; }\n" } });
  appendFileSync(path.join(r.repo, "src/screen.css"), ".b { color: #123456; }\n");
  r.git("add", "src/screen.css");
  const ok = r.commit("change another line");
  assert.equal(ok.status, 0, ok.out);
  assert.match(ok.out, /src\/screen\.css:1\s+Pre-existing\s+small-text/);
  assert.match(ok.out, /1 file\(s\) analyzed: 0 blocker\(s\) on changed lines, 1 Pre-existing, 1 notice\(s\)\./);
  appendFileSync(path.join(r.repo, "src/screen.css"), ".c { font-size: 9px; }\n");
  r.git("add", "src/screen.css");
  const bad = r.commit("new small font");
  assert.equal(bad.status, 1);
  assert.match(bad.out, /src\/screen\.css:3\s+blocker\s+small-text/);
});

test("hook: finds the detector in ~/.agents/skills (Codex, Cursor, Gemini, Copilot, OpenCode)", (t) => {
  const r = repoWithHooks(t, { versioned: false });
  const folder = path.join(r.env.HOME, ".agents", "skills", "agentic-design", "scripts");
  mkdirSync(folder, { recursive: true });
  writeFileSync(path.join(folder, "detect-slop.mjs"), DOUBLE);
  r.write("src/new.css", ".f { x: SLOP; }\n");
  r.git("add", "src/new.css");
  const c = r.commit("new slop");
  assert.equal(c.status, 1, c.out);
  assert.match(c.out, /src\/new\.css:1\s+blocker/);
});

test("--with-ui finds sibling agentic-design beside this skill without a variable", (t) => {
  const r = newRepo(t);
  // Arrange the neighboring skills in a temporary tree, including when testing an overlay.
  const skills = path.join(r.root, "skills");
  const scripts = path.join(skills, "agentic-project", "scripts");
  const sibling = path.join(skills, "agentic-design");
  mkdirSync(scripts, { recursive: true });
  mkdirSync(path.join(sibling, "scripts"), { recursive: true });
  mkdirSync(path.join(sibling, "references"), { recursive: true });
  copyFileSync(SCRIPT, path.join(scripts, "prepare-repo.sh"));
  writeFileSync(path.join(sibling, "scripts", "detect-slop.mjs"), DOUBLE);
  writeFileSync(path.join(sibling, "references", "ui-without-slop.md"), "# Rules\n");
  const applied = spawnSync("bash", [path.join(scripts, "prepare-repo.sh"), "--apply", "--with-ui", "--dir", r.repo], { cwd: r.repo, env: r.env, encoding: "utf8" });
  assert.equal(applied.status, 0, applied.stdout + applied.stderr);
  assert.equal(readFileSync(path.join(r.repo, ".agentic/detect-slop.mjs"), "utf8"), readFileSync(path.join(sibling, "scripts", "detect-slop.mjs"), "utf8"));
  assert.equal(readFileSync(path.join(r.repo, ".agentic/ui-without-slop.md"), "utf8"), readFileSync(path.join(sibling, "references", "ui-without-slop.md"), "utf8"));
});

test("hook: finds the detector in $CLAUDE_CONFIG_DIR/skills (where install.sh puts it)", (t) => {
  const r = repoWithHooks(t, { versioned: false });
  const cfg = path.join(r.env.HOME, "cfg");
  const folder = path.join(cfg, "skills", "agentic-design", "scripts");
  mkdirSync(folder, { recursive: true });
  writeFileSync(path.join(folder, "detect-slop.mjs"), DOUBLE);
  r.write("src/new.css", ".f { x: SLOP; }\n");
  r.git("add", "src/new.css");
  const c = r.commit("new slop", { CLAUDE_CONFIG_DIR: cfg });
  assert.equal(c.status, 1, c.out);
  assert.match(c.out, /src\/new\.css:1\s+blocker/);
});

test("hook: finds the detector only in ~/.cursor/skills", (t) => {
  const r = repoWithHooks(t, { versioned: false });
  const folder = path.join(r.env.HOME, ".cursor", "skills", "agentic-design", "scripts");
  mkdirSync(folder, { recursive: true });
  writeFileSync(path.join(folder, "detect-slop.mjs"), DOUBLE);
  r.write("src/new.css", ".f { x: SLOP; }\n");
  r.git("add", "src/new.css");
  const c = r.commit("new slop");
  assert.equal(c.status, 1, c.out);
  assert.match(c.out, /src\/new\.css:1\s+blocker/);
});

test("hook: plugin uses installed_plugins.json's version rather than another cache entry", (t) => {
  const r = repoWithHooks(t, { versioned: false });
  const plugins = path.join(r.env.HOME, ".claude", "plugins");
  const version = (v, detector) => {
    const d = path.join(plugins, "cache", "agentic-skills", "agentic-skills", v, "skills", "agentic-design", "scripts");
    mkdirSync(d, { recursive: true });
    writeFileSync(path.join(d, "detect-slop.mjs"), detector);
    return path.join(plugins, "cache", "agentic-skills", "agentic-skills", v);
  };
  // Two old versions that let everything pass, around the installed version (which blocks).
  const passes = 'process.stdout.write(JSON.stringify({ summary: { files: 1, blockers: 0, notices: 0, byRule: {} }, findings: [] }));\n';
  version("0a1b2c3d4e5f", passes);
  const installed = version("5f5f5f5f5f5f", DOUBLE);
  version("9c1d2e3f4a5b", passes);
  writeFileSync(path.join(plugins, "installed_plugins.json"), JSON.stringify({ version: 2, plugins: {
    "agentic-skills@agentic-skills": [{ scope: "user", installPath: installed, version: "5f5f5f5f5f5f", lastUpdated: "2026-10-16T10:00:00.000Z" }] } }));
  r.write("src/new.css", ".f { x: SLOP; }\n");
  r.git("add", "src/new.css");
  const c = r.commit("new slop");
  assert.equal(c.status, 1, c.out);
  assert.match(c.out, /src\/new\.css:1\s+blocker/);
});
