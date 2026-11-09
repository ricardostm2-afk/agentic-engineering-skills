# Reusing verification evidence

Use this contract when receiving a lane, handing work to a reviewer, resuming a session or
integrating. Evidence proves an observed state, not an author's confidence. Verify the record
and its inputs before deciding which commands still need to run.

## Record the proof

For each check, keep the exact command (arguments, working directory and relevant environment),
its actual output or artifact path, exit code, test counts/skips, and the state it exercised:

- full commit SHA and tree, plus a diff/content hash for any uncommitted or generated inputs;
- relevant dependencies and lockfile/runtime/tool versions;
- relevant configuration, fixtures, environment and target (browser/device/theme for UI);
- external state when material (service/data revision, advisory date, live API response), and
  observation time or expiry when that state can change independently of the code.

Do not record secrets. Record safe identifiers/hashes or describe the protected input whose
equality must be checked. If an input is unknown, state that limitation instead of assuming it
is unchanged. A command with no useful assertions, skipped prerequisites or a missing required
dependency is unverified even if it exits 0.

## Reuse or rerun

Reuse valid output when the **exact code/tree + command + relevant dependencies, configuration,
environment and external state** match. A commit-message-only change may preserve the tree;
prove that equality. A rerun of identical proof solely because another role received it adds no
evidence: inspect the saved output and applicability instead. An unsupported “all green” report
does not qualify. Prefer the smallest check resolving a concrete gap.

Rerun affected checks when any relevant input changes, evidence is incomplete or inaccessible,
the result is flaky, an external result expires, or the new question was not covered. A changed
tree is a new state: only reuse a narrower check if its exact input tree is demonstrably identical
and the recorded dependency boundary proves unrelated files cannot affect it; otherwise rerun.
Project-required integration/CI gates still apply.

**Integration and rebase are validation boundaries.** Lane evidence covers the lane's state.
A new combined tree, rebase, conflict resolution or changed base needs integration verification
for the resulting state. If that exact combined state and its relevant inputs already have valid
proof, reuse it; do not run the same suite again at receipt, review and delivery. Patch-equivalent
review does not prove runtime compatibility with a changed base.

Keep historical red evidence tied to its base and green evidence tied to the resulting state.
Do not rerun a base failure merely to restate it. Reviewer independence still requires deriving
acceptance from intent rather than the author's tests; it does not require duplicating an already
valid command execution. Two consecutive suite runs are required only when process lifecycle
changed or a concrete orphan/flakiness failure is being investigated (`tests.md`).
