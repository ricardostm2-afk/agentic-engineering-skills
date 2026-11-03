# Agent instructions: `AGENTS.md` and `CLAUDE.md` (phase 6)

Every agent (Codex, Claude, others) reads `AGENTS.md` at each session before doing anything.
Every line costs context in every session; useless lines dilute useful ones. Keep it short,
operational and written for agents.

## Principles

- **Single source**: `AGENTS.md` holds the rules. `CLAUDE.md` only imports `AGENTS.md`
  (`@AGENTS.md`) and adds Claude Code specifics. Two rule files diverge.
- **Budget ~4 KB** (`wc -c AGENTS.md`); up to ~5 KB if project rules require it, using pointers
  instead of text. Move overflow to a doc with a pointer: “before changing X, read `docs/Y.md`”.
  The pointer says **when** to read, not just where. The template leaves room for project
  rules: its fixed text (excluding the opening comment and `{{…}}`) stays ≤ ~3,200 B, measured
  by the skills repo test.
- **For agents, not humans**: actions, exact commands, locations, prohibitions and reasons.
  No project history, marketing or motivational prose.
- **Nothing a `grep` can discover**: do not list files or functions; say where to look.
- **Each hard rule has a one-line reason.** An agent understanding why can apply the rule to
  unforeseen cases; a rule without a reason gets bypassed at the first unusual case.
- **Tested commands**: every command in `AGENTS.md` ran in this session and works.
- **Mechanical rules become automatic checks** (hook, lint, test), not sentences. Keep rules
  needing judgment in `AGENTS.md`.
- **Each rule in one place.** Project principles live in the constitution; decision reasons
  in `docs/decisions.md`/ADRs; process in `docs/methodology.md`. `AGENTS.md` points to them
  (“before touching personal data, read constitution principle II”) instead of copying them.
  Exception: hard rules (what never happens) stay in `AGENTS.md` because agents must see them
  without opening anything else.

## Fixed sections (template in `assets/AGENTS.template.md`)

1. **Mission** — 2 lines: what the product does and for whom, and one line of non-goals (or a
   pointer to “Out of scope” in `docs/decisions.md`).
2. **Commands** — install, run locally, typecheck, lint, tests (all and by area), full
   verification, and what to do before push.
3. **Code map** — top-level folders → area (source: `.agentic/areas.json`), and pointers to
   `ARCHITECTURE.md`, `GLOSSARY.md`, ADRs, constitution.
4. **Workflow** — protocol: features enter through `agentic-feature`; code review uses
   `agentic-code-review`, reading `REVIEW.md`; `agent/<id>-<topic>` branches; one worktree per
   agent; area checks; merging into `main`; board updated at every transition and at least
   every 30 min while working; with UI, rules (`.agentic/ui-without-slop.md`), approved brand
   exceptions (`docs/decisions.md`) and no detector blockers on changed lines before review;
   human decisions only, with a recommendation; technology checked in dated primary sources
   before recommending. Pointer to `docs/methodology.md`. Replies and project documents use
   the language declared in `AGENTS.md`, or English by default.
5. **Hard rules** — what never happens and why (secrets, personal data, irreversible actions,
   `--no-verify`, force-push, editing applied migrations…).
6. **Where to record things** — board (CLI invocation), decisions (`docs/decisions.md`), ADRs,
   radar (`docs/radar.md`, created in phase 3), lessons (`docs/lessons.md`, created in phase 8).

In phase 6 include pointers to what phases 7–9 will create (board, `docs/methodology.md`,
`docs/lessons.md`, `docs/backlog.md`), marked `(phase N)`. This gives the file its final shape
without rewriting it three times; remove each marker when its phase creates the artifact,
and verify none remain at Closing.

## `REVIEW.md`

`agentic-code-review` reads it before every review: what failure means in this repo, paths to
skip, repeated findings; it does not choose the review process or AI model. Template:
`<agentic-code-review>/assets/REVIEW.template.md`; how to write it, keep it short and grow it:
`<agentic-code-review>/references/review-md.md`; how to evaluate the reviewer when it changes
(`docs/lessons.md` lines and clean cases): `<agentic-code-review>/references/learning.md`.

- **Who**: the agent writes it from decisions, `risk: high` areas and lessons; the human
  approves “What failure means here” because they own it.
- **Budget** ~3 KB. Do not repeat `AGENTS.md` or rules already checked by hooks, lint or tests.
- **Pointer** in `AGENTS.md` (Workflow): review uses `agentic-code-review`, reading `REVIEW.md`.

## Adopt mode

If `AGENTS.md`, `CLAUDE.md` or `REVIEW.md` exists, do not rewrite it. Read it, identify missing
sections and contradictions with decisions, and show the human a proposed diff. Preserve
project rules: they take precedence over this skill. If existing `CLAUDE.md` holds rules and
there is no `AGENTS.md`, propose moving rules to `AGENTS.md` and leaving only the import in
`CLAUDE.md`.

## Verification before closing the phase

- `wc -c AGENTS.md` ≤ ~4000 (up to ~5 KB if project rules require it, using pointers instead of
  text); `wc -c REVIEW.md` ≤ ~3000, no unfilled `{{`, and “What failure means here” approved by
  the human (or delegated, recorded in `docs/decisions.md`).
- Every Commands entry ran and passed (show summarized output). Mark commands depending on an
  approved decision not yet installed (a new project without code, a typecheck adopt mode
  decided to add) as `(to create in the first feature)` or `(to create: D-NNN)` so no agent
  takes them as verified.
- Every referenced path exists (`ls`), except `(phase N)` paths checked at Closing.
- Cold reading test: with subagent tools, give a subagent only `AGENTS.md` and ask “How do I
  run area X's tests?”, “What do I do before push?”, “Where do I record a decision?”. Without
  subagents, answer these yourself, citing the `AGENTS.md` line answering each (if you need
  the conversation or another file without a pointer, it failed). A failure means `AGENTS.md`
  is incomplete.
