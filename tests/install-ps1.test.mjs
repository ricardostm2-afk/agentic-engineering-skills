// Hermetic install.ps1 tests: temporary HOME and system PowerShell. Run: node --test.
// Without pwsh/powershell, report the missing dependency explicitly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "install.ps1");
const PS = ["pwsh", "powershell"].find((b) => spawnSync(b, ["-NoProfile", "-Command", "exit 0"]).status === 0);
if (process.env.AGENTIC_REQUIRE_POWERSHELL === "1" && !PS) {
  throw new Error("PowerShell is required in this job; installer tests must not be skipped");
}
const options = { skip: PS ? false : "no PowerShell (pwsh or powershell) on this machine" };
const ELEVEN = ["agentic-analysis-optimization", "agentic-architecture", "agentic-ci-audit", "agentic-code-review", "agentic-design", "agentic-explain", "agentic-feature", "agentic-fix", "agentic-implement", "agentic-project", "agentic-tool-design"];

function sandbox(t, folders = []) {
  const home = mkdtempSync(path.join(tmpdir(), "install-ps1-"));
  t.after(() => rmSync(home, { recursive: true, force: true }));
  for (const p of folders) mkdirSync(path.join(home, p), { recursive: true });
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  delete env.CLAUDE_CONFIG_DIR;
  const run = (...args) => {
    const r = spawnSync(PS, ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", SCRIPT, ...args], { env, encoding: "utf8" });
    return { status: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
  };
  return { home, run };
}
test("install.ps1 has a BOM for Windows PowerShell 5.1 UTF-8", () => {
  assert.deepEqual([...readFileSync(SCRIPT).subarray(0, 3)], [0xef, 0xbb, 0xbf]);
});
test("no detected agents exits 2 and explains how to choose", options, (t) => {
  const r = sandbox(t).run();
  assert.equal(r.status, 2, r.out);
  assert.match(r.out, /no agents detected/);
});
test("dry run detects agent folders and creates nothing", options, (t) => {
  const { home, run } = sandbox(t, [".claude", ".codex"]);
  const r = run();
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /DRY RUN/);
  assert.match(r.out, /^claude → ~\/\.claude\/skills$/m);
  assert.match(r.out, /^codex → ~\/\.agents\/skills$/m);
  for (const name of ELEVEN) assert.match(r.out, new RegExp("^\\s+would copy\\s+" + name + "$", "m"));
  assert.ok(!existsSync(path.join(home, ".claude", "skills")));
  assert.ok(!existsSync(path.join(home, ".agents")));
});
test("-Apply copies eleven skills to Claude and Codex and is idempotent", options, (t) => {
  const { home, run } = sandbox(t);
  const r = run("-Apply", "-Agent", "claude,codex");
  assert.equal(r.status, 0, r.out);
  for (const folder of [".claude", ".agents"]) {
    const destination = path.join(home, folder, "skills");
    assert.deepEqual(readdirSync(destination).sort(), ELEVEN, destination);
    assert.ok(existsSync(path.join(destination, "agentic-code-review", "scripts", "validate-report.mjs")));
    assert.ok(existsSync(path.join(destination, "agentic-architecture", "licenses", "LICENSE")));
  }
  const again = run("-Apply", "-Agent", "claude,codex");
  assert.equal(again.status, 0, again.out);
  assert.match(again.out, /done: 0 installed, 0 pending/);
  assert.match(again.out, /identical, kept\s+agentic-project/);
});
test("never overwrites without -Force; -Force backs up the previous version", options, (t) => {
  const { home, run } = sandbox(t);
  const existing = path.join(home, ".claude", "skills", "agentic-feature");
  mkdirSync(existing, { recursive: true });
  writeFileSync(path.join(existing, "SKILL.md"), "my version\n");
  const r = run("-Apply", "-Agent", "claude");
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /exists, kept\s+agentic-feature/);
  assert.equal(readFileSync(path.join(existing, "SKILL.md"), "utf8"), "my version\n");
  const forced = run("-Apply", "-Agent", "claude", "-Force");
  assert.equal(forced.status, 0, forced.out);
  assert.match(forced.out, /replaced\s+agentic-feature/);
  const backups = path.join(home, ".agentic-skills-backups");
  const stamp = readdirSync(backups)[0];
  const sub = readdirSync(path.join(backups, stamp))[0];
  assert.equal(readFileSync(path.join(backups, stamp, sub, "agentic-feature", "SKILL.md"), "utf8"), "my version\n");
});
test("-Link creates clone links and repeated installation keeps them", options, (t) => {
  const { home, run } = sandbox(t);
  const r = run("-Apply", "-Link", "-Agent", "gemini,claude");
  assert.equal(r.status, 0, r.out);
  for (const d of [".agents/skills", ".claude/skills"]) {
    const link = path.join(home, d, "agentic-project");
    assert.ok(lstatSync(link).isSymbolicLink() || process.platform === "win32", d + " is not a link");
    assert.ok(existsSync(path.join(link, "SKILL.md")), d);
  }
  const again = run("-Apply", "-Link", "-Agent", "all");
  assert.equal(again.status, 0, again.out);
  assert.match(again.out, /already linked, kept\s+agentic-feature/);
  assert.match(again.out, /^codex, cursor, gemini, copilot, opencode → ~\/\.agents\/skills$/m);
});
test("-Project installs into repository folders instead of HOME", options, (t) => {
  const { home, run } = sandbox(t);
  const repo = path.join(home, "repo");
  mkdirSync(repo);
  const r = run("-Apply", "-Project", repo, "-Agent", "claude,copilot");
  assert.equal(r.status, 0, r.out);
  assert.ok(existsSync(path.join(repo, ".claude", "skills", "agentic-feature", "SKILL.md")));
  assert.ok(existsSync(path.join(repo, ".agents", "skills", "agentic-feature", "SKILL.md")));
  assert.ok(!existsSync(path.join(home, ".claude", "skills")));
});
test("codex-legacy installs into ~/.codex/skills; unknown agent exits 2", options, (t) => {
  const { home, run } = sandbox(t);
  const r = run("-Apply", "-Agent", "codex-legacy");
  assert.equal(r.status, 0, r.out);
  assert.ok(existsSync(path.join(home, ".codex", "skills", "agentic-project", "SKILL.md")));
  assert.ok(!existsSync(path.join(home, ".agents")));
  const bad = run("-Agent", "emacs");
  assert.equal(bad.status, 2, bad.out);
  assert.match(bad.out, /unknown agent: emacs/);
});
test("-Help prints usage and exits 0", options, (t) => {
  const r = sandbox(t).run("-Help");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /-Apply/);
  assert.match(r.out, /codex-legacy/);
  assert.match(r.out, /\[-Agents\]/);
  assert.match(r.out, /The installer never edits CLAUDE\.md/);
});

const AGENTS_SOURCE = path.join(ROOT, "skills", "agentic-implement", "assets", "agents");
const FOUR_AGENTS = ["implementer", "implementer-ui", "researcher", "reviewer"];
test("-Agents dry run lists files and excerpt, creating nothing", options, (t) => {
  const { home, run } = sandbox(t, [".claude"]);
  const r = run("-Agent", "claude", "-Agents");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^claude \(agents\) → ~\/\.claude\/agents$/m);
  for (const a of FOUR_AGENTS) assert.match(r.out, new RegExp("^\\s+would copy\\s+" + a + "$", "m"), a);
  assert.match(r.out, /Excerpt for your CLAUDE\.md/);
  assert.match(r.out, /^## Agents and models per task$/m);
  assert.match(r.out, /^agents: 4 to copy, 0 already present\.$/m);
  assert.ok(!existsSync(path.join(home, ".claude", "agents")));
});
test("-Apply -Agents copies exactly four agents without editing CLAUDE.md", options, (t) => {
  const { home, run } = sandbox(t, [".claude"]);
  const claudeMd = path.join(home, ".claude", "CLAUDE.md");
  writeFileSync(claudeMd, "my rules\n");
  const r = run("-Apply", "-Agent", "claude", "-Agents");
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(readdirSync(path.join(home, ".claude", "agents")).sort(), FOUR_AGENTS.map((a) => a + ".md").sort());
  for (const a of FOUR_AGENTS) assert.deepEqual(readFileSync(path.join(home, ".claude", "agents", a + ".md")), readFileSync(path.join(AGENTS_SOURCE, a + ".md")), a);
  assert.match(r.out, /^agents: 4 copied, 0 kept\.$/m);
  assert.equal(readFileSync(claudeMd, "utf8"), "my rules\n");
});
test("-Agents never overwrites even with -Force; -Project selects repository agents", options, (t) => {
  const { home, run } = sandbox(t, [".claude/agents"]);
  const mine = path.join(home, ".claude", "agents", "reviewer.md");
  writeFileSync(mine, "my reviewer\n");
  const r = run("-Apply", "-Agent", "claude", "-Agents", "-Force");
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^\s+exists, kept\s+reviewer \(different; never overwritten/m);
  assert.equal(readFileSync(mine, "utf8"), "my reviewer\n");
  const again = run("-Apply", "-Agent", "claude", "-Agents");
  assert.equal(again.status, 0, again.out);
  assert.match(again.out, /^\s+identical, kept\s+implementer$/m);
  const repo = path.join(home, "repo");
  mkdirSync(repo);
  const project = run("-Apply", "-Project", repo, "-Agent", "claude", "-Agents");
  assert.equal(project.status, 0, project.out);
  assert.ok(existsSync(path.join(repo, ".claude", "agents", "researcher.md")));
});
test("-Agents without Claude Code exits 2 and copies nothing", options, (t) => {
  const { home, run } = sandbox(t, [".codex"]);
  const r = run("-Agent", "codex", "-Agents");
  assert.equal(r.status, 2, r.out);
  assert.match(r.out, /-Agents copies into Claude Code's agents folder; add -Agent claude/);
  assert.ok(!existsSync(path.join(home, ".claude")));
});
