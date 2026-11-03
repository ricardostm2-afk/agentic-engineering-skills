# Defined agents and model per task

Four Claude Code subagent definitions to launch instead of `general-purpose`:

| File | Purpose | Tools | Default |
|---|---|---|---|
| `implementer.md` | a lane's code and tests with a closed brief | `Read, Edit, Write, Bash, Grep, Glob` | `sonnet`, `xhigh` |
| `implementer-ui.md` | an interface lane; also preloads `agentic-design` | the same | `sonnet`, `xhigh` |
| `researcher.md` | read-only research, inventory or diagnosis | `Read, Grep, Glob, WebFetch, WebSearch, Bash` | `sonnet`, `xhigh` |
| `reviewer.md` | read-only review with fresh context | `Read, Grep, Glob, Bash` | `opus`, `medium` |

Each has a closed tool list (none launches other agents) and preloads only the skill it needs.
`claude-md-excerpt.md` is the model-per-task rule to paste into your `CLAUDE.md`; levels (short,
well-defined, complex) live in `references/choosing-the-agent.md`.

## Install (optional)

Installers touch agents only with the explicit option and never overwrite an existing file:

~~~bash
./install.sh --agent claude --agents            # dry run: shows what it would do
./install.sh --apply --agent claude --agents  # copies to ~/.claude/agents
./install.sh --apply --agent claude --agents --project <repo>   # <repo>/.claude/agents
~~~

On Windows: `.\install.ps1 -Agent claude -Agents` (and `-Apply`). At the end the installer shows the
`CLAUDE.md` excerpt; paste it where you want (`~/.claude/CLAUDE.md` or the project's `CLAUDE.md`).
The installer never edits your `CLAUDE.md`. Agents are always copied, even with `--link`, because
they are yours to edit. To update an existing one, compare it manually (`diff`) with this repo's copy.

## Change model and effort

Edit the agent file's `model` and `effort` lines: they are only level defaults, example model names;
the project picks its own. Names age. `model` accepts aliases `sonnet`, `opus`, `haiku`, a full
identifier or `inherit` (the session's model). `effort` ranges from `low` to `max`, and an unsupported
level falls back to the highest the model supports. Model resolution order: call parameter, agent
file, `CLAUDE_CODE_SUBAGENT_MODEL` variable, session model.

## Notes

- `implementer-ui` has no browser tool because its name depends on your installation: add it to
  `tools` for visual proof.
- Bash in reading agents (`researcher`, `reviewer`) is for read commands. If your project has a
  read-only Bash guard, apply it to them.
- The `skills` field preloads skill text at agent startup, with skills already installed. If
  installed via the plugin, Claude Code shows them with the `agentic-skills:` prefix. We have not
  verified that preloading finds `agentic-implement` by its simple name: if the agent starts without
  the skill, put the prefixed name in the `skills` line.
- A zone reviewer (for example database migrations) is made by copying `reviewer.md`: change `name`
  and `description` and write that zone's requirements in the body, keeping the read-only list.
