Phase 9 — Initial backlog

Only when **Planning** includes an initial backlog. Use the existing tracker, plain Markdown or
the selected board module. Do not install the board/CLI, architecture or Spec Kit merely for this.

1. If installed, resolve `to-tickets` through `references/host-compatibility.md` and read its
   vertical slicing method; do not invoke a user-only command. Use its
   method (slices, blockers, human question), not its publication format: items go into the
   board or `docs/backlog.md`, not `.scratch/` files. Without the plugin, apply: each slice
   crosses every layer (data → logic → interface → tests), can be demonstrated alone and fits
   in one session.
2. Split the requested work into useful vertical slices (often 3–8 for an MVP; fewer for small
   scope, without inventing features to fill a quota). Each has a title, user outcome, blocked by, and verifiable
   acceptance criterion (command or observable step). In a new project the first is almost
   always the walking skeleton: a minimal end-to-end app running locally with one command,
   one test, typecheck and green hooks — giving subsequent agents a real verification loop.
   In adopt mode the app already runs: start with what is missing from verification (commands
   marked “to create” in phase 6) or the prefactor that makes the next features easy.
3. Show the recommended order and granularity. Ask only when an unresolved priority materially
   changes the plan; carry an existing user decision or delegation forward.
4. Write each feature as a `backlog` item using the CLI (`scrum.sh item add --id f01-<slug>
   --title "<title>" --criterion "<verifiable acceptance>" [--depends f00-…]`), sync the board,
   and regenerate `docs/backlog.md` (`scrum.sh markdown > docs/backlog.md`) if that is the view.
   Without a CLI, write `docs/backlog.md` manually.
5. If the selected board tracks setup, record only phases actually completed; do not create
   fictitious setup items for omitted modules.

Done when the selected tracker or `docs/backlog.md` contains the agreed slices and acceptance
criteria. If a board CLI is in use, confirm them with `scrum.sh show items`; otherwise no CLI gate.
