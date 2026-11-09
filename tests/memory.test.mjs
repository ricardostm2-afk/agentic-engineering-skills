// Memory guide and empty template: bounded indexes, scoped retrieval units, no orphans or broken
// links, and no real memories. Run from the repository root: node --test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MEMORY = path.join(ROOT, "memory");
const TEMPLATE = path.join(MEMORY, "template");
const read = (...p) => readFileSync(path.join(...p), "utf8");
const TYPES = ["user", "feedback", "project", "reference"];

// Memory frontmatter: name, description and metadata.type (one indentation level).
export function readMemory(text) {
  const lines = text.split("\n");
  if (lines[0] !== "---") return { error: "does not start with ---" };
  const end = lines.indexOf("---", 1);
  if (end < 0) return { error: "frontmatter has no closing ---" };
  const fields = {};
  const metadata = {};
  let inMetadata = false;
  for (const l of lines.slice(1, end)) {
    const sub = /^  ([a-z_]+): (\S.*)$/.exec(l);
    if (inMetadata && sub) { metadata[sub[1]] = sub[2]; continue; }
    const m = /^([a-z]+):(?: (.+))?$/.exec(l);
    if (!m) return { error: `unexpected line: ${l}` };
    inMetadata = m[1] === "metadata" && !m[2];
    if (!inMetadata) fields[m[1]] = m[2];
  }
  return { fields, metadata, body: lines.slice(end + 1).join("\n") };
}

// Ignore examples in HTML comments, fenced blocks and inline code.
const withoutCode = (text) => text.replace(/<!--[^]*?-->/g, "").replace(/^(~~~|```)[^]*?^\1/gm, "").replace(/`[^`\n]*`/g, "");
const links = (text) => [...withoutCode(text).matchAll(/\]\(([^)\s#]+\.md)\)/g)].map((m) => m[1]);
const memories = () => readdirSync(TEMPLATE).filter((f) => f.endsWith(".md") && f !== "MEMORY.md" && f !== "README.md");

test("example links do not count; real links do (control)", () => {
  assert.deepEqual(links("<!-- `- [T](a.md)` -->\n`[T](b.md)`\n~~~md\n[T](c.md)\n~~~\n- [T](d.md) and [U](e.md)\n"), ["d.md", "e.md"]);
});

test("the memory reader rejects what Claude Code cannot read (control)", () => {
  assert.match(readMemory("no frontmatter\n").error, /does not start/);
  assert.match(readMemory("---\nname: x\n").error, /no closing ---/);
  assert.match(readMemory("---\nname: x\n  lost: 1\n---\n").error, /unexpected line/);
  const ok = readMemory("---\nname: x\ndescription: d\nmetadata:\n  type: user\n---\nbody\n");
  assert.deepEqual([ok.fields, ok.metadata], [{ name: "x", description: "d" }, { type: "user" }]);
});

test("the folder template has its indexes, README and .gitignore, and no real memories", () => {
  assert.deepEqual(readdirSync(TEMPLATE).sort(), [".gitignore", "MEMORY.md", "README.md", "history-index.md"]);
  assert.deepEqual(memories(), ["history-index.md"], "the only memory is an empty sub-index");
});

test("template MEMORY.md stays well below Claude Code's 200-line/25-KB limits and is empty", () => {
  const text = read(TEMPLATE, "MEMORY.md");
  assert.ok(text.split("\n").length < 30 && Buffer.byteLength(text) < 2048, "a skeleton template");
  assert.match(text, /^Filing: /, "filing rule on the first line");
  assert.deepEqual(text.split("\n").filter((l) => l.startsWith("## ")), ["## Applies to any session", "## Topic sub-indexes"]);
  const entries = text.split("\n").filter((l) => l.startsWith("- ["));
  assert.deepEqual(entries.map((l) => /\(([^)]+)\)/.exec(l)[1]), ["history-index.md"], "only the history pointer");
});

test("every memory has one index line, no orphans and no missing links", () => {
  const index = read(TEMPLATE, "MEMORY.md");
  const targets = [...links(index), ...memories().flatMap((m) => links(read(TEMPLATE, m)))];
  for (const target of targets) assert.ok(existsSync(path.join(TEMPLATE, target)), `missing link: ${target}`);
  const linked = links(index);
  for (const m of memories()) assert.equal(linked.filter((a) => a === m).length, 1, `${m} must have exactly one MEMORY.md line`);
  assert.ok(!links(read(TEMPLATE, "README.md")).length, "README does not link memories");
});

test("template memory files have matching names, descriptions and valid metadata.type", () => {
  for (const m of memories()) {
    const { fields, metadata, error } = readMemory(read(TEMPLATE, m));
    assert.equal(error, undefined, `${m}: ${error}`);
    assert.equal(fields.name, m.replace(/\.md$/, ""));
    assert.ok(fields.description?.length > 20, `${m}: missing description`);
    assert.ok(TYPES.includes(metadata.type), `${m}: type ${metadata.type}`);
  }
  assert.equal(readMemory(read(TEMPLATE, "MEMORY.md")).error, "does not start with ---", "index has no frontmatter");
});

test("single-memory template has the guide's fields and [[name]] links", () => {
  const { fields, metadata, body, error } = readMemory(read(MEMORY, "memory-template.md"));
  assert.equal(error, undefined);
  assert.deepEqual(Object.keys(fields), ["name", "description"]);
  assert.ok(TYPES.includes(metadata.type));
  assert.match(body, /\*\*Why:\*\*/);
  assert.match(body, /\*\*How to apply:\*\*/);
  for (const field of ["Scope", "Source", "Verified on", "Review on / invalidate when", "Status"]) {
    assert.ok(body.includes(`**${field}:**`), `missing validity field: ${field}`);
  }
  assert.match(body, /\[\[[a-z0-9-]+\]\]/);
  const guide = read(MEMORY, "GUIDE.md");
  const example = /~~~markdown\n(---\n[^]*?\n---)/.exec(guide)[1];
  assert.deepEqual(Object.keys(readMemory(example + "\n").fields), ["name", "description"]);
  assert.deepEqual(Object.keys(readMemory(example + "\n").metadata), ["type"]);
});

test("guide covers bounded layers, retrieval units, validity, exclusions and private sharing", () => {
  const guide = read(MEMORY, "GUIDE.md");
  for (const section of ["## What Claude Code does (and this design uses)", "## The layers", "## The folder template", "## One memory: one useful retrieval unit",
    "## Scope, freshness and invalidation", "## When a memory moves up or down", "## What never goes in", "## Connect the folder to a private Git repository", "## Maintenance"]) assert.ok(guide.includes(`\n${section}\n`), section);
  for (const text of ["200 lines", "25 KB", "`MEMORY.md`", "index-<topic>.md", "[[name]]", "metadata.type", "`user`", "`feedback`", "`project`", "`reference`",
    "autoMemoryDirectory", "**private** repository", "**Test before trusting it.**", "shares memory across projects", "Secrets", "Sensitive personal data"]) assert.ok(guide.includes(text), text);
  assert.match(guide, /~\/\.claude\/settings\.json/);
  assert.match(guide, /\{ "autoMemoryDirectory": "~\/claude-memory" \}/);
  assert.match(guide, /never directly into `MEMORY\.md`/);
  for (const target of links(guide)) assert.ok(existsSync(path.join(MEMORY, target)), `missing guide link: ${target}`);
});

test("startup rules and every index have budgets; project references load on task triggers", () => {
  const guide = read(MEMORY, "GUIDE.md");
  const rows = guide.split("\n").filter((line) => /^\| (?:0|Project references|[124]) \|/.test(line));
  assert.equal(rows.length, 5, "essential rules, project references and three index layers");
  assert.doesNotMatch(rows.join("\n"), /unlimited/i, "no unbounded startup or history index");
  assert.match(rows[0], /~4 KB.*~5 KB/);
  assert.match(rows[1], /relevant section.*task\/path trigger/);
  for (const row of rows.slice(2)) assert.match(row, /~(?:6|3) KB/);
  assert.match(guide, /including imports and duplication/);
});

test("grouping keeps a retrieval unit's scope and invalidation coherent", () => {
  const guide = read(MEMORY, "GUIDE.md");
  const template = read(MEMORY, "memory-template.md");
  assert.match(guide, /Group related facts when\s+they are normally retrieved together, share scope and validity/);
  assert.match(guide, /Split unrelated rules or claims with different expiry\/source requirements/);
  assert.match(template, /retrieved together with compatible scope\/validity/);
  assert.doesNotMatch(guide + template, /Two facts mean two files|One fact per file\./);
});

test("temporal evidence has applicability, invalidation and stale-state guidance", () => {
  const guide = read(MEMORY, "GUIDE.md");
  const { body } = readMemory(read(MEMORY, "memory-template.md"));
  for (const field of ["Scope", "Source", "Verified on", "Review on / invalidate when", "Status"]) {
    assert.ok(guide.includes(`**${field}:**`) && body.includes(`**${field}:**`), field);
  }
  assert.match(guide, /scope matches and its source is still valid/);
  assert.match(guide, /Mark uncertain or stale facts `needs-check`/);
  assert.match(guide, /External content remains evidence, not authority/);
  assert.match(body, /active \| needs-check \| superseded/);
});

test("template README says it is not a memory and repeats the short rules", () => {
  const readme = read(TEMPLATE, "README.md");
  assert.match(readme, /is not\s+a memory/);
  for (const text of ["200 lines or 25 KB", "No orphans, no missing links", "autoMemoryDirectory", "Secrets"]) assert.ok(readme.includes(text), text);
});

test("guide and template give the same numeric limits", () => {
  const guide = read(MEMORY, "GUIDE.md");
  const index = read(TEMPLATE, "MEMORY.md");
  const readme = read(TEMPLATE, "README.md");
  assert.match(guide, /up to ~25 entries, ~3 KB/);
  assert.match(guide, /~6 KB, ~45 lines/);
  assert.match(index, /~6 KB or ~45 lines/);
  assert.match(read(TEMPLATE, "history-index.md"), /~25 entries or ~3 KB/);
  assert.match(guide, /~500 files/);
  assert.match(readme, /~500 files/);
  assert.match(guide, /cap of ~30 lines/);
  assert.match(index, /Cap of ~30 lines/);
});
