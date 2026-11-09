# Working methodology with agents (phase 8)

Goal: the human thinks only about the right decisions (product, money, irreversible actions);
agents do the rest, with proof. Use this file to write the project's `docs/methodology.md`,
adapted to its decisions (project rules take precedence).

Only for a selected ongoing team-process module. Minimal bootstrap and a simple backlog do not
need this file, lessons, a radar or a board. Link only artifacts the project actually uses.

`docs/methodology.md` describes **process** (cycle, roles, done, pitfalls). Do not repeat rules:
point to the constitution for principles and `AGENTS.md` for hard rules. In the same phase,
create `docs/lessons.md` with just a heading and a format line for retrospective lessons.

`<agentic-feature>` and `<agentic-code-review>` are sibling skill folders (search in `SKILL.md`).
In project `docs/methodology.md`, use versioned copies (`.agentic/…`) where available; otherwise
use skill names, never paths from your own machine.

## Cycle

```
request → triage (size and risk) → agentic-feature (read → scoped research if needed → resolve material decisions → implement → review) → integration → delivery
```

- **Triage**: effort scales with risk. Standard (ordinary feature: light spec); Complete (data,
  permissions, payments, sensitive records, integrations, `risk: high` areas, over 1 week: full
  spec + security review); Too big (slice before starting). Hooks, CI and installers get the
  security lens and verifier at review without raising planning or rounds. A `type: escaped`
  lesson in the same area (`docs/lessons.md`, last 30 days) raises the route one level, never
  above Complete; `type: repeated` does not. agentic-feature performs triage. Fixing existing
  wrong behavior (label, rounding, error) uses `agentic-fix` instead.
- **Scoped research when needed**: research new/changed components, material unknown currentness
  or an explicit audit. Start with existing version/target-matched evidence and relevant radar
  entries if present; reuse them until a relevant dependency, constraint or review trigger
  invalidates them. Do not refresh the whole stack each feature. Modern is not fashion: stable,
  target coverage and measurable gain only; material changes to project decisions become questions.
  Method: `<agentic-feature>/references/current-research.md`.
- **Detector at review**: for every UI slice, before requesting review,
  `node <detector> --diff <base>` must have no blockers on added or changed lines (untouched
  lines are Pre-existing: one report line, no backlog entry, `ui-without-slop.md` §7).
  `<detector>` is versioned `.agentic/detect-slop.mjs` or
  `<agentic-design>/scripts/detect-slop.mjs`; `<base>` is the slice's starting commit (on a
  branch, `git merge-base HEAD main`), never `main` after committing to `main` (analyzes 0
  files, exits 2: not proof). Proof includes “N file(s) analyzed”, N > 0 for UI changes.
  Reviewer uses the `ui-without-slop.md` checklist (`.agentic/ui-without-slop.md` or
  `<agentic-design>/references/ui-without-slop.md`): detector is the floor; hierarchy, lists
  and empty states need reviewer judgment. Pre-commit applies the same rule to staged content.
- **Continuous integration**: each green slice enters `main` the same day. No week-long feature
  branches.
- **Delivery**: record reusable new technology evidence where the project keeps it, with source,
  date, component/target scope and invalidation trigger. Update `docs/radar.md` only if it exists
  or maintaining one is justified; unchanged technology needs no repeated entry. Follow the
  agreed adoption authority and project policy; production deploy needs explicit authorization.
- **Short retrospective**: 3–5 lines per feature (went well, delayed, lesson) plus
  `radar: <entries or nothing>`. If something escaped (reverted, incident, human report) or
  the same class appears a second time in review, add one `docs/lessons.md` line in its heading's
  format (type `escaped` or `repeated`, base, defect → fix, expected `file:line`, class, layer);
  if the defense is mechanical, also add an automatic check.

## Roles

| Role | Who | Does | Does not |
|---|---|---|---|
| Human | product owner | decides product, priorities, money, irreversible actions; chooses variants | discover facts in code |
| Orchestrator | main Claude session | reads context, interviews, plans, splits lanes, writes briefs, integrates, verifies; conducts agentic-code-review (reviewer worktrees, level each round, consolidation) | implement large lanes itself |
| Agents | subagents/sessions in worktrees | implement a closed brief with TDD; integrate reviewer's acceptance test in Complete | expand scope, change files outside brief |
| Reviewer | agentic-code-review lenses: other agents, user's review model with fresh context, each in a worktree outside repo | reviews the reviewed SHA's diff against REVIEW.md with file:line for each finding; brings its own acceptance test per `<agentic-code-review>/references/panel-and-rounds.md` §3 | review own code; fix; commit; leave mutations |

## Limits and cadence

- **WIP ≤ 3 fronts per human**: more causes pending decisions to accumulate and agents to wait.
- **No calendar sprints**: continuous flow; weekly board review (stalled work, changed priorities,
  delegated decisions to review, ADRs with expired `Review on` or triggered conditions, invalidated
  evidence in active areas). Review cadence does not authorize a whole-stack refresh or generate
  backlog items automatically. Research checks relevant ADR/evidence triggers when needed.
- **Ask the human** only for a material unresolved product/scope/design commitment or an action
  still requiring authorization under the selected route. Reuse existing decisions and
  delegation. A new phase, optional missing artifact or unchanged evidence is not a new gate.

## Definition of done

With evidence:
1. green area tests and checks (command + output in commit or board);
2. end-to-end proof of requested behavior (see pitfalls);
3. independent review (`agentic-code-review`) covering integrated SHA (later changes follow its
   rules), no open Important, each answered (fixed, wrong, intentional, does not matter); for
   UI, also no detector blockers on added/changed lines;
4. updated project tracker if one is in use (board items include SHA and final state);
5. reusable new evidence recorded when relevant; no mandatory radar creation;
6. push done (trunk-based: `main`).

“Should work” is not done. “Ran X and got Y” is.

## Pitfalls of agent-written code

Real recurring errors. Each has the defense this process uses; include them in
`docs/methodology.md` and agent briefs.

- **Planning existing work** (plans to build what repo already has) → mandatory context reading
  before any plan: search similar code, routes, screens, docs; measure current state.
- **Author tests inherit author mistakes** (same misunderstanding in code and passing test) →
  independent reviewer brings a spec-based acceptance test, not code-based
  (`<agentic-code-review>/references/panel-and-rounds.md` §3).
- **Proving the primitive does not prove wiring** (function tested but route never calls it or
  UI never reaches it) → test end to end: request through real route/screen, effect where user sees it.
- **Built but unreachable** (no button, menu, route or permission reaches the feature) → verify
  reachability from normal entry with the right role.
- **Collected and ignored** (user field stored but unused) → every new datum has a named
  consumer in the spec; no consumer, no collection (data minimization too).
- **Fixtures/mocks replacing writes hide defects** (manually prepared state never exercises
  writer) → at least one test through the write path against real dependency (container
  database, real filesystem).
- **Skipping guards with exit 0 fail open** (missing variable/tool yields SKIP and green CI) →
  checks fail closed: unable to run means red with a message naming the missing part. Explicit
  exception: slop pre-commit only warns without a versioned copy (no UI); with UI, version it
  and fail closed (`git-environment.md`, Hooks).
- **Commit claims absent changes** (message describes excluded work or includes another agent's
  files) → explicit `git add` paths; compare message with `git show --stat HEAD` before push.
- **Tight timeouts and orphan children hang suites** (passes on fast machine, hangs under load;
  test server survives forever) → timeout headroom ≥ 2× largest measured duration; teardown
  kills children and confirms death.
- **Endless review** (every fix triggers more findings and rounds never end) →
  agentic-code-review's round and agent limits: from round 2 only new diff, Nits open no round,
  closed findings do not repeat; at limit, ask human, never silently add a round.
- **Old findings fixed incidentally** (review flags base code and author expands diff) →
  Pre-existing label (outside diff, `git blame` predating base); one report and retrospective
  line, neither this diff nor backlog.
- **Non-null defaults hide wrong queries** (wrong column returns plausible default and test
  passes) → discriminating test data: nondefault values, multiple records, multiple tenants.

## Skills map

Include `references/skills-map.md`'s “when → skill → how to invoke it” table in
`docs/methodology.md`, only installed skills, plus project skills/commands (take precedence
when they do the same job).
