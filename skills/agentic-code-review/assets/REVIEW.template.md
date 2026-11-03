<!--
agentic-code-review template (references/review-md.md); agentic-project uses it in phase 6. Write
from docs/decisions.md, risk: high areas in .agentic/areas.json and existing lessons; human approves
“What failure means here”, as owner. Reviewer reads it before each review; it overrides brief.
Budget ~3 KB (wc -c REVIEW.md). Machine-checkable rules become hooks, lint or tests, not prose here.
Replace each {{...}} and delete this comment.
-->
# REVIEW.md

## What failure means here

- Docs and instructions (`AGENTS.md`, `CLAUDE.md`, `docs/`): claim what the tree does not do
  (unrunnable command, nonexistent path, rule disabled by change).
- Hooks, CI and configuration: let through or misroute (exit 0 with problem present; skipped test
  counts as green).
- Tests: cannot fail (assertion accepts right and wrong; fixture does code's work).
- {{One line per risk: high area: <area> → failure = <what user/owner sees>; proof = <test>.}}
- {{Decisions resembling defects but intentional (e.g. “administrator sees everything”), pointing to docs/decisions.md.}}

## Skip

{{Generated files, lockfiles, large fixtures, evidence folders}}: only confirm generator provenance.
Style and formatting are not findings: {{lint, formatter, hooks}} own them.

## Repeated findings

{{Class → what to seek → proof, from lessons; initially “(none yet)”.}}

## Process

Labels, proof, report format, rounds and ceiling: `agentic-code-review`. Model belongs to the user.

Lessons and evaluation cases: {{`docs/lessons.md`, or project file and format}}.
