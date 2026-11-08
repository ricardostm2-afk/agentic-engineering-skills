# Review report

<!-- agentic-code-review template (steps 3 and 5). For lens reports and orchestrator's consolidated
report to author/human. Before sending, check with `node <skill>/scripts/validate-report.mjs <file>`
(exit 0). Validator tests read “text example” blocks: change both when changing format. -->

## Format

```text
Review <reviewed-sha> · <level> · [lens <lens> · ]round <n>/<limit> · <i> Important · <n> Nits · <p> Pre-existing
0 Important — nothing to fix        ← only when i = 0, immediately after first line

[Important] <file:line> — <effect> — reproduce: <test, command or screenshot> — class: <class>
[Nit] <file:line> — <what>        ← at most 3 total, after Important findings

Pre-existing: <file:line · class; …> | none
Not confirmed: <file:line · why; …>      ← only if verifier gave no verdict
Acceptance test: <what it tests · file path or description>   ← spec lens
Direction: <challenge to approved approach>     ← only if present; not a finding
Level: <file:line requiring more than assigned level>   ← only if present
Not read: <what and why> | nothing
```

- **First line**: reviewed SHA (7–40 characters), level or `REVIEW.md` level, lens (per-lens reports;
  consolidated may omit), round and limit, three counts. Singular Nit is accepted (“1 Important ·
  1 Nit · 1 Pre-existing”).
- **Important**, one per line by severity. `reproduce:` is proof:
  - code: red test, command/output or screenshot;
  - doc: doc line and contradicting code/tree line (another `file:line`), or `absent: <path>` for
    nonexistent citations;
  - dependency outside research (class includes “outside research”): manifest line and
    `absent in <approved research file>`; vulnerable dependency is proved like code (`npm audit`
    warning or equivalent).
- **Nit**: also `file:line`. Opens no round or own commit.
- **Pre-existing**: one line, semicolon-separated items. Outside backlog and this fix.
- **Acceptance test** (spec lens): what it tests, file path or description, per
  `<skill>/references/panel-and-rounds.md` §3.
- Labels: only `[Important]` and `[Nit]`. Style and formatting are not findings.

## Examples

One lens, with findings:

```text example
Review 9f3c2ab · Complete · lens correctness · round 1/2 · 2 Important · 1 Nit · 1 Pre-existing

[Important] api/src/routes/orders.ts:142 — another organization's id returns 403 instead of 404, confirming the order exists — reproduce: npm test -- orders.isolation (red on 9f3c2ab) — class: error reveals another organization's resource
[Important] docs/RUNBOOK.md:57 — instructs running scripts/migrate.sh, deleted by this change — reproduce: absent: scripts/migrate.sh (git ls-tree 9f3c2ab) — class: lying doc
[Nit] api/src/routes/orders.ts:9 — unused import

Pre-existing: api/src/lib/dates.ts:30 · fixed timezone
Acceptance test: request with another organization's id is refused · <tmp>/acceptance-orders/isolation.test.ts
Not read: nothing
```

Consolidated, without findings:

```text example
Review 9f3c2ab1d0e4 · Complete · round 2/2 · 0 Important · 0 Nits · 0 Pre-existing
0 Important — nothing to fix

Pre-existing: none
Not read: nothing
```
