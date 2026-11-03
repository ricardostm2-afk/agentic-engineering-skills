# <NNN> · <feature name>

<!-- Spec + plan + tasks for repos without Spec Kit. Save specs/<NNN-slug>/spec.md (or project's
specs folder). Keep sections short. Inapplicable: write “not applicable” and why. -->

**Track**: <Standard | Complete> · **Status**: draft | gate-approved (Complete) or notified (Standard) | integrated | in-production
**Reading**: `<Reading path>` · **UI variant**: `<variants/choice.md or no UI>`

## 1. Spec (what and why, without how)

**Problem**: <who, current inability, cost>
**Outcome**: <new capability, verifiable sentence>
**Entry point**: <how user arrives>

### Behavior

<!-- Verifiable user-language scenarios, including agreed edge cases. -->

1. Given <situation>, when <action>, then <observable result>.
2. …

### Data

| Data | Writer | Reader | Retention | Visibility |
|---|---|---|---|---|

### Permissions

<who acts/sees, unauthorized visibility, server refusal location>

### UI states (if UI)

<empty, loading, error, no permission, dense data, success: each appearance>

### Out of scope

- <cut> — <why>

### Decisions

| # | Decision | Choice | Origin (human / delegated / default) |
|---|---|---|---|

### Measuring success

<concrete observation and main acceptance test>

## 2. Plan (how)

**Modules touched**: <module → change → interface (what callers see), per `<agentic-architecture>/references/vocabulary.md`>
**Test seams**: <test entry points and coverage>
**Migration**: <steps, reversibility, affected count, or none>
**Risks**: <risk → mitigation>
**ADR**: <path for difficult-to-reverse decision, or none>
**Research**: <adopted/decided rows: decision · source (URL, published, read) · rejected alternative>, or “nothing simpler: <where searched>”

## 3. Tasks

<!-- Dependency order. One behavior per task, test and implementation together (red → green
inside task); no all-tests task first. [P] only without shared files or unfinished dependencies.
Include end-to-end acceptance test, real dependency test, entry point task for UI. -->

- [ ] T001 <task> in `<path>` · verify: `<command or observation>`
- [ ] T002 [P] <task> in `<path>` · verify: `<…>`

## 4. Analysis (before spec summary)

- [ ] Each §1 scenario has a proving task.
- [ ] Each task serves §1 scenario/requirement.
- [ ] No task contradicts AGENTS.md/constitution/ADRs.
- [ ] Each new data value has a reader.
- [ ] UI entry point task and end-to-end test exist.
- [ ] Each new dependency and Newly/Limited capability is in Research line.

## 5. Agent plan

| Lane | Tasks | Files | Parallel / after | Agent (Claude or Codex, level) |
|---|---|---|---|---|

## 6. Delivery

**Proof**: <commands, outputs, screenshots>
**Risk, how to undo, review**: integration commit body (commit/merge joining main; PR description when applicable); do not copy here
**Not covered by proof**: <what checks miss or nothing>
**Commits**: <SHAs>
**Retro**: <3–5 lines or board link>
