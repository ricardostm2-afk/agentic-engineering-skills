---
name: agentic-tool-design
description: >-
  Designs or revises MCP, CLI or API tool contracts for agents: boundaries, schemas, discovery,
  evidence, effects and resource lifecycle. Use for tool-interface decisions; use agentic-feature
  or agentic-fix to coordinate implementation, and agentic-analysis-optimization for measured
  pipeline cost.
---

# Tool design for agents

Host differences, installations, tool substitutes and sibling resolution follow
`<agentic-project>/references/host-compatibility.md`; find that sibling through
`$AGENTIC_PROJECT_DIR` first and read the reference when the host varies.

Design the boundary from the question the person needs answered, not the available library. Adapted from the REA skill and design guide, under MIT; [origin and updates](references/origin.md). Does not depend on REA.

Read the current canonical contract, consumers and closest tool. Code, documentation and connected catalog may belong to different versions; confirm the schemas actually available. Follow project rules and existing authorization for implementation, configuration and external effects.

## Choose a boundary

Extend a tool when intent and contract match; create another for materially different results or authority. A tool need not bundle unrelated discovery, execution and mutation just to shrink the catalog.

| Shape | Question answered |
| --- | --- |
| Inspect | What facts exist about this identified object? |
| Search/list | Which candidates match and how do I continue to the next page? |
| Trace | Which relationships support this conclusion and where are the unresolved paths? |
| Compare | What differs between these two explicitly paired artifacts/states? |
| Observe/capture | Which actions and effects occurred on this target during this lifecycle? |
| Compose a workflow | Which recurring result combines several sources without hiding choices or uncertainty? |

Shapes do not impose prefixes. Prefer reusable primitives; add a workflow when repeated use demonstrates a result that can be safely composed. A business-specific interpretation does not belong in a generic decoder. Batching is worthwhile only if it preserves identity, required ordering and individual failures.

Normal commands and scripts may suffice to compose experiments. An orchestration language, replay or prepare/execute needs a demonstrated need; a plan does not prove execution.

## Define input and response

Make target identity, action/output choices and required fields explicit; remove ignored options. Deliver useful facts inline, sources/locations, producer identity, coverage, inferences and unknowns. Do not require extra queries just to discover what the response means.

For large responses, provide summaries/selection/stable pagination with access to full evidence. Define the universe to which counts and limits apply. Missing coverage is unknown, not an absence of facts; a complete inventory does not make all providers available. Distinguish observed, derived and inferred relationships.

Declare process, file, network, UI and mutation effects. Static analysis did not observe runtime; attaching to a process does not automatically transfer ownership of it. Contract structure must preserve the target and lifecycle the user actually chose, without silently expanding scope.

Read [contracts and resources](references/contracts.md) when providers, shared resources, cancellation or cleanup are involved.

## Prove and deliver

Present the proposed boundary, input/result, effects, closest existing alternative and verification approach. Implement only within the authorized scope and through the project's process.

Test the public entrypoint with a normal case and changed boundaries: wrong/inaccessible target, empty vs partial result, next page, invalid input, producer failure, cancellation and cleanup. A test confirming its own mock does not prove the producer contract. Keep real evidence when claiming real provider capabilities.

Deliver example calls/results, error contract, availability and limits. Measure the completed task to claim cost/usability improvements: serialized size alone does not prove saved tokens, lower latency or better decisions.
