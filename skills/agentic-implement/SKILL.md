---
name: agentic-implement
description: >-
  Implements a scoped task whose brief already fixes the expected behaviour, allowed files and
  acceptance checks, including delegated implementation lanes. Use when executing that brief; use
  agentic-feature to decide feature scope and agentic-fix to diagnose an unscoped defect.
---

# agentic-implement

Host differences, installations, tool substitutes and sibling resolution follow
`<agentic-project>/references/host-compatibility.md`; find that sibling through
`$AGENTIC_PROJECT_DIR` first and read the reference when the host varies.

From brief to commit with proof. The brief has already decided what: the files, expected behavior and
its proving test. You decide how, within it. For a short task
(`references/choosing-the-agent.md` §1), the orchestrator uses this skill without a brief: the brief is the
report or request, with the symptom, expected behavior and success criterion already written.

Repo rules override this skill: `AGENTS.md`, the area brief and the project's testing and Git rules.

The siblings `<agentic-design>` (`$AGENTIC_DESIGN_DIR`), `<agentic-code-review>` (`$AGENTIC_CODE_REVIEW_DIR`),
`<agentic-architecture>` (`$AGENTIC_ARCHITECTURE_DIR`) and `<agentic-fix>` (`$AGENTIC_FIX_DIR`) follow
the common reference; paths, prefixes and order are not repeated here.

## 1. Read only what you need

Read the whole brief, `AGENTS.md`, the area brief named by the brief, the files you will change and
their callers. Read more only when a concrete question calls for it. A delegated fix reads only
`<agentic-fix>/references/writer-steps.md`, not the fix orchestrator's workflow. A UI writer reads
the exact design mode reference in the brief, not the whole design skill or unrelated modes.
Shared `tasks.md` belongs to the orchestrator: read assigned IDs and return status/evidence; do not
edit its checkboxes even when another lane changes them.

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

Obtain proof for the new test, area tests and typecheck using the brief's or `AGENTS.md`'s commands.
Reuse valid results only under `references/evidence.md` (exact code/tree, command and relevant
inputs); run missing or invalid checks. Save each command, state, inputs and result. A skipped test, missing database or setup returning empty counts as
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
- interface: the project's design system (`AGENTS.md` says which) and the exact
  `<agentic-design>/references/build-mode.md` or `<agentic-design>/references/targeted-adjustment.md` capsule supplied
  by the brief; read only the applicable rules and proof sections it names;
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

The final message is the handoff: assigned task IDs (if any), full base and HEAD SHAs, files,
commands and results with their `references/evidence.md` state/input record, what was skipped and
why, limitations and unfinished work; follow the brief's report format when provided.
The last line is the status, in `AGENTS.md`'s output format; without it: `status: done`,
`status: blocked: <reason>` or `status: spec-conflict: <what>` (after “Code, spec or test”, step 5).

Blocked midway: commit what is green and hand off with the blocker; never commit a red test to
mark missing work.

Done when the last line is the status.

## In other agents

In Codex: `$agentic-implement`, or the brief says “load agentic-implement”. The launcher
(`agentic-fix`, `agentic-feature`) chooses level, model and agent using
`references/choosing-the-agent.md`. Method origin and licenses: `references/origin.md`.
