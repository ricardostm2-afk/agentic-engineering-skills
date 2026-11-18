# Evals

Cases that measure what the skills do to an agent: did it find the defect, did it keep the proof,
and **how many subagents it launched to get there**. They exist so that cutting tokens (fewer
reviewers, fewer rounds, cheaper models) can be checked against quality instead of guessed.

They use the format of `claude plugin eval` (Claude Code 2.1.269 or later), so the same folder runs
on a laptop and in CI. No case names a skill in its prompt; whether the right skill fires is itself
measured.

## What is here

| Case | Skill | Planted situation | What good looks like | Cost grader |
|---|---|---|---|---|
| `fix-sort-order` | agentic-fix | list comes out in the wrong order (a boolean comparator in `src/sort.js`) | boolean comparator gone, a test run before the edit | 0 subagents (short fix, no sensitive zone) |
| `fix-isolation-class` | agentic-fix | `getOrder` ignores the organization; `updateCustomer` has the same defect | both fixed, not only the reported one | at most 3 |
| `review-leak` | agentic-code-review | `findByReference` returns another organization's order | flagged as Important with `file:line` | at most 3 |
| `review-doc-lie` | agentic-code-review | a rename leaves `README.md` documenting the old name | stale README line flagged, nothing invented | at most 3 |
| `review-clean` | agentic-code-review | a correct change in a sensitive file | no Important finding | at most 2 |

`fixtures/orders-api/` is a 60-line module with a `base/` and one overlay per case; `fixtures/make-repo.sh`
turns them into a git repository (`fix` mode: the defect is already on `main`; `branch` mode: the change
is one commit on its own branch, to be reviewed against `main`).

Every case has exactly one grader on the number of `Agent` calls. Read it next to the quality graders:
a cut that lowers the agent count and keeps the quality graders green is the goal; one that turns a quality
grader red is a regression.

Not covered here: `agentic-feature`, `agentic-project` and `agentic-architecture` stop for the human at
checkpoints, which a non-interactive run cannot answer; `agentic-design` has its own `skills/agentic-design/evals/cases.json`.

## Keep the case blind

An agent that can tell it is being measured behaves differently, and a judge that knows which side
is which scores what it expects. For every new or changed case:

- **The prompt is an organic request.** It states the goal a user would type. It names no skill and
  none of these words: eval, evaluation, test case, judge, grader, rubric, score, benchmark,
  experiment, candidate. `tests/evals.test.mjs` rejects them in every `prompt.md`.
- **Nothing the agent can read gives it away.** Scaffolded directories, branch names, commit
  authors and messages look like a project a user might have. Expected answers, rubrics and graders
  are never copied into the live checkout.
- **Do not ask the agent what it followed.** Asking it to list the skills, rules or files it applied
  elicits the chain instead of measuring it. Ask for the work; grade from the trace (tools called,
  files actually opened, order of writes) and from the shape of the result, never from self-report.
- **One run does not know about the others.** No prompt mentions other runs, variants or models.
- **The judge sees labels, not names.** When two variants are compared, one judge scores both in a
  single pass on one scale, with outputs under neutral labels and no model or variant name.
- **Read the outputs yourself.** A judge verdict that disagrees with your own end-to-end reading
  means a biased judge or an ambiguous rubric; resolve it before promoting a variant.

Blinding rules adapted from the eval playbook of `cursor/plugins` pstack (MIT, revision `93b916d4a`).

## Without a model (free, part of `node --test`)

`tests/evals.test.mjs` checks that each overlay really holds the defect its case claims (the overlay's own
tests stay green, a probe shows the defect), that the scaffold scripts build the repository, and that every
case and grader is well formed.

## With a model (billed to the account running it)

Requirements: Claude Code 2.1.269+, git 2.31+, Node 20+, and a **sandbox for shell commands**: Linux or
WSL2 with `bubblewrap` and `socat` (`sudo apt install bubblewrap socat`). Native Windows has no sandbox
backend, so cases that run `Bash` are refused there.

```bash
# one case, one run, no baseline: a smoke test of the setup
claude plugin eval . --case fix-sort-order --runs 1 --ablation none \
  --allow-tools Bash Write Edit --scaffold --no-publish

# the whole suite on the working tree: 5 cases x 2 runs
claude plugin eval . --ablation none --allow-tools Bash Write Edit --scaffold --no-publish

# before and after: same cases against an older version, two tables
EVAL_MODEL=sonnet evals/compare.sh v2.1.0
```

Drop `--ablation none` to also run each case with no plugin loaded; the `Δ` column then says what the skills add.
The CLI prints a list-price cost per case; `--max-cost-usd` stops the run when it is reached. A run is noisy:
repeat before trusting a difference of one case.

## Adding a case

1. Add an overlay under `fixtures/orders-api/<overlay>/` with only the files it changes.
2. Copy a case folder, point `place-fixture.sh` at the overlay, write the prompt the way a user would, and give
   it quality graders plus the one `Agent` count grader.
3. Add the overlay to `OVERLAYS` and a probe in `tests/evals.test.mjs`.
4. When the case exists to show that a skill change fixes a behavior, run it first on the revision
   before the change and see it fail there. A case that already passes on that revision guards
   against regressions; it does not show the change works. Spread across repetitions is a result
   too: outputs that still vary widely after the change mean the wording does not bind yet.
   Adapted from the skill-testing guidance of `obra/superpowers` (MIT, revision `22f0b463`).
