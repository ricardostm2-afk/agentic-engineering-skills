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

<!-- card:start — copied from the cited sources; update when they change -->
## Card

Sources: `<agentic-implement>/references/choosing-the-agent.md` (level §1, model §2); `<agentic-code-review>/SKILL.md` (review steps 5 and 6).

Step 1 — Done when you can state the **symptom** (what happens) and **expected behavior** (what should happen) in one sentence.
Step 2 — Done when the agent is launched with a brief an agent without this conversation could follow without questions; for a short task, when you stated the level and started step 3.
Step 3 — Done when there is **one** command, already run with output shown without secrets, that goes red for this defect and only this defect.
Step 4 — Done when you write the root cause in one sentence and the class in one line: `N instances: file:line, …`, or `only this one`, with the search command proving it.
Step 5 — Done when the agent returns `done` with the commit, red then green, and the class addressed; or `blocked` or `spec-conflict` with the reason.
Step 6 — Done when no Important remains open.
Step 7 — Done when the commit is where repo rules require and the human knows where.
Step 8 — Done when the lesson line is committed there (or, without a location, in the final message), or you state in one line why the defect did not escape.

**Level**

1. **Unknown cause?** A defect whose cause is still unknown, or a race to diagnose. Yes: complex.
2. **Design that only shows in the code?** The contract, schema or module can only be decided
   through an experiment in the code. Yes: complex.
3. **Steps not enumerable?** A refactor so coupled that the brief cannot list the steps.
   Yes: complex.
4. **Already failed?** An agent failed this task once at the well-defined level. Yes: complex,
   and the new brief carries the premise the agent returned (step 5 of `agentic-implement`).

Passed all four: **well-defined**. New design, delicate logic (money, concurrency, access rules)
or multiple areas do not make the task complex when the brief has already decided them. Examples:
a label; rounding; a lane with a spec and tasks; fixing an Important the orchestrator reproduced
and wrote a rule for.

- A sensitive zone (tenant, session, billing, personal data) does not raise the level: the brief
  carries invariants and refusal tests, and the zone affects the review level (`agentic-code-review`).

Write the brief's `level:` line with these labels; the launch guard reads it:

- `level: well-defined — decisions closed: <which>`;
- `level: complex — <label>: <detail>`, using one of the four questions as the label, lowercase
  without “?”: `unknown cause`, `design that only shows in the code`, `steps not enumerable`,
  `already failed`;
- the human forced the level: `level: <level> — forced by the human: <their words>`.

**Model** (example model names; the project picks its own)

| Level | Claude | Codex |
|---|---|---|
| well-defined | Sonnet 5.5, effort xhigh | gpt-6.1-sol, effort medium |
| complex | Opus 5.5, effort xhigh | gpt-6.1-sol, effort max |

**Review**

```bash
node <agentic-code-review>/scripts/validate-report.mjs <report.md>   # 0 = conforming; 1 = failure list
```

- Round limit by level (1 for requested Quick, 2 for Standard, 3 for Complete). From round 2 onward:
  only the new diff, without repeating closed findings, and only lenses with open Important findings, together.

- **At the limit, with an open Important, stop and go to the human** with a summary (open findings,
  responses, rounds, unreviewed diff, your recommendation). Never silently add a round.
<!-- card:end -->

Host differences, installations, tool substitutes and sibling resolution follow
`<agentic-project>/references/host-compatibility.md`; find that sibling through
`$AGENTIC_PROJECT_DIR` first and read the reference when the host varies.

The siblings `<agentic-code-review>` (`$AGENTIC_CODE_REVIEW_DIR`), `<agentic-design>` (`$AGENTIC_DESIGN_DIR`)
and `<agentic-implement>` (`$AGENTIC_IMPLEMENT_DIR`) follow the same reference; paths, prefixes and
order are not repeated here.

Repo rules override this skill: read `AGENTS.md`/`CLAUDE.md` (tests, Git, areas, sensitive zones, integration).

`<skill>` is this `SKILL.md`'s folder. Resolve siblings through the single reference
`<agentic-project>/references/host-compatibility.md>`; an explicit variable wins over the adjacent
folder, project folders, global roots and plugin. Without a Skill tool, read the found `SKILL.md`.

## Who does what

- **Orchestrator** (the session receiving the report): steps 1, 2, 6, 7 and 8.
- **Fix agent** (Claude subagent or Codex job, launched in step 2): steps 3 to 5, with
  `agentic-implement` loaded. If you are that agent, the brief says so; start at step 3.
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
3. Launch the agent in its own worktree, with the brief and “load `agentic-implement` and perform
   steps 3 to 5 of `agentic-fix`”, using the chosen model and effort. Claude: subagent. Codex: job
   with `$agentic-implement` and `$agentic-fix` in the request.

Done when the agent is launched with a brief an agent without this conversation could follow without
questions; for a short task, when you stated the level and started step 3.

## Step 3: reproduce (agent)

Build a **red** loop before reading code to theorize: a command following the defect's real path
and failing with the reported symptom. In preference order:

1. test at the entry point reaching the defect (unit, integration or end-to-end);
2. HTTP script against the development server;
3. command with a fixture, comparing output against a good reference;
4. headless browser driving the interface and checking DOM, console or network;
5. a real captured trace (request, payload, log), replayed in isolation;
6. a minimal harness calling the defect's path.

For a visual defect, proof is a screenshot showing the defect plus a test catching it when
available; how much to capture before and after: `<agentic-design>/references/proof.md` §2.

Tighten the loop until it is **tight**: seconds rather than minutes, deterministic (fixed time,
seed and network), asserting the exact symptom rather than “did not crash”. For an intermittent
defect, raise the reproduction rate (repeat, parallelize, narrow windows) until debuggable.

No possible loop: return `blocked: <what is missing>`, with what you tried and what you request
(environment access, a captured artifact without secrets, or temporary instrumentation).

Done when there is **one** command, already run with output shown without secrets, that goes red
for this defect and only this defect.

## Step 4: cause and class (agent)

- **Known cause** (red points to the line): proceed to the class.
- **Unknown cause**: follow `references/diagnosis.md` (minimize, falsifiable hypotheses, instrument
  one at a time, evidence from Git, PRs and logs).

Then search the **class**: other instances of the same defect (same pattern in other files) and
indirect uses of what you will change (callers, enums, constants, wrappers, runtime-built names,
other services). Every instance enters the fix; every indirect use enters verification. In an
interface report, the class stays within the specified screen (step 1).

A defect that returned after a fix, or whose class spreads across many places, is **structural**:
the root cause is the producing mechanism (data model, contract, component, generator); another
symptom adjustment (another forbidden rule, parameter, more prompt text) does not count as a fix.

Done when you write the root cause in one sentence and the class in one line: `N instances:
file:line, …`, or `only this one`, with the search command proving it.

## Step 5: fix and turn green (agent)

Follow steps 3 to 8 of `agentic-implement`, with fix-specific requirements:

- The red test is step 3's, at the entry point catching the real pattern. If the only possible
  test is too shallow to catch it, record it in the handoff: architecture prevents pinning the defect.
- The smallest change fixes every class instance and nothing else.
- **Safeguards** (killswitch, flag marked permanent, mitigation path, security guard): if the fix
  touches one, stop before changing it and ask. In a subagent or job, return
  `status: blocked: <the question>` to the orchestrator, who takes it to the human.
- Green: the new test, step 3's loop against the original scenario (not only the minimized one),
  and area tests.
- Cleanup: remove temporary instrumentation (marked with a unique prefix, removed with a grep)
  and disposable prototypes.
- The commit body carries root cause and `Tested:` (commands and result); risk and undo go in
  the integration commit (step 7).

Done when the agent returns `done` with the commit, red then green, and the class addressed;
or `blocked` or `spec-conflict` with the reason.

## Step 6: review (orchestrator)

- **Sensitive zone** (those in the repo's `REVIEW.md`; without it: authentication, permissions,
  third-party data, money, migrations): `agentic-code-review` panel.
- **Outside it**: request “Quick (requested)” from `agentic-code-review`: one **fresh-context**
  reviewer who did not write the code, with one lens, correctness, and 1 round
  (`<agentic-code-review>/assets/reviewer-brief.template.md`). Read the diff against the brief
  (symptom, expected behavior and class), looking for what the fix breaks. If `agentic-code-review`
  checks the diff and assigns a higher level (large fix, always-high path), its level applies.

Reviewers count toward `agentic-code-review`'s ceiling of 8 agents.

Each Important returns to the agent, who reproduces before fixing it; do not fix what cannot be reproduced.

Done when no Important remains open.

## Step 7: integrate (orchestrator)

Integrate following repo rules (branch, merge, verification suite, deploy). The fix reaches integration
with step 5's proof and step 6's review closed. The integration commit carries `Risk:`, `How to undo:`
and `Review:`, as `<agentic-code-review>/references/panel-and-rounds.md` §10 specifies.

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

In Codex: `$agentic-fix` and `$agentic-implement`. Without a subagent tool, perform steps sequentially,
without worktrees; step 6's fresh-context reviewer is a new session; without one, declare review
“not independent”, as in `agentic-code-review` (“In other agents”). Method origin and licenses:
`references/origin.md`.
