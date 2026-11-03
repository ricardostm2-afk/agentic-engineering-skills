Phase 4 — Git environment for agents

Read `references/git-environment.md` (protocol: short branches, one worktree per agent, commit
rules, hooks, area map).

1. `bash <skill>/scripts/prepare-repo.sh --dir <repo>` (dry run; add `--with-ui` for a project
   with UI). Show what it would do.
2. `bash <skill>/scripts/prepare-repo.sh --apply --dir <repo>` (with `--with-ui` when there is UI:
   version `.agentic/detect-slop.mjs` and `.agentic/ui-without-slop.md`, without asking). The
   script never overwrites; every “warning” is a pending item and the phase cannot close with
   unresolved items. In adopt mode, treat every “exists, kept” and “warning” as an audit item:
   `--show pre-commit` prints the current hook for the diff you propose.
3. Fill in `.agentic/areas.json` using phase 3's map (`risk`: `high`, `medium` or `low`). In a
   repo with code, adjust hooks to the project's real fast commands; in a new project there
   is nothing to adjust: hooks already call `typecheck`/`lint`/`test` when available and the
   first feature creates them. A local-hooks warning for `.git/hooks` waits for human approval
   before setting `core.hooksPath`.
4. Prove hooks work: a test commit expected to fail does fail, the corrected one passes, and
   likewise for pre-push (how to prove this before code exists: “Phase proof” in
   `references/git-environment.md`). If there is UI, also prove the pre-commit slop detector on
   staged UI files: `.css` with `font-size: 10px` blocks, clean CSS passes, and changing another
   line in a file that already had `10px` passes (reported as `Pre-existing`). Show the outputs.

Done when hooks are active and proven and the script leaves no unresolved pending items.
