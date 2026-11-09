Phase 7 — Scrum board

Only when **Board** is selected. An initial backlog alone does not require this module or CLI.
Reuse an existing tracker where it serves the requested coordination. Publication requires the
applicable authorization; local CLI/Markdown setup does not imply permission to publish.

Read `references/board.md` and follow it: copy the CLI, hook, page and tests into `.agentic/board/`
(green tests), write `config.json` only with what the project has, and when authorized publish the page
(`assets/board/board.html`, exact capabilities in `assets/board/artifact-sync.md`), seed, send and read back, and write
instructions in `AGENTS.md`: every agent records transitions and a heartbeat through the CLI,
at every transition and at least every 30 minutes while working. Only the orchestrator, the
session with the artifact data tool, sends to the artifact. Subagents, workflow agents and jobs
write only through the CLI. The orchestrator follows the 4 sync steps at that cadence, with
the `new-requests` inbox in step 1. Never use a scheduled task for sync.
Without a published board (Artifact tool or `assets/board/` missing, or the human declines),
follow “Without a board” in the reference: the CLI records state and `docs/backlog.md` is the
view (`scrum.sh markdown`).

Done when: with a board, the human has the link and a seeded item has been read back from the
artifact (`state/items`) before running the `sync-plan`'s `confirm`; without a board,
`AGENTS.md` says where the backlog lives and how to record every transition, and the CLI
(if installed) responds to `scrum.sh show items`.
