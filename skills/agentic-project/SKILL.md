---
name: agentic-project
description: Use whenever the user wants to start, bootstrap, set up or prepare a project or repository for AI agents, even without saying “agentic” — “new project”, “start a project”, “I want to start an app”, “build this from scratch”, “prepare the repo for agents”, “create the agent environment”, “prepare the agent setup”, “resume project setup”, “bootstrap a new app”, “set up this repo for agents”, “set up the agent environment”. In one session, take a new or existing project from prerequisites, interview and architecture to a repo with an agent protocol (worktrees, hooks, areas), Spec Kit, AGENTS.md/CLAUDE.md, a scrum board and an initial backlog. To develop a feature in a prepared project, use agentic-feature.
---

# agentic-project

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

The sibling skill `agentic-feature`, called `<agentic-feature>` here, is the first of these
folders containing `SKILL.md`:
1. `$AGENTIC_FEATURE_DIR`, if set;
2. the adjacent folder, `<skill>/../agentic-feature` (the normal case: both are installed
   together, including in the plugin);
3. agent skill folders: `$CLAUDE_CONFIG_DIR/skills/`, `~/.claude/skills/`,
   `~/.agents/skills/`, `~/.codex/skills/`, `~/.config/agents/skills/`, `~/.cursor/skills/`,
   `~/.gemini/skills/`, `~/.copilot/skills/`, `~/.config/opencode/skills/`, and project folders
   `.claude/skills/` and `.agents/skills/` (or another skill folder used by the agent);
4. the Claude Code `agentic-skills` plugin: `<installPath>/skills/agentic-feature`, using the
   `installPath` of `agentic-skills@agentic-skills` in `~/.claude/plugins/installed_plugins.json`
   (the installed version; other cache folders may contain older versions).

Find the sibling `agentic-design`, called `<agentic-design>` here, in the same order, with
`$AGENTIC_DESIGN_DIR` first; it owns the UI method and supplies the rules (`ui-without-slop.md`)
and the AI aesthetic detector that phase 4 copies into `.agentic/`. The scripts already search
these locations; pass `AGENTIC_DESIGN_DIR` only if you found it elsewhere. Find the sibling
`agentic-code-review`, called `<agentic-code-review>`, in the same order, with
`$AGENTIC_CODE_REVIEW_DIR` first; it handles code review (agentic-feature calls it at step 6)
and supplies the `REVIEW.md` template. Find the sibling `agentic-architecture`, called
`<agentic-architecture>`, in the same order, with `$AGENTIC_ARCHITECTURE_DIR` first; it improves
existing code architecture and supplies the vocabulary of modules and seams. Installed as a
Claude Code plugin, these siblings are named `agentic-skills:agentic-feature`,
`agentic-skills:agentic-design`, `agentic-skills:agentic-code-review` and
`agentic-skills:agentic-architecture` in the Skill tool.

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
- **Skill tool and plugins** (`mattpocock-skills:*`) → if the skill is installed in this agent
  (look for `<name>/SKILL.md` in the agent skill folders in point 3 above and in
  `~/.claude/plugins/cache`), read its SKILL.md and apply its method; otherwise use the method
  summarized in `references/` (`skills-map.md`).
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

## Phase 0 — Context and mode

0. Decide **where** the project belongs before inspecting its contents. The current folder is
   suitable only if it clearly belongs to this project. If it is the home folder, a folder
   holding several projects (`~/projects`, `~/code`…), another product's repo, or the request
   is for a new project and the folder already contains unrelated code, ask ONE question with
   a recommendation: “create it in `<parent-folder>/<slug>`?” After the answer,
   `mkdir -p <folder>` (reversible) and use it as `<repo>` in every command (`git -C <repo>`,
   `--dir <repo>` in scripts). Never `git init` in `$HOME` or in a folder containing other
   repos. Explain in one line that the new repo's `CLAUDE.md` loads only in a session opened
   there; this session keeps using full paths.
1. Read the human's context (skill arguments, message, referenced files). If none was supplied,
   ask a single open question: “Describe the project in 2–3 sentences: what, for whom, and what
   already exists.”
2. Inspect the folder: `git status`, `git log --oneline -5`, top-level tree, `README*`,
   `AGENTS.md`, `CLAUDE.md`, `.specify/`, `.agentic/`, stack manifests (`package.json`,
   `pyproject.toml`, `go.mod`, `Cargo.toml`…), `docs/`, existing CI.
3. Choose the mode: **new** (empty folder or docs only) or **adopt** (code exists). Say which
   and why in one line. If the folder is not yet a git repo and `git` exists, run
   `git init -b main` now: reversible, and allows a commit per phase from the start.
4. Create `docs/decisions.md` from `assets/decisions.template.md` (or, in adopt mode, add the
   Context section to the existing decision file) with: what the project is, mode, detected
   stack, what already exists.

Done when the mode is decided and the Context section is written.

## Phase 1 — Prerequisites

1. Run `bash <skill>/scripts/check-environment.sh`. Show the table. If anything is missing,
   propose installation commands and run them only with approval (installation changes the
   human's machine). Exit 1 = an essential tool is missing (`git` or `node>=20`): resolve this
   before continuing. Missing recommended tools do not block; each phase provides a fallback.
   Exception: in a project with UI, missing `agentic-design` is a pending item with an owner
   (without it there are no UI rules or detector).
   In the same question, propose all authorizations together (format and file in
   `references/prerequisites.md` §6): web research (`WebSearch` and `WebFetch` in
   `.claude/settings.local.json`, outside git; using `update-config` if available), because
   phase and feature research always runs and otherwise every page needs authorization;
   dependency downloads for the phase 3 skeleton, which runs third-party code; and git commands
   for an agent whose sandbox makes `.git` read-only (Codex: “In other agents”, Sandbox and
   git). Only with approval; record the answer in `docs/decisions.md`. Without approval or
   network access, phases continue with “not confirmed” and the item stays pending.
2. Read `references/prerequisites.md` and work through its checklist. Answer anything already
   covered by the context yourself; ask the human the rest in order of impact.
3. Write `docs/prerequisites.md`: a table of item → status (ok / pending / n/a) → owner → note,
   and an “Only the human can do this” list (accounts, secrets, DNS, billing). Record each
   decision here (audience, region, cost ceiling…) immediately in `docs/decisions.md` using
   the template format; phase 2 does not ask it again.

Done when every item has a status and every pending item has an owner.

## Phase 2 — Project interview

Read `references/project-grill.md` (question bank by dimension, order and stopping criterion).
If `mattpocock-skills:grilling` is available, invoke it with the Skill tool and supply phase 0's
context; keep the question rules above (the reference explains how boundary rounds and up to
4 questions per call fit together). For domain vocabulary, invoke
`mattpocock-skills:domain-modeling` (or apply the method in the reference).

Output: `docs/decisions.md` with each decision (who decided, why, reversible?) and the “Out of
scope” list; `GLOSSARY.md` with domain terms (no implementation details).

Done when every reference dimension is answered, delegated or out of scope, and no open question
changes the architecture.

## Phase 3 — Architecture

Read `references/architecture.md` and `references/architecture-research.md`. Before proposing,
find the current state of each category and research every option on the web using dated
primary sources (stable version and support, sourced cost, agent suitability measured in a
skeleton when cheap), within that file's limits; never quote versions or prices from memory,
and human decisions on constraints take precedence over research. Propose 2–3 options with
monthly cost (confirmed or marked “estimate”), operating effort, vendor lock-in, agent
suitability and a recommendation. The human chooses (or delegates). In adopt mode, or when
phase 2 already chose the stack, do not offer options from scratch: audit the existing
architecture (“Adopt mode” in `references/architecture.md`) and research each component's
version and support (“Adopt mode and an already chosen stack” in
`references/architecture-research.md`). Highlight decisions that are hard to reverse; write
ADRs only for those meeting all three conditions in the reference (§6); record others in
`docs/decisions.md`.

Output: a short `ARCHITECTURE.md` (modules, data flows, area map, where checks run) + the stack
decision with the research table (`docs/adr/NNNN-*.md`, or `docs/decisions.md` when there is no
ADR) + initial `docs/radar.md` from `assets/radar.template.md` (targets; phase decisions in
Adopt with who decided; promising options in Assess; Avoid only for failures of a mandatory
criterion).

Done when the option is chosen, every planned code folder has an area and a check, and
`docs/radar.md` has targets filled in and a source and date for each entry (or “not confirmed
(no network)”, with a pending item in `docs/prerequisites.md`).

## Phase 4 — Git environment for agents

Read `references/git-environment.md` (protocol: short branches, one worktree per agent, commit
rules, hooks, area map).

1. `bash <skill>/scripts/prepare-repo.sh --dir <repo>` (dry run; add `--with-ui` for a project
   with UI). Show what it would do.
2. `bash <skill>/scripts/prepare-repo.sh --apply --dir <repo>` (with `--with-ui` when there is UI:
   version `.agentic/detect-slop.mjs` and `.agentic/ui-without-slop.md`, without asking). The
   script never overwrites; every “warning” is a pending item and the phase cannot close with
   unresolved items. In adopt mode, treat every “exists, kept” and “warning” as an audit item:
   `--show pre-commit` prints the current hook for the diff you propose.
3. Fill in `.agentic/areas.json` using phase 3's map (`risk`: `high`, `medium` or `low`). In a
   repo with code, adjust hooks to the project's real fast commands; in a new project there
   is nothing to adjust: hooks already call `typecheck`/`lint`/`test` when available and the
   first feature creates them. A local-hooks warning for `.git/hooks` waits for human approval
   before setting `core.hooksPath`.
4. Prove hooks work: a test commit expected to fail does fail, the corrected one passes, and
   likewise for pre-push (how to prove this before code exists: “Phase proof” in
   `references/git-environment.md`). If there is UI, also prove the pre-commit slop detector on
   staged UI files: `.css` with `font-size: 10px` blocks, clean CSS passes, and changing another
   line in a file that already had `10px` passes (reported as `Pre-existing`). Show the outputs.

Done when hooks are active and proven and the script leaves no unresolved pending items.

## Phase 5 — Spec Kit + constitution

1. `git status` must be clean (the next step rewrites files; you need to see the diff).
2. `specify init --here --force --non-interactive --integration claude`. Creates `.specify/`
   and `speckit-*` skills in `.claude/skills/`. If another agent reading `.agents/skills/` will
   work in the repo (Codex, Cursor, Gemini, Copilot, OpenCode; including this session if it is
   not Claude Code), add `specify integration install codex`: creates
   `.agents/skills/speckit-*`, keeping Claude as the default integration (`specify integration
   status` confirms).
3. `git status` and `git diff`: restore (`git checkout -- <file>`) any existing project file
   changed by init (e.g. `.claude/settings.json`). Delete `speckit-taskstoissues/` in
   `.claude/skills/` and, if present, `.agents/skills/` (discontinued; prevents agents using it);
   the manifest in `.specify/integrations/` still lists it, so another `specify init` or upgrade
   recreates it and you must delete it again. Commit `.specify/` and the `speckit-*` skills in
   each folder (`.claude/skills/` and `.agents/skills/`): every agent cloning the repo finds its
   own. Init suggests ignoring `.claude/` because of local credentials: ignore only
   `.claude/settings.local.json` (phase 4's base `.gitignore` already does; add it to an older
   `.gitignore`); commit the skills.
4. Apply `speckit-constitution` with **this** project's principles from `docs/decisions.md` and
   `ARCHITECTURE.md` (e.g. “customer data stays in the chosen region”, “every new route has an
   authorization test”), never generic ones. Invoke it through the Skill tool only if the
   session started in this repo's root and it already existed; otherwise read **this repo's**
   `.claude/skills/speckit-constitution/SKILL.md` (or
   `.agents/skills/speckit-constitution/SKILL.md`) and follow it (the session's listed
   `speckit-*` skills may belong to another repo).

If init exits ≠ 0 (`specify` differs from the tested 1.2.0, changed flags): `git status`, restore
files changed by init (`git checkout -- <files>`), delete only what it created (untracked files
shown by `git status` that did not exist before), record the failure in `docs/decisions.md` and
follow “without `specify`” below; `check-environment.sh` shows how to install 1.2.0.

Without `specify` (and the human does not want to install it): skip init, write the principles
in a “Principles” section in `docs/decisions.md` and record that agentic-feature will use the
light spec.

Done when the constitution (or Principles section) exists with no unfilled placeholders.

## Phase 6 — Agent instructions

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

## Phase 7 — Scrum board

Read `references/board.md` and follow it: copy the CLI, hook, page and tests into `.agentic/board/`
(green tests), write `config.json` only with what the project has, publish the page
(`assets/board/board.html`, exact README capabilities), seed, send and read back, and write
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

## Phase 8 — Methodology

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

## Phase 9 — Initial backlog

1. Read `to-tickets`' vertical slicing method (find the installed version in the cache:
   `find ~/.claude/plugins/cache -path '*mattpocock*/to-tickets/SKILL.md' | sort | tail -1`;
   without a result, search `~/.claude/plugins`); do not invoke it, only the user can. Use its
   method (slices, blockers, human question), not its publication format: items go into the
   board or `docs/backlog.md`, not `.scratch/` files. Without the plugin, apply: each slice
   crosses every layer (data → logic → interface → tests), can be demonstrated alone and fits
   in one session.
2. Split the MVP into 3–8 features. Each has a title, user outcome, blocked by, and verifiable
   acceptance criterion (command or observable step). In a new project the first is almost
   always the walking skeleton: a minimal end-to-end app running locally with one command,
   one test, typecheck and green hooks — giving subsequent agents a real verification loop.
   In adopt mode the app already runs: start with what is missing from verification (commands
   marked “to create” in phase 6) or the prefactor that makes the next features easy.
3. Show the human the list in one question: “Are the granularity and order right?” (recommend
   yours). Adjust.
4. Write each feature as a `backlog` item using the CLI (`scrum.sh item add --id f01-<slug>
   --title "<title>" --criterion "<verifiable acceptance>" [--depends f00-…]`), sync the board,
   and regenerate `docs/backlog.md` (`scrum.sh markdown > docs/backlog.md`) if that is the view.
   Without a CLI, write `docs/backlog.md` manually.
5. Record phases 8 and 9 on the board like the earlier phases (`scrum.sh item add --id setup-p8
   --title "Methodology" --status integrated`, likewise `setup-p9`).

Done when items are on the board (or in `docs/backlog.md`) and `scrum.sh show items` shows them.

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
| `assets/board/README.md` | phase 7 (CLI commands, configuration, capabilities, seeding, the 4 “Sync” steps with `sync-plan`) |
| `references/methodology.md` | phase 8; also covers pitfalls of agent-written code |
| `references/skills-map.md` | before phase 2 and whenever invoking a third-party skill |
| `assets/decisions.template.md` | phase 0 |
| `assets/radar.template.md` | end of phase 3 to create `docs/radar.md` |
| `<agentic-design>/references/ui-without-slop.md` (another skill) | phase 2 (UI dimension) and phase 6 (`AGENTS.md` UI rule) |
| `<agentic-architecture>/references/vocabulary.md` (another skill) | phase 3 (§4 of `references/architecture.md`: modules, interfaces and seams) |
| `<agentic-feature>/references/current-research.md` (another skill) | phase 3 (sources, rules, “modern, not fashion” filter) and phase 8 |
| `assets/AGENTS.template.md`, `assets/CLAUDE.template.md`, `<agentic-code-review>/assets/REVIEW.template.md` and `<agentic-code-review>/references/review-md.md` (another skill) | phase 6 |
| `scripts/check-environment.sh` | phase 1 (exit 0 = essentials OK; 1 = essential missing) |
| `scripts/prepare-repo.sh` | phase 4 (dry run by default; `--apply` to write; `--with-ui`; `--show <file>`) |
| `scripts/prepare-repo.test.mjs` | when changing `prepare-repo.sh` or its generated hook: `node --test <skill>/scripts/*.test.mjs` (unquoted: quoted globs require Node ≥ 21) |
