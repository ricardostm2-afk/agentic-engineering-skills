# agentic-skills

Eleven [Agent Skills](https://agentskills.io/specification) that give a coding agent a method: set a
project up for agents, deliver a feature, fix a defect, write the code with proof, review it with fresh
context, and keep the UI, the architecture and the CI honest. Built for Claude Code; they also load in
Codex, Cursor, Gemini CLI, GitHub Copilot and OpenCode.

- **Reusable.** Nothing in them is tied to one company or one machine: no fixed paths, no accounts, no
  product names. What is specific to your project is read from your project's own `AGENTS.md` and
  `REVIEW.md`, which the skills help you create.
- **Portable.** A Claude Code plugin, a Codex portable plugin (`plugin.json` plus `skills/`), an installer
  for macOS/Linux/WSL (`install.sh`), one for Windows (`install.ps1`), and plain folders for any other agent.
- **Free.** MIT licensed. The few pieces adapted from other open-source projects keep their licences
  and credits (see [CREDITS.md](CREDITS.md)).

> **Language.** The skills, prompts, templates and installers are in English. The text agents produce
> (specs, `AGENTS.md`, reports and pages) follows the language declared in the project's `AGENTS.md`,
> with English as the default.

## Try it in two minutes

In a Claude Code session (CLI, the Code tab of Claude Desktop or the VS Code extension):

~~~text
/plugin marketplace add ricardostm2-afk/agentic-engineering-skills
/plugin install agentic-skills@agentic-skills
~~~

Open a new session in any repository and start with something that only reads:

- "explain how the login works": `agentic-explain` asks three short questions (your goal, what you already
  know, how deep) and writes an HTML page with the explanation beside 3D views of the code;
- "review this branch": `agentic-code-review` reviews the branch against its base with independent
  lenses and reports each finding with `file:line`.

What the skills write (reports, specs, pages) follows your project's `AGENTS.md` language, with English
as the default. When you want to build: "set up this repo for agents"
(`agentic-project`), then "build this feature" (`agentic-feature`).

## What is inside

| Skill | What it does | Ask for it with | Origin |
|---|---|---|---|
| `agentic-project` | Prepares a project (new or existing) for agents working in parallel and safely. Ten phases: prerequisites checked, decisions recorded, architecture chosen with dated research, a git protocol for agents (short branches, one worktree per agent, hooks, an area map), Spec Kit, `AGENTS.md` and `CLAUDE.md`, a small scrum board, the first backlog and a `REVIEW.md` that says what counts as a failure in this project | "start a project: …", "prepare this repo for agents", "set up this repo for agents" | original |
| `agentic-feature` | Takes a feature from request to integration. Risk triage (Standard, Complete, Too big; fixes go to `agentic-fix`), reading the code, research on what is current, a grill on what only the human can decide, real UI variants through `agentic-design`, a spec, one brief per lane for Claude or Codex agents using `agentic-implement`, independent review through `agentic-code-review` and measured proof | "develop this feature …", "take the next backlog item", "build this feature" | original |
| `agentic-design` | Owns the UI method. Questions about the screen, 2–3 structurally different variants with screenshots, building inside the project's design system, blocking rules against the generic "AI look" (B1–B24) with a mechanical detector, and proof in the browser with an honest status. It carries no brand: looks come from each project's `DESIGN.md` | "make variants of this screen", "review the UI", "redesign this screen" | original; the interaction mechanisms in `references/mechanisms.md` are rewritten from [uiverse-io/galaxy](https://github.com/uiverse-io/galaxy) |
| `agentic-fix` | Fixes what exists and is wrong. One question only if the report is ambiguous, a red test that reproduces it, root-cause diagnosis, the whole class of the defect fixed, red then green, review with fresh context, and the defect that escaped becomes an evaluation case | "this is broken", "fix this" | original; the red-first diagnosis adapts part of [mattpocock/skills](https://github.com/mattpocock/skills) |
| `agentic-implement` | The skill of the agent that writes the code (Claude or Codex). From a closed brief to a commit: read only what is needed, state assumptions, failing test first, minimal change in the style of the surrounding code, green with evidence, one commit per cause, hand-off with a status line | "implement this brief"; also loaded by the briefs that `agentic-feature` and `agentic-fix` write | original; the test-first discipline adapts part of [mattpocock/skills](https://github.com/mattpocock/skills) |
| `agentic-code-review` | Reviews a diff, a branch or a PR, alone or called by `agentic-feature`. Level by risk, a panel of independent lenses in a throw-away worktree, consolidation, confirmation of the serious findings, a report whose first line is validated by a script, limited rounds, and lessons and evaluation cases to measure the reviewer | "review this branch", "code review" | original |
| `agentic-architecture` | Improves the architecture of code that already exists: shallow modules where the code changes most, with measured proof, a visual report, a grill on the chosen candidate and execution through `agentic-feature`. Carries the vocabulary of modules and seams the other skills use | "improve the architecture", "shallow modules", "improve the codebase architecture" | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `agentic-explain` | Explains code, or any other topic from sources it reads, at the level of whoever asks. Three calibration questions (the goal, familiarity with concepts found in the material, the depth), three profiles (functional with metaphors; intermediate with parts and a glossary; advanced with details, risks and sync or async calls), and one page with the explanation in a free 2D composition by default; use 3D only when depth carries meaning, while the fixed-frame template and three.js data path remain optional legacy mode. It only reads: in code, debugging goes to `agentic-fix`, changes to `agentic-architecture` or `agentic-feature` | "explain this", "how does X work" | original |
| `agentic-ci-audit` | Audits which regressions the CI checks really catch and which work can leave without losing that protection (test discovery, false greens, fixtures, caches, cost) | "audit the CI", "audit this test suite", "find why the tests are slow" | [morluto/rea](https://github.com/morluto/rea) |
| `agentic-tool-design` | Designs tools for agents and their contracts: identity, coverage, effects and lifecycle | "design this tool for agents" | [morluto/rea](https://github.com/morluto/rea) |
| `agentic-analysis-optimization` | Optimizes agent analysis pipelines with measured latency, CPU, memory, subprocess or context costs; suite cost belongs to `agentic-ci-audit` and tool contracts to `agentic-tool-design` | "optimize this analysis" | [morluto/rea](https://github.com/morluto/rea) |

These skills can be selected from a natural-language request; naming the skill is optional.
Choose by the main goal: `agentic-project` sets up a project; `agentic-feature` plans or changes
behavior; `agentic-fix` repairs it; `agentic-implement` executes a closed brief.
`agentic-design` handles visual work, `agentic-architecture` architectural friction, and
`agentic-code-review` reviews code changes. Suite and CI audits, including slow tests, enter
through `agentic-ci-audit`. Maintenance still needs an explicit human request, and selecting
a skill does not authorize external actions.

Rows with a link adapt material from another open-source project, in English: the whole skill, or for
`agentic-fix` and `agentic-implement` only the files that [UPSTREAMS.json](UPSTREAMS.json) lists, and for `agentic-design` only the
interaction mechanisms ([CREDITS.md](CREDITS.md)). Each one
keeps its own `references/origin.md` and licence file. Everything else is original to this repository.

## How they fit together

~~~mermaid
flowchart LR
  P[agentic-project<br/>set the repo up] --> F[agentic-feature<br/>deliver a feature]
  A[agentic-architecture<br/>improve the structure] -->|chosen design| F
  F -->|UI work| D[agentic-design]
  F -->|one brief per lane| I[agentic-implement<br/>the agent that writes code]
  X[agentic-fix<br/>a defect] --> I
  E[agentic-explain<br/>explain code or a topic] -->|a defect| X
  E -->|a change| F
  F -->|diff| R[agentic-code-review]
  X -->|diff| R
~~~

`agentic-ci-audit`, `agentic-tool-design` and `agentic-analysis-optimization` stand alone.

The skills find their siblings in the folder next to them (`../agentic-feature`, `../agentic-design`,
…), unless an environment variable points elsewhere (`AGENTIC_FEATURE_DIR`, `AGENTIC_DESIGN_DIR`,
`AGENTIC_FIX_DIR`, `AGENTIC_PROJECT_DIR`, `AGENTIC_IMPLEMENT_DIR`, `AGENTIC_CODE_REVIEW_DIR`, `AGENTIC_ARCHITECTURE_DIR`),
then in the agent's skill folders and in the installed plugin. That is why they work as a plugin, as
copies or as links.

## Install

Requirements: **git** and **Node.js >= 20** (the skills' scripts and the tests are Node). Optional:
the GitHub CLI (`gh`), `gitleaks` (the pre-commit hook skips secret scanning without it), and `uv` with
Spec Kit 1.2.0 (without it the skills use a lighter spec).
`bash skills/agentic-project/scripts/check-environment.sh` shows what is missing (exit 0 = the
essentials are there).

### Claude Code (recommended): plugin

Inside a Claude Code session (CLI, the Code tab of Claude Desktop, or the VS Code extension):

~~~text
/plugin marketplace add ricardostm2-afk/agentic-engineering-skills
/plugin install agentic-skills@agentic-skills
~~~

The repository is `ricardostm2-afk/agentic-engineering-skills`; the plugin and the marketplace inside it are both called
`agentic-skills`, hence the install id `agentic-skills@agentic-skills`. From a local clone no GitHub
marketplace is needed:

~~~bash
git clone https://github.com/ricardostm2-afk/agentic-engineering-skills.git agentic-skills
claude plugin marketplace add ./agentic-skills
claude plugin install agentic-skills@agentic-skills        # --scope project|local for another scope
~~~

The skills appear with a prefix, for example `/agentic-skills:agentic-project`. Open a new session after
installing. Use **one** method in Claude Code, the plugin or copies in `~/.claude/skills`: both at once
list every skill twice.

### macOS, Linux and WSL: `install.sh`

~~~bash
git clone https://github.com/ricardostm2-afk/agentic-engineering-skills.git ~/agentic-skills
cd ~/agentic-skills
./install.sh                     # dry run: shows what it would do, per agent
./install.sh --apply --link   # installs as links to the clone (update with git pull)
~~~

With the Claude Code plugin already installed, add `--agent codex` (or the agents you use): by default the
installer also installs into `~/.claude/skills` when that folder exists, and Claude Code would then list
every skill twice.

### Windows: `install.ps1`

~~~powershell
git clone https://github.com/ricardostm2-afk/agentic-engineering-skills.git $HOME\agentic-skills
cd $HOME\agentic-skills
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1            # dry run
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Apply -Link
~~~

Written to run in Windows PowerShell 5.1 and in PowerShell 7 (`pwsh`); it was verified on PowerShell 7 only.
With `-Link` it creates directory junctions, which do not need administrator rights. Inside WSL you can
use `install.sh` instead.

Both installers are a **dry run by default**; nothing changes until you add `--apply` (`-Apply`).

| `install.sh` | `install.ps1` | Effect |
|---|---|---|
| (none) | (none) | dry run; nothing changes |
| `--apply` | `-Apply` | install |
| `--agent claude\|codex\|codex-legacy\|cursor\|gemini\|copilot\|opencode\|all` | `-Agent …` | choose agents (repeatable or comma-separated). By default: the agents whose config folder exists (`~/.claude`, `~/.codex`, `~/.cursor`, `~/.gemini`, `~/.copilot`, `~/.config/opencode`). `codex-legacy` is opt-in and not part of `all` |
| `--project <repo>` | `-Project <repo>` | install into that repository's skill folders instead of the user's |
| `--link` | `-Link` | links to the clone instead of copies |
| `--force` | `-Force` | replace a skill that already exists; the previous one moves to `~/.agentic-skills-backups/<date>/` |
| `--agents` | `-Agents` | optional, Claude Code only: also copy the four agent definitions to `~/.claude/agents/` (`<repo>/.claude/agents/` with `--project`) and print an excerpt for your `CLAUDE.md`. It never overwrites a file that exists (not even with `--force`) and never edits your `CLAUDE.md`. See [Agents and models per task](#agents-and-models-per-task-optional) |

Where the skills go (the locations each agent documents, read in 2026-10):

| Agent | User scope | Project scope |
|---|---|---|
| Claude Code | `~/.claude/skills/` (or `$CLAUDE_CONFIG_DIR/skills/`) | `<repo>/.claude/skills/` |
| Codex, Cursor, Gemini CLI, Copilot, OpenCode | `~/.agents/skills/` (one shared folder, one install for all) | `<repo>/.agents/skills/` |
| Older Codex (`codex-legacy`) | `~/.codex/skills/` | not applicable |

Claude Code does not read `.agents/skills/` and Codex does not read `.claude/skills/`, hence two
destinations. Without `--force` the installer never overwrites: a different skill that is already there
(or a link when you ask for copies, and vice versa) stays as it is and `--apply` exits with code 1.
OpenCode, Cursor and Copilot in VS Code also read `~/.claude/skills/`: keep both folders at the same
version (`--force` in both, or `--link`).

### Other agents

**Codex.** User skills live in `~/.agents/skills` (repository skills in `.agents/skills`), per the
[Codex documentation](https://developers.openai.com/codex/skills). Use `install.sh --agent codex`, or copy
the eleven folders of `skills/` there. Invoke a skill with `$agentic-feature`. Codex versions that still read
`~/.codex/skills` can be served with `--agent codex-legacy`. `codex plugin marketplace add` and
`copilot plugin marketplace add` read `.claude-plugin/marketplace.json`; the install step after that was
not verified, so prefer the installer.

### `gh skill` (GitHub CLI >= 2.90, preview)

Discovers `skills/*/SKILL.md`. Without an interactive terminal the name of each skill is mandatory. An
install into `~/.agents/skills` serves Codex, Cursor, Gemini CLI, Copilot and OpenCode:

~~~bash
for skill in agentic-project agentic-feature agentic-fix agentic-implement agentic-design \
  agentic-code-review agentic-architecture agentic-explain agentic-ci-audit agentic-tool-design \
  agentic-analysis-optimization; do
  gh skill install ricardostm2-afk/agentic-engineering-skills "$skill" --dir ~/.agents/skills
done
~~~

For Claude Code use `--agent claude-code --scope user` instead of `--dir`. Avoid `--agent codex` (it writes
to the old `~/.codex/skills`, and next to `install.sh` you would have two copies). `gh skill` drops the
executable bit of the `.sh` files; the skills call them with `bash`, so they still work.

### Gemini CLI

~~~bash
for skill in agentic-project agentic-feature agentic-fix agentic-implement agentic-design \
  agentic-code-review agentic-architecture agentic-explain agentic-ci-audit agentic-tool-design \
  agentic-analysis-optimization; do
  gemini skills install https://github.com/ricardostm2-afk/agentic-engineering-skills.git --scope user --path "skills/$skill" --consent
done
~~~

### Universal installer `npx skills`

The `skills` package (vercel-labs/skills) installs from `owner/repo` into dozens of agents. Not tested
here, and it sends anonymous telemetry unless you set `DISABLE_TELEMETRY=1`:

~~~bash
npx skills add ricardostm2-afk/agentic-engineering-skills -g -s '*' -y -a claude-code -a codex -a cursor -a gemini-cli -a github-copilot -a opencode
~~~

### claude.ai on the web and Claude Desktop chat: not recommended

Upload works with one ZIP per skill, but the support article limits `description` to 200 characters (the
skills here have more) and the workflows need a local git repository, Node and a terminal that the chat
does not have.

## Using them

Ask for the work in plain words and the matching skill loads from its description; if one does not
trigger, name it: `/agentic-skills:agentic-feature` (plugin), `/agentic-feature` (copies in Claude
Code) or `$agentic-feature` (Codex). A first session usually looks like this:

1. In a repository, ask for `agentic-project` to prepare it. It asks the few questions only you can
   answer and writes `AGENTS.md`, `REVIEW.md` and the backlog.
2. Pick a backlog item and ask for `agentic-feature`. It stops at the grill and, for UI, at the variants;
   everything else it decides and records.
3. Something broken? Ask for `agentic-fix` with the report.
4. Want a second opinion on a branch? Ask for `agentic-code-review`.

Preferences every agent should follow (language, code and product-text tastes) have defaults in
`skills/agentic-implement/references/preferences.md`. Put yours in your project's `AGENTS.md`, which wins over the
skills: an edit to `preferences.md` only lasts in a clone or fork installed with `--link`, because a plugin update
or `--force` replaces it.

## Agents and models per task (optional)

Claude Code runs subagents. One you define in `~/.claude/agents` has a closed list of tools and starts
with less context than the built-in `general-purpose` one. This repository ships four, as plain files you
own and edit, in `skills/agentic-implement/assets/agents/`:

| Agent | For | Tools | Default |
|---|---|---|---|
| `implementer` | code and tests for one lane of a closed brief; loads `agentic-implement` | Read, Edit, Write, Bash, Grep, Glob | `sonnet`, `high` |
| `implementer-ui` | the same for a UI lane; also loads `agentic-design` | the same | `sonnet`, `high` |
| `researcher` | read-only research, inventory or diagnosis | Read, Grep, Glob, WebFetch, WebSearch, Bash | `sonnet`, `medium` |
| `reviewer` | read-only review with fresh context, working from the brief of `agentic-code-review` | Read, Grep, Glob, Bash | `sonnet`, `high` (verifier: `opus`, `medium`) |

The model and the effort in each file are a default for one task level, written next to a comment that
says so: change those two lines to what your provider offers. The levels (short, well-defined, complex)
and how to pick one are in `skills/agentic-implement/references/choosing-the-agent.md`. Beside the agents,
`claude-md-excerpt.md` is a short rule for your own `CLAUDE.md`: the strongest model orchestrates, each
agent gets the model and effort of its task's level, and agents are launched by their defined type and
not as `general-purpose`. It points to `choosing-the-agent.md` instead of repeating it. Everything in that
folder is in English; `README.md` there explains how to change the models and the tools.

The installers copy the agents only when you ask, and never edit your `CLAUDE.md`:

~~~bash
./install.sh --agent claude --agents            # dry run: lists the four files and prints the CLAUDE.md excerpt
./install.sh --apply --agent claude --agents  # copies them to ~/.claude/agents
~~~

(`-Agents` in `install.ps1`; `--project <repo>` copies to `<repo>/.claude/agents`.) A file that is already
there stays as it is, even with `--force`. The agents are always copied, never linked, because they are
yours to edit. The excerpt is printed for you to paste where you want it.

## A memory system for Claude Code (optional)

`memory/` holds a guide, `GUIDE.md`, and an empty folder to copy, `memory/template/`, for
Claude Code's auto memory: a short `MEMORY.md` index that loads in every session, one sub-index per
topic, and one fact per file with the frontmatter Claude Code uses (`name`, `description`,
`metadata.type`) and `[[links]]` between related memories. The guide says when a memory moves up to the
index or down to a sub-index, what must never go in (secrets, sensitive data, personal data), and how to keep
the folder in a private git repository and point Claude Code at it with `autoMemoryDirectory`, so the
same memory follows you to any PC. That setting applies to all the projects of your account: they share
one folder, and the guide warns about it before it explains the steps. No memory is included and nothing
installs the folder for you: copy `memory/template` when you want it.

## Limits

- **Opinionated and not light.** The process is built for work that deserves a spec, a test and a review.
  The skills define a short path for small changes, but for a one-line edit just ask the agent directly.
- **Language.** Agent output follows the project's `AGENTS.md`, defaulting to English. See the note above.
- **Claude Code first.** Questions, sub-agents, worktrees and the web research use Claude Code tools. In
  the other agents the skills fall back (questions in the chat, lanes in sequence, no web board); each
  `SKILL.md` has an "In other agents" section that lists the changes. The scrum board falls back to
  `docs/backlog.md` when the Artifact tool is not there.
- **Agents act.** The skills tell agents to run git, tests, scripts and to create worktrees. Everything is
  plain text: read it, and try it on a branch you can throw away first.
- **What was verified** (2026-10, macOS, Node 22, Claude Code 2.1): the test battery (`node --test`), the
  plugin manifests and the skills (`claude plugin validate`) and a secret scan (`gitleaks`). `install.ps1` was run under PowerShell 7 on
  macOS and not on a Windows machine; Linux was not run natively. Behaviour of the skills inside each
  agent depends on the agent's version.
- **Installing a skill installs no service.** No telemetry comes from these skills; the tools they call
  (`gh`, `npx`, the browser…) have their own.

## Optional skills from other authors (not included)

Skills from other authors that go well with these. They are not included: install them from their own
repositories and read their licences. `agentic-design` is aware of the first two and keeps the method when
they are present; the others are unrelated companions.

| Skill | For | Source | Licence |
|---|---|---|---|
| `impeccable` | design and critique workflows for UI (24 commands) | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Apache-2.0 |
| `apple-design` | motion, gesture and material principles for Apple-style web interfaces | [emilkowalski/skills](https://github.com/emilkowalski/skills) | MIT |
| `reverse-engineer-anything` | investigating and rebuilding the behaviour of a system | [morluto/rea](https://github.com/morluto/rea) | MIT |
| `voicestudio` | audio operations through a VoiceStudio backend | [debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio) | AGPL-3.0-only |

When several UI skills are installed, `agentic-design` owns the method and the others are used only for a
technique it does not cover.

## Test

From the root of a clone (Node >= 20):

~~~bash
node --test                       # every test: skills, installers, provenance (about 30 s)
claude plugin validate .          # plugin and marketplace manifests (Claude Code >= 2.1.233)
claude plugin validate skills     # the skills themselves
gitleaks dir .                    # secret scan
~~~

`node --test` must report `# fail 0`. `claude plugin validate skills` checks the skills' frontmatter with
Claude Code's own validator; `tests/skills.test.mjs` checks it too, and that every `references/…` and
`assets/….md` cited exists, also across skills.

## Update and uninstall

- Plugin: `claude plugin marketplace update agentic-skills` then `claude plugin update agentic-skills@agentic-skills`.
  The manifest has a `version`; bump it when you release, or installed copies will not update.
- Links made with `--link`: `git pull` and you are done. Copies: `git pull` and
  `./install.sh --apply --force` (the previous ones go to `~/.agentic-skills-backups/`).
- Uninstall: `claude plugin uninstall agentic-skills@agentic-skills`, or delete the eleven skill folders from
  the destinations above. The four agent files, if you copied them, are in `~/.claude/agents/`.

Open a new agent session after any change.

## Licence and credits

[MIT](LICENSE), Copyright (c) 2026 agentic-skills contributors. Ideas, adapted material and optional companions are credited in
[CREDITS.md](CREDITS.md); the licence texts that must travel with adapted material sit in each skill's
`licenses/` folder.
