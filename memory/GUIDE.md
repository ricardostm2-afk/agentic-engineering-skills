# A memory system for Claude Code

Claude Code's auto memory keeps facts between sessions. This guide offers a way to keep it small,
organized and portable: a short index loaded every time, topic sub-indexes, one fact per file and,
optionally, a folder in a private Git repository to use on any PC. It is not a skill: nothing here
loads itself. The `template/` folder is an empty starting point and contains no memories.

## What Claude Code does (and this design uses)

According to Claude Code's memory documentation (read in 2026-10, version 2.1):

- Each project's memory lives in `~/.claude/projects/<project>/memory/`. `<project>` comes from the
  Git repository, so all worktrees and subfolders of one repository share a folder.
- At the start of each conversation, the first 200 lines or 25 KB of `MEMORY.md` are loaded,
  whichever comes first; the rest is truncated. Other files are not loaded: Claude reads them
  on demand. That is why `MEMORY.md` is an index with one line per memory, rather than a store.
- The main session's memory does not reach subagents (except through a fork), and other coding
  agents do not read it. A rule everyone must follow belongs in the project's `CLAUDE.md` or
  `AGENTS.md`; memory keeps only the reason.
- Memory is local to the machine. Change the folder with `autoMemoryDirectory` (below).

## The layers

| Layer | What | Target size | When read |
|---|---|---|---|
| 0 | Rules to follow: `CLAUDE.md`, `AGENTS.md`, project docs. This is not memory | unlimited | always |
| 1 | `MEMORY.md`: what guides any session, plus one pointer per sub-index | ~6 KB, ~45 lines | at startup |
| 2 | `index-<topic>.md`: one sub-index per topic | up to ~25 entries, ~3 KB | before working in that area |
| 3 | One fact per file | 1 to 4 KB | on demand |
| 4 | `history-index.md`: states that have closed | unlimited | on demand |

## The folder template

`template/` is the empty folder to copy:

| File | Purpose |
|---|---|
| `MEMORY.md` | the index, with the filing rule on the first line and two empty sections |
| `history-index.md` | the empty sub-index for closed states; a template for other sub-indexes |
| `README.md` | explains the folder to anyone opening the repository; it is not a memory (Claude reads only what `MEMORY.md` indexes) |
| `.gitignore` | keeps system clutter out of Git |

The single-memory template is `memory-template.md`, beside this guide (deliberately outside
`template/`: a file that no index links would be an orphaned memory). To create the folder:

~~~bash
cp -R memory/template ~/claude-memory                              # macOS, Linux, WSL
~~~

~~~powershell
Copy-Item -Recurse memory\template $HOME\claude-memory              # Windows
~~~

## One memory: one fact per file

~~~markdown
---
name: same-name-as-the-file
description: one line saying what the memory stores and when it helps
metadata:
  type: feedback
---

The fact or rule, in one or two sentences.

**Why:** the reason, or the case that showed it.

**How to apply:** when and where this changes what you do.

Related: [[another-memory]]
~~~

- `name`: the file name without `.md`. It is also the link target.
- `metadata.type`: `user` (who you are, what you know, how you like to work), `feedback` (your
  corrections and approaches you confirmed), `project` (ongoing work, deadlines and decisions
  that code and Git do not explain) or `reference` (where to find information outside the
  project). Claude Code adds fields such as `modified` when it writes: do not add them by hand.
- `[[name]]` links point to another memory by `name`. A link without a file is an error.
- One fact per file. Two facts mean two files. Use full dates (`2026-10-28`), never "yesterday".
  Do not store what code or Git already tells you (architecture, paths, fixes).
- Each memory appears on one line of exactly one index, like this:
  `- [Title](file.md) — one-line hook`. No orphans, no missing links.

## When a memory moves up or down

- **A new memory** enters the topic sub-index, never directly into `MEMORY.md`.
- **Move up to `MEMORY.md`** only if it guides any session (who you are, what the product is,
  where the work lives), or if forgetting your rule is costly (lost data, money, repeated
  rejection) and it is not already in a rules file. One entry in, one out: a cap of ~30 lines.
- **Move down to the sub-index** when the rule moves into a project file (keep only the reason),
  or when nobody needs it without opening the topic.
- **Move down to `history-index.md`** when the state closes.
- **Split a sub-index in two** at ~25 entries or ~3 KB.
- **Topic subfolders** only after ~500 files, and after testing that Claude reads them: the
  documentation shows a flat folder.

## What never goes in

- Secrets: passwords, keys, tokens, certificates, URLs containing credentials.
- Sensitive personal data, and other people's or your own personal data that changes no decision
  (names, addresses, identification numbers, personal email addresses). If an identifier matters,
  write a `<placeholder>`.
- What code or Git already tells you.

A private repository does not make this acceptable: Git history keeps everything forever. Before
any commit, run a secret detector (for example `gitleaks dir . --no-banner`) and search manually for
email addresses and identifiers.

## Connect the folder to a private Git repository

For the same memory on any PC:

1. Create an empty **private** repository on your chosen service.
2. Copy `template/` (above), then in the new folder: `git init -b main`, `git add MEMORY.md README.md
   history-index.md .gitignore`, `git commit -m "memory: initial folder"`, `git remote add
   origin <private-url>` and `git push -u origin main`.
3. In `~/.claude/settings.json` (or `%USERPROFILE%\.claude\settings.json`):

   ~~~json
   { "autoMemoryDirectory": "~/claude-memory" }
   ~~~

   The value is an absolute path or starts with `~/`.
4. **Test before trusting it.** Open a new session, ask Claude to save a harmless fact and
   confirm that the file appeared in `~/claude-memory` and nothing reached the default folder.
   There have been public reports of Claude Code versions ignoring this setting and continuing
   to write to the old folder; if that happens, the two folders silently diverge.
5. On another PC: `git clone <private-url> ~/claude-memory` and the same setting in `settings.json`.
6. Routine: `git pull` when opening a session; when closing, `git status`, `git add <files>`,
   `git commit` and `git push`. Claude writes to the folder but does not commit. If `MEMORY.md`
   conflicts, keep both lines and move the new one to the topic sub-index.

**Notice: this shares memory across projects.** In the user's `settings.json`,
`autoMemoryDirectory` applies to every project: all read and write the same folder, `MEMORY.md`
combines them, and everything they write goes to the same repository. Do not use it this way with
projects that must not see each other (different clients, confidential work). For a single project,
put the setting in its `.claude/settings.local.json` (it applies only after trusting the folder).
A session on a PC without the setting keeps using the default folder and does not see these memories.

## Maintenance

Occasionally ask Claude to check the structure: `.md` files no index links, memories linked from
two indexes, `[[…]]` links without files, and the size of `MEMORY.md`. If `MEMORY.md` exceeds ~6 KB,
some memories should move down to a sub-index.
