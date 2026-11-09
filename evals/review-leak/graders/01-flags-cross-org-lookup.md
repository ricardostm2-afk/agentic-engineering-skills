---
type: llm
weight: 3
---

PASS if the final review reports, as an Important (or Blocker-level) finding with a src/orders.js file and line, that `findByReference` returns an order without checking the caller's organization, so another organization can read it.
FAIL if the review misses it, lists it only as a Nit or a suggestion, or approves the change as clean.
