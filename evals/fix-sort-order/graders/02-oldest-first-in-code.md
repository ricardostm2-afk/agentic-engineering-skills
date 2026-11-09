---
type: llm
focus: { source: file, path: src/sort.js }
weight: 2
---

PASS if `byOldest` returns a negative, zero or positive number (for example the difference of the
two dates or timestamps), so that the older order sorts first.
FAIL if it still returns a boolean, or if the file no longer exports `byOldest`.
