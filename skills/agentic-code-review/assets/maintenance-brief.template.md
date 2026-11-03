# Maintenance audit brief: <topic> · phase <1 case | subdirectory | repo>

<!-- agentic-code-review maintenance template (references/maintenance.md). Requires explicit human
request in this conversation; quote it under Request. Fill <...>, delete inapplicable parts and comment. -->

## Request

<human's words and when> · Scope: <path(s)> · Phase: <1 case | subdirectory | repo>, because
<previous phase results, or “first phase”>.
Previous phase feedback: <human corrections to evidence or cleanups, or “none”>.

## Where you run

In orchestrator-created worktree `<wt>`, outside repo, detached at `<sha>`. Read-only until human
approves a cleanup; then one commit per cleanup in that worktree (never trunk).

## Rules

- Preserve production behavior, operational safeguards and killswitches.
- Ignore SDK fallbacks and local overrides.
- Do not change live configuration/services (flags, consoles, databases, queues): read authorized
  information, put the rest under Questions.
- Do not decide ambiguous cases (Permanent flag, incident code, untraceable runtime-built names):
  put under Questions.
- Audit whole scope, not only tagged items; follow indirect callers (enums, constants, wrappers,
  aliases, schemas, runtime-built names, other services).
- Mark proposals adding more complexity than they remove; do not perform them.

## Evidence per candidate

At least two sources, each with command or location:
- history: `git log -S '<name>'`, `git log --follow`, `git blame`, PRs or overlapping commits;
- live configuration (read-only): <where to see flags, or “no access: question”>;
- telemetry and profiles: <where, or “no access: question”>;
- indirect callers: `git grep` names, strings and construction fragments.

## Report

First line: `Audit <sha> · <topic> · phase <phase> · <c> candidates · <a> ambiguous · <x> excess complexity`.

Then by front (owner or file), ordered by measured benefit and age:

`<file:line> — <what> — production: <values> — evidence: <source → result; …> — owner: <who> — callers: <list or “none, searched with …”> — benefit: <measured> — age: <last-use or commit date>`

End: Questions (ambiguity/access), Excess complexity (one line each), Not read (excluded scope and why).

## After approval

One cleanup per commit, message says what, why, evidence copied from report; area tests green
before and after. Each commit passes agentic-code-review at the diff's level.
