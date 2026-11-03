# Maintenance mode: audit with evidence

Adapted from https://developers.openai.com/blog/maintaining-software-with-the-gpt-6-family (our
own summary): agent-written code also grows leftovers (dead code, completed experiments, forgotten
flags, flaky tests, slow CI). An agent can take a broad request (“clean dead code”), find where to
look and what evidence justifies each change, and deliver small cleanups for review.

## When

**Only on explicit human request in this conversation** (“audit code for cleanup/maintenance”,
“clean dead code”). Never on initiative, “while here” in review or a feature,
or a scheduled task without that request. Project request-only audit rules (`AGENTS.md`,
`REVIEW.md`, decisions) override any trigger here.

Suite or CI audits, including flaky and slow tests, enter through `agentic-ci-audit`.
The criteria below for those cases guide review of the resulting diff; they do not activate maintenance.

## Rules (preventing false positives)

- Preserve production behavior, operational safeguards and killswitches.
- Ignore SDK fallbacks and local overrides: evidence of neither live nor dead paths.
- **Do not change live configuration or services**: flags, consoles, databases, queues. Read
  what authorized; production-only details go as questions to human.
- **One cleanup per commit** (or draft PR if project uses PRs), reasoning and proof in message.
  No ten-cleanup commit.
- **Ambiguous cases go to the human**, never silently decided: a “Permanent” flag costing CPU
  but possibly operational; incident code; reflection or runtime-built names you cannot follow.
- Each cleanup is a normal change: review with this skill at the diff's level.

## Evidence per candidate (preventing false negatives)

Gather multiple sources; one (empty `grep`) is insufficient:
1. **history**: `git log -S '<name>'`, `git log --follow <file>`, `git blame`, prior/overlapping
   commits and PRs introducing or trying to remove it;
2. **live configuration** (read-only): flag value in every environment, who changed it and when;
3. **telemetry and profiles**: did path run in last N days? A CPU profile showing lines never
   run beats guessing;
4. **indirect callers**: enums, constants, wrappers, aliases, schemas, runtime-built names,
   consumers in other services/repos, operations scripts.

Audit all scope, not just tagged items; do not stop at a short conservative list.

## Trust in phases

1. **One case**: one candidate end to end, human reads evidence.
2. **One subdirectory**: same prompt, broader, incorporating phase 1 feedback.
3. **Repo**: only after earlier phases show model accuracy. Manually validate largest findings
   before full cleanup.

Each human review's feedback returns to the next phase's prompt.

## Mechanical batch: review by class

Also applies in review mode without a maintenance request. A scripted diff from an approved
playbook (`<agentic-feature>/references/implementation.md` §4, “Mechanical batch”) is reviewed by
class rather than file by file. Reviewer reads playbook and script, confirms script reproduces
manual units, and for each class (one commit):
- checks `git show --stat` touches only playbook-authorized files;
- reads a sample: first instance, largest, one of every playbook-separated shape, plus manual leftovers;
- judges class on four criteria: correctness, minimality, file's style, maintainability.

One wrong instance fails the whole class: fix script (or playbook, with renewed approval) and rerun,
rather than manual patches. Sensitive-zone files do not use this method: review their diff at their
level. Normal review agent ceiling and rounds apply.

## Priority

- Report organized into **fronts** (by owner or file) runnable in parallel.
- Each candidate: what it is, production values, sourced evidence, owner, callers, **measured
  benefit** (CPU, CI minutes/day, image size, lines), age.
- Order by measured benefit and age; no severity levels in this mode.
- Mark proposals **adding more complexity than they remove** (new mechanism to delete ten lines)
  and do not perform without human decision: without measurement and ordering, findings swamp reviewers.

## Flaky tests and slow CI

- Flaky: from recent CI runs, one fix attempt per test; accept only clear, simple working fixes
  (test passes N consecutive times).
- Slow CI: idea table ordered by daily minutes saved, estimated from run history; one change per commit.

## Model and effort

Audit agents use user's review model (`panel-and-rounds.md` §3). Model/effort switches belong to
user: take them the cost per accepted finding (`learning.md`, “Model and effort”).

## Output

Audit agent brief: `assets/maintenance-brief.template.md`. Human delivery: report by fronts and,
for each approved cleanup, its small commit with evidence. Nothing integrates without this skill's
review and human reading the evidence.
