---
name: agentic-design
description: >-
  Designs, compares, builds or visually reviews screens, components, generated documents and charts
  within the project design system. Use for UI variants, appearance, visual proof or targeted visual
  adjustments. Use agentic-feature for product behaviour and agentic-code-review for code
  correctness.
---

# agentic-design

Route UI work to one mode. Appearance comes from the project's `DESIGN.md` or the design system
named in `AGENTS.md`; this skill supplies the method, detector and proof. When another workflow
calls it, preserve that caller's scope, decisions and approvals. Do not reopen its gates.

Host differences and sibling resolution follow
`<agentic-project>/references/host-compatibility.md`; find that sibling through
`$AGENTIC_PROJECT_DIR` first and read the reference when the host varies. `<skill>` means the
folder containing this file; run its scripts from the project repository root. The sibling
`<agentic-implement>` (`$AGENTIC_IMPLEMENT_DIR`) follows the same lookup reference.

## Select the mode before loading context

State the mode in one line. The caller can fix it. Ask whether a **material visual choice** needs
to be seen before implementation; a correction with settled direction stays targeted. A redesign
starts with reported or measured friction. A working screen nobody flagged stays as it is.
A cross-screen system change uses variants on a pilot, then extends the chosen direction.

| Mode | Input and result | Read only |
|---|---|---|
| **questions** | Reading, neighbours, design system, targets → unresolved design questions with recommendations and defaults | `references/ui-questions.md` |
| **variants** | answers, baseline, design system, depth, output folder, base → 2–3 structural alternatives, proof, critique, recommendation and `choice.md` | `references/variants-mode.md` |
| **build** | approved direction/variant, brief, design system, base → production diff, detector result and proportional visual/interaction proof | `references/build-mode.md` |
| **review** | base, reviewed SHA, intent/variant, screenshots → evidenced findings and detector result | `references/review-mode.md` |
| **targeted adjustment** | requested correction and current screen → only the correction with before/after proof; no variants or redesign | `references/targeted-adjustment.md` |

Each operational capsule names its minimal shared rules and proof sections. Do not load every
reference or other modes. A delegated UI writer receives the exact build/targeted reference path,
project rules and required proof; it does **not** preload this entire skill. A reviewer receives
only the review capsule and its lens brief. References are instructions, not additional skills.

## Rules and proof sources

- `references/mode-rules.md`: precedence, preserve the existing system, scope, detector entry point
  and honest fallback; read it with the selected operational mode.
- `references/ui-without-slop.md`: canonical blockers and checklist; use the sections named by
  the mode. §5 is the checklist, §6 scoped exceptions, §7 the detector. `agentic-project` copies
  this self-contained reference into projects' `.agentic/` folder.
- `references/proof.md`: proportional capture, browser measurement and Proposed / Seen /
  Exercised / Adopted status. Read relevant sections before making those claims; no browser means
  visual work is Proposed and unverified.
- `references/variants.md` and `references/directions.md`: detailed variant procedure and direction
  grammars, only when choosing a new direction.
- `references/mechanisms.md`: optional mechanism choices after relevant product research.
- `references/web-platform-<yyyy-mm>.md`: latest unexpired snapshot only when choosing a platform
  capability; verify material current claims with primary evidence.
- `references/origin.md`: method sources, when changing the skill.
- `scripts/detect-slop.mjs`: run the detector; tests: `node --test <skill>/scripts/*.test.mjs`.
- `evals/cases.json`: behavior cases, when changing the skill.

## Other hosts and maintenance

Without a Skill tool, read this router and only the selected capsule. Invocation remains
`$agentic-design` in Codex and `agentic-skills:agentic-design` in the Claude plugin. Without
subagents, build and critique are separate passes labelled “non-independent critique”. Missing
browser or `node` capability remains an explicit proof limitation (`references/mode-rules.md`).

Refresh a web-platform snapshot as a separate authorized task, not part of feature delivery.
A new detector rule starts as a notice until tuned against a well-designed product, unless exact;
add a regression test. UI rules live once in `ui-without-slop.md`; modes link to them. Validate
changed behavior with relevant `evals/cases.json` cases using an agent that did not write the change.
