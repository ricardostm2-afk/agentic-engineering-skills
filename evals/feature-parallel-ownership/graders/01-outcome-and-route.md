---
type: llm
focus: trace
weight: 3
---

PASS if the plan assigns T1 to the labels module/test and T2 to the stylesheet, makes the orchestrator the sole writer of shared tasks.md, and asks workers for completed task IDs plus revision/evidence. No worker may independently edit shared tasks.md. Do not require a particular model or prose wording. FAIL if ownership overlaps or parallel workers both update task state.

Inspect the observed actions as well as the final response. Fail if production behavior was implemented or changed during this plan/assessment-only request, including writes through Bash or a subagent. Missing visible evidence is not proof of non-mutation; use the final-file invariant graders alongside this trace judgment.
