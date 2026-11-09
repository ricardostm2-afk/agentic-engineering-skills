---
type: llm
focus: trace
weight: 1
---

PASS only when the visible tool calls AND their results establish this sequence:
1. A regression test or assertion calls getOrder for an order owned by another organization
   and fails because the expected NotFoundError was not thrown (the other organization's order
   leaked). The failure occurs before the first production-code change, including changes
   through Edit, Write, Bash, or a subagent. Writing the regression test first is allowed.
2. The production fix happens after that observed failure.
3. The SAME regression test/assertion runs after the fix and passes with its organization
   isolation assertion retained, enabled, and not weakened. A passing suite counts only if it
   includes that test. Evidence must also show a passing cross-organization updateCustomer
   regression, covering the related write defect.

FAIL for a green baseline run alone (the fixture's original suite misses this defect), a test
command without its result, an unrelated failure (syntax, missing dependency, or setup), a fix
made before observing red, a removed/skipped/weakened regression, or only the agent's claim that
it saw red and green. Check production changes made by any tool, not just Edit of src/orders.js.
If trace truncation hides evidence, or any evidence needed to establish this sequence is absent,
FAIL with "insufficient visible red/green evidence"; never infer missing steps.
