# Claude Code memories

Claude Code's auto-memory folder, versioned with Git for use on any PC. This `README.md` is not
a memory: Claude reads only what `MEMORY.md` indexes. The full guide is in `memory/GUIDE.md` in
the agentic-skills repository.

## Structure

- `MEMORY.md`: short index, loaded in every session (the first 200 lines or 25 KB).
- `index-<topic>.md`: one sub-index per topic, read before working in that area. Up to ~25 entries.
- Every other `.md`: one fact per file, with `name`, `description` and `metadata.type`
  (`user`, `feedback`, `project` or `reference`), and `[[name]]` links to related memories.
- Flat folder: subfolders only after ~500 files and after testing that Claude reads them.

## Maintenance rules

1. A new memory enters the topic sub-index, never directly into `MEMORY.md`.
2. Move up to `MEMORY.md` only what guides any session, or a rule that is costly to forget. One in,
   one out.
3. Move down to the sub-index when the rule moves into a project file (keep only the reason);
   move down to `history-index.md` when the state closes.
4. Each memory appears on exactly one index line. No orphans, no missing links.

## What never goes in

Secrets (passwords, keys, tokens), sensitive personal data and personal data. An identifier that
changes no decision becomes a `<placeholder>`. Before every commit: a secret detector
(`gitleaks dir . --no-banner`) and a search for email addresses.

## Use on another PC

~~~bash
git clone <private-url> ~/claude-memory
~~~

Then, in that PC's `~/.claude/settings.json`: `"autoMemoryDirectory": "~/claude-memory"`. This
applies to every project of that account. `git pull` when opening a session; when closing,
`git status`, `git add <files>`, `git commit` and `git push`.
