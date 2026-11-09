# Architecture (phase 3)

Goal: choose an architecture the human understands and can afford, and agents can develop with
fast feedback. Architecture is the project's most expensive decision to reverse; propose
options and costs rather than imposing it.

Read only for a selected architecture module. Keep the procedure proportional to the material
decision: existing/small repo preparation does not require this audit, a new stack comparison,
an area-map file, radar or an ADR. Use existing docs/decisions where they already answer the need.

## Adopt mode

In a repo with code, architecture already exists: do not propose options from scratch. Audit
it against constraints (§1) and agent suitability (§3): what works, what is missing (e.g. no
single-command startup, no typecheck, slow tests), what contradicts phase 2 decisions. Propose
only changes justified by a constraint, each with a cost; a large migration is a human decision
and, if approved, goes into the backlog (phase 9), not this session. Apply §4–§7 to existing
code: actual modules and an area map of real folders.

## 1. Deciding constraints

Before an open material choice, list the constraints that actually decide it, using existing
context or `docs/decisions.md` and `docs/prerequisites.md` when present
(e.g. “personal data stays in the chosen region”, “50 currency units/month ceiling”, “one
operator”, “10× Monday peaks”). Evaluate each option against these; otherwise comparison is taste.

## 2. Options (2–3) with trade-offs

For each: 3-line description, minimal text diagram, and this table:

| Criterion | Option A | Option B |
|---|---|---|
| Estimated monthly cost (MVP and 10×) | | |
| Operating effort (who wakes up at 3 a.m.?) | | |
| Vendor lock-in / exit cost | | |
| Data region and subprocessors | | |
| Agent suitability (see §3) | | |
| Stable version and support (source, date) | | |
| Measured in skeleton (build, tests, typecheck) | | |
| Main risks | | |

Costs: verify prices on official provider pages (`mattpocock-skills:research` if available,
otherwise the web tool). Without network access, give ranges, marking each “estimate, to
confirm” in the table and `docs/decisions.md`; the human must not decide on an apparently
verified number that was not checked.

End with **Recommendation** and a reason tied to constraints. Ask only a material unresolved
choice; carry an existing choice or delegation forward (“you choose” is valid).

Reasonable starting points, adjusted to constraints:
- Modular monolith + one relational database + server or PaaS. Simple to operate, easy to test
  locally, a good MVP default.
- Managed platform (BaaS/serverless). Less operation, more dependency and less predictable
  usage costs.
- Separate services only with a concrete constraint (separate team, very uneven scaling,
  legal isolation requirement). Almost never for an MVP.

Prefer boring, mature technology: agents know it better and make fewer mistakes. Boring means
mature and stable, at its current stable version with current capabilities; not old. Research
procedure and limits: `architecture-research.md`.

## 3. Agent suitability

Good architecture for agents makes every change quick to verify without a shared environment:
- **Everything runs locally with one command** (database included, e.g. in a container) and
  synthetic test data.
- **Typed language** and fast typecheck: catches errors that would otherwise wait for tests
  or production.
- **Area checks in < 2 min**: tests runnable for only the changed folder.
- **Deterministic tests**: controllable clock, randomness and network.
- **Clear boundaries**: every area has an owner and checks (area map), preventing collisions
  between parallel agents.

## 4. Deep modules

Terms (deep/shallow module, interface, seam, adapter, delete test) follow
`<agentic-architecture>/references/vocabulary.md`: read it before designing modules.
`mattpocock-skills:codebase-design`, if installed, is the same source in English. Prefer fewer
deep modules to many shallow pass-through modules; introduce a seam only when there are (or
really will be) two adapters, such as real and test adapters.

For each main module write: name (from glossary), one-sentence responsibility, interface in
3–5 lines, testable seams.

## 5. Area map

State which affected folders belong to each area, checks for changes there, and risk when needed
for planning or parallel ownership. Write `.agentic/areas.json` only with selected parallel setup
in phase 4; otherwise the existing repo instructions or a short scope map are sufficient:

```json
{
  "areas": [
    {
      "area": "checkout",
      "folders": ["src/checkout/", "db/migrations/"],
      "checks": ["npm run -s typecheck", "npx vitest run src/checkout"],
      "risk": "high",
      "notes": "money in integer minor units; never edit migrations after application"
    }
  ]
}
```

`risk` uses `high`, `medium` or `low`, matching the phase 4 script. `high` = personal data,
permissions, tenant isolation, payments, migrations, external integrations; agentic-feature uses
Complete and security review in these areas. `medium` is the normal route; `low` is limited,
reversible impact. Hooks, CI and installers are not `high` just because of their kind:
`agentic-code-review` recognizes their paths and adds the security lens and verifier without
raising planning or rounds. Do not invent extra levels or extra gates for `medium`. Use the
project test runner's command in `checks`; before writing it, prove it runs at least one test
(“Area map” in `git-environment.md`).

## 6. Irreversible decisions and ADRs

Highlight hard-to-reverse decisions (database, multi-tenant model, auth provider, region,
language). Write an ADR in `docs/adr/NNNN-title.md` only when all three conditions hold: hard to
reverse, surprising without context, and a real trade-off. Never rewrite an accepted ADR:
append a dated section (“## Addendum YYYY-MM-DD”, e.g. missing research table), or supersede it
with a new ADR saying “Supersedes NNNN” and mark the old one `Status: superseded by MMMM`.
Format:

```markdown
# NNNN. Title

Status: accepted (YYYY-MM-DD) · Decided by: human | delegated

## Context
<constraints, 3–6 lines>

## Decision
<what was chosen>

## Consequences
<what gets easier, harder, and what it requires>

## Alternatives considered
<one line each with rejection reason; for the stack ADR, §2 table with source and date>

Review on: <date or trigger>
```

## 7. `ARCHITECTURE.md`

Short (target ≤ 150 lines), written for agents and the human six months from now:
1. 5-line overview and text diagram.
2. Modules (from §4).
3. Main data flows (origin, storage and readers of each personal datum).
4. Area map when relevant (link `.agentic/areas.json` only if it exists).
5. How to run and verify locally (exact commands).
6. Irreversible decisions linked to ADRs.

Do not repeat what `grep` or the folder tree reveals.
