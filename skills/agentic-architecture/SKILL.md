---
name: agentic-architecture
description: >-
  Assesses an existing codebase for architectural friction and module deepening, compares
  interfaces and hands an agreed refactor to agentic-feature. Use for architecture assessment or
  design; use agentic-fix for a specific bug and agentic-project for a new project.
  Not for a feature (agentic-feature) or a fix (agentic-fix).
---

# agentic-architecture

Host differences, installations, tool substitutes and sibling resolution follow
`<agentic-project>/references/host-compatibility.md`; find that sibling through
`$AGENTIC_PROJECT_DIR` first and read the reference when the host varies.

Find where architecture holds back people changing the code and propose **deepenings**: refactors
that replace shallow modules with a deep module, making the code easier for agents to test and
navigate. You explore, measure and propose; the human chooses the candidate and decides the design
in the grill; `agentic-feature` executes it.

The terms (module, interface, implementation, deep and shallow, seam, adapter, leverage,
locality, deletion test) have the meanings in `references/vocabulary.md`: read it before step 2
and use them exactly in candidates, the report, the grill and the final request. The domain
glossary names the modules; the vocabulary names the architecture.

Repo rules override this skill: `AGENTS.md`/`CLAUDE.md`, ADRs and the glossary.

The siblings `<agentic-feature>` (`$AGENTIC_FEATURE_DIR`), `<agentic-design>` (`$AGENTIC_DESIGN_DIR`)
and `<agentic-implement>` (`$AGENTIC_IMPLEMENT_DIR`) follow the common reference; paths, prefixes
and order are not repeated here. Without a Skill tool, read the found `SKILL.md`.

## 1. The domain model

In the project repo, read whatever exists: the glossary (`GLOSSARY.md` or whatever
`AGENTS.md` names), ADRs (`docs/adr/` or equivalent), `AGENTS.md`/`CLAUDE.md`,
`ARCHITECTURE.md` and the area map (`.agentic/areas.json`). ADRs record decisions this
skill does not reopen (step 3, “Conflict with an ADR”).

Done when you have the list of domain terms you will use and ADRs affecting the areas to
explore, or have written “no glossary” and “no ADRs”.

## 2. Candidates with evidence

**Where to look.** Deepening a module pays off in subsequent changes to it, so give weight
to where code changes most (YAGNI). Decide where to look before looking:

- choose a history window (`--since=<date>`) and declare it: the counts under “Measure”,
  the order in step 3 and the report header use it, even when the human gave a direction;
- if the human gave a direction (a module, an area, a pain point), use it and skip the next point;
- otherwise, count changes per file in that window and start with the most frequent:
  `git log --since=<date> --name-only --format= -- <folders> | grep . | sort | uniq -c | sort -rn`.
  If changes are spread out with no hotspots, widen the window or folders.

**Explore.** Launch a subagent to walk those areas (without subagents, do it yourself). No
rigid heuristics: note where there is friction.

- Does understanding a concept require jumping between many small modules?
- Where are modules shallow, with an interface almost as complex as the implementation?
- Where were pure functions extracted just to test them, while defects live in how they
  are called (no locality)?
- Where do coupled modules leak through the seam?
- Which parts lack tests, or are hard to test through their interface?

**Measure.** Each candidate carries evidence, measured and never estimated, with the command that produced it:

- **change frequency**: commits touching its files within the declared window,
  counted per commit (summing file counts counts a commit touching several files twice):
  `git log --since=<date> --format=%H -- <candidate files> | wc -l`;
- **coupling**: callers (`grep` of imports: the total and each `file:line`), places
  where a caller uses its internals (`file:line`) and co-change, meaning how many of
  those commits changed each file outside the candidate:
  `git log --since=<date> --full-diff --name-only --format= -- <candidate files> | grep . | sort | uniq -c | sort -rn`;
- **deletion test**: imagine deleting it and say where the complexity goes, with N counted: if
  it disappears, it was pass-through; if it reappears in N callers, it earns its place. A candidate's
  signal is complexity concentrating in one place when shallow modules merge, rather than
  moving elsewhere;
- **interface**: what a caller must know to use it (inputs, ordering, errors,
  configuration), with `file:line`.

A number you have not measured does not go in: state what remains unmeasured in the candidate.
Classify each one's dependencies using the four categories in `references/deepening.md`.

Done when each candidate has its files, a one-sentence problem, dependency category
and the evidence above, with commands, numbers and `file:line` references.

## 3. Visual report

Write the report following `references/report.md`: a standalone HTML page, one section per
candidate with before/after diagrams, the evidence from step 2 and recommendation strength,
then the top recommendation at the end. This is a screen for the human to read: follow `agentic-design` UI rules.
Order candidates by strength (strong, worth exploring, speculative), then within each strength
by change frequency, highest first.

- **With the Artifact tool**: publish it as a page using the tool's procedure
  for a new page (through the `artifact-design` skill); where that contract and
  `report.md` differ, the contract wins. Give the human the link.
- **Without it**: save the file outside the repo, in the session's temporary folder (the scratchpad,
  if the agent has one; otherwise `$TMPDIR`, or `/tmp`), as `architecture-review-<date-time>.html`, open it
  (`open` on macOS, `xdg-open` on Linux, `start` on Windows) and give its absolute path.

**Conflict with an ADR.** Include a candidate contradicting an ADR only if the friction justifies
reopening it, and say so in its section (“contradicts ADR-0007, but worth reopening because…”).
Leave out theoretical refactors forbidden by an ADR.

Do not propose interfaces yet: they belong in step 5.

Done when the `agentic-design` detector exits 0 on the page (`references/report.md`,
“Style”), the report is published or saved, the human has the link or path, and each
candidate has the evidence from step 2.

## 4. The human's choice

Ask “Which of these do you want to explore?”, with the top recommendation first and a one-line reason.
The human chooses; “you choose” is valid and selects the top recommendation, recorded as
delegated. A rejection with a substantive reason leads to the ADR offer in `references/grill.md`
(“Along the way”).

Done when the human has named a candidate, delegated the choice, or said none: in that case
stop here, having written any ADRs they accepted.

## 5. Grill the candidate

Follow `references/grill.md`: one question at a time, each with your recommendation, through
the candidate's decision tree: constraints, dependencies and their categories, the shape of the deepened
module, what stays behind the seam and which tests survive. You look up facts;
the human makes decisions.

Design the interface twice, following `references/design-it-twice.md`: show the problem space
to the human, produce 2 radically different designs (a third only on request), compare depth,
locality and seam placement, and give your recommendation. The choice returns to the grill as a decision.

The seam and tests follow `references/deepening.md`: dependency category determines how to
test through the seam, one adapter is a hypothetical seam and two are a real seam, and new
tests replace old ones instead of piling up.

Done when the following are decided, each with its origin (human or delegated): **interface**
(inputs, invariants, ordering, errors, configuration), **seam** (placement, adapters and
dependency category) and **tests** (new ones at the interface and old ones to delete); and
when the human has confirmed the shared understanding.

## 6. Execution through agentic-feature

Run the refactor through `agentic-feature`: invoke it with the Skill tool (in the plugin,
`agentic-skills:agentic-feature`; in Codex, `$agentic-feature`) or, without it, read
`<agentic-feature>/SKILL.md` and follow it. The request carries the agreed design so its grill
does not reopen it:

- the candidate and evidence (report link or path);
- the interface, seam, adapters and dependency category;
- what the implementation hides behind the seam;
- new tests at the interface and old ones to delete;
- the decision table from step 5, each decision's origin, and glossary and ADR
  changes.

The route, spec, lanes and review belong to `agentic-feature`. If the human asked only for
planning, say so in the request: it has a “Plan only” mode.

Done when `agentic-feature` has started with the request or, if the human deferred it,
when you have given them the full request and the line “Next step: invoke agentic-feature with this
request”.

## In other agents

The steps stay the same; the tool changes, and you state the substitution in one line:

- **Without subagents**: exploration in step 2 and designs in step 5 run sequentially.
- **Without AskUserQuestion**: questions go in chat, one at a time, in the format of
  `references/grill.md`.
- **Without Artifact**: the report stays in the HTML file from step 3.
- **With the `mattpocock-skills` plugin**: `codebase-design` and `grilling` are this method's
  English sources and can accompany it; where they differ (one question at a time, measured evidence,
  execution through `agentic-feature`), this skill wins.

Method origin, changes and license: `references/origin.md`.
