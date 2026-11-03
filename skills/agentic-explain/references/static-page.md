# Static page — pilot

The composition is an HTML/SVG fragment and a layout CSS file, not view JSON.
`scripts/package-page.mjs` applies `assets/theme.css` and produces standalone HTML for Artifact,
without adding a grid, navigation or teaching layout. It needs no Node dependencies.

```sh
node <skill>/scripts/package-page.mjs <composition.html> --css <layout.css> --title "A lesson" --output <page.html>
```

Options: `--language en`; `--theme auto|light|dark` (auto follows the system). Exits 0 after writing,
1 on rejection without touching the output, and 2 on usage/read/write errors. Writing uses a
staging file and rename in the same directory. Do not use the fragment itself as the output.

## Static capabilities

- Balanced semantic HTML fragments, tables, `details`/`summary` and inline SVG. There is no
  view catalogue. Attributes must be quoted; IDs must be unique and local references must exist.
  Literal `<` in text uses `&lt;`. Scripts, `on*=`, attribute styles, forms, frames,
  `foreignObject`, SVG animation, metadata, comments and unknown elements are rejected.
- Source links accept HTTPS without credentials; anchors and SVG markers point to local IDs.
  URLs are decoded before validation and attributes are escaped again.
  Images are inline PNG/JPEG/GIF/WebP base64 only, with `alt`; SVG data URLs are not accepted.
- **Approved external resources: the empty set on this path**, even a CDN with an exact version.
  No floating version or transitive dependency reaches the reader. System fonts. D2/Mermaid
  are authoring tools only: convert to SVG, remove capabilities outside this subset and inspect it.
- CSS is a layout subset: grid, flex, dimensions, margins, spacing, alignment and
  `@media (min|max-width: Npx|Nrem)`. No imports, fonts, escapes, strings or resources. Color,
  typography, surfaces and radii consume existing tokens; token declarations are rejected.
  The exact property lists are `geometry`/`appearance`/`borders` in the packager.
- A **16,000,000 UTF-8 byte** ceiling, also measured on the final HTML including theme and escapes.
  This is a technical limit, not a desirable budget. Small lessons should be far below it.

The packager normalizes accepted elements/attributes and inserts CSP before the composition:
`default-src 'none'`, `script-src 'none'`, `connect-src 'none'`, frames/objects/forms/base
closed, inline styles and data images. This path executes no JS, from either the agent or the
packager; native controls suffice for these lessons. It does not verify truth, personal data,
secrets, readability or learning. Keep the agent review and browser proof.
For free JS, do not widen this path: iframe isolation belongs to slice 3.

## Theme

Neutral colors with separate roles: `--page`/`--panel` (backgrounds),
`--text`/`--text-secondary` (reading), `--link`, `--line`, `--focus`,
`--diagram-fill`/`--diagram-stroke`/`--diagram-label` (SVG).
Values are achromatic in both themes. System typography, monospaced code,
16 px body, 15 px note, 26 px section, 38 px title; spacing scale 4/8/12/20/28/44/64 px;
4/8 px radii. Dark mode follows the system preference; the wrapper can set `data-theme`.
Compositions consume these values; they do not redefine them or bring their own colors/fonts/radii.
The theme adds no frame, navigation or teaching grid. SVG geometry and layout widths
are chosen for the question and checked at both widths.
