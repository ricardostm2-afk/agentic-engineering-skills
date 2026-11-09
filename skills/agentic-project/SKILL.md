---
name: agentic-project
description: >-
  Sets up or resumes a new project, or prepares an existing repository for AI coding agents:
  prerequisites, architecture, agent instructions and an initial backlog. Use for project bootstrap
  or agent setup; use agentic-feature for work inside an already prepared project.
---

# agentic-project

Host differences, installations, tool substitutes and sibling resolution follow
`<agentic-project>/references/host-compatibility.md`; find that sibling through
`$AGENTIC_PROJECT_DIR` first and read the reference when the host varies.

Goal: leave this session with the project ready for agents to work in parallel and safely —
prerequisites checked, decisions recorded, architecture chosen, a repo with an agent protocol,
Spec Kit, agent instructions, a published board and the first batch of features in the backlog.
Each phase leaves an artifact in the repo so another session (or another agent) can resume
without this conversation.

Paths under `scripts/`, `references/` and `assets/` are relative to this skill's folder, called
`<skill>` here (the folder containing this `SKILL.md`: for example
`~/.claude/skills/agentic-project/` in Claude Code, `~/.agents/skills/agentic-project/` in Codex,
or inside a plugin). Run scripts with the project repo as the current directory, so invoke
them by their full path (`bash <skill>/scripts/…`).

Resolve `<agentic-feature>` (`$AGENTIC_FEATURE_DIR`), `<agentic-design>` (`$AGENTIC_DESIGN_DIR`),
`<agentic-code-review>` (`$AGENTIC_CODE_REVIEW_DIR`) and `<agentic-architecture>` (`$AGENTIC_ARCHITECTURE_DIR`)
by the common reference's normative order. The reference confirms `SKILL.md`, rejects ambiguity and
explains invocation prefixes; this skill does not repeat the paths or silently choose an older copy.

The common reference also supplies the UI, review and architecture siblings and their host-specific
invocation prefixes; this skill keeps their methods and does not repeat their search order.

## Getting started: show the plan and resume existing work

1. The first message includes the plan on one line (0 context → 1 prerequisites → 2 interview →
   3 architecture → 4 git → 5 Spec Kit → 6 AGENTS.md → 7 board → 8 methodology → 9 backlog), the
   mode, and the first action or question **in the same turn**: do not ask permission to start
   (show the table below to anyone who asks). Repeat “Phase N/9: <name>” at the start of each
   phase so the human always knows where things stand.
2. If the repo already has artifacts from this skill (`docs/decisions.md`, `ARCHITECTURE.md`,
   `.agentic/areas.json`, `docs/radar.md`, `AGENTS.md`, `.specify/`), check each against its
   phase's **current** “Done when” (an earlier version of this skill may have created them:
   a stack ADR without the source table or `Review on`, a pre-commit without the UI detector,
   an `AGENTS.md` without radar or a UI rule). Show what is missing by phase and resume at the
   first incomplete phase. Do not redo completed work; complete the rest (supplement or
   supersede an accepted ADR, `references/architecture.md` §6; change an existing hook with
   a diff and approval).

| Phase | Name | Artifact in the repo |
|---|---|---|
| 0 | Context and mode (new/adopt) | Start `docs/decisions.md` (Context section) |
| 1 | Prerequisites | `docs/prerequisites.md` |
| 2 | Project interview | `docs/decisions.md` + `GLOSSARY.md` |
| 3 | Architecture | `ARCHITECTURE.md` + `docs/adr/` + `docs/radar.md` |
| 4 | Git environment for agents | hooks, `.gitignore`, `.agentic/areas.json` |
| 5 | Spec Kit + constitution | `.specify/memory/constitution.md` |
| 6 | Agent instructions | `AGENTS.md` + `CLAUDE.md` + `REVIEW.md` |
| 7 | Scrum board | `.agentic/board/` + published board (or `docs/backlog.md`) + `AGENTS.md` |
| 8 | Methodology | `docs/methodology.md` + `docs/lessons.md` |
| 9 | Initial backlog | 3–8 `backlog` items on the board (or `docs/backlog.md`) |

## Rules for every phase

**Questions for the human.** The human decides product, money and irreversible actions; you
find the facts. Therefore:
- Before asking, look for the answer in the supplied context, code and docs. Ask only what
  is not there.
- One question at a time when one depends on another. Each question includes concrete options,
  your **recommendation** and a one-line reason. Group up to 4 independent questions: in one
  AskUserQuestion call if available; otherwise number them in a single message.
- “You choose” or “follow the recommendations” is a valid answer to every pending question:
  apply your recommendations and record each as a **delegated decision** in `docs/decisions.md`
  (so the human can review them later without rereading the conversation).

**Defaults** (the human has already chosen these; apply them unless instructed otherwise,
and record any exception in `docs/decisions.md`):
- Trunk-based: `main` always ready for production, short branches (< 24 h), nothing left unpushed.
- Choose UI from 2–3 **real variants** (mockups or prototypes), never descriptions.
- UI without an AI aesthetic (pastel pills, cards inside cards, purple gradients, emoji icons,
  tiny text…): UI work follows `agentic-design`
  (`<agentic-design>/references/ui-without-slop.md`) and runs its detector,
  `<agentic-design>/scripts/detect-slop.mjs` (versioned copies in `.agentic/` in a project
  with UI), including at pre-commit. Block what the change adds or modifies; existing slop
  gets one report line, without going into the backlog (phases 2, 4 and 6).
- Current technology, never memory: phase 3 and every feature research current options using
  dated primary sources, recording what is learned in `docs/radar.md`.
- Effort scales with risk: changing text needs no spec; data, permissions and payments do.
- “Done” requires measured evidence (command + output), never a declaration.
- No irreversible or external action without explicit human approval: production deployment,
  deleting data, paying, publishing, creating accounts or a remote repository, changing DNS.
- Secrets never go into code or chat: the human puts them in a local `.env` or secret manager;
  you refer only to the variable name.
- Real personal data never goes into agent prompts or fixtures.
- Project documents follow the language declared in the project's `AGENTS.md`, or English
  when no language is declared.

**Third-party skills.** Some phases use skills by other authors. Before phase 2, read
`references/skills-map.md`: it explains how each is actually invoked (Skill tool, reading its
SKILL.md, or user-only `/name`) and what to do when it is not installed. Never say “I will
invoke /grill-me” — only the user can call those; read the method and apply it yourself.

**Adopt mode** (an existing repo with code): destroy or rewrite nothing. Phases 1, 3 and 4
become an audit (what exists, what is missing, proposal); show changes to existing `AGENTS.md`,
`CLAUDE.md`, hooks or configuration as a diff and apply them only with approval. Existing repo
rules (`AGENTS.md`, `CLAUDE.md`, CONTRIBUTING) apply from phase 0, including to your commits;
if one conflicts with a default, the repo rule prevails until the human decides in phase 2.

**Scale.** Effort scales with the project, as it does with features. For a small project (one
user type, no sensitive data or payments, or a repo of a few hundred lines), combine phases 1
and 2 in one interview (phase 1 questions go into the first round), cover only dimensions that
change something, and write ADRs only for decisions meeting all three conditions in
`references/architecture.md` §6 (there may be none). Phase 3 research also shrinks: 2 options,
the “short route” limits in `references/architecture-research.md`, no subagents, and a skeleton
only if the recommendation is new to the project or human. Keep every phase and artifact,
but shorter; tell the human in one line that you chose the short route.

**Commits.** At the end of each phase, commit only its files (`git add <paths>`, never blind
`git add -A`), explaining why in the message. Push when a remote exists; create a remote
(`gh repo create`, private by default) only with human approval.

## In other agents

This skill began in Claude Code; in another agent (Codex, Cursor, Gemini CLI, Copilot,
OpenCode…), the method stays the same and only the tool changes. When a tool below is missing,
use the replacement and tell the human in one line:
- **AskUserQuestion** → chat questions: up to 4 independent numbered questions in one message,
  each with 2–4 concrete options and your recommendation first (one-line reason); dependent
  questions one at a time.
- **Skill tool and plugins** (`mattpocock-skills:*`) → resolve any skill through the common
  compatibility reference; if the host has no such tool, read the found `SKILL.md` and apply its
  method or use the method summarized in `references/` (`skills-map.md`).
- **Agent, Workflow and subagents** → the agent's own subagents; without them, work sequentially
  yourself.
- **Artifact and ArtifactData** → follow “Without a board” in `references/board.md`: the board
  lives in `docs/backlog.md`, generated with `scrum.sh markdown > docs/backlog.md` and read as
  a page in the editor or git hosting (outside Artifact, `board.html` opens without data);
  regenerate at every transition and commit it at the end of each session. If the repo already
  has a published board, write only through the CLI: the next orchestrator with the artifact
  data tool sends it.
- **WebSearch/WebFetch** → the agent's web tool; without one, write “not confirmed (no web)”
  and leave the item pending in `docs/prerequisites.md`.
- **Spec Kit** (phase 5): always initialize with `--integration claude` (this skill's paths
  rely on `.claude/skills/speckit-*`); for agents reading `.agents/skills/` (Codex, Cursor,
  Gemini, Copilot, OpenCode), add `specify integration install codex`, as in phase 5.
- **Sandbox and git** (Codex with the default `workspace-write` sandbox): `.git` is read-only
  and `../` is outside the writable area, so `git commit`, `git worktree add ../…` and
  `git config` (phase 4's `core.hooksPath`) require approval and fail without it (`codex exec`,
  approvals disabled). In phase 1's authorization question, ask the human to approve git
  commands for the session or open it with full permissions (`codex --sandbox
  danger-full-access`, only with their approval). Otherwise every commit needs approval and
  lanes run sequentially on one branch (`<agentic-feature>/references/implementation.md` §4).
- **Permissions** (`.claude/settings.local.json`, `update-config`) → the agent's own approval
  mechanism; record the answer in `docs/decisions.md` as above.

## Operational phases

Each phase lives in its own reference so the core keeps startup, state, routing and resume short. Read the phase reference before executing it; it retains the artifact, rules, completion criteria, limits and proof command.

- [Phase 0 — Context and mode](references/phase-0.md)
- [Phase 1 — Prerequisites](references/phase-1.md)
- [Phase 2 — Project interview](references/phase-2.md)
- [Phase 3 — Architecture](references/phase-3.md)
- [Phase 4 — Git environment for agents](references/phase-4.md)
- [Phase 5 — Spec Kit + constitution](references/phase-5.md)
- [Phase 6 — Agent instructions](references/phase-6.md)
- [Phase 7 — Scrum board](references/phase-7.md)
- [Phase 8 — Methodology](references/phase-8.md)
- [Phase 9 — Initial backlog](references/phase-9.md)

The lesson-line format is `- <yyyy-mm-dd> · <area> · type: <escaped|repeated> · base <base-sha> · <defect-sha>→<fix-sha> · expected: <file:line> · class: <class> · layer: <should have caught it (escaped) or caught it (repeated)> · <what happened> → <defense>`.

## Phase 7 — Scrum board

The full procedure lives in [references/phase-7.md](references/phase-7.md). Only the orchestrator
sends to the artifact; subagents and jobs use CLI only, with a signal at least every 30 minutes.

## Closing

1. Check `AGENTS.md`: no unresolved `(phase N)` markers and every referenced path exists
   (`ls`). Sync the board one last time.
2. Commit the final artifacts; push if there is a remote (according to project policy).
3. Final human message, at most 10 lines: what is ready, board link, and the “Left for you”
   list (accounts, secrets, DNS, billing, delegated decisions to review; the same items marked
   “waiting for human” on the board).
4. End with ONE question, recommendation “yes”: “Shall I start `f01-<slug>` now?” If yes, invoke
   `agentic-feature` with the Skill tool (without it, read `<agentic-feature>/SKILL.md` and
   follow it), passing the item id (`f01-<slug>`) so it resumes that board item instead of
   creating another. If no, leave “Next step: invoke agentic-feature with `f01-<slug>`”, using
   the installed invocation: `/agentic-skills:agentic-feature f01-<slug>` in the Claude Code
   plugin, `/agentic-feature f01-<slug>` in a copy, `$agentic-feature f01-<slug>` in Codex.

## References: when to read each

| File | Read when |
|---|---|
| `references/prerequisites.md` | phase 1 |
| `references/project-grill.md` | phase 2 |
| `references/architecture.md` | phase 3 |
| `references/architecture-research.md` | phase 3 before proposing stack options; when reviewing a stack choice |
| `references/git-environment.md` | phase 4, or when an agent asks how to use branches/worktrees |
| `references/agents-md.md` | phase 6, or when reviewing an existing `AGENTS.md` |
| `references/board.md` | phase 7, when board sync fails, or when writing an agent brief (who syncs) |
| `assets/board/README.md` | phase 7 (CLI commands, configuration and selecting the Artifact branch) |
| `assets/board/artifact-sync.md` | Artifact/ArtifactData: before authorized publishing, seeding or syncing of the board |
| `references/methodology.md` | phase 8; also covers pitfalls of agent-written code |
| `references/skills-map.md` | before phase 2 and whenever invoking a third-party skill |
| `assets/decisions.template.md` | phase 0 |
| `assets/radar.template.md` | end of phase 3 to create `docs/radar.md` |
| `<agentic-design>/references/ui-without-slop.md` §1 and §6 only (another skill; §2's blockers are 19 KB the setup never needs) | phase 2 (UI dimension) and phase 6 (`AGENTS.md` UI rule) |
| `<agentic-architecture>/references/vocabulary.md` (another skill) | phase 3 (§4 of `references/architecture.md`: modules, interfaces and seams) |
| `<agentic-feature>/references/current-research.md` (another skill) | phase 3 (sources, rules, “modern, not fashion” filter) and phase 8 |
| `assets/AGENTS.template.md`, `assets/CLAUDE.template.md`, `<agentic-code-review>/assets/REVIEW.template.md` and `<agentic-code-review>/references/review-md.md` (another skill) | phase 6 |
| `scripts/check-environment.sh` | phase 1 (exit 0 = essentials OK; 1 = essential missing) |
| `scripts/prepare-repo.sh` | phase 4 (dry run by default; `--apply` to write; `--with-ui`; `--show <file>`) |
| `scripts/prepare-repo.test.mjs` | when changing `prepare-repo.sh` or its generated hook: `node --test <skill>/scripts/*.test.mjs` (unquoted: quoted globs require Node ≥ 21) |
