# Learning: lessons, evaluation cases and evaluating the reviewer (step 7)

Two articles, same idea: reviewer (and agent instructions) is code, changed with evidence.
Anthropic (https://claude.dev/blog/solving-code-review-at-anthropic/): incidents and reverts become
an evaluation set confirmed by people knowing the code; any reviewer change runs against it.
OpenAI (https://developers.openai.com/blog/maintaining-software-with-the-gpt-6-family): A/B
instructions from the same snapshot, models chosen by cost per accepted finding, model
disagreements mapping blind spots.

## Lesson line

When something escaped (reverted, incident, human report) or a class appears a second time in
review, one lesson line in the discovering/fixing change's metadata commit:

`- <yyyy-mm-dd> · <area> · type: <escaped|repeated> · base <base-sha> · <defect-sha>→<fix-sha> · expected: <file:line> · class: <class> · layer: <should have caught it (escaped) or caught it (repeated)> · <what happened> → <defense>`

**Where it lives.** Where project `REVIEW.md` specifies lessons/evaluation cases, in its format
(overrides above); without a specification, `docs/lessons.md`. With neither, do not create a file:
put the line in the final human message. This is where you search for a class's second occurrence
and an area's `escaped` lessons.

- `type: escaped`: passed review, seen later. `layer` should have caught it; `expected` is the
  `file:line` where reviewer should have flagged it.
- `type: repeated`: review caught it, but class appeared twice (search `git log --grep '<class>'`
  and lessons). `layer` caught it; `expected` is finding line.
- Only `type: escaped` raises area level (`risk-levels.md`).

## Fix at the source

Do not resolve repeated findings, or a correction the user had to make twice, by repeating them.
Follow `encode-corrections.md` (architecture → types → lint whose error names the fix → test →
prose). In order:
1. if a machine detects it without false positives, make a guard, lint rule or test (prove
   refusal: seeded defect red, restored green);
2. otherwise one `REVIEW.md` line (“What failure means here” or “Repeated findings”, `review-md.md`)
   or reviewer brief line;
3. on escape, ask what reviewer lacked (whole diff? outside caller? written rule?) and fix that,
   not only the defect.

## Evaluation cases

Evaluation set is lesson lines (`escaped`, `repeated`) plus **clean cases**, in
`assets/eval-case.template.md` format:
- each confirmed by someone knowing the code (human or area owner), not its author agent;
- **clean** = integrated at least 30 days ago, without revert or incident;
- **run a case**: reviewer with level/lenses the change would have, in an outside-repo worktree,
  on `<base>..<defect-sha>` (or `<base>..<integrated-sha>` for clean). Pass if an Important is
  flagged in `expected` file, within the expected hunk; clean passes without Important (ignore Nits).
- **Ceiling**: each case is a full panel, so run cases **sequentially**, each within the review
  agent ceiling (`panel-and-rounds.md` §3), never all in parallel. With many, run changed-lens
  cases first.

## Reevaluate the reviewer

A reviewer change is any change to brief, `REVIEW.md`, prompts, model, effort or lens tools.
- **First version is baseline**: no required run.
- Thereafter run cases before adoption. Keep if it **loses no previously caught case**; with
  **3 or more clean cases**, also **no Important on clean cases**. With fewer than 3, the latter
  criterion does not count (it would satisfy itself): say so.
- Between qualifying versions choose lower cost per accepted finding (run tokens divided by
  caught cases); applies only with at least 1 caught case.
- Results (cases run, caught before/after, clean) go in change commit message.
- Measure recall alongside noise, never alone: flagging much raises recall and overwhelms author.
- **Recall by stage.** Report caught cases at three points: raw lens findings, after confirmation
  (`panel-and-rounds.md` §6: verifier, fixer reproduction), and in the final report. One end-to-end number hides a bug that
  a lens found and consolidation or the verifier dropped. Fix the stage that lost it.
- **Credit only the right bug.** Each escaped case carries a one-sentence answer key. A finding counts
  only when it describes that bug, not merely when it lands on the same hunk.
- **Keep tuning and test cases apart.** Tune the brief or `REVIEW.md` on some cases and judge the
  result on others. Stop raising recall when the next gain only fits the cases, not new changes.

## Turning misses into rules

Adapted from https://claude.dev/blog/how-the-claude-code-team-thinks-about-verification/. Two ways
to find rules worth adding:

1. **Mine reviews and reverts.** A candidate pattern needs at least 2 PRs or lessons, and a trigger
   that can be read from a diff. Before adding it, try to disprove it: look for merged changes that
   match the trigger and were fine. Then propose it as a diff for the human to approve.
2. **Replay against an incident.** Run the review on the change that caused a known incident. If the
   panel misses the bug on a small diff, the reviewer lacked information. Add the `REVIEW.md` line or
   the reliability-checklist item that would have caught it (`review-md.md`), and keep the case as an
   escaped evaluation case.

Each rule earns its place: prune it when it stops matching or catching (`review-md.md`, “Prune”).

## A/B instructions

For a project `AGENTS.md`, `CLAUDE.md`, `REVIEW.md`, brief or skill instruction that appears to
have misdirected an agent or caused excess work in recent sessions:
1. choose a real task it affected and the task's starting SHA;
2. run twice from that same SHA with same model/effort, each in its own worktree: one with the
   instruction, one without (or corrected);
3. compare result quality, behavior, tool calls, tokens, time and cost. One run each is a clue,
   not a measurement: repeat when differences are small.

Keep the winner; put comparison in commit message.

## Model and effort

- **Review model belongs to the user** (their rule; otherwise `panel-and-rounds.md` §3). Take a
  proposed switch to them with comparison on **cases the current model catches**: new one must
  catch them too at lower cost per accepted finding. With no caught cases (passing everything
  because there is nothing to catch), keep current.
- Measure **cost per accepted finding** on a fixed set (evaluation cases or folders), each
  finding human-validated. Include subagents and automatic turns in cost.
- Raise effort for broad audits only after good initial results. Compare models on a small task
  before proposing a switch.
- **Disagreements**: one model flags and another does not: one has a blind spot. Read these cases,
  fix prompt or `REVIEW.md` for it, recording which model the fix concerned. Revisit when a new
  model arrives: it may no longer need the fix.

## Minimum metrics

Small projects need only integration commit `Review:` lines (`git log --grep '^Review:'`): rounds
to pass, first-round pass count, share of “wrong”/“does not matter” responses (noise), `escaped`
lessons by area. Precision, recall and hours saved only when measured; never estimate them.

**Revert rate.** Integrated changes reverted within 30 days, divided by changes integrated in the
same window. Count from history, for example `git log --since=60.days --until=30.days --first-parent`
on the integration branch against `git log --grep '^Revert' --since=60.days` whose reverted SHA falls
in that window. State the window and the counts; under ~50 integrated changes report the counts
without a rate. A falling rate is evidence that the defenses work; a rising one points at the area
to read in the `escaped` lessons. Lauren Tan's team judges an agent-heavy codebase by it (“All Code
Is Slop (Except Mine)”, AI Engineer, 2026-11-14: about 0.5% at ~11,000 PRs a month).

## Before an unattended loop

Foundations come before a factory: automating a sloppy inner loop produces more slop and burns
tokens. Before proposing scheduled agents, auto-merge, or a loop that finds and fixes bugs without
a human in it, check and report:
- the project's checks and `verify` skill (`<agentic-project>/references/verify-skill.md`) run
  green 3 times in a row on a clean tree, and the loop runs the same gates as a human change;
- repeated mistake classes are encoded as checks (“Fix at the source” above), not left as prose;
- the revert rate is measured, with counts, and the loop's own changes are counted in it;
- the loop has a stop: a cap on changes per run and a rule that pauses it when its reverts rise.

Any gap is the first work item, not a reason to skip the loop silently. Turning on the loop, or
lowering the review level for its changes, remains the user's decision.
