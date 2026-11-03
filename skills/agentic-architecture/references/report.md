# Architecture report

For step 3. The report is a standalone HTML page. Tailwind and Mermaid come from CDNs:
Mermaid handles graph diagrams, while hand-built divs and inline SVG handle more
editorial visuals (mass diagrams, cross-sections). Mix both: Mermaid alone looks generic.

It is a screen for the human to read, so UI rules come from `agentic-design` (“Style”, below).
With the Artifact tool, the `artifact-design` skill's contract overrides this template where they differ
(scripts and theme, for example): adapt the skeleton to it.

## Skeleton

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Architecture review of {{repo}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
    </script>
    <style>
      /* Page tokens, one job each; text and leakage measured against white. */
      :root {
        --background: #ffffff;
        --text: #0f172a;
        --leakage: #dc2626;
        --deep: #1e293b;
      }
      body { background: var(--background); color: var(--text); }
      .seam { stroke-dasharray: 4 4; }
      .leakage { stroke: var(--leakage); }
      .deep { background: var(--deep); color: var(--background); }
    </style>
  </head>
  <body class="font-sans">
    <main class="max-w-5xl mx-auto px-6 py-12 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-16">...</section>
      <section id="recommendation">...</section>
    </main>
  </body>
</html>
```

Colors follow the upstream skeleton, with contrast measured against `#ffffff`: red gives
4.83:1, and both dark colors exceed 14:1. Any new accent or amber becomes a token, with
contrast measured the same way.

## Header

Repo name, date, history window declared in step 2 and a compact legend: filled
box = module, dashed line = seam, red arrow = leakage, thick dark box =
deep module. No introductory paragraph: straight to candidates.

## Each candidate

Diagrams carry the weight. Prose is brief and simple, using the terms in
`references/vocabulary.md` naturally. Each candidate is an `<article>` without an enclosing box,
separated from others by space and a strong title:

- **Title**: short, names the deepening (“Unify order intake”).
- **Strength and category**: spelled out, in text color, directly below the title (“Strong · ports and
  adapters”). Strength is `Strong`, `Worth exploring` or `Speculative`; dependency
  category comes from `references/deepening.md`.
- **Files**: monospaced list, `font-mono text-sm`.
- **Before and after**: the candidate's centerpiece, in two side-by-side columns (patterns below).
- **Problem**: one sentence. What hurts.
- **Solution**: one sentence. What changes.
- **Proof**: numbers from step 2, each with the command or `file:line` it came from:
  commits in the window, callers, internal uses, co-change, deletion test
  result. State what remains unmeasured here.
- **Gains**: bullets of at most 6 words, using vocabulary terms (“tests cross one
  interface”, “pricing stops leaking”, “delete 4 shallow wrappers”).
- **ADR** (if applicable): one line beginning “ADR:”, in amber.

No explanatory paragraphs. If understanding the diagram requires a paragraph, redesign the
diagram.

## Diagram patterns

Choose the pattern that serves the candidate and vary it: identical diagrams hide what makes each
candidate distinctive.

### Mermaid graph (for dependencies and call flow)

A `flowchart` or `graph` when the point is “X calls Y, which calls Z, and look at the tangle”. Put it directly
in the candidate's section without another enclosing box. Use `classDef` to make leaking edges
red and the deep module dark, using the token values. Sequence diagrams
serve “before: 6 round trips; after: 1”.

```html
<pre class="mermaid">
  flowchart LR
    A[OrderIntake] --> B[OrderValidator]
    B --> C[OrderRepository]
    C -.leaks.-> D[PricingClient]
    classDef leakage stroke:#dc2626,stroke-width:2px;
    class C,D leakage
</pre>
```

### Hand-built boxes and arrows (when Mermaid cannot give the right layout)

Modules as outlined, labeled `<div>` elements; arrows as inline SVG `<line>` or `<path>` elements, over
a `relative` container. Useful when “after” should look like one deep module with a thick outline
and faded internals, which Mermaid cannot draw with that weight.

### Cross-section (for layered shallow modules)

Stacked horizontal strips, one per layer a call passes through. Before: 6 thin layers
that do nothing. After: 1 thick strip with the responsibility combined.

### Mass diagram (for an interface as wide as the implementation)

Two rectangles per module: interface area and implementation area. Before: interface
rectangle almost as tall as the implementation rectangle (shallow). After: short interface, tall
implementation (deep).

### Call graph collapse

Before: a call tree in nested boxes. After: the same tree enclosed in one box,
with the now-internal calls faded inside.

## Style

UI rules are those of `<agentic-design>/references/ui-without-slop.md`, in full: the report
is a screen to read. They provide, for example, sentence-case labels without tracking and at least
12 px, strength spelled out rather than colored pills, flat color rather than gradients, and
candidates without cards. Before showing it, the detector must exit 0 on the page:
`node <agentic-design>/scripts/detect-slop.mjs <report file>`. When published
as an Artifact, run it on the local file you published.

Within those rules:

- Editorial, not a corporate dashboard. Generous whitespace; optional serif headings.
- Color sparingly: red for leakage, amber for notices and at most one
  accent.
- Diagrams around 320 px high, so before and after fit side by side without
  scrolling the page.
- The only scripts are Tailwind and Mermaid. Everything else is static: no application code or
  interaction beyond what Mermaid draws.

## Top recommendation

The last section, with the page's largest heading: the candidate's name, a one-sentence reason and an
anchor link to its section.

## Tone

Short, simple sentences; architecture nouns and verbs come from
`references/vocabulary.md`, including what to avoid. Concision is no excuse to dodge the
terms. No circumlocution or “it is worth noting…”: a sentence that can be a bullet becomes one,
and a bullet that can be cut is cut.
