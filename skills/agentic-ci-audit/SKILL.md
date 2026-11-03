---
name: agentic-ci-audit
description: >-
  Audits test suites and CI pipelines for false greens, missing test discovery, stale fixtures, invalid
  caches and measured waste. Use for suite reliability or cost audits; use agentic-fix for one failing
  test and normal project checks for feature validation.
---

# CI and test audit

Host differences, installations, tool substitutes and sibling resolution follow
`<agentic-project>/references/host-compatibility.md`; find that sibling through
`$AGENTIC_PROJECT_DIR` first and read the reference when the host varies.

Determine which regressions checks actually detect and which work can be removed without losing that protection. A valid conclusion may be a proven fix, a recommendation or leaving everything as it is.

Adapted from REA, under MIT. See [origin and updates](references/origin.md) for the pinned revision, license and local differences. Does not require REA, MCP or a native provider.

## Pin what ran

Read project rules, contribution guidance and current commands. Investigation does not authorize editing, publishing issues, pushing or integrating. Use an isolated copy/worktree for control mutations and preserve others' work.

Record tree and workflow SHAs, local changes, command, tool, host, test identities, instrumentation and prerequisites. An old run proves only the revision it ran; do not change its attribution because main advanced.

Follow the entire path: triggers, path selectors, matrix, job dependencies, reusable actions, scripts, test discovery, subprocesses, reports and final aggregator. Import graphs can miss scripts, generated data and dynamic registrations. Check positive and negative selection; a missing required file or report must fail. Intentional repetition across platforms is coverage, not necessarily duplication.

Use existing timings/failures to choose suspect families. Run the smallest baseline that answers the question; reserve the full suite for a broad audit or uncertainty focused tests cannot resolve. Do not repeat an unchanged suite for every documentation edit.

## Prove the defect or protection

For each candidate, identify expected behavior, producer and consumers. Build a small reproduction that reaches the claimed behavior:

- **Divergent fixture:** compare admission assumptions, versions, protocol responses and real entrypoints. Preserve deliberately invalid fixtures and the rejection they are meant to test; look for other instances in the family.
- **Suspicious green:** inject a controlled failure or perturb the implementation in an isolated copy. The existing test/gate must detect it. A self-confirming mock, abandoned module or lost exit code can manufacture green. Restore mutations at the end.
- **Shared setup or pruning:** map every distinct assertion to the retained scenario, including identity, permissions, cancellation, cleanup, limits and relevant concurrency. Fewer cases or a weaker oracle are not acceleration.
- **External integration:** separate fake producer, real boundary and real service/engine. A simulated browser or fake driver does not prove the installed provider. Distinguish allowed skips from unmet mandatory prerequisites.

Classify as reproduced defect, demonstrated cost, hypothesis or unavailable evidence. Keep command/output/exit status, expected result, scope and competing explanations. A baseline failure may be pre-existing and still relevant to the audit; do not attribute it to the PR merely by similarity.

Repeat only to test a specific transient hypothesis, keeping the first failure. One green attempt establishes neither cause nor correction.

## Measure and fix without weakening the gate

For caches, artifacts, scheduling, logs or slowness, read [measurement and CI](references/measurement-and-ci.md). Compare equivalent completed work: tests, assertions, coverage and outputs, as well as time. Separate setup/build, execution, instrumentation, dependencies and runner waits.

Remove demonstrably duplicated preparation or repeated work before reducing coverage. Stored results do not automatically validate live host state, permissions, providers or services. Read documentation for the installed version before changing Turbo or another executor's configuration.

If editing is authorized, fix the responsible producer and add a regression that is RED on the baseline for the right reason. Verify consumers, negative paths and affected invalidation/discovery. Do not suppress failures, apply blanket retries or raise timeouts just to get green; changing these controls requires a demonstrated reason and preserved failure detection.

## Deliver and stop

For each finding: exact revision, reproduction, consequence, proposed fix and proof limits. For performance: workload, comparable measurements and unmeasured costs, not just a percentage. Show the exit code of the measured command and profiler/aggregator, counts, skips and required reports.

Public records and integration follow project authorization and process. Stop when the authorized scope is verified or further benefit is speculative; do not turn real uncertainties into an unlimited sequence of optimizations.
