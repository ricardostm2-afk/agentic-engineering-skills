// Claude Code agent definitions: valid frontmatter, closed tool lists, model/effort defaults by level,
// and a CLAUDE.md excerpt linking to choosing-the-agent.md rather than repeating it. Run: node --test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FOLDER = path.join(ROOT, "skills", "agentic-implement", "assets", "agents");
const AGENTS = ["implementer", "implementer-ui", "researcher", "reviewer"];
const read = (...p) => readFileSync(path.join(...p), "utf8");

// Single-line key/value frontmatter with separate comments. Unquoted ': ' and ' #' break YAML.
export function readAgent(text) {
  const lines = text.split("\n");
  if (lines[0] !== "---") return { error: "does not start with ---" };
  const end = lines.indexOf("---", 1);
  if (end < 0) return { error: "frontmatter has no closing ---" };
  const fields = {};
  const comments = [];
  for (const l of lines.slice(1, end)) {
    if (l.startsWith("#")) { comments.push(l.replace(/^#\s?/, "")); continue; }
    const m = /^([A-Za-z][\w-]*): (.+)$/.exec(l);
    if (!m) return { error: `unexpected frontmatter line: ${l}` };
    let value = m[2].trim();
    if (value.startsWith('"')) {
      if (!/^"[^"]*"$/.test(value)) return { error: `${m[1]}: unclosed or unescaped quotes` };
      value = value.slice(1, -1);
    } else if (/: | #/.test(value)) {
      return { error: `${m[1]}: unquoted value containing ': ' or ' #' breaks YAML` };
    }
    if (m[1] in fields) return { error: `${m[1]}: duplicate field` };
    fields[m[1]] = value;
  }
  return { fields, comments, body: lines.slice(end + 1).join("\n") };
}

const agent = (name) => readAgent(read(FOLDER, `${name}.md`));
const tools = (name) => agent(name).fields.tools.split(",").map((s) => s.trim());
const READ_ONLY = ["researcher"];
const WRITING = ["Edit", "Write", "NotebookEdit"];

test("the folder contains four agents, the CLAUDE.md excerpt and README only", () => {
  assert.deepEqual(readdirSync(FOLDER).sort(), [...AGENTS.map((a) => `${a}.md`), "README.md", "claude-md-excerpt.md"].sort());
});

test("the frontmatter reader catches broken YAML (control)", () => {
  assert.match(readAgent("---\nname: x\ndescription: Fresh context: who writes\n---\n").error, /breaks YAML/);
  assert.match(readAgent('---\nname: x\ndescription: "unclosed\n---\n').error, /quotes/);
  assert.match(readAgent("no frontmatter\n").error, /does not start/);
  assert.match(readAgent("---\nname: x\n").error, /no closing ---/);
  assert.deepEqual(readAgent('---\n# comment\nname: x\ndescription: "a: b"\n---\nbody\n').fields, { name: "x", description: "a: b" });
});

for (const name of AGENTS) {
  test(`${name}: valid frontmatter, matching filename and a description saying when to use it`, () => {
    const { fields, error } = agent(name);
    assert.equal(error, undefined, error);
    assert.equal(fields.name, name);
    assert.match(fields.name, /^[a-z][a-z0-9-]*$/);
    assert.ok(fields.description.length >= 60 && fields.description.length <= 300, `description has ${fields.description.length} characters`);
    assert.match(fields.description, /\bUse\b|\bReviews\b|\bFresh context\b/, "description says when to delegate");
    assert.deepEqual(Object.keys(fields).filter((k) => !["name", "description", "model", "effort", "tools", "skills"].includes(k)), [], "only fields Claude Code reads and these agents need");
  });
  test(`${name}: a closed tool list without launching other agents`, () => {
    const list = tools(name);
    assert.ok(list.length >= 4 && list.length <= 8, list.join(","));
    for (const tool of list) assert.match(tool, /^[A-Z][A-Za-z]+$/, `suspicious tool: ${tool}`);
    assert.equal(new Set(list).size, list.length, "duplicate tool");
    for (const forbidden of ["Agent", "Task", "Skill"]) assert.ok(!list.includes(forbidden), forbidden);
    assert.ok(list.includes("Read"));
    if (READ_ONLY.includes(name)) for (const tool of WRITING) assert.ok(!list.includes(tool), `${name} is read-only and has ${tool}`);
    else if (name === "reviewer") {
      for (const tool of ["Write", "Bash"]) assert.ok(list.includes(tool), `reviewer needs ${tool} for acceptance scratch`);
      assert.ok(!list.includes("Edit"), "reviewer does not need a general source editing tool");
    } else for (const tool of ["Edit", "Write", "Bash"]) assert.ok(list.includes(tool), `${name} lacks ${tool}`);
    assert.equal(agent(name).fields.disallowedTools, undefined, "a closed list does not need disallowedTools");
  });
  test(`${name}: model and effort match the commented task-level default the user can change`, () => {
    const { fields, comments } = agent(name);
    assert.match(fields.model, /^(sonnet|opus|haiku)$/, "an alias rather than a versioned identifier");
    assert.match(fields.effort, /^(low|medium|high|xhigh|max)$/);
    const level = name === "reviewer" ? "review" : "well-defined";
    const pattern = new RegExp(`${level}: model: (\\w+), effort: (\\w+)`);
    const line = comments.find((c) => pattern.test(c));
    assert.ok(line, `missing comment for level ${level}`);
    const [, model, effort] = pattern.exec(line);
    assert.deepEqual([fields.model, fields.effort], [model, effort], "active values match the comment");
    assert.match(comments.join(" "), /example model names; the project.*picks its own/i);
  });
}

test("reviewer uses the review-level model; the other three use well-defined defaults", () => {
  assert.deepEqual([agent("reviewer").fields.model, agent("reviewer").fields.effort], ["sonnet", "high"]);
  assert.match(agent("reviewer").comments.join(" "), /verifier: model: opus, effort: medium/, "the verifier keeps the stronger model");
  for (const name of ["implementer", "implementer-ui"]) assert.deepEqual([agent(name).fields.model, agent(name).fields.effort], ["sonnet", "high"], name);
  assert.deepEqual([agent("researcher").fields.model, agent("researcher").fields.effort], ["sonnet", "medium"]);
  assert.match(read(FOLDER, "reviewer.md"), /Reviewed production is read-only: do not edit source, commit/);
});

test("preloaded skills exist; only code-writing agents preload them", () => {
  assert.equal(agent("implementer").fields.skills, "[agentic-implement]");
  assert.equal(agent("implementer-ui").fields.skills, "[agentic-implement]", "UI writer must not preload the design orchestrator");
  assert.match(agent("implementer-ui").body, /references\/build-mode\.md/);
  assert.match(agent("implementer-ui").body, /Do not preload or read the whole design/);
  assert.equal(agent("researcher").fields.skills, undefined);
  assert.equal(agent("reviewer").fields.skills, undefined);
  for (const a of AGENTS) {
    const list = agent(a).fields.skills;
    for (const s of list ? list.slice(1, -1).split(/,\s*/) : []) assert.ok(existsSync(path.join(ROOT, "skills", s, "SKILL.md")), `${a}: missing skill ${s}`);
  }
});

test("reviewer links to the agentic-code-review brief rather than repeating it", () => {
  const body = agent("reviewer").body;
  assert.match(body, /assets\/reviewer-brief\.template\.md/);
  assert.ok(existsSync(path.join(ROOT, "skills", "agentic-code-review", "assets", "reviewer-brief.template.md")));
  assert.doesNotMatch(body, /\[Important\]|Pre-existing|Nit\b/, "report format belongs in the skill's brief and template");
  assert.ok(body.split("\n").length < 30);
});

test("reviewer scratch capability is bounded to the independent acceptance test", () => {
  const body = agent("reviewer").body;
  assert.match(body, /same reviewer may write[\s\S]*only in[\s\S]*<acceptance-tmp>/);
  assert.match(body, /Production\/review worktree files stay read-only|Reviewed production is read-only/);
  assert.match(body, /status --porcelain[\s\S]*must be empty/);
  assert.match(body, /does not authorize production changes or an extra agent by default/);
  assert.match(body, /missing capability is unrun\/blocked proof/);
});

// Generic machine paths and installation-specific tool names. Never copy a project's vocabulary here.
const GENERIC = /\/Users\/|\/home\/[a-z]|[A-Za-z]:\\Users\\|mcp__/;

test("agents and excerpt contain nothing tied to a machine or installation", () => {
  for (const f of [...AGENTS.map((a) => `${a}.md`), "claude-md-excerpt.md", "README.md"]) {
    const text = read(FOLDER, f);
    assert.doesNotMatch(text, GENERIC, f);
    assert.doesNotMatch(text, /Sonnet|Opus [0-9]|gpt-/, `${f}: versioned model names age; use aliases`);
  }
});

test("CLAUDE.md excerpt: task-level models, defined agents and a link to choosing-the-agent.md", () => {
  const text = read(FOLDER, "claude-md-excerpt.md");
  assert.match(text, /^## Agents and models per task\n/);
  assert.ok(text.split("\n").length <= 30, "a short excerpt");
  for (const level of ["short", "well-defined", "complex", "code review"]) assert.match(text, new RegExp(`^\\| ${level} `, "m"), level);
  for (const a of AGENTS) assert.ok(text.includes(`\`${a}\``), a);
  assert.match(text, /`general-purpose`/);
  assert.match(text, /The orchestrator/);
  assert.match(text, /`references\/choosing-the-agent\.md`/);
  assert.ok(existsSync(path.join(ROOT, "skills", "agentic-implement", "references", "choosing-the-agent.md")));
  for (const repeated of ["Unknown cause", "Design that only shows", "Steps not enumerable", "Already failed"]) assert.ok(!text.includes(repeated), `repeats choosing-the-agent.md: ${repeated}`);
  assert.doesNotMatch(text, /^---$/m, "pasteable text without frontmatter");
});

test("choosing-the-agent.md and README list the four agents and installer", () => {
  const choosing = read(ROOT, "skills", "agentic-implement", "references", "choosing-the-agent.md");
  const readme = read(FOLDER, "README.md");
  for (const a of AGENTS) {
    assert.ok(choosing.includes(`assets/agents/${a}.md`), `choosing-the-agent.md lacks ${a}`);
    assert.ok(readme.includes(`\`${a}.md\``), `README lacks ${a}`);
  }
  assert.match(choosing, /install\.sh --agents/);
  for (const pattern of ["--agents", "-Agents", "claude-md-excerpt.md", "never edits your `CLAUDE.md`", "without overwriting|never overwrite"]) assert.match(readme, new RegExp(pattern), pattern);
});
