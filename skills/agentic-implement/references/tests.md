# Tests worth keeping

For step 3 of `agentic-implement`. Applies in every cycle, before and during, rather than at the end.

## A good test

Checks behavior through the public interface, not implementation details. The code can change
entirely and the test remains valid. It reads like a specification: “the user pays with a valid
cart” states a capability.

## Seams

The **seam** is where a module's interface lives: there you observe behavior without entering the
internals (definitions in `<agentic-architecture>/references/vocabulary.md`). Tests live at seams.
The brief names them when it matters; otherwise choose the nearest to the user and state in the
handoff which one, what it catches and what it lets through.

## Bad tests

- **Implementation-coupled**: mocks internal collaborators, tests private methods or checks via
  a side channel (querying the database instead of using the interface). Signal: the test breaks
  in a refactor with unchanged behavior.
- **Tautological**: the assertion recalculates the expected value like the code (`expect(sum(a,
  b)).toBe(a + b)`, a manually made snapshot along the same path), so it always passes. The
  expected value comes from an independent source: a known literal, worked example or spec.
- **Horizontal slices**: all tests first, then all implementation. Tests the imagined shape rather
  than behavior. Work in vertical slices: one test, one implementation, the next learning from the last.
- **Green by default**: a skipped test, one passing without a database or with setup returning
  empty. Counts as red.
- **Cannot fail**: no change to the code under test turns it red. It tests the framework or browser
  (an element renders, a click fires), mocks the unit under test and asserts the mock, or restates
  what the type system already rejects.
- **Change detector**: only a deliberate decision turns it red (a constant's value, the wording of
  an internal message, a private structure), so it fails on every redesign and passes through
  bugs. Assert the behavior the decision drives: not that the retry limit is 5, but that a failing
  call is tried 5 times and never a sixth. Text or values another program or agent reads (a wire
  format, an error code, an instruction file) are behavior, and pinning them is right.
- **Guards the past**: asserts that removed code stays removed (a deleted feature is absent, a file
  is gone from its old path). Bringing it back would be a decision, not a regression. Do not add
  one when deleting code. A lint or dependency rule that rejects new uses of a banned path is a
  guard with its own proof, not this.
- **Copy**: a second test at the same seam for the same behavior and input class. Extend the
  existing one. Repetition across platforms, layers of a security refusal or an incident's
  regression test is deliberate, not a copy.
- **Production code for the test**: a reset, getter or export that only tests call. Test through
  the public interface; if that is impossible, the seam is missing and goes in the handoff.

Do not write these. Removing ones that already exist is a separate, requested task with proof per
deletion: `pruning-tests.md`. Never delete a test to turn the current task green.

## Mocks

Only at system boundaries: external APIs (payments, email), clock and randomness, sometimes the
filesystem or database (prefer a test database). Use your modules and internal collaborators for
real. At boundaries, inject dependencies as parameters and give each external operation its own
function, so each mock returns a single shape.

Before replacing a call, list what the real one does besides returning (writes a file, fills a
cache, emits an event): keep real what the test depends on and mock the slow or external level
below it. A fake response carries every field the real one has, not only the ones this test reads.
Success, error and malformed responses each get their own fixture, and arguments, call count or
order are asserted when they are part of the contract. When the mock setup outgrows the test, or
the mock lacks methods the real component has, test against the real component instead.

## Timeouts and child processes

A test launching a server, browser or another child process can hang the suite without failing.

- **Headroom**: a timeout is at least 2× the longest measured time; a value just at the measurement
  fails on the first loaded machine.
- **Registered child**: register child termination before starting it, and terminate in teardown,
  including when the test fails midway.
- **Orphan**: an orphan child hangs the suite. After green, run the suite twice consecutively:
  both runs finish.

## Property tests

Use one when a rule must hold for every input: parsing, serialization, money, sorting, permissions,
migrations, retries. State the rule as a property. A library such as fast-check (JS/TS), Hypothesis
(Python) or proptest (Rust) then generates thousands of inputs to break it and shrinks any failure to
a minimal case. The generator does not share the biases of the agent that wrote the code, so it finds
edge cases that example tests miss.

- **Round-trip**: `decode(encode(x))` equals `x` (parsers, serializers, codecs).
- **Invariant**: something never happens (a balance never goes negative, a list stays sorted).
- **Idempotency**: running it twice equals running it once (migration, normalization, retry).
- **Equivalence**: the optimized version matches a naive one that is obviously correct.

A property test still needs a red. Show it fails on the base (or on a seeded defect) before trusting
it. Fix the seed in CI, or print it on failure, so that a red can be reproduced. Add the library only
when the project's dependency rules allow it. Otherwise, write a small loop over generated inputs at
the same seam.

## Differential tests

For a migration, rewrite or port where the old system's behavior is the spec, treat the old system as
the oracle. Run old and new on the same inputs (random, or sampled real traffic with synthetic data),
and compare the outputs. Normalize what does not matter (whitespace, key order, timestamps). Keep a
written list of approved intentional differences. Any other difference is a finding, never a side to
pick. The refactor case is below.

## Flaky tests

A test that passes and fails on the same code teaches the agent to rerun instead of fixing. Never
skip it, add a sleep, raise a timeout without measuring, or retry until it passes. Find the cause
(shared state, ordering, real clock or network, an unregistered child) and fix it. Prove the fix with
the test passing N times in a row (N from the project; otherwise 20). If the cause cannot be found
within the task, delete the test and record why in the commit body, along with the behavior that is
now uncovered. That is better than leaving a check nobody believes.

- **Wait for the condition, not a duration.** Poll the state the test needs (an event, a file, a
  count) with a deadline that follows the headroom rule above and an error naming what it waited
  for. A fixed delay is right only when timing is the behavior under test (a debounce, a tick):
  wait for the trigger first, then for a delay computed from the known period.
- **Find the polluter.** When a test fails only after others ran, or the suite leaves a stray file,
  directory or global state behind, run the test files one at a time in a fixed order and check
  for that state after each; bisect when the list is long.

## Refactor: pin, change, prove equal

A task changing structure without changing behavior (splitting a file, deepening a module, moving
code) has no red to write: behavior already exists. The cycle differs:

1. **Pin.** Before changing anything, pin current behavior in a command running at the public seam:
   existing tests if they cover it; otherwise a **characterization** test written now, recording
   today's behavior with real inputs and edge cases; or a **differential** test running old and
   new versions on identical inputs and comparing outputs. Run it on the base and prove it can
   fail: break one line of the covered path, see red and restore (forced red, below).
2. **Change** structure only, in small steps, with the command green after each. A behavior change
   appearing midway is another task: put it in the handoff.
3. **Prove equal.** The same command gives the same result on base and HEAD (same counts, same
   compared output), and both results go in the handoff. Do not resolve a difference by choosing
   a side: old behavior may be a defect characterization pinned. Return `blocked: <the difference>`
   and let the orchestrator decide.

Old tests made irrelevant by the refactor (internals of a shallow module) are removed only after
step 3, with step 1's command covering what they covered.

Done when step 1's command failed with the seeded defect and gives the same result on base and HEAD.

## Cycle rules

- Red before green: the failing test first, then only code to pass it.
- One slice at a time: one seam, one test, minimum implementation.
- In a behavior task, refactoring stays outside the cycle: it belongs to review. A refactor task
  follows “Refactor: pin, change, prove equal”.
- **Forced red**: if you forced red by changing code or a fixture, compare with a clean copy
  (`diff`) to prove the change took effect before trusting the red.
- **Mutation check** before handing back: for each realistic mistake in the new code (a wrong
  constant or argument, the wrong branch, a missing side effect or state change, an empty or
  default return, a missing refusal where the code must reject zero, empty, null, unauthorized or
  malformed input), name the test that turns red. A mistake no test catches is unprotected behavior: add the test, or
  name the gap in the handoff.
- **Clean output**: the final run adds no new warning or stray log; noise hides the next real
  failure.
