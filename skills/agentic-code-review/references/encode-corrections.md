# Encode corrections in structure

Adapted from Lauren Tan's talk “All Code Is Slop (Except Mine)” (AI Engineer, 2026-11-14) and the
`correct` skill in `cursor/plugins` pstack (MIT, revision `536a3352a`). Summarized in our own words.

A rule in prose is the weakest defense: nothing fails when an agent skips it, and every line added
to `AGENTS.md` costs context on every task. A deterministic check holds for every agent, every run,
including the ones that never opened the instructions. Treat each correction as a defect in the repo,
not in the agent.

## When this applies

- The user corrects an agent for a mistake class that already happened once (the same correction
  twice, in the same or another session, or matching an existing `AGENTS.md` rule).
- A finding repeats in review (`learning.md`, “Fix at the source”).
- An escaped defect's class could have been rejected before review (`agentic-fix` step 8).

A one-off correction is fixed in the change and needs nothing more. Do not turn taste into a check.

## The ladder: use the highest rung that works

Assume the next contributor is an agent that sees only the files it opened, copies the nearest
example and takes the shortest path that compiles.

1. **Remove it with architecture.** One owner per piece of state, one supported way per task.
   Hide internals so the wrong import fails. Replace hand-synced lists with one source. Delete the
   old way and dead code an agent would copy.
2. **Make it unwritable with types.** The bad state does not compile.
3. **Reject it with a lint or CI check whose error names the fix.** “Use `formatMoney()` from
   `src/money.ts`; raw `toFixed` on amounts loses minor units” teaches the agent at the moment it
   errs. “Forbidden pattern” does not. Run the same command locally and in CI.
4. **Catch it with a behavior test** when the mistake is only visible at runtime.
5. **Write prose last**, only for judgment calls no machine can decide. Make it short, prominent
   and paired with one example of the failure.

If the fix is structural, ship only the structural fix. The prose rule was the symptom: remove it.

## Prove and scope it

- **Prove it fails on a real past mistake**: seed or replay the original error, see red, restore
  green. A check that has never failed proves nothing.
- **Existing occurrences**: if the pattern is already common, fail only on new occurrences (a
  baseline file or a diff-scoped rule) and record the cleanup as follow-up work. Never block the
  current change on unrelated old instances.
- **Exceptions** sit on the offending line with a reason and an owner. A suppression without a
  reason is itself a finding.
- No false positives: a check that flags correct code trains agents to suppress it. If it cannot
  be precise, go one rung down.
- Keep it within the authorized scope. Adding a lint rule or CI step to a repo is a repo change:
  propose it as a diff when the user did not ask for repo changes.

## Rule table

When `AGENTS.md` keeps hard rules, pair each with what enforces it:

| Rule | Enforced by |
|---|---|
| Money uses integer minor units | lint `no-float-money` (`npm run lint`) |
| Ask before deleting user data | prose (judgment) |

On a correction, check the table first. A rule already listed with “prose” that was broken again is
a repeat: move it up the ladder in the same change. Drop a row once its mistake cannot happen.

## Report

Each class with its evidence, the rung chosen, why a higher rung did not work, and the red/green
proof command.
