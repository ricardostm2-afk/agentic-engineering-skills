# Pruning tests that guard no behavior

Read when the human asks to prune, thin or clean a test suite, or when an audit finds tests whose
removal is the proposed fix. A test earns its place by one rule: it changes only when intended
behavior changes, and it fails only when that behavior regresses. Everything else costs run time,
review attention and trust in red.

What a good test looks like when writing one is in `tests.md`; this reference is the pass over
tests that already exist. A suite or CI audit reaches it through the `agentic-ci-audit` skill, which
owns discovery, false greens and cost.

## When, and what it never is

- Only on an explicit human request for this suite or folder, or as a proposal inside an authorized
  audit. Deleting a test is not a way to turn a task green: inside a behavior task, a failing
  project test stays an oracle (`agentic-implement` step 5, “Code, spec or test”).
- A flaky test is not a pruning candidate. It follows “Flaky tests” in `tests.md`: find the cause
  first.
- Tests a refactor made irrelevant leave through that refactor's own recipe (`tests.md`, “Refactor”),
  after equality is proven.
- Deliberately redundant coverage is kept: the same scenario across platforms or runtimes, a
  security or isolation refusal asserted at more than one layer, a regression test tied to an
  escaped defect or incident. When unsure whether repetition is deliberate, ask; do not decide
  silently.

## What each test depends on

Sort every candidate by what would make it change or fail.

| Depends on | Signs | Action |
|---|---|---|
| **Intended behavior** | Fails when the behavior regresses, survives a rewrite of the internals | Keep |
| **The past** | Asserts that removed code stays removed: a deleted feature is absent, a moved module is missing from its old path. Bringing it back would be a decision, not a regression | Delete |
| **Nothing** | No change to the code under test can make it fail: it tests the framework, runtime or browser (an element renders, a click fires), mocks the unit under test and asserts the mock, or restates what the type system already guarantees | Delete |
| **The implementation** | The expected value is computed by the same logic as the code; it asserts private state, internal call order or which helper ran; or it pins a value only a deliberate decision changes (a change detector, `tests.md`) | Rewrite at the public seam with an independent expected value if something relies on the behavior; otherwise delete |
| **Another test's behavior** | A second test at the same seam guards the same behavior with the same inputs class | Keep the one nearest the user; delete the copy |

Then remove production code that existed only for the deleted tests (test-only resets, getters,
exports). Check with a search that nothing else imports it.

## Proof before each deletion

A deletion without proof is a silenced check. Record one of these per test, or per class when a
script handles a mechanical class:

- **Nothing / implementation:** break the behavior the test names, in an isolated copy (wrong value,
  skipped effect), and show the test still passes; or show the assertion cannot observe the code
  (the mock answers, the type rejects the bad case at compile time). Restore the mutation.
- **Duplicate:** name the retained test and show it goes red under the same mutation that the
  deleted one caught. Every distinct assertion of the deleted test maps to a retained one,
  including identity, permissions, cancellation, cleanup and limits.
- **The past:** cite the commit or decision that removed the code, and show the test asserts
  absence only.
- **Rewrite:** the rewritten test fails on a seeded defect and passes on the base, like any new test.

After pruning, the remaining suite runs green with the same skips as before, and one mutation per
touched area still turns it red. A lower coverage percentage does not by itself make the pruning
wrong; where the project enforces a threshold it still applies: report the change and let the
owner decide.

## Deliver

One commit per class and area (past, nothing, implementation, duplicate, test-only production
code), small enough that a reader can check the proof for every test in it, with that proof in the
body. Report tests removed and rewritten by class, production code deleted, the
mutations used, run time before and after (`measurement.md`), and what was left because intent
was unclear.

The resulting diff is reviewed like any other. Removed production code needs the deletion proofs
the correctness lens asks for (history, indirect uses, live configuration). A removed test needs
its recorded proof from this reference; without it the deletion is an Important, because a check
disappeared with no evidence that it guarded nothing.

Ideas from the `prune-tests` skill of `caldoai/skills` (MIT); the proof and authorization rules are
local. See `origin.md`.
