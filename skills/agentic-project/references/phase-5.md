Phase 5 — Spec Kit + constitution

Only when **Spec Kit** is selected: requested, already adopted or justified by the work. Minimal
bootstrap and ordinary planning can finish without it. Before initialization, inspect whether
this project's integration already satisfies the need; if so, reuse it rather than force-init.
Use the current project's integration, resolved through `host-compatibility.md`.

1. Inspect `git status` and protect existing work (the next step rewrites files). Run init only
   with clean target paths and a recoverable baseline, or in an isolated copy for comparison.
   Do not stash, reset or overwrite unrelated user changes to make this gate pass.
2. `specify init --here --force --non-interactive --integration claude`. Creates `.specify/`
   and `speckit-*` skills in `.claude/skills/`. If another agent reading `.agents/skills/` will
   work in the repo (Codex, Cursor, Gemini, Copilot, OpenCode; including this session if it is
   not Claude Code), add `specify integration install codex`: creates
   `.agents/skills/speckit-*`, keeping Claude as the default integration (`specify integration
   status` confirms).
3. `git status` and `git diff`: restore (`git checkout -- <file>`) any existing project file
   changed by init (e.g. `.claude/settings.json`). Delete `speckit-taskstoissues/` in
   `.claude/skills/` and, if present, `.agents/skills/` (discontinued; prevents agents using it);
   the manifest in `.specify/integrations/` still lists it, so another `specify init` or upgrade
   recreates it and you must delete it again. Commit `.specify/` and the `speckit-*` skills in
   each folder (`.claude/skills/` and `.agents/skills/`): every agent cloning the repo finds its
   own. Init suggests ignoring `.claude/` because of local credentials: ignore only
   `.claude/settings.local.json` (phase 4's base `.gitignore` already does; add it to an older
   `.gitignore`); commit the skills.
4. Apply `speckit-constitution` with **this** project's principles from `docs/decisions.md` and
   `ARCHITECTURE.md` (e.g. “customer data stays in the chosen region”, “every new route has an
   authorization test”), never generic ones. Invoke it through the Skill tool only if the
   session started in this repo's root and it already existed; otherwise read **this repo's**
   `.claude/skills/speckit-constitution/SKILL.md` (or
   `.agents/skills/speckit-constitution/SKILL.md`) and follow it (the session's listed
   `speckit-*` skills may belong to another repo).

If init exits ≠ 0 (`specify` differs from the tested 1.2.0, changed flags): `git status`, restore
files changed by init (`git checkout -- <files>`), delete only what it created (untracked files
shown by `git status` that did not exist before), record the failure in `docs/decisions.md` and
follow “without `specify`” below; `check-environment.sh` shows how to install 1.2.0.

Without `specify` (and the human does not want to install it): skip init, write the principles
in a “Principles” section in `docs/decisions.md` and record that agentic-feature will use the
light spec.

Done when the constitution (or Principles section) exists with no unfilled placeholders.
