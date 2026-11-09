# Resolve a material design question

For design/refactor mode, only when a consequential interface, seam or scope decision remains.
Assess mode ends with evidence and priorities; do not load this interview merely to close it.

## Decision frontier

Carry forward accepted ADRs, the user's chosen candidate and prior decisions/delegation. Identify
only unresolved questions that change scope, callers, invariants, dependencies or verification.
Look up facts in code/docs/history yourself. A local reversible choice within the authorized scope
can be made and explained by the agent; it does not need a human question.

Resolve prerequisites before dependent decisions. Use `references/deepening.md` for dependency
categories and test seams. Read `references/design-it-twice.md` only when materially different
interface designs offer real trade-offs or alternatives were requested.

## Questions

Ask one dependent question at a time, with a recommendation first:

```
**Q<n>. <decision title>**
Recommendation: <answer>, because <one line>.
<1–2 lines with the motivating evidence and file:line; meaningful alternatives if needed>
```

Use the available question tool or chat. “You choose” resolves the choice with the recommendation,
recorded as delegated. Do not ask again about a delegated or already accepted decision.
If there is no material unknown, skip the interview and document the scoped choice.

## Lasting records

Keep glossary/ADR changes proportional to the request:

- If a new shared domain term is needed, update the existing glossary or include its definition
  in the design. Create a glossary only when it will serve subsequent work.
- If a substantive rejection would otherwise be repeatedly rediscovered, consider an ADR.
  Temporary “not now” or obvious reasons do not warrant one.
- Apply `<agentic-project>/references/architecture.md` §6: an ADR needs a hard-to-reverse,
  surprising decision with a real trade-off. Never rewrite an accepted ADR; append a dated
  addendum or supersede it explicitly. Reuse existing authorization to document a decision;
  ask only for a material commitment not already authorized.
- Domain term format follows `<agentic-project>/references/project-grill.md`. Optional
  `mattpocock-skills:domain-modeling` uses the common resolver and the project's real glossary path.

## Completion

Record the necessary interface, seam/adapters and test strategy with each origin (existing ADR,
human, delegated or agent within scope). Show the resulting understanding. Confirmation is
needed only for a material unresolved commitment; do not create a second approval gate after
the user has chosen or delegated. Design-only work stops here; authorized refactor continues
through `agentic-feature` with these decisions intact.
