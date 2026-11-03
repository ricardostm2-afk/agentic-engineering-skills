---
name: agentic-analysis-optimization
description: Optimizes agent analysis pipelines with measured latency, CPU, memory, subprocess or context costs while preserving evidence and results. Use for demonstrated repeated work or oversized responses; use agentic-ci-audit for test-suite cost and agentic-tool-design for tool contracts.
---

# Analysis optimization

Host differences, installations, tool substitutes and sibling resolution follow
`<agentic-project>/references/host-compatibility.md`; find that sibling through
`$AGENTIC_PROJECT_DIR` first and read the reference when the host varies.

Find concrete unnecessary work, fix it at its owner and compare equivalent completed investigations. Deciding through measurement to leave an implementation unchanged is also a useful outcome.

Adapted from REA, under MIT; see [origin and updates](references/origin.md). Does not require REA. Read [the Kuna case](references/kuna-case-study.md) when a measured example helps choose reuse; the numbers are historical, not a promise for another provider or project.

## Pin the task and oracle

Read the project's current contracts and commands. This skill does not grant authorization to execute targets, install tools, publish or integrate.

Describe the user's complete task: required facts and relationships, detail, source access and relevant unknowns. Choose a representative real artifact and a small/empty case. Record revision, target digest, producer identity/version, options, host and entrypoint. Isolate changes without disturbing others' work.

Establish an independent oracle: expectations from a fixture built from sources, independently mapped bytes or a real producer with interpretation checks. Two wrappers around the same wrong decoder do not prove correctness. Preserve identity, same-key alternatives, unresolved relationships, coverage and source linkage. An empty result proves absence only within the scope actually examined.

## Find the first unnecessary work

Follow a public CLI/MCP/API task to the producer. Measure admission/identity, analysis, decoding, lookup, projection, serialization, retention and cleanup where relevant. Include catalog discovery and extra calls that affect task completion.

| Observed cost | Candidate fix | Condition to demonstrate |
| --- | --- | --- |
| Repeated scans of validated facts | Reuse existing ordering/lookup | Identity/order established and all alternatives retained |
| Equivalent producer work | Share result or in-flight work | Inputs, freshness, lifetime and per-consumer result explicit |
| Full report for a few facts | Move selection/projection earlier | Full facts/evidence remain accessible and coverage is declared |
| Large temporary buffers | Decode incrementally | Entire admitted document validated; retention also accounted for |
| Many homogeneous reads | Share admission or batch | Identity, required ordering and individual failure preserved |

A cache, index, batch endpoint or orchestration layer needs identified removed work and maintenance cost. Projecting after materializing everything may reduce output without improving time or memory. Fix missing/wrong facts before comparing speeds against a more complete workflow.

## One interpretation, explicit reuse lifetime

Validate and normalize at the producer; consumers query that representation rather than reconstructing relationships from the raw report. Separate identity from formatting.

For every cache: key, owner, invalidation, retained size and lifetime. Include target bytes, producer content/version, options, architecture/mapping and schema/parser when they affect results. Revalidate live state before calling a stored observation current. Cache rejections only when deterministic for that key; transient/partial/cancelled failures need their own retry policy.

A cancelled consumer does not invalidate a successful peer. Preserve producer failure and per-consumer reason. Maintain ownership and accounting until work/cleanup finish; a cleanup failure does not erase completed observations. Exercise invalidation, concurrent consumers, cancellation of the last consumer, closure and cleanup retries when those paths change.

Bound the process family and retained state, not just parent heap or worker count. Count decoding/serialization expansion before allocation. Choose limits for the host and workload; stop before OOM and verify cleanup only of owned resources. Work stopped by a limit is incomplete; streaming does not authorize unbounded retention or disguised partial success.

## Compare equivalent completions

Run the real public workflow before/after with equivalent inputs, results, coverage and evidence semantics. Include small cases, distinguish cold sessions, runtime caches and OS caches; alternate/repeat when variance changes the decision. A fake engine does not qualify the real provider.

Report results, phase timings, total time/CPU, process-family peak and accounting method, limit stops and cleanup. Summed RSS may count shared memory more than once. Check payload and profiler exit statuses; retain failed attempts and unmeasured costs.

To claim token reduction, count discovery/schemas, arguments, responses, retries and continuations needed to complete the task. Separate tokenizer estimates from actual model usage. Smaller JSON proves neither fewer tokens nor a better investigation.

Close with the bottleneck, change at its owner, preserved semantics, checks run, measurements and limits. Distinguish local experiment from integrated/published code. Stop when the demonstrated bottleneck is resolved or further benefit is speculative.
