# Too big: split into slices (step 0)

Too big builds nothing: split request into vertical slices, each reentering `agentic-feature`
as a new feature with its own triage. Examples: “customer portal”, “import everything from old system”.

1. **Evidence for decomposition**: use the request, existing product/code and applicable project
   research first. Only a material unknown, currentness claim or explicit research request triggers
   feature-axis research under `references/current-research.md`'s Standard ceiling. Save findings
   in `docs/research/<slug>-<yyyy-mm-dd>.md` when needed; otherwise cite local evidence. Technical
   research follows per slice and only for unresolved questions.
2. **Vertical slices**: each crosses all layers, demonstrates alone. Vague destination: `wayfinder`;
   clear: `to-tickets`. Both from `mattpocock-skills`, user-invoked only: read installed SKILL.md
   (`find ~/.claude/plugins/cache -path '*mattpocock*/<name>/SKILL.md' | sort | tail -1`) and apply,
   or suggest human invokes `/<name>`. Every slice cites the applicable evidence from point 1.
3. **Stop**: show slices (this track's checkpoint 1), add to board as `backlog`, propose starting
   first with `agentic-feature` and id (`/agentic-skills:agentic-feature <id>` in Claude Code plugin,
   `/agentic-feature <id>` in copied skill, `$agentic-feature <id>` in Codex).

Done when slices are board backlog, any new research committed, human has first-slice proposal.
