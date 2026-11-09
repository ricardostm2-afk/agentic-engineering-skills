Phase 3 — Architecture

Only for a selected **Architecture** module. Preparing an existing repository does not by itself
request an architecture or security/currentness audit.

Read `references/architecture.md`; read `references/architecture-research.md` only when a
material decision needs current evidence. First identify the relevant constraint, component
or boundary. For unchanged adopted components, reuse scoped valid evidence and document the
existing shape; do not refresh every framework, runtime, database, auth provider and host.
Research newly introduced/changed components, unknown support/security/API currentness that
matters to this decision, or the explicitly requested audit scope.

For a real open stack choice, compare 2–3 viable options within the research limits, with cost
(confirmed or marked estimate), operation, lock-in, agent suitability and a recommendation.
Reuse an already chosen stack; ask only an unresolved material decision. A skeleton is useful
when it resolves a concrete uncertainty, not a mandatory demonstration for every option.

Output only what supports this module: a short `ARCHITECTURE.md` (modules, flows, verification)
or a scoped update to the existing document; the decision/research evidence in the current
decision location; ADRs only when all three conditions in `architecture.md` §6 hold.
An area map becomes `.agentic/areas.json` only if parallel setup is selected. Create/update
`docs/radar.md` only for reusable technology evidence and targets that merit maintaining it;
a small scoped source table can remain with the decision instead.

Done when relevant constraints and choices are clear, the affected code has a real verification
path, and claims have sources/dates or explicit uncertainty. Record unresolved access/research
with an owner in the existing prerequisite record or handoff; do not create unrelated artifacts.
