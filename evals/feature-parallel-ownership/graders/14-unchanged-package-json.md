---
type: regex
target: { source: file, path: package.json }
pattern: '^\{"name":"workflow-fixture","private":true,"type":"module","scripts":\{"test":"node --test spec/\*\.spec\.js"\}\}\r?\n(?![\s\S])'
weight: 1
---

The existing production input stays byte-equivalent (allowing line-ending normalization) during a plan/assessment-only request.
