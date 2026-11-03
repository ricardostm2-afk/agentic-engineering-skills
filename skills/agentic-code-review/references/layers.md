# Layers and what this skill covers

Source: https://claude.dev/blog/solving-code-review-at-anthropic/ (summarized in our own words).

Line-by-line review stops scaling when agents write most code. The question becomes: what can go
wrong with this change, and which automatic or human check catches it? The answer is a stack of
cheap, incomplete layers, with rollback beneath. Review is continuous, like spellcheck, rather
than a gate at the end.

**This skill covers only review and finding verification.** Other layers belong to the project:
the skill points to them without replacing them.

| # | Layer | What it is | Who does it here |
|---|---|---|---|
| 1 | Pre-integration checks | author runs available tests, build, lint, screenshots against design and shows output | author (agentic-feature's TDD and per-lane proof). Review starts after proof exists |
| 2 | Agent review on every change | parallel lenses against whole repo and intent; confirmed before publishing; behavior changes only; labeled by severity | **this skill**, steps 1–6 |
| 3 | Automatic blocking security | security reviewer for every risky change; close false positives with reasons, fixes with a commit | **this skill**, security lens; unanswered security Important blocks |
| 4 | Required CI | lint, types, tests, build, packaging; integration request explains testing and undo | project (hooks, CI, local verification). Without a PR, testing, risk and undo go in integration commit body (`panel-and-rounds.md` §10) |
| 5 | Risk-based human approval | 0, 1 or 2 people by change level | `risk-levels.md`: skill classifies and shows proof; does not approve |
| 6 | Integration, flags, gradual rollout | rerun all against latest trunk; internal flags first; channels before stable | project. Skill only confirms review applies to entering SHA (rebase and post-review commits, `panel-and-rounds.md` §9) |
| 7 | Fast detection and rollback | flags disabled without deploy, reverts, on-call; every incident asks which layer should have caught it | project. Skill supplies undo and turns answer into lesson and eval case (`learning.md`) |

**Nightly review of old code.** The article has agents hunt old bugs nightly. Here there are no
self-initiated scans: old code is audited only on explicit human request (`maintenance.md`). During
review, what existed on the base is Pre-existing on one line.

## What stays with humans

- Decide whether it is worth doing: direction, preferences, scope. Early, not blocking completed work.
- Highest-risk code (always-high paths in `risk-levels.md`).
- Architecture that will be copied.
- **Read evidence**: test output, commands, screenshots, findings and responses. If you cannot
  say what checks would miss, request a real review.
- Own the outcome: whoever requested the change answers for it.

## When “the integrator owns it” works

It works without blame when changes are small, everything is reversible, the bar follows blast
radius, telemetry is fast and incidents assess systems rather than people. If any fails (a diff
over 1,000 lines, irreversible migration, no production effect visibility), raise level or split
before review.

## Three lessons from the article shaping the skill

- **Noise costs more with agent authors**: the agent fixes every comment, each costing another
  commit and round. Hence: no style, at most 3 Nits, confirmation before reaching the author.
- **Unbounded rounds do not converge**: an agent author and reviewer once ran over 50 rounds in
  a night. Hence: level-based limits, new diff only, no repeating closed findings.
- **Many repeated findings were old code**. Hence: Pre-existing on one line, outside backlog and fix.

## Trunk work without PRs

- PR → `<base>..<reviewed-sha>` on a short branch, or unintegrated commits.
- Inline comments → consolidated report, one finding per line with `file:line`.
- PR description → integration commit body (`Risk:`, `How to undo:`, `Review:`).
- Merge queue → rebase checked with `git range-diff` before integration.
- Two approvers → with one human there is no second: more lenses and verifier, human reads proof.
