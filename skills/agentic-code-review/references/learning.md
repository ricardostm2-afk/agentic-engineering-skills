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

Do not resolve repeated findings by repeating them. In order:
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
