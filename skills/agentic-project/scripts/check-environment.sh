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
# Variables: CLAUDE_PLUGINS_DIR (defaults to $CLAUDE_CONFIG_DIR/plugins or ~/.claude/plugins)
#            to find plugins; AGENTIC_FEATURE_DIR and AGENTIC_DESIGN_DIR when agentic-feature
#            or agentic-design lives in another folder.
set -euo pipefail

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
fi

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
PLUGINS_DIR="${CLAUDE_PLUGINS_DIR:-$CLAUDE_DIR/plugins}"
# User and project skill folders, in discovery order (the same as SKILL.md).
SKILL_FOLDERS="$CLAUDE_DIR/skills
$HOME/.claude/skills
$HOME/.agents/skills
$HOME/.codex/skills
$HOME/.config/agents/skills
$HOME/.cursor/skills
$HOME/.gemini/skills
$HOME/.copilot/skills
$HOME/.config/opencode/skills
$PWD/.claude/skills
$PWD/.agents/skills"
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

# Find a named skill in agent skill folders; return its folder or nothing.
find_in_folders() { # find_in_folders <name>
  local d
  while IFS= read -r d; do
    if [ -f "$d/$1/SKILL.md" ]; then printf '%s' "$d/$1"; return 0; fi
  done <<EOF_FOLDERS
$SKILL_FOLDERS
EOF_FOLDERS
  return 0
}

# Named skill in the agentic-skills plugin: the most recently updated installed version
# (installed_plugins.json); without that file, the newest cache entry that is not orphaned.
plugin_skill() { # plugin_skill <name>
  local p="$PLUGINS_DIR" c v best=""
  [ -d "$p" ] || return 0
  if [ -f "$p/installed_plugins.json" ] && has node; then
    while IFS= read -r c; do
      if [ -f "$c/skills/$1/SKILL.md" ]; then printf '%s' "$c/skills/$1"; return 0; fi
    done < <(node -e 'const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const e=[];for(const [k,v] of Object.entries(j.plugins||{}))if(k.split("@")[0]==="agentic-skills")for(const x of [].concat(v))if(x&&x.installPath)e.push(x);e.sort((a,b)=>String(b.lastUpdated||"").localeCompare(String(a.lastUpdated||"")));for(const x of e)console.log(x.installPath)' "$p/installed_plugins.json" 2>/dev/null || true)
  fi
  [ -d "$p/cache" ] || return 0
  while IFS= read -r c; do
    v="${c%/skills/$1/SKILL.md}"
    if [ -e "$v/.orphaned_at" ]; then continue; fi
    if [ -z "$best" ] || [ "$v" -nt "$best" ]; then best="$v"; fi
  done < <(find "$p/cache" -maxdepth 6 -type f -path "*/skills/$1/SKILL.md" 2>/dev/null || true)
  if [ -n "$best" ]; then printf '%s' "$best/skills/$1"; fi
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
# Order: $AGENTIC_FEATURE_DIR or $AGENTIC_DESIGN_DIR, this skill's sibling folder, each
# agent's skill folders, then the agentic-skills plugin (the same order as the pre-commit
# generated by prepare-repo.sh). agentic-design only counts when it has the detector.
SIBLINGS="$(cd "$(dirname "$0")/../.." && pwd)"
sibling() { # sibling <name> <variable> <required-file>: print the folder or nothing
  local c
  for c in "${2:-/not-set}" "$SIBLINGS/$1"; do
    if [ -f "$c/SKILL.md" ] && [ -f "$c/$3" ]; then printf '%s' "$c"; return 0; fi
  done
  c="$(find_in_folders "$1")"
  if [ -n "$c" ] && [ -f "$c/$3" ]; then printf '%s' "$c"; return 0; fi
  c="$(plugin_skill "$1")"
  if [ -n "$c" ] && [ -f "$c/$3" ]; then printf '%s' "$c"; fi
  return 0
}
if [ -n "$(sibling agentic-feature "${AGENTIC_FEATURE_DIR:-}" SKILL.md)" ]; then
  record agentic-feature 1 recommended "skill" ""
else
  record agentic-feature 0 recommended "skill" "install the skills together (their repo's install.sh, or the plugin)"
fi
if [ -n "$(sibling agentic-design "${AGENTIC_DESIGN_DIR:-}" scripts/detect-slop.mjs)" ]; then
  record agentic-design 1 recommended "skill" ""
else
  record agentic-design 0 recommended "skill" "install the skills together (their repo's install.sh, or the plugin); essential with UI"
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
