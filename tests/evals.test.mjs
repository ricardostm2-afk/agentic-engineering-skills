// Eval suite (evals/): the fixture repositories really hold the defects the cases claim, and every
// case is well formed for `claude plugin eval`. No model is called here; the live run is evals/README.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const EVALS = path.join(import.meta.dirname, "..", "evals");
const VERIFY_FIX = path.join(EVALS, "verify-fix.mjs");
const FIXTURES = path.join(EVALS, "fixtures", "orders-api");
const OVERLAYS = ["bug-sort", "bug-isolation", "change-leak", "change-doc-lie", "change-clean"];
const WORKFLOW_CASES = ["architecture-assess-only", "design-targeted-spacing", "explain-code-plain", "feature-parallel-ownership", "feature-sensitive-plan", "feature-short-label", "project-minimal-bootstrap", "review-risk-escalation"];
const CASES = readdirSync(EVALS, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !["fixtures", "results"].includes(entry.name))
  .map((entry) => entry.name);
const GRADER_TYPES = ["regex", "tool_used", "tool_order", "file_exists", "llm", "baseline"];
const temporary = [];
process.on("exit", () => temporary.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function compose(...overlays) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "eval-fixture-"));
  temporary.push(dir);
  for (const name of ["base", ...overlays]) cpSync(path.join(FIXTURES, name), dir, { recursive: true });
  return dir;
}
function runSpecs(dir) {
  const specs = readdirSync(path.join(dir, "spec")).filter((f) => f.endsWith(".spec.js")).map((f) => path.join("spec", f));
  return spawnSync(process.execPath, ["--test", ...specs], { cwd: dir, encoding: "utf8" });
}
function probe(dir, source) {
  writeFileSync(path.join(dir, "probe.mjs"), source);
  const result = spawnSync(process.execPath, ["probe.mjs"], { cwd: dir, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
const SORT_PROBE = `
import { createOrder, listOrders, resetStore } from "./src/orders.js";
resetStore();
for (const [customer, createdAt] of [["new", "2026-02-12"], ["old", "2026-02-01"], ["mid", "2026-02-05"]]) createOrder("acme", { customer, createdAt, lines: [] });
console.log(JSON.stringify({ order: listOrders("acme").map((o) => o.customer) }));`;
const ISOLATION_PROBE = `
import { createOrder, getOrder, updateCustomer, orderTotalFor, listOrders, resetStore } from "./src/orders.js";
resetStore();
const order = createOrder("acme", { customer: "Ana", createdAt: "2026-02-01", lines: [{ unitCents: 100, qty: 1 }] });
const leaks = (fn) => { try { fn(); return true; } catch { return false; } };
console.log(JSON.stringify({
  get: leaks(() => getOrder("globex", order.id)),
  update: leaks(() => updateCustomer("globex", order.id, "x")),
  total: leaks(() => orderTotalFor("globex", order.id)),
  list: listOrders("globex").length > 0,
}));`;

test("base: tests are green, sorted oldest first, no organization leak", () => {
  const dir = compose();
  assert.equal(runSpecs(dir).status, 0);
  assert.deepEqual(probe(dir, SORT_PROBE).order, ["old", "mid", "new"]);
  assert.deepEqual(probe(dir, ISOLATION_PROBE), { get: false, update: false, total: false, list: false });
});

test("every overlay keeps its own tests green: the defect is not caught by them", () => {
  for (const overlay of OVERLAYS) assert.equal(runSpecs(compose(overlay)).status, 0, overlay);
});

test("bug-sort: the list is not oldest first", () => {
  assert.notDeepEqual(probe(compose("bug-sort"), SORT_PROBE).order, ["old", "mid", "new"]);
});

test("bug-isolation: getOrder and updateCustomer leak, the other reads do not", () => {
  assert.deepEqual(probe(compose("bug-isolation"), ISOLATION_PROBE), { get: true, update: true, total: false, list: false });
});

function verifyFix(name, dir) {
  const result = spawnSync(process.execPath, [VERIFY_FIX, name, dir], { encoding: "utf8" });
  assert.equal(result.error, undefined);
  assert.ok([0, 1].includes(result.status), result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.passed, result.status === 0);
  return report;
}

test("independent fix oracles reject planted defects and accept the repaired base", () => {
  for (const [name, overlay] of [["fix-sort-order", "bug-sort"], ["fix-isolation-class", "bug-isolation"]]) {
    assert.equal(verifyFix(name, compose(overlay)).passed, false, name + ": buggy fixture");
    const fixed = verifyFix(name, compose());
    assert.equal(fixed.passed, true, JSON.stringify(fixed.checks));
  }
});

test("sort oracle rejects constant, descending and boolean comparators plus missing exports", () => {
  for (const source of [
    "export const byOldest = () => 0;\n",
    "export const byOldest = (a, b) => b.createdAt - a.createdAt;\n",
    "export const byOldest = (a, b) => a.createdAt > b.createdAt;\n",
    "export const renamed = (a, b) => a.createdAt - b.createdAt;\n",
  ]) {
    const dir = compose();
    writeFileSync(path.join(dir, "src/sort.js"), source);
    assert.equal(verifyFix("fix-sort-order", dir).passed, false, source);
  }
});

test("sort oracle checks public list behavior in addition to comparator source", () => {
  const dir = compose();
  const source = readFileSync(path.join(dir, "src/orders.js"), "utf8");
  writeFileSync(path.join(dir, "src/orders.js"), source.replace("orders.filter((o) => o.orgId === orgId)", "orders"));
  assert.equal(verifyFix("fix-sort-order", dir).passed, false, "an organization leak must not pass as a sort fix");
});

test("isolation oracle rejects a partial repair and whitespace changes that evade source regexes", () => {
  const partial = compose("bug-isolation");
  const file = path.join(partial, "src/orders.js");
  const source = readFileSync(file, "utf8");
  writeFileSync(file, source.replace("o.id === id)", "o.id === id && o.orgId === orgId)"));
  const report = verifyFix("fix-isolation-class", partial);
  assert.equal(report.passed, false);
  assert.ok(report.checks.some((check) => check.name.startsWith("updateCustomer denies") && !check.passed));
  writeFileSync(file, source.replaceAll("o.id === id", "o.id===id"));
  assert.equal(verifyFix("fix-isolation-class", partial).passed, false);
});

test("isolation oracle rejects throw-everywhere repairs and mutations before rejection", () => {
  const dir = compose();
  const file = path.join(dir, "src/orders.js");
  const source = readFileSync(file, "utf8");
  writeFileSync(file, source.replace("return findOwned(orgId, id);", 'throw new NotFoundError("denied");'));
  assert.equal(verifyFix("fix-isolation-class", dir).passed, false, "same-organization access must work");
  writeFileSync(file, source.replace("const order = findOwned(orgId, id);\n  order.customer", "const foreign = orders.find((o) => o.id === id);\n  if (foreign) foreign.customer = customer;\n  const order = findOwned(orgId, id);\n  order.customer"));
  assert.equal(verifyFix("fix-isolation-class", dir).passed, false, "throwing after the write still violates isolation");
});

test("fix oracle validates its command line", () => {
  for (const args of [[], ["unknown", "."], ["fix-sort-order"], ["fix-sort-order", ".", "extra"]]) {
    const run = spawnSync(process.execPath, [VERIFY_FIX, ...args], { encoding: "utf8" });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /Usage:/);
  }
});

test("change-leak: findByReference returns another organization's order", () => {
  const found = probe(compose("change-leak"), `
import { createOrder, findByReference, resetStore } from "./src/orders.js";
resetStore();
createOrder("acme", { customer: "Ana", createdAt: "2026-02-01", lines: [], reference: "INV-1" });
let leaked = false;
try { findByReference("globex", "INV-1"); leaked = true; } catch {}
console.log(JSON.stringify({ leaked }));`);
  assert.equal(found.leaked, true);
});

test("change-doc-lie: README documents orderTotalFor but the code no longer exports it", async () => {
  const dir = compose("change-doc-lie");
  assert.match(readFileSync(path.join(dir, "README.md"), "utf8"), /orderTotalFor\(orgId, id\)/);
  const exported = probe(dir, `
import * as orders from "./src/orders.js";
console.log(JSON.stringify({ old: typeof orders.orderTotalFor, renamed: typeof orders.totalForOrder }));`);
  assert.deepEqual(exported, { old: "undefined", renamed: "function" });
});

test("change-clean: scoped to the organization, oldest first, documented", () => {
  const dir = compose("change-clean");
  const result = probe(dir, `
import { createOrder, listOrders, resetStore } from "./src/orders.js";
resetStore();
createOrder("acme", { customer: "Late", createdAt: "2026-02-03", lines: [] });
createOrder("acme", { customer: "Early", createdAt: "2026-02-01", lines: [] });
createOrder("globex", { customer: "Other", createdAt: "2026-02-02", lines: [] });
console.log(JSON.stringify({ open: listOrders("acme", { status: "open" }).map((o) => o.customer) }));`);
  assert.deepEqual(result.open, ["Early", "Late"]);
  assert.match(readFileSync(path.join(dir, "README.md"), "utf8"), /status/);
});

// Minimal front matter reader: `key: value` lines between the first two `---` lines.
function frontMatter(text) {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  assert.ok(match, "front matter block");
  const fields = {};
  for (const line of match[1].split("\n")) {
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (kv) fields[kv[1]] = kv[2].replace(/^'(.*)'$/, "$1").replace(/''/g, "'");
  }
  return { fields, body: text.slice(match[0].length) };
}

test("there are cases, and each is a folder with prompt, case.yaml, scaffold and graders", () => {
  assert.ok(CASES.length >= 13, CASES.join(","));
  for (const name of WORKFLOW_CASES) assert.ok(CASES.includes(name), name + ": missing workflow case");
  for (const name of CASES) {
    const dir = path.join(EVALS, name);
    const prompt = frontMatter(readFileSync(path.join(dir, "prompt.md"), "utf8"));
    assert.match(prompt.fields.max_turns, /^\d+$/, name);
    assert.match(prompt.body.trim(), /\S/, name + ": empty prompt");
    assert.doesNotMatch(prompt.body, /agentic-|SKILL|skill/i, name + ": the prompt must not name a skill");
    const yaml = readFileSync(path.join(dir, "case.yaml"), "utf8");
    assert.match(yaml, /^schema_version: "1\.1"$/m, name);
    assert.match(yaml, new RegExp("^name: " + name + "$", "m"), name + ": name equals the folder");
    const script = /scaffold_script: (\S+)/.exec(yaml)?.[1];
    assert.ok(script && existsSync(path.join(dir, script)), name + ": scaffold script");
    const scaffold = readFileSync(path.join(dir, script), "utf8");
    if (WORKFLOW_CASES.includes(name)) {
      assert.match(scaffold, /\/fixtures\/make-workflow-repo\.sh/, name + ": shared workflow fixture");
    } else {
      const overlay = / (?:fix|branch) (\S+) /.exec(scaffold)?.[1];
      assert.ok(OVERLAYS.includes(overlay), name + ": overlay " + overlay);
    }
    const graders = readdirSync(path.join(dir, "graders")).filter((f) => f.endsWith(".md"));
    assert.ok(graders.length >= 2, name + ": graders");
  }
});

test("every grader has a known type and a pattern that compiles", () => {
  for (const name of CASES) {
    for (const file of readdirSync(path.join(EVALS, name, "graders"))) {
      const { fields } = frontMatter(readFileSync(path.join(EVALS, name, "graders", file), "utf8"));
      assert.ok(GRADER_TYPES.includes(fields.type), `${name}/${file}: type ${fields.type}`);
      for (const key of ["pattern", "input_match"]) if (fields[key]) assert.doesNotThrow(() => new RegExp(fields[key], fields.flags), `${name}/${file}: ${key}`);
      if (fields.pattern) assert.doesNotMatch(fields.pattern, /\(\?i\)/, `${name}/${file}: inline flags are not supported; use flags: i`);
    }
  }
});

// These are rubric contract checks, not evidence that a model judge passed good/bad traces.
test("red-before-fix graders judge observed bug failures and subsequent passes across write tools", () => {
  for (const name of ["fix-sort-order", "fix-isolation-class"]) {
    const { fields, body } = frontMatter(readFileSync(path.join(EVALS, name, "graders", "03-red-before-fix.md"), "utf8"));
    assert.equal(fields.type, "llm");
    assert.equal(fields.focus, "trace");
    assert.match(body, /Edit, Write, Bash/);
    assert.match(body, /SAME regression test/);
    assert.match(body, /green baseline run alone/);
    assert.match(body, /syntax, missing dependency, or setup/);
    assert.match(body, /insufficient visible red\/green evidence/);
    assert.match(body, name === "fix-sort-order" ? /oldest first/ : /NotFoundError/);
  }
});

test("the case set covers fix and review and keeps one cost grader per case", () => {
  const tags = CASES.map((name) => frontMatter(readFileSync(path.join(EVALS, name, "prompt.md"), "utf8")).fields.tags);
  assert.ok(tags.some((t) => t.includes("fix")) && tags.some((t) => t.includes("review")));
  for (const name of CASES) {
    const costs = readdirSync(path.join(EVALS, name, "graders")).filter((f) => {
      const { fields } = frontMatter(readFileSync(path.join(EVALS, name, "graders", f), "utf8"));
      return fields.type === "tool_used" && fields.tool === "Agent";
    });
    assert.equal(costs.length, 1, name + ": exactly one grader on subagent count");
  }
});

test("scaffold scripts build the repository (POSIX only)", { skip: process.platform === "win32" }, () => {
  for (const [name, mode, branch] of [["fix-sort-order", "fix"], ["review-leak", "branch", "change-leak"], ...WORKFLOW_CASES.map((name) => [name, "fix"])]) {
    const work = mkdtempSync(path.join(os.tmpdir(), "eval-scaffold-"));
    temporary.push(work);
    const run = spawnSync("bash", [path.join(EVALS, name, "place-fixture.sh")], { cwd: work, encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    const log = spawnSync("git", ["log", "--oneline", "--all"], { cwd: work, encoding: "utf8" }).stdout.trim().split("\n");
    assert.equal(log.length, mode === "fix" ? 1 : 2, name);
    if (branch) assert.equal(spawnSync("git", ["branch", "--show-current"], { cwd: work, encoding: "utf8" }).stdout.trim(), branch);
    assert.equal(spawnSync("git", ["status", "--short"], { cwd: work, encoding: "utf8" }).stdout, "", name + ": clean tree");
    assert.equal(runSpecs(work).status, 0, name + ": fixture tests must start green");
  }
});

test("workflow fixture separates ordinary changes from the authorization boundary", () => {
  const dir = path.join(EVALS, "fixtures", "workflow");
  assert.equal(runSpecs(dir).status, 0);
  assert.match(readFileSync(path.join(dir, "AGENTS.md"), "utf8"), /src\/access\.js/);
  assert.match(readFileSync(path.join(dir, "src", "labels.js"), "utf8"), /\?\? ['"]Unknown['"]/);
  assert.doesNotMatch(readFileSync(path.join(dir, "src", "labels.js"), "utf8"), /archived/);
  assert.match(readFileSync(path.join(dir, "tasks.md"), "utf8"), /T1/);
  assert.match(readFileSync(path.join(dir, "tasks.md"), "utf8"), /T2/);
});

test("planning-only graders observe final source contents, not just claims in the last response", () => {
  for (const name of ["architecture-assess-only", "feature-sensitive-plan", "feature-parallel-ownership"]) {
    const dir = path.join(EVALS, name, "graders");
    assert.equal(frontMatter(readFileSync(path.join(dir, "01-outcome-and-route.md"), "utf8")).fields.focus, "trace");
    const guards = readdirSync(dir).filter((file) => file.includes("-unchanged-"));
    assert.equal(guards.length, 5, name + ": production inputs have final-state guards");
    for (const file of guards) {
      const { fields } = frontMatter(readFileSync(path.join(dir, file), "utf8"));
      const relative = /path: ([^\s}]+)/.exec(fields.target)?.[1];
      assert.ok(relative, file);
      const content = readFileSync(path.join(EVALS, "fixtures", "workflow", relative), "utf8");
      const pattern = new RegExp(fields.pattern);
      assert.ok(pattern.test(content), file + ": baseline accepted");
      assert.ok(pattern.test(content.replaceAll("\n", "\r\n")), file + ": line endings normalized");
      assert.equal(pattern.test(content + "\n// production edit\n"), false, file + ": mutation rejected");
      assert.equal(pattern.test(""), false, file + ": deletion rejected");
    }
  }
});
