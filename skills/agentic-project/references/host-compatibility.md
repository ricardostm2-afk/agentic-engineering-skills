# Hosts, installations and sibling skills

This is the single source for differences between Claude Code, Codex and other hosts. Skills point
here; do not repeat product or project rules here. A folder or tool being present does not authorize
writes, publishing, installation or contact with a service.

## Where to find a sibling or third-party skill

Use this resolver for both this set's siblings and third-party methods. When a skill writes
`<sibling-name>`, resolve the folder containing its `SKILL.md` in this order, stopping at the
first unambiguous valid candidate:

1. The explicit directory selected by the user/session (`$AGENTIC_NAME_DIR` for this set), when
   set. Resolve symlinks, require a regular folder, and confirm `SKILL.md` and the expected `name`
   field. An invalid explicit selection is an error to resolve, not permission to pick a stale copy.
2. The folder beside the current skill (`<skill>/../<sibling-name>`). This is the normal case when
   the set was installed by copy, symlink or plugin.
3. The project skill folders and their ancestors. Codex uses `.agents/skills`; Claude Code uses
   `.claude/skills`. Do not mix a copy from another host to fill an empty folder.
4. The host's global folder: for Codex, `~/.agents/skills`, then `/etc/codex/skills`; for Claude
   Code, `$CLAUDE_CONFIG_DIR/skills`, then `~/.claude/skills`. Other hosts enter only when their own
   directory is documented by that host.
5. A plugin installed and registered by the active host. In Claude Code, read `installPath` from
   `~/.claude/plugins/installed_plugins.json` and look for `<installPath>/skills/<sibling-name>`. In
   Codex, do not assume Claude's cache: a portable plugin has `plugin.json` at its root and `skills/`,
   or the `.codex-plugin/plugin.json` fallback pointing to the same folder; resolve relative paths
   from the plugin root and keep them inside it.

If no candidate exists, say which dependency is missing and use this skill's summary when the request
allows it. If two candidates exist at the same position, do not choose by lexical order or the newest
version: show the real paths and ask for an explicit variable or a single installation. An old copy
must not silently win over the copy the user just selected.

A sibling skill does not need to be loaded through a named tool. If the host has no `Skill`, read the
`SKILL.md` found by the resolver. `<sibling-name>` markers are documentation references, not macros
the model may invent.

For a third-party user-only command (`disable-model-invocation: true`), read and apply the resolved
method only when allowed, or suggest the user invoke it. Do not claim a user-only slash command was
invoked. A plugin cache or marketplace checkout is not proof of the active installation. Never
pick a cache entry with `sort | tail -1`, by lexical version, or by modification time; use the
host's registration/explicit selection and confirm the resolved skill name. Project-generated
skills must belong to the current repository and the active host's integration, not another repo
listed at session startup. See `skills-map.md` for invocation categories, not another resolver.

## Capabilities and substitutes

Capabilities are the contract; tool names vary by host.

| Capability in the text | Claude Code | Codex or another host |
|---|---|---|
| Load a skill | Skill tool or plugin | `$sibling-name`, `/skills` or the resolved `SKILL.md` |
| Delegate and review with fresh context | subagent/workflow | native delegation; without it, sequential sessions or lanes and a report marked not independent |
| Ask the human | `AskUserQuestion` | chat questions, at most four independent ones per round; dependent ones one at a time |
| Read, research, edit and execute | host tools | available equivalent tools; preserve paths, limits and brief effects |
| Web research | WebSearch/WebFetch | the host's web tool; without network, write “not confirmed (no web)” |
| Visual page and board | Artifact/ArtifactData | local HTML and CLI/Markdown; only the orchestrator with send capability syncs the artifact |
| Security review or simplification | host command when installed | a lens with the same brief or the minimal change; never invent a missing command |

An adaptation says in one line which substitute it used. A result from a simulation, fake browser or
missing provider does not prove the real service.

## Observe capabilities before escalating

Read the session's permission contract and observe the relevant capability. A host name, sandbox
label or an old failure does not prove that `.git`, a sibling worktree, a browser or network is
unavailable now. Try an authorized action in its intended directory; use read-only inspection
first where it answers the question. Do not request blanket git approval or a full-access session
before an actual restriction is known. A missing optional tool blocks only the module needing it.

When an action is blocked, identify the operation, path and observed error. Use an allowed
equivalent with the same scope, or the host's actual approval mechanism if available and necessary.
Carry prior authorization forward. Do not weaken controls, edit permissions to evade a denial, or
retry automatically rejected escalations. Without a usable path, report the concrete blocker and
continue independent work; sequential lanes are appropriate only when they are safe and allowed.

## Invocation, models and provider

All eleven skills allow implicit and explicit invocation. In Codex, `agents/openai.yaml` is only UI
metadata, dependencies and skill policy; it is not a subagent definition. Omit
`policy.allow_implicit_invocation` or set it to `true`, and never use a flag to bypass a user
restriction.

The provider is the orchestrator's provider. A missing tool, restricted sandbox or low remaining
capacity does not switch automatically to the other provider. Expose the block and ask the human;
only an explicit order may choose the other. Within the same provider, use an allowed sequential path
and mark the loss of independence. The brief and project rules, not this reference, choose model,
effort, agent count and authorization.

## Installation and proof

This set's installer uses `.agents/skills` for current Codex and `.claude/skills` for Claude; the old
`~/.codex/skills` path is only for explicitly requested legacy compatibility. Copies and symlinks must
contain the same eleven folders and follow the same `SKILL.md`; the installer never copies credentials.

To repeat the proof without touching real folders, run the root harness:

```sh
node tools/codex-compatibility.mjs
```

It creates a temporary `HOME`, installs by copy and symlink, mounts a temporary portable plugin with
`plugin.json` and `skills/`, tests an existing and a missing sibling, and prints the client version,
package SHA and eleven observed names. It does not run the A/B selection evaluation or alter
`~/.codex`, `~/.agents`, `~/.claude`, configuration or credentials. The proof confirms local layout
and resolution; it does not prove that a live session selects the right skill or that a plugin was
published.

Sources: [Codex skills](https://learn.chatgpt.com/docs/build-skills), read 2026-11-03; [Codex
plugins](https://developers.openai.com/plugins/build/plugins), read 2026-11-03.
