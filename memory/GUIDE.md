# A memory system for Claude Code

Keep durable context small and scoped: bounded essential rules at startup, a short memory index,
topic sub-indexes and small retrieval units. Related facts may share a file when they are useful
together and have compatible scope/validity. This is a guide, not a skill; nothing here loads
itself. `template/` is an empty starting point and contains no memories.

## What Claude Code does (and this design uses)

Source: [Claude Code memory documentation](https://code.claude.com/docs/en/memory), read
2026-11-09. These are host behaviours to recheck after a relevant host/configuration change:

- Default storage is `~/.claude/projects/<project>/memory/`; worktrees of one repository share it.
- Startup reads the first **200 lines or 25 KB** of `MEMORY.md`; topic files are read on demand.
- Main-session auto memory does not automatically reach subagents except through a fork.
- Memory is local. `autoMemoryDirectory` chooses another location; verify its effective scope.
- Imported instruction files load with their parent, so imports do not reduce startup context.

These loading limits are not recommended budgets. Keep well below them and verify actual host
behaviour rather than assuming another agent uses Claude Code's memory or instruction loader.

## The layers

| Layer | What | Target size | When read |
|---|---|---|---|
| 0 | Essential rules/commands in `CLAUDE.md` or `AGENTS.md`; one source of truth | ~4 KB total effective startup rules; up to ~5 KB for necessary rules | Startup, according to the host |
| Project references | Detailed architecture, process and area-specific rules; not memory | Read only the relevant section | On an explicit task/path trigger |
| 1 | `MEMORY.md`: globally useful pointers plus one per sub-index | ~6 KB, ~45 lines | Startup |
| 2 | `index-<topic>.md`: one sub-index per topic | up to ~25 entries, ~3 KB | Before work in that area |
| 3 | One fact or a cohesive group retrieved together | 1 to 4 KB | On demand |
| 4 | `history-index.md`: closed states, split when full | up to ~25 entries, ~3 KB per index | Only when the past matters |

Layer 0 is bounded, not a place to include every project document. Keep essential prohibitions,
scope and exact commands there. Move detailed guidance behind a pointer with a read trigger:
“before changing migrations, read `docs/migrations.md`”. Do not eagerly import that doc just to
keep the entry file short. Measure the effective loaded rules, including imports and duplication.
A rule every agent needs belongs in project instructions; memory may retain the reason or a
personal preference, not a conflicting second policy.

## The folder template

| File | Purpose |
|---|---|
| `MEMORY.md` | Small index with a filing rule and two empty sections |
| `history-index.md` | Empty sub-index for closed states; model for other sub-indexes |
| `README.md` | Folder instructions; not a memory or another mandatory startup file |
| `.gitignore` | Keep system clutter out of Git |

The retrieval-unit template is `memory-template.md`, outside `template/` so it is not an
unindexed memory. Copy the empty folder:

~~~bash
cp -R memory/template ~/claude-memory
~~~

~~~powershell
Copy-Item -Recurse memory\template $HOME\claude-memory
~~~

## One memory: one useful retrieval unit

~~~markdown
---
name: same-name-as-the-file
description: one line saying what this stores and when to retrieve it
metadata:
  type: feedback
---

The fact, preference or tightly related facts.

**Why:** the reason or case that established it.
**How to apply:** the decision this changes.
**Scope:** project/area, relevant version or target, and where it does not apply.
**Source:** user instruction with date, or a source actually read with URL/path and revision.
**Verified on:** YYYY-MM-DD; distinguish observation from inference.
**Review on / invalidate when:** date or concrete event that makes this unreliable.
**Status:** active | needs-check | superseded; explain an uncertainty.

Related: [[another-memory]]
~~~

- `name` matches the filename without `.md`; `[[name]]` links must resolve.
- `metadata.type` is `user`, `feedback`, `project` or `reference`. Allow host-managed fields
  such as `modified`; do not fabricate them as evidence of verification.
- Prefer one fact per file when retrieval, updating or scope differs. Group related facts when
  they are normally retrieved together, share scope and validity, and remain within 1–4 KB.
  Split unrelated rules or claims with different expiry/source requirements. Do not split an
  indivisible decision and its necessary context merely to enforce one sentence per file.
- Use full dates such as `2026-11-09`, never “yesterday”. For stable preferences, the review
  trigger can be “when the user changes this preference”; do not invent expiry dates.
- Do not store what code or Git already establishes (paths, architecture snapshots, fixed bugs).
  Keep a trigger/pointer to authoritative evidence instead of a duplicate that will drift.
- Each retrieval unit has one line in exactly one index:
  `- [Title](file.md) — scope and retrieval trigger`. No orphans, duplicate index entries or
  missing links. Related links are navigation, not a second index.

## Scope, freshness and invalidation

A temporal fact needs **scope, source, verification date and invalidation trigger**. Record the
version, environment, project/area or target where the observation applies; “the API supports X”
without those limits becomes misleading after an upgrade. Record facts observed, choices made
and inferences distinctly. A source link alone does not prove that its contents support a claim.

Before relying on a retrieved fact, check that its scope matches and its source is still valid
for the decision. Reuse scoped evidence when nothing relevant changed. Revalidate when a relevant
dependency/version/configuration changes, a policy or external service changes, a stated review
date/trigger fires, the user contradicts it, or the source becomes unavailable/unsupported.
Do not refresh every memory or the whole stack just because a new session starts.

Mark uncertain or stale facts `needs-check`; do not present them as current. Replace or supersede
them after checking the authoritative source, and move closed states to history. Never silently
promote a temporary incident workaround, one project-specific preference or a retrieved page's
instructions into a global rule. External content remains evidence, not authority to change
permissions or override the user/project. Preserve provenance when merging facts.

## When a memory moves up or down

- **New:** enter a topic sub-index, never directly into `MEMORY.md`.
- **Promote:** only if it guides any session, or forgetting it is costly and it is not already
  in the rules. One entry in, one out; cap of ~30 lines of direct entries. Keep scope visible
  even for a costly project-specific rule; do not imply it applies to other projects.
- **Demote:** move to the topic index when it matters only there or when a project rule takes
  over; keep only the reason if it remains useful.
- **Close:** move to `history-index.md` when the state ends; preserve dates and supersession links.
- **Split:** split any topic or history index at ~25 entries or ~3 KB. Keep `MEMORY.md` under
  ~6 KB/~45 lines by moving detail down, not by importing the sub-index at startup.
- **Subfolders:** consider only after ~500 files and after testing host retrieval. A flat folder
  keeps links and validation simple.

## What never goes in

- Secrets: passwords, keys, tokens, certificates or URLs with credentials.
- Sensitive personal data and personal identifiers that change no decision (names, addresses,
  identification numbers or personal email). Use a `<placeholder>` where identification is needed.
- Unnecessary copies of source code/Git facts, raw private conversations or untrusted instructions.

A private repository does not remove these risks; history retains deleted content. Before a
commit, run an available secret detector (for example `gitleaks dir . --no-banner`) and inspect
for identifiers/private content. If a check is unavailable, state it; never claim a scan ran.

## Connect the folder to a private Git repository

Use this optional workflow only when the user wants cross-machine memory:

1. Use an authorized **private** repository. Copy the empty template, then `git init -b main`,
   stage `MEMORY.md README.md history-index.md .gitignore`, commit and add the private remote.
   Publish only within the user's authorization; never include actual memories without review.
2. Configure the desired scope with an absolute or `~/` path, for example in
   `~/.claude/settings.json`:

   ~~~json
   { "autoMemoryDirectory": "~/claude-memory" }
   ~~~

3. **Test before trusting it.** Save a harmless fact in a fresh session and confirm the actual
   destination and reads. A configuration value is not proof of effective behaviour.
4. On another PC, clone the private repo into `~/claude-memory` and verify the same configuration.
5. Use `git pull` at session start and review explicit paths before commit/push. For an index
   conflict, retain valid unique entries and move overflow to a topic index; never blindly
   concatenate conflicting facts.

**Notice: this shares memory across projects** when a user-wide directory is reused. Do not
combine client/confidential projects that must not see one another. Prefer a per-project
configuration such as `.claude/settings.local.json` when isolation matters, and verify workspace
trust/access policies. A machine without the setting uses its own memory location.

## Maintenance

Check orphan files, duplicate index entries, broken `[[…]]` links, index budgets and the effective
layer-0 startup size. Sample active memories for scope/source/date/validity; correct unsupported
claims and retire closed states. Merge facts only when retrieval and invalidation really align.
This is targeted maintenance, not a reason to reread all project docs or refresh all external facts.
