---
type: regex
target: { source: file, path: web/index.html }
pattern: '^<!doctype html>\r?\n<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Tasks</title>\r?\n<link rel="stylesheet" href="styles\.css"><main><h1>Tasks</h1><div class="toolbar"><label for="status">Status</label><select id="status"><option>Open</option><option>Closed</option></select></div></main></html>\r?\n(?![\s\S])'
weight: 1
---

The existing production input stays byte-equivalent (allowing line-ending normalization) during a plan/assessment-only request.
