#!/usr/bin/env bash
# scrum.sh — thin board CLI wrapper (scrum.mjs) for scripts, hooks and agents. See README.md.
D="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE="$(command -v node || true)"
[ -n "$NODE" ] || for n in /opt/homebrew/bin/node /usr/local/bin/node /usr/bin/node; do [ -x "$n" ] && NODE="$n" && break; done
[ -n "$NODE" ] || { echo '{"ok":false,"error":"node not found (requires Node ≥ 20)"}' >&2; exit 127; }
exec "$NODE" "$D/scrum.mjs" "$@"
