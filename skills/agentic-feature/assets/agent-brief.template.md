<project job launcher header if required>

<!-- For orchestrator (delete when filling):
- Agent/subagent/job prompt: only lane values and pointers.
- Use launcher's required header/title. Fields already in header: “as in header”. Without header,
  remove first line.
- If project prepends common job rules, prompt is those rules plus this brief by pointer; do not copy.
- Fill every field; remove unused options. No placeholders, TBD or undecided choices.
- Without subagents do not ask for lanes/panels/verifiers: agentic-implement choosing-the-agent.md §4.
- Level labels exactly per choosing-the-agent.md §1, read by launch guard. Order uses human's
  words or none; use launcher's recorded-order mechanism when available.
- No UI: delete UI block. UI: states/widths in task table.
- Refactor Red test on base column: behavior-pinning command (agentic-implement tests.md Refactor).
-->

<lane title: “# Lane <letter or name> · <feature>”, or launcher format “## Task <n> — <name>”>

level: <well-defined — decisions closed: <which> | complex — <unknown cause|design that only shows in the code|steps not enumerable|already failed>: <detail> | <level> — forced by the human: <their words>>

human order: <exact words or none>

Load `agentic-implement` (Codex: `$agentic-implement`). Its process, limits and delivery apply.
Project rules: `<path/AGENTS.md or CLAUDE.md>` · launcher rules: `<path or none>` · area/review
standards: `<pointers or none>`.

Spec `<path/spec.md>` · plan `<path/plan.md>` · tasks `<path/tasks.md>` · batch
`<path/batch.md, this lane's group>`.

## Goal

<Verifiable sentence: new truth and this lane's role in whole.>

## Base and worktree

Worktree `<absolute path>` · branch `<branch>` · base `<full SHA>` · area `<id or no map>`.
Prepared: <available dependencies/artifacts> · missing startup: `<command or none>`.

## Files and paths

Authorized paths: <paths/globs>.
Agreed interface: <contract pointer or none>.

Before changing markup `git grep` selectors/names tests read. Confirm consumers/affected tests
before editing; required outside paths mean blocker to orchestrator.

## Behavior and proof

| Task | Seam (test entry) | Expected behavior | Red test on base |
|---|---|---|---|
| <id> | <route, function, screen> | <result and distinguishing data> | <file, failure and reason> |

Pilot-learned classes to prevent: <applicable classes/proof or not applicable>.

## Completion criterion

<Lane-specific verifiable conditions including real dependency connection when applicable.>

| Command | Expected output |
|---|---|
| <focused test> | <n tests, 0 failures> |
| <area typecheck/lint> | <exit 0> |

## Lane decisions

Approved research: <pointer and applicable decisions or none>.
Approved dependencies/capabilities: <names/versions or none>.
Specific limits: <pointers to applicable project sections>.

## UI

Load `agentic-design` (`<absolute path>`; Codex `$agentic-design`), “build” mode.
Design system: `<pointer>` · variant: `<choice.md and screenshots>`.
States/widths: <task table or pointer>.
Detector: `node <agentic-design>/scripts/detect-slop.mjs --diff <base-SHA>`.
Proof follows skill's build mode.

## Delivery

agentic-implement step 8 handoff with **Deviations from the brief**, **New data and who reads it**,
**Seen, not touched**.

## Board

Subagents/jobs write only CLI; only orchestrator sends to artifact.

Choose launch case, delete other. With no board, delete section.

**Launcher registers each job on board**: agent does not register; fill launcher-read lines:

item: <id>

**Otherwise** (subagent or non-registering launcher), register per README beside CLI:
CLI `<path or no board>` · item `<id>` · agent `<this-lane-id>`.
Transitions: README “When to update” (`agent heartbeat`, commits, end).
