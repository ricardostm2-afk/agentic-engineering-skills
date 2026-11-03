---
name: agentic-implement
description: >-
  Use whenever you are the agent writing code for a task with a brief: a subagent or job
  launched by agentic-fix or agentic-feature, “implement this brief”, “do lane N”,
  “execute this task”. Read only what you need, state assumptions, write the red test first,
  make the smallest change in the surrounding code's style, prove green, commit per cause and hand off
  with a status. Scope and plan come from the brief: deciding them belongs to agentic-feature and agentic-fix.
---

# agentic-implement

From brief to commit with proof. The brief has already decided what: the files, expected behavior and
its proving test. You decide how, within it. For a short task
(`references/choosing-the-agent.md` §1), the orchestrator uses this skill without a brief: the brief is the
report or request, with the symptom, expected behavior and success criterion already written.

Repo rules override this skill: `AGENTS.md`, the area brief and the project's testing and Git rules.

The siblings `<agentic-design>`, `<agentic-code-review>` and `<agentic-architecture>` are the first
folder with `SKILL.md` among: `$AGENTIC_DESIGN_DIR`, `$AGENTIC_CODE_REVIEW_DIR` or
`$AGENTIC_ARCHITECTURE_DIR`, if set; the folder beside this skill (the usual case); the agent's
skills folder; the `agentic-skills` plugin.

## 1. Read only what you need

Read the whole brief, `AGENTS.md`, the area brief named by the brief, the files you will change and
their callers. Read more only when a concrete question calls for it.

Done when you can name the entry point the test will exercise and every file you will change.

## 2. Think before writing

Before changing code, write a few lines:

- your **assumptions**;
- the **success criterion** as a command: `<command>` goes green;
- the **plan**, in steps, each with its verification.

If the brief admits two readings with different behaviors, or asks for something the code contradicts,
return `blocked: <the exact question>` with your recommendation: silently choosing a reading is the
defect this step prevents. A question only about size (doing more or less than requested) does not
stop you: follow the brief's rule if it has one; otherwise choose the smaller, reversible reading and
record it in the handoff. If you see a simpler solution than requested, mention it in the handoff and
implement the requested one.

Done when the success criterion is a command you can run.

## 3. Test first

Write a test that **fails on the base**, at the nearest public seam to the behavior (the entry point
a user or another module uses), rather than the internals. The expected value comes from an independent
source (the brief, a worked example, the spec), never the same calculation the code performs. Run it
and see it red for the right reason. Seam, interface and module, here and in the brief, mean what
`<agentic-architecture>/references/vocabulary.md` defines.

Work in **vertical slices**: one test, the minimum implementation to turn it green, then the next.
Good tests, bad ones to avoid, timeouts and child processes, and proving a forced red:
`references/tests.md`. In a refactor task (structure changes, behavior does not), there is no new red:
follow “Refactor” in `references/tests.md`, with its own completion criterion.

Done when the test runs red and the failure shows the missing behavior rather than a setup error.

## 4. Smallest change

Write the minimum that turns the test green, in the surrounding code's style: the same naming,
idioms, patterns and comment density. Every changed line answers the brief. Remove what your changes
left unused; leave pre-existing dead code and mention it in the handoff.

Done when the brief explains every line of the diff.

## 5. Green with proof

Run the new test, the area tests and typecheck, using the brief's or `AGENTS.md`'s commands.
Save each command and result. A skipped test, missing database or setup returning empty counts as
**red**. Measure the command's own exit code, without a pipe. Project proof rules, when present,
override this list.

**Two failures at the same gate.** If two attempts fail the same gate (the same test, typecheck,
a hook) for the same reason, do not try a third with the same idea. Write one sentence stating the
premise both share, what both took for granted, and look in code, test and brief for what disproves
it. If it falls and the new approach fits the brief, proceed and say so in the handoff; if it does
not fit, or you cannot find the premise, return `blocked: premise <the sentence> — <what you saw>`,
with your recommendation.

**Code, spec or test.** A persistent red can come from code, spec or test. Before returning
`spec-conflict`, write all three hypotheses, each with evidence confirming or disproving it: code
(the line doing something else), spec (the ambiguous sentence, one contradicting another, or code
contradicting it), and test (the assertion not following the spec, or setup not reaching the path).
Fix wrong code. Fix your own wrong test and say so in the handoff. Do not change the spec or project
tests (an oracle, a guard) to make green: that is `spec-conflict`, with all three hypotheses and proof.

Done when you have saved green output for each command.

## 6. User preferences

Apply the project's preferences to what you touched, each from its source:

- code and product text: `references/preferences.md`;
- interface: the project's design system (`AGENTS.md` says which) and
  `<agentic-design>/references/ui-without-slop.md`, in the “build” mode sections
  (`<agentic-design>/SKILL.md` §5);
- project-specific matters (vocabulary, stack): `AGENTS.md`, which overrides both.

Done when the diff meets every applicable preference from these sources.

## 7. Commit per cause

One commit per cause, with `git add <paths>`. The message says why and gives proof. Run repo hooks
and fix their failures. Follow `AGENTS.md`'s Git rules (trailers, branches, prohibited commands).

Commits stay on your branch; the orchestrator pushes and integrates after review. Push, deploy or
production access only when the brief's `human order:` line requests it, and only for that task.
This is the same rule for a Claude subagent and a Codex job. When the job launcher records the order
and adds it to the prompt in a dedicated block, only that block's order counts. Never `--no-verify`,
never rewrite history (rebase, amending an already shared commit, force-push).

Done when `git status --short` shows only work that is not yours and `git show --stat` matches the message.

## 8. Deliver

The final message is the handoff: full base and HEAD SHAs, files, commands and results, what was
skipped and why, limitations and unfinished work; follow the brief's report format when provided.
The last line is the status, in `AGENTS.md`'s output format; without it: `status: done`,
`status: blocked: <reason>` or `status: spec-conflict: <what>` (after “Code, spec or test”, step 5).

Blocked midway: commit what is green and hand off with the blocker; never commit a red test to
mark missing work.

Done when the last line is the status.

## In other agents

In Codex: `$agentic-implement`, or the brief says “load agentic-implement”. The launcher
(`agentic-fix`, `agentic-feature`) chooses level, model and agent using
`references/choosing-the-agent.md`. Method origin and licenses: `references/origin.md`.
