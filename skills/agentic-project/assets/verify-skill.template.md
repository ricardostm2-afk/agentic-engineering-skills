---
name: verify
description: >-
  Boots {{project}}, drives it like a user and checks the feature map. Use before committing any
  user-visible change, or when asked whether a feature really works.
---
<!-- agentic-project template (references/verify-skill.md). Copy it to .claude/skills/verify/SKILL.md
and replace each {{...}}. Keep the frontmatter on line 1. Delete the rows
and sections that do not apply, and this comment. Prove it before linking it from AGENTS.md: 3 green runs in a row on a clean tree, then one seeded red. -->

# verify

## Boot

```bash
{{start command with synthetic data}}
```
Ready when {{health URL / log line / port}} answers. Wait for that signal, never a fixed sleep.
Timeout: {{2× the longest measured boot}}.

## Doctor

`{{read-only check: process up, this checkout's build, port owned, test account valid}}`. Run it
first, and again when a failure looks environmental.

## Drive

Tool: {{Playwright / CDP / host browser tool / simulator MCP / computer use / curl script}}.
Install: {{command}}.
Helpers: {{`scripts/<name>` for steps every run repeats (sign in, seed, open screen); delete if none}}.

## Feature map

Run every row, or only the rows the change touches (`--only <feature>` or the named rows).

| Feature | Entry | Steps | Expected result |
|---|---|---|---|
| {{sign in}} | {{/login}} | {{fill #email, #password; submit}} | {{lands on /home and shows the user name}} |

## Inspect on failure

For the failed step, save to `{{evidence folder outside the repo}}`: a screenshot or the response
body, console and server logs, and the network trace. Report: feature, step, expected, seen,
evidence path.

## Teardown

{{stop command}}. Run it after a failure midway too. Check that no process from Boot is left.
Stop only what Boot started, never by process name. The evidence folder survives teardown.

## Rules

- A flaky step is not retried until it passes. Find the cause, or remove the row and record why.
- Only synthetic data. No production credentials.
