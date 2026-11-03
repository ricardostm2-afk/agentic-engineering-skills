Phase 6 — Agent instructions

Read `references/agents-md.md`. If `mattpocock-skills:writing-for-agents` exists, invoke it.
Write `AGENTS.md` from `assets/AGENTS.template.md`, `CLAUDE.md` from `assets/CLAUDE.template.md`,
and `REVIEW.md` from `<agentic-code-review>/assets/REVIEW.template.md`, following
`<agentic-code-review>/references/review-md.md` (what failure means for each `risk: high` area,
labels, paths to skip; the human approves “What failure means here”). In adopt mode, show the
diff against existing files before writing; do not rewrite an existing `REVIEW.md`.

Create `AGENTS.md` with pointers to what phases 7–9 will create (board, methodology, lessons,
backlog), marked `(phase N)`; each phase removes its marker and Closing checks none remain.
Also include the template's UI rule (`ui-without-slop.md` + detector; only if there is UI, with
a pointer to phase 2's “UI exceptions” decision), radar (`docs/radar.md`), and “check dependency
APIs in the installed version's types or docs”.

Done when `wc -c AGENTS.md` ≤ ~4000 (up to ~5 KB if project rules require it, using doc pointers
instead of text), `wc -c REVIEW.md` ≤ ~3000 with no unfilled `{{`, the human has approved “What
failure means here” in `REVIEW.md` (or delegated it, recorded in `docs/decisions.md`), every
listed command has run successfully and every unmarked path exists. Mark commands depending
on something approved but not yet created (a new project's first code, a typecheck adopt mode
decided to add) as `(to create in the first feature)` or `(to create: D-NNN)` so no agent treats
them as verified.
