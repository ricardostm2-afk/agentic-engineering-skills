<!-- Menu for agentic-project: replace every {{...}} and remove unused sections/rows and this
comment. Do not create files to satisfy this template. For minimal bootstrap keep purpose,
scope, exact verified commands and essential rules. Add parallel, UI, board, radar or process
pointers only when selected and already present. No future (phase N) links. -->
# AGENTS.md

## Mission
{{What the project does and for whom, in one sentence.}}
Scope / non-goals: {{requested work and the relevant boundary}}.

## Commands
Run from {{working directory}} with {{runtime/package manager and prerequisites}}.
```bash
{{install}}             # dependencies; omit when unnecessary
{{run}}                 # local app with synthetic data; omit for non-app repos
{{focused-check}}       # changed area's verification
{{full-check}}          # project verification before integration
```
Verification: {{command results; mark blocked or planned commands unverified with a reason}}.

## Code map
- Change boundaries: {{owned paths; generated/vendor/protected paths}}.
- Before {{task/area}}, read {{existing applicable document and why}}.
{{Optional existing area map, glossary, architecture or ADR pointers, with read triggers.}}

## Workflow
- Replies and project documents use {{declared language; English by default}}.
- Follow {{existing branch, commit and review conventions}}.
- Features use `agentic-feature`; fixes use `agentic-fix`; review uses `agentic-code-review`.
  {{Add REVIEW.md only if it exists and contains project-specific guidance.}}
- Keep changes within the agreed scope. Use the smallest verification that proves the change,
  plus project-required checks; “done” needs executed command + result.
- Dependency APIs: inspect installed types or version-matched docs. Research changed/new
  components or material unknown currentness; reuse valid evidence for the same scope.
- Ask only material unresolved decisions, with a recommendation; honor existing delegation.
{{Parallel setup only: worktree/ownership rules and exact checked commands.}}
{{UI only: applicable design rules, detector command and scoped approved exceptions.}}

## Hard rules
- No secrets in code, logs or chat: use variable names and the configured secret store.
- No real personal data in prompts or fixtures: use synthetic data.
- Obtain applicable authorization for production deployment, deleting data, payments,
  publishing, accounts or DNS; carry existing authorization forward.
- No `--no-verify`, force-push on shared branches or blind `git add -A`: preserve checks and
  other people's work; stage only intended paths.
{{Project-specific essential rules, each with a reason; remove this placeholder if none.}}

## Where to record things
{{Existing decisions/work tracker and when to update it; omit this section if unnecessary.}}
{{Optional board: actual CLI path and update/sync procedure; only the orchestrator publishes.}}
{{Optional radar: source, scope, verification date and invalidation trigger for reusable evidence.}}
{{Optional lessons: existing path and format; mechanical lessons become checks.}}
