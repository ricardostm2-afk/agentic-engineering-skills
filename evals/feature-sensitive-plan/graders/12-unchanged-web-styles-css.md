---
type: regex
target: { source: file, path: web/styles.css }
pattern: '^:root \{ --space-2: 8px; --space-3: 12px; --ink: #17212b; --surface: #ffffff; \}\r?\nbody \{ color: var\(--ink\); background: var\(--surface\); font: 16px system-ui, sans-serif; \}\r?\nmain \{ margin: 24px; \}\r?\n\.toolbar \{ display: flex; align-items: center; gap: var\(--space-2\); \}\r?\n(?![\s\S])'
weight: 1
---

The existing production input stays byte-equivalent (allowing line-ending normalization) during a plan/assessment-only request.
