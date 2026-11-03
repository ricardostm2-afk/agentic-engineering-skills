// Validate every SKILL.md's frontmatter and references from the repository root: node --test.
// Plugin manifest validation alone cannot catch broken skill frontmatter.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS = path.join(ROOT, "skills");

// These skills use single-line values or indented folded text.
export function readFrontmatter(text) {
  const lines = text.split("\n");
  if (lines[0] !== "---") return { error: "does not start with ---" };
  const end = lines.indexOf("---", 1);
  if (end < 0) return { error: "frontmatter has no closing ---" };
  const fields = {};
  let current = null;
  for (const line of lines.slice(1, end)) {
    const m = /^([A-Za-z][\w-]*):(?: (.*))?$/.exec(line);
    if (m) {
      const value = (m[2] ?? "").trim();
      if (value === ">-" || value === ">" || value === "|") {
        current = m[1];
        fields[current] = "";
      } else {
        if (/^[[{]/.test(value) && !/[\]}]$/.test(value)) return { error: m[1] + ": unclosed YAML value" };
        if (/^["']/.test(value) && value.at(-1) !== value[0]) return { error: m[1] + ": unclosed quotes" };
        fields[m[1]] = value;
        current = null;
      }
    } else if (current && /^\s+\S/.test(line)) fields[current] += (fields[current] ? " " : "") + line.trim();
    else if (line.trim() !== "") return { error: "unexpected frontmatter line: " + line };
  }
  return { fields };
}

const folders = readdirSync(SKILLS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

test("eleven skills, each with SKILL.md", () => {
  assert.deepEqual(folders.sort(), [
    "agentic-analysis-optimization", "agentic-architecture", "agentic-ci-audit", "agentic-code-review",
    "agentic-design", "agentic-explain", "agentic-feature", "agentic-fix", "agentic-implement",
    "agentic-project", "agentic-tool-design",
  ]);
  for (const p of folders) assert.ok(existsSync(path.join(SKILLS, p, "SKILL.md")), p + ": missing SKILL.md");
});

function markdownIn(folder) {
  const result = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith(".md")) result.push(p);
    }
  };
  walk(path.join(SKILLS, folder));
  return result;
}

const CITATION = /(?:<(agentic-[a-z-]+)>\/)?(references|assets)\/([\w./-]+\.md)/g;
function missingCitations(text, owner) {
  const missing = [];
  for (const m of text.matchAll(CITATION)) {
    const sibling = m[1] ?? owner;
    if (!existsSync(path.join(SKILLS, sibling, m[2], m[3]))) missing.push(sibling + "/" + m[2] + "/" + m[3]);
  }
  return missing;
}

// A sibling placeholder requires a paragraph stating where to find it, starting with its env var.
export function siblingsWithoutRule(texts, skillMd, owner) {
  const used = new Set();
  for (const text of texts) for (const m of text.matchAll(/<(agentic-[a-z-]+)>/g)) if (m[1] !== owner) used.add(m[1]);
  const variable = (name) => "$AGENTIC_" + name.slice("agentic-".length).toUpperCase().replaceAll("-", "_") + "_DIR";
  const paragraphs = skillMd.split(/\n\s*\n/);
  return [...used].sort().filter((name) => !paragraphs.some((p) => p.includes(variable(name)) && p.includes("<" + name + ">")));
}

for (const p of folders) {
  const text = readFileSync(path.join(SKILLS, p, "SKILL.md"), "utf8");
  test(p + ": valid name and description are the only frontmatter fields", () => {
    const { fields, error } = readFrontmatter(text);
    assert.equal(error, undefined, error);
    assert.deepEqual(Object.keys(fields).sort(), ["description", "name"]);
    assert.equal(fields.name, p, "name differs from folder");
    assert.match(fields.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
    assert.ok(fields.name.length <= 64);
    assert.ok(fields.description.length > 0 && fields.description.length <= 1024, "description has " + fields.description.length + " characters");
    assert.doesNotMatch(fields.description, /[<>]/, "description contains < or >");
  });
  test(p + ": every references/ and assets/ markdown citation resolves", () => {
    const missing = [];
    for (const file of markdownIn(p)) for (const citation of missingCitations(readFileSync(file, "utf8"), p)) missing.push(path.relative(SKILLS, file) + " → " + citation);
    assert.deepEqual(missing, []);
  });
  test(p + ": each sibling placeholder has its lookup rule and $AGENTIC_…_DIR", () => {
    assert.deepEqual(siblingsWithoutRule(markdownIn(p).map((f) => readFileSync(f, "utf8")), text, p), []);
  });
  test(p + ": SKILL.md has at most 500 lines (specification recommendation)", () => {
    const count = text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
    assert.ok(count <= 500, "SKILL.md has " + count + " lines");
  });
}

test("cross-skill citations resolve in the sibling folder (control)", () => {
  assert.deepEqual(missingCitations("<agentic-code-review>/assets/reviewer-brief.template.md", "agentic-feature"), []);
  assert.deepEqual(missingCitations("assets/reviewer-brief.template.md", "agentic-feature"), ["agentic-feature/assets/reviewer-brief.template.md"]);
});
test("siblingsWithoutRule requires the complete rule in one paragraph (control)", () => {
  const brief = "<agentic-implement>/references/preferences.md and <agentic-code-review>/assets/x.md";
  const rule = "Sibling <agentic-implement> is the first folder among $AGENTIC_IMPLEMENT_DIR and the neighboring folder.";
  assert.deepEqual(siblingsWithoutRule([brief], "$AGENTIC_DESIGN_DIR", "agentic-code-review"), ["agentic-implement"]);
  assert.deepEqual(siblingsWithoutRule([brief], "Never use $AGENTIC_IMPLEMENT_DIR.\n\nUse <agentic-implement>.", "agentic-code-review"), ["agentic-implement"]);
  assert.deepEqual(siblingsWithoutRule([brief], rule, "agentic-code-review"), []);
});
test("review templates live only in agentic-code-review", () => {
  assert.ok(!existsSync(path.join(SKILLS, "agentic-feature", "assets", "reviewer-brief.template.md")));
  assert.ok(!existsSync(path.join(SKILLS, "agentic-project", "assets", "REVIEW.template.md")));
  for (const file of ["reviewer-brief.template.md", "REVIEW.template.md"]) assert.ok(existsSync(path.join(SKILLS, "agentic-code-review", "assets", file)), "missing " + file);
});

const read = (...parts) => readFileSync(path.join(SKILLS, ...parts), "utf8");
const LESSON_LINE = /\x60- <yyyy-mm-dd> · <area> · type: [^\x60\n]+\x60/g;
test("lesson writers share one docs/lessons.md line format, including type", () => {
  const format = (...parts) => read(...parts).match(LESSON_LINE) ?? [];
  const step7 = read("agentic-feature", "SKILL.md").split("## Step 7")[1];
  assert.match(step7, /lesson in[^]*<agentic-code-review>\/references\/learning\.md/);
  for (const file of markdownIn("agentic-feature")) assert.deepEqual(readFileSync(file, "utf8").match(LESSON_LINE), null, path.relative(SKILLS, file) + " copies the format");
  const sites = {
    project: format("agentic-project", "SKILL.md"),
    learning: format("agentic-code-review", "references", "learning.md"),
    evaluation: format("agentic-code-review", "assets", "eval-case.template.md"),
  };
  for (const [name, found] of Object.entries(sites)) {
    assert.equal(found.length, 1, name + ": missing or repeated format");
    assert.match(found[0], /type: <escaped\|repeated>/, name + ": missing lesson types");
  }
  const [first, ...rest] = Object.values(sites).map((a) => a[0]);
  for (const other of rest) assert.equal(other, first);
});

const REVIEW_ONLY = /range-diff|verdict|deduplic/i;
export function reviewCopies(files) {
  return files.flatMap((file) => readFileSync(file, "utf8").split("\n").flatMap((line, i) => REVIEW_ONLY.test(line) ? [path.relative(SKILLS, file) + ":" + (i + 1)] : []));
}
test("agentic-feature and agentic-project do not repeat review rules", () => {
  assert.deepEqual(reviewCopies([...markdownIn("agentic-feature"), ...markdownIn("agentic-project")]), []);
  assert.ok(reviewCopies(markdownIn("agentic-code-review")).length > 0, "control: review markers missing from their source");
});
test("agentic-feature calls agentic-code-review in step 6; project points to it", () => {
  const feature = read("agentic-feature", "SKILL.md");
  const step6 = feature.slice(feature.indexOf("## Step 6"), feature.indexOf("## Step 7"));
  assert.match(step6, /sibling \x60agentic-code-review\x60/);
  assert.match(step6, /read\/follow its \x60SKILL\.md\x60/);
  assert.match(read("agentic-feature", "references", "review-and-delivery.md"), /<agentic-code-review>\/references\/panel-and-rounds\.md/);
  assert.match(read("agentic-project", "references", "skills-map.md"), /^\| Code review.*\x60agentic-code-review\x60/m);
  assert.match(read("agentic-project", "assets", "AGENTS.template.md"), /\x60agentic-code-review\x60 \(read \x60REVIEW\.md\x60\)/);
});

const DESIGN_ONLY = /Recognizable by|slop-ok-block|\bB1–B2\d\b/;
export function designCopies(files) {
  return files.flatMap((file) => readFileSync(file, "utf8").split("\n").flatMap((line, i) => DESIGN_ONLY.test(line) ? [path.relative(SKILLS, file) + ":" + (i + 1)] : []));
}
test("agentic-feature calls agentic-design in steps 2, 3, 5 and 6 without copying UI rules", () => {
  assert.match(featureStep(2), /<agentic-design>\/references\/ui-questions\.md/);
  assert.match(featureStep(3), /sibling \x60agentic-design\x60, “variants” mode/);
  assert.match(featureStep(3), /<agentic-design>\/SKILL\.md/);
  assert.match(featureStep(5), /\x60agentic-design\x60, “build” mode/);
  assert.match(featureStep(6), /“review” mode/);
  assert.match(read("agentic-feature", "assets", "agent-brief.template.md"), /node <agentic-design>\/scripts\/detect-slop\.mjs --diff/);
  assert.ok(!existsSync(path.join(SKILLS, "agentic-feature", "scripts")), "detector belongs only to agentic-design");
  assert.deepEqual(designCopies(markdownIn("agentic-feature")), []);
  assert.ok(designCopies(markdownIn("agentic-design")).length > 0, "control: design markers absent from source");
});

// Public cards have fixed declarations; the private generator is not shipped.
const WITH_CARD = ["agentic-feature/SKILL.md", "agentic-fix/SKILL.md"];
const hasCard = (file) => WITH_CARD.includes(path.relative(SKILLS, file).split(path.sep).join("/"));
export function linesOutsideCard(text, withCard = false) {
  const result = [];
  let state = withCard ? "before" : "none";
  let separator = false;
  text.split("\n").forEach((line, i) => {
    if (state === "inside") { if (line.trim() === "<!-- card:end -->") { state = "after"; separator = true; } return; }
    if (state === "before" && line.startsWith("<!-- card:start")) { state = "inside"; return; }
    if (separator && line.trim() === "") { separator = false; return; }
    separator = false;
    result.push([line, i + 1]);
  });
  assert.ok(state !== "inside", "card lacks <!-- card:end -->");
  return result;
}
function featureStep(n) {
  const feature = read("agentic-feature", "SKILL.md");
  return feature.slice(feature.indexOf("## Step " + n), feature.indexOf(n === 7 ? "\n## " : "## Step " + (n + 1), feature.indexOf("## Step " + n) + 1));
}
test("agentic-feature: at most 300 lines outside the generated card", () => {
  const outside = (text) => linesOutsideCard(text, true).length - (text.endsWith("\n") ? 1 : 0);
  const count = outside(read("agentic-feature", "SKILL.md"));
  assert.ok(count <= 300, count + " lines outside card");
  assert.equal(outside("a\n\n<!-- card:start -->\nx\n<!-- card:end -->\n\nb\n"), 3, "card and following blank line do not count");
  assert.throws(() => linesOutsideCard("a\n<!-- card:start -->\nx\n", true), /card lacks/);
});
test("agentic-feature: grill and variants stop; only Complete waits for proceed, Standard gets a notice", () => {
  const table = read("agentic-feature", "SKILL.md").split("\n").filter((line) => /^\| [0-7] \|/.test(line));
  assert.equal(table.length, 8, "steps 0 to 7");
  assert.match(table[2], /checkpoint 1/);
  assert.match(table[3], /checkpoint 2/);
  assert.match(table[4], /Complete.*“proceed”.*Standard.*notice/);
  for (const i of [0, 1, 5, 6]) assert.doesNotMatch(table[i], /checkpoint|“proceed”/, "no stop at step " + i);
  assert.match(featureStep(4), /\*\*Complete: gate\.\*\*/);
  assert.match(featureStep(4), /\*\*Standard: notice\.\*\*[^]*spec path[^]*stop/);
});

const MODEL_TABLE = /Sonnet|Opus|Haiku|gpt-\d|model_reasoning_effort|effort (xhigh|max|medium)/i;
export function modelsOutside(files) {
  return files.flatMap((file) => linesOutsideCard(readFileSync(file, "utf8"), hasCard(file)).filter(([line]) => MODEL_TABLE.test(line)).map(([, n]) => path.relative(SKILLS, file) + ":" + n));
}
test("agentic-feature points to choosing-the-agent.md §1–§4 without its own model table", () => {
  assert.match(featureStep(5), /<agentic-implement>\/references\/choosing-the-agent\.md\x60 §1–§3/);
  assert.match(featureStep(5), /§4[^]*Claude subagent[^]*Codex job[^]*launcher[^]*\x60codex exec\x60/);
  assert.deepEqual(modelsOutside(markdownIn("agentic-feature")), []);
  assert.ok(modelsOutside([path.join(SKILLS, "agentic-implement", "references", "choosing-the-agent.md")]).length > 0, "control: source lacks model table");
});
test("agentic-feature's brief loads agentic-implement instead of repeating its process", () => {
  const brief = read("agentic-feature", "assets", "agent-brief.template.md");
  assert.match(brief, /Load \x60agentic-implement\x60 \(Codex: \x60\$agentic-implement\x60\)/);
  assert.match(brief.replace(/^<!--[\s\S]*?-->\n*/, ""), /^<project job launcher header/);
  for (const pattern of [/status: done/, /## Final report/, /git add/, /--no-verify/, /## Scope questions/]) assert.doesNotMatch(brief, pattern, "brief repeats implementation process");
});

// Authorization belongs to the implementation skill; briefs carry the human-order channel.
test("agentic-implement step 7 requires a human order for push, deploy and production; no hook bypass or history rewrite", () => {
  const step7 = section(read("agentic-implement", "SKILL.md"), "## 7. ");
  assert.doesNotMatch(step7, /[Nn]ever push\b/);
  assert.match(step7, /Push, deploy or production access only when the brief's \x60human order:\x60 line requests it, and only for that task/);
  assert.match(step7, /same rule for a Claude subagent and a Codex job/);
  assert.match(step7, /job launcher records the order[^]*only that block's order counts/);
  const brief = read("agentic-feature", "assets", "agent-brief.template.md");
  assert.match(brief, /^human order: </m);
  assert.match(brief, /Its process, limits and delivery apply/);
  assert.doesNotMatch(brief, /Without an order, commits stay on the branch/);
  const fix = read("agentic-fix", "assets", "fix-brief.template.md");
  assert.match(fix, /^human order: \{\{/m);
  assert.match(fix, /Without an order, commits stay on the branch[^]*push, deploy and production belong to the orchestrator/);
  assert.match(read("agentic-fix", "SKILL.md"), /sensitive zone \(yes or no\), human order/);
  assert.match(step7, /[Nn]ever \x60--no-verify\x60/);
  assert.match(step7, /never rewrite history \([^)]*rebase[^)]*amend[^)]*force-push[^)]*\)/);
  assert.match(step7, /orchestrator[^.]*integrates|integrates[^.]*orchestrator/);
  const push = read("agentic-project", "assets", "AGENTS.template.md").split("\n").filter((line) => /\bpush/.test(line) && /at the end/.test(line));
  assert.equal(push.length, 1);
  assert.match(push[0], /orchestrator/);
});
test("agentic-implement owns timeout and child-process rules; feature delivery points there", () => {
  const tests = read("agentic-implement", "references", "tests.md").replace(/\s+/g, " ");
  assert.match(tests, /timeout[^.]*at least 2×/i);
  assert.match(tests, /Registered child[^.]*register child termination before starting it/i);
  assert.match(tests, /teardown/);
  assert.match(tests, /orphan child hangs the suite/);
  assert.match(read("agentic-implement", "SKILL.md"), /child processes[^]*\x60references\/tests\.md\x60/);
  const trap = read("agentic-feature", "references", "review-and-delivery.md").match(/^9\. \*\*Tight timeouts[^]*?(?=^10\. )/m)?.[0] ?? "";
  assert.match(trap, /<agentic-implement>\/references\/tests\.md/);
  assert.doesNotMatch(trap, /≥ 2×|teardown/);
});
test("agentic-feature: job prompt is launcher rules plus the brief, by pointer", () => {
  const implementation = read("agentic-feature", "references", "implementation.md").replace(/\s+/g, " ");
  assert.match(implementation, /Prepended common launcher rules plus brief by pointer/);
  assert.match(implementation, /as project AGENTS\.md\/CLAUDE\.md specifies/);
  assert.match(implementation, /launcher rules plus brief by pointer/);
  const brief = read("agentic-feature", "assets", "agent-brief.template.md");
  assert.match(brief, /Project rules: \x60[^\x60]*(?:AGENTS|CLAUDE)\.md[^\x60]*\x60/);
  assert.match(brief, /launcher rules: \x60<path or none>\x60/);
  assert.match(brief, /common job rules[^]*rules plus this brief by pointer; do not copy/);
});
test("agentic-feature: brief supports launcher board registration and title format", () => {
  const brief = read("agentic-feature", "assets", "agent-brief.template.md");
  assert.match(brief, /^<lane title[^\n]*Task <n> — <name>/m);
  const board = brief.split("\n## Board")[1];
  assert.match(board, /Launcher registers each job on board[^]*agent does not register/);
  assert.match(board, /^item: <id[^>]*>$/m);
  assert.match(board, /Otherwise[^]*register per README beside CLI/);
  assert.ok(board.indexOf("agent heartbeat") > board.indexOf("Otherwise"));
  assert.match(board, /Choose launch case/);
  assert.match(board, /Otherwise\*\* \(subagent or non-registering launcher\)/);
});

export function fixedText(template) {
  return template.replace(/^<!--[\s\S]*?-->\n?/, "").replace(/\{\{[\s\S]*?\}\}/g, "");
}
test("AGENTS.md and REVIEW.md templates fit their byte budgets", () => {
  const fixed = Buffer.byteLength(fixedText(read("agentic-project", "assets", "AGENTS.template.md")));
  assert.ok(fixed <= 3200, "AGENTS.template.md fixed text: " + fixed + " bytes");
  const review = Buffer.byteLength(read("agentic-code-review", "assets", "REVIEW.template.md"));
  assert.ok(review <= 3000, "REVIEW.template.md: " + review + " bytes");
});
test("fixedText removes the comment and placeholders (control)", () => {
  assert.equal(fixedText("<!-- long\nnote -->\n# A\n{{x}} b {{y\nz}}c\n"), "# A\n b c\n");
});
test("frontmatter reader rejects broken input (control)", () => {
  assert.ok(readFrontmatter("---\nname: [broken\ndescription: x\n---\n").error);
  assert.ok(readFrontmatter("---\nname: a\ndescription: x\n").error);
  assert.ok(readFrontmatter("name: a\n").error);
  assert.equal(readFrontmatter("---\nname: a\ndescription: >-\n  one\n  two\n---\n").fields.description, "one two");
});
test("agentic-implement: preferences.md contains Code and Product text only, with a design-sibling rule", () => {
  const file = path.join(SKILLS, "agentic-implement", "references", "preferences.md");
  assert.ok(existsSync(file));
  const text = readFileSync(file, "utf8");
  assert.deepEqual(text.split("\n").filter((line) => line.startsWith("## ")), ["## Code", "## Product text"]);
  assert.match(text, /\x60<agentic-design>\x60 is the sibling skill/);
});
test("agentic-feature: trivial-change research is a 1–2-minute check", () => {
  const when = section(read("agentic-feature", "references", "current-research.md"), "## When, limits and location");
  assert.match(when, /Trivial Standard change[^]*1–2-minute check/);
  assert.match(featureStep(1), /trivial changes get one Reading line, no \x60research-notes\.md\x60/);
  assert.match(read("agentic-feature", "references", "review-and-delivery.md"), /trivial\s+Reading line/);
});
test("agentic-implement step 6 points to preferences, project design system and AGENTS.md", () => {
  const step6 = read("agentic-implement", "SKILL.md").split("## 6. ")[1].split("\n## ")[0];
  assert.match(step6, /\x60references\/preferences\.md\x60/);
  assert.match(step6, /project's design system/);
  assert.match(step6, /\x60AGENTS\.md\x60/);
});
test("agentic-code-review standards lens uses agentic-implement preferences.md", () => {
  const brief = read("agentic-code-review", "assets", "reviewer-brief.template.md");
  const standards = brief.match(/^- \*\*Standards\*\*:[^]*?(?=^- \*\*)/m)?.[0] ?? "";
  assert.ok(standards);
  assert.match(standards, /\x60<agentic-implement>\/references\/preferences\.md\x60/);
  assert.match(brief.split("-->")[0], /<agentic-implement>/);
});

test("agentic-architecture: six steps with completion criteria, measured proof, one-question grill and feature execution", () => {
  const steps = read("agentic-architecture", "SKILL.md").split(/^## (?=\d\. )/m).slice(1).map((p) => p.split("\n## ")[0]);
  assert.deepEqual(steps.map((p) => p.slice(0, 2)), ["1.", "2.", "3.", "4.", "5.", "6."]);
  for (const step of steps) assert.match(step, /\nDone when /);
  const [, proof, report, , grill, execution] = steps;
  for (const marker of [/git log/, /\x60file:line\x60/, /\*\*deletion test\*\*/, /never estimated/]) assert.match(proof, marker);
  assert.match(report, /\x60references\/report\.md\x60[^]*Artifact tool/);
  assert.match(grill, /\x60references\/grill\.md\x60: one question at a time/);
  assert.match(grill, /\x60references\/design-it-twice\.md\x60/);
  assert.match(execution, /<agentic-feature>\/SKILL\.md/);
  assert.match(read("agentic-architecture", "references", "grill.md"), /^## One question at a time$/m);
});
test("agentic-architecture: vocabulary defines the method's terms and principles", () => {
  const vocabulary = read("agentic-architecture", "references", "vocabulary.md");
  for (const term of ["Module", "Interface", "Implementation", "Depth", "Seam", "Adapter", "Port", "Leverage", "Locality", "Deepening", "Friction", "Domain glossary"]) {
    assert.match(vocabulary, new RegExp("^\\*\\*" + term + "\\*\\*", "m"), "missing " + term);
  }
  for (const principle of ["The deletion test.", "The interface is the testing surface.", "One adapter is a hypothetical seam; two are a real seam."]) {
    assert.ok(vocabulary.includes("**" + principle + "**"), "missing " + principle);
  }
});

const VOCABULARY = "<agentic-architecture>/references/vocabulary.md";
export function codebaseDesignWithoutPointer(text) {
  const blocks = text.split(/\n\s*\n/).flatMap((p) => /^\|/m.test(p) ? p.split("\n") : [p]);
  return blocks.filter((block) => block.includes("codebase-design") && !block.includes(VOCABULARY)).map((block) => block.trim().slice(0, 80));
}
test("architecture vocabulary has one source; feature, implementation and project point to it", () => {
  const sites = {
    step3: read("agentic-implement", "SKILL.md").split("## 3. ")[1].split("\n## ")[0],
    seams: read("agentic-implement", "references", "tests.md").split("## Seams")[1].split("\n## ")[0],
    plan: read("agentic-feature", "references", "spec-kit.md").split("**speckit-plan**")[1].split("\n4. ")[0],
    modules: read("agentic-feature", "assets", "light-spec.template.md").split("\n").find((line) => line.startsWith("**Modules touched**")),
    phase3: read("agentic-project", "references", "architecture.md").split("## 4. Deep modules")[1].split("\n## ")[0],
    map: read("agentic-project", "references", "skills-map.md").split("\n").find((line) => line.startsWith("| Designing modules, interfaces, seams |")),
  };
  for (const [site, text] of Object.entries(sites)) assert.ok(text?.includes(VOCABULARY), site + ": missing vocabulary pointer");
  const outside = ["agentic-feature", "agentic-implement", "agentic-project"].flatMap((skill) => markdownIn(skill).flatMap((file) => codebaseDesignWithoutPointer(readFileSync(file, "utf8")).map((block) => path.relative(SKILLS, file) + ": " + block)));
  assert.deepEqual(outside, []);
});
test("codebaseDesignWithoutPointer catches a missing adjacent pointer (control)", () => {
  assert.equal(codebaseDesignWithoutPointer("Use mattpocock-skills:codebase-design.\n\nAnother paragraph.").length, 1);
  assert.deepEqual(codebaseDesignWithoutPointer("Use " + VOCABULARY + "; codebase-design is an alternative."), []);
  assert.equal(codebaseDesignWithoutPointer("| a | codebase-design |\n| b | " + VOCABULARY + " |").length, 1);
});
test("agentic-architecture: frequency and co-change have commands; history window is always declared", () => {
  const step2 = read("agentic-architecture", "SKILL.md").split("## 2. ")[1].split("\n## ")[0];
  assert.ok(step2.includes("git log --since=<date> --format=%H -- <candidate files> | wc -l"));
  assert.ok(step2.includes("git log --since=<date> --full-diff --name-only --format= -- <candidate files> | grep . | sort | uniq -c | sort -rn"));
  assert.match(step2, /history window[^]*declare it[^]*even when the human gave a direction/);
});
test("agentic-architecture: report follows design rules and its HTML blocks pass the detector", (t) => {
  const report = read("agentic-architecture", "references", "report.md");
  const style = report.split("## Style")[1].split("\n## ")[0];
  assert.match(style, /<agentic-design>\/references\/ui-without-slop\.md/);
  assert.match(style, /node <agentic-design>\/scripts\/detect-slop\.mjs <report file>/);
  assert.doesNotMatch(report, /\buppercase\b|tracking-wid|linear-gradient|bg-gradient|border-l-\d/);
  const blocks = [...report.matchAll(/```html\n([^]*?)```/g)].map((m) => m[1]);
  assert.ok(blocks.length >= 2, "skeleton and Mermaid example");
  const folder = mkdtempSync(path.join(tmpdir(), "report-"));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  blocks.forEach((block, i) => writeFileSync(path.join(folder, "block-" + i + ".html"), block));
  const result = spawnSync(process.execPath, [path.join(SKILLS, "agentic-design", "scripts", "detect-slop.mjs"), folder], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, new RegExp(blocks.length + " file\\(s\\) analysed: 0 blocker\\(s\\), 0 notice\\(s\\)"));
});

// Rule guards pin each rule's home and search for literal copies elsewhere.
const allMarkdown = () => folders.flatMap(markdownIn);
export function markersInText(pattern, text, withCard = false) {
  return linesOutsideCard(text, withCard).filter(([line]) => pattern.test(line)).map(([, n]) => n);
}
export function markersOutside(pattern, source) {
  return allMarkdown().filter((file) => path.relative(SKILLS, file) !== source).flatMap((file) => markersInText(pattern, readFileSync(file, "utf8"), hasCard(file)).map((n) => path.relative(SKILLS, file) + ":" + n));
}
test("markersOutside ignores only the first declared generated card", () => {
  const pattern = /Steps not enumerable\?/;
  const text = [
    "Steps not enumerable? (outside, before)", "<!-- card:start — copied from sources -->",
    "## Card", "3. **Steps not enumerable?** (inside)", "<!-- card:end -->", "",
    "Steps not enumerable? (outside, after)",
  ].join("\n");
  assert.deepEqual(markersInText(pattern, text, true), [1, 7]);
  assert.deepEqual(markersInText(pattern, "<!-- card:level-1 -->\nSteps not enumerable?\n<!-- /card:level-1 -->"), [2]);
  assert.deepEqual(markersInText(pattern, text, false), [1, 4, 7]);
  const twoCards = [text, "<!-- card:start — another -->", "Steps not enumerable? (second card)", "<!-- card:end -->"].join("\n");
  assert.deepEqual(markersInText(pattern, twoCards, true), [1, 7, 9]);
  const source = "agentic-implement/references/choosing-the-agent.md";
  for (const skill of ["agentic-fix", "agentic-feature"]) assert.match(read(skill, "SKILL.md"), pattern);
  assert.deepEqual(markersOutside(pattern, source), []);
  assert.ok(markersOutside(pattern, "").length > 0, "control: marker absent from source");
});
export function cardProblems(relative, text, declared) {
  const lines = text.split("\n");
  const starts = lines.filter((line) => line.startsWith("<!-- card:start")).length;
  const ends = lines.filter((line) => line.trim() === "<!-- card:end -->").length;
  if (declared) return starts === 1 && ends === 1 ? [] : [relative + ": expected one card start and end, got " + starts + "/" + ends];
  return starts || ends ? [relative + ": undeclared card markers"] : [];
}
test("only declared SKILL.md files contain a card, exactly one each", () => {
  assert.deepEqual(WITH_CARD, ["agentic-feature/SKILL.md", "agentic-fix/SKILL.md"]);
  assert.deepEqual(allMarkdown().flatMap((file) => {
    const relative = path.relative(SKILLS, file);
    return cardProblems(relative, readFileSync(file, "utf8"), WITH_CARD.includes(relative));
  }), []);
  const card = "<!-- card:start — x -->\n## Card\n<!-- card:end -->\n";
  assert.ok(cardProblems("agentic-fix/references/x.md", "a\n\n" + card, false).length > 0);
  assert.ok(cardProblems("agentic-fix/SKILL.md", card + "\n" + card, true).length > 0);
  assert.ok(cardProblems("agentic-fix/SKILL.md", "no card\n", true).length > 0);
  assert.deepEqual(cardProblems("agentic-fix/SKILL.md", "a\n\n" + card, true), []);
});

const section = (text, heading) => text.split(heading)[1].split("\n## ")[0].replace(/\s+/g, " ");
test("agentic-implement: level measures open brief decisions; four ordered questions; decided work is not complex", () => {
  const source = "agentic-implement/references/choosing-the-agent.md";
  const level = section(read("agentic-implement", "references", "choosing-the-agent.md"), "## 1. ");
  assert.match(level, /Level measures what the agent still needs to decide or discover that the brief does not say/);
  assert.match(level, /Before calling a task complex, close what you can/);
  const positions = ["Unknown cause?", "Design that only shows in the code?", "Steps not enumerable?", "Already failed?"].map((question) => level.indexOf("**" + question + "**"));
  assert.ok(positions.every((i, k) => i >= 0 && (k === 0 || i > positions[k - 1])));
  assert.match(level, /stop at the first that leads to \*\*complex\*\*/);
  assert.match(level, /Passed all four: \*\*well-defined\*\*\. New design, delicate logic[^.]*do not make the task complex when the brief has already decided them/);
  assert.match(level, /fixing an Important the orchestrator reproduced and wrote a rule for/);
  assert.match(level, /The human may force the level/);
  assert.match(level, /sensitive zone \(tenant, session, billing, personal data\) does not raise the level[^.]*affects the review level/);
  assert.doesNotMatch(level, /Always-high paths|risk-levels/);
  assert.doesNotMatch(level, /\*\*New design\?\*\*|\*\*Delicate logic\?\*\*|\*\*Multiple areas\?\*\*/);
  const labels = ["unknown cause", "design that only shows in the code", "steps not enumerable", "already failed"];
  assert.ok(level.includes("level: well-defined — decisions closed: <which>"));
  assert.match(level, /level: complex — <label>: <detail>[^]*using one of the four questions as the label, lowercase without “\?”/);
  for (const label of labels) assert.ok(level.includes("\x60" + label + "\x60"));
  assert.ok(level.includes("level: <level> — forced by the human: <their words>"));
  assert.match(level, /launch guard reads it/);
  assert.match(level, /level: complex — unknown cause: [^\x60]+/);
  for (const template of [["agentic-fix", "assets", "fix-brief.template.md"], ["agentic-feature", "assets", "agent-brief.template.md"]]) {
    const line = read(...template).split("\n").find((l) => l.startsWith("level: "));
    assert.ok(line, template.join("/") + ": missing level line");
    for (const form of ["well-defined — decisions closed: <which>", "complex — <" + labels.join("|") + ">: <detail>", "<level> — forced by the human: <their words>"]) assert.ok(line.includes(form), "missing level form: " + form);
  }
  assert.deepEqual(markersOutside(/Unknown cause\?|Design that only shows in the code\?|Steps not enumerable\?/, source), []);
  assert.ok(markersOutside(/Steps not enumerable\?/, "").length > 0);
});
test("agentic-implement: agent stays with orchestrator's provider; headroom does not switch it", () => {
  const source = "agentic-implement/references/choosing-the-agent.md";
  const agent = section(read("agentic-implement", "references", "choosing-the-agent.md"), "## 3. ");
  assert.match(agent, /Use the orchestrator's agent\. The other is involved only on an explicit human request for that work/);
  assert.match(agent, /does not change the agent: tell the human the remaining headroom and ask/);
  assert.doesNotMatch(agent, /go to the other|more headroom at/);
  assert.match(section(read("agentic-code-review", "references", "panel-and-rounds.md"), "## §3 "), /Provider is the orchestrator's; use the other only on explicit human request \(\x60<agentic-implement>\/references\/choosing-the-agent\.md\x60 §3\)/);
  assert.deepEqual(markersOutside(/The other is involved only on an explicit human request/, source), []);
});
test("agentic-implement: orchestrator handles short tasks without brief; fix and feature point to §1", () => {
  const source = "agentic-implement/references/choosing-the-agent.md";
  const level = section(read("agentic-implement", "references", "choosing-the-agent.md"), "## 1. ");
  assert.match(level, /\*\*short\*\* when it fits one lane, with 1 code file and its test, up to ~50 changed lines/);
  assert.match(level, /outside sensitive zones[^]*and outside hooks, CI and installers/);
  assert.match(level, /orchestrator handles short tasks with \x60agentic-implement\x60, without a brief or agent/);
  assert.match(level, /writer does not review/);
  assert.ok(level.includes("level: short — <why>"));
  assert.match(section(read("agentic-fix", "SKILL.md"), "## Step 2"), /§1[^]*<agentic-implement>\/references\/choosing-the-agent\.md[^]*\*\*short\*\*[^]*no brief or agent/);
  assert.match(featureStep(5), /choosing-the-agent\.md\x60 §1–§3[^]*short lanes \(§1\)[^]*without brief/);
  assert.deepEqual(markersOutside(/1 code file and its test/, source), []);
});
test("agentic-design: corrections capture before/after; full matrix only for new screens or redesigns", () => {
  const source = "agentic-design/references/proof.md";
  const capture = section(read("agentic-design", "references", "proof.md"), "## 2. Capture");
  assert.match(capture, /For a correction, one screenshot of the reported screen before and after, in the report's theme and resolution/);
  assert.match(capture, /with and without data only if the correction affects that state/);
  assert.match(capture, /full matrix \(states, resolutions, themes, keyboard\) is only for a new screen or a redesign/);
  assert.match(capture, /\*\*The full matrix\.\*\* Capture populated/);
  assert.match(capture, /rest of §2 also applies to screenshots for a correction/);
  const step3 = section(read("agentic-fix", "SKILL.md"), "## Step 3");
  assert.match(step3, /visual defect[^]*<agentic-design>\/references\/proof\.md\x60 §2/);
  assert.doesNotMatch(step3, /resolu|\btheme|matrix|empty/i);
  assert.deepEqual(markersOutside(/full matrix/i, source), []);
  assert.ok(markersOutside(/full matrix/i, "").length > 0);
});
test("agentic-code-review: reviewer acceptance-test rule lives in panel §3; other sites point there", () => {
  const lenses = section(read("agentic-code-review", "references", "panel-and-rounds.md"), "## §3 ");
  assert.match(lenses, /Complete[^.]*reviewer writes and runs an acceptance test outside the repo from intent/);
  assert.match(lenses, /Standard[^.]*describes it/);
  assert.match(lenses, /Quick[^.]*has none/);
  const pointer = /panel-and-rounds\.md\x60? §3/;
  const old = /describes or delivers|[Dd]escribe at least one acceptance test|add at least one acceptance test|confirms or adds|delivered outside the repo/;
  const brief = read("agentic-code-review", "assets", "reviewer-brief.template.md");
  const sites = {
    specLens: brief.match(/^- \*\*Spec\*\*[^]*?(?=^- \*\*)/m)?.[0],
    report: read("agentic-code-review", "assets", "report.template.md").match(/^- \*\*Acceptance test\*\*[^]*?(?=^- )/m)?.[0],
    reviewer: read("agentic-project", "references", "methodology.md").split("\n").find((line) => line.startsWith("| Reviewer |")),
    methodTrap: read("agentic-project", "references", "methodology.md").match(/^- \*\*Author tests[^]*?(?=^- \*\*)/m)?.[0],
    featureTrap: read("agentic-feature", "references", "review-and-delivery.md").match(/^2\. \*\*Author test[^]*?(?=^3\. )/m)?.[0],
  };
  for (const [site, text] of Object.entries(sites)) {
    assert.ok(text, "missing " + site);
    assert.match(text.replace(/\s+/g, " "), pointer, site);
    assert.doesNotMatch(text.replace(/\s+/g, " "), old, site);
  }
  assert.doesNotMatch(brief, /delivered outside the repo/);
  const integration = {
    step3: read("agentic-feature", "references", "review-and-delivery.md").match(/^3\. \*\*Reviewer acceptance test[^]*?(?=^4\. )/m)?.[0],
    agents: read("agentic-project", "references", "methodology.md").split("\n").find((line) => line.startsWith("| Agents |")),
  };
  for (const [site, text] of Object.entries(integration)) {
    assert.ok(text, "missing " + site);
    assert.match(text.replace(/\s+/g, " "), /(?:in |for |on )Complete/i, site + ": missing Complete condition");
  }
});
test("agentic-code-review: Standard lenses share one reviewer; risk table and SKILL.md point to panel §3", () => {
  const source = "agentic-code-review/references/panel-and-rounds.md";
  const lenses = section(read("agentic-code-review", "references", "panel-and-rounds.md"), "## §3 ");
  assert.match(lenses, /\*\*Standard\*\* groups its lenses \(correctness, spec, standards, or \x60REVIEW\.md\x60's choices\) in one fresh-context reviewer with one brief/);
  assert.match(lenses, /\*\*Complete\*\* gives each lens its own reviewer, including security, and a separate verifier/);
  const standard = read("agentic-code-review", "references", "risk-levels.md").split("\n").find((line) => line.startsWith("| Standard |"));
  assert.match(standard, /one reviewer \(\x60panel-and-rounds\.md\x60 §3\)/);
  assert.match(read("agentic-code-review", "SKILL.md").replace(/\s+/g, " "), /lenses[^]*\x60references\/panel-and-rounds\.md\x60 §3[^]*level/);
  assert.deepEqual(markersOutside(/groups its lenses \(correctness, spec, standards/, source), []);
});
test("agentic-code-review: coverage numbers are neither a gate nor findings, only in panel §3", () => {
  const source = "agentic-code-review/references/panel-and-rounds.md";
  const lenses = section(read("agentic-code-review", "references", "panel-and-rounds.md"), "## §3 ");
  assert.match(lenses, /No coverage number as gate/i);
  assert.match(lenses, /test failing on base[^.]*assertion integrity[^.]*guard mutations/);
  assert.match(lenses, /Missing coverage numbers are not findings/);
  assert.deepEqual(markersOutside(/coverage number/i, source), []);
  assert.ok(markersOutside(/coverage number/i, "").length > 0);
});
test("lessons follow REVIEW.md; docs/lessons.md is only the default in learning.md", () => {
  const source = "agentic-code-review/references/learning.md";
  const rule = read("agentic-code-review", "references", "learning.md").replace(/\s+/g, " ");
  assert.match(rule, /\*\*Where it lives\.\*\* Where project \x60REVIEW\.md\x60 specifies/);
  assert.match(rule, /without a specification, \x60docs\/lessons\.md\x60/);
  const step8 = section(read("agentic-fix", "SKILL.md"), "## Step 8");
  assert.match(step8, /\x60REVIEW\.md\x60/);
  assert.match(step8, /learning\.md\x60 \(“Where it lives”\)/);
  const allowed = [source, "agentic-code-review/assets/eval-case.template.md", "agentic-code-review/assets/REVIEW.template.md"];
  const fixed = ["agentic-feature", "agentic-fix", "agentic-code-review"].flatMap(markdownIn).filter((file) => !allowed.includes(path.relative(SKILLS, file))).flatMap((file) => readFileSync(file, "utf8").split("\n").flatMap((line, i) => /docs\/lessons\.md/.test(line) ? [path.relative(SKILLS, file) + ":" + (i + 1)] : []));
  assert.deepEqual(fixed, []);
  assert.match(read("agentic-code-review", "assets", "REVIEW.template.md"), /^Lessons and evaluation cases: /m);
  assert.deepEqual(markersOutside(/Where project \x60REVIEW\.md\x60 specifies/, source), []);
});
test("agentic-code-review: reviewer temporaries follow panel §2, without fixed /tmp paths", () => {
  const source = "agentic-code-review/references/panel-and-rounds.md";
  const worktree = section(read("agentic-code-review", "references", "panel-and-rounds.md"), "## §2 ");
  assert.match(worktree, /\x60<tmp>\x60 in order: project\/user temporary folder; session scratchpad/);
  assert.match(worktree, /\/var\/folders/);
  const fixed = markdownIn("agentic-code-review").filter((file) => /\$\{TMPDIR:-\/tmp\}\/(review|acceptance)|\/tmp\/acceptance/.test(readFileSync(file, "utf8")));
  assert.deepEqual(fixed.map((file) => path.relative(SKILLS, file)), []);
  assert.match(read("agentic-code-review", "SKILL.md").replace(/\s+/g, " "), /"<tmp>\/review-<topic>-<lens>"[^.]*\x60references\/panel-and-rounds\.md\x60 §2/);
  assert.match(read("agentic-code-review", "assets", "reviewer-brief.template.md"), /<acceptance-tmp>/);
  assert.deepEqual(markersOutside(/\x60<tmp>\x60 in order/, source), []);
});
test("one How to undo field, in the integration commit; agentic-fix points to panel §10", () => {
  const base = allMarkdown().filter((file) => /^agentic-(feature|fix|implement|code-review|design|project|architecture)\//.test(path.relative(SKILLS, file)));
  assert.deepEqual(base.filter((file) => /How to revert|\bRevert:/.test(readFileSync(file, "utf8"))).map((file) => path.relative(SKILLS, file)), []);
  const fix = read("agentic-fix", "SKILL.md");
  assert.doesNotMatch(section(fix, "## Step 5"), /\x60Risk:\x60/);
  assert.match(section(fix, "## Step 7"), /\x60How to undo:\x60[^]*panel-and-rounds\.md\x60 §10/);
  assert.match(section(read("agentic-code-review", "references", "panel-and-rounds.md"), "## §10 "), /other names\/locations, those apply/);
});
test("three scales have one mapping table; reviewer brief labels Review level", () => {
  const source = "agentic-code-review/references/risk-levels.md";
  const scales = section(read("agentic-code-review", "references", "risk-levels.md"), "## Three scales");
  for (const values of ["Quick, Standard, Complete", "short, well-defined, complex", "Quick, Normal, Deep"]) assert.ok(scales.includes(values), values);
  assert.match(scales, /\x60level:\x60 in writer brief/);
  assert.match(scales, /review level always includes “review”/);
  const brief = read("agentic-code-review", "assets", "reviewer-brief.template.md");
  assert.match(brief, /^- Review level: /m);
  assert.doesNotMatch(brief, /^- Level: /m);
  assert.match(read("agentic-implement", "references", "choosing-the-agent.md").split("## 1. ")[0].replace(/\s+/g, " "), /risk-levels\.md\x60, “Three scales”/);
  assert.deepEqual(markersOutside(/Quick, Normal, Deep|map 1:1/, source), []);
});
test("agentic-implement: a job without subagents gets no panels; review is one job per reviewer or not independent", () => {
  const source = "agentic-implement/references/choosing-the-agent.md";
  const launch = section(read("agentic-implement", "references", "choosing-the-agent.md"), "## 4. ");
  assert.match(launch, /\*\*Job without subagents\*\*/);
  assert.match(launch, /never run an orchestrator skill in full \(\x60agentic-feature\x60, the \x60agentic-code-review\x60 panel\)/);
  assert.match(launch, /“In other agents” in \x60<agentic-code-review>\/SKILL\.md\x60/);
  const other = section(read("agentic-code-review", "SKILL.md"), "## In other agents");
  assert.match(other, /job launched without subagents[^]*own job[^]*combining what the level separates[^]*“review not independent”/);
  assert.match(read("agentic-feature", "assets", "agent-brief.template.md").replace(/\s+/g, " "), /Without subagents do not ask for lanes\/panels\/verifiers: agentic-implement choosing-the-agent\.md §4/);
  assert.deepEqual(markersOutside(/\*\*Job without subagents\*\*/, source), []);
});
test("agentic-project: board README owns CLI source and selection; feature points there", () => {
  const source = "agentic-project/assets/board/README.md";
  const readme = read("agentic-project", "assets", "board", "README.md").replace(/\s+/g, " ");
  assert.match(readme, /\*\*Source and copies\.\*\* CLI code has one source: this skill's \x60scrum\.mjs\x60/);
  assert.match(readme, /\*\*Which to run\*\*: whatever[^]*\x60AGENTS\.md\x60 or \x60CLAUDE\.md\x60/);
  const board = section(read("agentic-feature", "SKILL.md"), "## Board");
  assert.match(board, /“Source and copies”[^]*<agentic-project>\/assets\/board\/README\.md/);
  assert.doesNotMatch(board, /The CLI is \x60<repo>\/\.agentic\/board\/scrum\.mjs\x60/);
  assert.deepEqual(markersOutside(/\*\*Source and copies\.\*\*|\*\*Which to run\*\*/, source), []);
});
test("agentic-feature: first Board command runs with both scrum.sh and scrum.mjs", () => {
  const board = section(read("agentic-feature", "SKILL.md"), "## Board");
  const match = /(?:session:|run) \x60([^\x60]*<cli>[^\x60]*)\x60/.exec(board);
  assert.ok(match, "Board lacks a command with <cli>");
  for (const name of ["scrum.sh", "scrum.mjs"]) {
    const cli = path.join(SKILLS, "agentic-project", "assets", "board", name);
    const [command, ...args] = match[1].split(" ").map((token) => token === "<cli>" ? cli : token);
    const result = spawnSync(command, args, { encoding: "utf8", cwd: ROOT });
    assert.equal(result.status, 0, name + ": " + result.stderr);
    assert.match(result.stdout, /development board/);
  }
});
test("agentic-design takes precedence; other UI skills supply only uncovered techniques", () => {
  const precedence = section(read("agentic-design", "SKILL.md"), "## 1. Precedence");
  assert.match(precedence, /\*\*Other UI skills\.\*\*[^]*do not replace this/);
  assert.match(precedence, /only for a technique this skill does not cover/);
  assert.match(readFrontmatter(read("agentic-design", "SKILL.md")).fields.description, /Takes precedence over other installed UI skills/);
  assert.deepEqual(markersOutside(/\*\*Other UI skills\.\*\*/, "agentic-design/SKILL.md"), []);
});
test("agentic-design reads anti-slop by mode; reviewer reads brief and references, not review SKILL.md", () => {
  const source = "agentic-design/SKILL.md";
  const antiSlop = section(read("agentic-design", "SKILL.md"), "## 5. Anti-slop");
  assert.match(antiSlop, /Read \x60references\/ui-without-slop\.md\x60 by mode, not in full/);
  assert.match(antiSlop, /\*\*variants\*\*[^;]*§1, §2, §3 and §5/);
  assert.match(antiSlop, /\*\*review\*\*[^;]*detector and §5/);
  assert.doesNotMatch(read("agentic-design", "SKILL.md"), /ui-without-slop\.md\x60 in full/);
  assert.match(read("agentic-implement", "SKILL.md").replace(/\s+/g, " "), /“build” mode sections \(\x60<agentic-design>\/SKILL\.md\x60 §5\)/);
  assert.match(section(read("agentic-code-review", "references", "panel-and-rounds.md"), "## §4 "), /\x60SKILL\.md\x60 is the orchestrator process/);
  assert.match(read("agentic-code-review", "assets", "reviewer-brief.template.md").replace(/\s+/g, " "), /review \x60SKILL\.md\x60 is for orchestrator \(\x60panel-and-rounds\.md\x60 §4\)/);
  assert.deepEqual(markersOutside(/by mode, not in full on every call/, source), []);
  assert.deepEqual(markersOutside(/\x60SKILL\.md\x60 is the orchestrator process/, "agentic-code-review/references/panel-and-rounds.md"), []);
});
test("agentic-implement owns the refactor recipe; deepening removes old tests only after equivalent behavior is proved", () => {
  const source = "agentic-implement/references/tests.md";
  const tests = read("agentic-implement", "references", "tests.md");
  const recipe = section(tests, "## Refactor: pin, change, prove equal");
  assert.match(recipe, /\*\*Pin\.\*\*[^]*characterization[^]*differential/);
  assert.match(recipe, /can fail/);
  assert.match(recipe, /\*\*Prove equal\.\*\*[^]*base and HEAD/);
  assert.match(recipe, /\x60blocked: <the difference>\x60/);
  assert.doesNotMatch(tests, /^- Refactor stays outside the cycle: it belongs to review\.$/m);
  assert.match(section(read("agentic-implement", "SKILL.md"), "## 3. "), /“Refactor” in \x60references\/tests\.md\x60/);
  assert.match(read("agentic-architecture", "references", "deepening.md").replace(/\s+/g, " "), /only after behavior is pinned down and proven unchanged[^]*<agentic-implement>\/references\/tests\.md\x60, “Refactor”/);
  assert.match(read("agentic-feature", "assets", "agent-brief.template.md").replace(/\s+/g, " "), /Refactor Red test on base column: behavior-pinning command/);
  assert.deepEqual(markersOutside(/\*\*Prove equal\.\*\*|pin, change, prove equal/i, source), []);
});
test("agentic-implement: second failure at the same gate stops a third identical attempt and challenges the premise", () => {
  const step5 = section(read("agentic-implement", "SKILL.md"), "## 5. ");
  assert.match(step5, /\*\*Two failures at the same gate\.\*\*/);
  assert.match(step5, /do not try a third with the same idea/);
  assert.match(step5, /\x60blocked: premise <the sentence> — <what you saw>\x60/);
  assert.match(section(read("agentic-implement", "references", "choosing-the-agent.md"), "## 1. "), /\*\*Already failed\?\*\*[^]*premise the agent returned/);
  assert.deepEqual(markersOutside(/Two failures at the same gate|do not try a third with/, "agentic-implement/SKILL.md"), []);
});
test("agentic-implement: spec-conflict requires evidence for code, spec and test hypotheses; fix points there", () => {
  const step5 = section(read("agentic-implement", "SKILL.md"), "## 5. ");
  assert.match(step5, /\*\*Code, spec or test\.\*\*/);
  assert.match(step5, /Before returning \x60spec-conflict\x60, write all three hypotheses, each with evidence/);
  assert.match(step5, /Do not change the spec or project tests[^]*to make green/);
  assert.match(section(read("agentic-implement", "SKILL.md"), "## 8. "), /“Code, spec or test”, step 5/);
  assert.match(read("agentic-fix", "references", "diagnosis.md").replace(/\s+/g, " "), /“Code, spec or test”[^]*step 5 of \x60<agentic-implement>\/SKILL\.md\x60/);
  assert.deepEqual(markersOutside(/write all three hypotheses/, "agentic-implement/SKILL.md"), []);
});
test("agentic-code-review: correctness searches added diff lines for silenced checks; brief points to panel §3", () => {
  const source = "agentic-code-review/references/panel-and-rounds.md";
  const lenses = section(read("agentic-code-review", "references", "panel-and-rounds.md"), "## §3 ");
  assert.match(lenses, /\*\*Silence the verifier\*\* \(correctness lens\)/);
  assert.match(lenses, /Missing reasons[^.]*Important in production code/);
  const correctness = read("agentic-code-review", "assets", "reviewer-brief.template.md").match(/^- \*\*Correctness\*\*[^]*?(?=^- \*\*)/m)[0].replace(/\s+/g, " ");
  assert.match(correctness, /“Silence the verifier”[^]*<agentic-code-review>\/references\/panel-and-rounds\.md\x60 §3/);
  assert.deepEqual(markersOutside(/@ts-ignore|Silence the verifier\*\*/, source), []);
  const pattern = /grep -nE '([^']+)'/.exec(lenses)?.[1];
  assert.ok(pattern);
  const result = spawnSync("grep", ["-nE", pattern], { encoding: "utf8", input: ["+const a = b as any;", "+const c = d as anyThing;", "+// @ts-ignore", "-// @ts-expect-error removed", "+x = 1  # type: ignore", "+// eslint-disable-next-line no-x -- reason", "+ok = 1"].join("\n") });
  assert.equal(result.error, undefined, "grep missing");
  assert.deepEqual(result.stdout.trim().split("\n").map((line) => line.split(":")[0]), ["1", "3", "5", "6"]);
});
test("agentic-feature: mechanical batch uses a script and approved playbook; maintenance owns class review", () => {
  const launch = section(read("agentic-feature", "references", "implementation.md"), "## 4. Launch");
  assert.match(launch, /\*\*Mechanical batch\*\*[^]*one script, not N lanes/);
  assert.match(launch, /human approves playbook before batch/);
  assert.match(launch, /reproduces manual unit byte-for-byte/);
  assert.match(launch, /sensitive zones[^]*playbook does not replace diff review/);
  const byClass = section(read("agentic-code-review", "references", "maintenance.md"), "## Mechanical batch: review by class");
  assert.match(byClass, /reviewed by class rather than file by file/);
  assert.match(byClass, /correctness, minimality, file's style, maintainability/);
  assert.match(byClass, /One wrong instance fails the whole class/);
  assert.match(read("agentic-code-review", "SKILL.md").replace(/\s+/g, " "), /by class \(\x60references\/maintenance\.md\x60, “Mechanical batch”\)/);
  assert.match(read("agentic-feature", "assets", "batch.template.md"), /^## Playbook \(mechanical batch only\)/m);
  assert.deepEqual(markersOutside(/one script, not N lanes|reproduces manual unit byte-for-byte/, "agentic-feature/references/implementation.md"), []);
  assert.deepEqual(markersOutside(/reviewed by class rather than file by file/, "agentic-code-review/references/maintenance.md"), []);
});
test("agentic-feature: human-stops table includes playbook approval in step 5 and points to implementation.md", () => {
  const circuit = read("agentic-feature", "SKILL.md").split("## The circuit and human stops")[1].split("\n## ")[0];
  const step5 = /^\| 5 \|.*$/m.exec(circuit)?.[0] ?? "";
  assert.match(step5, /mechanical batch only: \*\*stop at playbook\*\*/);
  assert.match(step5, /\x60references\/implementation\.md\x60 §4/);
  assert.deepEqual(markersOutside(/human approves playbook/, "agentic-feature/references/implementation.md"), []);
});
