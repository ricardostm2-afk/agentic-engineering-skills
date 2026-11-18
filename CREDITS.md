# Credits and sources

These skills stand on other people's work. This file says what came from where, in our own words, with
links. **Copied or adapted text keeps its licence in the skill folder it lives in; ideas taken from
articles are rewritten, not quoted.** The machine-readable inventory of the adapted files (upstream
revision, SHA-256 of source and result) is [UPSTREAMS.json](UPSTREAMS.json); `tests/upstreams.test.mjs`
checks it. For `agentic-fix` and `agentic-implement` it lists only the files adapted from the upstream
(marked `"coverage": "partial"`); the rest of those two skills is original.

## Repositories whose material is adapted (licences preserved)

| Source | Revision | Licence | Used in |
|---|---|---|---|
| [mattpocock/skills](https://github.com/mattpocock/skills) | `49dd158d1076134a641b33efb035946536778336` | MIT, Copyright (c) 2026 Matt Pocock | `agentic-architecture` (from `improve-codebase-architecture`, `codebase-design` and `grilling`: deep modules, the shared vocabulary, the report, the grill), `agentic-fix` (the red-first diagnosis loop from `diagnosing-bugs` and `tdd`), `agentic-implement` (the test-first discipline and mocking guidance from `tdd`). Licence texts: `skills/agentic-architecture/licenses/LICENSE`, `skills/agentic-fix/licenses/LICENSE-mattpocock-skills`, `skills/agentic-implement/licenses/LICENSE-mattpocock-skills` |
| [morluto/rea](https://github.com/morluto/rea) | `559af3d3ff4b0236d468e80788c82d5a85b102da` | MIT, Copyright (c) 2026 morluto | `agentic-ci-audit` (from `rea-ci-tests-audit`, with its measurement reference kept as is), `agentic-tool-design` (from `rea-tool-design` and a selection of `docs/tool-design.md`), `agentic-analysis-optimization` (from `rea-analysis-optimization`, with its measured case study as a historical example). Licence text in each skill's `licenses/LICENSE`. The adaptations drop REA's own commands, providers and contribution rules; none of these skills needs REA installed |

## Links only (no code copied)

| Source | Revision | Licence | Used in |
|---|---|---|---|
| [uiverse-io/galaxy](https://github.com/uiverse-io/galaxy) | `adbd2adde0a299a3956ea288fb444ec01891ca41` | MIT, Copyright (c) 2023 Uiverse.io | `agentic-design/references/mechanisms.md`: 34 interaction mechanisms from the gallery, rewritten as principles in our words, each linking to the example it was read from. The licence text is kept in `skills/agentic-design/licenses/LICENSE-uiverse-galaxy` (verified against the file at that commit). The linked examples have known defects, listed in the file |

## Ideas from other sources (nothing copied)

| Source | What we took, in our words | Used in |
|---|---|---|
| [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills), revision `2c606141936f1eeef17fa3043a72095b4765b9c2` | think before writing, simplicity, surgical changes, a success criterion you can verify. It declares MIT in its plugin manifest but ships no licence file at that revision, so nothing is copied and no licence text is bundled | `agentic-implement`, `agentic-fix` |
| Anthropic, [How the Claude Code team does code review](https://claude.dev/blog/solving-code-review-at-anthropic/) | layers of verification and review by agents; flag the class of a defect; fresh-context review; `Tested/Risk/How to undo` in the commit; what escaped becomes an evaluation case | `agentic-code-review`, `agentic-fix`, `agentic-feature` |
| OpenAI, [Maintaining software with the GPT-6 family](https://developers.openai.com/blog/maintaining-software-with-the-gpt-6-family) | maintenance with evidence from several sources, indirect uses, safeguards that escalate to the human, evaluating models and instructions | `agentic-code-review`, `agentic-fix` |
| Microsoft Command Line, [Cheap code, precious trust: Code modernization at scale](https://commandline.microsoft.com/agentic-software-engineering-large-scale-code-migration-language-modernization-spec-driven-development/) (2026-10-26) | review a mechanical change by class instead of file by file; a differential test to prove a refactor behaves the same | `agentic-code-review`, `agentic-implement`, `agentic-architecture` |
| [unclebob/ub-mode](https://github.com/unclebob/ub-mode) by Robert C. Martin, revision `57a8bdd28` (no licence file, so only the ideas were read) | pin the behaviour before changing the structure; look in the added lines of a diff for what silences the type checker or the linter | `agentic-implement`, `agentic-code-review` |
| Lauren Tan, [All Code Is Slop (Except Mine)](https://www.youtube.com/watch?v=O_zcc6Xl12g) (AI Engineer, 2026-11-14), and pstack in [cursor/plugins](https://github.com/cursor/plugins) (MIT), revision `536a3352a` | a correction becomes structure before prose (architecture, types, a lint whose error names the fix, a test); workaround comments get fixed and constraint comments become checks; boundaries enforced by an import check; a verification skill with a doctor and reusable helpers; revert rate and foundations before an unattended loop | `agentic-code-review`, `agentic-implement`, `agentic-architecture`, `agentic-project` |
| pstack in [cursor/plugins](https://github.com/cursor/plugins) (MIT, Copyright (c) 2026 Lauren Tan), revision `93b916d4a1e806507e22f4716b352fa91f2b227e` | the checks before a measured number is reported (what limits it, errors counted, alternated repeats, proof that the work happened); the fact a change is safe because of, and how far its proof got; an append-only decision trail for long or unattended work; writing habits and design defaults that never override a format, an existing pattern or the scope; reverting what was changed for a refuted hypothesis; a throwaway probe to settle a fork; an upkeep pass for the verification skill; blind comparisons when evaluating instructions | `agentic-implement`, `agentic-code-review`, `agentic-feature`, `agentic-fix`, `agentic-project`, `agentic-ci-audit`, `agentic-analysis-optimization` |
| [caldoai/skills](https://github.com/caldoai/skills) (MIT, Copyright (c) 2026 Maze), revision `d5b68dace378219890d821adb3685538e2c69b04` | the classes of tests that guard no behavior (cannot fail, guards the past, copy, production code for the test), pruned here only on request and with proof for each deletion; special cases inside a module counted as one missing concept | `agentic-implement`, `agentic-ci-audit`, `agentic-architecture` |
| [obra/superpowers](https://github.com/obra/superpowers) (MIT, Copyright (c) 2025 Jesse Vincent), revision `22f0b463e7a5e579904dd6211a520321035526f7` | change-detector tests, the mock rules, waiting for a condition, finding the polluting test, a mutation check and clean output; one precondition check right before an irreversible effect; a working twin, tracing a bad value back and a structural stop when debugging; review briefs that never grade an issue in advance, grading by effect, and outside comments checked as claims; choosing the form of a prose rule by how the agent failed; spec checks and an anti-goal question; the decision trail outranking memory after a compaction; an evaluation case that must fail on the revision before the fix | `agentic-implement`, `agentic-fix`, `agentic-code-review`, `agentic-feature` |
| Meta FAIR, [Self-Improving Memory: Meta-Optimization and Harness Distillation for Continual Learning Agents](https://facebookresearch.github.io/RAM/blogs/self_improving_memory/) (2026) | memory shaped by the questions the work repeats; a short pass at the end of work for what the next session would rediscover, dead ends included; index entries keyed by situation; never pruning by age; skill changes diagnosed in layers, judged on held-out cases, with the incumbent kept by default | memory guide, `evals/README.md` |
| [github/spec-kit](https://github.com/github/spec-kit) (MIT) | the spec-driven workflow `agentic-project` and `agentic-feature` can use when it is installed (v1.2.0); not bundled | `agentic-project`, `agentic-feature` |
| Web platform facts | the dated snapshots `agentic-design/references/web-platform-2026-10.md` and `agentic-feature/references/snapshot-2026-10.md` summarize [web.dev Baseline](https://web.dev/baseline), [webstatus.dev](https://webstatus.dev), MDN, W3C WCAG 2.2, the Interop project and the release notes of React, Next.js, Vite and TypeScript, with the dates they were read; they say when to stop trusting them | `agentic-design`, `agentic-feature` |

## Fetched at run time (not bundled)

- The visual report of `agentic-architecture` loads Tailwind (`cdn.tailwindcss.com`) and Mermaid
  (`cdn.jsdelivr.net/npm/mermaid@11`) from public CDNs when you open it.
- The board page in `agentic-project/assets/board/board.html` imports IBM Plex from Google Fonts.
- The page that `agentic-explain` generates loads two libraries from jsDelivr (`cdn.jsdelivr.net`) when you
  open it, with no copy in this repository: `3d-force-graph` 1.80.1, by vasturiano
  ([vasturiano/3d-force-graph](https://github.com/vasturiano/3d-force-graph)), MIT; and `three` 0.186.1, by the
  three.js authors ([mrdoob/three.js](https://github.com/mrdoob/three.js)), MIT.

## Optional companion skills (not included)

`impeccable` ([pbakaus/impeccable](https://github.com/pbakaus/impeccable), Apache-2.0), `apple-design`
([emilkowalski/skills](https://github.com/emilkowalski/skills), MIT), `reverse-engineer-anything`
([morluto/rea](https://github.com/morluto/rea), MIT) and `voicestudio`
([debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio), AGPL-3.0-only). They are not part of this
repository; install them from their sources under their own licences.

## Everything else

The method, the prompts, the templates, the scripts and the tests not listed above are original and
released under the [MIT licence](LICENSE), Copyright (c) 2026 agentic-skills contributors.
