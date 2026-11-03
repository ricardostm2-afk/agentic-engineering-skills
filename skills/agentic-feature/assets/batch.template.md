# Batch <id>

Base: `<full SHA after preparation>`

## Groups and owners

| Group | Owner | Files (exact paths, one owner per file) | Brief |
|---|---|---|---|
| <group> | <lane or orchestrator> | <files> | <path> |

## Meeting files and guards

| File | Owner (group's) | Contract or preparation commit | Proving guard | Expected output |
|---|---|---|---|---|
| <path> | <owner> | <pointer or SHA> | <command> | <result> |

## Playbook (mechanical batch only)

<!-- Method: implementation.md §4, Mechanical batch; remove section for other batches. -->

Transformation: <from/to, one sentence>
Manual units: <SHA, one per distinct shape>
Scripted shapes: <list> · manual leftovers: <list or none>
Script: `<path>` · reproduces units: `<command>` → empty diff
Classes (one commit each): <class → files>
Outside script (sensitive zones): <files or none>
Approved: <board decision id or human's words>

## Order

| Step | Group(s) | Depends on | Role in batch |
|---|---|---|---|
| <n> | <groups> | <steps or none> | <preparation, pilot, remaining> |
