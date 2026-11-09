---
name: agentic-feature
description: >-
  Plans and delivers new or changed functionality in an existing project, including screens, feature
  specs and backlog items. Use for feature planning or delivery; use agentic-fix for broken existing
  behaviour, agentic-implement for a closed implementation brief, and agentic-project for project
  setup.
---

# agentic-feature

From request to integrated feature. You orchestrate: decide technical and reversible matters,
write spec and briefs, launch agents, review and integrate. Agents (Claude subagents or Codex jobs)
write code with `agentic-implement`. The human decides product, commitments and irreversible matters.

Read only the current role/step: agent level, model and launch rules live in
`<agentic-implement>/references/choosing-the-agent.md`; review classification and rounds live in
`<agentic-code-review>/references/risk-levels.md` and `<agentic-code-review>/references/panel-and-rounds.md`.
Do not copy those rules into briefs or reload the orchestrator workflow in a delegated writer.

Host differences, installations, tool substitutes and sibling resolution follow
`<agentic-project>/references/host-compatibility.md`; find that sibling through
`$AGENTIC_PROJECT_DIR` first and read the reference when the host varies.

The siblings `<agentic-architecture>` (`$AGENTIC_ARCHITECTURE_DIR`), `<agentic-code-review>` (`$AGENTIC_CODE_REVIEW_DIR`),
`<agentic-design>` (`$AGENTIC_DESIGN_DIR`) and `<agentic-implement>` (`$AGENTIC_IMPLEMENT_DIR`) follow
the same reference. `<skill>` is this file's folder; run scripts from the project repo root.

Repo rules override this skill: read `AGENTS.md`/`CLAUDE.md`, constitution
(`.specify/memory/constitution.md`) and applicable ADRs before applying it; use project commands (`/ship`,
`/deploy`, verification suite, job launcher) rather than generic ones.

## The circuit and human stops

| Step | What | Human |
|---|---|---|
| 0 | Triage: Standard (short route when eligible) or Complete | reads one-line track, may force another |
| 1 | Code reading; research for a material unknown or currentness question | — |
| 2 | Feature grill (including UI questions when applicable) | **stop: checkpoint 1** |
| 3 | Select UI mode via `agentic-design`; variants only for a material visual choice | variants: **stop at checkpoint 2** |
| 4 | Spec, plan, tasks | Complete: **stop at gate until “proceed”**; Standard: spec notice |
| 5 | Briefs and lane launch | mechanical batch only: **stop at playbook** before batch (`references/implementation.md` §4) |
| 6 | Independent review and verification | — |
| 7 | Integration and delivery | irreversible action only |

Outside these stops, return to human only for an **irreversible or external action** (production
deploy, deleting/migrating real data, paying, messaging real people, publishing, force-push), or a
new decision affecting product (what user sees/can do), money or personal data: bring recommendation
before launching dependent lanes (Complete: at gate). Decide everything else using smaller,
reversible reading and record origin “default”. Every stop says where: “step N/7, waiting for <what>”.

**Start.** Without description (“next from backlog”), read board `show items` (or `docs/backlog.md`)
and recommend the first `backlog` item without unresolved dependencies in one question; with item
id, use it without creating another. For started feature (`in-progress` item, `specs/NNN-*`,
`reading.md`/`research-notes.md`, its `agent/*` branches), briefly list existing artifacts and resume
first incomplete step. State track/route in one line and start in the same turn without permission.
Carry forward closed decisions and valid evidence; a new role/session does not require new artifacts.

## Board

State lives in agentic-project's board. CLI and URL location: “Source and copies” in
`<agentic-project>/assets/board/README.md`. First use each session: `<cli> help`, follow its syntax.
Transition commands: “When to update” in that README; here:

- **start** (after triage): item becomes `in-progress` (chat request: `request add` and
  `item add --status in-progress`); you and each lane issue `agent heartbeat` every 30 min;
- **stops** (checkpoints 1/2, gate): `decision add … --item <id>`, closed with `decision set`;
  Standard **notice** is `event note`;
- **spec**: `item set <id> spec=<NNN-slug> tasks.total=<M>`; **review**: `status=in-review`;
  **end**: `status=integrated sha=<sha>`, `event end "<mini-retro>"`, `agent end`.

With a published board and ArtifactData (deferred: `select:ArtifactData`), sync at every transition
and every 30 min using the same README's four “Sync” steps. Without it, keep CLI state for later sync.
Without board (no CLI or `node`), warn once and continue.

## Step 0: triage

Classify from the request, project rules and a brief look at the affected code/test seam; first
matching rule wins. This happens **before Reading, external research, grill or Spec Kit**. Full
Reading (step 1), when needed, confirms or changes the track.

- **Fix** (existing wrong behavior), any zone: `agentic-fix`. If fixing requires behavior not yet
  existing, it is a feature.
- **Too big** (any): vague destination (“improve task scheduling”); multiple independent product
  decisions; over ~20 tasks or 3 lanes; cannot fit a session. Split into vertical slices, each a
  new feature: `references/too-big.md`.
- **Complete** (any): database schema or existing-data migration; permissions, authentication,
  sessions or customer isolation; money (payments, billing, pricing); new personal/sensitive data
  or new sharing; external integration (third-party API, webhooks, email/SMS); irreversible end-user
  action (effect leaves system or cannot be undone); public contract used by others; files in
  `risk: high` area of `.agentic/areas.json`; over ~1 week. → research only the unresolved material
  questions (delegate independent axes), full Spec Kit, step 4 **gate**, security review.
- **Short route (Standard)**: no Complete criterion and the existing **short** criteria in
  `<agentic-implement>/references/choosing-the-agent.md` §1 hold. Follow “Short route” below
  immediately; do not enter steps 1–5 first.
- **Standard**: everything else (filter, exporting what user already sees, read screen, cancelling
  own record under existing access rules). → focused reading, research only when triggered,
  light Spec Kit, step 4 **notice**.

Doubt involving data, money or permissions (changing who can do what; reusing existing access
rule does not count): heavier track; otherwise lighter. Track follows work: raise when a Complete
criterion appears (migration), lower when grill removes it (action gains undo). Same-area
`type: escaped` lesson in last 30 days (location: `<agentic-code-review>/references/learning.md`)
raises one track, never above Complete.

Done when you stated track and matched criterion in one line (and each subsequent track change).

### Short route: scope → implement → proof

Keep one compact scope/proof note in the work log or existing issue: expected behavior, allowed
paths, existing implementation/test seam, proving command and any relevant risk. Reuse the request
and valid evidence; no separate Reading, grill, spec, lane brief or minimum suggestion count.
For a planning-only request, deliver this compact plan and stop before changing code.

Execute with `agentic-implement` in the current branch under project rules. A local pattern already
settling the change needs no external research; use `references/current-research.md` only for a
time-sensitive fact, a material unknown that local evidence cannot settle, or an explicit request.
For UI, preserve **targeted adjustment** when no material visual choice remains; use
`<agentic-design>/references/targeted-adjustment.md`, not variants.

Before claiming done, inspect the actual diff and classify it with
`<agentic-code-review>/references/risk-levels.md`; short execution never waives a required lens.
Record command/output evidence under `<agentic-implement>/references/evidence.md`, then integrate
under repo rules, close the board item, and deliver change, proof, limitations and human needs.

If scope exceeds the short criteria, material behavior is ambiguous, a new visual decision appears
or risk rises, stop the short route and re-triage **before dependent code**. Preserve closed decisions
and valid proof; enter only the missing Standard/Complete steps. Never use the short route to skip
sensitive-zone, hook/CI/installer, integration or review requirements.

## Step 1: reading and research

**1a. Reading.** Before questions or plan, investigate using `references/reading-context.md`,
write Reading from `assets/reading.template.md`: facts with `path:line`, **0–3 evidence-based
suggestions** when useful, and the recommended approach. No suggestion quota or invented scope.
Write facts now; finalize the approach after any necessary research.

**1b. Research, when needed.** Use `references/current-research.md` for time-sensitive claims,
material unknowns not settled by local evidence, or an explicit research request. Reuse valid
project research, decisions and evidence first. Research only unresolved axes (feature, design,
technique **at lockfile version**) with primary dated sources and a bounded ceiling. Record a
trigger and result or a one-line “local evidence sufficient”; create `research-notes.md` only when
there are findings to carry. Anything affecting a project decision becomes a grill question;
adoption appears in the spec summary's Research line.

Done when Reading has a supported approach and any useful suggestions, with research cited when
used or its absence explained. Show it at checkpoint 1's start.

## Step 2: feature grill (checkpoint 1)

Circuit's only grill: lane agents do not question human (step 5). Read `references/questions.md`
(question bank by dimension, each with recommendation type) and, for a material UI decision,
`<agentic-design>/references/ui-questions.md` (only unresolved questions; pass answers to step 3).
A targeted adjustment retains its mode and does not reopen settled UI decisions.
If Reading found no `.specify/`, add “initialize Spec Kit?” (step 4).

Done when the frontier is empty (not the question list) and you showed the decision table.

## Step 3: UI mode (checkpoint 2 only for variants)

Preserve the caller's mode. A label, contrast or spacing correction without a material visual
choice uses `<agentic-design>/references/targeted-adjustment.md`; an already approved direction
uses `<agentic-design>/references/build-mode.md`. Neither opens a variants checkpoint. New screens, redesigns
or navigation with a material visual choice use **variants** and the procedure below.

UI method belongs to sibling `agentic-design`: invoke Skill tool
(plugin: `agentic-skills:agentic-design`) or read/follow `<agentic-design>/SKILL.md` without tool.
Its blockers, procedure, screenshots and detector are not repeated here.

- **Pass**: Reading; checkpoint 1 UI answers (primary action, states, target resolutions, themes,
  measured data quantity); neighboring screens/screenshots from Reading; `DESIGN.md` or project
  design-system skill; track (Standard: show variants only at main resolution/theme); Git base;
  output folder, temporary outside repo until spec exists.
- **Receive**: 2–3 structurally different variants with side-by-side screenshots, each detector
  output (exit 0), independent critique (or “not independent”), recommendation/why, each sacrifice,
  unfilled `choice.md`.
- **Do**: show human, record `decision add` on board (checkpoint 2). Their choice, or delegated
  “choose for me”, goes into `choice.md`. After `speckit-specify`, move folder to
  `specs/<NNN-slug>/variants/`; spec cites `choice.md`, step 6 compares screenshots. Any route
  prototype stays until step 6's end and never integrates.

Without `agentic-design` (no listed folder has `SKILL.md`): say so in one line with installation
command. Checkpoint 2 uses screenshots of what you build; UI proof is “unverified” under Needs you,
never “clean”.

## Step 4: spec, plan and tasks

Read `references/spec-kit.md`. With Spec Kit: `speckit-specify` → `speckit-clarify` (Complete or
remaining ambiguity) → `speckit-plan` → `speckit-tasks` → `speckit-analyze` (zero CRITICAL);
Complete also `speckit-checklist` for security (and UX with UI). Without `.specify/`, follow
checkpoint 1 answer: initialize or `assets/light-spec.template.md`.

Write **spec summary** in `spec-kit.md` format (scope, decisions, research, risks, tasks, agent plan,
proof); commit spec, plan and tasks: lanes start from that commit. Then by track:

- **Complete: gate.** Show summary and request “proceed”. No production code beforehand; afterward
  no more permission until delivery.
- **Standard: notice.** Send summary, spec path and how to stop lanes; immediately step 5 without
  waiting. Lanes have their own branches and nothing enters `main` before review, so stopping just
  stops agents (`implementation.md` §4, “Stop lanes”): branches stay, nothing to undo. If human says
  “stop”, stop lanes and follow their instruction.

**Plan only** (“plan this feature”): any track stops here with committed spec and board item
`ready`. Another session resumes step 5; Complete launches only with recorded gate “proceed”
(`decision set` on board).

Done when spec is committed and, for Complete, human said “proceed”; for Standard, notice was sent.

## Step 5: briefs and launch

Read `references/implementation.md`: lanes, worktrees, batch per §1–§2. ~3 parallel maximum is an
integration ceiling per feature, not machine capacity; dependent lanes run sequentially.

1. **Brief**: one per lane from `assets/agent-brief.template.md`; test against reference §3.
2. **Who**: `<agentic-implement>/references/choosing-the-agent.md` §1–§3 (level, model, effort,
   agent). Handle short lanes (§1) yourself, without brief.
3. **Launch**, per that file §4: Claude subagent or Codex job through launcher; without one,
   `codex exec`. Every lane/job uses script if present: machine measurement, owners, scope,
   closed brief. Load `agentic-implement`.

Over 3 similar lanes in a batch: pilot first, reviewed by 1 reviewer, its classes in remaining
briefs; mechanical change uses script/playbook (`implementation.md` §4).

Follow “While they run” (§4): monitors ≥10 min, wake only on completion, `blocked` or decision;
batched news, one command with few log lines. At spec commit, lanes launched, lanes combined:
compaction or new session with summary per user's/project `CLAUDE.md`. Model does not run `/compact`.

For UI pass the exact absolute `<agentic-design>/references/build-mode.md` (or
`<agentic-design>/references/targeted-adjustment.md`) path, relevant project rules, variant/baseline, base and proof.
The UI writer does not preload the whole design skill; with blockers it is not done.

Ambiguous brief: `blocked: <question>`; other lanes continue. Gather questions: decide technical,
reversible ones and relaunch; human decisions go in one message with recommendation.

Receive/combine per `implementation.md` §5–§6; without agents use §4 short form yourself.

Done when all lanes returned `done` and are combined, with full verification green.

## Step 6: independent review and verification

Read `references/review-and-delivery.md`. Review belongs to sibling `agentic-code-review`: invoke
Skill tool (plugin: `agentic-skills:agentic-code-review`) or read/follow its `SKILL.md`. It owns
review level, lenses, model, rounds and ceiling; feature track is starting level. Run with lanes
combined and green on the feature branch; each post-review diff is reclassified before the
review skill decides whether an exception or another bounded round applies.

- **Pass**: track/why, base/reviewed SHA, spec, plan, approved Research; for UI, selected mode,
  chosen variant or preserved baseline, screenshots and the exact
  `<agentic-design>/references/review-mode.md` path. Full list: review-and-delivery.md “Review”. Returns Important,
  Nit, Pre-existing findings, each with `file:line`.
- **Handle** as same section says. Reproduce each Important before fixing in a new step 5 brief;
  at round limit with an open Important, go to human: feature is unfinished.

Without `agentic-code-review` (no listed folder has `SKILL.md`): say so in one line with installation;
review stays “pending” under Needs you, never “done”.

Then obtain real verification: tests, typecheck, project suite and end-to-end path, reusing valid
exact-state evidence under `<agentic-implement>/references/evidence.md`. UI proof follows the
selected mode's proportional scope (targeted correction versus new screen), with detector exit 0
on supported diff lines. Check review-and-delivery.md traps only where applicable.

Done when no Important is open and every check has command and output. Skipped, unrun, or exit 0
without testing anything counts as red.

## Step 7: integration and delivery

Follow review-and-delivery.md “Delivery”: radar, **integration commit** (joining feature to `main`,
with `Risk:`, `How to undo:`, `Review:` in body), push/deploy per project policy (production needs
explicit OK), board, mini-retro; escaped defects or repeated class get a lesson in
`<agentic-code-review>/references/learning.md`'s location/format.

What lanes saw but did not touch goes to board as `backlog`, outside this diff.

Done when integration commit is where project policy requires and final message follows Delivery format.

## In other agents

Same steps/stops, different tool; state replacement in one line:
- **No AskUserQuestion**: questions in chat per questions.md point 4.
- **No subagents**: sequential reading, needed research and lanes (`implementation.md` §4);
  review follows agentic-code-review “In other agents”.
- **Codex orchestrating** (`workspace-write` sandbox, read-only `.git`): at checkpoint 1 ask human
  to approve session Git commands, or `codex --sandbox danger-full-access` (human OK only);
  without it lanes use short form.

## Tool integrations

Optional skills, installation commands and fallbacks: `references/tool-integrations.md`.
Read it only when needed; installation requires the human's authorization.

## References: when to read each

Read each reference at its linked step. Also:
- `references/snapshot-<yyyy-mm>.md`: latest unexpired technical starting point for needed research;
  web platform uses `<agentic-design>/references/web-platform-<yyyy-mm>.md`. Reuse valid primary evidence.
- `<agentic-design>`: step 2 unresolved UI questions, step 3 selected mode, step 5 exact writer
  capsule, step 6 review/proof. Preserve targeted adjustment when its direction is settled.
- `references/review-and-delivery.md`, “Traps”: whenever writing/assessing tests.
- `assets/`: templates to fill (Reading, agent brief, light spec, retro). Reviewer brief/report
  belong to agentic-code-review.
