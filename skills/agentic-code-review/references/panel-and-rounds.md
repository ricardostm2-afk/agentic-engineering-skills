# Panel, consolidation and rounds (steps 0, 2–6)

Adapted from https://claude.dev/blog/solving-code-review-at-anthropic/: parallel reviewers,
confirmed findings before the author sees them, severity labels, bounded rounds. Adapted to trunk
work without PRs and an orchestrator (you) launching reviewers.

## §1 Fixed point

- **Base** and **reviewed SHA** (the tip under review). Review applies only to that SHA.
- Diff: `git diff <base>...<reviewed-sha>`; commits: `git log --oneline <base>..<reviewed-sha>`.
- Intent: spec, request, PR description or commit messages, and plan if present.
- Approved research, if the project has it: standards lens checks new dependencies and patterns against it.
- Closed findings from previous rounds, with each response.
- With UI, `<agentic-design>` path (detector and `<agentic-design>/references/ui-without-slop.md`),
  chosen variant and screenshots.

## §2 Reviewer worktree

- You create one per reviewer **outside the repo**, detached at the reviewed SHA:
  `git worktree add --detach "<tmp>/review-<topic>-<lens>" <reviewed-sha>`. `<tmp>` in order:
  project/user temporary folder; session scratchpad if available; only without either,
  `${TMPDIR:-/tmp}`. On macOS `$TMPDIR` is `/var/folders/…`, usually outside authorized folders,
  causing approval on every write. Brief includes worktree path and acceptance test folder
  (`<tmp>/acceptance-<topic>/`). Never the session tree, including for Codex or another agent.
- Reviewer runs everything there (`git -C <wt> …`), leaving no commits, files or other mutations.
- `<base>` is `git merge-base <trunk> <reviewed-sha>` (remote trunk, for example `origin/main`),
  recalculated each round; on a branch based on another unintegrated branch, use that branch's
  merge-base and review it separately.
- A command reviewing only uncommitted work runs after `git -C <wt> reset --soft <base>` (leaving
  `<base>..<reviewed-sha>` uncommitted), then restore HEAD with
  `git -C <wt> reset --soft <reviewed-sha>` before checking.
- Claude Code's `/security-review` **is not such a command**: it reviews `git diff origin/HEAD...`
  in its folder, empty after that reset (the lens would report “0 Important” without seeing anything).
  Run in `<wt>` at reviewed SHA, without reset; it counts as security lens only when
  `git -C <wt> merge-base origin/HEAD <reviewed-sha>` equals `<base>`. Otherwise (stacked branch,
  different `origin/HEAD`), use a subagent with the brief.
- A fresh worktree has no dependencies installed: reviewer does not install them in the repo
  tree. If a test cannot run, proof is “how to reproduce” (command and expected result), marked unrun.
- End with `git worktree list`, empty `git -C <wt> status --short` (nothing changed), then
  `git worktree remove <wt>`. Report a dirty worktree before removing it.

## §3 Lenses, model and ceiling

Lenses use the user's **review model**; without a rule, for example Sonnet 5.5 high in Claude and
gpt-6.1-sol medium in Codex. The verifier uses the stronger **verifier model**; without a rule,
for example Opus 5.5 medium in Claude and gpt-6.1-sol high in Codex (example model names; the
project picks its own).
Provider is the orchestrator's; use the other only on explicit human request
(`<agentic-implement>/references/choosing-the-agent.md` §3). The code's writer does not review it.

| Lens | What it seeks |
|---|---|
| Correctness | does code do what it says on every path? Read callers and consumers, including outside diff (`git grep` names). In a fix, root cause: fixing symptom but leaving cause is Important. Name the class and seek other instances in the diff. For deletions (function, route, flag, file), require three proofs: history (`git log -S<name>`: why it existed), indirect uses (runtime-built names, strings, enums, wrappers, schemas, consumers listed by `REVIEW.md`), and live configuration (environment variable, flag enabled for a customer). Found use is Important; production-only information becomes an integrator question; deleting killswitches, permanent flags or incident paths goes to the human with a recommendation |
| Spec | only with written intent: what is missing, unrequested, or looks done but is not. Plus reviewer acceptance test below |
| Standards | documented repo rules; a new pattern where one existed; dependency or capability outside approved research; `AGENTS.md`, `CLAUDE.md`, `REVIEW.md` or doc lines made false by the change |
| Security | server-enforced permissions tested with a role without access; customer isolation; input validation; secrets outside code; logs/errors without personal data or database values; new dependencies (known vulnerabilities, install-time code); may use `/security-review` under §2 conditions, counting as 1 |

- **Reviewers per level**: **Standard** groups its lenses (correctness, spec, standards, or
  `REVIEW.md`'s choices) in one fresh-context reviewer with one brief: they always run together
  on the same diff; one agent per lens rereading the repo multiplies cost and loses consolidation
  detail. **Complete** splits its four lenses between two reviewers, correctness with security and
  spec with standards, and adds a separate verifier only when the consolidated report has an Important.
- **Reviewer acceptance test** (spec lens, without reading author tests): **Complete** reviewer
  writes and runs an acceptance test outside the repo from intent; **Standard** describes it;
  **Quick** has none.
- **Silence the verifier** (correctness lens): search added lines for disabling typecheck or lint
  (or language equivalents):
  `git -C <wt> diff -U0 <base>...<reviewed-sha> | grep -nE '^\+.*(@ts-ignore|@ts-nocheck|@ts-expect-error|as any([^[:alnum:]_]|$)|eslint-disable|# *type: *ignore|# *noqa|//nolint)'`.
  Each occurrence needs a same-line reason (`@ts-expect-error <why>`,
  `eslint-disable-next-line <rule> -- <why>`). Missing reasons, or haste rather than decision
  (“to compile”), are Important in production code because a check passes without proving, and
  Nit in tests. A decision reason (wrong library type, linked issue) is not a finding.
- **No coverage number as gate**: keep the test failing on base, assertion integrity and guard
  mutations. Missing coverage numbers are not findings.
- Specialized lenses enter only when `REVIEW.md` defines them or diff requires them, replacing
  one above or adding within the ceiling: UI (agentic-design “review” mode: detector,
  `node <agentic-design>/scripts/detect-slop.mjs --diff <base>`, and `ui-without-slop.md` §5
  checklist against screenshots), docs, “fail-open guard / test unable to fail”, migrations.
- Lenses are subagents with the brief. A generic review skill/command following its own method
  bypasses brief and `REVIEW.md`: do not use it as a lens (`/security-review` is the security exception).
- **Ceiling: 5 review agents per change** (feature or branch), across rounds. Count those you
  launch for review: lenses and verifier. A skill/command used as lens counts 1. Fixing or
  reproducing sessions do not count: they are authorship. Near ceiling, combine lenses in one
  agent; if still impossible, stop and go to human with §9 summary.

## §4 Brief

One brief per lens from `assets/reviewer-brief.template.md`: fixed point, worktree, level and why,
intent, closed findings, lens, rules and report format. Read project `REVIEW.md` first; it overrides
brief. From round 2 onward returning lenses share one brief.

Reviewer reads brief, project rules (`REVIEW.md`, `AGENTS.md`), and referenced sections only,
nothing else from this skill: `SKILL.md` is the orchestrator process. A project's reviewer agent
definition must not tell it to read that either.

## §5 Consolidation

You, before findings reach the author:
1. combine lens reports;
2. deduplicate by **file + class** (keep best proof);
3. cut **Nits to 3 total**;
4. put Pre-existing on one line;
5. read lenses' “Level” and “Direction” lines and decide (§1 of `risk-levels.md`);
6. write first-line counts, or `0 Important — nothing to fix`;
7. run `node <skill>/scripts/validate-report.mjs <report.md>` (exit 0).

## §6 Confirmation

- **Verifier** (Complete, and hooks, CI or installers; round 1 only, and only when there is a
  consolidated Important): **one** agent with the verifier model (§3) and fresh context receives
  consolidated Important findings. For each, open `file:line`
  at reviewed SHA, follow path to effect, return confirmed, refuted (reason and `file:line`) or
  no verdict. Adds no findings. Never two in one round.
- **No verdict = not confirmed**: not sent to author as Important; stays on “Not confirmed” line.
  You may ask fixer to try reproduction (authorship, outside ceiling); reproduced becomes Important
  with proof.
- **Reproduction** (all levels and rounds): fixer reproduces each Important before fixing.
  Unreproduced is not fixed: respond “wrong: not reproduced” with attempt.

## §7 Labels and proof

- **Important**: worsens behavior, loses/exposes data, breaks callers, or lets a check pass without
  proving. An unanswered security Important blocks integration.
- **Nit**: anything else worth a line. At most 3 per consolidated report; no round or own commit.
- **Pre-existing**: defect already on base. Signal: line outside `git diff -U0 <base>..<reviewed-sha>`
  hunks, `git blame` before base. One report line, outside backlog and this fix. An outside-diff
  line made false by the change (doc, caller, old code brought into guard scope by a rename/move)
  is Important, not Pre-existing.
- Style, formatting, names are not findings unless behavior changes: lint, formatter and hooks own them.
- **Required `file:line` proof** from actual reading, not guessing by name:
  - code: effect and reproduction (red test, command, screenshot);
  - docs/standards: doc line and contradicting code/tree line (or `absent: <path>` for nonexistent citations);
  - dependency outside research: manifest diff line and absence in approved research.
- Search class across whole diff; instances outside are Pre-existing.
- Challenging approved approach is not a finding: goes to “Direction”.

## §8 Responses

One fixer per round, or two for groups without shared files, using the writer's model. Orchestrator
handles short fixes per `<agentic-implement>/references/choosing-the-agent.md` §1.

Every Important gets one response with a short reason:
- **fixed**: commit and passing proof (red → green test; corrected doc line);
- **wrong**: contradicting `file:line`, or “not reproduced” with attempt;
- **intentional**: decision location (decision, ADR, `REVIEW.md`);
- **does not matter**: why, from integrator or human.

Responses measure noise: many “wrong”/“does not matter” mean reviewer flags what it should not (`learning.md`).

## §9 Rounds

- **Level limit**: 1 requested Quick, 1 Standard, 2 Complete. An Important fixed with proof and an
  integrator-checked diff needs no round (exceptions below), so most changes end in round 1.
- From round 2: diff `<previous-reviewed-sha>..<reviewed-sha>` and closed findings list, never
  repeated (reopen only if new diff restores same effect on same lines). Only lenses with open
  Important findings return, combined in one agent when possible, plus lenses required by this
  round's level check. Verifier does not return.
- **At limit with an open Important**: stop and go to human with summary (open findings, responses,
  rounds run, unread diff, recommendation: another approach, split, accept with reason). No silent extra round.

**Commits after reviewed SHA.** These do not open a round:
- metadata (lessons, `Review:` line, radar, retro);
- fixing an Important from the last round with proof (red → green; doc line and its former
  contradiction) and integrator-checked diff (only what the finding identifies);
- reviewer acceptance test integrated unchanged (empty diff against delivered file), red before
  fix and green afterward.

Any other code (resolved conflict, fix without proof, new change) opens a round on that diff only;
with limit reached, go to human.

**Trunk into branch** (merge or rebase): `git diff <reviewed-sha>..<head>` now includes trunk code,
not to be reviewed. With `<new-base>` = recalculated `<base>`, review remains valid only if **every**
range-diff line is an equal pair (`<n>: <sha> = <n>: <sha> <subject>`; range-diff ignores merges)
**and** every branch merge has empty remerge-diff (without `--first-parent` it would include trunk's
internal merges):

```bash
(
set -o pipefail
rd=$(git range-diff --no-color <base>..<reviewed-sha> <new-base>..<head>) || { echo "range-diff failed: invalid"; exit 1; }
[ -n "$rd" ] || { echo "empty range-diff: invalid"; exit 1; }
printf '%s\n' "$rd" | grep -vqE '^ *[0-9]+: +[0-9a-f]+ = +[0-9]+: +[0-9a-f]+ ' && { echo "unequal pairs: review those"; exit 1; }
for m in $(git log --merges --first-parent --format=%H <reviewed-sha>..<head>); do
  [ -z "$(git show --remerge-diff --format= "$m")" ] || { echo "merge $m resolved conflicts: review remerge-diff"; exit 1; }
done
echo "only equal pairs and clean merges: review valid"
)   # subshell: exit does not close your shell
```

A wrong SHA or empty range makes range-diff fail or return empty; this **does not** count as review.
When invalid, round covers only changes: `!` (changed patch, even just context), `<` (removed commit),
and each conflicted merge's remerge-diff; `>` (new commits) follow cases above. Rebase can produce
`!` without conflicts, just changed context: when repo allows choice, bring trunk by merge.

## §10 How to undo and the `Review:` line

- **How to undo**, in integration commit body (commit or merge joining trunk; PR description if
  applicable): list commits with `git log --oneline <first-commit-parent>..<integrated-head>`
  (includes accepted fixes without rounds); without merges, `git revert --no-edit <parent>..<integrated-head>`;
  with an integration merge, `git revert -m 1 <merge>`. For migrations/external actions give specific steps.
- **`Review:`**, same body, one line:
  `Review: <reviewed-sha> · <level> · <r> rounds · <i> Important (<c> fixed, <e> wrong, <t> intentional, <n> does not matter) · <k> Nits · <p> Pre-existing · classes: <…>`.
  This is the only home of risk, undo and review; spec, retro and board point here.
- If repo rules give fields other names/locations, those apply; this skill and siblings always
  call the field “How to undo”.
