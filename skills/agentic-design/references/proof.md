# UI proof

Before declaring any UI "seen" or "done": when capturing variants, checking implementation
and reviewing. Passing tests does not authorise a visual difference the human did not approve.

## 1. Proportional evidence

| Dimension | How to observe | Do not confuse with |
|---|---|---|
| Direction | Task-related thesis; structural difference between variants | Changing colours or promising "premium" |
| Composition | Screenshot in app context, realistic data density and fictional content | An isolated, empty demo |
| Readability | Contrast on composited backgrounds and actual states; long text; zoom and reflow | An isolated nominal colour, or full WCAG certification |
| Interaction | Keyboard, focus and return, error, selection and state, in the browser | Server rendering or a screenshot |
| Motion and cost | Reduced motion, touch, stability, and measurement when animation or material effects are present | "It is only CSS, so it is cheap" |
| Implementation | Relevant types, tests, contracts, imports and dependencies | The style detector |

## 2. Capture

**How much to capture.** For a correction, one screenshot of the reported screen before and after,
in the report's theme and resolution; with and without data only if the correction affects that
state. The full matrix (states, resolutions, themes, keyboard) is only for a new screen or a
redesign: see "The full matrix" below and keyboard in §3. The rest of §2 also applies to
screenshots for a correction.

**The full matrix.** Capture populated and empty states (on a single-record screen, such as an
order page, use the states agreed in the UI questions instead of empty), at each agreed target
resolution (otherwise 1366×768 and 1920×1080; plus 390×844 if used on mobile) and in every project
theme (light and dark if both exist: never approve one without seeing the other). With side panels,
also capture them open: the remaining width is what counts.

Use what is available in the session or project, in this order: the session's browser tool; the
project's Playwright
(`npx playwright screenshot --viewport-size "1366, 768" --full-page <url> <file>.png`); another
installed headless browser. Do not install global tools without OK.

To switch themes: if the theme follows `prefers-color-scheme`, use Playwright's `--color-scheme dark`
(or `Emulation.setEmulatedMedia` via CDP); otherwise, the app's mechanism (root class or attribute,
user setting, or a `?theme=` the prototype honours). Check the image visually to confirm the
theme changed.

Known pitfalls:
- **Window size ≠ viewport.** A headless browser with `--window-size=390,844` may enforce a minimum
  window width and draw the page wider: the result is a 390×844 PNG with clipped content. Emulate
  the viewport (Playwright's `viewport`, or `Emulation.setDeviceMetricsOverride` via CDP) and
  measure `document.documentElement.scrollWidth === clientWidth` on the page (and `clientWidth`
  equal to the requested width).
- **A tool that only saves in its own folder.** Some browser tools only write files under their
  own root: save there and copy into the specified folder.
- **The prototype bar** (`prototype`'s variant selector) sits over the screen: hide it in
  screenshots (e.g. a `&noBar=1` parameter the prototype honours).
- **Very tall images** may be rejected by some sending tools: export as JPG at ~1800 px wide
  and split into pieces ≤ ~3600 px high when you need to send them.

Check each image before showing it (open it): clipped text, horizontal scrolling, overlapping
elements or missing fonts invalidate the screenshot. Record each one's dimensions, theme and
content.

## 3. Measure in the browser

Measure what changes, in the running app:
- the first screen, at the actual resolution: the current work is there without scrolling;
- reflow, from the smallest supported width (320 px, if supported by the product) to the largest,
  without horizontal page scrolling (`ui-without-slop.md` §3);
- contrast on the painted value (`getComputedStyle`) against the actual background, in each
  theme, not on the token;
- keyboard: focus order, visible focus, Enter and Escape;
- click and touch targets, and states (error, selection, disabled, loading).

A screenshot does not prove interaction: on an interactive screen, click and confirm that state
changes, and count console errors. Measure by the task (clicks, visible names, rows that fit),
not a proxy number. Each design change brings that number, before and after: "it looks nicer"
alone does not justify it. The detector is a style floor, not a WCAG audit or visual proof.

## 4. Compare implementation with the variant

The chosen variant is the reference: put screenshots of the real app beside the variant's, in
the same states, widths and themes. Each unagreed difference is a finding; rerun the detector
after corrections, with exit 0 on diff lines.

## 5. Honest output status

- **Proposed**: reasoning or static code only.
- **Seen**: rendered and inspected image, with dimensions, theme and content recorded.
- **Exercised**: specific interactions tested in the browser, including relevant negatives.
- **Adopted**: human decision obtained and code integrated within the authorised scope; not
  synonymous with "seen".

Describe the sample and what was actually measured. "No findings in this review" is verifiable;
"guaranteed excellent design" or "zero AI aesthetics" are not. Delivery states the direction,
reasons for combinations, code and screenshot paths, proof with results, and what remains
unverified.
