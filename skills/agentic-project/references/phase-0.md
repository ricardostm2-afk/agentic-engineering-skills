Phase 0 — Context and mode

0. Decide **where** the project belongs before inspecting its contents. The current folder is
   suitable only if it clearly belongs to this project. If it is the home folder, a folder
   holding several projects (`~/projects`, `~/code`…), another product's repo, or the request
   is for a new project and the folder already contains unrelated code, ask ONE question with
   a recommendation: “create it in `<parent-folder>/<slug>`?” After the answer,
   `mkdir -p <folder>` (reversible) and use it as `<repo>` in every command (`git -C <repo>`,
   `--dir <repo>` in scripts). Never `git init` in `$HOME` or in a folder containing other
   repos. Explain in one line that the new repo's `CLAUDE.md` loads only in a session opened
   there; this session keeps using full paths.
1. Read the human's context (skill arguments, message, referenced files). If none was supplied,
   ask a single open question: “Describe the project in 2–3 sentences: what, for whom, and what
   already exists.”
2. Inspect the folder: `git status`, `git log --oneline -5`, top-level tree, `README*`,
   `AGENTS.md`, `CLAUDE.md`, `.specify/`, `.agentic/`, stack manifests (`package.json`,
   `pyproject.toml`, `go.mod`, `Cargo.toml`…), `docs/`, existing CI.
3. Choose the mode: **new** (empty folder or docs only) or **adopt** (code exists). Say which
   and why in one line. If the folder is not yet a git repo and `git` exists, run
   `git init -b main` now: reversible, and allows a commit per phase from the start.
4. Create `docs/decisions.md` from `assets/decisions.template.md` (or, in adopt mode, add the
   Context section to the existing decision file) with: what the project is, mode, detected
   stack, what already exists.

Done when the mode is decided and the Context section is written.
