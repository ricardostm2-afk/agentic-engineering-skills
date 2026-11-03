<!-- agentic-project template: replace every {{...}}, remove what does not apply and this
comment. With UI (phase 4, --with-ui): {{ui-rules}} = `.agentic/ui-without-slop.md`, {{detector}} =
`.agentic/detect-slop.mjs`, {{D-ui}} = brand exceptions (phase 2). Without UI, remove the
“UI” line. -->
# AGENTS.md

## Mission
{{What the product does, for whom, in one sentence.}}
{{The strongest constraint, in one sentence (e.g. personal data stays in the chosen region).}}
Non-goals: {{one line, or “docs/decisions.md, Out of scope”}}.

## Commands
```bash
{{install}}             # dependencies
{{run}}                 # local app, synthetic data
{{typecheck}}           # types
{{lint}}                # style
{{area-tests}} <folder> # tests for the changed area
{{all-tests}}           # full verification: before merging into main
```
Hooks before push (`.githooks/`): fix the cause of failures.

## Code map
- Areas, folders, checks and risk: `.agentic/areas.json` (read before changing code).
- Architecture: `ARCHITECTURE.md`. Terms: `GLOSSARY.md` (use these names in code and tests).
- Decisions: `docs/decisions.md`; hard to reverse: `docs/adr/`. Principles (read before deciding
  what they cover; do not copy them): `.specify/memory/constitution.md`.

## Workflow
- Replies and project documents follow {{language declared here; English by default}}.
- Features: skill `agentic-feature`; review: `agentic-code-review` (read `REVIEW.md`).
  Process and “done”: `docs/methodology.md`.
- Branch `agent/<id>-<topic>` (< 24 h), own worktree (never two agents in one tree):
  `git worktree add ../{{repo}}-<agent> -b agent/<id>-<topic> main`.
- TDD: red test first, then green. Only files from your brief.
- Dependency APIs: check installed types or version-matched docs.
- Unclear scope: choose smaller; record it on the board.
- Ask only about human decisions (product, money, irreversible actions): one per question,
  with options and a recommendation.
- Technology: check version/status in a dated primary source before recommending
  (`docs/radar.md` first).
- Merge into `main` only with green checks; the orchestrator pushes at the end.
- UI: follow `{{ui-rules}}` (exceptions: `docs/decisions.md` {{D-ui}}). Before review,
  `node {{detector}} --diff <starting commit>` with no blockers on changed lines (fix or
  `slop-ok: <reason>`); existing ones get one report line.

## Hard rules
- No secrets in code, logs or chat: variable names only (`.env` outside git).
- No real personal data in prompts, fixtures or logs: use synthetic data.
- Without explicit human approval: no production deployment, deleting data, paying, publishing,
  creating accounts or changing DNS. These actions are irreversible or external.
- No `--no-verify`, `git push --force` on shared branches, or blind `git add -A`: the first hides
  errors, the second deletes others' work, the third includes others' files.
- Never edit applied migrations: create a new one.
- “Done”: executed command + output.
{{Project-specific rules, each with a reason.}}

## Where to record things
- Board: {{URL, or “docs/backlog.md” without a published board (`scrum.sh markdown > docs/backlog.md`
  at every transition and in the session's final commit)}}. CLI `.agentic/board/scrum.sh` (`help`;
  commands and 4 “Sync” steps: folder README). All agents record via CLI and run
  `scrum.sh agent heartbeat` at each transition and at least every 30 min while working.
  Only the orchestrator (session with artifact data tool) sends to the artifact; subagents,
  workflow agents and jobs use CLI only. Orchestrator also runs “Sync” at that cadence
  (step 1 reads `new-requests`; `url` = this URL; deferred: ToolSearch `select:ArtifactData`).
  Without the tool, use CLI; next orchestrator with it sends pending data. Never schedule sync.
- Lasting decisions: `docs/decisions.md` or ADR.
- Technology used, tested or rejected: `docs/radar.md` (at delivery).
- Lesson: `docs/lessons.md` (format in the heading); if mechanical, make it a hook, lint or test.
