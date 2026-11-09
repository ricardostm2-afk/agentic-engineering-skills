---
type: llm
focus: trace
weight: 1
---

PASS only when the visible tool calls AND their results establish this sequence:
1. A regression test or assertion exercises listOrders with dates inserted out of order and
   fails because the returned order is not oldest first. The failure occurs before the first
   production-code change, including changes through Edit, Write, Bash, or a subagent.
   Writing the regression test before that run is allowed.
2. The production fix happens after that observed failure.
3. The SAME regression test/assertion runs after the fix and passes with its ordering assertion
   retained, enabled, and not weakened. A passing suite counts only if it includes that test.

FAIL for a green baseline run alone (the fixture's original suite misses this defect), a test
command without its result, an unrelated failure (syntax, missing dependency, or setup), a fix
made before observing red, a removed/skipped/weakened regression, or only the agent's claim that
it saw red and green. Check production changes made by any tool, not just Edit of src/sort.js.
If trace truncation hides evidence, or any evidence needed to establish this sequence is absent,
FAIL with "insufficient visible red/green evidence"; never infer missing steps.
