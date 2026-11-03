# Spec, plan and tasks (step 4)

Turn grill decisions/chosen variant into spec, plan, verifiable tasks; show spec summary at
Complete gate (human “proceed”) or Standard notice (lanes start immediately).

## With Spec Kit (`.specify/` exists)

Run skills in order. Each reads predecessor artifacts from feature folder (`specs/<NNN-slug>/`,
registered in `.specify/feature.json`).

**Which speckit-* to use.** Target repo's versions matching its Spec Kit. Skill tool loads project
where session started; if not target repo, or skill list omits freshly initialized skills, read
`<repo>/.claude/skills/speckit-<name>/SKILL.md`, otherwise
`<repo>/.agents/skills/speckit-<name>/SKILL.md` (codex integration for agents reading .agents/skills),
follow it and its `.specify/scripts/` commands from target repo root.

**Where this overrides Spec Kit skills** (written for a nearby human; here stops only at grill,
UI variants, Complete gate):
- analyze's no-edit/remediation question: correct spec/plan/tasks yourself, rerun analyze.
- checklist forbids agent [x] (reviewer-owned): do not mark; assess each in log (met/missing with
  path), summary to gate where human reviews.
- clarify questions: follow point 2 below.

1. **speckit-specify**: description, Reading approach, grill decision table (including delegated),
   excluded scope, UI states, variants/choice.md reference. More decisions mean fewer NEEDS CLARIFICATION.
   - Immediately move reading.md, research-notes.md, variants/ into feature folder for all consumers.
   - Branch: active Spec Kit Git extension creates NNN-slug (specify init --integration claude
     alone does not activate it). Without extension follow project convention, otherwise create
     short NNN-slug before writing.
   - .specify/feature.json is machine-local, ignored by Spec Kit's .gitignore: do not add (git add
     rightly fails).
2. **speckit-clarify** for Complete or markers. Answer from grill log citing decision. Others use
   SKILL.md's circuit/stops criterion: product, money, personal data, irreversible → human with
   recommendation (Complete gate, Standard before dependent lanes); technical/reversible → decide,
   record default origin.
3. **speckit-plan**: request `<agentic-architecture>/references/vocabulary.md` design vocabulary
   (deep modules: small interface, much behavior behind; test seams; one adapter=hypothetical seam,
   two=real); installed mattpocock-skills:codebase-design is same English source. Difficult-to-reverse
   decision/new domain term: ADR and glossary update with mattpocock-skills:domain-modeling.
   Pass research-notes.md to speckit-plan as completed phase 0: adopted/grill-decided rows become Decision/Rationale/
   Alternatives in plan's research.md with sources. Plan researches only new Technical Context
   unknowns using current-research.md source/date/hype filter, separate ceiling from 1b: total
   up to 2 searches/3 pages Standard, 3 searches/5 pages Complete.
4. **speckit-tasks** explicitly request (Spec Kit generates test tasks only on request):
   - behavioral tasks each containing test/implementation (red → green inside), never T002 all
     tests then T003 implementation (agentic-implement horizontal slices, `<agentic-implement>/references/tests.md`).
     Merge such output before summary;
   - at least one end-to-end gesture-to-effect acceptance, one real dependency test (real database,
     not mock);
   - file paths per task;
   - [P] only without shared files or unfinished dependencies;
   - verification criterion per task (command/observation);
   - UI entry point task (user can reach it).
5. **speckit-analyze**: automatic verification, zero CRITICAL before advancing; correct and rerun.
   HIGH: fix or justify in spec summary.
6. **Complete**: speckit-checklist security (permissions, isolation, validation, secrets, no personal
   data in logs), plus UX for UI (states, accessibility, responsive, agentic-design ui-without-slop.md
   §5 items). Assess without marking boxes; unmet become tasks or gate risks.
7. **Commit** spec/plan/tasks and moved Reading/research/variants: lane worktrees start here,
   briefs point to these paths.

Do not use speckit-implement: step 5 distributes tasks to agent worktrees, which it does not.
Agents mark [X] in tasks.md. speckit-converge is step 6. Do not use discontinued speckit-taskstoissues,
even if init installed it.

## Without Spec Kit

No .specify/: add “initialize Spec Kit?” at checkpoint 1 (recommend yes for ongoing features,
no for small/short-lived repo).

- **Yes**: clean git status, `specify init --here --force --non-interactive --integration claude`.
  Then git diff/status: --force may rewrite .specify/scripts/templates and .claude/settings.json;
  restore project-specific existing content. For another agent reading .agents/skills (Codex,
  Cursor, Gemini, Copilot, OpenCode), also `specify integration install codex` (creates speckit-*
  there, default integration stays Claude). Delete speckit-taskstoissues/ in both folders. Separate
  Spec Kit-only commit (.specify/ and both skill folders). Without constitution run
  speckit-constitution from project AGENTS.md/CLAUDE.md rules, not generic principles. Without
  either derive principles from practiced code (style/tests/dependencies/structure), each path:line,
  list as your decisions in summary for human correction.
- **No**: fill assets/light-spec.template.md in project specs folder (specs/NNN-slug/spec.md or
  docs/features/ by convention). Manually analyze: requirement has task, task serves requirement,
  no contradiction with project rules.

## Spec summary: gate (Complete) or notice (Standard)

Same short summary for both:

```
Feature: <name> — track <track>
Spec: <path>

Scope: <3–5 lines of working user-visible result>
Out of scope: <short list>
Decisions: <n> (human <a>, delegated <b>, my defaults <c>) — <table path>
New decisions needing you: <0 or list, each recommendation>
Research: adopted <short list, finding per item>; grill-decided <n>; rejected <n> — <research.md or light spec path>
Risks: <real only, mitigation/undo each>
Tasks: <n> in <k> lanes (<p> parallel, <s> sequential)
Agent plan: <lane → role → main files → Claude/Codex, level>
Completion proof: <commands/screenshots>
Needs your OK after delivery: <production deploy, real-data migration… or nothing>
To stop (notice only): <say stop: I stop agents; branches stay, nothing entered main>
```

- **Gate (Complete)**: ask with Proceed (recommended absent new decisions), Adjust <what>, Stop.
  Ask new decisions first within same checkpoint, each recommended question. No production code
  before proceed; next contact afterward is delivery or irreversible action.
- **Notice (Standard)**: send summary/spec path/To stop line, launch same turn without waiting.
  New human decision gets separate question, only dependent lanes wait. Stop means halt per
  implementation.md §4 “Stop lanes”.
