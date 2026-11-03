Phase 3 — Architecture

Read `references/architecture.md` and `references/architecture-research.md`. Before proposing,
find the current state of each category and research every option on the web using dated
primary sources (stable version and support, sourced cost, agent suitability measured in a
skeleton when cheap), within that file's limits; never quote versions or prices from memory,
and human decisions on constraints take precedence over research. Propose 2–3 options with
monthly cost (confirmed or marked “estimate”), operating effort, vendor lock-in, agent
suitability and a recommendation. The human chooses (or delegates). In adopt mode, or when
phase 2 already chose the stack, do not offer options from scratch: audit the existing
architecture (“Adopt mode” in `references/architecture.md`) and research each component's
version and support (“Adopt mode and an already chosen stack” in
`references/architecture-research.md`). Highlight decisions that are hard to reverse; write
ADRs only for those meeting all three conditions in the reference (§6); record others in
`docs/decisions.md`.

Output: a short `ARCHITECTURE.md` (modules, data flows, area map, where checks run) + the stack
decision with the research table (`docs/adr/NNNN-*.md`, or `docs/decisions.md` when there is no
ADR) + initial `docs/radar.md` from `assets/radar.template.md` (targets; phase decisions in
Adopt with who decided; promising options in Assess; Avoid only for failures of a mandatory
criterion).

Done when the option is chosen, every planned code folder has an area and a check, and
`docs/radar.md` has targets filled in and a source and date for each entry (or “not confirmed
(no network)”, with a pending item in `docs/prerequisites.md`).
