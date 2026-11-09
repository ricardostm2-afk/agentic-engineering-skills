# Minimal bootstrap

Default for preparing an existing or small repository. The output is enough reliable context for
the next task: scope, rules, commands and verification. This route does not install a work process.

## Inspect

1. Confirm the intended repository; read existing `AGENTS.md`, `CLAUDE.md`, CONTRIBUTING and
   relevant nested instructions. Inspect `git status --short`, manifests/lockfiles, CI, README
   and the small set of directories relevant to the requested work. Preserve unrelated edits.
2. Establish the scope: purpose, requested agent work, applicable paths, generated/vendor files,
   protected areas and external actions. Infer these from evidence; ask only a material unknown.
3. Discover the exact working commands and their directories: required runtime/package manager,
   dependency setup, local run if applicable, focused checks and the normal verification command.
   Prefer existing commands over inventing wrappers. A docs-only or Python repository does not
   need Node merely because optional board/prepare scripts use it.

## Verify and write

Run the smallest representative command that proves an agent can verify the relevant area, and
any additional check needed by project policy or the intended setup change. Record command,
working directory, result and relevant prerequisites. Reuse still-valid evidence when code,
dependencies, configuration and environment match; rerun when those inputs change. Do not run
unrelated suites or install optional tools to fill a template. Mark a blocked command unverified
and identify the missing dependency/access without claiming setup is complete.

Create a concise `AGENTS.md`, or update the existing instruction entry point with the smallest
authorized diff. `assets/AGENTS.template.md` is a menu: retain only applicable sections and
real paths. Include:

- purpose and scope/non-goals in a few lines;
- exact commands with working directories and known prerequisites;
- essential repository rules and change boundaries;
- trigger-based pointers to existing docs (“before editing migrations, read …”);
- the project's review/commit conventions and verified/unverified command status.

Target roughly 1–2 KB when the repository is simple; the general ceiling is ~4 KB (~5 KB for
necessary existing project rules). Keep detailed docs on demand. Add a `CLAUDE.md` bridge only
when the host needs it; keep a single source of rules. Do not add `REVIEW.md`, a glossary, ADRs,
radar, methodology, lessons, a board, Spec Kit, hooks or an area map unless a selected module
or a concrete existing repo rule requires it. Do not create empty decision/prerequisite files;
a short handoff can state the route and any unresolved issue.

For adopted repositories, show the instruction diff and apply what the request already
authorizes. Preserve rules, working integrations and accepted decisions. An existing optional
artifact is not a reason to upgrade that module or introduce the others.

## Done when

- Scope and the relevant rules are clear to a fresh agent without this conversation.
- At least the relevant verification command has been run successfully, or the exact blocker
  and owner are reported and readiness is explicitly limited.
- Instruction links point only to existing, applicable files; no placeholders or future phases.
- Commands are exact and their verification status is truthful.
- The scoped diff is checked, committed as a logical unit if allowed by project policy, and
  summarized with the verification evidence. Stop without requiring another feature or module.
