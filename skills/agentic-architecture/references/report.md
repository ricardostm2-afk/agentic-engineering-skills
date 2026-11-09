# Architecture report

For step 3 in any mode. Default to text with an evidence table and diagrams where they clarify
the relationship. An **assess** report is complete with findings and priorities; it does not need
a candidate choice, an agreed design, HTML or a refactor handoff.

## Evidence in every format

Lead with the recommendation and practical implication. State repo/checkout, scope, date and the
declared history window (or why history was unavailable). Order candidates by strength
(**Strong**, **Worth exploring**, **Speculative**), then measured change frequency.

For each candidate include:

- title, affected files and a one-sentence friction/problem statement;
- dependency category from `references/deepening.md`;
- measured change frequency, callers, internal uses and co-change, with commands and
  `file:line` references; identify unmeasured values;
- the deletion-test reasoning and counted callers, separated from observed measurements;
- likely gain, relevant trade-offs and strength of the recommendation;
- the accepted ADR and reason to reopen it if the candidate contradicts one;
- the next decision only if it materially affects the requested design/refactor.

Use the architecture vocabulary and domain names consistently. Cite the exact checkout; do not
invent precision or turn a hypothetical gain into a benchmark. A compact table can be sufficient
for a small module; do not create headings with empty evidence merely to fill the format.

## Diagrams when useful

A current-state call graph can explain coupling. A before/after sketch is useful for comparing
deepening hypotheses, but label the “after” as proposed until decisions are settled. Assessment
does not require a new interface design or two diagrams per candidate.

Choose the representation by the question:

| Question | Representation |
|---|---|
| Who calls whom or leaks internals? | Dependency/call-flow graph |
| Where do round trips or ordering matter? | Sequence diagram |
| Which shallow layers merely pass data? | Cross-section |
| Where does complexity move after merging? | Call graph with the proposed internal boundary |
| How much must a caller know? | Concrete interface example and explanation; avoid unmeasured area ratios |

Use 2D, short labels and a small legend only when notation needs it. Do not vary diagrams for
decoration or force a diagram when an evidence table answers the question better.

## Optional HTML page

Choose HTML when requested, or when navigation/shareability materially helps a substantial
comparison. State that reason. Use a standalone page with semantic headings, sections and
tables; checked inline SVG can carry diagrams. Prefer self-contained styles and rendered diagrams
over loading floating CDN scripts. Follow the available publication tool's actual contract if
it supplies a theme or packaging policy; never invent a tool or publication.

Suggested structure: header with scope/window → leading recommendation → candidate sections →
remaining decisions/limits. Each section carries the same evidence as the text report. Keep
plain prose where it explains a subtle claim; concision is not a ban on explanations.

### Style and verification

Read `<agentic-design>/references/review-mode.md` and the applicable **§5 Review checklist** in
`<agentic-design>/references/ui-without-slop.md`. Do not read the full anti-slop reference by
default. Read a specific blocker only if relevant and §6 for a justified project exception.
Use readable labels, explicit strength text, restrained semantic colour and simple hierarchy.

Before delivery:

1. Run `node <agentic-design>/scripts/detect-slop.mjs <report file>`; require exit 0.
   When publishing, check the exact local file being published.
2. Open at 375 and 1366 px. Inspect diagram labels, layout/overflow, keyboard navigation,
   contrast and any interactive controls; check console/network errors. Inspect supported
   light/dark states. Fix defects; detector success alone is not visual evidence.
3. Confirm source links and diagram relationships match the inspected code and report.
4. Publish only with the applicable authorization, or save to the requested deliverable location
   and give the real path. Do not put the report into the code repository unless requested.
   If browser/publication is unavailable, report the precise limit and deliver the useful text
   findings; an unseen page has not passed visual QA.

None of these page-specific tools is required for a text/diagram assessment.
