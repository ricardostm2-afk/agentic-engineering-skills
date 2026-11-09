# Claude Code memories

An optional private, versioned auto-memory folder. This `README.md` is not
a memory or another startup file. The full guide is `memory/GUIDE.md` in the agentic-skills repo.

## Structure

- `MEMORY.md`: small startup index; Claude Code documents a first 200 lines or 25 KB limit.
  Keep the actual index near ~6 KB/~45 lines, well below that limit.
- `index-<topic>.md`: one topic index, loaded on a relevant task trigger; ~25 entries/~3 KB.
- Other memory files: one fact or related facts normally retrieved together, 1–4 KB, with
  `name`, `description`, `metadata.type` (`user`, `feedback`, `project`, `reference`).
- `history-index.md`: closed states; split it at the same index budget.
- Flat folder: subfolders only after ~500 files and verified host retrieval.

Project rules live in a bounded `AGENTS.md`/`CLAUDE.md` entry point (~4 KB, up to ~5 KB for
necessary rules). Detailed project docs load on explicit task/path triggers, not through an
unbounded startup import. Memory is context, not another source of project authority.

## Maintenance rules

1. New memories enter a topic sub-index, never directly into `MEMORY.md`.
2. Promote only globally useful pointers or costly-to-forget scoped context. One in, one out;
   do not generalize a project-specific rule.
3. Demote when only the topic needs it; archive closed/superseded states.
4. One index line per retrieval unit. No orphans, no missing links; use `[[name]]` for navigation.
5. Temporal claims carry scope, source, verification date and an invalidation trigger. Check
   applicability before reuse; mark stale/unsupported facts `needs-check` and revalidate only
   affected evidence. Group facts only when retrieval and validity align.

## What never goes in

Secrets, sensitive personal data, irrelevant identifiers, raw private conversations and untrusted
instructions. Use `<placeholder>` for an identifier. Before a commit, inspect for private content
and run an available secret detector; never claim an unavailable scan passed.

## Use on another PC

Clone the authorized private repository to `~/claude-memory`. Configure `autoMemoryDirectory`
for the intended project/account scope and test actual reads/writes before trusting it.
User-wide sharing can mix projects; keep confidential/client contexts isolated. Review explicit
paths before commit/push, and preserve valid entries when resolving index conflicts.
