---
type: regex
target: { source: file, path: src/sort.js }
pattern: 'a\.createdAt\s*[<>]=?\s*b\.createdAt\s*[;)]'
match: not_contains
weight: 2
---
