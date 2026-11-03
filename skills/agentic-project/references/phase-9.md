Phase 9 — Initial backlog

1. Read `to-tickets`' vertical slicing method (find the installed version in the cache:
   `find ~/.claude/plugins/cache -path '*mattpocock*/to-tickets/SKILL.md' | sort | tail -1`;
   without a result, search `~/.claude/plugins`); do not invoke it, only the user can. Use its
   method (slices, blockers, human question), not its publication format: items go into the
   board or `docs/backlog.md`, not `.scratch/` files. Without the plugin, apply: each slice
   crosses every layer (data → logic → interface → tests), can be demonstrated alone and fits
   in one session.
2. Split the MVP into 3–8 features. Each has a title, user outcome, blocked by, and verifiable
   acceptance criterion (command or observable step). In a new project the first is almost
   always the walking skeleton: a minimal end-to-end app running locally with one command,
   one test, typecheck and green hooks — giving subsequent agents a real verification loop.
   In adopt mode the app already runs: start with what is missing from verification (commands
   marked “to create” in phase 6) or the prefactor that makes the next features easy.
3. Show the human the list in one question: “Are the granularity and order right?” (recommend
   yours). Adjust.
4. Write each feature as a `backlog` item using the CLI (`scrum.sh item add --id f01-<slug>
   --title "<title>" --criterion "<verifiable acceptance>" [--depends f00-…]`), sync the board,
   and regenerate `docs/backlog.md` (`scrum.sh markdown > docs/backlog.md`) if that is the view.
   Without a CLI, write `docs/backlog.md` manually.
5. Record phases 8 and 9 on the board like the earlier phases (`scrum.sh item add --id setup-p8
   --title "Methodology" --status integrated`, likewise `setup-p9`).

Done when items are on the board (or in `docs/backlog.md`) and `scrum.sh show items` shows them.
