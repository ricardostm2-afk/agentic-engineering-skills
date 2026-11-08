# Reviewer brief: <change> · lens <lens> · round <n>/<limit>

<!-- agentic-code-review template (step 2), also called by agentic-feature step 6. One brief per
reviewer with lenses assigned by panel-and-rounds.md §3 (Standard: all in one; Complete: two); verifier uses
last section only. Fill <...>, remove inapplicable parts and comment. <agentic-code-review>,
<agentic-implement>, <agentic-design> are absolute skill paths (third only for UI). Recipient wrote
no part of change. Orchestrator already checked level against round's diff; lenses do not redo it.
Orchestrator creates outside-repo worktree, fills Where you run and <acceptance-tmp> for spec lens,
both in panel-and-rounds.md §2's <tmp>. -->

## Fixed point

- Base: `<base-sha>` · Reviewed: `<reviewed-sha>` (review applies only to this SHA).
- Diff: `git diff <base-sha>...<reviewed-sha>`. From round 2, new diff only:
  `git diff <previous-reviewed-sha>..<reviewed-sha>`.
- Commits: `git log --oneline <base-sha>..<reviewed-sha>`.
- Review level: <Quick (requested) | Standard | Complete, or `REVIEW.md`'s>, because <criterion>
  (<+ security and verifier: hooks, CI or installers>, if applicable). Model: <user review model,
  e.g. Sonnet high | gpt-6.1-sol medium; verifier: Opus medium | gpt-6.1-sol high; example model
  names; the project picks its own>.
- Intent: <spec, request, PR description or commit messages> · plan: <path or “none”> · approved
  research: <path or “none”> · UI: <variants/choice.md and screenshots, or “no UI”>.
- Project rules: `REVIEW.md` (if present overrides brief), `AGENTS.md`, constitution. Read these,
  this brief and referenced sections; review `SKILL.md` is for orchestrator (`panel-and-rounds.md` §4).
- Closed findings: <id · file:line · response>, or “none”. Do not repeat. Reopen only if new diff
  restores same effect on same lines.

## Where you run

In `<review-wt>`, outside repo, detached at reviewed SHA, created for you by orchestrator
(`git worktree add --detach <review-wt> <reviewed-sha>`); run every command there
(`git -C <review-wt> …`), never session tree. Do not create/remove it: orchestrator checks
`git worktree list`, `git -C <review-wt> status --short` then removes it. Leave no commits, files or
other mutations. <For an uncommitted-only review command: orchestrator already ran
`git -C <review-wt> reset --soft <base-sha>`. `/security-review` is not one (it reviews
`git diff origin/HEAD...`): run at reviewed SHA without reset.>

## Your lens: <lens>

<Keep only yours (one, or multiple when combined); delete others.>

- **Correctness**: code does what it says on every path? Read callers and consumers of each changed
  function, route, type or format, including outside diff (`git grep` names). For fixes seek cause:
  fixing symptom but leaving cause is Important. Before declaring deletion safe (function, route,
  flag, file), gather history (`git -C <review-wt> log -S<name>`: why it existed), indirect uses
  (runtime-built name, string, enum, wrapper, schema, `REVIEW.md` consumers), live configuration
  (environment variable, flag enabled for a customer). Found use is Important; production-only
  information goes as integrator question. Deleted killswitch, permanent flag or incident path goes
  to human with recommendation: neither finding nor approval. Also run “Silence the verifier”
  search from `<agentic-code-review>/references/panel-and-rounds.md` §3 on diff.
- **Spec** (written intent only): missing, unrequested, seemingly done but incomplete behavior.
  Also acceptance test required by `<agentic-code-review>/references/panel-and-rounds.md` §3 for
  fixed-point level, without reading author's tests. If writing it, run in `<review-wt>`, copy to
  `<acceptance-tmp>` (outside-repo folder filled by orchestrator), remove from worktree before
  finishing. Author integrates unchanged.
- **Standards**: documented repo rules; preferences writer applied in `agentic-implement` step 6
  (`<agentic-implement>/references/preferences.md`, `AGENTS.md`, project design system for UI):
  violated preference is a finding with source line; new pattern where project had one;
  dependency/capability outside approved research (if present); `AGENTS.md`, `CLAUDE.md`, `REVIEW.md`
  or docs made false by change.
- **Security**: server-enforced permissions tested with a role without access; customer isolation;
  input validation; secrets outside code; logs/errors without personal data or database values.
- **UI** (UI only; may join spec lens): agentic-design “review” mode:
  `node <agentic-design>/scripts/detect-slop.mjs --diff <base-sha>` and
  `<agentic-design>/references/ui-without-slop.md` §5 checklist against chosen-variant screenshots
  (handling each detector output: §5 opening and §7).

## Rules

- Style, formatting, names are not findings unless behavior changes: lint and hooks own them.
- **Important**: worsens behavior, loses/exposes data, breaks callers, or lets a check pass without
  proving. **Nit**: at most 3, last; no round or own commit. **Pre-existing**: defect on base
  (outside `git diff -U0 <base-sha>..<reviewed-sha>` hunks, blame before base); one report line,
  outside backlog. Outside-diff lines made false by change (doc, caller, old code moved/renamed
  into guard scope) are Important.
- Proof: `file:line` actually read, effect and reproduction (test, command, screenshot). Docs and
  standards: doc `file:line` and contradicting code/tree `file:line` suffice (or `absent: <path>`
  for nonexistent citations). Dependency outside research: manifest line and `absent in <approved
  research>`. Without `file:line`, no finding.
- Class: name it and search other diff instances; outside instances are Pre-existing.
- Challenging approved approach (spec, human decision) is not a defect: goes under Direction.
- Do not fix code or commit. Spec acceptance test lives outside repo, never committed.

## Report

First line:
`Review <reviewed-sha> · <level> · lens <lens> · round <n>/<limit> · <i> Important · <n> Nits · <p> Pre-existing`.
Without findings next line is `0 Important — nothing to fix`.

Then by severity, one finding per line:
`[Important] <file:line> — <effect> — reproduce: <how> — class: <class>`
`[Nit] <file:line> — <what>`

End: `Pre-existing: <file:line · class; …>` on one line (or `Pre-existing: none`), Acceptance test
(spec: what it tests, file path or description), Direction (if any), `Level: <file:line> — <why>`
(only if reading needs more than assigned level), Not read (unread scope and why). Full format:
`<agentic-code-review>/assets/report.template.md`; with `node`,
`node <agentic-code-review>/scripts/validate-report.mjs <report>` exits 0 before delivery.
Orchestrator combines lens reports before author sees them.

## Verifier (round 1 only, consolidated Important findings only; review model, fresh context)

You are this round's sole verifier: receive deduplicated Important findings from all lenses.
For each open `file:line` at `<reviewed-sha>` (in `<review-wt>`, as above), follow path to effect.
Return confirmed, refuted (reason and `file:line`) or no verdict per finding. Add no findings.
No verdict means not confirmed: not sent as Important, stays on a “Not confirmed” line; no second
verifier this round.
