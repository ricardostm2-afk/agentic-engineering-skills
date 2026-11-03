#!/usr/bin/env bash
# prepare-repo.sh: prepare a repository for agents (agentic-project skill).
#
# Idempotent. Defaults to a DRY RUN: lists what it would do without changing anything.
# With --apply, creates only what is missing:
#   - git repository (main branch), if the folder is not already in one
#   - base .gitignore
#   - generic .githooks/pre-commit and .githooks/pre-push (detect the stack; pre-commit also
#     runs agentic-design's detect-slop.mjs on staged UI files, blocking only findings on
#     lines the commit adds or changes)
#   - git config core.hooksPath .githooks (only without an existing hooksPath or local hooks
#     in .git/hooks, which would otherwise be silently disabled)
#   - .agentic/areas.json (area map skeleton)
#   - with --with-ui: versioned copies of agentic-design's detect-slop.mjs and ui-without-slop.md
#     in .agentic/ (pre-commit then fails closed; agents without the skill can read the rules)
# Never overwrites: existing files are left as they are ("exists, kept"); existing files
# missing a recommendation produce a "warning" and count as pending.
# Does not commit or push.
#
# Usage: prepare-repo.sh [--apply] [--with-ui] [--dir PATH]
#        prepare-repo.sh --show pre-commit|pre-push|gitignore|areas   (prints generated content)
set -euo pipefail

usage() { sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'; }

APPLY=0
DIR="$PWD"
SHOW=""
WITH_UI=0
while [ $# -gt 0 ]; do
  case "$1" in
    --apply) APPLY=1 ;;
    --with-ui) WITH_UI=1 ;;
    --show)
      shift
      [ $# -gt 0 ] || { echo "error: --show requires: pre-commit, pre-push, gitignore or areas" >&2; exit 2; }
      SHOW="$1"
      ;;
    --dir)
      shift
      [ $# -gt 0 ] || { echo "error: --dir requires a path" >&2; exit 2; }
      DIR="$1"
      ;;
    -h|--help) usage; exit 0 ;;
    *) echo "error: unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

# Content of each generated file (also used by --show).
gitignore_content() {
  cat <<'EOF'
# Base .gitignore (agentic-project). Add what the project's stack needs.

# Secrets and local environment: never in git
.env
.env.*
!.env.example
*.pem
*.key
# Local Claude Code permissions (per machine; commit skills in .claude/skills/)
.claude/settings.local.json

# Dependencies, builds, reports
node_modules/
dist/
build/
coverage/
.venv/
__pycache__/

# System and editors
.DS_Store
Thumbs.db
.idea/
.vscode/*
!.vscode/extensions.json

# Local board state (synced to the artifact; outside git)
.agentic/board/state/

# Agent worktrees, if created inside the repo
.worktrees/
EOF
}

pre_commit_content() {
  cat <<'EOF'
#!/usr/bin/env bash
# Generic pre-commit (agentic-project): secrets + fast typecheck/lint + UI without slop.
# Fails closed: if an available check fails, the commit stops.
# Limit: gitleaks reads only staged content, but typecheck and lint run on the working tree;
# a commit can pass thanks to fixes left out of it. Check git diff --cached before committing.
# Do not bypass with --no-verify: fix the cause or talk to the human.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

failed=0
run() {
  echo "pre-commit: $*"
  if ! "$@"; then
    echo "pre-commit: FAILED: $*" >&2
    failed=1
  fi
}

# Secrets (gitleaks, if installed)
if command -v gitleaks >/dev/null 2>&1; then
  if gitleaks git --help 2>/dev/null | grep -q -- '--pre-commit'; then
    run gitleaks git --pre-commit --staged --redact --no-banner .
  else
    run gitleaks protect --staged --redact --no-banner
  fi
else
  echo "pre-commit: WARNING: gitleaks not installed, secrets NOT checked" >&2
fi

# JavaScript/TypeScript stack: run typecheck and lint if package.json defines them.
# Other stacks: add the project's fast command here and set checked=1.
checked=0
has_script() {
  if command -v node >/dev/null 2>&1; then
    node -e 'const p=require("./package.json");process.exit(p.scripts&&p.scripts[process.argv[1]]?0:1)' "$1"
  else
    grep -q "\"$1\"[[:space:]]*:" package.json
  fi
}
if [ -f package.json ]; then
  manager=npm
  [ -f pnpm-lock.yaml ] && manager=pnpm
  [ -f yarn.lock ] && manager=yarn
  { [ -f bun.lockb ] || [ -f bun.lock ]; } && manager=bun
  for s in typecheck lint; do
    if has_script "$s"; then
      checked=1
      case "$manager" in
        npm|pnpm) run "$manager" run -s "$s" ;;
        *) run "$manager" run "$s" ;;
      esac
    fi
  done
fi

if [ "$checked" = 0 ]; then
  echo "pre-commit: WARNING: no typecheck/lint detected; only secrets were checked" >&2
fi

# UI without the "AI look" (marker: agentic-project:pre-commit:3): agentic-design's
# detect-slop.mjs on staged UI files. Analyzes staged content (copied to a temporary folder),
# not the working tree. Only BLOCKS findings on lines this commit adds or changes
# (git diff --cached -U0). Existing blockers appear as "Pre-existing": they do not stop the
# commit and are not fixed along the way (one line in the report; no backlog item).
# Detector search order: .agentic/detect-slop.mjs (versioned copy),
# $AGENTIC_DESIGN_DIR/scripts/, user skill folders ($CLAUDE_CONFIG_DIR/skills/,
# ~/.claude/skills/, ~/.agents/skills/, ~/.codex/skills/, ~/.config/agents/skills/,
# ~/.cursor/skills/, ~/.gemini/skills/, ~/.copilot/skills/, ~/.config/opencode/skills/) and
# project folders (.claude/skills/, .agents/skills/), then Claude Code's agentic-skills plugin
# (the installed version, from plugins/installed_plugins.json). Fails closed with a versioned
# copy (no node or detector = stopped commit); otherwise only warns. Fix blockers, or escape
# with "slop-ok: <reason>".
plugin_design() { # agentic-design folder in Claude Code's agentic-skills plugin, or nothing
  # Most recently updated installed version (installed_plugins.json); without that file or
  # node, the newest cache version not marked as orphaned (.orphaned_at).
  local p="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins" c v best=""
  [ -d "$p" ] || return 0
  if [ -f "$p/installed_plugins.json" ] && command -v node >/dev/null 2>&1; then
    while IFS= read -r c; do
      if [ -f "$c/skills/agentic-design/scripts/detect-slop.mjs" ]; then printf '%s' "$c/skills/agentic-design"; return 0; fi
    done < <(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const e=[];for(const [k,v] of Object.entries(j.plugins||{}))if(k.split("@")[0]==="agentic-skills")for(const x of [].concat(v))if(x&&x.installPath)e.push(x);e.sort((a,b)=>String(b.lastUpdated||"").localeCompare(String(a.lastUpdated||"")));for(const x of e)console.log(x.installPath)' "$p/installed_plugins.json" 2>/dev/null || true)
  fi
  [ -d "$p/cache" ] || return 0
  while IFS= read -r c; do
    v="${c%/skills/agentic-design/scripts/detect-slop.mjs}"
    if [ -e "$v/.orphaned_at" ]; then continue; fi
    if [ -z "$best" ] || [ "$v" -nt "$best" ]; then best="$v"; fi
  done < <(find "$p/cache" -maxdepth 7 -type f -path '*/skills/agentic-design/scripts/detect-slop.mjs' 2>/dev/null || true)
  if [ -n "$best" ]; then printf '%s' "$best/skills/agentic-design"; fi
  return 0
}
set --
while IFS= read -r -d '' f; do set -- "$@" "$f"; done < <(
  git diff --cached --name-only -z --diff-filter=ACMR -- \
    '*.css' '*.scss' '*.tsx' '*.jsx' '*.html' '*.vue' '*.svelte')
if [ "$#" -gt 0 ]; then
  versioned=0
  if git ls-files --error-unmatch .agentic/detect-slop.mjs >/dev/null 2>&1; then versioned=1; fi
  no_detector() { # no_detector <reason>
    if [ "$versioned" = 1 ]; then
      echo "pre-commit: FAILED: detect-slop: $1 (the repo versions .agentic/detect-slop.mjs: UI must be checked)" >&2
      failed=1
    else
      echo "pre-commit: WARNING: $1; UI NOT checked (version .agentic/detect-slop.mjs to fail closed)" >&2
    fi
  }
  slop=""
  for c in "$PWD/.agentic" "${AGENTIC_DESIGN_DIR:-/not-set}/scripts"; do
    if [ -f "$c/detect-slop.mjs" ]; then slop="$c/detect-slop.mjs"; break; fi
  done
  if [ -z "$slop" ]; then
    for c in "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills" "$HOME/.claude/skills" "$HOME/.agents/skills" \
             "$HOME/.codex/skills" "$HOME/.config/agents/skills" "$HOME/.cursor/skills" \
             "$HOME/.gemini/skills" "$HOME/.copilot/skills" "$HOME/.config/opencode/skills" \
             "$PWD/.claude/skills" "$PWD/.agents/skills"; do
      if [ -f "$c/agentic-design/scripts/detect-slop.mjs" ]; then slop="$c/agentic-design/scripts/detect-slop.mjs"; break; fi
    done
  fi
  if [ -z "$slop" ]; then
    c="$(plugin_design)"
    if [ -n "$c" ]; then slop="$c/scripts/detect-slop.mjs"; fi
  fi
  if [ -z "$slop" ]; then
    no_detector "detect-slop.mjs not found (.agentic/, \$AGENTIC_DESIGN_DIR, agent skill folders, .claude/skills/, .agents/skills/, agentic-skills plugin)"
  elif ! command -v node >/dev/null 2>&1; then
    no_detector "node not installed"
  elif ! tmp_slop="$(mktemp -d "${TMPDIR:-/tmp}/slop.XXXXXX")"; then
    echo "pre-commit: FAILED: detect-slop (mktemp failed)" >&2
    failed=1
  else
    trap 'rm -rf "$tmp_slop"' EXIT
    mkdir "$tmp_slop/tree"
    printf '%s\0' "$@" | git checkout-index -z --stdin --prefix="$tmp_slop/tree/"
    echo "pre-commit: detect-slop ($# staged UI file(s); only changed lines block)"
    rc=0
    (cd "$tmp_slop/tree" && node "$slop" --json "$@") > "$tmp_slop/findings.json" || rc=$?
    if [ "$rc" -gt 1 ]; then
      echo "pre-commit: FAILED: detect-slop could not analyze (exit $rc)" >&2
      failed=1
    elif ! node - "$tmp_slop/findings.json" <<'JS'
// Separate blockers on changed lines (blocking) from Pre-existing findings (listed only).
const { readFileSync } = require("fs");
const { execFileSync } = require("child_process");
const { summary, findings } = JSON.parse(readFileSync(process.argv[2], "utf8"));
const cache = new Map();
function changedLines(f) { // new-side lines in git diff --cached -U0
  if (cache.has(f)) return cache.get(f);
  const s = new Set();
  const d = execFileSync("git", ["diff", "--cached", "-U0", "--no-color", "--no-ext-diff", "--", f], { encoding: "utf8" });
  for (const l of d.split("\n")) {
    const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(l);
    if (!m) continue;
    const start = Number(m[1]), n = m[2] === undefined ? 1 : Number(m[2]);
    if (n === 0) { s.add(start); s.add(start + 1); } // deleted line (e.g. slop-ok): neighbors count
    for (let i = start; i < start + n; i++) s.add(i);
  }
  cache.set(f, s);
  return s;
}
let blocking = 0, oldCount = 0;
for (const a of findings) {
  let type = a.severity;
  if (type === "blocker") {
    if (changedLines(a.file).has(a.line)) blocking++;
    else { type = "Pre-existing"; oldCount++; }
  }
  const hint = type === "Pre-existing" ? "unchanged line: does not block; one line in the report, no backlog item" : a.suggestion;
  console.log(`${a.file}:${a.line}  ${type}  ${a.rule}  ${a.message}\n    → ${hint}`);
}
console.log(`${summary.files} file(s) analyzed: ${blocking} blocker(s) on changed lines, ${oldCount} Pre-existing, ${summary.notices} notice(s).`);
process.exitCode = blocking > 0 ? 1 : 0;
JS
    then
      echo "pre-commit: FAILED: detect-slop (fix it, or escape with 'slop-ok: <reason>')" >&2
      failed=1
    fi
  fi
fi
exit "$failed"
EOF
}

pre_push_content() {
  cat <<'EOF'
#!/usr/bin/env bash
# Generic pre-push (agentic-project): fast tests before code leaves the machine.
# Uses package.json's test:quick (or test:fast) script if present, otherwise test.
# Fails closed: red tests stop the push. Do not use --no-verify.
# Limit: runs on the working tree, not the commits being sent; push with a clean tree
# (git status) to test what will leave the machine.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
export CI="${CI:-1}"   # non-interactive tools (no watch)

has_script() {
  if command -v node >/dev/null 2>&1; then
    node -e 'const p=require("./package.json");process.exit(p.scripts&&p.scripts[process.argv[1]]?0:1)' "$1"
  else
    grep -q "\"$1\"[[:space:]]*:" package.json
  fi
}

if [ -f package.json ]; then
  manager=npm
  [ -f pnpm-lock.yaml ] && manager=pnpm
  [ -f yarn.lock ] && manager=yarn
  { [ -f bun.lockb ] || [ -f bun.lock ]; } && manager=bun
  target=""
  for s in test:quick test:fast test; do
    if has_script "$s"; then target="$s"; break; fi
  done
  if [ -n "$target" ]; then
    echo "pre-push: $manager run $target"
    if ! "$manager" run "$target"; then
      echo "pre-push: FAILED: tests ($target). Push cancelled." >&2
      exit 1
    fi
  else
    echo "pre-push: WARNING: package.json has no test script; nothing checked" >&2
  fi
else
  # Other stacks: replace this warning with the project's fast test command.
  echo "pre-push: WARNING: no stack detected; nothing checked" >&2
fi
exit 0
EOF
}

areas_content() {
  cat <<'EOF'
{
  "_read": "Area map: which folders belong to each area, which checks to run when changing them, and their risk. Fill in during the architecture phase; agents read this before changing code.",
  "areas": [
    {
      "area": "example",
      "folders": ["src/example/"],
      "checks": ["npm run -s typecheck", "<tests for this area only; confirm they run >= 1 test>"],
      "risk": "medium",
      "notes": "Replace. risk: medium | high (data, permissions, payments, migrations: Complete route and security review; hooks, CI and installers receive security review based on paths, without high risk) | low"
    }
  ]
}
EOF
}

if [ -n "$SHOW" ]; then
  case "$SHOW" in
    pre-commit) pre_commit_content ;;
    pre-push) pre_push_content ;;
    gitignore) gitignore_content ;;
    areas) areas_content ;;
    *) echo "error: --show accepts pre-commit, pre-push, gitignore or areas" >&2; exit 2 ;;
  esac
  exit 0
fi

[ -d "$DIR" ] || { echo "error: folder does not exist: $DIR" >&2; exit 2; }
DIR="$(cd "$DIR" && pwd -P)"
REAL_HOME="$(cd "$HOME" 2>/dev/null && pwd -P || echo "$HOME")"
if [ "$DIR" = "/" ] || [ "$DIR" = "$REAL_HOME" ]; then
  echo "error: refusing to prepare $DIR (root or HOME). Pass the project folder with --dir." >&2
  exit 2
fi

command -v git >/dev/null 2>&1 || { echo "error: git is not installed" >&2; exit 1; }

IS_REPO=0
TOP="$DIR"
if git -C "$DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  IS_REPO=1
  TOP="$(git -C "$DIR" rev-parse --show-toplevel)"
fi

changes=0
pending=0   # items awaiting a human decision (warnings that block a change)

say() { printf '  %-16s %s\n' "$1" "$2"; }

# Record a creation: only count during a dry run; with --apply, the caller does the work.
mark_creation() { changes=$((changes + 1)); }

# create_file <relative-path> <executable:0|1>  (content from stdin)
create_file() {
  local rel="$1" executable="$2" target content
  target="$TOP/$1"
  content="$(cat)"
  if [ -e "$target" ] || [ -L "$target" ]; then
    say "exists, kept" "$rel"
    return 0
  fi
  mark_creation
  if [ "$APPLY" = 1 ]; then
    mkdir -p "$(dirname "$target")"
    printf '%s\n' "$content" > "$target"
    if [ "$executable" = 1 ]; then chmod +x "$target"; fi
    say "created" "$rel"
  else
    say "would create" "$rel"
  fi
}

if [ "$APPLY" = 1 ]; then
  echo "prepare-repo: APPLYING in $TOP"
else
  echo "prepare-repo: DRY RUN in $TOP (nothing changes; use --apply)"
fi
if [ "$TOP" != "$DIR" ]; then
  echo "  note: $DIR is inside repository $TOP; using the root."
fi

# 1. Git repository
if [ "$IS_REPO" = 1 ]; then
  branch="$(git -C "$TOP" symbolic-ref --short HEAD 2>/dev/null || echo '(detached HEAD)')"
  say "exists, kept" "git repository (current branch: $branch)"
else
  mark_creation
  if [ "$APPLY" = 1 ]; then
    git -C "$TOP" init -q -b main 2>/dev/null || {
      git -C "$TOP" init -q
      git -C "$TOP" symbolic-ref HEAD refs/heads/main
    }
    IS_REPO=1
    say "created" "git repository (main branch)"
  else
    say "would create" "git repository: git init -b main"
  fi
fi

# 2. Base .gitignore
create_file ".gitignore" 0 < <(gitignore_content)

# Warn about an existing .gitignore (warn only; no edits). The board state entry is
# checked in the board phase, when the board is installed.
if [ -f "$TOP/.gitignore" ] && ! grep -qxF ".env" "$TOP/.gitignore"; then
  say "warning" ".gitignore lacks the '.env' line (propose it to the human)"
  pending=$((pending + 1))
fi

# 3. Hooks
create_file ".githooks/pre-commit" 1 < <(pre_commit_content)

# Warn about an existing pre-commit without the UI detector, or generated by an older
# version of this script (warn only; no edits). In a project without UI, adding
# "# detect-slop: n/a (no UI, D-NNN)" to the hook closes the warning.
if [ -f "$TOP/.githooks/pre-commit" ]; then
  if ! grep -q "detect-slop" "$TOP/.githooks/pre-commit"; then
    say "warning" ".githooks/pre-commit does not run detect-slop. With UI: propose the block to the human"
    say "" "(view it with: $0 --show pre-commit). Without UI: '# detect-slop: n/a (no UI, D-NNN)'."
    pending=$((pending + 1))
  elif grep -q "Generic pre-commit (agentic-project)" "$TOP/.githooks/pre-commit" \
    && ! grep -q "agentic-project:pre-commit:3" "$TOP/.githooks/pre-commit"; then
    say "warning" ".githooks/pre-commit comes from an older version (looks for the detector in agentic-feature,"
    say "" "where it no longer lives, or blocks existing slop on untouched lines). Propose a replacement with"
    say "" "diff: $0 --show pre-commit"
    pending=$((pending + 1))
  fi
fi

create_file ".githooks/pre-push" 1 < <(pre_push_content)

# 4. core.hooksPath
if [ "$IS_REPO" = 1 ]; then
  current="$(git -C "$TOP" config --get core.hooksPath || true)"
else
  current=""
fi
# Local hooks (not .sample) in .git/hooks would be disabled by setting core.hooksPath.
local_hooks=""
if [ "$IS_REPO" = 1 ] && [ -z "$current" ]; then
  hooks_dir="$(git -C "$TOP" rev-parse --git-path hooks)"
  case "$hooks_dir" in /*) ;; *) hooks_dir="$TOP/$hooks_dir" ;; esac
  if [ -d "$hooks_dir" ]; then
    for h in "$hooks_dir"/*; do
      [ -f "$h" ] || continue
      case "$h" in *.sample) continue ;; esac
      local_hooks="$local_hooks $(basename "$h")"
    done
  fi
fi

if [ "$current" = ".githooks" ]; then
  say "exists, kept" "core.hooksPath=.githooks"
elif [ -n "$current" ]; then
  say "exists, kept" "core.hooksPath=$current (hooks in .githooks/ are NOT active; merge them manually)"
elif [ -n "$local_hooks" ]; then
  say "warning" "local hooks in .git/hooks:$local_hooks. Setting core.hooksPath would disable them."
  say "" "Left unset. Merge them into .githooks/ and, with human approval: git config core.hooksPath .githooks"
  pending=$((pending + 1))
else
  mark_creation
  if [ "$APPLY" = 1 ]; then
    git -C "$TOP" config core.hooksPath .githooks
    say "set" "core.hooksPath=.githooks"
  else
    say "would set" "core.hooksPath=.githooks"
  fi
fi

# 5. Area map (skeleton to fill in during the architecture phase)
create_file ".agentic/areas.json" 0 < <(areas_content)


# 6. UI project: versioned copies of the detector and rules (from installed agentic-design).
# Order: $AGENTIC_DESIGN_DIR, this skill's sibling folder (joint install or plugin), each
# agent's skill folders (user and project), then Claude Code's agentic-skills plugin
# (installed version). The same list as the generated pre-commit.
SIBLINGS="$(cd "$(dirname "$0")/../.." && pwd)"
plugin_design() { # agentic-design folder in Claude Code's agentic-skills plugin, or nothing
  # Most recently updated installed version (installed_plugins.json); without that file or
  # node, the newest cache version not marked as orphaned (.orphaned_at).
  local p="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/plugins" c v best=""
  [ -d "$p" ] || return 0
  if [ -f "$p/installed_plugins.json" ] && command -v node >/dev/null 2>&1; then
    while IFS= read -r c; do
      if [ -f "$c/skills/agentic-design/scripts/detect-slop.mjs" ]; then printf '%s' "$c/skills/agentic-design"; return 0; fi
    done < <(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const e=[];for(const [k,v] of Object.entries(j.plugins||{}))if(k.split("@")[0]==="agentic-skills")for(const x of [].concat(v))if(x&&x.installPath)e.push(x);e.sort((a,b)=>String(b.lastUpdated||"").localeCompare(String(a.lastUpdated||"")));for(const x of e)console.log(x.installPath)' "$p/installed_plugins.json" 2>/dev/null || true)
  fi
  [ -d "$p/cache" ] || return 0
  while IFS= read -r c; do
    v="${c%/skills/agentic-design/scripts/detect-slop.mjs}"
    if [ -e "$v/.orphaned_at" ]; then continue; fi
    if [ -z "$best" ] || [ "$v" -nt "$best" ]; then best="$v"; fi
  done < <(find "$p/cache" -maxdepth 7 -type f -path '*/skills/agentic-design/scripts/detect-slop.mjs' 2>/dev/null || true)
  if [ -n "$best" ]; then printf '%s' "$best/skills/agentic-design"; fi
  return 0
}
design_folder() { # print the agentic-design folder or nothing
  local c
  for c in "${AGENTIC_DESIGN_DIR:-/not-set}" "$SIBLINGS/agentic-design" \
           "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills/agentic-design" "$HOME/.claude/skills/agentic-design" \
           "$HOME/.agents/skills/agentic-design" "$HOME/.codex/skills/agentic-design" \
           "$HOME/.config/agents/skills/agentic-design" "$HOME/.cursor/skills/agentic-design" \
           "$HOME/.gemini/skills/agentic-design" "$HOME/.copilot/skills/agentic-design" \
           "$HOME/.config/opencode/skills/agentic-design" \
           "$TOP/.claude/skills/agentic-design" "$TOP/.agents/skills/agentic-design"; do
    if [ -f "$c/scripts/detect-slop.mjs" ]; then printf '%s' "$c"; return 0; fi
  done
  plugin_design
}
DESIGN="$(design_folder)"
for pair in "scripts/detect-slop.mjs:.agentic/detect-slop.mjs" "references/ui-without-slop.md:.agentic/ui-without-slop.md"; do
  origin="${pair%%:*}"; rel="${pair#*:}"
  if [ -e "$TOP/$rel" ]; then
    if [ -n "$DESIGN" ] && ! cmp -s "$DESIGN/$origin" "$TOP/$rel"; then
      say "warning" "$rel differs from installed agentic-design ($DESIGN). Show the diff and,"
      say "" "with human approval, update the copy: cp \"$DESIGN/$origin\" $rel"
      pending=$((pending + 1))
    else
      say "exists, kept" "$rel"
    fi
  elif [ "$WITH_UI" = 1 ]; then
    if [ -z "$DESIGN" ]; then
      say "warning" "--with-ui: agentic-design not found (\$AGENTIC_DESIGN_DIR, beside agentic-project, agent skill folders, agentic-skills plugin); $rel still to copy"
      pending=$((pending + 1))
    else
      mark_creation
      if [ "$APPLY" = 1 ]; then
        mkdir -p "$TOP/.agentic"
        cp "$DESIGN/$origin" "$TOP/$rel"
        say "copied" "$rel (from $DESIGN)"
      else
        say "would copy" "$rel (from $DESIGN)"
      fi
    fi
  fi
done

echo
if [ "$pending" -gt 0 ]; then
  echo "Pending: $pending item(s) awaiting a human decision (see 'warning' above)."
fi
if [ "$APPLY" = 1 ]; then
  echo "Done: $changes change(s). Nothing committed; review with git status."
elif [ "$changes" = 0 ] && [ "$pending" = 0 ]; then
  echo "Dry run: nothing to do, the repository is already prepared."
elif [ "$changes" = 0 ]; then
  echo "Dry run: nothing the script can do alone; the pending items above need the human."
else
  echo "Dry run: $changes change(s) to make. To apply: $0 --apply$( [ "$WITH_UI" = 1 ] && echo ' --with-ui') --dir $TOP"
fi
