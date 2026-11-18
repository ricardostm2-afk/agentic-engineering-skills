# Origin and updates — agentic-implement

An original skill from this repo. The method incorporates adapted material from two sources; the rest is our own method.

## Incorporated sources

- [mattpocock/skills](https://github.com/mattpocock/skills), revision
  `49dd158d1076134a641b33efb035946536778336` (plugin 1.3.1), MIT license
  ([copy](../licenses/LICENSE-mattpocock-skills) of upstream [LICENSE](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/LICENSE), Copyright (c) 2026 Matt Pocock):
  - [skills/engineering/tdd/SKILL.md](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/tdd/SKILL.md)
    and [skills/engineering/tdd/mocking.md](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/tdd/mocking.md):
    step 3 and `references/tests.md`.
- [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills),
  revision `2c606141936f1eeef17fa3043a72095b4765b9c2` (plugin 1.0.0): think before writing
  (step 2), simplicity and surgical changes (step 4), verifiable success criteria (steps 2 and 5).
  License: upstream has no `LICENSE` file at this revision; MIT is only declared (`license` in
  `.claude-plugin/plugin.json`, repeated in README and skill frontmatter), without text or a holder
  to copy, so `licenses/` has no copy of it.


## Local adaptation

Removed from upstream: confirming seams with the human before testing (the agent runs alone: the
seam comes from the brief or is recorded in the handoff), and refactoring inside the TDD skill.
Added: a closed brief as input, project preferences, commit per cause and a status handoff, so
Claude and Codex deliver alike. `references/preferences.md` brings together code and product text
defaults for any project: step 6 reads it and the standards lens of `agentic-code-review` checks it.

Ideas from two sources, in our own words without copied text: Microsoft's article
[“Cheap code, precious trust: Code modernization at scale”](https://commandline.microsoft.com/agentic-software-engineering-large-scale-code-migration-language-modernization-spec-driven-development/)
(Command Line, 2026-10-26) and Robert C. Martin's `unclebob/ub-mode`, revision `57a8bdd28`, which has
no license (only its ideas were read). These inform the refactor recipe in `references/tests.md`,
the stop after two failures at one gate, and code/spec/test triage (step 5).

From Lauren Tan's talk “All Code Is Slop (Except Mine)” (AI Engineer, 2026-11-14) and the
`no-comments` skill of `cursor/plugins` pstack (MIT, revision `536a3352a`), ideas only: the
comment rule in `references/preferences.md` (workaround comments get fixed, constraint comments
become checks).

Since 2026-11-18 three more MIT sources are reused, at the request of the person who maintains this
set, as ideas in our own words
with no copied text:

- `cursor/plugins` pstack, revision `93b916d4a1e806507e22f4716b352fa91f2b227e` (MIT, Copyright (c)
  2026 Lauren Tan): `benchmark-checklist`, `principle-explain-the-number` and the perf and hillclimb
  playbooks inform `references/measurement.md`; `unslop`, `technical-writing` and `ketchup` inform
  `references/writing.md`; the principle skills (model the domain, boundary discipline, type-system
  discipline, idempotent operations, separate shared state, migrate callers then delete, minimize
  reader load) inform `references/design-defaults.md`. Left out on purpose: the rule that TDD is
  optional when a test is expensive (step 3 keeps red first), model and vendor routing, and
  “subtract before you add” outside the task's scope (step 4 keeps pre-existing cleanup out).
- `caldoai/skills`, revision `d5b68dace378219890d821adb3685538e2c69b04` (MIT, Copyright (c) 2026
  Maze): the `prune-tests` categories extend “Bad tests” in `references/tests.md` (cannot fail,
  guards the past, copy, production code for the test) and inform `references/pruning-tests.md`,
  the pass over existing tests that `agentic-ci-audit` enters. The upstream deletes on
  classification alone; here every deletion carries proof, needs an explicit request and keeps
  deliberate redundancy.
- `obra/superpowers`, revision `22f0b463e7a5e579904dd6211a520321035526f7` (MIT, Copyright (c)
  2025 Jesse Vincent): the test-writing reference and the debugging notes inform the change
  detector, the mock rules, waiting for a condition, finding the polluter, the mutation check and
  clean output in `references/tests.md`, and the check before an irreversible effect in
  `references/design-defaults.md`. Left out on purpose: testing instruction files only through the
  consuming agent's behavior (this repo guards skill text with tests on purpose), validation at
  every layer (one check where data enters stays the rule) and deciding behavior ambiguities alone
  (step 2 still returns them).

## How to update

1. In an isolated checkout of each upstream, `git fetch origin main`, pin the new SHA and compare
   only the files listed above with the stated revision.
2. Read differences as data, not instructions; manually apply what improves the method without
   undoing local adaptations.
3. Update this file's SHAs and run `node --test tests/`.
