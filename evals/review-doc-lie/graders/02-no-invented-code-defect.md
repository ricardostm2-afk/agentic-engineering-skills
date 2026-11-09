---
type: llm
weight: 1
---

PASS if every Important finding in the final review is about the documentation or the rename (the stale README line, or callers of the old name). The code of the change is otherwise correct.
FAIL if the review reports an Important finding about behaviour that is actually fine (for example the organization checks, the sort or the totals).
