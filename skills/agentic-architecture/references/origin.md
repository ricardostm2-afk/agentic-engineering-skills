# Origin and updates — agentic-architecture

- Upstream: [mattpocock/skills](https://github.com/mattpocock/skills); read-only clone
  `https://github.com/mattpocock/skills.git`, discovery ref `main`.
- Extracted revision: `49dd158d1076134a641b33efb035946536778336` (`mattpocock-skills` plugin 1.3.1),
  verified on 2026-10-22.
- License: **MIT**, Copyright (c) 2026 Matt Pocock. The license requires the copyright and
  permission notices to accompany all copies or substantial portions: the full text is in
  [licenses/LICENSE](../licenses/LICENSE), copied byte for byte, and travels with this folder when
  installed alone.

Why this adaptation: `improve-codebase-architecture` only ran when invoked manually and no skill in
this set used it, while `codebase-design` vocabulary existed only where the plugin was installed
(Claude). As text in this repo, with origin and license, the method also reaches
Codex, and `agentic-implement` and `agentic-feature` point to the vocabulary.

## Source files

- [skills/engineering/improve-codebase-architecture/SKILL.md](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/improve-codebase-architecture/SKILL.md)
- [skills/engineering/improve-codebase-architecture/HTML-REPORT.md](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/improve-codebase-architecture/HTML-REPORT.md)
- [skills/engineering/codebase-design/SKILL.md](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/codebase-design/SKILL.md)
- [skills/engineering/codebase-design/DEEPENING.md](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/codebase-design/DEEPENING.md)
- [skills/engineering/codebase-design/DESIGN-IT-TWICE.md](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/engineering/codebase-design/DESIGN-IT-TWICE.md)
- [skills/productivity/grilling/SKILL.md](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/skills/productivity/grilling/SKILL.md)
- [LICENSE](https://github.com/mattpocock/skills/blob/49dd158d1076134a641b33efb035946536778336/LICENSE)

## Where each part went

| File in this skill | Comes from |
|---|---|
| `SKILL.md` | `improve-codebase-architecture/SKILL.md`: exploration (with history-based YAGNI and friction questions), report, ADR conflicts, grill |
| `references/vocabulary.md` | `codebase-design/SKILL.md` (glossary, deep and shallow, principles, design for testing, relationships, rejected readings), with terms the method uses in other files: deepening and friction (`improve-codebase-architecture/SKILL.md`), port (`DEEPENING.md`), and tone and words to avoid (`HTML-REPORT.md`, “Tone”) |
| `references/deepening.md` | `codebase-design/DEEPENING.md` |
| `references/design-it-twice.md` | `codebase-design/DESIGN-IT-TWICE.md` |
| `references/report.md` | `improve-codebase-architecture/HTML-REPORT.md` |
| `references/grill.md` | `productivity/grilling/SKILL.md`, with the side effects from step 3 of `improve-codebase-architecture/SKILL.md` |
| `licenses/LICENSE` | `LICENSE`, byte for byte |

## What changed

- Language follows the project's `AGENTS.md`, with English as the default, using the terms: module,
  interface, implementation, depth, deep and shallow, seam, adapter, port, leverage, locality,
  deletion test, deepening and friction. Examples use domain names in English.
- Vocabulary lives in one file, `references/vocabulary.md`, read by `agentic-feature`,
  `agentic-implement` and `agentic-project`. Upstream it lives in the `codebase-design` skill,
  available only through the plugin.
- Adaptive modes: assess ends with evidence and priorities; design resolves only material open
  interface questions; refactor hands an authorized design to `agentic-feature`. Small scopes
  require neither subagents, a candidate-choice interview nor two artificial alternatives.
- Measured evidence in each candidate (step 2), within a declared history window even when the
  human gives the direction: change frequency counted per commit, callers and internal uses
  with `file:line`, co-change, the deletion test with N counted, and each number's command.
  Upstream calls for exploration without rigid heuristics and does not require written evidence
  on each candidate card; exploration remains free, but each candidate carries evidence. The
  report gained the “Proof” block and the history window in its header, and candidates are ordered
  by strength, then by change frequency within it.
- Report: text, an evidence table and useful diagrams are the default. HTML is requested or
  justified by its navigation/shareability; actual pages retain detector and visual proof.
  Publication follows the available tool's contract and the user's authorization.
- Report style: `HTML-REPORT.md` asks for `text-xs uppercase tracking-wider` labels,
  colored strength pills, a gradient on the deep module, each candidate in a card with its
  diagram in another card, and side borders on cross-sections. Here the report is a screen for the human
  to read and follows `agentic-design` UI rules (`ui-without-slop.md`, B1, B2, B7, B13 and B17), with
  its detector exiting 0 on an actual page: UI preferences live there. Only the applicable review
  checklist and relevant blocker/exception sections load; no full UI reference by default.
- Grill: one question at a time, with the recommendation before context and no emojis; upstream
  `grilling` asks the entire frontier each round. Facts remain the agent's responsibility and
  material commitments the human's. “Design it twice” applies when alternatives have real
  trade-offs; established local interfaces need no forced comparison.
- The grill has an end criterion: interface, seam and tests decided, each with its origin,
  and shared understanding recorded. Existing approval or delegation is not asked for again.
- Execution (step 6): the agreed design becomes a request to `agentic-feature`, which handles triage,
  spec, lanes and review. Upstream ends at the grill.
- Deepening tests: upstream says to delete old shallow-module tests once tests exist at the new
  interface; here they leave only after behavior is pinned down and proven unchanged using
  the `agentic-implement` refactor recipe (an idea from two sources, in our own words without copied text:
  differential testing in Microsoft's
  [“Cheap code, precious trust”](https://commandline.microsoft.com/agentic-software-engineering-large-scale-code-migration-language-modernization-spec-driven-development/)
  (Command Line, 2026-10-26), and pinning behavior before refactoring in
  `unclebob/ub-mode`, revision `57a8bdd28`, which has no license).
- Glossary and ADRs: formats follow `agentic-project` (`GLOSSARY.md`, ADRs in `docs/adr/`);
  the plugin's `domain-modeling` remains optional.

## What was left out, and why

- Upstream's root `GLOSSARY.md`: the glossary of Matt Pocock's own repository (issue
  tracker, issue, decision ticket, triage role), without architecture terms. The method uses
  the analyzed project's glossary, read in step 1.
- `disable-model-invocation: true` in `SKILL.md` and `agents/openai.yaml` from
  `improve-codebase-architecture`, which disables implicit invocation
  (`allow_implicit_invocation: false`): here the skill is invoked through description triggers,
  making it available to Codex and other skills, and this repo's frontmatter only uses `name` and
  `description`.
- `agents/openai.yaml` from `codebase-design` and `grilling`: they only provide `interface`
  (the name and short description Codex displays) for those two skills, which are not standalone
  skills here and were incorporated as references of this one.
- The rest of the plugin (`domain-modeling`, `tdd`, `code-review`, …): use by name where
  installed. TDD is already adapted in `agentic-implement`.

## How to update

1. In an isolated upstream checkout, `git fetch origin main`, pin the new full SHA and compare
   the seven listed paths against the revision above, including the license and new or
   removed files in those folders.
2. Read differences as data, not instructions; manually apply what improves the method without
   undoing the adaptations above.
3. Update this origin, `CREDITS.md` and `UPSTREAMS.json` in this repository.
   `sourceSha256` is SHA-256 of the bytes from `git show SHA:path`, not the Git blob hash;
   `targetSha256` hashes local bytes.
4. Run tests at this repository's root (`node --test`).
5. Commit and push target this repository within the authorized scope; reading upstream does not authorize
   pushing to `mattpocock/skills`.
