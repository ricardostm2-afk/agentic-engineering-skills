# Origin

`agentic-design` owns the UI method in this set: UI questions, 2–3 structurally different variants,
building within the project's design system, blockers against generic AI aesthetics with a
mechanical detector, and browser proof. `agentic-feature` calls it at the UI steps.
This file records the sources and why the method works this way.

## Sources

| Source | Contribution |
|---|---|
| Uiverse gallery, [`uiverse-io/galaxy`](https://github.com/uiverse-io/galaxy/tree/adbd2adde0a299a3956ea288fb444ec01891ca41) (MIT, [licence](../licenses/LICENSE-uiverse-galaxy)) | the 34 concepts in `references/mechanisms.md`, rewritten as principles, without copied code; each links to its source file at that commit |
| Web platform standards and documentation: W3C WCAG 2.2, web.dev Baseline, MDN, webstatus.dev and the Interop project | the dated snapshot `references/web-platform-2026-10.md` (Baseline, CSS, HTML and DOM, accessibility, performance, Interop) and WCAG 2.2 reflow in `references/ui-without-slop.md` |
| Original work | blockers B1–B24 (`references/ui-without-slop.md`), the detector (`scripts/`, with tests and fixtures, measured against a real app) and evaluation cases (`evals/cases.json`) |

## Why this method

- **Style is free; tics are not.** Choose composition, typography, colour and personality within
  the project's system. Block only what signals "AI-generated", and each blocker explains how
  to recognise it, why it is bad and one possible way out. A list of preferences cannot be
  checked; a blocker with "Recognise it" can, and the detector applies it without opinion.
- **Decorative gradients, textures, glass behind content, hairlines used as structure and outlined
  actions** are blockers (B1, B21, B22, B4 and B20), with an explicit way out when the project
  decides on them: `slop-ok: <reason>` in code, or a written exception in `DESIGN.md`.
- **2–3 variants that disagree on structure**, instead of two nearly identical ones: the chooser
  sees what each loses, with screenshots.
- **References are mature products in the category, not galleries.** Inspiration galleries are
  where the tics come from: this skill therefore does not include the gallery library (an index
  of thousands of candidates and its curation), only the 34 concepts as text.
- **Branding lives in the project.** Colours, materials, navigation and colour exceptions belong
  to each project's design system and `DESIGN.md`; this skill brings no branding.
- **A new detector rule starts as a notice** and becomes a blocker only after tuning against a
  well-designed product, or when exact.
