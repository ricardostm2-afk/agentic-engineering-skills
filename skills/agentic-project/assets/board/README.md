# Development board: exact instructions

Read by the agent in phase 7 of `agentic-project`, whenever board sync fails, and by any agent
needing the syntax. Flow and rationale live in `../../references/board.md`; this file owns
commands, names and formats. If in doubt, `scrum.sh help` takes precedence.

## Parts

| File | Purpose |
|---|---|
| `scrum.mjs` | CLI (Node ≥ 20, no dependencies). Each command prints one JSON line. |
| `scrum.sh` | Shortcut: `scrum.sh <command> …` = `node scrum.mjs <command> …` (finds node). |
| `hook.sh` | Connects any agent runner to the board: job start, heartbeat and end. Silent, always exits 0. |
| `board.html` | Read-only page (plus the owner's new-request form), published as an artifact with `db`. |
| `scrum.test.mjs` | Tests: `node --test scrum.test.mjs` (offline, synthetic git, fixed clock); keep `board.html` beside it for the CLI-to-page contract checks. |

**Source and copies.** CLI code has one source: this skill's `scrum.mjs`. Project copies
(`<repo>/.agentic/board/`, or another folder named by `AGENTS.md` or `CLAUDE.md`, with state located
by `SCRUM_DIR`) are installations: change the CLI here with tests, then copy it. Report a
divergent copy to the human rather than fixing only that copy. A project may also copy nothing:
its own wrapper runs this file with defaults (`SCRUM_DIR`, `SCRUM_REPO`, `SCRUM_CONFIG`,
`SCRUM_CLI`) and its own `config.json`, for example in `tools/scrum/`. **Which to run**: whatever
the project's or user's `AGENTS.md` or `CLAUDE.md` names; otherwise
`<repo>/.agentic/board/scrum.sh`; without a project copy, this folder's script from the repo.
The published board URL comes from the same place (default: the “Board:” line under “Where to
record things” in `AGENTS.md`).

Local state lives in `<repo>/.agentic/board/state/` (requests, items, agents, events, decisions,
throughput and import records), including when the CLI runs inside a worktree: it resolves the
main repository root, so every agent writes the same state. Export goes to `state/export/`.
All of this stays outside git (`.gitignore`: `.agentic/board/state/`). `SCRUM_DIR=<folder>`
changes the parent of `state/` and, without `SCRUM_REPO` or `SCRUM_CONFIG`, the config location
(`<folder>/config.json`).

Errors: `{"ok":false,"error":…}` on stderr, code 2 (usage/validation), 1 (data) or 75 (busy or
broken lock: retry).

## The rule

- Every human request (chat or board panel) becomes `request add`.
- Every piece of work started becomes `item add` / `item set`, plus `agent heartbeat`.
- **Heartbeat every 30 min**: anyone working repeats `agent heartbeat` at least every 30 minutes.
  After 45 min without a heartbeat, the board shows the agent as waiting (15 min of slack).
  At completion, `agent end`.
- Every test verification, deployment, blocker and decision is an event (or an `item set` that
  generates one).
- No personal data or secrets. The CLI replaces apparent secrets, emails, phone numbers, bank
  accounts or identification numbers with `[removed]`, and reports `warnings`. It does not
  detect people's names: do not write them (use roles).

## When to update

| Checkpoint | Command |
|---|---|
| new human chat request | `request add --title … [--priority high]` |
| work starts | `item set <id> status=in-progress owner=<agent>` + `agent heartbeat <agent> --name … --type … --item <id>` |
| while working | `agent heartbeat <agent>` at least every 30 min; `item set <id> tasks.done=N tasks.total=M` |
| relevant commit | `event commit "<short sha> <line>" --agent … --item <id>` (and `item set <id> sha=<sha>`) |
| test verification | `item set <id> status=verifying verify.status=running` (item already has `sha`, or supply `verify.sha=`), then `verify.status=green\|red` |
| blocker | `item set <id> status=blocked blocker="<blocker>; unblocker: <who>"` |
| needs human | `decision add --question … --recommendation …` (or `request set <id> status=waiting-for-human`) |
| decision made | `decision set <id> status=decided decision="…"` |
| integrated | `item set <id> status=integrated sha=<sha>` + `event end "<mini-retrospective>" --item <id>` + `agent end` |
| green deployment | `scrum.sh production <sha>` (+ `event deploy …`) |

Every command is `.agentic/board/scrum.sh <command>`. One line per transition; `show items`
before creating to avoid duplicates.

## Commands

```bash
S=.agentic/board/scrum.sh

# Human request (origin: chat | messaging | panel | other; priority: high | normal | low)
$S request add --title "View orders on mobile" --priority high [--description …]
$S request set p-20261015-view-orders-mobile status=waiting-for-human
$S request set p-20261015-view-orders-mobile result="in production at 4e1c9a7b2"
$S request link p-20261015-view-orders-mobile i-012-cart

# Work (backlog with criterion/dependencies; then lifecycle)
$S item add --title "Walking skeleton" --id f01-skeleton --criterion "npm start returns 200 at /health"
$S item add --title "Order list" --id f02-orders --depends f01-skeleton --spec 002-orders --request p-…
$S item set f02-orders status=in-progress branch=agent/f02-orders owner=orders-session
$S item set f02-orders sha=7f3d2b8a6 tasks.done=12 tasks.total=20
$S item set f02-orders status=verifying verify.status=running verify.profile=complete   # verify.sha = item sha
$S item set f02-orders verify.status=green verify.duration_s=1547
$S item set f02-orders status=blocked blocker="missing key X; unblocker: human"
$S item set f02-orders blocker=            # field= deletes an optional field
$S item set f02-orders status=integrated   # after deployment, production <sha> makes it in-production

# Who is working (types: claude-session claude-workflow codex-job other-agent verification script)
$S agent heartbeat orders-session --name "Session: orders" --type claude-session --model <model> --item f02-orders
$S agent end orders-session [--status error] [--detail "…"]   # --lease <id> on heartbeat: agent lease for the end command

# Events (types: start commit verify deploy block decision note end error request; keep latest 400)
$S event commit "7f3d2b8a6 order list" --agent orders-session --item f02-orders
$S event verify "red verification at 7f3d2b8a6: 2 integration tests" --item f02-orders
$S event deploy "deployment of 7f3d2b8a6: smoke 14/14"
$S event end "retro: X went well; Y delayed us; lesson Z" --item f02-orders

# Human decisions
$S decision add --question "Publish now?" --recommendation "yes, low risk" --item f02-orders
$S decision set d-20261015-publish-now status=decided decision="yes"

$S show items [id]            # read before creating to avoid duplicates
$S sync-plan --versions "…" --inbox "$T" --by <agent>   # orchestrator sync: see artifact-sync.md
$S markdown > docs/backlog.md # readable view without artifact: every transition; commit at session end
$S help
```

Item states: `backlog ready in-progress in-review verifying integrated in-production blocked
cancelled` (`verifying` = test verification running; accepts `in-testing`). Request states:
`new analysing in-progress waiting-for-human ready in-production cancelled` (accepts
`waiting-for-decision`). Agent types: `claude-session claude-workflow codex-job other-agent
verification script` (`verify` and `tests` are saved as `verification`).

Ids come from date and title (`p-20261015-…`, `i-<spec number>-…`, `d-20261015-…`), limited to
4 words: read the returned `id`, or fix it with `--id` (only `[a-z0-9-]`, up to 64 characters).
Initial backlog items use fixed short ids (`f01-skeleton`).

## What the CLI does automatically

- An item entering `in-progress` or later gets `start`; `integrated`, `in-production` or
  `cancelled` gets `end` (reopening deletes it). Each status change generates an event with
  readable text (“in progress → integrated”); item and request ids go in event fields.
- Requests follow their items: any started → `in-progress`; all integrated → `ready`; all in
  production → `in-production`; never changes `waiting-for-human` or `cancelled`.
- `production <sha>`: integrated items whose `sha` is contained in that SHA
  (`git merge-base --is-ancestor`) become `in-production`. The project's deployment step calls
  it after a green deployment.
- Daily throughput stores keys rather than counts, avoiding duplicates: integrated/production
  items by item id; verifications by the first 7 SHA characters, from
  `item set verify.status=green|red`, `event verify "… <sha> …"` and verification notes.
  Reporting the same verification all three ways counts once; an `event verify` without SHA
  counts on its own.

## Configuration (optional)

`<repo>/.agentic/board/config.json` (versioned; alternate file: `SCRUM_CONFIG`). With `SCRUM_DIR`
and no `SCRUM_REPO`, use `<SCRUM_DIR>/config.json`, not the current directory's repository
config: `sync-plan`'s `confirm` carries its `SCRUM_DIR` and reads the same config from anywhere.
Each key has an overriding `SCRUM_*` variable. Works without config: dependent data is
`unknown` or omitted from its document.

```json
{
  "project": "Name displayed on the board",
  "branch": "main",
  "remote": "origin",
  "specs": "specs/*/tasks.md",
  "verify_notes": "refs/notes/tests",
  "deploy_notes": "refs/notes/deploy",
  "readyz": "https://<server>/readyz",
  "production_cmd": "<read-only command printing production SHA and free disk space>",
  "timezone": "UTC",
  "out": "export",
  "agent_end_cmd": "node <project-folder>/release-lease.mjs",
  "vocabulary": { "owner": "manager", "labels": { "verifying": "under verification" },
                  "agent_types": ["verify"], "server_key": "vps" }
}
```

| Key | Variable | Default | Effect |
|---|---|---|---|
| `project` | `SCRUM_PROJECT` | none | `sync.project`: page title and brand name (“Development board” without it) |
| `repo` | `SCRUM_REPO` | current directory's git root | repository read for metrics (relative to root) |
| `branch` | `SCRUM_BRANCH` | `main` | main branch: `<remote>/<branch>` if present, otherwise local |
| `remote` | `SCRUM_REMOTE` | `origin` | fetch source (branch and notes only); no remote, no fetch |
| `specs` | `SCRUM_SPECS` | `specs/*/tasks.md` (Spec Kit) | task files `- [ ]`/`- [x]`; first `*` is spec id |
| `verify_notes` | `SCRUM_VERIFY_NOTES` | none | git notes with verification results |
| `deploy_notes` | `SCRUM_DEPLOY_NOTES` | none | git notes with deployments |
| `readyz` | `SCRUM_READYZ` | none | health URL: `production.readyz` = `ready` \| `fail` \| `unknown` |
| `production_cmd` | `SCRUM_PRODUCTION_CMD` | none | `production.sha` and free disk (`metrics.server`) |
| `timezone` | `SCRUM_TZ` | system timezone | date and throughput-day timezone; fix when multiple hosts write |
| `out` | `SCRUM_OUT` | `state/export` | export/sync-plan folder (`export/`, `plan/`, `sent.json`); relative to state parent |
| `agent_end_cmd` | `SCRUM_AGENT_END_CMD` | none | command at each agent's end (below) |
| `vocabulary` | (none) | see below | names already used by project state and page |

Formats:

- **`production_cmd`** runs with `sh -c` in the repository, a 30 s timeout and 10 min cache
  (`state/.cache-production.json`). Writes production SHA (7–40 hex) on line 1 and optional
  free disk GB (`31`, `31G`, `31.4 GB`) on line 2. Must be read-only and non-interactive, e.g.
  `ssh -o BatchMode=yes <user>@<server> 'git -C <folder> rev-parse --short=9 HEAD; df -BG --output=avail / | tail -1'`,
  or `curl` to a version endpoint. The human writes it (config is versioned: no secrets there).
- **`agent_end_cmd`** connects project-specific completion work (release an agent lease, notify
  a panel) to `agent end`. Runs with `sh -c` after saving completion, outside the lock, with
  agent JSON on stdin (`agent heartbeat`'s `--lease` included) and `SCRUM_DIR` in the environment.
  Writes a JSON object whose keys join the response (never `ok`, `agent` or `warnings`), e.g.
  `{"lease":{"status":"released"}}`. Failure, a timeout after 30 s or non-JSON output does not
  undo completion: emit a warning. Must be fast and non-interactive.
- **`vocabulary`** lets projects keep existing state/page names without migration. All keys
  optional:
  - `owner` (default `human`): decision-maker, in `waiting-for-<owner>` and the “waiting for
    <owner>” label. `waiting-for-human` and `waiting-for-decision` remain accepted input and
    are saved with the project name;
  - `labels`: status → text for events (default `verifying` is “verifying”);
  - `agent_types`: extra agent types; listed types stop being aliases of `verification`
    (by default `verify` saves as `verification`);
  - `server_key` (default `server`): metrics disk-block name. Cannot be `generated_at`,
    `production`, `main`, `specs`, `verifications`, `deploys` or `throughput`.

  This folder's `board.html` reads default names: projects changing them publish their own page.
  `sync-plan`'s `confirm` carries config because sent records depend on `server_key` (measurement
  timestamps do not count as changes).
- **`readyz`**: ready = HTTP 2xx and, if JSON has `status`, one of `ready ok pass up healthy`.
  Optional `checks.migrations.detail` text appears as “migrations”.
- **Verification note** (one per tested commit, JSON):
  `git notes --ref=tests add -m '{"result":"green","profile":"complete","at":"2026-10-15T10:00:00Z","duration_s":1500}' <sha>`.
  `result`: `green` | `red` | `hung`. Also accepts `{"status":"pass"|"fail", "complete":bool,
  "created_at":…, "seconds":…}`. Without `sha`, use the note's commit.
- **Deployment note**: `{"at":ISO, "sha":"…", "smoke":{"passed":N,"failed":N}, "rollback":"tag"}`
  (`when` also accepted for `at`). A matching production SHA supplies “since”, smoke and rollback
  tag.
- Fetch notes only by fast-forward (never lose an unpublished local note).

Fetch uses repository `core.sshCommand` (if set), with `BatchMode` and `GIT_TERMINAL_PROMPT=0`:
without network or a key it fails quickly, and export still completes.

## Lock

Every command holds `state/.lock` (owner recorded inside). A lock older than 10 s belongs to a
dead/frozen process and is broken. A process whose lock was broken while it waited exits 75
without saving: retry. A lock busy for over 15 s (`SCRUM_WAIT_MS`) also exits 75.

## Hook for agent runners

`hook.sh` connects anything launching jobs (cron, queue, parallel agent script, CI). Writes
nothing, always exits 0, and gives up after 4 s if the lock is busy:

```bash
G=.agentic/board/hook.sh
$G start "$JOB" --prompt "$PROMPT" --type codex-job --model "$MODEL"   # or explicit --name/--item
$G heartbeat "$JOB" --detail "running for 20 min"                   # every 10 min
$G end "$JOB" --code "$?"                                          # 0 → finished; ≠ 0 → error
```

- Agent id is the job name in `[a-z0-9-]` (optional `HOOK_PREFIX`, e.g. `job-`).
- With `--prompt`, name comes from the first heading (`## Task N — …` or `# …`), item from
  `item: <id>` (put it in the prompt header).
- Default type: `HOOK_TYPE` or `other-agent`. Events: `start`, then `end` or `error`.

## Artifact / ArtifactData

**Artifact / ArtifactData**: before authorized publishing, seeding or syncing, read
`assets/board/artifact-sync.md` in full. Only the orchestrator with the tool sends.
Without these capabilities or a published URL, record only through the CLI and use the Markdown
view; the next orchestrator with the tool sends pending data. On every route, record each
transition and send a heartbeat at least every 30 minutes; subagents, workflow agents and jobs
write only through the CLI. Do not create scheduled tasks/crons to sync or change permissions.

## Limits

Each document is ≤ 200 KB (server rejects > 256 KB). Trim in this order:

- Events: oldest first.
- Requests, items, agents, decisions: terminal states first (cancelled, in production,
  ready/integrated, finished, decided…), oldest first; active work only if still too large.
- Metrics: end of the longest list.

Never trim local state. Keep at most 400 events and 300 agents (remove non-active agents with
the oldest heartbeat first).

## Variables and tests

Besides configuration variables: `SCRUM_DIR` (parent of `state/`), `SCRUM_CONFIG`, `SCRUM_CLI`
(wrapper written into confirm, for projects running this file with their own defaults),
`SCRUM_OFFLINE=1` (no fetch, production command or readyz), `SCRUM_BY` (exporter), `SCRUM_NOW`
(fixed clock), `SCRUM_WAIT_MS` (lock wait, default 15 s).

```bash
node --test .agentic/board/scrum.test.mjs
```

Tests cover concurrency (negative control without lock), breaking a frozen process's lock,
throughput without duplicates, limits/fast trimming of months of state, import/export with
and without config, production command and readyz against a local server, secrets, hook,
Markdown, state shared from a worktree and sync-plan (both --versions formats, only changes,
pending unversioned documents reject with code 2, new documents omit if_version, copies safe
from another export, confirm carries SCRUM_DIR across repositories and pins the plan's config,
sent --plan, no-argument sent rejects, name=0/empty versions on reset artifacts, inbox deletes,
idempotency, at most 50 writes, stale imported/deleted request files do not reject). They also
cover sent recording only plan content (bare names/--all/shared export reject; selected plan
names), real changes versus volatile fields (different clocks, production measurements and
exporter do not resend; real change sends its document and sync; heartbeat after 60 min;
old-record one-time resend), and a deterministic shared export/ race (an older slow export
finishes after another plan without altering it or overwriting newer export/). CLI exports
also feed the actual board script in a DOM/database double: requests, items, agents, decisions,
verification status, details, metric charts and the new-request form use the same English
keys. This checks data contracts, not browser layout or live artifact access.
