# Tool integrations

Read when selecting an optional integration; paths and sibling lookup follow the feature skill.

| Skill | Usage | If absent |
|---|---|---|
| `mattpocock-skills:grilling`, `:prototype`, `:domain-modeling`, `:research` | Skill tool | method summarized in references |
| `to-tickets`, `wayfinder`, `retro` (mattpocock) | user invokes only: read/apply SKILL.md or suggest `/<name>` | `references/too-big.md`; `assets/retro.template.md` |
| `simplify` (Claude Code) | author at lane end targeting `<base>...HEAD` (current-diff-only: disposable worktree with `git reset --soft <base>`) | agentic-implement minimal change (step 4) |
| `agentic-design` (sibling) | steps 2 unresolved UI questions, 3 selected mode, 5 UI lanes, 6 UI lens/proof: Skill tool or read SKILL.md | say so; UI “unverified” under Needs you |
| `agentic-implement`, `agentic-fix`, `agentic-architecture` (siblings) | lane agents load implement; fix handles corrections; architecture supplies step 4 design vocabulary (`<agentic-architecture>/references/vocabulary.md`; installed `mattpocock-skills:codebase-design` is same English source) and deepening handoffs | say so: installed together |
| `speckit-*` | target repo versions (spec-kit.md “Which speckit-* to use”) | `assets/light-spec.template.md` |

Installation (tell human; do not install without OK): `/plugin marketplace add mattpocock/skills`,
`/plugin install mattpocock-skills@mattpocock`; Spec Kit:
`uv tool install --force specify-cli --from git+https://github.com/github/spec-kit.git@v1.2.0`.

