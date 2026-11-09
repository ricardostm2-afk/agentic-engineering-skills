#!/usr/bin/env bash
# Runs a frozen quality suite against snapshots of an older skill version and the working tree.
# Only tool_used/Agent budget graders are excluded; routing (Skill) and quality checks remain.
# Keeps native JSON reports, diagnostics, and comparison metadata, including failed runs.
#   evals/compare.sh <git-ref-before> [extra `claude plugin eval` options]
# Environment: EVAL_MODEL is required; EVAL_JUDGE_MODEL defaults to EVAL_MODEL.
# EVAL_EFFORT optionally sets CLAUDE_CODE_EFFORT_LEVEL for both runs; EVAL_MAX_COST defaults to 10 USD per side.
# EVAL_RESULTS_DIR is the parent of a new comparison directory (default: evals/results).
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
before="${1:?git ref of the version to compare against, for example v2.1.0 or HEAD~1}"
shift
if [ -z "${EVAL_MODEL:-}" ]; then
  echo "error: set EVAL_MODEL to the same explicit model for both comparison runs" >&2
  exit 2
fi
for option in "$@"; do
  case "$option" in
    --model|--model=*|--judge-model|--judge-model=*|--json|--json=*|--output-dir|--output-dir=*|--eval-dir|--eval-dir=*|--)
      echo "error: $option conflicts with comparison models, cases or output; use EVAL_MODEL, EVAL_JUDGE_MODEL and EVAL_RESULTS_DIR" >&2
      exit 2 ;;
  esac
done
if [ -n "${EVAL_EFFORT:-}" ]; then export CLAUDE_CODE_EFFORT_LEVEL="$EVAL_EFFORT"; fi
command -v node >/dev/null 2>&1 || { echo "error: node is required for comparison metadata" >&2; exit 1; }
command -v claude >/dev/null 2>&1 || { echo "error: claude is not installed" >&2; exit 1; }
before_sha="$(git -C "$root" rev-parse --verify --end-of-options "$before^{commit}")"
after_sha="$(git -C "$root" rev-parse HEAD)"
claude_version="$(claude --version)"
tmp="$(mktemp -d)"
tmp="$(cd "$tmp" && pwd -P)"
cleanup() { git -C "$root" worktree remove --force "$tmp/baseline" >/dev/null 2>&1 || true; rm -rf "$tmp"; }
trap cleanup EXIT

# Capture source status before creating output so a custom in-repo result directory does
# not mark a clean candidate dirty. Ignored local inputs count; saved eval reports do not.
status_paths=(. ':(exclude)evals/results/')
if [[ "$tmp" = "$root/"* ]]; then status_paths+=(":(exclude)${tmp#"$root/"}"); fi
git -C "$root" status --porcelain=v1 -z --untracked-files=normal --ignored -- "${status_paths[@]}" > "$tmp/after-status"
git -C "$root" worktree add -q --detach "$tmp/baseline" "$before_sha"
# Read-only sources: the baseline worktree and current checkout are never rewritten.
# One prepared suite is exposed under the same relative --eval-dir in both snapshots.
node "$root/evals/prepare-quality-suite.mjs" "$root" "$tmp" > "$tmp/suite-profile.json"
result_parent="${EVAL_RESULTS_DIR:-$root/evals/results}"
mkdir -p "$result_parent"
result_parent="$(cd "$result_parent" && pwd)"
results="$(mktemp -d "$result_parent/compare.XXXXXX")"
cp -R "$tmp/quality-suite" "$results/effective-suite"

options=(--ablation none --allow-tools Bash Write Edit --scaffold --trust-plugin --no-publish
         --max-cost-usd "${EVAL_MAX_COST:-10}" --model "$EVAL_MODEL" --judge-model "${EVAL_JUDGE_MODEL:-$EVAL_MODEL}")
after_label="$(node - "$results/metadata.json" "$tmp/suite-profile.json" "$tmp/after-status" "$before_sha" "$after_sha" "$claude_version" "$before" "$@" <<'JS'
const { readFileSync, writeFileSync } = require("node:fs");
const [file, profileFile, statusFile, beforeSha, afterSha, claudeVersion, beforeRef, ...extraOptions] = process.argv.slice(2);
const profile = JSON.parse(readFileSync(profileFile, "utf8"));
const afterStatus = readFileSync(statusFile, "utf8").split("\0").filter(Boolean);
const metadata = {
  schemaVersion: 1, startedAt: new Date().toISOString(), completedAt: null,
  model: process.env.EVAL_MODEL, judgeModel: process.env.EVAL_JUDGE_MODEL || process.env.EVAL_MODEL,
  effort: process.env.CLAUDE_CODE_EFFORT_LEVEL || null,
  maxCostUsdPerSide: process.env.EVAL_MAX_COST || "10", claudeVersion,
  beforeRef, beforeSha, afterSha, beforeDirty: false, afterDirty: afterStatus.length > 0,
  afterStatus, ...profile, suiteSnapshot: "effective-suite", extraOptions,
  statuses: { before: null, after: null },
};
writeFileSync(file, JSON.stringify(metadata, null, 2) + "\n");
process.stdout.write(metadata.afterDirty ? " + uncommitted" : "");
JS
)"
echo "Comparison results: $results"

failed=0
for side in before after; do
  dir="$tmp/before"; sha="$before_sha"; dirty=""
  if [ "$side" = after ]; then dir="$tmp/after"; sha="$after_sha"; dirty="$after_label"; fi
  echo "=== $side (${sha:0:12}$dirty)"
  # --json has an optional path argument, so leave it last. Keep stdout valid JSON and
  # stderr separate; the native exit status alone decides whether this run succeeded.
  if (cd "$dir" && claude plugin eval . "${options[@]}" "$@" --eval-dir agentic-quality-evals --output-dir "$results/$side-report" --json) \
       > "$results/$side.json" 2> "$results/$side.stderr.log"; then
    status=0
  else
    status=$?
    failed=1
  fi
  cat "$results/$side.stderr.log" >&2
  node - "$results/metadata.json" "$side" "$status" <<'JS'
const { readFileSync, writeFileSync } = require("node:fs");
const [file, side, status] = process.argv.slice(2);
const metadata = JSON.parse(readFileSync(file, "utf8"));
metadata.statuses[side] = Number(status);
if (side === "after") metadata.completedAt = new Date().toISOString();
writeFileSync(file, JSON.stringify(metadata, null, 2) + "\n");
JS
  echo "$side exit: $status; result: $results/$side.json"
done
exit "$failed"
