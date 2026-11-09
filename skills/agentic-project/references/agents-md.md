# Agent instructions: `AGENTS.md` and optional `CLAUDE.md`

Keep the startup context bounded: essential instructions, exact commands and pointers loaded
when relevant. Read applicable repo instructions before acting; which files a host loads
automatically depends on that host's observed configuration.

## Principles

- **Single source:** prefer the existing project rule location. Where a Claude bridge is
  needed, `CLAUDE.md` imports `@AGENTS.md` and adds only host-specific details. Do not duplicate
  the same rules in both files or add a bridge that the current host does not need.
- **Budget ~4 KB** (`wc -c AGENTS.md`); up to ~5 KB for necessary project rules. Simple repos
  should need ~1–2 KB. The template's fixed text stays ≤ ~3,200 B, leaving room for real rules.
- **Trigger-based pointers:** move long or occasional procedures to docs with a condition:
  “before editing migrations, read `docs/migrations.md`”. Do not eagerly import every project
  doc; imports can cost the same context as copying the text.
- **Operational content:** scope, exact commands and working directories, relevant constraints
  and a short reason for hard rules. Do not duplicate a tree, functions or project history.
- **Truthful commands:** record command, result and prerequisites. Mark blocked/planned entries
  unverified; only successful applicable checks establish readiness. Reuse still-valid evidence
  for matching code, dependencies, configuration and environment.
- **One rule in one place:** link existing principles, decisions, process and review guidance.
  Essential prohibitions belong in the entry point; detailed rationale belongs in a doc.
- **Mechanical defenses:** use existing lint/tests/hooks when applicable. Do not install a new
  hook system or process merely to express a one-line instruction.

## Template sections: retain only what applies

1. **Mission:** purpose, who uses it and scope/non-goals in a few lines.
2. **Commands:** actual setup, local run and focused/full checks with required directories.
   A non-app repository may have no run command; no placeholder command is a requirement.
3. **Code map:** scope and ownership boundaries; trigger-based links to existing architecture,
   glossary or area map when useful. No compulsory `.agentic/areas.json` or constitution.
4. **Workflow:** existing branch/commit/review conventions, evidence expectations, how to ask a
   material question and the project's language (English by default). Parallel worktree
   instructions appear only with parallel setup; UI rules only for actual UI work.
5. **Hard rules:** project-specific safety and irreversible-action constraints with reasons.
6. **Where to record things:** existing decision or work tracker; add radar/lessons/board pointers
   only when those stores exist and matter.

`assets/AGENTS.template.md` is a menu, not a promised final shape. Remove unused rows, optional
blocks and placeholders before delivery. Never add `(phase N)` links to nonexistent artifacts.
Selecting minimal bootstrap means omitting unused process artifacts, not creating shorter ones.

## Optional `REVIEW.md`

Use when recurring project-specific risks need review guidance; small setup does not require it.
Use `<agentic-code-review>/assets/REVIEW.template.md` and
`<agentic-code-review>/references/review-md.md` for content, or
`<agentic-code-review>/references/learning.md` when evaluating the reviewer.

- Write what failure means from concrete product constraints, sensitive areas and actual lessons.
  Ask only if a new material product/risk commitment is unresolved; retain prior authorization
  or delegated judgment rather than requiring repeated approval.
- Keep it ~3 KB or less. Do not repeat `AGENTS.md` or mechanically enforced rules.
- Link it from `AGENTS.md` only after it exists.

## Adopt mode

Preserve existing `AGENTS.md`, `CLAUDE.md` and `REVIEW.md`. Inspect gaps relevant to this request,
show a focused diff and apply what the user already authorized. Existing rules take precedence.
Do not migrate or consolidate unrelated instruction files as a prerequisite to simple setup.

## Verification

- Check size, no unfilled `{{`, real linked paths and no future-phase markers.
- Verify the actual changed setup path and relevant repo command; show summarized results and
  any blocked command explicitly. Do not fabricate missing typecheck/test targets.
- Perform a cold reading check: can a fresh agent identify scope, run the relevant check and
  follow commit/review policy using this file and its triggered links? A small repo can be
  checked directly; independent subagent reading is useful when the protocol is complex.
- Commit the coherent setup change with explicit paths according to project policy. Do not
  manufacture phase commits or optional files to satisfy the checklist.
