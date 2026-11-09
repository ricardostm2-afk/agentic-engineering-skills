---
name: agentic-architecture
description: >-
  Assesses architectural friction in existing code, designs module boundaries and interfaces,
  or hands an authorized refactor to agentic-feature. Use for architecture assessment or design;
  assessment stops with evidence and priorities. Use agentic-project for a new project,
  agentic-fix for a specific bug and agentic-feature for a feature.
---

# agentic-architecture

Find where architecture makes real changes harder, and recommend useful **deepenings**: simpler
interfaces that hide meaningful implementation complexity. Preserve repository rules, accepted
ADRs and domain vocabulary. Inspect before proposing; measure instead of guessing.

Host differences and sibling/third-party resolution follow
`<agentic-project>/references/host-compatibility.md`; locate that sibling through
`$AGENTIC_PROJECT_DIR` first. Resolve `<agentic-feature>` (`$AGENTIC_FEATURE_DIR`) for refactor
handoff and `<agentic-design>` (`$AGENTIC_DESIGN_DIR`) only for an actual page. Without a Skill
tool, read the resolved `SKILL.md`; do not invent commands or substitute another provider.

Refactor test recipes may refer to `<agentic-implement>` (`$AGENTIC_IMPLEMENT_DIR`); resolve it
through the same common reference only when needed.

## 0. Select the mode

Infer the requested stopping point immediately and state scope in one line.

| Mode | Intent | Complete when |
|---|---|---|
| **Assess** (default) | Review architecture, find friction, prioritize improvements | Source-backed findings, measured evidence, priorities and limits are delivered |
| **Design** | Explore a named candidate or agree a material boundary/interface choice | Recommendation and relevant interface/seam/test decisions are documented |
| **Refactor** | Implement or carry an agreed architectural change through delivery | The agreed request has entered `agentic-feature` and its authorized execution path |

An assessment ends after step 3. Do not require candidate choice, a grill, alternatives, an HTML
report, ADR creation or implementation to finish an assessment. In design/refactor mode, reuse
a candidate or decision already selected by the user. Ask only material unresolved questions.
Routine reversible choices within authorized scope are the agent's to make; record the reason.

Text with an evidence table and useful diagram is the default report. Generate HTML only when
requested or justified by a substantial comparison that benefits from navigation/shareability.
A small module needs neither a page nor subagents. Delegate independent areas/designs only when
that saves time or adds a useful perspective; otherwise inspect directly. Keep scope local when
the user named a module or pain point.

## 1. Domain model and constraints

Read applicable `AGENTS.md`/`CLAUDE.md`, relevant glossary entries, accepted ADRs and architecture
docs, plus the area map if present. Do not create missing files merely to complete this step.
Record “no glossary” or “no ADRs” when absent. Read `references/vocabulary.md` before analysis:
module, interface, deep/shallow, seam, adapter, leverage, locality and deletion test retain those
meanings. The domain glossary supplies names; this vocabulary supplies architecture terms.

Identify the constraints and existing decisions affecting the area. Accepted ADRs are not silently
reopened. A candidate contradicting one needs demonstrated friction, the exact ADR and a reason
to revisit it; leave out theoretical refactors forbidden by existing decisions.

## 2. Candidates with evidence

**Scope first.** If the user supplied a direction, inspect that area. Otherwise choose and state
a history window (`--since=<date>`) and start with files changing most:

```sh
git log --since=<date> --name-only --format= -- <folders> | rg . | sort | uniq -c | sort -rn
```

Use one declared window for comparisons; widening it requires saying why. If history is absent,
state that limitation and use actual callers/tests/change requirements, never invented frequency.
Do not scan the whole repository solely to assess a small named module.

**Explore friction.** Look for concepts scattered across shallow wrappers, interfaces nearly
as complex as their implementations, coupled modules exposing internals, tests detached from
real call paths, and meaningful behaviour that cannot be tested through the public interface.
A pure function or small file is not by itself an architectural defect.

**Measure each candidate**, with commands and `file:line` references:

- **Change frequency:** commits touching candidate files within the window, counted per commit:
  `git log --since=<date> --format=%H -- <candidate files> | wc -l`.
  Do not sum per-file counts and double-count commits.
- **Coupling:** actual callers/imports (total and locations), uses of internals, and co-change
  outside the candidate:
  `git log --since=<date> --full-diff --name-only --format= -- <candidate files> | rg . | sort | uniq -c | sort -rn`.
  Separate search candidates from verified call sites.
- **Deletion test:** reason about where complexity would go if removed. If it disappears, the
  module is pass-through; if it reappears in N callers, count N and show those callers. Label
  this counterfactual reasoning; it is not an executed measurement.
- **Interface:** what a caller must know (inputs, ordering, errors, configuration), with locations.

Unmeasured values stay explicitly unmeasured. Classify dependencies using
`references/deepening.md`. Each candidate needs its scope/files, one-sentence problem, dependency
category, measured evidence and the reason a deepening would reduce future work. Distinguish an
observed defect, an architectural hypothesis and a speculative improvement.

## 3. Findings and priorities

Deliver findings in chat or the requested document. Use `references/report.md` for the evidence
fields and optional page procedure. Put the recommendation and practical implication first;
order candidates by strength (**strong**, **worth exploring**, **speculative**), then by measured
change frequency within the strength. Explain missing measurements instead of treating them as zero.

Use a current-state diagram when it clarifies coupling. An assessment may sketch a possible
deepening, labeled as a hypothesis; it does not need an agreed interface or mandatory before/after
diagrams for every candidate. Include ADR conflicts and the reason to reopen them.

**Assess stops here**, with evidence, priorities and limits. A short suggested next step is enough;
do not ask “Which candidate?” as a required completion gate or start a refactor.
For an actual HTML page, use the report's applicable visual checklist, detector and browser proof;
text reports do not require UI tooling.

## 4. Resolve a candidate only when needed

For design/refactor, reuse the supplied candidate, explicit delegation or clear scope. Ask for a
choice only when several material directions remain and choosing changes product commitments,
scope or a hard-to-reverse decision. Give the top recommendation and a reason. “You choose” is
valid; record delegated origin and proceed without another confirmation of that delegation.
If the user declines, deliver the findings. A substantive lasting rejection may justify an ADR
under `references/grill.md`; temporary preference alone does not.

## 5. Design to the uncertainty

Carry existing decisions forward. Read `references/grill.md` only for a material unresolved
design question. Investigate facts yourself; ask one dependent question at a time, with a
recommendation. Do not interview merely to populate a decision table.

Use `references/design-it-twice.md` when materially different interface/seam designs have real
trade-offs, or the user requested alternatives. Compare two real alternatives then; a small
local refactor with an established interface can keep it and explain the choice. A third design
needs a concrete unresolved question. Parallel subagents are optional, not part of the definition
of design quality.

Retain the seam and test rules in `references/deepening.md`: dependency category informs how to
test through the seam; one adapter is hypothetical and two are real; replacement tests displace
redundant ones instead of accumulating them.

Design is complete when the necessary **interface** (inputs, invariants, ordering, errors,
configuration), **seam/adapters** and **test strategy** are clear, with origins (existing ADR,
human, delegated or agent within scope). Confirm only a material unresolved commitment; an
already agreed design is not sent through another approval gate. Design-only work ends here.

## 6. Authorized refactor through agentic-feature

For refactor mode, invoke `agentic-feature` (or read its resolved `SKILL.md`) with:

- the candidate, scope and evidence (text or report link);
- agreed interface, seam, adapters and dependency category;
- implementation complexity hidden behind the seam;
- required interface tests and any obsolete tests to remove;
- decisions and their origins, relevant glossary/ADR changes, and verification limits.

Do not reopen settled design choices. The route, spec, lanes, review and execution belong to
`agentic-feature`. Carry the original implementation authorization forward. If the user asks
to defer execution, deliver the complete handoff request instead; a recommendation alone is
not implementation authorization.

## Sources and optional references

`references/vocabulary.md` and `references/deepening.md` preserve the method's definitions and
measurement/test reasoning. `references/report.md` covers output; `references/grill.md` and
`references/design-it-twice.md` are conditional design tools. Method origin and license:
`references/origin.md`. If installed, `mattpocock-skills:codebase-design` and `grilling` may
supply background through the common resolver; this skill's mode boundaries take precedence.
