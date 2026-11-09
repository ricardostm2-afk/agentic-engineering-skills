# Reading context (step 1a)

Goal: reach checkpoint 1 knowing more than the human about code state, so questions concern only
decisions and suggestions save real work.

This step prevents **plans proposing to build what already exists**. That happens when plans
start from request descriptions rather than code. Reading precedes any plan; every claim has a
file path. An old `.md` (plan, handoff, report) is a clue, not a fact: confirm in code or running
system (command, screenshot) before adding to Reading; doc-only claims support no suggestion.

## What to investigate

In order; record each fact and where you saw it (`path:line`).

1. **Project rules**: `AGENTS.md`, `CLAUDE.md`, `.specify/memory/constitution.md`, ADRs (`docs/adr/`
   or equivalent), `GLOSSARY.md`/glossary, `DESIGN.md`/UI guide, area README, `REVIEW.md` (what review
   seeks). Note rules feature could violate; whether `.specify/` exists (step 4) and board exists
   (CLI named by `AGENTS.md`/`CLAUDE.md`, or `.agentic/board/`).
2. **Where it fits**: owning area/module (area map if present, e.g. `.agentic/areas.json`); touched
   routes, services, tables, screens.
3. **What exists**: search requested and similar behavior, not only human's name. Domain synonyms,
   table/entity names, screen text, related verbs (`export`, `download`, `csv`, `report`…). Also
   dead/half-built code (disabled flags, routes without screens, screens without routes). Half-built
   may mean “connect”, not “build”.
4. **Data writers/readers**: for every read value, find writer (search field in application code,
   not only schema). Zero writers = data does not practically exist. For new data, who will read it.
5. **Entry point**: how user reaches feature today (menu, button, link, notification, API). No
   path means checkpoint 1 decision.
6. **Permissions**: roles, server refusal location, deciding function. Screen-only visibility
   decisions need noting: rule must come from server.
7. **Area tests/checks**: where tests live, exact commands, duration, real dependencies (database,
   queue) versus mocks, verification suite/CI. Reuse an applicable baseline under
   `<agentic-implement>/references/evidence.md`; run only missing/invalid evidence. Pre-existing
   red changes the plan.
8. **Risks**: personal/sensitive data, large-table migrations, unindexed queries, concurrency (two
   simultaneous users), timezone/dates, customer/organization isolation, external service costs.
9. **UI**: design system (tokens, shared components, `DESIGN.md`), 2–3 neighboring screens before/
   after, target resolutions. Capture neighbors if browser available; step 3 agentic-design uses them.
10. **History**: `git log --oneline -- <area-paths> | head -20`, recent messages; earlier feature
    attempts and why they stopped.

## Investigating a large repo

Launch 2–4 parallel reading subagents, one per question (“where X lives and callers”, “Y tests and
commands”, “screens/components showing Z”). Each returns sourced path/line facts in ≤300 words,
no proposals. You combine and decide. Pass filenames/concepts, never personal data.

Stop once you have touched-file map, existing behavior, each data writer/reader, verification
commands, risks. More reading then is postponement.

## Writing suggestions

Suggestions are Reading's value to human. Each concretely changes request or implementation with
evidence and effect:

- **Reuse**: “component X at path already does 80%; extend rather than create”.
- **Cut**: “request includes Y, but no screen reads it; leave it out”.
- **Simplify**: “a field in Z suffices instead of a table, because…”.
- **Unmentioned risk**: “W has ~2M rows; migration blocks writes; use two phases”.
- **Order**: “read side first delivers value without migration”.
- **Missing connection**: “engine exists at path, no route calls it”.

Not suggestions: repeating request, generic advice (“good test coverage”, “consider security”),
options without recommendation, claims without filepath (research findings need URL and dates).
Return **0–3 evidence-based suggestions**. Zero is valid when the requested approach already
fits the evidence; do not invent improvements or expand scope to fill a quota.

## Output

Fill `assets/reading.template.md` as `reading.md` in a session temporary folder outside repo; show
in chat. Step 4 moves to feature folder (`specs/<NNN-slug>/`). Reading's open questions, impact
ordered, seed step 2 grill.

Write facts in 1a; finalize Suggestions/Recommended approach after the conditional research check
in 1b (`references/current-research.md`). When research is needed, its `research-notes.md` shares
the temporary folder; otherwise record why local evidence suffices.
