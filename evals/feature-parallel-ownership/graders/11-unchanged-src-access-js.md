---
type: regex
target: { source: file, path: src/access.js }
pattern: '^export function canRead\(actorOrg, recordOrg\) \{\r?\n  return typeof actorOrg === ''string'' && actorOrg\.length > 0 && actorOrg === recordOrg;\r?\n\}\r?\n(?![\s\S])'
weight: 1
---

The existing production input stays byte-equivalent (allowing line-ending normalization) during a plan/assessment-only request.
