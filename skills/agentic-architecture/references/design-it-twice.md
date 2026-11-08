# Design it twice

For step 5, when the chosen candidate's interface question comes up. Based on “Design It
Twice” (Ousterhout): the first idea is rarely the best. Terms follow
`references/vocabulary.md`.

## 1. The problem space

Before launching subagents, write the candidate's problem space for the human:

- constraints any new interface must meet;
- dependencies it relies on and each one's category (`references/deepening.md`);
- an illustrative code sketch, only to make constraints concrete: not a proposal.

Show it and proceed straight to point 2: the human reads and thinks while subagents work.

## 2. The designs

Launch 2 subagents in parallel, with constraints 1 and 3 below by default; a third only when the
human asks or the seam crosses dependencies (constraint 4). Each produces a **radically different**
interface for the deepened module. Without subagents, produce the designs yourself, one at a time, each with
its own constraint.

Each subagent gets its own technical brief, independent of the explanation in point 1: file
paths, coupling details, dependency categories and what stays behind the seam. Include
`references/vocabulary.md` and the domain glossary so names match the architecture and domain,
and a different constraint for each:

1. “Minimize the interface: 1 to 3 entry points at most. Maximize leverage per
   entry point.”
2. “Maximize flexibility: many use cases and extensibility.”
3. “Optimize for the most frequent caller: make the default case trivial.”
4. (If applicable.) “Design around ports and adapters for dependencies crossing the
   seam.”

Each design includes:

1. the interface (types, inputs, parameters, plus invariants, ordering and failure modes);
2. a caller usage example;
3. what the implementation hides behind the seam;
4. dependency strategy and adapters (`references/deepening.md`);
5. tradeoffs: where leverage is high and where it is thin.

## 3. Show and compare

Show designs one by one so the human can absorb each, then compare them in prose by
**depth** (leverage at the interface), **locality** (where change concentrates) and
**seam placement**.

After comparing, give your recommendation: the strongest design and why, or a hybrid when
parts of different designs fit well together. Have a firm opinion: the human wants a strong
reading, not a menu. The choice returns to the grill (`references/grill.md`) as the next question,
with this recommendation.

Done when the human has the designs, comparison and recommendation in front of them, and you
have asked the choice question.
