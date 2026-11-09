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

<!-- card:start — copied from the cited sources; update when they change -->
## Card

Sources: `<agentic-implement>/references/choosing-the-agent.md` (level §1, model §2); `<agentic-code-review>/SKILL.md` (review steps 5 and 6).

Step 0 — Done when you stated track and matched criterion in one line (and each subsequent track change).
Step 1 — Done when Reading has final suggestions and approach with cited research. Show it at checkpoint 1's start.
Step 2 — Done when the frontier is empty (not the question list) and you showed the decision table.
Step 4 — Done when spec is committed and, for Complete, human said “proceed”; for Standard, notice was sent.
Step 5 — Done when all lanes returned `done` and are combined, with full verification green.
Step 6 — Done when no Important is open and every check has command and output. Skipped, unrun, or exit 0 without testing anything counts as red.
Step 7 — Done when integration commit is where project policy requires and final message follows Delivery format.

**Level**

1. **Unknown cause?** A defect whose cause is still unknown after a brief look (the trace, the
   file it names, recent history of that path), or a race to diagnose. Yes: complex. A probable
   cause goes in the brief as a hypothesis the agent proves red first.
2. **Design that only shows in the code?** The contract, schema or module can only be decided
   through an experiment in the code. Yes: complex.
3. **Steps not enumerable?** A refactor so coupled that the brief cannot list the steps.
   Yes: complex.
4. **Already failed?** An agent failed this task once at the well-defined level. Yes: complex,
   and the new brief carries the premise the agent returned (step 5 of `agentic-implement`).

Passed all four: **well-defined**. New design, delicate logic (money, concurrency, access rules)
or multiple areas do not make the task complex when the brief has already decided them. Examples:
a label; rounding; a lane with a spec and tasks; fixing an Important the orchestrator reproduced
and wrote a rule for.

- A sensitive zone (tenant, session, billing, personal data) does not raise the level: the brief
  carries invariants and refusal tests, and the zone affects the review level (`agentic-code-review`).

Write the brief's `level:` line with these labels; the launch guard reads it:

- `level: well-defined — decisions closed: <which>`;
- `level: complex — <label>: <detail>`, using one of the four questions as the label, lowercase
  without “?”: `unknown cause`, `design that only shows in the code`, `steps not enumerable`,
  `already failed`;
- the human forced the level: `level: <level> — forced by the human: <their words>`.

**Model** (example model names; the project picks its own)

| Level | Claude | Codex |
|---|---|---|
| well-defined | Sonnet 5.5, effort high | gpt-6.1-sol, effort medium |
| complex | Opus 5.5, effort xhigh | gpt-6.1-sol, effort max |

**Review**

```bash
node <agentic-code-review>/scripts/validate-report.mjs <report.md>   # 0 = conforming; 1 = failure list
```

- Round limit by level (1 for requested Quick, 1 for Standard, 2 for Complete). From round 2 onward:
  only the new diff, without repeating closed findings, and only lenses with open Important findings, together.

- **At the limit, with an open Important, stop and go to the human** with a summary (open findings,
  responses, rounds, unreviewed diff, your recommendation). Never silently add a round.
<!-- card:end -->

Host differences, installations, tool substitutes and sibling resolution follow
`<agentic-project>/references/host-compatibility.md`; find that sibling through
`$AGENTIC_PROJECT_DIR` first and read the reference when the host varies.

The siblings `<agentic-architecture>` (`$AGENTIC_ARCHITECTURE_DIR`), `<agentic-code-review>` (`$AGENTIC_CODE_REVIEW_DIR`),
`<agentic-design>` (`$AGENTIC_DESIGN_DIR`) and `<agentic-implement>` (`$AGENTIC_IMPLEMENT_DIR`) follow
the same reference; paths, prefixes and order are not repeated here.

Repo rules override this skill: read `AGENTS.md`/`CLAUDE.md`, constitution
(`.specify/memory/constitution.md`) and ADRs before applying it; use project commands (`/ship`,
`/deploy`, verification suite, job launcher) rather than generic ones.

`<skill>` is this `SKILL.md`'s folder; scripts run from project repo root. Resolve siblings
through the single reference `<agentic-project>/references/host-compatibility.md`; the explicit
variable wins over the adjacent folder, project folders, global roots and plugin. Host invocation
names do not change that order.

## The circuit and human stops

| Step | What | Human |
|---|---|---|
| 0 | Triage: Standard or Complete | reads one-line track, may force another |
| 1 | Code reading and current research | — |
| 2 | Feature grill (including UI questions when applicable) | **stop: checkpoint 1** |
| 3 | Visual variants (UI only, via `agentic-design`) | **stop: checkpoint 2** |
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
first step without one. First message states track and steps in one line, then starts Reading
in the same turn without permission.

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

With a published board (URL in same place) and ArtifactData tool (deferred: ToolSearch
`select:ArtifactData`), send to artifact at every transition and every 30 min, using four “Sync”
steps from same README. Without ArtifactData record in CLI; next orchestrator with tool sends.
Without board (no CLI or `node`), warn once and continue.

## Step 0: triage

Classify from request and a glance at code; first matching rule wins. Reading (step 1) confirms
or changes track.

- **Fix** (existing wrong behavior), any zone: `agentic-fix`. If fixing requires behavior not yet
  existing, it is a feature.
- **Too big** (any): vague destination (“improve task scheduling”); multiple independent product
  decisions; over ~20 tasks or 3 lanes; cannot fit a session. Split into vertical slices, each a
  new feature: `references/too-big.md`.
- **Complete** (any): database schema or existing-data migration; permissions, authentication,
  sessions or customer isolation; money (payments, billing, pricing); new personal/sensitive data
  or new sharing; external integration (third-party API, webhooks, email/SMS); irreversible end-user
  action (effect leaves system or cannot be undone); public contract used by others; files in
  `risk: high` area of `.agentic/areas.json`; over ~1 week. → research with one subagent per touched axis,
  full Spec Kit, step 4 **gate**, security review.
- **Standard**: everything else (filter, exporting what user already sees, read screen, cancelling
  own record under existing access rules). → focused research, light Spec Kit, step 4 **notice**.

Doubt involving data, money or permissions (changing who can do what; reusing existing access
rule does not count): heavier track; otherwise lighter. Track follows work: raise when a Complete
criterion appears (migration), lower when grill removes it (action gains undo). Same-area
`type: escaped` lesson in last 30 days (location: `<agentic-code-review>/references/learning.md`)
raises one track, never above Complete.

Done when you stated track and matched criterion in one line (and each subsequent track change).

## Step 1: reading and research

**1a. Reading.** Before questions or plan, investigate using `references/reading-context.md`,
write Reading from `assets/reading.template.md`: facts with `path:line`, 3–6 reasoned suggestions,
recommended approach. Write facts now; finalize suggestions and approach after research can change them.

**1b. Research.** Before recommending, study current best practice using `references/current-research.md`:
3 axes (feature, design, technique **at lockfile version**), primary dated sources, starting from
project radar (`docs/radar.md`), at track's depth/ceiling. Output `research-notes.md` beside `reading.md`,
with ≤4-line Reading summary; trivial changes get one Reading line, no `research-notes.md`. Adopt
nothing silently: anything affecting a project decision becomes a grill question; adoption appears
in spec summary's Research line.

Done when Reading has final suggestions and approach with cited research. Show it at checkpoint 1's start.

## Step 2: feature grill (checkpoint 1)

Circuit's only grill: lane agents do not question human (step 5). Read `references/questions.md`
(question bank by dimension, each with recommendation type) and, for UI,
`<agentic-design>/references/ui-questions.md` (mandatory block; pass answers to agentic-design step 3).
If Reading found no `.specify/`, add “initialize Spec Kit?” (step 4).

Done when the frontier is empty (not the question list) and you showed the decision table.

## Step 3: visual variants (checkpoint 2, UI only)

UI method belongs to sibling `agentic-design`, “variants” mode: invoke Skill tool
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

Why variants rather than descriptions: people recognize what they want when seeing it; descriptions
hide density/hierarchy problems screenshots reveal.

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

For UI also load `agentic-design`, “build” mode, with its proof. Brief points to absolute
`<agentic-design>`, variant and base; with blockers it is not done.

Ambiguous brief: `blocked: <question>`; other lanes continue. Gather questions: decide technical,
reversible ones and relaunch; human decisions go in one message with recommendation.

Receive/combine per `implementation.md` §5–§6; without agents use §4 short form yourself.

Done when all lanes returned `done` and are combined, with full verification green.

## Step 6: independent review and verification

Read `references/review-and-delivery.md`. Review belongs to sibling `agentic-code-review`: invoke
Skill tool (plugin: `agentic-skills:agentic-code-review`) or read/follow its `SKILL.md`. It owns
review level, lenses, model, rounds and ceiling; feature track is starting level. Run with lanes
combined and green on feature branch, again after fixes in each round.

- **Pass**: track/why, base/reviewed SHA, spec, plan, approved Research; for UI, chosen variant,
  screenshots and `<agentic-design>` path: UI lens uses its “review” mode (detector and
  `ui-without-slop.md` §5 checklist). Full list: review-and-delivery.md “Review”. Returns Important,
  Nit, Pre-existing findings, each with `file:line`.
- **Handle** as same section says. Reproduce each Important before fixing in a new step 5 brief;
  at round limit with an open Important, go to human: feature is unfinished.

Without `agentic-code-review` (no listed folder has `SKILL.md`): say so in one line with installation;
review stays “pending” under Needs you, never “done”.

Then real verification: tests, typecheck, project suite, end-to-end path. UI uses agentic-design
“review” proof: real screenshots of step 2's agreed states in project themes, compared to chosen
variant; detector exits 0 on diff lines. Check review-and-delivery.md traps.

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
- **No subagents**: sequential reading, per-axis research and lanes (`implementation.md` §4);
  review follows agentic-code-review “In other agents”.
- **Codex orchestrating** (`workspace-write` sandbox, read-only `.git`): at checkpoint 1 ask human
  to approve session Git commands, or `codex --sandbox danger-full-access` (human OK only);
  without it lanes use short form.

## Third-party skills

| Skill | Usage | If absent |
|---|---|---|
| `mattpocock-skills:grilling`, `:prototype`, `:domain-modeling`, `:research` | Skill tool | method summarized in references |
| `to-tickets`, `wayfinder`, `retro` (mattpocock) | user invokes only: read/apply SKILL.md or suggest `/<name>` | `references/too-big.md`; `assets/retro.template.md` |
| `simplify` (Claude Code) | author at lane end targeting `<base>...HEAD` (current-diff-only: disposable worktree with `git reset --soft <base>`) | agentic-implement minimal change (step 4) |
| `agentic-design` (sibling) | steps 2 UI questions, 3 variants, 5 UI lanes, 6 UI lens/proof: Skill tool or read SKILL.md | say so; UI “unverified” under Needs you |
| `agentic-implement`, `agentic-fix`, `agentic-architecture` (siblings) | lane agents load implement; fix handles corrections; architecture supplies step 4 design vocabulary (`<agentic-architecture>/references/vocabulary.md`; installed `mattpocock-skills:codebase-design` is same English source) and deepening handoffs | say so: installed together |
| `speckit-*` | target repo versions (spec-kit.md “Which speckit-* to use”) | `assets/light-spec.template.md` |

Installation (tell human; do not install without OK): `/plugin marketplace add mattpocock/skills`,
`/plugin install mattpocock-skills@mattpocock`; Spec Kit:
`uv tool install --force specify-cli --from git+https://github.com/github/spec-kit.git@v1.2.0`.

## References: when to read each

Read each reference at its linked step. Also:
- `references/snapshot-<yyyy-mm>.md`: step 1b technical axis (language/frameworks), starting point
  to reverify. Use latest, never after Valid until. Web platform (CSS, HTML, accessibility,
  performance) belongs to agentic-design: `<agentic-design>/references/web-platform-<yyyy-mm>.md`.
- `<agentic-design>`: step 2 UI questions, step 3 variants, step 5 build in UI lanes, step 6 review/proof.
- `references/review-and-delivery.md`, “Traps”: whenever writing/assessing tests.
- `assets/`: templates to fill (Reading, agent brief, light spec, retro). Reviewer brief/report
  belong to agentic-code-review.
