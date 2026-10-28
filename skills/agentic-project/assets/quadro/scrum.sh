#!/usr/bin/env bash
# scrum.sh — invólucro fino do CLI do quadro (scrum.mjs), para scripts, ganchos e agentes. Ver README.md.
D="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE="$(command -v node || true)"
[ -n "$NODE" ] || for n in /opt/homebrew/bin/node /usr/local/bin/node /usr/bin/node; do [ -x "$n" ] && NODE="$n" && break; done
[ -n "$NODE" ] || { echo '{"ok":false,"erro":"node não encontrado (precisa de Node ≥ 20)"}' >&2; exit 127; }
exec "$NODE" "$D/scrum.mjs" "$@"
