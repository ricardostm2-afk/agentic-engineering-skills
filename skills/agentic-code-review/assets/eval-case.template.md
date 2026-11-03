# Reviewer evaluation cases

<!-- agentic-code-review template (references/learning.md). Evaluation set is this case list;
each confirmed by someone knowing the code. Choose project's existing form; delete other and comment. -->

## Form 1: `docs/lessons.md` lines (default)

`escaped` and `repeated` cases are lesson lines themselves:

`- <yyyy-mm-dd> · <area> · type: <escaped|repeated> · base <base-sha> · <defect-sha>→<fix-sha> · expected: <file:line> · class: <class> · layer: <should have caught it (escaped) or caught it (repeated)> · <what happened> → <defense>`

Clean cases go in a final “Clean cases” section of the same file, one line each, same separators:

```text
- <yyyy-mm-dd> · <area> · type: clean · base <base-sha> · <integrated-sha> · no revert or incident through <yyyy-mm-dd> · confirmed: <who>
```

Clean means integrated at least 30 days ago without revert or incident.

## Form 2: JSONL (scripted cases)

One case per line in a `REVIEW.md`-specified file (e.g. `docs/review-cases.jsonl`). Fields follow
lesson line plus `confirmed`:

```json
{"id":"2026-10-03-orders-isolation","type":"escaped","date":"2026-10-03","area":"orders","base":"<base-sha>","sha":"<defect-sha>","fix":["<fix-sha>"],"expected":{"file":"api/src/routes/orders.ts","line":142,"label":"Important","class":"error reveals another organization's resource"},"layer":"review","confirmed":true,"summary":"another organization's id returned 403 (confirms existence) → two-organization test"}
{"id":"2026-09-10-catalog-clean","type":"clean","date":"2026-09-10","area":"catalog","base":"<base-sha>","sha":"<integrated-sha>","fix":[],"expected":null,"layer":null,"confirmed":true,"summary":"integrated ≥ 30 days without revert or incident"}
```

- `type`: `escaped` (passed review, seen later), `repeated` (caught in review, second occurrence
  of class), or `clean`.
- `sha`: introducing commit (`escaped`, `repeated`) or integrated tip (`clean`).
- `expected`: where reviewer should flag; `null` for clean.
- `confirmed`: `true` only after confirmation by someone knowing the code.

## Run

For each case, reviewer in an outside-repo worktree at `sha`, using level/lenses the change would
have, on `<base>..<sha>`:
- `escaped`/`repeated`: pass with Important in expected file within expected hunk;
- `clean`: pass without Important.

Adopt reviewer change only if no previously caught case is lost and, with 3+ clean cases, no
Important on clean cases. First reviewer version is baseline.
