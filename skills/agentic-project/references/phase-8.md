Phase 8 — Methodology

Read `references/methodology.md` and `references/skills-map.md`. Write `docs/methodology.md`
adapted to the project: work cycle (current research at the start of each feature, slop
detector during UI review, radar at delivery before the final commit), roles, WIP limit,
definition of done, cadence, pitfalls, and the “when → skill → how to invoke it” table with
only skills installed here. Do not repeat rules: link to the constitution and `AGENTS.md`.
Create `docs/lessons.md` (heading and one-line format only) for retrospective lessons.
Format:
`- <yyyy-mm-dd> · <area> · type: <escaped|repeated> · base <base-sha> · <defect-sha>→<fix-sha> · expected: <file:line> · class: <class> · layer: <should have caught it (escaped) or caught it (repeated)> · <what happened> → <defense>`
agentic-feature writes a `type: escaped` line when something escaped (reverted, incident,
human report; `expected` is the `file:line` where the reviewer should have flagged it) and a
`type: repeated` line when the same class appears a second time in review (`expected` is the
finding's line). Only `type: escaped` lines raise the triage route. These lines are the
reviewer's evaluation set (`<agentic-code-review>/references/learning.md`).

Done when `AGENTS.md` points to `docs/methodology.md` and the file does not contradict decisions.
