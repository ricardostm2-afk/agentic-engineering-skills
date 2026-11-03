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

## Mocks

Only at system boundaries: external APIs (payments, email), clock and randomness, sometimes the
filesystem or database (prefer a test database). Use your modules and internal collaborators for
real. At boundaries, inject dependencies as parameters and give each external operation its own
function, so each mock returns a single shape.

## Timeouts and child processes

A test launching a server, browser or another child process can hang the suite without failing.

- **Headroom**: a timeout is at least 2× the longest measured time; a value just at the measurement
  fails on the first loaded machine.
- **Registered child**: register child termination before starting it, and terminate in teardown,
  including when the test fails midway.
- **Orphan**: an orphan child hangs the suite. After green, run the suite twice consecutively:
  both runs finish.

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
