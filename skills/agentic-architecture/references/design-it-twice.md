# Compare material interface alternatives

For design/refactor mode when materially different interfaces or seams have real trade-offs, or
the user requested alternatives. Skip for assess-only work and small local refactors with an
established interface. Explain the preserved interface instead of inventing a second design.
Terms follow `references/vocabulary.md`; the method derives from “Design It Twice” (Ousterhout).

## 1. Bound the question

Record the constraints every design must meet, actual callers/coupling and the dependency
categories (`references/deepening.md`). A small illustrative code sketch can make constraints
concrete without being the preferred solution. Reuse settled decisions.

## 2. Produce two distinct designs

Choose two constraints that expose a real trade-off, for example:

- minimize the interface and maximize leverage per entry point;
- make the most frequent caller simple;
- support a known second use case with a different ordering/failure model;
- place a seam around real dependencies and their adapters.

Produce both directly for a small scope. Delegate independent designs only when the comparison
benefits enough to justify the cost; no subagent quota. If delegated, each brief carries code
paths, coupling evidence, dependency categories, vocabulary and glossary, and a distinct design
constraint. A third design needs a specific unresolved question or a user request.

Each design includes its interface (types, inputs, invariants, ordering, failure modes), a real
caller example, complexity hidden behind the seam, adapters/testing strategy and trade-offs.
Do not present equivalent wrappers as radically different alternatives.

## 3. Compare and recommend

Compare depth (leverage), locality (where change concentrates), seam placement and the constraints
that actually distinguish the designs. Give a firm recommendation and reason; a hybrid is useful
only when its combined contract remains coherent.

Ask for a choice only if it is a material unresolved human decision. Apply prior delegation or
make an authorized reversible choice without another gate. Record the chosen interface and why;
return any still-open commitment to `references/grill.md`. Done when the comparison resolves the
relevant uncertainty, not merely when two subagents or a choice question have been produced.
