# Visual variants ("variants" mode)

The human chooses UI by seeing 2–3 real variants, never from descriptions. A real variant uses
the project's tokens and components, data at production density, and screenshots at target
resolutions. What a variant must not contain is in `ui-without-slop.md`; this page is the
procedure (prepare, build, filter, capture, show and record) and does not repeat those rules.

## 1. Prepare

1. Reuse valid captures or capture the 2 neighbouring screens at the main resolution: the variant must look like the
   same application beside them. If the screen exists, also capture its current state at the
   target resolutions and project themes: this is the **baseline**. Confirm that the reproduction
   of the current state matches the real app before trusting the variants.
2. Prepare realistic synthetic data: the quantity the caller measured (not 3 rows), long names,
   empty values, accents. Never real people's data.
3. Start from supplied/project research and approved local patterns. Use external research only
   for a material unknown, time-sensitive claim or explicit request. When needed, use mature
   products in the category and primary sources with source/date (`ui-without-slop.md` §1), never
   galleries. Reuse applicable evidence; choosing variants is not a whole-platform freshness audit.

## 2. Choose the prototype form

Build in the app's stack, without habitually installing a demo stack. In order of preference:

- **On the real route** (preferred when the app runs locally): variants live on the real page
  or the page that will host it, switched by `?variant=A|B|C`, with the actual surrounding header,
  navigation and data. This is "sub-shape A" in `mattpocock-skills:prototype` (invoke it if
  available). An isolated screen looks good in any variant; next to the real app, density and
  hierarchy problems become visible.
- **Static HTML mockups** when the app does not run locally or setting up the route costs more
  than the decision: one file per variant, CSS variables copied from the actual token file
  (not approximated), project fonts and reproduced application frame (bar, navigation).

In either case, the prototype is disposable: named as a prototype, no writes to real data,
outside `main` (in a detached worktree or mockups outside git). Never promote it: rewrite the
chosen variant as production code in "build" mode.

## 3. Build genuinely different variants

Variants disagree on **structure**: layout, information hierarchy, primary action or interaction
model (e.g. list + detail panel vs. table with inline editing vs. step-by-step flow). Different
colours, text or corners do not make a variant. If two look similar, remake one with an explicit
constraint ("no table", "everything on one screen", "keyboard first"). Each brief calls for
controlled boldness: "no filler" must not become "the list with a strip above it".

Each variant has:
- **Name** expressing the idea ("List with panel", "Editable table");
- **Thesis**: why this composition serves this task and person, in one line ("faster for someone
  who does this 50 times a day");
- **Structure**: reading order, rhythm, density and primary action path;
- **Signature**: a recognisable product gesture, with a function (it need not be an effect);
- **Limit**: what it deliberately leaves out and sacrifices.

For new work or requested exploration, grammars, real diversity and the compatibility test are
in `directions.md`. A targeted adjustment has no variants.

## 4. Before showing: the three filters

The order is: working screenshots (main resolution and theme, populated and empty) → the three
filters → corrections → final screenshots (§5). The checklist and critique need the working
screenshots (contrast against the actual background, density, empty state).

1. **The detector**, from the repository root (`<skill>` is this skill's folder):
   ```bash
   node <skill>/scripts/detect-slop.mjs <mockup-folder>   # HTML mockups
   node <skill>/scripts/detect-slop.mjs --diff <base>     # prototype on the route
   ```
   Exit 1 = blockers: fix them, or escape with `slop-ok: <reason>` only for a project decision
   (`ui-without-slop.md` §6). Exit 2 = did not analyse: does not count as clean
   (`ui-without-slop.md` §7). Read notices, "Allowed" findings and pre-existing findings one by one.
2. **The checklist** in `ui-without-slop.md` §5, for what a detector cannot see (lists, empty
   states, hierarchy, one dominant action, secondary text, pretend states, the cover-the-logo test).
3. **Independent critique**: another agent, which did not build the variant, receives the
   screenshots and task (not the answer you expect), checks them against §2 and §5 of
   `ui-without-slop.md` and returns findings. Without subagents, make a separate pass yourself
   and say so when showing it ("non-independent critique").

## 5. Capture

Capture each variant as described in `proof.md`, "Capture". The **depth** comes from the caller:
"main" shows all variants only at the main resolution and theme, with other combinations
captured only for the chosen one before the caller closes the decision; "complete" captures all
combinations for all variants. Without a specified depth, use "main".

## 6. Choice package

Side by side (a page or image with variants in columns, or images in sequence with the same
framing), and for each: name, thesis, 1–2 benefits and 1–2 concrete costs (what it sacrifices),
and detector output (`0 blockers, n notices`). Finish with the recommendation and reason, and
whether the critique was independent. Options: A, B, C, "you choose", or "mix" (the human says
what to take from each; a mix with structural changes needs a new screenshot).

The caller asks the human (`agentic-feature`, checkpoint 2). When called on its own, the skill
asks directly, with these options.

## 7. Record

Save in the caller's specified folder (on its own: a temporary folder outside the repository,
whose path you give the human): screenshots, mockup HTML (or the prototype's route location)
and `choice.md` with the chosen variant, source of the choice (human or delegated), requested
adjustments, captured resolutions and themes, and prototype location. The chosen variant becomes
the **review reference**: compare implementation with these screenshots (`proof.md`).
