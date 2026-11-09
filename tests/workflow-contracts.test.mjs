// Cross-role workflow contracts. These docs are executable agent instructions: assert the
// ownership, routing and invalidation boundaries that can otherwise drift between handoffs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (skill, file = "SKILL.md") => readFileSync(path.join(ROOT, "skills", skill, file), "utf8");
const section = (text, start, end) => {
  const from = text.indexOf(start);
  const to = end ? text.indexOf(end, from + start.length) : text.length;
  assert.ok(from >= 0 && to > from, `missing or unordered section: ${start}`);
  return text.slice(from, to);
};

test("feature chooses its existing short route before heavyweight planning and retains escalation", () => {
  const feature = read("agentic-feature");
  const triage = section(feature, "## Step 0:", "## Step 1:");
  assert.match(triage, /before Reading, external research, grill or Spec Kit/);
  assert.match(triage, /Short route \(Standard\)/, "short execution must not introduce a new feature track");
  assert.match(triage, /agentic-implement>\/references\/choosing-the-agent\.md/);
  assert.match(triage, /no separate Reading, grill, spec, lane brief or minimum suggestion count/);
  assert.match(triage, /planning-only[\s\S]*stop before changing code/);
  assert.match(triage, /material behavior is ambiguous[\s\S]*risk rises[\s\S]*re-triage/);
  assert.match(triage, /inspect the actual diff[\s\S]*risk-levels\.md/);
  assert.match(read("agentic-code-review", "references/risk-levels.md"), /Standard short route has no Standard review floor/);
  assert.match(read("agentic-implement", "references/choosing-the-agent.md"), /1 code file and its test[\s\S]*~50 changed lines[\s\S]*outside hooks, CI and installers/);
});

test("research and suggestions follow evidence gaps rather than per-feature quotas", () => {
  for (const file of ["SKILL.md", "references/reading-context.md", "assets/reading.template.md"]) {
    const text = read("agentic-feature", file);
    assert.match(text, /0–3 evidence-based/);
    assert.doesNotMatch(text, /Fewer than 3 suggestions|3–6 reasoned suggestions/);
  }
  const research = read("agentic-feature", "references/current-research.md");
  assert.match(research, /time-sensitive,[\s\S]*material unknown[\s\S]*explicitly asks/);
  assert.match(research, /local evidence sufficient/);
  assert.match(research, /Ceilings are maxima, never quotas/);
  assert.match(research, /evidence\.md/);
  assert.doesNotMatch(research, /Always, every track|one search: is pattern current/);
  const complete = read("agentic-feature", "references/complete-research.md");
  assert.match(complete, /Known,[\s\S]*sufficiently evidenced axes get no researcher/);
  assert.doesNotMatch(complete, /Untouched[\s\S]{0,50}research them yourself/);
});

test("shared tasks have one writer, with IDs, SHA and evidence returned by lanes", () => {
  const spec = read("agentic-feature", "references/spec-kit.md");
  const lanes = read("agentic-feature", "references/implementation.md");
  const brief = read("agentic-feature", "assets/agent-brief.template.md");
  assert.match(spec, /orchestrator alone marks \[X\] in shared `tasks\.md`/);
  assert.match(lanes, /orchestrator is the sole owner of shared `tasks\.md`/);
  assert.match(lanes, /task IDs, full commit SHA and proof/);
  assert.match(lanes, /after validating the handoff and combined state/);
  assert.match(brief, /Shared `tasks\.md` is read-only for lanes/);
  assert.match(brief, /Return IDs, full commit SHA and evidence/);
  assert.match(read("agentic-implement"), /Shared `tasks\.md` belongs to the orchestrator/);
  assert.doesNotMatch(spec + lanes + brief, /Agents mark \[X\]|Lanes mark \[X\]/);
});

test("post-review exceptions cannot precede diff classification or waive a new lens", () => {
  const rounds = section(read("agentic-code-review", "references/panel-and-rounds.md"), "## §9 Rounds", "## §10");
  assert.ok(rounds.indexOf("Classify every post-review diff first") < rounds.indexOf("**Commits after reviewed SHA.**"));
  assert.match(rounds, /metadata, an Important fix with proof,[\s\S]*acceptance-test file,[\s\S]*rebase\/conflict/);
  assert.match(rounds, /only newly required lenses/);
  assert.match(rounds, /exception cannot waive this review/);
  assert.match(rounds, /existing round\/agent limits/);
  assert.match(rounds, /Same-risk, narrow, proven fixes remain[\s\S]*eligible/);
  assert.match(read("agentic-code-review", "references/risk-levels.md"), /every post-review diff before any[\s\S]*exception/);
});

test("security operational coverage has a canonical source shared by panel and reviewer brief", () => {
  const security = read("agentic-code-review", "references/security-lens.md");
  for (const item of ["Permissions and isolation", "Untrusted input", "Secrets and private data", "Dependencies and supply chain", "known vulnerabilities", "install-time code", "Hooks, CI and installers"]) {
    assert.ok(security.includes(item), `missing security obligation: ${item}`);
  }
  const panel = read("agentic-code-review", "references/panel-and-rounds.md");
  const lens = panel.split("\n").find(line => line.startsWith("| Security |"));
  assert.match(lens, /references\/security-lens\.md/);
  assert.doesNotMatch(lens, /server-enforced permissions|input validation/, "the panel must not maintain a second checklist");
  const brief = section(read("agentic-code-review", "assets/reviewer-brief.template.md"), "- **Security**", "- **UI**");
  assert.match(brief, /references\/security-lens\.md/);
  assert.match(brief, /dependencies, known vulnerabilities and install-time code/);
});

test("the same independent reviewer can write acceptance scratch without mutating reviewed production", () => {
  for (const file of ["references/panel-and-rounds.md", "assets/reviewer-brief.template.md"]) {
    const text = read("agentic-code-review", file);
    assert.match(text, /same reviewer/);
    assert.match(text, /<acceptance-tmp>/);
    assert.match(text, /[Pp]roduction (?:stays|remains|is)[\s\S]{0,30}read-only/);
    assert.match(text, /unchanged/);
    assert.doesNotMatch(text, /run in `<review-wt>`, copy to[\s\S]*remove from worktree/);
  }
  const agent = read("agentic-implement", "assets/agents/reviewer.md");
  assert.match(agent, /^tools: .*Write$/m);
  assert.match(agent, /only in the brief's authorized `<acceptance-tmp>`/);
  assert.match(agent, /do not edit source, commit, install dependencies/);
});

test("design preserves all public modes while routing roles to small operational capsules", () => {
  const router = read("agentic-design");
  assert.ok(router.split("\n").length <= 100, "router must not accumulate all mode procedures again");
  const modes = new Map([
    ["questions", "ui-questions.md"], ["variants", "variants-mode.md"],
    ["build", "build-mode.md"], ["review", "review-mode.md"],
    ["targeted adjustment", "targeted-adjustment.md"],
  ]);
  for (const [mode, file] of modes) {
    const row = router.split("\n").find(line => line.startsWith(`| **${mode}** |`));
    assert.ok(row?.includes(`references/${file}`), `mode lacks its own entry: ${mode}`);
    assert.ok(existsSync(path.join(ROOT, "skills/agentic-design/references", file)), file);
  }
  const featureMode = section(read("agentic-feature"), "## Step 3:", "## Step 4:");
  assert.match(featureMode, /targeted-adjustment\.md/);
  assert.match(featureMode, /Neither opens a variants checkpoint/);
  assert.match(read("agentic-design", "references/targeted-adjustment.md"), /small change does not trigger the full new-screen matrix/);
  assert.match(read("agentic-implement", "assets/agents/implementer-ui.md"), /^skills: \[agentic-implement\]$/m);
  assert.match(read("agentic-feature", "assets/agent-brief.template.md"), /Do not load the[\s\S]*whole `agentic-design` SKILL/);
});

test("fix writers load their delegated steps without copied orchestration Cards", () => {
  const fix = read("agentic-fix");
  const writer = read("agentic-fix", "references/writer-steps.md");
  const brief = read("agentic-fix", "assets/fix-brief.template.md");
  assert.match(fix, /references\/writer-steps\.md/);
  assert.match(brief, /Do not preload `agentic-fix`/);
  for (const step of ["## Step 3:", "## Step 4:", "## Step 5:"]) assert.ok(writer.includes(step), step);
  for (const safeguard of ["root cause", "class", "Safeguards", "original scenario", "spec-conflict"]) assert.ok(writer.includes(safeguard), safeguard);
  assert.doesNotMatch(writer, /## Step [12678]:/);
  for (const skill of ["agentic-feature", "agentic-fix"]) assert.doesNotMatch(read(skill), /<!-- card:start|## Card/);
});

test("evidence reuse is keyed to exact state and preserves integration invalidation", () => {
  const evidence = read("agentic-implement", "references/evidence.md");
  assert.match(evidence, /exact code\/tree \+ command \+ relevant dependencies, configuration,[\s\S]*environment and external state/);
  assert.match(evidence, /test counts\/skips/);
  assert.match(evidence, /external result expires/);
  assert.match(evidence, /Integration and rebase are validation boundaries/);
  assert.match(evidence, /new combined tree, rebase, conflict resolution or changed base needs integration verification/);
  assert.match(evidence, /another role received it adds no[\s\S]*evidence/);
  assert.match(read("agentic-feature", "references/implementation.md"), /inspect saved output|Inspect saved output/);
  assert.doesNotMatch(read("agentic-feature", "references/implementation.md"), /Confirm outputs yourself in worktree \(run verification/);
  const lifecycle = section(read("agentic-implement", "references/tests.md"), "## Timeouts and child processes", "## Refactor:");
  assert.match(lifecycle, /When the change adds or alters process lifecycle[\s\S]*twice consecutively/);
  assert.match(lifecycle, /Unrelated changes reuse valid/);
  assert.doesNotMatch(lifecycle, /After green, run the suite twice/);
});
