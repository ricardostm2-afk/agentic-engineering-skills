# Page production and proof

Read only when producing an actual explanation, walkthrough or lesson page. This procedure does
not turn a text/diagram answer into a page requirement. Use `references/static-page.md` for the
static packager's accepted elements, CSS, limits and exit codes.

## Static composition

Use HTML/SVG and composition CSS with `assets/theme.css`, without redefining its tokens. The theme
owns colour, typography, spacing, radii and surfaces; the composition chooses layout and geometry.
Use 2D by default. D2/Mermaid are authoring tools: embed checked SVG without their runtime.
Native `details`/`summary` can reveal answers when applicable.

Do not include scripts, `on*=` handlers, remote resources, forms, iframes, executable URLs or
personal data/secrets. Page assembly and policy stay outside the composition. Package with:

```sh
node <skill>/scripts/package-page.mjs <composition.html> --css <layout.css> --output <page.html>
```

`assets/lessons/validation.html` and `assets/lessons/absence.html` demonstrate static composition;
`assets/lessons/interaction.html` demonstrates isolated interaction. Their source/teaching map is
in `references/lessons.md`. They are optional examples, not required lesson layouts.

## Isolated interaction

When changing a cause and observing its effect answers the question, keep the parent static and
put only the simulation in a `srcdoc` child. The composition has exactly
`<div id="interaction-slot"></div>` plus a text fallback. The self-contained child has no external
resources. Read `references/interaction-security.md`; messages are limited to `ready`, `state`,
`result` or `error`, with `version: 1` and only its documented fields.

```sh
node <skill>/scripts/package-interaction.mjs <composition.html> --interaction <interaction.srcdoc> \
  [--css layout.css] --output <page.html>
```

The packager fixes `sandbox="allow-scripts"` without `allow-same-origin`, denies forms, popups,
top navigation, resources and network, and injects a small fixed parent runtime. It accepts only
the expected `contentWindow`, requires opaque origin (`null`), rejects extra fields, limits
size/rate and uses `textContent`. The parent exposes no DOM, tokens or publication functions to
the child. Keep the fallback if no `ready` arrives. Isolation is a real boundary, not a promise
of confidentiality or denial-of-service protection. Never weaken the static packager for free JS.

## Verification and delivery

1. Check the explanation, diagrams, examples and any answers against sources. Mark synthetic or
   unexecuted demonstrations. For a lesson, check its teaching map separately.
2. Use `<agentic-design>/references/review-mode.md` and the applicable checklist in
   `<agentic-design>/references/ui-without-slop.md` §5. Read a specific blocker only when needed,
   and §6 for a justified exception; do not load the full UI reference by default. Run its
   detector on the theme and page; it must exit 0.
3. Open at 375 and 1366 px in light/dark. Read labels, measure overflow and contrast, use the
   keyboard, reveal any answers and check console/network. For isolated interaction also
   exercise changing the variable, the result, malformed/extra messages and fallback. Fix defects
   before delivery; packaging success alone does not prove usability.
4. Without a browser, declare the page **not seen** and do not claim visual QA passed. Without
   Node, provide the source-grounded text and state that the page was not produced. Deliver useful
   content while identifying the blocked page check.
5. Publish only through an available, authorized tool procedure. Otherwise save in the requested
   deliverable location, open it if possible and provide its real path. Do not modify the explained
   repository to host the page unless requested, or invent publication.

Done when the requested page is delivered, the guard/detector pass and the page is inspected and
exercised, with any limits explicit. For lessons, separate technical compliance, reviewed teaching
quality and measured learning; without learner evidence, report “learning not measured”.
