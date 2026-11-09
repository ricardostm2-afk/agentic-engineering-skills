# Verification and delivery (steps 6 and 7)

Independent review belongs to sibling agentic-code-review (`<agentic-code-review>/SKILL.md`, located
as SKILL.md says): level/lenses, models/ceiling, consolidation/confirmation, labels/proof, responses/
rounds, post-review commits/rebase, undo/Review: line (`<agentic-code-review>/references/panel-and-rounds.md`).
Here only feature-specific handoff/results, verification, traps, delivery.

## Review: what you pass and handling results

1. **Request** (its fixed point, panel-and-rounds.md §1):
   - feature track/why: starting level, checked against each round diff, may rise (never beyond
     Complete; no redo of completed planning);
   - base (before preparation commit), reviewed SHA (HEAD to integrate);
   - spec, plan, approved Research paths (spec summary Research line and research-notes.md, or trivial
     Reading line: standards lens checks dependencies/new patterns);
   - UI: selected mode, variants/choice.md when one exists, chosen or preserved-baseline screenshots,
     exact `<agentic-design>/references/review-mode.md` path and relevant proof scope;
   - round 2 onward: closed findings and responses.
2. **Each returning Important** fixed per step 5 (new agentic-implement brief or implementation.md
   §4 short form), after reproduction (panel-and-rounds.md §6). Unreproduced is not fixed: respond
   “wrong: not reproduced” with attempt. Every Important gets response (§8) before delivery;
   unanswered security Important leaves feature unfinished.
3. **Reviewer acceptance test** (spec lens), file only for Complete (panel-and-rounds.md §3):
   author integrates unchanged before next round or main integration. Failure is Important.
4. **Direction** (challenges approved spec-summary approach): not fixed in review. Human under
   Needs you for product, backlog for technical matters.
5. **Pre-existing**: report line goes to retro, outside backlog and incidental fixes.
6. **At round limit** with open Important, review stops for human decision and summary: feature
   unfinished until decision (rethink, split, accept with reason).

## Verification

After review/fixes on the combined branch, match each required check to existing proof under
`<agentic-implement>/references/evidence.md`. Reuse exact valid evidence and run missing/invalid
checks. New combined or rebased states need integration proof; moving between roles is not itself
an invalidation.

1. **speckit-converge** (with Spec Kit): compare code/spec/plan/tasks, add missing work. New tasks
   return to step 5. Without Spec Kit compare manually to light spec.
2. **Verification suite**: tests/typecheck/lint/local suite/CI per AGENTS.md. Skips count: “120 passed,
   14 skipped for missing database” is not green.
3. **End to end**: complete user path against running app (real HTTP or browser on real screen),
   not just separate services.
4. **UI**: follow the selected mode and proportional scope in
   `<agentic-design>/references/proof.md`: a correction needs the reported screen before/after;
   new screens/redesigns need agreed states, resolutions, themes and interaction evidence against
   the chosen variant. Reuse matching screenshots/detector proof; changed UI invalidates affected
   evidence. Unagreed differences are findings. Test the affected keyboard/reflow behavior.
5. **Traps** below: every line.

Proof format for board/final message:

```
$ <command>
<final output summary lines>
exit=<code>
```

## Traps in agent-written code

Each trap → prevention. Check in review and whenever writing/assessing tests.

1. **Measure before planning**: building existing behavior → Reading before any plan, with paths;
   mandatory search for Reuse/Missing connection suggestions.
2. **Author test inherits author error**: wrong query and accepting test → independent reviewer
   checks tests, adds own spec-based acceptance (panel-and-rounds.md §3).
3. **Primitive proof is not connection proof**: tested engine not called by route/screen → at
   least one real end-to-end test (gesture/request → route → engine → observed effect), fails
   when connection removed.
4. **Built but unreachable**: no user entry → mandatory grill entry question, explicit plan task;
   verify from user's starting point, not feature URL.
5. **Collected and ignored**: screen requests/saves data nobody reads → named consumer per new
   value (grill, brief, report), test writes by real gesture and observes effect.
6. **Fixture/mock replaces write**: manually inserting value code should calculate cannot disagree
   with production → at least one real dependency test (real database), data from real write path.
7. **Skipping guard with exit 0 fails open**: found problems or missing database/variable exits 0
   → fail-closed checks, skip=failure, unpiped exit code; prove every new guard refuses (seed defect,
   red, restore, green).
8. **Commit claims absent work**: message describes excluded files/work → before push compare
   git show --stat and diff/message; git add only changed files.
9. **Tight timeouts/orphans hang suite**: timeout fitted to fast machine, live child server/browser
   → `<agentic-implement>/references/tests.md` “Timeouts and child processes”; run the affected
   suite twice only when process lifecycle changed or an observed orphan/hang is under investigation.
10. **Non-null default hides wrong query**: wrong read yields plausible default rather than error
    → distinguishing dates/customers/values, each indicator observed twice: normal and seeded defect.

## Delivery (step 7)

0. **Radar** (current-research.md “Project radar”): update new/materially refreshed research before
   final commit, same commit or separate docs(radar) before push. No duplicate refresh for reused
   evidence. One row per consequential used/tried/rejected result with source/date.
   New entries never directly Adopt. Without radar, propose under Needs you, do not create.
1. **Commits**: one topic each, why and proving command/result. Standard/Complete integration
   commit body also Risk: (what can fail/for whom), How to undo:, Review: per panel-and-rounds.md
   §10. **Integration commit** joins main: ff-only means feature's last (usually post-review metadata:
   radar, Review:); merge policy means merge commit. PR means PR description. Only location for
   these fields: spec/retro/board/final message point rather than copy. Why comes from request,
   grill or spec; absent reason write “at <who>'s request” rather than invent. Follow project format.
2. **Check**: each new git show --stat matches message? Clean git status? Temporary worktrees/
   branches removed, including prototype (named in variants/choice.md)?
3. **Push** per project policy. Default trunk-based: main after green, short branches, nothing
   unpushed at session end. Use project /ship or equivalent.
4. **Deploy** only at project's prescribed time. Production, real-data migration, external action:
   explicit OK first with action/undo. Use project /deploy, no improvised command.
5. **Board**: end with integrated (main) or in-production (after deploy), SHAs, proof.
6. **Mini-retro**: assets/retro.template.md (3–5 lines) on board or final message. Propose reusable
   lesson location (lessons, AGENTS.md, new automatic check); machine-checkable rule is better as check.
   **Lesson line**: write yourself in discovering/fixing feature's metadata commit on escape
   (revert, incident, human report) or second class occurrence (git log --grep '<class>', lessons).
   Location, format, type/expected/layer meanings, evaluation conversion:
   `<agentic-code-review>/references/learning.md`. Only type: escaped raises track. Without project
   location put line under Needs you.
7. **Final human message**, brief:

```
Done: <user-visible change, 2–4 lines>
How to verify: <screen steps or command>
Proof: <main commands/results or board link>
Left out: <list, including backlog entries>
Risk, how to undo and review: body of <integration-sha>, or PR description (Standard/Complete)
Not covered by proof: <what checks miss: no screenshot, real integration not called…, or nothing> (Standard/Complete)
Needs you: <deploy OK, secrets, accounts, radar promotion to Adopt, create radar… or nothing>
```
