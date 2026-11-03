#!/usr/bin/env bash
# check-environment.sh: check the local tools used by agentic-project.
# Installs nothing: each missing tool gets an installation command for the human to approve.
#
# Levels:
#   essential    the skill cannot run without it        -> exit 1 if missing
#   recommended  a weaker alternative exists            -> exit 0, but shown as MISSING
#   optional     improves security or quality           -> exit 0
#
# Usage: check-environment.sh [-h]
# Variables: AGENTIC_HOST=claude|codex (defaults to claude),
#            CLAUDE_PLUGINS_DIR (defaults to $CLAUDE_CONFIG_DIR/plugins or ~/.claude/plugins)
#            or AGENTIC_PLUGIN_DIR (Codex portable plugin.json),
#            AGENTIC_FEATURE_DIR and AGENTIC_DESIGN_DIR when siblings live elsewhere.
set -euo pipefail

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
fi

AGENTIC_HOST="${AGENTIC_HOST:-claude}"
case "$AGENTIC_HOST" in
  claude) CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"; PLUGINS_DIR="${CLAUDE_PLUGINS_DIR:-$CLAUDE_DIR/plugins}" ;;
  codex) CLAUDE_DIR=""; PLUGINS_DIR="${AGENTIC_PLUGIN_DIR:-}" ;;
  *) echo "check-environment.sh: AGENTIC_HOST must be claude or codex" >&2; exit 2 ;;
esac
OS="$(uname -s)"

missing_essential=0
missing_other=0

# Installation commands by platform (Homebrew on macOS, apt on Linux). Native Windows
# (Git Bash, MSYS, Cygwin) does not support this skill's scripts and hooks: use WSL.
WINDOWS=0
case "$OS" in MINGW*|MSYS*|CYGWIN*) WINDOWS=1 ;; esac
inst() { # inst <macos-command> <linux-command>
  if [ "$WINDOWS" = 1 ]; then printf '%s' "use WSL (Ubuntu) and run the skill inside it"
  elif [ "$OS" = "Darwin" ]; then printf '%s' "$1"; else printf '%s' "$2"; fi
}

row() { # row <tool> <status> <level> <version> <install>
  printf '%-16s %-6s %-12s %-10s %s\n' "$1" "$2" "$3" "$4" "$5"
}

record() { # record <tool> <ok:0|1> <level> <version> <install>
  local name="$1" ok="$2" level="$3" version="$4" install="$5"
  if [ "$ok" = 1 ]; then
    row "$name" "OK" "$level" "$version" "-"
  else
    row "$name" "MISSING" "$level" "$version" "$install"
    if [ "$level" = "essential" ]; then
      missing_essential=$((missing_essential + 1))
    else
      missing_other=$((missing_other + 1))
    fi
  fi
}

has() { command -v "$1" >/dev/null 2>&1; }

# Find a plugin SKILL.md; return its path or nothing.
find_skill() { # find_skill <path-pattern>
  if [ -d "$PLUGINS_DIR" ]; then
    find "$PLUGINS_DIR" -maxdepth 9 -type f -name SKILL.md -path "$1" 2>/dev/null | head -n 1 || true
  fi
}

# Validate identity and the requested file; a valid folder has the expected frontmatter name.
skill_valid() { # skill_valid <folder> <name> [file]
  [ -d "$1" ] && [ -f "$1/SKILL.md" ] && awk -v expected="$2" '
    NR == 1 && /^---[[:space:]]*$/ { inside=1; next }
    inside && /^name:[[:space:]]*/ { value=$0; sub(/^name:[[:space:]]*/, "", value); sub(/[[:space:]]+$/, "", value); if (value == expected) correct=1; found=1; next }
    inside && /^---[[:space:]]*$/ { exit }
    END { exit !(found && correct) }
  ' "$1/SKILL.md" && { [ -z "${3:-}" ] || [ -f "$1/$3" ]; }
}

# Find a named skill in agent skill folders; return its folder or nothing.
find_in_folders() { # find_in_folders <name>
  local d base name="$1" found="" total=0 variable
  variable="${name#agentic-}"
  variable="${variable//-/_}"
  variable="$(printf '%s' "$variable" | tr '[:lower:]' '[:upper:]')"
  base="$PWD"
  while [ "$base" != "/" ]; do
    if [ "$AGENTIC_HOST" = "claude" ]; then d="$base/.claude/skills"; else d="$base/.agents/skills"; fi
    if skill_valid "$d/$name" "$name"; then
      found="${found}${found:+$'\n'}$d/$name"
      total=$((total + 1))
    fi
    base="$(dirname "$base")"
  done
  if [ "$total" -gt 1 ]; then
    printf 'check-environment: sibling skill %s is ambiguous in project folders; set $AGENTIC_%s_DIR.\n%s\n' "$name" "$variable" "$found" >&2
    return 2
  elif [ "$total" -eq 1 ]; then
    printf '%s' "$found"
    return 0
  fi
  if [ "$AGENTIC_HOST" = "claude" ]; then
    set -- "$CLAUDE_DIR/skills" "$HOME/.claude/skills"
  else
    set -- "$HOME/.agents/skills" "/etc/codex/skills"
  fi
  for d in "$@"; do
    if skill_valid "$d/$name" "$name"; then printf '%s' "$d/$name"; return 0; fi
  done
  return 0
}

# Named skill in the agentic-skills plugin: the most recently updated installed version
# (installed_plugins.json); without that file, the newest cache entry that is not orphaned.
plugin_skill() { # plugin_skill <name>
  local p="$PLUGINS_DIR" c v best=""
  if [ "$AGENTIC_HOST" = "codex" ]; then
    p="${AGENTIC_PLUGIN_DIR:-}"
    [ -n "$p" ] && [ -d "$p" ] && has node || return 0
    c="$(node -e 'const fs=require("fs"),path=require("path");const root=path.resolve(process.argv[1]);const file=fs.existsSync(path.join(root,"plugin.json"))?path.join(root,"plugin.json"):path.join(root,".codex-plugin","plugin.json");if(!fs.existsSync(file))process.exit(1);const j=JSON.parse(fs.readFileSync(file));if(typeof j.skills!=="string")process.exit(1);const out=path.resolve(root,j.skills);if(out===root||out.startsWith(root+path.sep))console.log(out)' "$p" 2>/dev/null || true)"
    if [ -n "$c" ] && skill_valid "$c/$1" "$1"; then printf '%s' "$c/$1"; fi
    return 0
  fi
  [ -d "$p" ] || return 0
  if [ -f "$p/installed_plugins.json" ] && has node; then
    while IFS= read -r c; do
      if skill_valid "$c/skills/$1" "$1"; then printf '%s' "$c/skills/$1"; return 0; fi
    done < <(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const e=[];for(const [k,v] of Object.entries(j.plugins||{}))if(k.split("@")[0]==="agentic-skills")for(const x of [].concat(v))if(x&&x.installPath)e.push(x);e.sort((a,b)=>String(b.lastUpdated||"").localeCompare(String(a.lastUpdated||"")));for(const x of e)console.log(x.installPath)' "$p/installed_plugins.json" 2>/dev/null || true)
  fi
  [ -d "$p/cache" ] || return 0
  while IFS= read -r c; do
    v="${c%/skills/$1/SKILL.md}"
    if [ -e "$v/.orphaned_at" ]; then continue; fi
    if [ -z "$best" ] || [ "$v" -nt "$best" ]; then best="$v"; fi
  done < <(find "$p/cache" -maxdepth 6 -type f -path "*/skills/$1/SKILL.md" 2>/dev/null || true)
  if [ -n "$best" ] && skill_valid "$best/skills/$1" "$1"; then printf '%s' "$best/skills/$1"; fi
  return 0
}

echo "Environment for agentic-project ($OS). This script installs nothing."
if [ "$WINDOWS" = 1 ]; then
  echo "WARNING: native Windows is unsupported (bash hooks and scripts). Install WSL (Ubuntu) and run the skill inside it."
fi
echo
row "TOOL" "STATUS" "LEVEL" "VERSION" "INSTALL (only if MISSING)"
row "----------" "------" "-----" "------" "----------------------"

# git
if has git; then
  record git 1 essential "$(git --version | awk '{print $3}')" ""
else
  record git 0 essential "-" "$(inst 'xcode-select --install  (or brew install git)' 'sudo apt install -y git')"
fi

# node >= 20 (the board CLI is a node script)
if has node; then
  v="$(node -v 2>/dev/null | sed 's/^v//')"
  major="${v%%.*}"
  case "$major" in ''|*[!0-9]*) major=0 ;; esac
  if [ "$major" -ge 20 ]; then
    record "node>=20" 1 essential "$v" ""
  else
    record "node>=20" 0 essential "$v" "nvm install 22  (or $(inst 'brew install node' 'see https://nodejs.org'))"
  fi
else
  record "node>=20" 0 essential "-" "nvm install 22  (or $(inst 'brew install node' 'see https://nodejs.org'))"
fi

# gh (GitHub CLI): remotes, PRs, branch protection
if has gh; then
  record gh 1 recommended "$(gh --version 2>/dev/null | head -n 1 | awk '{print $3}')" ""
else
  record gh 0 recommended "-" "$(inst 'brew install gh' 'sudo apt install -y gh  (see https://cli.github.com)'); then: gh auth login (human)"
fi

# uv (installs specify)
if has uv; then
  record uv 1 recommended "$(uv --version 2>/dev/null | awk '{print $2}')" ""
else
  record uv 0 recommended "-" "$(inst 'brew install uv' 'curl -LsSf https://astral.sh/uv/install.sh | sh')"
fi

# specify (Spec Kit); without it, the skill uses the light spec template
if has specify; then
  sv="$(specify version 2>/dev/null | tr -d '\033' | grep -o 'CLI Version *[0-9][0-9.]*' | awk '{print $3}' || true)"
  # The skill was tested with 1.2.0 (init flags). Other versions show as MISSING, with the
  # replacement command (without --force, uv keeps the already installed version).
  if [ "${sv:-}" = "1.2.0" ]; then
    record specify 1 recommended "$sv" ""
  else
    record specify 0 recommended "${sv:-?}" "uv tool install --force specify-cli --from git+https://github.com/github/spec-kit.git@v1.2.0  (tested: 1.2.0)"
  fi
else
  record specify 0 recommended "-" "uv tool install --force specify-cli --from git+https://github.com/github/spec-kit.git@v1.2.0"
fi

# gitleaks (secrets in pre-commit)
if has gitleaks; then
  record gitleaks 1 optional "$(gitleaks version 2>/dev/null | head -n 1)" ""
else
  record gitleaks 0 optional "-" "$(inst 'brew install gitleaks' 'see https://github.com/gitleaks/gitleaks/releases')"
fi

# Sibling skills: agentic-feature (the entry point for each feature) and agentic-design
# (UI slop rules and detector; essential for UI projects, used by pre-commit and AGENTS.md).
# Order: explicit variable, sibling folder, project/ancestors and this host's global roots; only
# then this host's plugin. agentic-design only counts when it has the detector.
SIBLINGS="$(cd "$(dirname "$0")/../.." && pwd)"
sibling() { # sibling <name> <variable> <required-file>: print the folder or nothing
  local c explicit="$2" variable="${1#agentic-}"
  variable="${variable//-/_}"
  variable="$(printf '%s' "$variable" | tr '[:lower:]' '[:upper:]')"
  if [ -n "$explicit" ]; then
    if skill_valid "$explicit" "$1" "$3"; then printf '%s' "$explicit"; return 0; fi
    printf 'check-environment: $AGENTIC_%s_DIR points to an invalid skill for %s (%s).\n' "$variable" "$1" "$explicit" >&2
    return 2
  fi
  if skill_valid "$SIBLINGS/$1" "$1" "$3"; then printf '%s' "$SIBLINGS/$1"; return 0; fi
  if c="$(find_in_folders "$1")"; then :; else return $?; fi
  if [ -n "$c" ] && skill_valid "$c" "$1" "$3"; then printf '%s' "$c"; return 0; fi
  c="$(plugin_skill "$1")"
  if [ -n "$c" ] && skill_valid "$c" "$1" "$3"; then printf '%s' "$c"; fi
  return 0
}
if c="$(sibling agentic-feature "${AGENTIC_FEATURE_DIR:-}" SKILL.md)"; then
  if [ -n "$c" ]; then
    record agentic-feature 1 recommended "skill" ""
  else
    record agentic-feature 0 recommended "skill" "install the skills together (their repo's install.sh, or the plugin)"
  fi
else
  rc=$?
  exit "$rc"
fi
if c="$(sibling agentic-design "${AGENTIC_DESIGN_DIR:-}" scripts/detect-slop.mjs)"; then
  if [ -n "$c" ]; then
    record agentic-design 1 recommended "skill" ""
  else
    record agentic-design 0 recommended "skill" "install the skills together (their repo's install.sh, or the plugin); essential with UI"
  fi
else
  rc=$?
  exit "$rc"
fi

# Third-party skills: a Claude Code plugin or a skill installed in an agent's skill folder.
# Run /plugin commands inside Claude Code; gh skill serves other agents.
if [ -n "$(find_skill '*mattpocock*/grilling/SKILL.md')" ] || [ -n "$(find_in_folders grilling)" ]; then
  record mattpocock 1 recommended "skills" ""
else
  record mattpocock 0 recommended "skills" "in Claude Code: /plugin marketplace add mattpocock/skills  and  /plugin install mattpocock-skills@mattpocock; other agents (untested): gh skill install mattpocock/skills <name> --dir ~/.agents/skills"
fi

echo
if [ "$missing_essential" -gt 0 ]; then
  echo "Result: $missing_essential essential and $missing_other other tool(s) missing. Install the essentials before continuing."
  exit 1
fi
if [ "$missing_other" -gt 0 ]; then
  echo "Result: essentials OK; $missing_other recommended/optional tool(s) missing. The skill continues with each tool's fallback."
else
  echo "Result: all OK."
fi
exit 0
