# Grill the candidate

For step 5. The goal is shared understanding with the human about the chosen candidate's
design, decision by decision, until nothing remains silently assumed.

## The decision tree

Each decision unlocks those depending on it. The **frontier** consists of decisions whose
prerequisites are resolved: ask only those now. For the candidate, the tree covers constraints,
dependencies and their categories (`references/deepening.md`), the deepened module's shape,
what stays behind the seam and which tests survive. Handle the interface question through
`references/design-it-twice.md`.

## One question at a time

Ask a question, wait for the answer, recalculate the frontier and ask the next: each answer
changes the tree. Each question puts the recommendation before the context:

```
**Q<n>. <decision title>**
Recommendation: <your answer>, because <one line>.
<1 to 2 lines of context, with the motivating fact and file:line; options if there are more than two>
```

Write it so “yes” accepts the recommendation. With AskUserQuestion, one question per
call; otherwise, in chat.

## Facts are yours, decisions are theirs

Look up a fact answered by code, docs, history or the report yourself, or send a
subagent; do not ask it. While a subagent searches, only questions depending on that fact
wait. Decisions belong to the human: send each with a recommendation and wait for the answer.
“You choose” closes pending decisions with your recommendations, recorded as delegated.

## Along the way

Carry out side effects as soon as a decision is clear:

- **A deepened module named after a concept missing from the glossary**: add the term
  to the domain glossary (and create the file if absent).
- **A vague term refined in conversation**: update the glossary immediately.
- **The human rejects the candidate with a substantive reason**: offer an ADR like this: “Would you
  like me to record this in an ADR so future architecture reviews do not suggest it again?”. Only
  when a future explorer would need the reason to avoid repeating the suggestion; temporary
  (“not worth it right now”) and obvious reasons do not warrant an ADR.

The term format follows `<agentic-project>/references/project-grill.md` (“Glossary”), and
ADRs follow `<agentic-project>/references/architecture.md` §6. With the
`mattpocock-skills:domain-modeling` plugin installed, you may use it for the glossary and ADRs,
telling it the project's glossary filename.

## When it ends

When the frontier is empty: every branch visited and the interface, seam and tests
decided. Show the decision table with each origin (human or delegated) and ask for
confirmation of shared understanding. Without it, step 6 waits.
