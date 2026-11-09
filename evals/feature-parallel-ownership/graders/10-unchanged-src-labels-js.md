---
type: regex
target: { source: file, path: src/labels.js }
pattern: '^const labels = Object\.assign\(Object\.create\(null\), \{ open: ''Open'', closed: ''Closed'' \}\);\r?\nexport function statusLabel\(status\) \{ return labels\[status\] \?\? ''Unknown''; \}\r?\n(?![\s\S])'
weight: 1
---

The existing production input stays byte-equivalent (allowing line-ending normalization) during a plan/assessment-only request.
