# Interactive explanation pages

Read when an explanation becomes a page. The page is built for this question, on the spot: there is
no template, schema or generator to fill. Decide what the reader must see change, then write the
HTML, CSS and JavaScript that show exactly that. `assets/examples/step-through-binary-search.html`
shows the quality bar for one case; copy its qualities, not its layout.

## When a page earns its place

Make one when seeing something change answers the question better than reading about it:

- **State that changes over steps:** an algorithm, a data structure, a request through modules, a
  parser, a state machine, a cache, a retry loop. → step through it.
- **Cause and effect:** a parameter, input or configuration that changes an outcome (timeouts,
  thresholds, batch sizes, a regex, a CSS rule). → let the reader change it and watch.
- **A structure too big for one diagram:** architecture, dependency graphs, a data model. → let the
  reader focus, expand and follow paths.
- **A comparison:** before/after, two algorithms, two designs on the same input. → same view, toggled
  or side by side, same scale.
- **Learning:** a lesson where the reader predicts before the page reveals (`references/method.md`).

A one-paragraph answer, a definition or a single-file lookup stays in text. When unsure, answer in
text and offer the page in one line.

## Ground the page in real behaviour

- **Run the code when it can run.** Copy the function into a scratch script, add recording that does
  not change the result (a `record(line, state)` after each meaningful line), run it on a small input,
  and embed the recorded steps as data. Show the original code, not the instrumented copy.
- When it cannot run here, trace it by reading and label the page **reasoned trace, not executed**.
  A made-up input that illustrates an idea is labelled **synthetic example**.
- Choose inputs that take the branches the question is about (found and not found, empty, a cycle,
  the failure path). Keep a trace followable: usually 5–25 steps, one visible change per step.
- Every step's narration says what happened **and why**, tied to a `path:line` or the shown line.
- Count the operations that dominate (comparisons, swaps, queries, allocations, network calls) and
  show them accumulating. State time/space cost with the reason from the code; call it measured only
  with runs at two or more sizes, and say which case (worst, average, this input).

## What the reader gets

Pick what serves the question; a step-through usually has all of these:

- Controls: previous/next, play/pause with speed, a slider to jump, first/last, keyboard (← → space
  Home End), and the step number. Linkable steps (`#step-5`) help when sharing.
- The code beside the state, with the current line marked and kept in view.
- State drawn in the shape of the thing: array cells with index and pointer names under them, a stack
  top-first, a queue front-first, a linked list with arrows, a tree or graph with the active node and
  edge, a table for DP or buckets, a variables table marking what just changed.
- Narration for the current step, and the decision taken at a branch (`a[mid] < x → lo = 6`).
- A text version of every step (an ordered list in `<details>`): it is the route without JavaScript
  and for screen readers. Announce step changes with `aria-live="polite"`.
- The evidence label (observed with the command, reasoned, synthetic) and the source.

For cause-and-effect pages: one control per variable, the effect next to the control, the current
value written out, and a short text saying what the reader should notice.

## Build

- One self-contained HTML file: inline CSS and JavaScript written for this page; no build step, no
  framework unless a pinned library genuinely draws something hard (a graph layout, a chart). Prefer
  inline SVG for diagrams.
- No network at runtime: no fetch, no analytics, no remote fonts. A library comes from a known CDN at
  an exact version, or is not used. Add a CSP that allows only what the page uses.
- Insert text with `textContent`, never `innerHTML`, for anything taken from code, logs or data.
  Never embed secrets, tokens or personal data from the repository.
- Use `assets/theme.css` tokens or the host's design system; both light and dark; state shown by
  shape, weight and inversion as well as colour; touch targets of 44 px; no decoration that does not
  explain anything; labels next to what they name.
- 2D by default. 3D only when depth is the subject (a physical shape, a space); the 3D viewer path is
  in `SKILL.md` §4.

## Check before delivering

1. Compare narration, lines, values and the final state with the code and with the run.
2. Open it at 375 and 1366 px, light and dark: no page-level horizontal scroll, readable labels, no
   overlap. Step through with the keyboard, play to the end, jump with the slider, open the text
   version. Check the console has no errors.
3. Without a browser, say the page was **not seen**; do not claim visual checks passed.
4. Publish it as an artifact when that tool exists; otherwise save it where the user asked and give
   the path. Do not add it to the explained repository unless asked.
