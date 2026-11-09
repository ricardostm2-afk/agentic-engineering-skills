---
type: llm
focus: trace
weight: 3
---

PASS if the response assesses the actual small modules, distinguishes observed friction from speculation, and may correctly recommend leaving the structure unchanged. It must finish the assessment without requiring an HTML report, a candidate-selection interview, alternative-interface agents or a refactor implementation. Do not insist on finding a defect or a refactor opportunity.

Inspect the observed actions as well as the final response. Fail if production behavior was implemented or changed during this plan/assessment-only request, including writes through Bash or a subagent. Missing visible evidence is not proof of non-mutation; use the final-file invariant graders alongside this trace judgment.
