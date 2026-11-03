#!/usr/bin/env bash
# install.sh: installs the eleven agentic-skills skills into coding agents.
#
# DRY RUN by default: shows what it would do without changing anything. Only --apply installs.
#
# Usage: ./install.sh [--apply] [--agent A]... [--project FOLDER] [--link] [--force] [--agents]
#   --apply          install
#   --agent A        claude | codex | codex-legacy | cursor | gemini | copilot | opencode | all
#                    (repeatable or comma-separated; defaults to agents whose config folder exists:
#                    ~/.claude ~/.codex ~/.cursor ~/.gemini ~/.copilot ~/.config/opencode).
#                    codex-legacy (~/.codex/skills, older Codex) is opt-in and excluded from all
#   --project DIR    install into that repository's skill folders instead of the user's
#   --link           symbolic links to this clone instead of copies (update with git pull)
#   --force          replace an existing skill; back up the previous one to
#                    ~/.agentic-skills-backups/<date>/
#   --agents         optional, Claude Code only: also copy the defined agents (implementer,
#                    implementer-ui, researcher, reviewer) into its agents folder
#                    (~/.claude/agents, or <repo>/.claude/agents with --project), without overwriting
#                    existing files (even with --force), and print an excerpt to paste into your
#                    CLAUDE.md. The installer never edits CLAUDE.md
#   -h, --help       show this help
#
# Destinations (documented by each agent in 2026-10):
#   claude                                user: ~/.claude/skills  project: <repo>/.claude/skills
#   codex-legacy                          user: ~/.codex/skills (no project scope)
#   codex, cursor, gemini, copilot, opencode
#                                         user: ~/.agents/skills  project: <repo>/.agents/skills
# Agents sharing a folder receive one installation. CLAUDE_CONFIG_DIR, when set, replaces ~/.claude.
# Exit: 0 = done (or dry run); 1 = --apply left skills uninstalled; 2 = usage error.
# Existing agent definitions are kept and do not affect the exit code.
set -euo pipefail

usage() { awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"; }

REPO="$(cd "$(dirname "$0")" && pwd -P)"  # resolve links: one clone reached through a link is still the same clone
SKILLS="agentic-project agentic-feature agentic-design agentic-implement agentic-fix agentic-code-review agentic-architecture agentic-explain agentic-analysis-optimization agentic-ci-audit agentic-tool-design"
ALL="claude codex cursor gemini copilot opencode"
LEGACY="codex-legacy"  # opt-in: current Codex reads ~/.agents/skills
# Claude Code agent definitions (--agents) are agentic-implement assets.
AGENTS_SOURCE="agentic-implement/assets/agents"
AGENTS_LIST="implementer implementer-ui researcher reviewer"

APPLY=0
WITH_AGENTS=0
LINK=0
FORCE=0
PROJECT=""
AGENTS=""

while [ $# -gt 0 ]; do
  case "$1" in
    --apply) APPLY=1 ;;
    --link) LINK=1 ;;
    --force) FORCE=1 ;;
    --agents) WITH_AGENTS=1 ;;
    --agent)
      [ $# -ge 2 ] || { echo "install.sh: --agent needs a name" >&2; exit 2; }
      AGENTS="$AGENTS $(printf '%s' "$2" | tr ',' ' ')"; shift ;;
    --agent=*) AGENTS="$AGENTS $(printf '%s' "${1#--agent=}" | tr ',' ' ')" ;;
    --project)
      [ $# -ge 2 ] || { echo "install.sh: --project needs a folder" >&2; exit 2; }
      PROJECT="$2"; shift ;;
    --project=*) PROJECT="${1#--project=}" ;;
    -h|--help) usage; exit 0 ;;
    *) echo "install.sh: unknown option: $1 (see --help)" >&2; exit 2 ;;
  esac
  shift
done

for s in $SKILLS; do
  if [ ! -f "$REPO/skills/$s/SKILL.md" ]; then
    echo "install.sh: cannot find $REPO/skills/$s/SKILL.md; run the script from the repository clone" >&2
    exit 2
  fi
done

if [ "$WITH_AGENTS" = 1 ]; then
  for f in $AGENTS_LIST claude-md-excerpt; do
    if [ ! -f "$REPO/skills/$AGENTS_SOURCE/$f.md" ]; then
      echo "install.sh: cannot find $REPO/skills/$AGENTS_SOURCE/$f.md; run the script from the repository clone" >&2
      exit 2
    fi
  done
fi

if [ -n "$PROJECT" ]; then
  if [ ! -d "$PROJECT" ]; then echo "install.sh: --project: folder $PROJECT does not exist" >&2; exit 2; fi
  PROJECT="$(cd "$PROJECT" && pwd)"
fi

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

config_folder() { # config_folder <agent>: the folder whose existence signals an installed agent
  case "$1" in
    claude) printf '%s' "$CLAUDE_DIR" ;;
    codex|codex-legacy) printf '%s' "$HOME/.codex" ;;
    cursor) printf '%s' "$HOME/.cursor" ;;
    gemini) printf '%s' "$HOME/.gemini" ;;
    copilot) printf '%s' "$HOME/.copilot" ;;
    opencode) printf '%s' "$HOME/.config/opencode" ;;
  esac
}

destination() { # destination <agent>: skill installation folder
  if [ "$1" = codex-legacy ]; then printf '%s' "$HOME/.codex/skills"; return; fi
  if [ "$1" = claude ]; then
    if [ -n "$PROJECT" ]; then printf '%s' "$PROJECT/.claude/skills"; else printf '%s' "$CLAUDE_DIR/skills"; fi
  else
    if [ -n "$PROJECT" ]; then printf '%s' "$PROJECT/.agents/skills"; else printf '%s' "$HOME/.agents/skills"; fi
  fi
}

agents_destination() { # Claude Code's agents folder
  if [ -n "$PROJECT" ]; then printf '%s' "$PROJECT/.claude/agents"; else printf '%s' "$CLAUDE_DIR/agents"; fi
}

short_path() { # show ~ in place of HOME
  case "$1" in
    "$HOME"/*) printf '~/%s' "${1#"$HOME"/}" ;;
    *) printf '%s' "$1" ;;
  esac
}

# Final agent list: deduplicated, in ALL then LEGACY order.
requested=""
for a in $AGENTS; do
  case "$a" in
    all) requested="$requested $ALL" ;;
    claude|codex|codex-legacy|cursor|gemini|copilot|opencode) requested="$requested $a" ;;
    *) echo "install.sh: unknown agent: $a (claude, codex, codex-legacy, cursor, gemini, copilot, opencode, all)" >&2; exit 2 ;;
  esac
done
selected=""
if [ -n "$requested" ]; then
  for a in $ALL $LEGACY; do
    case " $requested " in *" $a "*) selected="$selected $a" ;; esac
  done
  list_source="requested"
else
  for a in $ALL; do
    if [ -d "$(config_folder "$a")" ]; then selected="$selected $a"; fi
  done
  list_source="detected"
  if [ -z "$selected" ]; then
    echo "install.sh: no agents detected (looked for $(short_path "$CLAUDE_DIR"), ~/.codex, ~/.cursor, ~/.gemini, ~/.copilot, ~/.config/opencode)." >&2
    echo "install.sh: choose with --agent claude|codex|cursor|gemini|copilot|opencode|all" >&2
    exit 2
  fi
fi

if [ "$WITH_AGENTS" = 1 ]; then
  case " $selected " in
    *" claude "*) ;;
    *) echo "install.sh: --agents copies into Claude Code's agents folder; add --agent claude" >&2; exit 2 ;;
  esac
fi

if [ -n "$PROJECT" ]; then
  case " $selected " in
    *" codex-legacy "*) echo "install.sh: codex-legacy only supports user scope (~/.codex/skills); remove --project or that agent" >&2; exit 2 ;;
  esac
fi

if [ "$APPLY" = 1 ]; then mode="install"; else mode="DRY RUN (nothing changes; add --apply to install)"; fi
if [ "$LINK" = 1 ]; then form="symbolic links to $(short_path "$REPO")/skills"; else form="copies"; fi
if [ -n "$PROJECT" ]; then scope="project $(short_path "$PROJECT")"; else scope="user"; fi
echo "agentic-skills: $mode"
echo "  scope: $scope · form: $form · $list_source agents:$selected"
if [ -n "$PROJECT" ] && [ "$LINK" = 1 ]; then
  echo "  notice: with --project, --link points to a folder on this machine; do not commit those links"
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
pending=0
installed=0
new=0      # installed or replaced (or would be, in a dry run)
handled_destinations=""

install_one() { # install_one <source> <destination>
  mkdir -p "$(dirname "$2")"
  if [ "$LINK" = 1 ]; then
    ln -s "$1" "$2"
  else
    cp -R "$1" "$2"
    find "$2" -type f -name '*.sh' -exec chmod +x {} +
  fi
}

for a in $selected; do
  d="$(destination "$a")"
  case " $handled_destinations " in
    *" $d "*) continue ;;  # shared folder, already handled; the heading lists all readers
  esac
  handled_destinations="$handled_destinations $d"
  # Other selected agents reading this folder, for the heading.
  readers=""
  for b in $selected; do
    if [ "$(destination "$b")" = "$d" ]; then readers="${readers:+$readers, }$b"; fi
  done
  echo
  echo "$readers → $(short_path "$d")"
  for s in $SKILLS; do
    src="$REPO/skills/$s"
    dst="$d/$s"
    # Compare real paths, so a clone reached through a link counts as the same clone.
    linked_here=0
    if [ -L "$dst" ] && [ -d "$dst" ] && [ "$(cd "$dst" && pwd -P)" = "$src" ]; then linked_here=1; fi
    if [ "$LINK" = 1 ] && [ "$linked_here" = 1 ]; then
      echo "  already linked, kept $s"
      continue
    fi
    if [ -e "$dst" ] || [ -L "$dst" ]; then
      if [ "$LINK" = 0 ] && [ ! -L "$dst" ] && diff -rq "$src" "$dst" >/dev/null 2>&1; then
        echo "  identical, kept      $s"
        continue
      fi
      if [ "$FORCE" = 0 ]; then
        if [ "$LINK" = 0 ] && [ "$linked_here" = 1 ]; then
          echo "  exists, kept         $s (a link to this clone; --force replaces it with a copy)"
        elif [ "$LINK" = 1 ] && [ ! -L "$dst" ] && diff -rq "$src" "$dst" >/dev/null 2>&1; then
          echo "  exists, kept         $s (an identical copy; --force replaces it with a link)"
        else
          echo "  exists, kept         $s (different; --force replaces and backs up the current version)"
        fi
        pending=$((pending + 1))
        continue
      fi
      backup="$HOME/.agentic-skills-backups/$STAMP/$(printf '%s' "$d" | tr '/' '_')/$s"
      if [ "$APPLY" = 1 ]; then
        mkdir -p "$(dirname "$backup")"
        mv "$dst" "$backup"
        install_one "$src" "$dst"
        echo "  replaced             $s (previous version in $(short_path "$backup"))"
        installed=$((installed + 1))
      else
        echo "  would replace        $s (previous version would go to $(short_path "$backup"))"
      fi
      new=$((new + 1))
      continue
    fi
    if [ "$APPLY" = 1 ]; then
      install_one "$src" "$dst"
      if [ "$LINK" = 1 ]; then echo "  linked               $s"; else echo "  copied               $s"; fi
      installed=$((installed + 1))
    else
      if [ "$LINK" = 1 ]; then echo "  would link           $s → $(short_path "$src")"; else echo "  would copy           $s"; fi
    fi
    new=$((new + 1))
  done
done

# Optional agent definitions: always copied for editing, never overwritten.
new_agents=0
kept_agents=0
if [ "$WITH_AGENTS" = 1 ]; then
  da="$(agents_destination)"
  echo
  echo "claude (agents) → $(short_path "$da")"
  for f in $AGENTS_LIST; do
    src="$REPO/skills/$AGENTS_SOURCE/$f.md"
    dst="$da/$f.md"
    if [ -e "$dst" ] || [ -L "$dst" ]; then
      if [ ! -L "$dst" ] && cmp -s "$src" "$dst"; then
        echo "  identical, kept      $f"
      else
        echo "  exists, kept         $f (different; never overwritten, even with --force: compare by hand)"
      fi
      kept_agents=$((kept_agents + 1))
      continue
    fi
    if [ "$APPLY" = 1 ]; then
      mkdir -p "$da"
      cp "$src" "$dst"
      echo "  copied               $f"
    else
      echo "  would copy           $f"
    fi
    new_agents=$((new_agents + 1))
  done
  echo
  echo "Excerpt for your CLAUDE.md (the installer never edits it: paste it where you want):"
  echo "----------------------------------------------------------------"
  cat "$REPO/skills/$AGENTS_SOURCE/claude-md-excerpt.md"
  echo "----------------------------------------------------------------"
fi

# Cursor, OpenCode and Copilot in VS Code also read ~/.claude/skills.
has_claude=0; has_agents=0
for a in $selected; do
  if [ "$a" = claude ]; then has_claude=1; else has_agents=1; fi
done
echo
if [ "$has_claude" = 1 ] && [ "$has_agents" = 1 ] && [ -z "$PROJECT" ]; then
  echo "note: OpenCode, Cursor and Copilot in VS Code also read ~/.claude/skills. OpenCode"
  echo "      (measured in 1.18) lists each skill once, but randomly picks the copy from"
  echo "      ~/.claude/skills or ~/.agents/skills: keep both folders at the same version."
  if [ "$pending" -gt 0 ] && [ "$new" -gt 0 ]; then
    echo "notice: one folder gets the new version and another keeps the existing version; repeat with"
    echo "      --force to align them (previous versions go to ~/.agentic-skills-backups/)."
  fi
fi
if [ "$APPLY" = 1 ]; then
  echo "done: $installed installed, $pending pending. Open a new agent session to load them."
  if [ "$WITH_AGENTS" = 1 ]; then echo "agents: $new_agents copied, $kept_agents kept."; fi
  if [ "$pending" -gt 0 ]; then exit 1; fi
else
  echo "dry run: $pending unresolved. To install, repeat the same command with --apply."
  if [ "$WITH_AGENTS" = 1 ]; then echo "agents: $new_agents to copy, $kept_agents already present."; fi
fi
