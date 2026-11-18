# Design defaults for code the task has to shape

Read when the closed task leaves a shape to choose: a new type or data structure, where a check
goes, how a retried or concurrent operation behaves, how a new internal interface replaces an old
one. Skip it for a change that follows an existing pattern.

Order of authority: the brief and project rules, then the surrounding code's established pattern,
then these defaults. They guide choices inside the allowed scope; none of them is a reason to widen
the diff, refactor neighbors or delete code the task did not make unused (step 4). When a default
would need more scope, name it in the handoff instead of doing it. Module, interface, seam and
depth are used as in `<agentic-architecture>/references/vocabulary.md`.

## Shape the data first

- Choose the core types and structures before writing logic; with the right structure the code that
  follows is obvious, and with the wrong one every function compensates.
- When logic branches on the same condition in several places, or several booleans together encode
  one situation, the missing piece is a named state or a table: one tagged state instead of flags
  that can contradict each other, one registry instead of parallel switch statements.
- Make states that must never happen impossible to build where the language allows it, instead of
  checking for them everywhere. Give a value with a unit or a meaning (an amount in minor units, an
  id of one kind) its own type or constructor when mixing it up would be a defect.

## Check at the boundary, trust inside

- Parse and validate external data once, where it enters: user input, network, files,
  configuration, another service. Inside, pass the parsed type and do not re-check it.
- Keep decisions in functions that take values and return values; keep I/O, clocks and framework
  glue at the edge. That is also where tests reach the behavior without mocks.
- A guard for a state that is legitimate is a fix. A guard for a state that should not exist hides
  the place that created it: fix that place, or report it.
- One exception: when the task writes code that performs an effect that cannot be undone or
  leaves the process (deleting files, a destructive command, moving money, sending a message,
  writing outside the workspace), that code checks its own precondition again right before the
  effect (the path is inside the allowed root, the amount is positive, a reset runs against a test
  database) and fails loudly. The check guards the effect; the caller that passed the bad value
  still gets fixed.

## Operations that run more than once

- A command, migration step, job or handler that can be retried, restarted or delivered twice
  reaches the same end state each time: check before creating, key by identity, make “already done”
  a success. Say in the handoff which operations are safe to repeat and which are not.
- When two actors may write the same file, key, branch or record, first remove the sharing (one
  owner, separate targets, a meeting file prepared in advance). Serialize with a lock or queue only
  when a single shared writer is a real requirement, and then enforce it in structure, not by
  convention.

## Replacing an internal interface

- Inside the task's scope, move every caller to the new interface and delete the old one in the
  same change; do not leave a compatibility layer or two parallel paths. When callers lie outside
  the scope, list them and stop: `<agentic-architecture>/references/deepening.md`, “Enforce the
  boundary”.
- After a rename or move, search for the old name as text as well as as a symbol: strings, docs,
  configuration, generated names and other languages do not follow a refactoring tool.

## Less for the reader to hold

- Count what a reader must keep in mind to answer “what happens here”: layers between the question
  and the answer, state changed far from where it is read. Prefer the version with fewer. A wrapper
  with one caller, or a parameter only one caller understands, usually costs more than it saves.
- Do not add an extension point, option or abstraction for a variation nobody has asked for.
- A structural change that does not make something easier to read or change is reverted, not kept
  because it is done.

Ideas from the principle skills of `cursor/plugins` pstack (MIT, revision `93b916d4a`), in our own
words; the check before an irreversible effect adapts the debugging notes of `obra/superpowers`
(MIT, revision `22f0b463`). See `origin.md`.
