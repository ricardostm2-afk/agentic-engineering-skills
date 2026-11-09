---
name: agentic-fix
description: >-
  Diagnoses and fixes broken existing behaviour: errors, failing tests, regressions and reported
  bugs. Reproduces the defect and verifies the fix. Use agentic-feature for behaviour that does not
  exist yet; use agentic-ci-audit to audit the test or CI system itself.
---

# agentic-fix

Fix existing wrong behavior, with proof. The behavior already exists: the defect is the distance
between what it does and what it should do. New functionality belongs to `agentic-feature`.

## Execution contract

Read only the reference for the current role and step. Agent level/model/launch rules live in
`<agentic-implement>/references/choosing-the-agent.md`; review classification and bounded rounds
live in `<agentic-code-review>/references/risk-levels.md` and `<agentic-code-review>/references/panel-and-rounds.md`.
Do not copy those rules into briefs or reload the orchestrator workflow in a delegated writer.


Host differences, installations, tool substitutes and sibling resolution follow
`<agentic-project>/references/host-compatibility.md`; find that sibling through
`$AGENTIC_PROJECT_DIR` first and read the reference when the host varies.

The siblings `<agentic-code-review>` (`$AGENTIC_CODE_REVIEW_DIR`), `<agentic-design>` (`$AGENTIC_DESIGN_DIR`)
and `<agentic-implement>` (`$AGENTIC_IMPLEMENT_DIR`) follow the same reference; paths, prefixes and
order are not repeated here.

Repo rules override this skill: read `AGENTS.md`/`CLAUDE.md` (tests, Git, areas, sensitive zones, integration).

`<skill>` is this `SKILL.md`'s folder. Resolve siblings through the single reference
`<agentic-project>/references/host-compatibility.md`; an explicit variable wins over the adjacent
folder, project folders, global roots and plugin. Without a Skill tool, read the found `SKILL.md`.

## Who does what

- **Orchestrator** (the session receiving the report): steps 1, 2, 6, 7 and 8.
- **Fix agent** (Claude subagent or Codex job, launched in step 2): steps 3 to 5, with
  `agentic-implement` and `references/writer-steps.md` only. If you are that agent, the brief says
  so; read that reference and skip the rest of this orchestrator skill.
- For a short fix (`<agentic-implement>/references/choosing-the-agent.md` §1), or without an agent
  tool, you are the agent: perform all steps in order without a brief.

## Step 1: the report

Read the report and its referenced screen or step. Address only what the human pointed out:
anything found nearby goes in a line of the final message. For an interface report, scope is the
specified screen: other screens with the same pattern go in that line; expanding scope is the
human's decision, without a question from you.

**Ambiguous** report (cannot reproduce without guessing what is wrong or should happen): ask
**one** question with your recommendation and wait. Clear report: proceed.

Done when you can state the **symptom** (what happens) and **expected behavior** (what should happen)
in one sentence.

## Step 2: the brief and agent

Choose level first, using §1 of `<agentic-implement>/references/choosing-the-agent.md`. A **short**
task has no brief or agent: state the level in one line and perform steps 3 to 5 yourself with
`agentic-implement`. Otherwise:

1. Fill `assets/fix-brief.template.md`: symptom, expected behavior, where visible, area, likely
   files, sensitive zone (yes or no), human order (or “none”) and success criterion.
2. Choose model and agent (Claude or Codex) using the same file and write the level in the brief.
3. Launch the agent in its own worktree with the brief, `agentic-implement` and the exact absolute
   path to `references/writer-steps.md`, using the chosen model and effort. Claude: subagent.
   Codex: job with `$agentic-implement` and the reference pointer; do not preload `$agentic-fix`.

Done when the agent is launched with a brief an agent without this conversation could follow without
questions; for a short task, when you stated the level and started step 3.

## Steps 3–5: reproduce, diagnose and fix (writer)

The complete writer procedure is `references/writer-steps.md`: reproduce the real symptom,
identify root cause and class, make the smallest scoped fix, then return red/green proof and
commit. Pass that exact reference to the writer; do not load this orchestrator workflow there.
For a short fix, follow the same reference yourself before returning to step 6.

Done when the writer returns `done` with commit, root cause, class and valid red → green evidence;
or `blocked` / `spec-conflict` with the exact unresolved issue.

## Step 6: review (orchestrator)

- **Sensitive zone** (those in the repo's `REVIEW.md`; without it: authentication, permissions,
  third-party data, money, migrations): `agentic-code-review` panel.
- **Outside it, a short fix** (`<agentic-implement>/references/choosing-the-agent.md` §1): Quick,
  no reviewer. Step 5's red → green and step 3's loop are the proof; read the diff yourself against
  the symptom, expected behavior and class, looking for what the fix breaks.
- **Outside it, a larger fix**: request “Quick (requested)” from `agentic-code-review`: one
  **fresh-context** reviewer who did not write the code, with one lens, correctness, and 1 round
  (`<agentic-code-review>/assets/reviewer-brief.template.md`), reading the diff against the brief.
- If `agentic-code-review` checks the diff and assigns a higher level (always-high path), its level applies.

Reviewers count toward `agentic-code-review`'s ceiling of 5 agents.

Each Important returns to the agent, who reproduces before fixing it; do not fix what cannot be reproduced.

Done when no Important remains open.

## Step 7: integrate (orchestrator)

Integrate following repo rules (branch, merge, verification suite, deploy). The fix reaches integration
with the writer's proof and step 6's review closed. Validate the integration state under
`<agentic-implement>/references/evidence.md`, reusing only proof whose exact inputs still apply.
The integration commit carries `Risk:`, `How to undo:` and `Review:`, as `<agentic-code-review>/references/panel-and-rounds.md` §10 specifies.

Done when the commit is where repo rules require and the human knows where.

## Step 8: if it escaped (orchestrator)

The defect **escaped** when it reached production, was reverted or was reported by the human after
delivery. In that case, step 3's test remains as a permanent regression and the case enters review
evaluation: one lesson line, at the location and in the format of
`<agentic-code-review>/references/learning.md` (“Where it lives”), starting with the repo's `REVIEW.md`.

Done when the lesson line is committed there (or, without a location, in the final message), or
you state in one line why the defect did not escape.

## Final message to the human

Five lines: **Fixed** (symptom and root cause) · **Class** (instance count) · **Proof** (command,
red then green) · **Left out** (what you saw nearby) · **Needs you**.

## In other agents

In Codex, the orchestrator uses `$agentic-fix`; the writer uses `$agentic-implement` plus
`references/writer-steps.md`. Without a subagent tool, perform steps sequentially,
without worktrees; step 6's fresh-context reviewer is a new session; without one, declare review
“not independent”, as in `agentic-code-review` (“In other agents”). Method origin and licenses:
`references/origin.md`.
