Phase 6 — Agent instructions

Use after the selected modules to expose their actual rules and commands. Minimal bootstrap can
write the same small entry point directly. Read `references/agents-md.md`; third-party
`writing-for-agents` is optional and uses the common resolver.

Start from the existing instructions and `assets/AGENTS.template.md`, treated as a menu. Keep
only sections and pointers that apply. Add `CLAUDE.md` from `assets/CLAUDE.template.md` only when
the active host needs an import/bridge; avoid a second source of rules. Add `REVIEW.md` only
when project-specific risk or review guidance merits it, following
`<agentic-code-review>/references/review-md.md` and its template. Preserve existing review rules;
approval of new product/risk commitments can be explicit or already delegated.

For adoption, show a scoped diff and apply the changes already authorized. Do not rewrite
unrelated instructions or create pointers to future phases. Only link architecture, glossary,
ADRs, constitution, board, methodology, radar, lessons or versioned UI checks when they exist
and a trigger explains when to read them. Do not select other modules to satisfy a template.
Retain the operational rule to check dependency APIs in installed types or version-matched docs.

Done when `AGENTS.md` is concise (~1–2 KB for a simple repo, general target ≤ ~4000 bytes;
up to ~5 KB for necessary project rules), `REVIEW.md` if created is ≤ ~3000 bytes, there are no
unfilled `{{` placeholders or future-phase pointers, and every referenced path exists.
Commands must have actual results or be clearly marked unverified/planned with the blocker;
do not claim readiness for a path not yet runnable. A new project's future command can be
marked `(to create in the first feature)` or `(to create: D-NNN)`, never reported as verified.
