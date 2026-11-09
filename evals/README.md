# Evals

These cases measure task completion, engineering safeguards and unnecessary work. Compare quality
before cost: fewer agents, shorter instructions or a cheaper run do not establish an improvement if
the task is incomplete. Native model evaluations are opt-in and billed to the account running them.

The format is [`claude plugin eval`](https://code.claude.com/docs/en/plugin-evals), introduced in
Claude Code 2.1.269. No prompt names a skill: selecting the relevant workflow is part of the exercise.
The Node test suite validates fixtures and contracts without calling a model.

## Cases

| Case | Situation | Required behavior | Agent-call ceiling |
|---|---|---|---:|
| `fix-sort-order` | Boolean comparator returns orders incorrectly | Real relevant RED before production writes, correct ordering, same regression GREEN | 0 |
| `fix-isolation-class` | Two operations ignore organization scope | Repair the defect class, preserve same-organization access, RED/GREEN evidence | 3 |
| `review-leak` | Lookup returns another organization's order | Important finding with a precise location | 3 |
| `review-doc-lie` | Renamed export leaves README stale | Identify the documentation defect without inventing others | 3 |
| `review-clean` | Correct change in a sensitive file | No invented Important finding | 2 |
| `feature-short-label` | Add one label to an existing map | Preserve known and unknown behavior, targeted proof, early short route | 0 |
| `design-targeted-spacing` | Apply an existing spacing token | Focused UI change, honest visual evidence, no variant exercise | 0 |
| `feature-parallel-ownership` | Plan two independent lanes | One owner of shared tasks, task IDs and evidence in worker handoffs | 0 |
| `review-risk-escalation` | Post-review fix changes access scope | Reclassify the new diff and add the needed security review | 0 |
| `explain-code-plain` | Explain a small mapping function | Source-grounded chat explanation with examples | 0 |
| `feature-sensitive-plan` | Plan temporary external access | Resolve material access decisions, preserve the sensitive path, do not implement | 3 |
| `project-minimal-bootstrap` | Prepare an existing small repository | Verified commands and concise rules without compulsory planning modules | 0 |
| `architecture-assess-only` | Assess two small modules | Evidence and tradeoffs; no change is an acceptable conclusion | 0 |

Every case has exactly one `Agent` count grader alongside quality graders. A ceiling is specific to
that case, not a general instruction to avoid useful independent review. Planning-only prompts test
handoff contracts without needing a simulated human to answer later checkpoints. Interactive
multi-round decisions still need a separate exercise. Plan/assessment-only cases inspect the trace
and use exact final-file guards for production inputs, plus guards against newly created source/UI
files. A correct final explanation alone cannot conceal a changed existing implementation.

`fixtures/orders-api/` contains a base module and defect/change overlays. `fixtures/make-repo.sh`
creates a one-commit bug fixture or a branch to review against `main`. `fixtures/workflow/` is a small,
dependency-free repository with separate label, UI and access boundaries;
`fixtures/make-workflow-repo.sh` makes it a clean Git repository. UI detector-specific cases remain in
`skills/agentic-design/evals/cases.json`.

## What the graders establish

Use only native grader types: `regex`, `tool_used`, `tool_order`, `file_exists`, `llm`, and `baseline`.
The fix cases use an LLM trace rubric for observed failure before **any** production write, including
writes made through Bash or a subagent, followed by the same unweakened regression passing. A green
baseline or unrelated setup failure is insufficient.

The native `focus: trace` judge sees the first and last 12 messages. The rubric must fail when the
necessary evidence is missing; its judgment is not a deterministic temporal guarantee. Preserve raw
reports for inspection and validate judge behavior with actual positive and negative runs. Local rubric
tests only check the written contract. `file_exists` evaluates created files, not pre-existing fixture
files, so the no-HTML graders detect unnecessary new pages.

An additional deterministic oracle checks final behavior for the two fix cases:

```bash
node evals/verify-fix.mjs fix-sort-order /path/to/completed-fixture
node evals/verify-fix.mjs fix-isolation-class /path/to/completed-fixture
```

It is a separate verifier, not a native custom-code grader. It rejects the planted defects, partial
repairs, broken same-organization behavior and mutation before denial. It does not prove RED/GREEN
ordering. Exit codes are 0 (pass), 1 (behavior failed), and 2 (invalid invocation).

## Without a model

```bash
node --test
node tools/context-budget.mjs
```

Tests check fixture behavior, clean scaffold creation, supported grader contracts, comparator failure
propagation and metric validation. CLI doubles and synthetic metric fixtures are explicitly local
tests; they are not model results. Context budgets count UTF-8 bytes in explicit files, including
comments and embedded cards. They neither estimate tokens nor include runtime prompts and tool output.

## With a model

Requirements: Claude Code 2.1.269+, Git 2.31+, Node 20+ and a supported shell sandbox. On Linux/WSL,
install `bubblewrap` and `socat` for Bash cases. See the current native documentation for platform
support. Native Windows does not provide the shell sandbox required by these cases.

```bash
# One case, one repetition: smoke test. Choose an explicit model available to your account.
claude plugin eval . --case fix-sort-order --runs 1 --ablation none \
  --model <model-id> --judge-model <judge-model-id> \
  --allow-tools Bash Write Edit --scaffold --no-publish

# All 13 cases, two repetitions each by default.
claude plugin eval . --ablation none --model <model-id> --judge-model <judge-model-id> \
  --allow-tools Bash Write Edit --scaffold --no-publish

# Same candidate cases against an older revision and the current working tree.
EVAL_MODEL=<model-id> EVAL_JUDGE_MODEL=<judge-model-id> EVAL_EFFORT=high \
  evals/compare.sh <before-ref>
```

Angle-bracket values above are placeholders; replace them before running. Prefer fixed model IDs to
moving aliases. `EVAL_MODEL` is required; the judge defaults to that same model unless
`EVAL_JUDGE_MODEL` is set. `EVAL_EFFORT` requests the same effort through
`CLAUDE_CODE_EFFORT_LEVEL` on both sides; metadata records that request, not proof of effective effort.
Without it, inherited effort is recorded or left null.

The wrapper prepares a `quality-only-v1` suite by removing only the `tool_used` graders for `Agent`.
The canonical cases above retain those budgets for direct native runs. Comparison scores therefore
cover the retained task/workflow criteria without mixing the agent-count ceiling into quality.
Skill-routing and all other graders stay. Both plugin versions receive the same filtered suite;
cases with no remaining criteria fail before a model is called. Inline `case.yaml` graders must first
be moved into `graders/*.md` so their classification is explicit.

The candidate and baseline are copied into disposable snapshots before either run. This freezes
candidate edits and avoids modifying the checkout. The CLI requires a relative eval directory,
so both snapshots use `--eval-dir agentic-quality-evals`. The wrapper uses `--trust-plugin`, `--scaffold`, `--ablation none` and `--no-publish` for this explicit
local comparison. Review an unfamiliar baseline before running its code. `EVAL_MAX_COST` defaults to
10 USD **per side**; a budget-stopped partial run is not a successful evaluation. Extra native options
such as `--case` or `--runs` apply to both sides. Options that replace model, suite or output paths are
rejected. Dropping ablation in a separate direct CLI run measures the plugin against no plugin; that is
a different experiment from a version comparison.

Each invocation creates `${EVAL_RESULTS_DIR:-evals/results}/compare.XXXXXX/` containing:

- `before.json` and `after.json`: native JSON stdout, even when the command fails.
- `before.stderr.log` and `after.stderr.log`: diagnostic output.
- `before-report/` and `after-report/`: native report artifacts.
- `effective-suite/`: the exact filtered inputs used by both sides, retained after temporary cleanup.
- `metadata.json`: commit IDs, candidate dirty status, a SHA-256 digest of the identical eval inputs,
  model and judge, requested effort, CLI version, cost ceiling, timestamps, extra options and both
  native exit statuses. `comparisonProfile`, `excludedGraders`, `evalDirectory` and `suiteSnapshot`
  describe the quality-only transformation and its saved inputs.

The wrapper runs the second side even if the first fails, then exits 1 if either side failed. It does
not relabel a clean baseline as dirty. Uncommitted and ignored candidate inputs are recorded; existing
`evals/results/` is excluded from that status check. Commit candidates for reproducible comparisons;
a commit ID plus a dirty marker cannot recreate an unpublished worktree.

## Compare quality, cost and observed usage

```bash
node evals/metrics.mjs evals/results/compare.ABC123
node evals/metrics.mjs evals/results/compare.ABC123 --min-runs 3 --max-cost-increase 10
node evals/metrics.mjs evals/results/compare.ABC123 --usage observed.json --max-token-increase 0
```

The collector reads the native version-1 JSON and `quality-only-v1` comparison metadata. Reports
without that explicit separation are rejected instead of labeling a mixed score as quality. It requires matching cases,
repetition counts and CLI versions, completed with-plugin runs, no skipped paid graders or errors, and
at least two repetitions by default. Every candidate criterion must pass. A failing baseline prevents
an equivalent-completion efficiency claim even if the candidate improves it. Output is JSON; exits are
0 (all gates pass), 1 (quality, execution or configured cost gate fails), and 2 (invalid/incomparable data).

Native list-price cost and elapsed duration are reported separately. Cost includes judge calls and is
not a subscription invoice. Cost increases are only blocked when a maximum is explicitly configured.
Small-sample deltas and p95 values describe the experiment; they are not statistical confidence bounds.

The documented native aggregate schema does not expose the token and intervention counters needed
here. They remain `null` unless supplied from **observed** telemetry. An optional normalized usage file
has this shape (numbers below illustrate the format only):

```json
{
  "schemaVersion": 1,
  "measurement": "observed",
  "source": "identify the real trace or usage export",
  "inputConvention": "uncached-only",
  "before": [
    {
      "case": "fix-sort-order", "run": 1,
      "inputTokens": 800, "outputTokens": 200,
      "cacheReadTokens": 400, "cacheWriteTokens": 0,
      "toolCalls": 6, "subagents": 0, "retries": 0, "humanTurns": 0,
      "durationSeconds": 18
    }
  ],
  "after": [
    {
      "case": "fix-sort-order", "run": 1,
      "inputTokens": 650, "outputTokens": 180,
      "cacheReadTokens": 350, "cacheWriteTokens": 0
    }
  ]
}
```

Include one row for **every** case/repetition on both sides. The four token counters are mandatory,
nonnegative integers, and mutually exclusive: `inputTokens` excludes cache reads and cache writes.
Normalize a provider export to that convention before using it. Optional tool, subagent, retry, human
turn and elapsed counters are not zero-filled; aggregate values remain unknown when a row lacks them.
The collector reports totals and token median/p95 overall and by case. A requested token gate fails
when observed usage is absent. No automatic estimator or provider adapter fabricates missing counters.

## Add a case

1. Use an existing fixture or add a small independent one. For a defect overlay, prove that its own
   tests are green and a separate oracle detects the claimed defect.
2. Add `case.yaml`, `prompt.md`, a scaffold and quality graders plus exactly one `Agent` count grader.
   Write the prompt as a user request without skill-name hints.
3. Extend `tests/evals.test.mjs` for the fixture and contract. Inspect actual agent traces and grader
   decisions before treating the case as evidence of behavior.
