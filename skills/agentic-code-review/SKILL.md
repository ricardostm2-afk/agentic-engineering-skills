---
name: agentic-code-review
description: >-
  Reviews a code diff, branch, PR or completed agent change for evidenced defects before
  integration. Also audits existing code for cleanup when explicitly requested. Use agentic-design
  for visual critique, agentic-ci-audit for CI audits, and agentic-fix to fix a reported bug.
---

# agentic-code-review

Host differences, installations, tool substitutes and sibling resolution follow
`<agentic-project>/references/host-compatibility.md`; find that sibling through
`$AGENTIC_PROJECT_DIR` first and read the reference when the host varies.

Code review for work with agents. The question is not “did someone read this?” but “what can go
wrong with this change, and which check catches it?”. Review agents did not write the code;
every finding carries `file:line` evidence, noise is cut before reaching the author, and rounds
are bounded: an agent author fixes everything raised and an agent reviewer always finds more.

Method built from two articles, summarized in our own words:
- verification layers and agent review:
  https://claude.dev/blog/solving-code-review-at-anthropic/
- evidence-based maintenance and model/instruction evaluation:
  https://developers.openai.com/blog/maintaining-software-with-the-gpt-6-family
- other ideas, without copied text: mechanical batches reviewed by class from Microsoft's
  [“Cheap code, precious trust”](https://commandline.microsoft.com/agentic-software-engineering-large-scale-code-migration-language-modernization-spec-driven-development/)
  (Command Line, 2026-10-26), and “Silence the verifier” from `unclebob/ub-mode` (revision
  `57a8bdd28`, no license).

**Repo rules always override this skill.** First read `REVIEW.md` (root, where `AGENTS.md`/`CLAUDE.md`
points, or `git ls-files '*REVIEW.md'`), then `AGENTS.md`/`CLAUDE.md`. `REVIEW.md` defines repo-specific
levels with other names, zones and “what failure means”, always-high paths, lenses per zone,
commands and guards; use them. Process (labels, report format, rounds, ceiling) belongs to this
skill; model belongs to the user. Use the project's own review or classification commands when present.

The siblings `<agentic-design>` (`$AGENTIC_DESIGN_DIR`), `<agentic-feature>` (`$AGENTIC_FEATURE_DIR`)
and `<agentic-implement>` (`$AGENTIC_IMPLEMENT_DIR`) follow the common reference; paths, prefixes
and order are not repeated here. This skill can review without them but uses those that are found.

## Two modes

- **Review** (default): a diff, branch, PR, commit range or what an agent just did. Steps 0–7 below.
- **Maintenance**: audit existing code for cleanup (dead code, finished flags).
  **Only on an explicit human request in this conversation**; never on your own initiative or
  “while here” during review. Read `references/maintenance.md` and use `assets/maintenance-brief.template.md`.

Suite or CI audits (including flaky and slow tests) enter through `agentic-ci-audit`;
the resulting diff returns to this skill for review.

Outside both: scanning old code for defects during review. What existed on the base is Pre-existing,
in one report line, and does not enter the backlog.

## Steps

| Step | What | Reference |
|---|---|---|
| 0 | Fixed point: base, reviewed SHA, intent | `references/panel-and-rounds.md` §1 |
| 1 | Level from the change | `references/risk-levels.md` |
| 2 | Parallel lens panel, in a worktree outside the repo | `references/panel-and-rounds.md` §2–§4 |
| 3 | Consolidation | `references/panel-and-rounds.md` §5 |
| 4 | Confirm Important findings | `references/panel-and-rounds.md` §6 |
| 5 | Report | `assets/report.template.md` + `scripts/validate-report.mjs` |
| 6 | Responses and rounds | `references/panel-and-rounds.md` §7–§10 |
| 7 | Learning | `references/learning.md` |

### 0. Fixed point

Review applies to a SHA. Pin base and **reviewed SHA** before launching anyone:
- branch or PR: `git merge-base <target> <branch>` gives base; reviewed SHA is branch tip;
- human-specified range: use it unchanged;
- uncommitted changes: `git stash create` gives a tree SHA without changing it (tracked files only:
  new untracked files from `git status --short` stay out and go in “Not read”).

Gather intent: spec, request, PR description or commit messages. Without written intent the spec
lens does not run; the report says so. When called by agentic-feature, all this comes in the request
(track, base, reviewed SHA, spec, plan, approved research, screenshots).

### 1. Level from the change

You (orchestrator) classify from the diff, never the author's report: Quick, Standard or Complete,
or `REVIEW.md` levels. Always-high paths, hook/CI/installer rules (raise lenses, not rounds) and
lesson escalation: `references/risk-levels.md`. State level and why in one line. Reclassify **every
post-review diff before any exception**, adding only newly required lenses when risk rises. Lenses do not reclassify; if what they read needs more, they write a
“Level” line in the report and you decide.

Quick has no panel: proof is the author's red → green test. On an explicit human review request,
run one lens (correctness) and one round.

### 2. Panel

- One worktree per reviewer, created by you **outside the repo**, detached at the reviewed SHA:
  `git worktree add --detach "<tmp>/review-<topic>-<lens>" <reviewed-sha>`, using `<tmp>` from
  `references/panel-and-rounds.md` §2. Pass its path in the brief. Never the session tree; this
  also applies to a Codex reviewer or any other agent.
- Each reviewer is a fresh-context subagent with a brief from `assets/reviewer-brief.template.md`,
  read after `REVIEW.md`, with lenses assigned by `references/panel-and-rounds.md` §3 for the level.
  Launch them in parallel.
- Lenses, model and ceiling (5 review agents per change, across rounds):
  `references/panel-and-rounds.md` §3. Lenses use the user's review model; the verifier, the
  stronger verifier model.
- `/security-review` reviews `git diff origin/HEAD...` in its working folder, not uncommitted
  changes: run in the worktree at the reviewed SHA without reset. It counts as the security lens
  only if `git -C <wt> merge-base origin/HEAD <reviewed-sha>` equals `<base>`; otherwise use a
  subagent with the brief (`references/panel-and-rounds.md` §2).
- Review diffs over ~1,000 lines in slices (each counts toward the ceiling); tell the human that
  splitting the change would be better. Review a mechanical batch with an approved playbook by
  class (`references/maintenance.md`, “Mechanical batch”).

### 3. Consolidation

Combine lens reports before sending to the author: deduplicate by file + class (keep the strongest
proof), cut Nits to 3 total, put Pre-existing findings in one line, and write the first-line counts.

### 4. Confirmation

No Important reaches the author without proof; none is fixed “just in case”.
- Complete, and hooks, CI or installers, when there is a consolidated Important: **one verifier**
  in round 1, using the verifier model and fresh context, on those findings. Confirms, refutes
  (with `file:line`) or gives no verdict (= unconfirmed: “Not confirmed” line, not sent to author as Important).
- Every level and round: the fixer reproduces each Important before fixing (red test; for a doc,
  its line and the contradicting line). Do not fix what is not reproduced.

### 5. Report

Follow `assets/report.template.md`: first line
`Review <sha> · <level> · [lens <lens> · ]round <n>/<limit> · <i> Important · <n> Nits · <p> Pre-existing`;
`0 Important — nothing to fix` immediately below when none; each finding labeled with `file:line`;
Pre-existing on one line. Before sending to author or human:

<!-- card:review-1 -->
```bash
node <skill>/scripts/validate-report.mjs <report.md>   # 0 = conforming; 1 = failure list
```
<!-- /card:review-1 -->

The validator checks form, not truth; truth belongs to step 4.

### 6. Responses and rounds

- Every Important gets a response: **fixed** (commit and passing proof), **wrong** (contradicting
  `file:line`, or “not reproduced” with the attempt), **intentional** (where decided) or
  **does not matter** (why).
- Fixing is outside this skill: Important findings go to the author (the agent who made the change,
  or a fix session, which is authorship). If the human asks you to fix, you become that fix's author
  and the next round reviews it.
<!-- card:review-2 -->
- Round limit by level (1 for requested Quick, 1 for Standard, 2 for Complete). From round 2 onward:
  only the new diff, without repeating closed findings; combine lenses with open Important findings
  and add only newly required lenses from classification.
<!-- /card:review-2 -->
- After reclassifying every post-review diff, what can enter without a round (metadata, an Important fix with proof and
  checked diff, unchanged integration of a reviewer's test), trunk brought into the branch (merge
  or rebase), “how to undo” and the `Review:` line: `references/panel-and-rounds.md` §9–§10.
<!-- card:review-3 -->
- **At the limit, with an open Important, stop and go to the human** with a summary (open findings,
  responses, rounds, unreviewed diff, your recommendation). Never silently add a round.
<!-- /card:review-3 -->

At each round's end check `git worktree list` and `git -C <wt> status --short` (empty: the reviewer
left no mutations), then remove each worktree (`git worktree remove <wt>`).

### 7. Learning

- Something escaped (reverted, incident, human report), or the class appeared a second time:
  one lesson line in `references/learning.md`'s format.
- Repeated finding: fix at the source. If a machine detects it without false positives, make a
  guard, lint or test; otherwise one `REVIEW.md` line (`references/review-md.md`).
- Changed reviewer brief, `REVIEW.md`, prompts, model or effort: run against evaluation cases
  (`assets/eval-case.template.md`) before adopting.
- No project `REVIEW.md`: suggest creating it from `assets/REVIEW.template.md` at the end
  (do not create without OK; agentic-project creates it in phase 6).

## Final message to the human

The consolidated, validated report, then briefly: level and why, lenses and models used (agent
count against ceiling), unread scope, responses to Important findings, and what review does not
cover (what no lens checked: real performance, production behavior, what only CI or the human sees).
An open Important or “Direction” goes first.

## In other agents

- **Codex**: lenses and verifier are Codex subagents with the same brief and the user's review
  model, the verifier with the verifier model (without a rule, for example gpt-6.1-sol with medium
  effort, and high for the verifier; example model names; the project picks its own). Default
  sandbox makes `.git` read-only: `git worktree add` needs approval. Ask once for the session; without approval, run lenses sequentially in one human-created worktree.
  In a job launched without subagents (launcher disables them), each reviewer the level requires
  separately (Complete's two reviewers, verifier) is its own job with its own brief; a job combining what
  the level separates marks the report “review not independent”.
- **Cursor, Gemini CLI, Copilot, OpenCode**: subagents unconfirmed. Without them each lens runs
  in a new session (fresh context) with the brief; without even that, perform lenses sequentially
  yourself after closing all writing, and mark the report “review not independent”.
- **`/security-review`** exists only in Claude Code; elsewhere the security lens is a subagent
  with the brief. Without user rules, review model means the agent's reasoning model with medium effort.
- Without `node`, check the report manually against `assets/report.template.md` and say so in
  the final message.

## When to read each file

| File | When |
|---|---|
| `references/layers.md` | explaining where review fits, or when the human asks what it misses |
| `references/risk-levels.md` | step 1, every round |
| `references/panel-and-rounds.md` | steps 0, 2–6 |
| `references/security-lens.md` | assigned security lens; single operational checklist, also linked in the brief |
| `references/review-md.md` | writing or reviewing `REVIEW.md`, or a repeated finding |
| `references/learning.md` | step 7; changing reviewer (brief, prompts, model, effort) |
| `references/maintenance.md` | maintenance mode on explicit request only; and “Mechanical batch” for a scripted diff with approved playbook |
| `assets/reviewer-brief.template.md` | step 2, one brief per lens; verifier uses last section |
| `assets/report.template.md` | steps 3 and 5 |
| `assets/REVIEW.template.md` | creating `REVIEW.md` (human OK, or agentic-project) |
| `assets/eval-case.template.md` | step 7, recording or running evaluation cases |
| `assets/maintenance-brief.template.md` | maintenance mode |
| `scripts/validate-report.mjs` | step 5 (`node --test <skill>/scripts/*.test.mjs` when changing it) |
