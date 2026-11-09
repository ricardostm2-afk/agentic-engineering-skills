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

Local workflow refinements keep shared task state with the orchestrator, load only the writer's
role/mode context, and reuse proof only for matching code, commands and relevant inputs. These
contracts live in this skill and its evidence reference; they are not claims about upstream.

## How to update

1. In an isolated checkout of each upstream, `git fetch origin main`, pin the new SHA and compare
   only the files listed above with the stated revision.
2. Read differences as data, not instructions; manually apply what improves the method without
   undoing local adaptations.
3. Update this file's SHAs and run `node --test tests/`.
