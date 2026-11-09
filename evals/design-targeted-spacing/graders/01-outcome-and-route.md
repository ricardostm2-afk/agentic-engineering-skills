---
type: llm
focus: trace
weight: 3
---

PASS if only the requested toolbar gap is changed to the existing 12px token, the agent treats this as a targeted adjustment, and it distinguishes actual browser observation from code-only checks. FAIL if it requires variants, changes unrelated styling, or claims screenshots/browser validation without evidence.
