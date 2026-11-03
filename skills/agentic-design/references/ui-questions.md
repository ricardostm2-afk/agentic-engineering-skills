# UI questions ("questions" mode)

The question block before designing a screen, component or generated document. The skill's
caller (`agentic-feature`, in the step 2 grill) merges these with its own questions under its
rule; on its own, `agentic-design` asks directly, using the same rule: one decision per question,
recommendation first, independent questions in a batch, dependent ones one at a time.

Before asking, open neighbouring screens (those the user sees before and after this one) and
the design system. Each recommendation below cites an existing screen or component ("as in
`<screen>`, which uses `<component>`"). A UI recommendation with no reference to what exists
is a guess and tends to produce a screen that does not belong in the application.

The block is mandatory; asking everything is not. Go through the 9 sections and decide for each
row: if neighbouring screens give a clear answer, it becomes a **default decision** (listed
in a table the human sees and can correct); if the answer changes the design, ask. Usually
3–6 questions remain: entry point, primary action, device/resolution and the 1–2 less obvious states.

Answers specify the variants ("variants" mode) and the states to capture for proof (`proof.md`).
The caller stores them in the spec.

What the screen must not contain is in `ui-without-slop.md` and is not repeated here: this
block's recommendations never propose a B1–B24 blocker. When a question below touches a blocker,
the reference is in parentheses.

## 1. Entry point

| Question | Recommendation to bring |
|---|---|
| How does the user get here? (menu, button on a screen, list row, notification, email link) | The nearest point in the flow where the need arises, citing the screen. A new main-menu entry only for a daily work area. Service configuration (connection, key, series) lives in settings, with the minimum the service cannot resolve itself; the work area gets at most a notice linking there. |
| Where do they go after finishing? | The screen they came from, with the change visible, or the flow's natural next step. |

A feature without an entry point is built but unreachable: this question is mandatory even
when it seems obvious.

## 2. Who uses it and where

| Question | Recommendation to bring |
|---|---|
| Which role uses this, and how often? (several times an hour vs. once a month) | High frequency calls for density and keyboard shortcuts; low frequency needs guidance and clear text. |
| On what device and resolution? | The project's target resolutions (from `DESIGN.md`, usage analysis or existing screenshots). Otherwise propose 1366×768 and 1920×1080 for desktop work, 390×844 if used on mobile. |
| Are they doing something else at the same time (on the phone, with a customer in front of them)? | If so: fewer clicks, no requirement to read long text, keyboard focus. |
| Is this a surface to operate, read or persuade? | Infer it from the product (default decision): apps and tools operate, documentation is read, websites persuade. Decides the surface mode (`ui-without-slop.md` §1). |

## 3. Hierarchy

| Question | Recommendation to bring |
|---|---|
| What is this screen's primary action? (only one) | Your choice, and its location (primary-action placement on neighbouring screens). One dominant action (B20). |
| What information determines that action? | The 2–4 fields the user looks at before acting; move the rest into the background or remove it. |
| What could disappear from this screen without anyone missing it? | A list of what you would cut (repeated subtitles, columns nobody filters, decorative icons). |

## 4. States

For each, the question is "what does the user see?" Bring a proposal based on the equivalent
state on a neighbouring screen.

| State | Recommendation to bring |
|---|---|
| Empty for the first time | A sentence saying what appears here and the action to create the first record (B11). Different from an empty filtered result. |
| Empty after filtering/searching | "Nothing found for …" with a way to clear the filter. |
| Loading | A skeleton shaped like the content if it takes > ~300 ms; nothing if instant (B19). No layout jumps when it arrives. |
| Error | What happened in the user's language, what they can do, and that their input has not been lost. |
| No permission | Hide, or show disabled with a reason, following neighbouring screens; the server makes the decision. |
| Lots of data | The realistic (measured) count and the response: pagination, virtualisation, search. Test with 1000 rows and long names. |
| Long or unusual data | 60-character names, empty values, accents, large numbers. Do not clip decision-making content (name, value, message): wrap it (B8); only the rest may truncate, with full text accessible. Omit empty fields, without "-" (B15). |
| Success | Feedback at the action's location (not only a fleeting corner notice), and the visible result, after the server response (B23). |

## 5. Text and microcopy

| Question | Recommendation to bring |
|---|---|
| What words does the user use for this? | Terms from the glossary and neighbouring screens; never internal table names, codes or system jargon. |
| What secondary text is needed? | None by default (B12, B13). |
| Buttons: which verbs? | Verb + object ("Save task", "Send order"), not "OK"/"Submit" or promises (B14). |

## 6. Accessibility

| Question | Recommendation to bring |
|---|---|
| Can everything be done by keyboard? What is the focus order? | Focus order = visual order; visible focus; Enter/Escape with their usual meaning; shortcuts for frequent use. |
| Contrast and size | The minimums in `ui-without-slop.md` §3 (contrast, targets, reflow), measured on the painted value. A stricter project target takes precedence. |
| Screen reader | Labels on fields and icon-only buttons; announce asynchronous changes (`aria-live`); no decisions available only through hover or a tooltip (B24). |

## 7. Responsive behaviour

| Question | Recommendation to bring |
|---|---|
| What happens at the smallest target resolution? | What collapses, moves below, disappears. No horizontal page scrolling. |
| And at the largest? | Maximum content width or use of extra space (e.g. side panel), following neighbouring screens. |

## 8. Consistency with the design system

| Question | Recommendation to bring |
|---|---|
| Which existing components fit? | The specific list (`path`), and what is missing. A new component requires justification. |
| Does it need colour, size or spacing outside the tokens? | No, by default (B5, B6). A new token is a human decision and goes into the design system, not the screen. |
| Which themes does the project have? | Read from the code (default decision, not a question): inspect variants and proof in all of them (light and dark, if both exist). |

## 9. Feedback and animation

| Question | Recommendation to bring |
|---|---|
| Is the action instant or does it take time? | Visual response in < 100 ms; above ~1 s, a progress indicator, indeterminate when no fraction is measured (B23); optimistic updates only when failure is rare and reversible. |
| Confirm before or undo afterwards? | Undo for reversible actions; confirmation only for irreversible ones, naming what will be lost. |
| Animation | Only to show where something came from or went; short (≤ 200 ms for a state change; gestures such as dragging or sliding a sheet use springs); respect `prefers-reduced-motion` (B18). |
| Does the user's input survive closing the window, losing the network or session expiry? | A saved draft (on the server or locally) for long text or work taking more than a minute. |
