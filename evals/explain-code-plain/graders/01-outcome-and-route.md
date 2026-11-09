---
type: llm
focus: last_message
weight: 3
---

PASS if the agent explains the map lookup and nullish fallback, gives correct known/unknown examples, and grounds the explanation in the actual source. It should answer directly at the supplied level, without blocking on calibration questions, creating an HTML lesson, or claiming behavior it did not inspect.
