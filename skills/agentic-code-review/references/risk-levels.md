# Risk levels (step 1)

Adapted from https://claude.dev/blog/solving-code-review-at-anthropic/ (risk-based approval): review
effort follows what the change can break, and the change decides it.

## Who classifies and when

- **The diff defines level**, not the author or their report. The author may think it is “just
  text”; if the diff touches a migration, it is Complete.
- **You classify** (orchestrator), before round 1 lenses and again in each round against that
  round's diff. A higher path in a later round adds missing lenses to that round (a fix touching
  a hook or migration adds security) without changing round limit.
- **The reviewer is the second classifier.** Lenses do not reclassify, but if reading calls for
  more than the assigned level (an unlisted path touching session, permissions, money or a guard),
  write “Level: <file:line> — <why>” in the report. You decide and state the decision in one line.
- Project `REVIEW.md` wins: use its other level names, path list or diff classification command
  (names: “Three scales”, below).
- Called by agentic-feature, the feature track is the starting level; still check the diff.
  If it needs more, review at the correct depth (do not redo completed planning), saying so in one line.

## Levels

| Level | When (from diff) | Lenses | Confirmation | Rounds |
|---|---|---|---|---|
| Quick | docs and text outside high paths; ~50-line fix in one file and its test; additive behind a disabled flag | none: author's red → green test is proof. Explicitly requested: correctness | — | 1 (only if requested) |
| Standard | normal product code | correctness, spec (with written intent), standards in one reviewer (`panel-and-rounds.md` §3) | fixer reproduces before fixing | 2 |
| Complete | any always-high path (below) | those three plus security | a round 1 verifier and reproduction | 3 |

- **Hooks, CI and installers** (`.githooks/`, CI workflows, installation, packaging or automatic
  update scripts) are never Quick and raise **lenses, not rounds**: add security and verifier to
  whatever level the rest of the diff gives. Rounds stay at that level.
- **Escalate from lessons**: a `type: escaped` lesson line (`learning.md`, “Where it lives”), or
  confirmed `escaped` evaluation case in the same area in the last 30 days, raises one level.
  `type: repeated` does not. Nothing exceeds Complete.
- **Lower** only when the diff stops touching what raised it (migration removed from branch).
  Never below what paths require.
- **Start strict.** Relax a level (for example a folder from Complete to Standard) only with
  evidence: passing clean cases, no recent `escaped` in the area. The reverse also applies:
  rising reverts or `escaped` in an area tighten it (the article's missing “circuit breaker”).

## Three scales

Three scales use similar names to measure different things. This table is the only mapping location.

| Scale | Measures | Values | Who decides | Written as |
|---|---|---|---|---|
| review level | what the diff can break | Quick, Standard, Complete | review orchestrator, using this page | “Review level:” in reviewer brief; `<level>` in report first line and `Review:` line |
| feature track | request risk before code exists | Standard, Complete (Fix goes to `agentic-fix`; Too big is split first) | step 0 of `agentic-feature` | a line to the human; review starts at the same named level |
| agent level | what the writer still must decide or discover | short, well-defined, complex | `<agentic-implement>/references/choosing-the-agent.md` §1 | `level:` in writer brief, read by launchers |

- Other `REVIEW.md` level names map 1:1 in order (for example Quick, Normal, Deep); `REVIEW.md`
  states which is which.
- Agent level does not convert to review level: a well-defined task in a sensitive zone has Complete review.
- In a brief, “level” alone means agent level; review level always includes “review”.

## Always-high paths

Those in `REVIEW.md` and `risk: high` areas of `.agentic/areas.json`, if present. Otherwise defaults:
- authentication, session, roles and permissions (wherever decided);
- isolation between customers or organizations (multi-tenant);
- money: pricing, billing, payments, taxes;
- database migrations and schema; deleting or transforming data;
- personal and sensitive data, logs and error messages that may carry them;
- secrets, keys and edge security configuration (headers, CSP, CORS);
- external integrations that send or charge (email, SMS, payments);
- hooks, CI and installers (with their own rule above).

System prompts, agent instructions and the reviewer itself (`REVIEW.md`, brief) are Standard,
with the standards lens reading what the change made false; changing the reviewer also requires
running evaluation cases (`learning.md`).

## People

- **Agent approval never counts as human approval.** This skill classifies, reviews and shows
  evidence; it does not approve.
- **Whoever requested the change answers for it.** The agent can write `Risk:` and `How to undo:`;
  the requester reads these and the proof and owns the result.
- **Approval applies to a SHA.** New commits after the reviewed SHA follow `panel-and-rounds.md`
  §9: either an exception applies or a round opens.
- **Multi-person team**: the article uses 0 humans for Quick (with green review and security),
  1 for Standard, 2 for Complete; always-high paths always get a person, lightweight paths only
  for trusted authors. Put this in `REVIEW.md` and remote rules (code owners, branch protection);
  the skill only checks.
- **One human** (common in small projects): there is no second person. Complete compensates with
  more lenses and a verifier; the human reads proof in the final message. Do not request an
  “I approve” for each change beyond what the project already requires (deploy, irreversible actions).
- Direction changes (“should be done another way”) go to the human early, not as a blocker of
  completed work: in review they go under “Direction”, not findings.
