#!/usr/bin/env bash
# Runs the eval suite against an older version of the skills and against the working tree, so the
# two tables (score and cost per case) can be read side by side.
#   evals/compare.sh <git-ref-before> [extra `claude plugin eval` options]
# Environment: EVAL_MODEL pins the model under test (recommended); EVAL_MAX_COST caps each run, in USD (default 10).
set -eu
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
before="${1:?git ref of the version to compare against, for example v2.1.0 or HEAD~1}"
shift
tmp="$(mktemp -d)"
cleanup() { git -C "$root" worktree remove --force "$tmp/before" >/dev/null 2>&1 || true; rm -rf "$tmp"; }
trap cleanup EXIT

git -C "$root" worktree add -q --detach "$tmp/before" "$before"
rm -rf "$tmp/before/evals"
cp -R "$root/evals" "$tmp/before/evals"        # the same cases for both versions

options=(--ablation none --allow-tools Bash Write Edit --scaffold --trust-plugin --no-publish
         --max-cost-usd "${EVAL_MAX_COST:-10}")
[ -n "${EVAL_MODEL:-}" ] && options+=(--model "$EVAL_MODEL")

for side in before after; do
  dir="$tmp/before"; [ "$side" = after ] && dir="$root"
  echo "=== $side ($(git -C "$dir" rev-parse --short HEAD)$([ "$side" = after ] && git -C "$root" diff --quiet || echo ' + uncommitted'))"
  (cd "$dir" && claude plugin eval . "${options[@]}" "$@") || echo "(exit $? — see the report above)"
done
