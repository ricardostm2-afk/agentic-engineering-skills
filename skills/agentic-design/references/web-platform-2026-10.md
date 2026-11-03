# Web platform for UI: October 2026

**Written on**: 2026-10-15 · **Valid until**: 2027-04-15

> **Do not read this file after 2027-04-15**: research from scratch. Until then, it is a starting
> point for choosing the platform capabilities the UI uses (floating layers, themes, grids,
> transitions, accessibility targets), not a source. Before using any row in a decision, recheck
> it at the source (Baseline status changes every month) and against the project's target
> browsers. Refreshing it is a separate task, proposed to the human (see "How to refresh"):
> never within a feature.
>
> **Already changed or changing within validity** (Newly to Widely, 30 months later): `light-dark`
> and `text-wrap-balance` on 2026-11-13; `starting-style` on 2027-02-06; `details-name` on 2027-03-03;
> `relative-color` on 2027-03-16. After those dates, those rows' "Status" column is wrong.
> Limited rows linked to future versions (Safari 27, Firefox 15x) may change in any month.
>
> JavaScript and frameworks (React, Next.js, Vite, TypeScript, browserslist) are in the stack
> snapshot in `agentic-feature`.

- [How to read statuses](#how-to-read-statuses)
- [CSS](#css)
- [HTML and DOM APIs](#html-and-dom-apis)
- [Accessibility](#accessibility)
- [Performance](#performance)
- [Interop 2026](#interop-2026)
- [Not confirmed](#not-confirmed)
- [How to refresh](#how-to-refresh)

## How to read statuses

Definitions from web.dev/baseline (read on 2026-10-15, <https://web.dev/baseline>): core browsers
= Chrome (desktop and Android), Edge, Firefox (desktop and Android), Safari (macOS and iOS).
**Newly** = supported in all; **Widely** = 30 months after Newly; **Limited** = at least one
missing. Years (e.g. "Baseline 2024") group what became Newly that year.

Source for statuses below, unless stated otherwise: npm package `web-features` **3.43.0**, published
on 2026-10-15 (<https://registry.npmjs.org/web-features>), the W3C WebDX CG dataset that powers
MDN, caniuse and webstatus.dev. To recheck a row, read the JSON API
`https://api.webstatus.dev/v1/features/<id>` (`<id>` is in the first column); the page
`https://webstatus.dev/features/<id>` renders only with JS and is empty for a page reader.
Versions in parentheses are the first fully supported versions according to that data.

Rule of thumb: use **Widely** if the project's targets are `baseline widely available` or newer;
use **Newly** if the project's target browsers cover it; **Limited** only as progressive
enhancement (the page works without it). If targets include WebViews (Android, kiosk tablets,
Electron) or browsers outside the core set, Baseline is insufficient: check browser-compat-data.

## CSS

| id | Capability | Status | Since / support |
|---|---|---|---|
| `container-queries` | Size container queries (`@container`, `container-type`) | **Widely** | Newly 2023-02-14, Widely 2025-08-14 |
| `container-style-queries` | Style container queries (`style(--x: y)`) | **Newly** | 2026-05-19 (Chrome 111, Firefox 151, Safari 18) |
| `container-scroll-state-queries` | Scroll-state container queries | Limited | Chromium only (Chrome 133) |
| `has` | `:has()` | **Widely** | Newly 2023-12-19, Widely 2026-06-19 |
| `subgrid` | `grid-template-*: subgrid` | **Widely** | Newly 2023-09-15, Widely 2026-03-15 |
| `scope` | `@scope` | **Newly** | 2026-03-24 (Chrome 143, Firefox 146, Safari 26.4) |
| `nesting` | Native nesting | **Widely** | Newly 2023-12-11, Widely 2026-06-11 |
| `cascade-layers` | `@layer` | **Widely** | Widely 2024-09-14 |
| `color-mix` | `color-mix()` | **Widely** | Widely 2025-11-09 |
| `oklab` | `oklab()` / `oklch()` | **Widely** | Widely 2025-11-09 |
| `relative-color` | Relative colours (`oklch(from var(--c) …)`) | **Newly** | 2024-09-16 |
| `light-dark` | `light-dark()` | **Newly** | 2024-05-13 |
| `light-dark-image` | `light-dark()` with images | **Newly** | 2026-09-14 (Chrome 150, Firefox 150, Safari 27) |
| `view-transitions` | Same-document view transitions (`document.startViewTransition`) | **Newly** | 2025-10-14 (Chrome 111, Firefox 144, Safari 18) |
| `view-transition-class` | `view-transition-class` | **Newly** | 2025-10-14 |
| `active-view-transition` | `:active-view-transition` and transition types | **Newly** | 2026-01-13 |
| `view-transitions-element-scoped` | Element-scoped view transitions | Limited | Chromium only (Chrome 147) |
| `cross-document-view-transitions` | Cross-document view transitions (`@view-transition`) | Limited | Chrome 126, Safari 18.2; no Firefox |
| `anchor-positioning` | Anchor positioning | Limited (see note) | core in Chrome 125, Firefox 147, Safari 26 |
| `scroll-driven-animations` | Scroll-driven animations (`animation-timeline`) | Limited | Chrome 115, Safari 26; no Firefox |
| `starting-style` | `@starting-style` | **Newly** | 2024-08-06 |
| `field-sizing` | `field-sizing: content` | **Newly** | 2026-06-16 (Chrome 123, Firefox 152, Safari 26.2) |
| `text-wrap-balance` | `text-wrap: balance` | **Newly** | 2024-05-13 |
| `text-wrap-pretty` | `text-wrap: pretty` | Limited | Chrome 117, Safari 26; no Firefox |
| `content-visibility` | `content-visibility` | **Newly** | 2025-09-15 |
| `sibling-count` | `sibling-count()` / `sibling-index()` | **Newly** | 2026-08-18 |
| `shape-function` | `shape()` | **Newly** | 2026-02-24 |
| `scrollbar-gutter` | `scrollbar-gutter` | **Newly** | 2024-12-11 |
| `interpolate-size` | `interpolate-size` (animate to `auto`) | Limited | Chromium only (Chrome 129) |
| `customizable-select` | Customisable `<select>` (`appearance: base-select`) | Limited | Chrome 135, Safari 27; no Firefox |
| `if` | CSS `if()` | Limited | Chromium only (Chrome 137) |

**Anchor positioning note**: the core (`anchor-name`, `anchor()`, `position-try`) is in Chrome 125,
Firefox 147 and Safari 26. Beyond the core, versions vary: of the 325 compatibility keys, 120
require Chrome 125 and 110 require Chrome 129 (e.g. `position-area` and `position-try-fallbacks`
with keywords); the remainder require Chrome 128 to 151; 39 require Firefox 148 and 34 require
Safari 26.2. Newly dates per key range from 2026-01-13 to 2026-09-14. The aggregate remains
Limited because `position-visibility: anchor-valid | anchor-visible` has declared support only
in Safari 27. In practice, basic anchor positioning for tooltips and menus covers all three
engines, with one caveat: BCD marks `position-anchor` as partial (the initial value is not `normal`)
until Chrome 151, Firefox 151 and Safari 27, so before those versions use an explicit `--name`.
Check the exact subfeatures you will use in `features["anchor-positioning"].status.by_compat_key`
(`web-features` 3.43.0).

**`@scope` note**: BCD marks Safari 26.0–26.3 as partial (`@scope` rules do not apply to
`<input>`/`<textarea>`); full support arrives in 26.4, and the aggregate requires Chrome 143
because of `css.selectors.nesting.at-scope`. Hence the recent Newly date.

## HTML and DOM APIs

| id | Capability | Status | Since / support |
|---|---|---|---|
| `dialog` | `<dialog>` | **Widely** | Widely 2024-09-14 |
| `dialog-closedby` | `<dialog closedby>` | Limited | Chrome 134, Firefox 141; no Safari |
| `popover` | `popover` attribute | **Newly** | 2025-01-27 |
| `popover-hint` | `popover="hint"` | Limited | Chrome 151, Firefox 153; no Safari |
| `invoker-commands` | `command` / `commandfor` on buttons | **Newly** | 2025-12-12 (Chrome 135, Firefox 144, Safari 26.2) |
| `interest-invokers` | `interestfor` (open on hover/focus) | Limited | Chromium only (Chrome 142) |
| `details-name` | `<details name>` (exclusive accordion) | **Newly** | 2024-09-03 |
| `details-content` | `::details-content` | **Newly** | 2025-09-16 (Chrome 131, Firefox 143, Safari 18.4) |
| `inert` | `inert` attribute | **Widely** | Widely 2025-10-11 |
| `navigation` | Navigation API (`navigation.navigate`, `navigate` event) | **Newly** | 2026-01-13 (Chrome 102, Firefox 147, Safari 26.2) |
| `speculation-rules` | Speculation Rules (`<script type="speculationrules">`) | Limited | Chromium only (Chrome 109) |
| `urlpattern` | `URLPattern` | **Newly** | 2025-09-15 |
| `scheduler` | Prioritized Task Scheduling (`scheduler.postTask` / `yield`) | Limited | Chrome 129, Firefox 142; no Safari |

Speculation Rules: MDN marks it experimental and *limited availability*, describing it as
progressive enhancement with detection (`HTMLScriptElement.supports('speculationrules')`) and
a `<link rel="prefetch">` fallback
(<https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API>, read on 2026-10-15).

## Accessibility

- **WCAG 2.2** is the current W3C Recommendation: published on 2023-10-05, updated on 2024-12-12.
  **WCAG 3** remains a draft, not a Recommendation
  (<https://www.w3.org/WAI/standards-guidelines/wcag/>, read on 2026-10-15).
- Default target to propose in the UI questions: WCAG 2.2 level AA.
- **Target size** (WCAG 2.2): criterion 2.5.8 *Target Size (Minimum)*, level AA, requires
  ≥ 24 × 24 CSS px, with exceptions (spacing, equivalent control, inline link, browser control,
  essential); 2.5.5 *Target Size (Enhanced)*, level AAA, requires ≥ 44 × 44 CSS px. Skill value:
  **44 px recommended, 24 px minimum**
  (<https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html> and
  `…/target-size-enhanced.html`, read on 2026-10-16).
- **European Accessibility Act** (Directive (EU) 2019/882, art. 31(1) and (2)): transposition by
  2022-06-28, application from 2025-06-28
  (<https://publications.europa.eu/resource/celex/32019L0882.ENG.xhtml>). The directive does not
  cite EN 301 549; the harmonised standard is under "Not confirmed".

## Performance

- **Core Web Vitals** ("good" at the 75th percentile, mobile and desktop separately): LCP ≤ 2.5 s,
  INP ≤ 200 ms, CLS ≤ 0.1. INP replaced FID as a stable metric in 2024. The page says stable
  metrics change at most once a year (<https://web.dev/articles/vitals>, last updated 2024-10-31,
  read on 2026-10-15).
- **INP**: good ≤ 200 ms, needs improvement ≤ 500 ms, poor > 500 ms; measures clicks, taps and
  keystrokes throughout the page's lifetime, not scrolling, hover or zoom
  (<https://web.dev/articles/inp>, updated 2025-09-02).
- **Measure in all browsers**: the Event Timing API (basis for INP) and Largest Contentful Paint
  API are **Newly** since 2025-12-12 (Safari 26.2) (`event-timing`, `largest-contentful-paint` in
  `web-features` 3.43.0). The Long Animation Frames API (`long-animation-frames`) and Layout
  Instability API (`layout-instability`, basis for CLS) remain Chromium-only.

## Interop 2026

Announced on 2026-02-12 (<https://web.dev/blog/interop-2026>; also
<https://webkit.org/blog/17818/announcing-interop-2026/>,
<https://hacks.mozilla.org/2026/02/launching-interop-2026/>,
<https://github.com/web-platform-tests/interop/blob/main/2026/README.md>), with 20 joint focus
areas from Apple, Google, Igalia, Microsoft and Mozilla. These include anchor positioning,
container style queries, dialogs and popovers, scroll-driven animations, view transitions,
Navigation API, `shape()`, `attr()`, `contrast-color()`, scroll snap, `zoom`, IndexedDB, WebRTC
and WebTransport. Being in Interop means engines are working on it this year, not that it is
already supported: confirm the status in the data.

## Not confirmed

- **European Accessibility Act harmonised standard**: whether one has been published in the
  Official Journal under the directive. Secondary sources from 2025 described the EN 301 549
  revision as pending; confirm in EUR-Lex before citing.

## How to refresh

A separate task, proposed to the human: never within a feature, and never writing to the skill
folder (`<skill>`, wherever installed) without OK.

1. Baseline statuses: download the latest `web-features` from the npm registry and read
   `features[<id>].status` (`baseline`: `"high"` = Widely, `"low"` = Newly, `false` = Limited;
   `baseline_low_date`, `baseline_high_date`, `support`; `by_compat_key` gives each subfeature's
   status).
2. Standards: WAI page for WCAG; web.dev for Core Web Vitals; EUR-Lex for the EAA.
3. Save a new file, `web-platform-<yyyy-mm>.md`, with "Written on" and "Valid until" (6 months
   later) in the header, dates when Newly rows become Widely within validity, and sources on
   each row; put anything you cannot confirm under "Not confirmed". Agents choose the latest
   with `ls <skill>/references/web-platform-*.md | sort | tail -1`. Refresh the stack snapshot
   (`snapshot-<yyyy-mm>.md`, in `agentic-feature`) in the same task.
