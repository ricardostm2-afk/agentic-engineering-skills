// Hermetic install.sh tests: a temporary HOME and the system Bash (3.2 on macOS).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, existsSync, readdirSync, writeFileSync, lstatSync, readlinkSync, statSync, readFileSync, realpathSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const SCRIPT = path.join(ROOT, "install.sh");
const BASH = existsSync("/bin/bash") ? "/bin/bash" : "bash";
const ADAPTED = ["agentic-architecture", "agentic-ci-audit", "agentic-tool-design", "agentic-analysis-optimization"];

function sandbox(t, folders = []) {
  const home = mkdtempSync(path.join(tmpdir(), "install-test-"));
  t.after(() => rmSync(home, { recursive: true, force: true }));
  for (const p of folders) mkdirSync(path.join(home, p), { recursive: true });
  const env = { ...process.env, HOME: home };
  delete env.CLAUDE_CONFIG_DIR;
  const run = (...args) => runScript(SCRIPT, ...args);
  const runScript = (script, ...args) => {
    const r = spawnSync(BASH, [script, ...args], { env, encoding: "utf8" });
    return { status: r.status, out: r.stdout + r.stderr };
  };
  return { home, run, runScript };
}

test("no detected agents exits 2 and explains how to choose", (t) => {
  const r = sandbox(t).run();
  assert.equal(r.status, 2);
  assert.match(r.out, /no agents detected/);
});

test("dry run detects agents by their folders and creates nothing", (t) => {
  const { home, run } = sandbox(t, [".claude", ".codex", ".cursor"]);
  const r = run();
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /DRY RUN/);
  assert.match(r.out, /^claude → ~\/\.claude\/skills$/m);
  assert.match(r.out, /^codex, cursor → ~\/\.agents\/skills$/m);
  for (const name of ["agentic-feature", "agentic-design", "agentic-code-review", ...ADAPTED]) assert.match(r.out, new RegExp(`^\\s+would copy\\s+${name}$`, "m"));
  assert.ok(!existsSync(path.join(home, ".claude", "skills")));
  assert.ok(!existsSync(path.join(home, ".agents")));
});

test("--apply preserves all eleven skills and resources in Claude and Codex", (t) => {
  const { home, run } = sandbox(t);
  const result = run("--apply", "--agent", "claude,codex");
  assert.equal(result.status, 0, result.out);
  // All skills/ folders: a new skill omitted from install.sh must fail here.
  const expected = readdirSync(path.join(ROOT, "skills")).filter((name) => existsSync(path.join(ROOT, "skills", name, "SKILL.md"))).sort();
  const compare = (source, destination) => {
    const entries = readdirSync(source, { withFileTypes: true });
    assert.deepEqual(readdirSync(destination).sort(), entries.map((entry) => entry.name).sort(), destination);
    for (const entry of entries) {
      const src = path.join(source, entry.name);
      const copy = path.join(destination, entry.name);
      if (entry.isDirectory()) compare(src, copy);
      else assert.deepEqual(readFileSync(copy), readFileSync(src), copy);
    }
  };
  for (const folder of [".claude", ".agents"]) {
    const destination = path.join(home, folder, "skills");
    assert.deepEqual(readdirSync(destination).sort(), expected, destination);
    for (const name of ADAPTED) {
      const source = path.join(ROOT, "skills", name);
      assert.ok(existsSync(path.join(source, "licenses", "LICENSE")), `${name}: missing license`);
      assert.ok(existsSync(path.join(source, "references", "origin.md")), `${name}: missing origin`);
      compare(source, path.join(destination, name));
    }
    assert.ok(statSync(path.join(destination, "agentic-project", "scripts", "prepare-repo.sh")).mode & 0o111, "script lacks executable bit");
  }
  const again = run("--apply", "--agent", "claude,codex");
  assert.equal(again.status, 0, again.out);
  assert.match(again.out, /done: 0 installed, 0 pending/);
});

test("--apply copies, restores executable bits and is idempotent", (t) => {
  const { home, run } = sandbox(t, [".codex"]);
  const r = run("--apply");
  assert.equal(r.status, 0, r.out);
  const s = path.join(home, ".agents", "skills", "agentic-project");
  assert.ok(existsSync(path.join(s, "SKILL.md")));
  assert.ok(existsSync(path.join(home, ".agents", "skills", "agentic-code-review", "scripts", "validate-report.mjs")));
  assert.ok(statSync(path.join(s, "scripts", "prepare-repo.sh")).mode & 0o111, "missing executable bit");
  const again = run("--apply");
  assert.equal(again.status, 0, again.out);
  assert.match(again.out, /identical, kept\s+agentic-project/);
});

test("never overwrites without --force; --force backs up the previous version", (t) => {
  const { home, run } = sandbox(t);
  const existing = path.join(home, ".claude", "skills", "agentic-feature");
  mkdirSync(existing, { recursive: true });
  writeFileSync(path.join(existing, "SKILL.md"), "my version\n");
  const r = run("--apply", "--agent", "claude");
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /exists, kept\s+agentic-feature/);
  assert.equal(readFileSync(path.join(existing, "SKILL.md"), "utf8"), "my version\n");
  const f = run("--apply", "--agent", "claude", "--force");
  assert.equal(f.status, 0, f.out);
  assert.match(f.out, /replaced\s+agentic-feature/);
  const backups = path.join(home, ".agentic-skills-backups");
  const stamp = readdirSync(backups)[0];
  const sub = readdirSync(path.join(backups, stamp))[0];
  assert.equal(readFileSync(path.join(backups, stamp, sub, "agentic-feature", "SKILL.md"), "utf8"), "my version\n");
});

test("--link links to the clone and repeated installation keeps the links", (t) => {
  const { home, run } = sandbox(t);
  const r = run("--apply", "--link", "--agent", "gemini,claude");
  assert.equal(r.status, 0, r.out);
  for (const d of [".agents/skills", ".claude/skills"]) {
    const l = path.join(home, d, "agentic-project");
    assert.ok(lstatSync(l).isSymbolicLink(), `${d} is not a link`);
    assert.equal(readlinkSync(l), path.join(ROOT, "skills", "agentic-project"));
  }
  const again = run("--apply", "--link", "--agent", "all");
  assert.equal(again.status, 0, again.out);
  assert.match(again.out, /already linked, kept\s+agentic-feature/);
  assert.equal(again.out.match(/→ ~\/\.agents\/skills$/gm).length, 1, "shared folder listed once");
  assert.match(again.out, /^codex, cursor, gemini, copilot, opencode → ~\/\.agents\/skills$/m);
});

test("--project installs into repository folders rather than HOME", (t) => {
  const { home, run } = sandbox(t, [".claude"]);
  const repo = path.join(home, "repo");
  mkdirSync(repo);
  const r = run("--apply", "--project", repo, "--agent", "claude,copilot");
  assert.equal(r.status, 0, r.out);
  assert.ok(existsSync(path.join(repo, ".claude", "skills", "agentic-feature", "SKILL.md")));
  assert.ok(existsSync(path.join(repo, ".agents", "skills", "agentic-feature", "SKILL.md")));
  assert.ok(!existsSync(path.join(home, ".claude", "skills")));
});

test("links without --link remain pending; --force replaces them with copies", (t) => {
  const { home, run } = sandbox(t);
  assert.equal(run("--apply", "--link", "--agent", "codex").status, 0);
  const l = path.join(home, ".agents", "skills", "agentic-project");
  const r = run("--apply", "--agent", "codex");
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /exists, kept\s+agentic-project \(a link to this clone; --force replaces it with a copy\)/);
  const f = run("--apply", "--force", "--agent", "codex");
  assert.equal(f.status, 0, f.out);
  assert.ok(!lstatSync(l).isSymbolicLink(), "still a link");
  assert.ok(existsSync(path.join(l, "SKILL.md")));
});

test("--link over identical copies calls them copies rather than different content", (t) => {
  const { run } = sandbox(t);
  assert.equal(run("--apply", "--agent", "codex").status, 0);
  const r = run("--apply", "--link", "--agent", "codex");
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /exists, kept\s+agentic-feature \(an identical copy; --force replaces it with a link\)/);
  assert.doesNotMatch(r.out, /different/);
});

test("a clone reached through a symbolic link counts as the same repository", (t) => {
  const { home, run, runScript } = sandbox(t);
  const shortcut = path.join(home, "clone-shortcut");
  symlinkSync(ROOT, shortcut);
  const a = runScript(path.join(shortcut, "install.sh"), "--apply", "--link", "--agent", "claude");
  assert.equal(a.status, 0, a.out);
  const b = run("--apply", "--link", "--agent", "claude");
  assert.equal(b.status, 0, b.out);
  assert.match(b.out, /already linked, kept\s+agentic-project/);
});

test("one new folder and one old folder: warns about different versions", (t) => {
  const { home, run } = sandbox(t, [".claude", ".config/opencode"]);
  const old = path.join(home, ".claude", "skills", "agentic-feature");
  mkdirSync(old, { recursive: true });
  writeFileSync(path.join(old, "SKILL.md"), "old version\n");
  const r = run("--apply");
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /randomly picks the copy/);
  assert.match(r.out, /notice: one folder gets the new version and another keeps the existing version/);
});

// README routes listing skills must carry every sibling required by agentic-feature.
const installerSkills = () => readFileSync(SCRIPT, "utf8").match(/^SKILLS="([^"]+)"/m)[1].split(/\s+/).sort();
function loopSkills(readme, title) {
  const start = readme.search(new RegExp(`^### .*${title}`, "m"));
  if (start < 0) return [];
  const rest = readme.slice(start + 4);
  const end = rest.search(/^### /m);
  const section = end < 0 ? rest : rest.slice(0, end);
  const loop = /for skill in ([^;]*); do/.exec(section.replace(/\\\n/g, " "));
  return loop ? loop[1].split(/\s+/).filter(Boolean).sort() : [];
}

test("README gh skill and Gemini CLI loops match install.sh SKILLS", () => {
  const readme = readFileSync(path.join(ROOT, "README.md"), "utf8");
  const expected = installerSkills();
  assert.deepEqual(expected, ["agentic-project", "agentic-feature", "agentic-design", "agentic-implement", "agentic-fix", "agentic-code-review", "agentic-architecture", "agentic-explain", "agentic-analysis-optimization", "agentic-ci-audit", "agentic-tool-design"].sort(), "install.sh must list eleven skills");
  assert.deepEqual(loopSkills(readme, "`gh skill`"), expected, "gh skill");
  assert.deepEqual(loopSkills(readme, "Gemini CLI"), expected, "Gemini CLI");
});

test("README route parser does not pass empty inputs (control)", () => {
  assert.deepEqual(loopSkills("### Other\n\nfor skill in a b; do\n", "Gemini CLI"), []);
  assert.deepEqual(loopSkills("### Gemini CLI\n\ngemini skills install x --path skills/a\n", "Gemini CLI"), []);
  assert.deepEqual(loopSkills("### Gemini CLI\n\nfor skill in b \\\n  a; do\n  x\ndone\n### End\n", "Gemini CLI"), ["a", "b"]);
});

// Optional Claude Code definitions: never overwrite or edit CLAUDE.md.
const AGENTS_SOURCE = path.join(ROOT, "skills", "agentic-implement", "assets", "agents");
const FOUR_AGENTS = ["implementer", "implementer-ui", "researcher", "reviewer"];

test("--agents dry run lists copies and the whole CLAUDE.md excerpt, creating nothing", (t) => {
  const { home, run } = sandbox(t, [".claude"]);
  const r = run("--agent", "claude", "--agents");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^claude \(agents\) → ~\/\.claude\/agents$/m);
  for (const a of FOUR_AGENTS) assert.match(r.out, new RegExp(`^\\s+would copy\\s+${a}$`, "m"), a);
  assert.match(r.out, /Excerpt for your CLAUDE\.md \(the installer never edits it/);
  assert.ok(r.out.includes(readFileSync(path.join(AGENTS_SOURCE, "claude-md-excerpt.md"), "utf8")), "complete excerpt");
  assert.match(r.out, /^agents: 4 to copy, 0 already present\.$/m);
  assert.ok(!existsSync(path.join(home, ".claude", "agents")));
  assert.ok(!existsSync(path.join(home, ".claude", "skills")));
});

test("without --agents no agent files or excerpt are touched", (t) => {
  const { home, run } = sandbox(t);
  const r = run("--apply", "--agent", "claude");
  assert.equal(r.status, 0, r.out);
  assert.doesNotMatch(r.out, /agents\)|Excerpt|implementer/);
  assert.ok(!existsSync(path.join(home, ".claude", "agents")));
});

test("--apply --agents copies exactly four definitions without editing CLAUDE.md", (t) => {
  const { home, run } = sandbox(t, [".claude"]);
  const claudeMd = path.join(home, ".claude", "CLAUDE.md");
  writeFileSync(claudeMd, "# My rules\n\nkeep them.\n");
  const before = statSync(claudeMd);
  const r = run("--apply", "--agent", "claude", "--agents");
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(readdirSync(path.join(home, ".claude", "agents")).sort(), FOUR_AGENTS.map((a) => `${a}.md`).sort(), "README and excerpt are not agents");
  for (const a of FOUR_AGENTS) {
    assert.equal(readFileSync(path.join(home, ".claude", "agents", `${a}.md`), "utf8"), readFileSync(path.join(AGENTS_SOURCE, `${a}.md`), "utf8"), a);
    assert.match(r.out, new RegExp(`^\\s+copied\\s+${a}$`, "m"), a);
  }
  assert.match(r.out, /^agents: 4 copied, 0 kept\.$/m);
  assert.equal(readFileSync(claudeMd, "utf8"), "# My rules\n\nkeep them.\n");
  assert.equal(statSync(claudeMd).mtimeMs, before.mtimeMs);
  assert.deepEqual(readdirSync(path.join(home, ".claude")).filter((f) => /^CLAUDE/.test(f)), ["CLAUDE.md"]);
});

test("--agents never creates a missing CLAUDE.md", (t) => {
  const { home, run } = sandbox(t, [".claude"]);
  assert.equal(run("--apply", "--agent", "claude", "--agents").status, 0);
  assert.ok(!existsSync(path.join(home, ".claude", "CLAUDE.md")));
  assert.ok(!existsSync(path.join(home, "CLAUDE.md")));
});

test("--agents keeps user definitions even with --force", (t) => {
  const { home, run } = sandbox(t, [".claude/agents"]);
  const mine = path.join(home, ".claude", "agents", "reviewer.md");
  writeFileSync(mine, "my reviewer\n");
  const r = run("--apply", "--agent", "claude", "--agents");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^\s+exists, kept\s+reviewer \(different; never overwritten/m);
  assert.match(r.out, /^\s+copied\s+implementer$/m);
  assert.match(r.out, /^agents: 3 copied, 1 kept\.$/m);
  assert.equal(readFileSync(mine, "utf8"), "my reviewer\n");
  const forced = run("--apply", "--agent", "claude", "--agents", "--force");
  assert.equal(forced.status, 0, forced.out);
  assert.equal(readFileSync(mine, "utf8"), "my reviewer\n");
  assert.match(forced.out, /^\s+identical, kept\s+implementer$/m);
  assert.match(forced.out, /^agents: 0 copied, 4 kept\.$/m);
  const backups = path.join(home, ".agentic-skills-backups");
  assert.ok(!existsSync(backups) || !readdirSync(backups, { recursive: true }).some((f) => /agents/.test(f)), "no agent backups");
});

test("--agents also leaves a user's symbolic link untouched", (t) => {
  const { home, run } = sandbox(t, [".claude/agents"]);
  const target = path.join(home, "my-researcher.md");
  writeFileSync(target, "mine\n");
  symlinkSync(target, path.join(home, ".claude", "agents", "researcher.md"));
  const r = run("--apply", "--agent", "claude", "--agents");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /exists, kept\s+researcher/);
  assert.equal(readFileSync(target, "utf8"), "mine\n");
  assert.ok(lstatSync(path.join(home, ".claude", "agents", "researcher.md")).isSymbolicLink());
});

test("--agents --project copies into the repo; --link still copies agent definitions", (t) => {
  const { home, run } = sandbox(t, [".claude"]);
  const repo = path.join(home, "repo");
  mkdirSync(repo);
  const r = run("--apply", "--link", "--project", repo, "--agent", "claude", "--agents");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^claude \(agents\) → ~\/repo\/\.claude\/agents$/m);
  for (const a of FOUR_AGENTS) {
    const f = path.join(repo, ".claude", "agents", `${a}.md`);
    assert.ok(!lstatSync(f).isSymbolicLink(), `${a}: definitions are copies for editing`);
    assert.equal(readFileSync(f, "utf8"), readFileSync(path.join(AGENTS_SOURCE, `${a}.md`), "utf8"));
  }
  assert.ok(lstatSync(path.join(repo, ".claude", "skills", "agentic-project")).isSymbolicLink());
  assert.ok(!existsSync(path.join(home, ".claude", "agents")));
});

test("--agents respects CLAUDE_CONFIG_DIR", (t) => {
  const { home } = sandbox(t);
  const config = path.join(home, "claude-config");
  mkdirSync(config);
  const r = spawnSync(BASH, [SCRIPT, "--apply", "--agent", "claude", "--agents"], { env: { ...process.env, HOME: home, CLAUDE_CONFIG_DIR: config }, encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(existsSync(path.join(config, "agents", "reviewer.md")));
  assert.ok(!existsSync(path.join(home, ".claude")));
});

test("--agents without Claude exits 2, explains why and copies nothing", (t) => {
  const { home, run } = sandbox(t, [".codex"]);
  for (const args of [["--agent", "codex", "--agents"], ["--apply", "--agents"]]) {
    const r = run(...args);
    assert.equal(r.status, 2, r.out);
    assert.match(r.out, /--agents copies into Claude Code's agents folder; add --agent claude/);
  }
  assert.ok(!existsSync(path.join(home, ".claude")));
  assert.ok(!existsSync(path.join(home, ".agents")));
});

test("install.sh AGENTS_LIST matches the definition files and --help documents --agents", (t) => {
  const installer = readFileSync(SCRIPT, "utf8");
  assert.equal(/^AGENTS_LIST="([^"]+)"$/m.exec(installer)[1], FOUR_AGENTS.join(" "));
  const withFrontmatter = readdirSync(AGENTS_SOURCE).filter((f) => f.endsWith(".md") && readFileSync(path.join(AGENTS_SOURCE, f), "utf8").startsWith("---\n")).map((f) => f.replace(/\.md$/, ""));
  assert.deepEqual(withFrontmatter.sort(), [...FOUR_AGENTS].sort());
  const help = sandbox(t).run("--help");
  assert.equal(help.status, 0, help.out);
  assert.match(help.out, /\[--agents\]/);
  assert.match(help.out, /^\s*--agents\s+optional, Claude Code/m);
  assert.match(help.out, /The installer never edits CLAUDE\.md/);
});

test("codex-legacy installs into ~/.codex/skills only when requested", (t) => {
  const { home, run } = sandbox(t);
  const r = run("--apply", "--agent", "codex-legacy");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^codex-legacy → ~\/\.codex\/skills$/m);
  for (const name of ["agentic-project", "agentic-feature", "agentic-code-review"]) assert.ok(existsSync(path.join(home, ".codex", "skills", name, "SKILL.md")), name);
  assert.ok(!existsSync(path.join(home, ".agents")));
});

test("codex-legacy is excluded from all and detection; --project rejects it", (t) => {
  const { run } = sandbox(t, [".codex"]);
  const all = run("--agent", "all");
  assert.equal(all.status, 0, all.out);
  assert.doesNotMatch(all.out, /codex-legacy|\.codex\/skills/);
  assert.doesNotMatch(run().out, /codex-legacy/);
  const project = run("--agent", "codex-legacy", "--project", sandbox(t).home);
  assert.equal(project.status, 2, project.out);
  assert.match(project.out, /codex-legacy only supports user scope/);
});

test("--help lists agents including codex-legacy and exits 0", (t) => {
  const r = sandbox(t).run("--help");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /codex-legacy/);
  assert.match(r.out, /^Usage: \.\/install\.sh/m);
});
