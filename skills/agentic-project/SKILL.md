---
name: agentic-project
description: >-
  Sets up or resumes a new project, or prepares an existing repository for AI coding agents.
  Starts with a minimal bootstrap and adds architecture, parallel work, planning, a board or
  Spec Kit only when needed. Use for project bootstrap or agent setup; use agentic-feature
  for work inside an already prepared project.
---

# agentic-project

Leave the repository ready for the requested work: clear scope, applicable rules, exact commands
and evidence that the verification path works. Add only the setup modules that serve that work.
A small or existing repository normally needs **minimal bootstrap**, not a new project process.

`<skill>` is the folder containing this file. Run scripts by full path with the intended repo as
the working directory, or their documented `--dir <repo>`. Resolve sibling and third-party skills,
host capabilities and substitutes through `references/host-compatibility.md`; use
`$AGENTIC_PROJECT_DIR` first when locating this skill from another. Resolve other siblings only
when their module is selected. Tool availability is not authorization to publish or install.

The common resolver maps `<agentic-feature>` (`$AGENTIC_FEATURE_DIR`), `<agentic-design>`
(`$AGENTIC_DESIGN_DIR`), `<agentic-code-review>` (`$AGENTIC_CODE_REVIEW_DIR`) and
`<agentic-architecture>` (`$AGENTIC_ARCHITECTURE_DIR`). These are conditional dependencies,
not skills to load during every bootstrap.

## 1. Select scope and resume

In the first message, state the repository, **new** (empty/docs only) or **adopt** (code exists),
and the selected route/modules in one line, then inspect or act in the same turn. Do not ask
permission to start. Read existing `AGENTS.md`, `CLAUDE.md`, CONTRIBUTING, relevant docs, manifests,
CI and git status before proposing changes; project rules override this skill's defaults.
If the directory is ambiguous or contains unrelated projects, resolve the intended project
directory first (`references/phase-0.md`). Never initialize git in a home or multi-project folder.

Default to minimal bootstrap when the request is “prepare this repo for agents”, the project is
small, or the user supplied no need for wider setup. A request for a full project setup selects
the relevant modules below, not every artifact automatically. State the reason for additions.

| Module | Select when | Procedure and resulting artifacts |
|---|---|---|
| **Minimal bootstrap** | Default; always establish rules, commands and scope | `references/minimal-bootstrap.md`; concise `AGENTS.md` or a scoped update to existing instructions |
| **Architecture** | Starting a product with unresolved stack/boundary choices; a material architecture change; an explicit assessment | Phases 0–3; decisions, relevant prerequisites, `ARCHITECTURE.md`, qualifying ADRs and research notes as needed |
| **Parallel setup** | Multiple concurrent writers need ownership, worktrees and shared checks, or the user asks for this protocol | Phase 4; hooks, `.agentic/areas.json` and the applicable git protocol |
| **Spec Kit** | Requested, already adopted, or justified by work needing its full spec workflow | Phase 5; `.specify/` and project-local integrations/constitution |
| **Planning** | The user needs an initial backlog or an explicit team work process | Phases 2, 8 and 9 as needed; selected decisions/glossary, methodology and backlog |
| **Board** | Persistent multi-agent coordination or a visible tracker is useful and wanted | Phase 7; CLI state and Markdown view, or authorized publication |
| **Agent instructions** | After selected modules, if their commands/rules need an entry point | Phase 6; update `AGENTS.md`; add `CLAUDE.md` or `REVIEW.md` only where useful |

Modules are independent unless their procedure needs a specific input. Reuse an existing decision,
test command, tracker or constitution; do not enable another module merely to get its filename.
For example, parallel setup can derive checks from the actual repository without an architecture
rewrite; planning can use `docs/backlog.md` without installing the board CLI or Spec Kit.
Read only selected phase references. Unselected modules are **out of scope**, not incomplete.

**Resume safely.** Inspect artifacts relevant to the selected modules against their current
completion criteria. Preserve valid work and report only concrete gaps in those modules. Older
optional files do not force a full migration. Add missing evidence only when it matters now;
never rewrite accepted ADRs (`references/architecture.md` §6). Do not create empty artifacts,
future `(phase N)` pointers or a status document solely to make all phases appear complete.

## 2. Rules while preparing

- **Ask only material unknowns.** Infer scope and constraints from the request, code and docs.
  Ask about a missing decision only if its answer changes the work; one dependent question at
  a time, up to four independent ones if the tool allows. Give a recommendation and reason.
  Apply explicit delegation without asking again. Record lasting decisions in the project's
  existing decision location; create `docs/decisions.md` only when there is lasting content.
- **Adopt safely.** Preserve unrelated work and existing rules. Show a scoped diff for existing
  instructions, hooks or configuration; apply changes covered by the request or prior approval.
  Ask only for new scope or an action still requiring authorization, not for approval already
  given. Do not replace an existing workflow just to match these templates.
- **Exact commands and scope.** Discover the actual runtime, package manager, install/start/check
  commands, applicable directories and restricted areas. Record prerequisites and observed
  failures accurately. “Done” needs measured evidence (command + result); an unrun command is
  marked unverified with its blocker. Do not invent a required tool for an unselected module.
- **Scoped current research.** Research newly introduced or changed components, material unknown
  support/security/API currentness, or an explicit audit. Reuse evidence matching the version,
  target and decision when its validity still holds. Do not refresh the whole stack for agent
  setup or every feature. Follow `references/architecture-research.md` when this module needs
  research; never quote current versions, prices or support from memory.
- **Risk and UI.** Use the project's risk and design rules. UI changes follow `agentic-design`
  in the appropriate build, review, targeted-adjustment or variants mode; setup does not force
  variants for an unchanged UI. Install versioned UI checks only in the selected protocol.
- **Permissions.** Use existing session authorization and observed host capabilities. Do not
  infer a read-only `.git` from the host name, pre-request full sandbox access, or treat missing
  optional tools as blockers. `references/host-compatibility.md` defines blocked-action handling.
- **Privacy and boundaries.** Keep secrets out of code and chat; use variable names and the
  configured secret manager or local `.env`. Use synthetic personal data in prompts/fixtures.
  Production deployment, data deletion, payments, publishing, accounts, remote creation and DNS
  need the applicable explicit authorization; setup alone does not grant it.
- **Language and commits.** Follow the project's declared language, English otherwise. Commit
  one logical unit of authorized work with explicit paths (`git add <paths>`, never blind
  `git add -A`); no artificial commit per phase. Push according to project/session policy.
  Preserve unrelated staged files and obey existing commit gates.

## 3. Close the selected route

For minimal bootstrap, use its completion checklist and stop. For selected modules, check only
their applicable “Done when” clauses and links from the instructions. Every referenced path must
exist, or an uncreated command must be explicitly identified as unverified/planned. Sync a board
only if one is in use. Do not manufacture a backlog, glossary, radar, methodology, hooks or
constitution to close a smaller route.

Report what is ready, changed files, verified commands and any concrete blockers/owners. Include
a board link or next feature only if it exists. Preparing a repository is a complete result;
do not require a closing “shall I start the first feature?” question. If implementation was
already requested, continue through `agentic-feature` with the agreed scope; otherwise leave a
brief next-step recommendation without starting unrelated work.

## Optional phase references

Read the phase and its supporting reference only when its module is selected. Phase numbers are
stable reference names, not a mandatory sequence or progress quota.

| Procedure | Supporting material |
|---|---|
| [Minimal bootstrap](references/minimal-bootstrap.md) | [Agent instructions](references/agents-md.md), `assets/AGENTS.template.md` |
| [Phase 0 — Context and mode](references/phase-0.md) | `assets/decisions.template.md` when decisions need a file |
| [Phase 1 — Prerequisites](references/phase-1.md) | `references/prerequisites.md`; optional `scripts/check-environment.sh` for modules using this tooling |
| [Phase 2 — Project interview](references/phase-2.md) | `references/project-grill.md`; `references/skills-map.md` for third-party invocation |
| [Phase 3 — Architecture](references/phase-3.md) | `references/architecture.md`, `references/architecture-research.md`; `assets/radar.template.md` if a radar is useful |
| [Phase 4 — Git environment](references/phase-4.md) | `references/git-environment.md`; `scripts/prepare-repo.sh` (dry run, `--show <file>`, then authorized `--apply`; `--with-ui` when needed) |
| [Phase 5 — Spec Kit](references/phase-5.md) | `references/skills-map.md`; host-specific project integrations |
| [Phase 6 — Agent instructions](references/phase-6.md) | `references/agents-md.md`; optional `assets/CLAUDE.template.md` and `<agentic-code-review>/references/review-md.md` |
| [Phase 7 — Board](references/phase-7.md) | `references/board.md`, `assets/board/README.md`; `assets/board/artifact-sync.md` before authorized publication/sync |
| [Phase 8 — Methodology](references/phase-8.md) | `references/methodology.md`; create lessons only for a selected ongoing process |
| [Phase 9 — Backlog](references/phase-9.md) | `references/skills-map.md`; an existing tracker or `docs/backlog.md` is sufficient |

Third-party methods use the same resolver as siblings; read `references/skills-map.md` only when
invoking one. Missing web research is “not confirmed (no web)”, not fabricated evidence. Missing
delegation permits sequential work. Missing Artifact permits a CLI/Markdown view if a board is
selected; only the orchestrator with send capability publishes or syncs. Missing Spec Kit permits
the light spec path. These fallbacks do not select the corresponding module.
