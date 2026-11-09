# Skills map: when → skill → how to invoke it

Read before invoking third-party skills. Confusing these three invocation methods makes an
agent promise actions it cannot perform:

- **Skill** — the model invokes it with the Skill tool using its qualified name.
- **Read** — only the user can invoke it (`disable-model-invocation: true`). The agent reads
  SKILL.md and applies the method, or suggests the human type `/name`. Never say “I will invoke
  /name” for these. Resolve the selected installation through `host-compatibility.md`, the
  same resolver used for sibling skills. Verify the name and host registration; do not scan
  caches for a lexically newest version or use a marketplace catalogue as the installed skill.
- **Project** — Spec Kit skills created in `.claude/skills/` by `specify init` (and in
  `.agents/skills/` by the `codex` integration, phase 5). Invoke through Skill only when the
  session started in this repo's root and they already existed. Otherwise read **this repo's**
  host-specific integration's `<name>/SKILL.md` (`.claude/skills/` for Claude Code,
  `.agents/skills/` for Codex) and follow it:
  skills created after session start do not appear; if the session started elsewhere, the
  listed `speckit-*` skills belong to that other repo (different version, scripts running in
  the wrong folder).

Qualified names below match the installed plugin; if the session's skill list shows another
prefix, use that. Project skills and commands (e.g. `/ship`, `/deploy`, its own verification)
take precedence when they do the same job.

## Table

| When | Skill | How | Without it |
|---|---|---|---|
| Interviewing the human about a plan | `mattpocock-skills:grilling` | Skill | protocol in `project-grill.md` |
| Glossary, domain terms, ADRs | `mattpocock-skills:domain-modeling` | Skill | Glossary in `project-grill.md`, §6 of `architecture.md` |
| Designing modules, interfaces, seams | vocabulary in `<agentic-architecture>/references/vocabulary.md` (this set), through §4 of `architecture.md` | Read | `mattpocock-skills:codebase-design`, if installed: the same source in English |
| Writing code with a test first and minimal changes (each lane's agent with a closed brief) | `agentic-implement` (this set; `agentic-skills:agentic-implement` in the plugin) | Skill | red test → minimal green code → repeat; test through public interfaces; every diff line links to the brief |
| UI mockups/variants, logic validation | `mattpocock-skills:prototype` | Skill | static HTML mockups with real tokens |
| Code review: feature diff (agentic-feature calls at step 6), branch, PR or agent work; includes the security lens (`security-review` in Claude Code) | `agentic-code-review` (this set; `agentic-skills:agentic-code-review` in plugin) | Skill | read `<agentic-code-review>/SKILL.md` and follow it; without the skill, review remains undone |
| Author self-review before requesting review (optional; not an agentic-code-review lens) | `mattpocock-skills:code-review` | Skill | — |
| Simplifying one's own diff before review (author, optional) | `simplify` (Claude Code), targeting `<lane-base>...HEAD` (if it reviews only the current diff, use a disposable worktree with `git reset --soft <lane-base>`) | Skill | agentic-implement's minimal change (step 4) |
| External facts (APIs, documentation) | `mattpocock-skills:research` | Skill | read and cite primary sources |
| Fixing a bug, regression or incident (root cause, defect class, red and green) | `agentic-fix` (this set; `agentic-skills:agentic-fix` in plugin) | Skill | reproduce → hypothesis → measure → fix → test |
| Writing `AGENTS.md`, skills, agent docs | `mattpocock-skills:writing-for-agents` | Skill | `agents-md.md` |
| PR text | `mattpocock-skills:pr` | Skill | what, why, proof, risk, how to undo |
| Human-only steps (accounts, secrets) | `mattpocock-skills:wizard` | Skill | numbered steps with commands |
| Splitting work into vertical slices | `to-tickets` | Read | SKILL.md phase 9 |
| Work too big for one session | `wayfinder` | Read | split into decisions first, then slices |
| Session retrospective | `retro` | Read | 3–5 lines: went well, delayed, lesson |
| Interview also writing docs | `grill-with-docs`, `grill-me` | Read | `grilling` + `domain-modeling` |
| Spec from conversation, implementing a spec | `to-spec`, `implement`, `implement-spec` | Read | Spec Kit (below) |
| Handing work to another session | `handoff` | Read | handoff note: state, next step, files |
| Issue triage | `triage` | Read | — |
| Assessing architecture, designing a material interface or carrying an authorized refactor forward | `agentic-architecture` (this set; `agentic-skills:agentic-architecture` in plugin) | Skill | read `<agentic-architecture>/SKILL.md` and select assess, design or refactor |
| Project principles | `speckit-constitution` | Project | Principles section in `docs/decisions.md` |
| Specify → clarify → plan → tasks | `speckit-specify`, `speckit-clarify`, `speckit-plan`, `speckit-tasks` | Project | agentic-feature's light spec |
| Consistency and quality before implementation | `speckit-analyze`, `speckit-checklist` | Project | manual spec ↔ plan ↔ tasks review |
| Implementing and closing gaps | `speckit-implement`, `speckit-converge` | Project | agentic-feature briefs |

Do not use `speckit-taskstoissues` (discontinued).

## Notes

- `code-review`, `to-tickets` and `wayfinder` expect a tracker configured by
  `/setup-matt-pocock-skills` (user-only). Without it: pass the spec path directly to
  `code-review`; use `to-tickets`' method (vertical slices, blockers, human granularity question)
  but not its publication format (one ticket file in `.scratch/`): items go into the board or
  `docs/backlog.md` without a board. If wanted, suggest `/setup-matt-pocock-skills` with
  “local markdown” or GitHub tracker.
- `domain-modeling` looks for `GLOSSARY.md`; that is also this method's file. Say so on invocation.

## Install

```
# in Claude Code
/plugin marketplace add mattpocock/skills
/plugin install mattpocock-skills@mattpocock

# in the terminal (Spec Kit)
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v1.2.0
```
