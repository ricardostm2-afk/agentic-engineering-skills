## Agents and models per task

The orchestrator (main session) uses your most capable model with high effort. Each launched agent
gets model and effort according to its task's level, after closing decisions only the main session
can close. Levels and the four separating questions are in `references/choosing-the-agent.md`, in
`agentic-implement`: read them there rather than copying them here.

| Task | Who does it | Model and effort (example model names; the project picks its own) |
|---|---|---|
| short (definition in §1 of `choosing-the-agent.md`) | the session itself, with `agentic-implement`, no agent or brief | the session's |
| well-defined | `implementer`, or `implementer-ui` for an interface lane | `sonnet`, effort `xhigh` |
| complex | the same agent | `opus`, effort `xhigh` |
| code review | `reviewer`, with fresh context | `opus`, effort `medium` |
| read-only research | `researcher` | `sonnet`, effort `xhigh` |

- Launch defined agent types rather than `general-purpose`: they have a closed tool list and
  start with less context. Use `general-purpose` only when none fits, with the reason in the brief.
- Model follows level: pass it in the call's `model` parameter, which overrides the agent file,
  and effort in `effort` if your version accepts it.
- The code's writer does not review it.
