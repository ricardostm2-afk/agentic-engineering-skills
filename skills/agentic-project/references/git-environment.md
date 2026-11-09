# Git environment for agents (phase 4)

Goal: agents work simultaneously without overwriting each other, `main` stays production-ready,
and every change is checked before leaving the machine.

Apply only with selected parallel setup; preserve an adopted repo's existing policy. Observe
actual permissions through `host-compatibility.md`; the host name does not establish read-only
git or a need for blanket approval. Reuse authorization already supplied for the setup.

## Trunk-based

- `main` is the trunk, always green and production-ready. Protected by convention: no direct
  commits of unfinished work; merge only verified work.
- Short branches: `agent/<id>-<topic>` (e.g. `agent/a2-export-csv`). Lifetime < 24 h; nothing
  unpushed at session end. Long branches diverge and merging becomes archaeology.
- Spec Kit creates `NNN-topic` branches for features: treat them as short branches with the
  same 24-hour rule.
- Real GitHub branch protection (`gh api` or repo settings) changes account configuration:
  requires human approval.

## One worktree per agent

Two agents in one working tree damage each other's work (checkout or `git add` takes the
other's changes). Each has its own tree:

```bash
# create (from up-to-date main; pull only with a remote)
git switch main && git pull --ff-only
git worktree add ../<repo>-<agent> -b agent/<id>-<topic> main

# list
git worktree list

# after merging
git worktree remove ../<repo>-<agent>
git branch -d agent/<id>-<topic>
```

Outside the repo (`../`) to avoid the main `git status`; if inside is necessary, use
`.worktrees/` (already in base `.gitignore`). Install dependencies (`node_modules`, shared
package builds) in each worktree: new worktrees do not have them.

## Integration (orchestrator)

1. In the agent worktree: `git fetch` + `git rebase main` (or `origin/main`).
2. Run area checks (`.agentic/areas.json`) and general checks.
3. In `main`: `git merge --ff-only agent/<id>-<topic>`; rerun checks if merging multiple branches.
4. Push `main`. Remove worktree and branch.

Never `git push --force` on shared branches (including `main`), never rewrite history that has
left the machine. If rebase conflicts are unclear, stop and ask.

## Commit rules

- One subject per commit. Message states **what** and **why**; body has **proof** (executed
  command and result, e.g. `npm test: 142 passed`).
- Explicit `git add <paths>`. No blind `git add -A` / `git commit -a`: they collect other
  agents' files, secrets and junk.
- No `--no-verify`. Fix the cause of a failed hook, not the hook.
- Before push, check message against diff: `git show --stat HEAD` and reread. Claims absent
  from the commit mislead later audits.
- Never edit applied database migrations: add a new one.

## Hooks (`.githooks/`, active with `git config core.hooksPath .githooks`)

- **pre-commit**: secrets with `gitleaks` (if installed; otherwise loud warning), fast typecheck
  and lint (`typecheck`/`lint` scripts in `package.json`, if present).
  On staged UI files (`.css .scss .tsx .jsx .html .vue .svelte`), run agentic-design's
  `detect-slop.mjs`, searched in order: versioned `.agentic/detect-slop.mjs`,
  `$AGENTIC_DESIGN_DIR/scripts/`, agent skill folders (`$CLAUDE_CONFIG_DIR/skills/`,
  `~/.claude/skills/`, `~/.agents/skills/` and others in `SKILL.md`, project `.claude/skills/`
  and `.agents/skills/`), Claude Code's `agentic-skills` plugin (installed version from
  `installed_plugins.json`). Analyze staged content (copied with `git checkout-index` into a
  temporary folder, including the staged `.agentic/ui.json` configuration) and **block only
  findings on added or changed lines** (`git diff --cached
  -U0`; deletion counts adjacent lines so removing `slop-ok` does not bypass it). Existing
  blockers are `Pre-existing`, do not stop the commit, and are not fixed incidentally: one
  report line, no backlog entry (same rule as `ui-without-slop.md` §7).
  With UI, version the copies by default (`prepare-repo.sh --apply --with-ui` copies
  `detect-slop.mjs` and `ui-without-slop.md` into `.agentic/`): agents without the skill
  (Codex, cloud sessions, another machine) have detector and rules, and the hook **fails closed**
  if `node` or detector is missing. Without a versioned copy it only warns (`UI NOT verified`)
  and allows the commit: explicit exception to “skipping guards fail open” (`methodology.md`),
  acceptable only without UI.
- **pre-push**: fast tests (`test:quick`, `test:fast` or `test`).
- Fail closed: an existing failing check blocks. A skipped check returning 0 looks green
  without checking anything; when no runnable check exists, hooks warn loudly (`WARNING: no
  stack detected; nothing verified`). Acceptable in a docs-only repo; a defect to fix now in
  a repo with code.
- New project without code: generic hooks already call `typecheck`, `lint`, `test:quick`/
  `test` when available in `package.json`. Nothing to adjust yet; first feature (skeleton)
  creates scripts and removes the warning. In another stack, that feature replaces the warning
  with its own command.
- Known limit: gitleaks and slop detector see staged content only, but typecheck, lint and
  tests use the working tree. A commit may pass thanks to an excluded fix; check
  `git diff --cached` before committing. (No `git stash` in hooks to isolate staged content:
  stash is shared between agents and can lose others' work.)
- Other stacks: add the project's fast command where indicated (e.g. `ruff check`,
  `pytest -q -x`, `go vet ./...`, `cargo check`). Keep pre-commit below ~30 s or agents will
  want to bypass it.

## `scripts/prepare-repo.sh`

Idempotent, dry run by default, `--apply` to write, never overwrites. Output lines:
- `would create` / `created`, `would set` / `set`: missing / completed work.
- `exists, kept`: already present, untouched. In adopt mode compare with generated content
  (`prepare-repo.sh --show pre-commit|pre-push|gitignore|areas`) and propose merging to human
  (diff).
- `warning`: existing file lacks a recommendation: `.gitignore` missing `.env`; `pre-commit`
  missing the detector block or generated by an earlier script (no
  `agentic-project:pre-commit:4` marker); `.agentic/` copy differs from installed agentic-design.
  Propose a diff and apply existing authorization; ask only if the needed behavior change is
  outside it. Each warning is pending. Without UI,
  `# detect-slop: n/a (no UI, D-NNN)` in the hook closes the detector warning.
- `core.hooksPath=<other> … NOT active`: another hook manager (e.g. husky). Add checks there
  instead of replacing it.
- `warning local hooks in .git/hooks: …`: local hooks would be silently disabled by
  `core.hooksPath`. The script does not set it. Read hooks, propose merging into `.githooks/`,
  then set `git config core.hooksPath .githooks` only with approval.
- `Pending: N item(s)`: warnings awaiting human decision; phase cannot close unresolved
  (resolved = applied with approval, or declined and recorded in `docs/decisions.md`).

## Area map (`.agentic/areas.json`)

Script creates skeleton; fill from the real repo or selected architecture work. Each area:
`area`, `folders`, `checks` (commands),
`risk` (`high` | `medium` | `low`), `notes`. Run each `checks` command once and confirm at least
one test executes: a filter matching no files can exit 0 with “0 tests” (false green); some
runners reject folder arguments (Node 22 `node --test` gives `MODULE_NOT_FOUND`; use a quoted
glob, e.g. `node --test "src/catalogue/**/*.test.js"`). Mark nonexistent commands
`(to create in the first feature)`. Agents read before touching code to know checks and care
required; orchestrator uses it to form lanes without shared files.

## Phase proof

Use a disposable branch (`git switch -c hook-proof`) and show outputs:
1. a commit expected to fail — fails;
2. the corrected commit — passes;
3. pre-push with a failing test — fails (`bash .githooks/pre-push </dev/null; echo $?`, with
   `"test": "node -e \"process.exit(1)\""` in temporary `package.json`) — then passes when fixed.
   Direct hook execution suffices: step 1 proved `core.hooksPath` wiring. Without
   `package.json`, pre-push only warns “no stack detected”: record as expected without code.

How to trigger failure:
- With code: deliberately break a type; pre-commit must stop at `typecheck`.
- Without code: temporary `package.json` with `"typecheck": "node -e \"process.exit(1)\""`; or,
  with gitleaks, a fake token shaped like a real token (`ghp_` + 36 random characters). Never
  use a real secret.
- Slop detector (with UI): staged `.css` with `font-size: 10px` must block (`blocker small-text`),
  same with `14px` passes; changing another line in a file already containing `10px` passes,
  listing the old line as `Pre-existing`. If hook says `detect-slop.mjs not found`, run
  `prepare-repo.sh --apply --with-ui` (searches beside agentic-project and in agent skill
  folders; elsewhere, pass `AGENTIC_DESIGN_DIR=<folder>`) and repeat.

Finally: `git switch main && git branch -D hook-proof`, then delete temporary files.
