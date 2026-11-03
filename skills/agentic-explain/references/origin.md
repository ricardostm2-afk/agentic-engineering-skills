# Origin and updates — agentic-explain

This skill belongs to this repository: its text comes from no upstream and was written in
Portuguese, in the style of the others, from a skill draft; the two stages, three calibration
questions and three profiles were decided during the rewrite. It therefore does not appear in
`UPSTREAMS.json`.

## Ideas

- **Profiles.** The expertise reversal effect: what helps a learner can hinder an expert, and the
  effectiveness of instruction depends on the reader's prior knowledge
  ([DOI 10.1007/s10648-007-9054-3](https://doi.org/10.1007/s10648-007-9054-3); abstract read on
  2026-10-31, not the paper). This is evidence about teaching, not code reading, so the skill does
  not promise that three questions measure expertise well: it allows profile changes, and each
  node has both texts.
- **3D views.** Supporting evidence is weak (CodeCity, ICSE 2011, 41 people); known weaknesses are
  occlusion and more complex navigation (IVAPP 2014). Hence Flat mode, text always alongside, and
  a text version of each view.
- **Publishing.** The same path as the `agentic-architecture` report: Artifact, or a file in the
  session's temporary folder, with the `agentic-design` detector exiting 0.

## Libraries

Loaded from the CDN in the page, with no copy in the repo. Each only loads if the page has a view
that uses it:

| Library | Version | License | Address | When it loads |
|---|---|---|---|---|
| `3d-force-graph` (vasturiano) | 1.80.1, from 2026-09-29 | MIT | `https://cdn.jsdelivr.net/npm/3d-force-graph@1.80.1/dist/3d-force-graph.min.js` | with a `graph` view |
| `three` (three.js authors) | 0.186.1, from 2026-09-24 | MIT | `https://cdn.jsdelivr.net/npm/three@0.186.1/+esm`, and addons at `…/three@0.186.1/examples/jsm/….js/+esm` | with any other view, including scenes |

Licenses and versions read in the npm registry on 2026-10-31. Since the repo keeps no copy, no
license needs to accompany it in `licenses/`; licenses are available in each library's repository
and packages.

Why these versions and addresses:

- `3d-force-graph` uses the single-file UMD build. Through `+esm`, it would resolve three to
  0.187.0 and bring a second copy.
- `three` uses `+esm` with an import map: about 192 KB gzipped.
  `build/three.module.min.js` imports unminified `three.core.js` and weighs 288 KB gzipped.
- three 0.187.0, from 2026-10-30, was too recent: Artifact only accepts an exact version released
  at least 14 days earlier.
- cdnjs does not have `3d-force-graph` (404 on 2026-10-31).

## How to update

1. Read the version and publication date in the npm registry. Only a version released at least
   14 days earlier qualifies, with the exact version number in the address.
2. Change the address in `assets/viewer.html` and in the approved list in
   `scripts/generate-page.test.mjs`, which rejects any address outside that list. The three addons
   must come from the same version as `three`.
3. Update the table above and run `node --test skills/agentic-explain/scripts/*.test.mjs`.
4. Open the examples in `assets/examples/` in a WebGL browser: every view must render, the console
   must have no errors, and nothing renders while idle.
5. The code examples (`code-b.json` and `code-c.json`) explain this skill and cite lines in its
   files at their `base` commit. When a cited file changes, check the citations against the new
   file, correct lines and texts that no longer match, and set `base` to the commit where you
   checked them. `scripts/generate-page.test.mjs` only checks that the paths exist. `general-a.json`
   cites URLs, read on 2026-10-31.
