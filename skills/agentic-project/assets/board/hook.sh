#!/usr/bin/env bash
# hook.sh start|heartbeat|end <job> [options] — connect any agent runner (cron, job queue, workflow script,
# CI) to the board (scrum.sh). Silent, always exits 0: a board failure must never stop the work.
#
#   start <job> [--name N] [--type T] [--model M] [--item I] [--detail D] [--prompt FILE]
#          → agent heartbeat (active) + event start
#   heartbeat <job> [--detail D] [...]       → agent heartbeat (call every 10 min; after 45 min without a
#                                            heartbeat the board shows the agent as waiting)
#   end    <job> [--code N] [--status finished|error] [--detail D] [...]
#          → agent end finished (code 0 or omitted) | error (code ≠ 0) + event end | error
#
# Agent: id = lowercase <job> using [a-z0-9-] (HOOK_PREFIX prefix, e.g. "job-"); default type:
# HOOK_TYPE or other-agent. With --prompt, name comes from the first Markdown heading ("# …" or
# "## Task N — …") and item from "item: <id>" (put it in the prompt header). Explicit options take precedence.
exec >/dev/null 2>&1
# If the board lock is busy, give up after 4 s (CLI default: 15 s): the runner may be waiting for the hook.
export SCRUM_WAIT_MS="${SCRUM_WAIT_MS:-4000}"
phase="${1:-}"; job="${2:-}"
[ -n "$job" ] || exit 0
shift 2 2>/dev/null || exit 0
S=(bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scrum.sh")

name=""; type=""; model=""; item=""; detail=""; prompt=""; code=""; status=""
while [ $# -gt 0 ]; do
  case "$1" in
    --name) name="${2:-}"; shift 2 ;;
    --type) type="${2:-}"; shift 2 ;;
    --model) model="${2:-}"; shift 2 ;;
    --item) item="${2:-}"; shift 2 ;;
    --detail) detail="${2:-}"; shift 2 ;;
    --prompt) prompt="${2:-}"; shift 2 ;;
    --code) code="${2:-}"; shift 2 ;;
    --status) status="${2:-}"; shift 2 ;;
    *) shift ;;
  esac
done

id="$(printf '%s' "${HOOK_PREFIX:-}$job" | tr 'A-Z' 'a-z' | tr -c 'a-z0-9' '-' | sed 's/--*/-/g; s/^-//; s/-$//' | cut -c1-64 | sed 's/-$//')"
[ -n "$id" ] || exit 0
if [ -n "$prompt" ] && [ -f "$prompt" ]; then
  [ -n "$name" ] || name="$(sed -n 's/^##* *Task [^[:space:]]*[[:space:]]*[—–-]*[[:space:]]*//p' "$prompt" | head -1)"
  [ -n "$name" ] || name="$(sed -n 's/^##*[[:space:]][[:space:]]*//p' "$prompt" | head -1)"
  [ -n "$item" ] || item="$(sed -n 's/^item:[[:space:]]*\([a-z0-9][a-z0-9-]*\)[[:space:]]*$/\1/p' "$prompt" | head -1)"
fi
# Without an explicit name, event text uses the agent's existing board name (from start), otherwise the job.
label="$name"
if [ -z "$label" ] && [ "$phase" = "end" ]; then
  label="$("${S[@]}" show agents "$id" 2>/dev/null | node -e 'let s="";process.stdin.on("data",(d)=>{s+=d}).on("end",()=>{try{process.stdout.write(String(JSON.parse(s).agents.name||""))}catch{}})' 2>/dev/null)"
fi
label="${label:-$job}"

# Agent options: supply name/type/model only when known, so heartbeat/end do not erase start's name.
# If the agent does not exist (start failed or was never called), retry with default name and type.
extra=()
[ -n "$name" ] && extra+=(--name "$name")
[ -n "$type" ] && extra+=(--type "$type")
[ -n "$model" ] && extra+=(--model "$model")
[ -n "$item" ] && extra+=(--item "$item")
ref=(--agent "$id")
[ -n "$item" ] && ref+=(--item "$item")
agent() { # agent <heartbeat|end> [options…]
  local action="$1"; shift
  "${S[@]}" agent "$action" "$id" "${extra[@]}" "$@" && return 0
  [ $? -eq 75 ] && return 1
  "${S[@]}" agent "$action" "$id" --name "$label" --type "${type:-${HOOK_TYPE:-other-agent}}" "${extra[@]}" "$@"
}
det=(); [ -n "$detail" ] && det=(--detail "$detail")

case "$phase" in
  start)
    [ -n "$name" ] || extra+=(--name "$label")
    [ -n "$type" ] || extra+=(--type "${HOOK_TYPE:-other-agent}")
    agent heartbeat --status active --detail "${detail:-job $job}"
    "${S[@]}" event start "$label started" "${ref[@]}" ;;
  heartbeat|alive)
    agent heartbeat --status active "${det[@]}" ;;
  end)
    if [ -z "$status" ]; then
      if [ -z "$code" ] || [ "$code" = "0" ]; then status=finished; else status=error; fi
    fi
    if [ "$status" = "error" ]; then
      agent end --status error --detail "${detail:-$job failed${code:+ (code $code)}}"
      "${S[@]}" event error "$label failed${code:+ (code $code)}" "${ref[@]}"
    else
      agent end --status finished --detail "${detail:-$job finished}"
      "${S[@]}" event end "$label finished" "${ref[@]}"
    fi ;;
esac
exit 0
