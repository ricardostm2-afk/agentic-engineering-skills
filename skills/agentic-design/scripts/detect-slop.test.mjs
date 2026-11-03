// Tests for detect-slop.mjs — `node --test` in this folder.
// Each fixture says what it proves; find expected lines by text so the test
// does not break when someone adds a line to a fixture.

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

const HERE = import.meta.dirname;
const SCRIPT = path.join(HERE, "detect-slop.mjs");

function run(args, cwd = HERE) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: "utf8" });
  const json = args.includes("--json") && r.status !== 2 ? JSON.parse(r.stdout) : null;
  return { code: r.status, out: r.stdout, err: r.stderr, json };
}

const findings = (...files) => run(["--json", ...files]).json.findings.map((a) => `${a.line} ${a.rule}`).sort();
const lineWith = (file, text) => {
  const n = readFileSync(path.join(HERE, file), "utf8").split("\n").findIndex((l) => l.includes(text)) + 1;
  assert.ok(n > 0, `fixture ${file} no longer contains "${text}"`);
  return n;
};
const expected = (file, pairs) => pairs.map(([text, rule]) => `${lineWith(file, text)} ${rule}`).sort();

// -----------------------------------------------------------------------------
// Clean: zero findings, exit 0
// -----------------------------------------------------------------------------

test("a clean screen (TSX and CSS) has 0 findings and exits 0 — comments, tokens, pills, dialogs and print do not count", () => {
  const r = run(["--json", "fixtures/clean.tsx", "fixtures/clean.module.css", "fixtures/component.vue"]);
  assert.equal(r.code, 0);
  assert.deepEqual(r.json.findings, []);
  assert.equal(r.json.summary.files, 3);
});

// -----------------------------------------------------------------------------
// Blockers: each rule caught on the correct line, exit 1
// -----------------------------------------------------------------------------

test("TSX: each blocker on its own line", () => {
  const f = "fixtures/blocks.tsx";
  assert.deepEqual(
    findings(f),
    expected(f, [
      ["from-indigo-500", "purple-gradient"],
      ["from-sky-400", "background-gradient"],
      ["Unlock", "marketing-microcopy"],
      ["text-[10px]", "small-text"],
      ["✨ What's new", "emoji"],
      ["Welcome back!", "marketing-microcopy"],
      ["fontSize: 11", "small-text"],
      ["#7c3aed", "purple-gradient"],
      ["Seamless", "escape-no-reason"],
      ["Seamless", "marketing-microcopy"],
      ["uppercase tracking-widest", "spaced-uppercase"],
      ["transition-all", "transition-all"]
    ])
  );
  assert.equal(run([f]).code, 1);
});

test("CSS: purple gradient (including in a token), hero background gradient, small text, emoji in content, spaced uppercase, transition: all", () => {
  const f = "fixtures/blocks.module.css";
  assert.deepEqual(
    findings(f),
    expected(f, [
      ["#6366f1", "purple-gradient"],
      ["#0ea5e9", "background-gradient"],
      ["0.65rem", "small-text"],
      ['content: "✨"', "emoji"],
      ["hsl(265", "purple-gradient"],
      ["text-transform: uppercase", "spaced-uppercase"],
      ["transition: all", "transition-all"]
    ])
  );
});

test("HTML: <style> counts, <!-- --> comments do not; emoji and marketing in English", () => {
  const f = "fixtures/page.html";
  assert.deepEqual(
    findings(f),
    expected(f, [
      ["#4f46e5", "purple-gradient"],
      ["font-size: 10px", "small-text"],
      ["<h1>Welcome back", "emoji"],
      ["<h1>Welcome back", "marketing-microcopy"],
      ["Unlock", "marketing-microcopy"]
    ])
  );
});

// -----------------------------------------------------------------------------
// Notices: listed, but exit 0
// -----------------------------------------------------------------------------

test("notices (literal colour, corners, repeated shadows, No data, motion and structure rules) exit 0", () => {
  const r = run(["--json", "fixtures/warnings.tsx", "fixtures/warnings.module.css"]);
  assert.equal(r.code, 0);
  assert.equal(r.json.summary.blockers, 0);
  const rules = new Set(r.json.findings.map((a) => a.rule));
  assert.deepEqual([...rules].sort(), [
    "continuous-motion", "decorative-numbering", "empty-dash", "glass-on-content", "hover-moves-target",
    "large-radius", "large-shadow", "literal-color", "no-data", "outlined-button", "side-border"
  ]);
  assert.ok(r.json.findings.every((a) => a.severity === "notice"));
});

// -----------------------------------------------------------------------------
// UI consolidation rules: one per test, on the correct line. Their negatives
// are in clean.tsx and clean.module.css (0 findings).
// -----------------------------------------------------------------------------

const forRule = (rule, ...files) => {
  const r = run(["--json", ...files]).json.findings.filter((a) => a.rule === rule);
  return { locations: r.map((a) => `${a.file}:${a.line}`).sort(), severities: [...new Set(r.map((a) => a.severity))] };
};
const at = (...pairs) => pairs.map(([file, text]) => `${file}:${lineWith(file, text)}`).sort();

test("spaced-uppercase is a blocker (B13), in classes and CSS", () => {
  const r = forRule("spaced-uppercase", "fixtures/blocks.tsx", "fixtures/blocks.module.css");
  assert.deepEqual(r.locations, at(["fixtures/blocks.tsx", "uppercase tracking-widest"], ["fixtures/blocks.module.css", "text-transform: uppercase"]));
  assert.deepEqual(r.severities, ["blocker"]);
});

// Run the detector on a file in a temporary folder and return the rule's lines.
function linesForRule(rule, name, text) {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "slop-rule-")));
  try {
    writeFileSync(path.join(dir, name), text);
    return run(["--json", name], dir).json.findings.filter((a) => a.rule === rule).map((a) => a.line);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const tsxWithClasses = (classes) => `export const A = () => <span className="${classes}">ACRONYM</span>;\n`;

// Block only exact matches (SKILL.md §14): uppercase with positive tracking from 0.03 em
// (0.5 px), in CSS and classes. Negative or below-threshold tracking is legitimate (acronyms, numbers).
for (const [classes, blocks] of [
  ["uppercase tracking-[-0.02em]", false],
  ["uppercase tracking-[0.02em]", false],
  ["uppercase tracking-[0.3px]", false],
  ["uppercase -tracking-widest", false],
  ["uppercase tracking-[0.1em]", true],
  ["uppercase tracking-[0.03em]", true],
  ["uppercase tracking-[2px]", true],
  ["uppercase tracking-wide", true],
  ["uppercase tracking-wider", true],
  ["uppercase tracking-widest", true],
  ["md:tracking-[0.05em] uppercase", true]
]) {
  test(`spaced-uppercase in classes: "${classes}" ${blocks ? "blocks" : "has no finding"}`, () => {
    const r = linesForRule("spaced-uppercase", "a.tsx", tsxWithClasses(classes));
    assert.deepEqual(r, blocks ? [1] : []);
  });
}

test("spaced-uppercase: classes and CSS block at the same threshold", () => {
  const values = ["-0.02em", "0.02em", "0.03em", "0.1em", "0.05rem", "0.3px", "0.5px", "2px"];
  const css = linesForRule("spaced-uppercase", "a.module.css", values.map((v, i) => `.c${i} { text-transform: uppercase; letter-spacing: ${v}; }\n`).join(""));
  const tsx = linesForRule("spaced-uppercase", "a.tsx", values.map((v) => `export const A = () => <span className="uppercase tracking-[${v}]">ACRONYM</span>;\n`).join(""));
  assert.deepEqual(css, [3, 4, 5, 7, 8], "CSS blocks from 0.03 em and 0.5 px");
  assert.deepEqual(tsx, css);
});

test("transition-all: transition-all and transition: all are blockers (B18); transition: opacity is not", () => {
  const r = forRule("transition-all", "fixtures/blocks.tsx", "fixtures/blocks.module.css");
  assert.deepEqual(r.locations, at(["fixtures/blocks.tsx", "transition-all"], ["fixtures/blocks.module.css", "transition: all"]));
  assert.deepEqual(r.severities, ["blocker"]);
});

test("hover-moves-target: hover:-translate and transform in :hover outside @media (hover: hover) are notices (B18)", () => {
  const r = forRule("hover-moves-target", "fixtures/warnings.tsx", "fixtures/warnings.module.css");
  assert.deepEqual(r.locations, at(["fixtures/warnings.tsx", "hover:-translate-y-1"], ["fixtures/warnings.module.css", "transform: translateY(-2px)"]));
  assert.deepEqual(r.severities, ["notice"]);
});

test("continuous-motion: infinite animation outside a wait is a notice (B18, B22); a spinner is not", () => {
  const r = forRule("continuous-motion", "fixtures/warnings.tsx", "fixtures/warnings.module.css");
  assert.deepEqual(r.locations, at(["fixtures/warnings.tsx", "animate-ping"], ["fixtures/warnings.module.css", "animation: breathe"]));
  assert.deepEqual(r.severities, ["notice"]);
});

test("glass-on-content: blur behind a list is a notice (B22); in the sidebar and navigation it is not", () => {
  const r = forRule("glass-on-content", "fixtures/warnings.tsx", "fixtures/warnings.module.css");
  assert.deepEqual(r.locations, at(["fixtures/warnings.tsx", "backdrop-blur-md"], ["fixtures/warnings.module.css", "backdrop-filter: blur(12px)"]));
  assert.deepEqual(r.severities, ["notice"]);
});

test("glass-on-content: chart bars and top content are not application frames", (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), "slop-glass-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = path.join(dir, "content.css");
  const content = ["bar-chart", "bar", "top", "top-content", "topology"];
  const frames = ["top-bar", "navbar", "topbar", "toolbar", "appbar", "app-bar"];
  writeFileSync(file, [...content, ...frames].map((name) => `.${name} { backdrop-filter: blur(12px); }`).join("\n"));
  const r = run(["--json", file]);
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(r.json.findings.filter((f) => f.rule === "glass-on-content").map((f) => [f.line, f.severity]),
    content.map((_, i) => [i + 1, "notice"]));
  assert.equal(r.json.summary.notices, content.length);
});

test("side-border: a left border of 2 px or more marking a block is a notice (B17); navigation, active items and quotes are not", () => {
  const r = forRule("side-border", "fixtures/warnings.tsx", "fixtures/warnings.module.css");
  assert.deepEqual(r.locations, at(["fixtures/warnings.tsx", "border-l-4"], ["fixtures/warnings.module.css", "border-left: 4px"]));
  assert.deepEqual(r.severities, ["notice"]);
});

test("outlined-button: a button bounded by a line is a notice (B20); focus, forced colours and fields are not", () => {
  const r = forRule("outlined-button", "fixtures/warnings.tsx", "fixtures/warnings.module.css");
  assert.deepEqual(r.locations, at(["fixtures/warnings.tsx", 'variant="outline"'], ["fixtures/warnings.tsx", "border bg-transparent"], ["fixtures/warnings.module.css", "border: 1px solid var(--brand)"]));
  assert.deepEqual(r.severities, ["notice"]);
});

test("empty-dash: a dash in place of an empty field is a notice (B15); an empty string is not", () => {
  const r = forRule("empty-dash", "fixtures/warnings.tsx");
  assert.deepEqual(r.locations, at(["fixtures/warnings.tsx", '?? "-"']));
  assert.deepEqual(r.severities, ["notice"]);
});

test("decorative-numbering: 01 / Data is a notice (B13); Step 2 of 3 is not", () => {
  const r = forRule("decorative-numbering", "fixtures/warnings.tsx");
  assert.deepEqual(r.locations, at(["fixtures/warnings.tsx", "01 / Data"]));
  assert.deepEqual(r.severities, ["notice"]);
});

test("one large shadow alone is a layer; three or more together mean shadows everywhere", () => {
  const alone = run(["--json", "fixtures/warnings.module.css"]).json.findings.map((a) => a.rule);
  assert.ok(!alone.includes("large-shadow"), "one large shadow alone is not a tic");
  const three = run(["--json", "fixtures/warnings.tsx"]).json.findings.filter((a) => a.rule === "large-shadow");
  assert.equal(three.length, 3);
});

// -----------------------------------------------------------------------------
// Escapes
// -----------------------------------------------------------------------------

test("an escape with a reason (on the previous or same line) suppresses the finding", () => {
  const r = run(["--json", "fixtures/escape-valid.tsx"]);
  assert.equal(r.code, 0);
  assert.deepEqual(r.json.findings, []);
});

test("an escape without a reason is itself a blocker and suppresses nothing", () => {
  const f = "fixtures/escape-no-reason.tsx";
  assert.deepEqual(
    findings(f),
    expected(f, [
      ["// slop-ok", "escape-no-reason"],
      ["🚀", "emoji"],
      ["slop-ok: ok", "escape-no-reason"],
      ["text-[9px]", "small-text"]
    ])
  );
  assert.equal(run([f]).code, 1);
});

// -----------------------------------------------------------------------------
// Folders, tests and extensions
// -----------------------------------------------------------------------------

test("in a folder, test files and unsupported extensions are excluded", () => {
  const r = run(["--json", "fixtures/folder-with-tests"]);
  assert.equal(r.code, 0);
  assert.equal(r.json.summary.files, 1, "only ok.tsx: .test.tsx, .spec.tsx and .md are not analysed");
});

test("--json includes a per-rule summary and each finding's file, line, severity and suggestion", () => {
  const r = run(["--json", "fixtures/blocks.tsx"]);
  assert.equal(r.json.summary.byRule["purple-gradient"], 2);
  for (const a of r.json.findings) {
    assert.equal(a.file, path.join("fixtures", "blocks.tsx"));
    assert.ok(a.line > 0 && a.suggestion.length > 10 && ["blocker", "notice"].includes(a.severity));
  }
});

test("readable output: file:line, severity, rule and suggestion below", () => {
  const r = run(["fixtures/escape-no-reason.tsx"]);
  assert.match(r.out, /^fixtures\/escape-no-reason\.tsx:3 {2}blocker {2}emoji /m);
  assert.match(r.out, /^ {4}→ /m);
  assert.match(r.out, /4 blocker\(s\), 0 notice\(s\)\.$/m);
});

// -----------------------------------------------------------------------------
// Fail closed: exit 2
// -----------------------------------------------------------------------------

test("invalid arguments exit 2 with a message", () => {
  for (const args of [[], ["--does-not-exist", "fixtures"], ["--diff"], ["--diff", "--json"], ["fixtures/does-not-exist.tsx"]]) {
    const r = run(args);
    assert.equal(r.code, 2, `args ${JSON.stringify(args)} should exit 2`);
    assert.match(r.err, /detect-slop: /);
  }
});

test("an unreadable file exits 2 (never clean for what was not read)", (t) => {
  if (process.getuid?.() === 0) return t.skip("root reads everything");
  const dir = mkdtempSync(path.join(tmpdir(), "slop-unreadable-"));
  const f = path.join(dir, "closed.tsx");
  writeFileSync(f, "export const A = () => <p>ok</p>;\n");
  chmodSync(f, 0o000);
  try {
    const r = run([f]);
    assert.equal(r.code, 2);
    assert.match(r.err, /could not read/);
  } finally {
    chmodSync(f, 0o644);
    rmSync(dir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// --diff in a temporary git repository
// -----------------------------------------------------------------------------

test("--diff <ref> analyses only changes (modified and new), not what was already there", () => {
  const repo = realpathSync(mkdtempSync(path.join(tmpdir(), "slop-diff-")));
  const git = (...a) => execFileSync("git", a, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  try {
    git("init", "-q", "-b", "main");
    git("config", "user.email", "test@example.invalid");
    git("config", "user.name", "Test");
    mkdirSync(path.join(repo, "src"));
    writeFileSync(path.join(repo, "src", "old.tsx"), "export const A = () => <h1>✨ old</h1>;\n");
    writeFileSync(path.join(repo, "src", "base.tsx"), "export const B = () => <p>ok</p>;\n");
    writeFileSync(path.join(repo, "src", "delete.tsx"), "export const C = () => <p>ok</p>;\n");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    writeFileSync(path.join(repo, "src", "base.tsx"), "export const B = () => <p>🚀 ok</p>;\n");
    writeFileSync(path.join(repo, "src", "new.module.css"), ".x {\n  font-size: 9px;\n}\n");
    writeFileSync(path.join(repo, "src", "notes.md"), "✨\n");
    rmSync(path.join(repo, "src", "delete.tsx"));

    const r = run(["--json", "--diff", "HEAD"], repo);
    assert.equal(r.code, 1);
    assert.equal(r.json.summary.files, 2, "base.tsx (modified) and new.module.css (new); not deleted or .md files");
    assert.deepEqual(r.json.findings.map((a) => `${a.file}:${a.line} ${a.rule}`).sort(), ["src/base.tsx:1 emoji", "src/new.module.css:2 small-text"]);

    const filtered = run(["--json", "--diff", "HEAD", "src/new.module.css"], repo);
    assert.equal(filtered.json.summary.files, 1, "paths after the ref filter the diff");

    const ref = run(["--diff", "ref-that-does-not-exist"], repo);
    assert.equal(ref.code, 2);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("--diff outside a git repository exits 2", () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "slop-no-git-")));
  try {
    const r = spawnSync(process.execPath, [SCRIPT, "--diff", "HEAD"], { cwd: dir, encoding: "utf8", env: { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(dir) } });
    assert.equal(r.status, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// HTML in JS/TS, translation files and unread files
// -----------------------------------------------------------------------------

test("HTML in a .js template string counts as UI (including its <style>)", () => {
  const f = "fixtures/render.js";
  assert.deepEqual(
    findings(f),
    expected(f, [
      ["font-size: 10px", "small-text"],
      ["🚀", "emoji"],
      ["Unlock", "marketing-microcopy"],
      ["font-size: 9px", "small-text"]
    ])
  );
  assert.equal(run([f]).code, 1);
});

test("translation file: text rules only; in JSON the escape is a // line before the key", () => {
  const f = "fixtures/locales/en.json";
  const r = run(["--json", f]);
  assert.deepEqual(
    r.json.findings.map((a) => `${a.line} ${a.rule}`).sort(),
    expected(f, [
      ["Welcome back", "emoji"],
      ["Welcome back", "marketing-microcopy"],
      ["No data", "no-data"],
      ["✨ What's new", "emoji"]
    ]),
    "the escape suppresses only the next line (🎂), not the other one (✨)"
  );
  assert.equal(r.json.escapes.length, 1);
  assert.deepEqual(r.json.escapes[0].suppresses, [`${lineWith(f, "🎂")} emoji`]);
  assert.deepEqual(
    r.json.allowed.map((p) => `${p.line} ${p.rule}`).sort(),
    expected(f, [["👍", "emoji"], ["❤️", "emoji"]]),
    "an emoji-only value (reactions) is data: it does not block and is listed"
  );
});

test("a block escape suppresses the block and is listed; an unclosed block is a blocker and suppresses nothing", () => {
  const f = "fixtures/escape-block.tsx";
  const r = run(["--json", f]);
  assert.deepEqual(
    r.json.findings.map((a) => `${a.line} ${a.rule}`).sort(),
    expected(f, [
      ["✨ Reactions", "emoji"],
      ["a block that never closes", "escape-no-end"],
      ["🚀 Launch", "emoji"]
    ])
  );
  assert.equal(r.json.escapes[0].reason, "reaction selector with emoji in the label, approved by the owner (DESIGN.md)");
  assert.equal(r.json.escapes[0].suppresses.length, 3);
});

// -----------------------------------------------------------------------------
// Legitimate escape without a comment: emoji as data and declared brand gradient
// -----------------------------------------------------------------------------

test("emoji as data (emoji-only list/object value, or content key) does not block and is listed; as an icon it blocks", () => {
  const f = "fixtures/emoji-data.tsx";
  const r = run(["--json", f]);
  assert.equal(r.code, 1);
  assert.deepEqual(
    r.json.findings.map((a) => `${a.line} ${a.rule}`).sort(),
    expected(f, [
      ["✨ What's new", "emoji"],
      ["🚀", "emoji"],
      ["📊", "emoji"],
      ["⭐", "emoji"],
      ["👋 Hello", "emoji"],
      ["🔥", "emoji"],
      ["🎯", "emoji"]
    ]),
    "literal in JSX, attribute, icon/label key, standalone constant or template HTML: icon"
  );
  assert.deepEqual(
    r.json.allowed.map((p) => `${p.line} ${p.rule}`).sort(),
    expected(f, [
      ['["👍", "😂", "🎉"]', "emoji"],
      ['emoji: "👍"', "emoji"],
      ['reaction: "🎉"', "emoji"],
      ['"❤️"', "emoji"],
      ['"😮"', "emoji"],
      ["Loved the concert", "emoji"]
    ])
  );
  assert.ok(r.json.allowed.every((p) => /data/.test(p.reason)));
  assert.equal(r.json.summary.allowed, 6, "also in a list split across lines");
  assert.match(run([f]).out, /^Allowed without an escape/m);
});

test("brand gradient: blocks without declaration; .agentic/ui.json allows only the declared token (and lists it)", () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), "slop-brand-")));
  try {
    writeFileSync(path.join(dir, "tokens.css"), ":root {\n  --brand-gradient: linear-gradient(135deg, #6d28d9, #2563eb);\n  --other-gradient: linear-gradient(135deg, #7c3aed, #4f46e5);\n}\n");
    writeFileSync(path.join(dir, "hero.module.css"), ".hero {\n  background-image: linear-gradient(to bottom, transparent, var(--surface)), var(--brand-gradient);\n}\n.hero-b {\n  background: linear-gradient(90deg, var(--brand-1), var(--brand-2));\n}\n");
    writeFileSync(path.join(dir, "tailwind.config.js"), 'export default {\n  theme: { extend: { backgroundImage: { "brand-gradient": "linear-gradient(135deg, #6d28d9, #2563eb)" } } }\n};\n');
    writeFileSync(path.join(dir, "Hero.tsx"), 'export const Hero = () => <section className="bg-brand-gradient">Today\'s tasks</section>;\nexport const Other = () => <section className="bg-gradient-to-r from-violet-600 to-indigo-600">Tasks</section>;\n');
    const view = () => run(["--json", "."], dir).json;
    const rules = (list) => list.map((a) => `${a.file}:${a.line} ${a.rule}`).sort();

    const before = view();
    assert.deepEqual(rules(before.findings.filter((a) => a.severity === "blocker")), [
      "Hero.tsx:2 purple-gradient",
      "hero.module.css:2 background-gradient",
      "hero.module.css:5 background-gradient",
      "tailwind.config.js:2 purple-gradient",
      "tokens.css:2 purple-gradient",
      "tokens.css:3 purple-gradient"
    ]);

    mkdirSync(path.join(dir, ".agentic"));
    writeFileSync(path.join(dir, ".agentic", "ui.json"), JSON.stringify({ brand_gradients: ["--brand-gradient"] }));
    const after = view();
    assert.deepEqual(
      rules(after.findings.filter((a) => a.severity === "blocker")),
      ["Hero.tsx:2 purple-gradient", "hero.module.css:5 background-gradient", "tokens.css:3 purple-gradient"],
      "the undeclared token, handwritten hero gradient and Tailwind classes still block"
    );
    assert.deepEqual(rules(after.allowed), ["hero.module.css:2 background-gradient", "tailwind.config.js:2 purple-gradient", "tokens.css:2 purple-gradient"]);
    assert.ok(after.allowed.every((p) => p.reason.includes("--brand-gradient") && p.reason.includes(path.join(".agentic", "ui.json"))));

    writeFileSync(path.join(dir, ".agentic", "ui.json"), '{ "brand_gradients": "--brand-gradient" }');
    const invalid = run(["--json", "."], dir);
    assert.equal(invalid.code, 2, "invalid declaration: fail closed");
    assert.match(invalid.err, /ui\.json/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("used escapes appear in readable output, with the reason and what they suppress", () => {
  const r = run(["fixtures/escape-valid.tsx"]);
  assert.equal(r.code, 0);
  assert.match(r.out, /^Escapes used/m);
  assert.match(r.out, /escape-valid\.tsx:3-4 {2}«data loss warning/);
  assert.match(r.out, /2 escape\(s\) used/);
});

test("an unread explicit path or a folder without analysable files exits 2 (never 0 files, clean)", () => {
  const md = run(["--json", "fixtures/folder-with-tests/notes.md"]);
  assert.equal(md.code, 2);
  assert.equal(JSON.parse(md.out).summary.notAnalysed, 1);
  const dir = mkdtempSync(path.join(tmpdir(), "slop-empty-"));
  try {
    writeFileSync(path.join(dir, "notes.md"), "✨\n");
    const r = run([dir]);
    assert.equal(r.code, 2);
    assert.match(r.out, /Nothing analysed: this is not proof of clean/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// -----------------------------------------------------------------------------
// --diff: changed lines, new files, pre-existing findings, repository inside test/
// -----------------------------------------------------------------------------

function temporaryRepo(sub = "") {
  const top = realpathSync(mkdtempSync(path.join(tmpdir(), "slop-lines-")));
  const repo = path.join(top, sub);
  mkdirSync(path.join(repo, "src"), { recursive: true });
  const git = (...a) => execFileSync("git", a, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "test@example.invalid");
  git("config", "user.name", "Test");
  return { top, repo, git };
}

test("--diff counts only changed lines; an old blocker in the same file is pre-existing and does not block", () => {
  const { top, repo, git } = temporaryRepo();
  try {
    writeFileSync(path.join(repo, "src", "tasks.tsx"), "export const A = () => (\n  <div>\n    <h2>✨ Tasks</h2>\n    <p>Today</p>\n  </div>\n);\n");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    writeFileSync(path.join(repo, "src", "tasks.tsx"), "export const A = () => (\n  <div>\n    <h2>✨ Tasks</h2>\n    <p>Today and tomorrow</p>\n  </div>\n);\n");
    const clean = run(["--json", "--diff", "HEAD"], repo);
    assert.equal(clean.code, 0, "only line 4 changed and it is clean");
    assert.deepEqual(clean.json.preExisting.map((a) => `${a.line} ${a.rule}`), ["3 emoji"]);
    assert.match(run(["--diff", "HEAD"], repo).out, /^Pre-existing/m);

    writeFileSync(path.join(repo, "src", "tasks.tsx"), "export const A = () => (\n  <div>\n    <h2>✨ Tasks</h2>\n    <p>Today 🚀</p>\n  </div>\n);\n");
    const dirty = run(["--json", "--diff", "HEAD"], repo);
    assert.equal(dirty.code, 1);
    assert.deepEqual(dirty.json.findings.map((a) => `${a.line} ${a.rule}`), ["4 emoji"]);
  } finally {
    rmSync(top, { recursive: true, force: true });
  }
});

test("--diff: a new untracked file counts in full, even in a repository inside a test/ folder", () => {
  const { top, repo, git } = temporaryRepo("test/app");
  try {
    writeFileSync(path.join(repo, "src", "base.tsx"), "export const B = () => <p>ok</p>;\n");
    git("add", ".");
    git("commit", "-q", "-m", "base");
    writeFileSync(path.join(repo, "src", "New.tsx"), "export const N = () => (\n  <h1>Welcome back! 🚀</h1>\n);\n");
    const r = run(["--json", "--diff", "HEAD"], repo);
    assert.equal(r.code, 1);
    assert.deepEqual(r.json.findings.map((a) => `${a.file}:${a.line} ${a.rule}`).sort(), ["src/New.tsx:2 emoji", "src/New.tsx:2 marketing-microcopy"]);
    assert.equal(run(["--json", repo]).json.summary.files, 2, "also by path: the outer test/ does not count");
  } finally {
    rmSync(top, { recursive: true, force: true });
  }
});

test("--diff: changed translation is analysed; markup in an unread extension exits 2 and is listed", () => {
  const { top, repo, git } = temporaryRepo();
  try {
    mkdirSync(path.join(repo, "src", "i18n"));
    writeFileSync(path.join(repo, "src", "i18n", "en.json"), '{\n  "ok": "Save"\n}\n');
    writeFileSync(path.join(repo, "src", "email.py"), 'BODY = "ok"\n');
    git("add", ".");
    git("commit", "-q", "-m", "base");
    writeFileSync(path.join(repo, "src", "i18n", "en.json"), '{\n  "ok": "Unlock your full potential ✨"\n}\n');
    const translation = run(["--json", "--diff", "HEAD"], repo);
    assert.equal(translation.code, 1);
    assert.deepEqual(translation.json.findings.map((a) => a.rule).sort(), ["emoji", "marketing-microcopy"]);

    git("checkout", "-q", "--", "src/i18n/en.json");
    writeFileSync(path.join(repo, "src", "email.py"), 'BODY = """<p style="font-size: 9px">Hello</p>"""\n');
    const py = run(["--json", "--diff", "HEAD"], repo);
    assert.equal(py.code, 2, "0 files read and one with unread markup: never clean");
    assert.deepEqual(JSON.parse(py.out).notAnalysed.map((n) => n.file), ["src/email.py"]);
  } finally {
    rmSync(top, { recursive: true, force: true });
  }
});

test("called through a differently named symlink (the --link installation) gives the same result as the real path", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "slop-link-"));
  // Remove the link first: recursive rmSync never reaches the repository it points to.
  const link = path.join(dir, "slop.mjs");
  try {
    symlinkSync(SCRIPT, link, "file");
    const f = path.join(HERE, "fixtures", "blocks.tsx");
    const real = spawnSync(process.execPath, [SCRIPT, "--json", f], { encoding: "utf8" });
    const through = spawnSync(process.execPath, [link, "--json", f], { encoding: "utf8" });
    assert.equal(real.status, 1);
    assert.equal(through.status, 1, `through the link exited ${through.status} with ${JSON.stringify(through.stdout + through.stderr)}`);
    assert.equal(through.stdout, real.stdout);
  } finally {
    rmSync(link, { force: true });
    rmSync(dir, { recursive: true, force: true });
  }
});

test("English CLI contract: JSON keys, severities, help and errors are English", () => {
  const r = run(["--json", "fixtures/blocks.tsx"]);
  assert.ok(Object.hasOwn(r.json, "summary"), "JSON must expose the English summary key");
  assert.deepEqual(Object.keys(r.json).sort(), ["allowed", "escapes", "findings", "notAnalysed", "preExisting", "summary"]);
  assert.ok(r.json.findings.every((f) => ["blocker", "notice"].includes(f.severity)));
  const help = run(["--help"]);
  assert.equal(help.code, 0);
  assert.match(help.out, /^usage: node detect-slop\.mjs/m);
  assert.match(help.out, /brand_gradients/);
  const invalid = run(["--unknown"]);
  assert.equal(invalid.code, 2);
  assert.match(invalid.err, /unknown option: --unknown/);
});

test("English text patterns cover translated marketing phrases and meaningful negatives", () => {
  const marketing = [
    "Unlock your full potential", "Unlock the power", "Unlock potential", "Unlock power", "Without effort", "Without complications",
    "Without stress", "Welcome back", "In the blink of an eye", "Revolutionary",
    "Maximise your potential", "Next level", "An amazing experience", "A unique experience",
    "A magical experience", "A fluid experience", "A perfect experience", "Everything in one place",
    "Supercharge your work", "Effortless", "Seamless", "A game changer", "Revolutionize your workflow",
    "Elevate your day", "All-in-one", "Blazing fast", "Like never before", "Say goodbye to delays",
    "Cutting-edge", "Best-in-class", "World-class"
  ];
  const negatives = ["Unlock door", "Save order", "3 orders to send", "Library catalogue"];
  const source = [...marketing, ...negatives].map((s, i) => `export const A${i} = () => <p>${s}</p>;`).join("\n");
  assert.deepEqual(linesForRule("marketing-microcopy", "copy.tsx", source), marketing.map((_, i) => i + 1));
  const empty = ["No data", "No data available", "No data yet", "There is no data", "Nothing to display", "Nothing to show", "Nothing here", "Nothing here yet"];
  assert.deepEqual(linesForRule("no-data", "empty.tsx", [...empty, "No orders to send today"].map((s, i) => `export const A${i} = () => <p>${s}</p>;`).join("\n")), empty.map((_, i) => i + 1));
});
