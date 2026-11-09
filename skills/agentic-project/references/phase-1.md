Phase 1 — Prerequisites

Only for prerequisites of selected modules. For minimal bootstrap, inspect the actual repo's
runtime and commands through `minimal-bootstrap.md`; optional setup tooling is not required.

1. Run `bash <skill>/scripts/check-environment.sh` when using this set's setup scripts. Its
   exit 1 means `git` or `node>=20` is missing for that toolchain; block only work needing it,
   not unrelated repo preparation. Missing recommended tools have fallbacks. A selected UI
   protocol needs `agentic-design` for its rules/detector; otherwise report the dependency
   without claiming the UI gate passed.
   Inspect existing authorization and observed capabilities (`host-compatibility.md`) before
   asking for anything. Propose only a concrete installation or permission still needed for
   the selected work, with command, purpose and destination. Do not pre-request web/git/full
   sandbox permissions. Web research and a skeleton are conditional on a material question;
   without access, mark their evidence “not confirmed” or “not measured”.
2. Read `references/prerequisites.md` and consider only categories affecting the selected work.
   Answer from context yourself; ask only remaining material decisions in order of impact.
3. When a dedicated record is useful, write `docs/prerequisites.md`: item → status
   (ok / pending / n/a) → owner → note,
   and an “Only the human can do this” list (accounts, secrets, DNS, billing). Record each
   decision here (audience, region, cost ceiling…) immediately in `docs/decisions.md` using
   the template format; phase 2 does not ask it again.

Done when every applicable prerequisite has a status and every real blocker has an owner. Reuse
an existing record or handoff if the few items do not justify `docs/prerequisites.md`.
