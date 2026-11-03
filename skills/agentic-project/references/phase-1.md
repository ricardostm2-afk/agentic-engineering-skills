Phase 1 — Prerequisites

1. Run `bash <skill>/scripts/check-environment.sh`. Show the table. If anything is missing,
   propose installation commands and run them only with approval (installation changes the
   human's machine). Exit 1 = an essential tool is missing (`git` or `node>=20`): resolve this
   before continuing. Missing recommended tools do not block; each phase provides a fallback.
   Exception: in a project with UI, missing `agentic-design` is a pending item with an owner
   (without it there are no UI rules or detector).
   In the same question, propose all authorizations together (format and file in
   `references/prerequisites.md` §6): web research (`WebSearch` and `WebFetch` in
   `.claude/settings.local.json`, outside git; using `update-config` if available), because
   phase and feature research always runs and otherwise every page needs authorization;
   dependency downloads for the phase 3 skeleton, which runs third-party code; and git commands
   for an agent whose sandbox makes `.git` read-only (Codex: “In other agents”, Sandbox and
   git). Only with approval; record the answer in `docs/decisions.md`. Without approval or
   network access, phases continue with “not confirmed” and the item stays pending.
2. Read `references/prerequisites.md` and work through its checklist. Answer anything already
   covered by the context yourself; ask the human the rest in order of impact.
3. Write `docs/prerequisites.md`: a table of item → status (ok / pending / n/a) → owner → note,
   and an “Only the human can do this” list (accounts, secrets, DNS, billing). Record each
   decision here (audience, region, cost ceiling…) immediately in `docs/decisions.md` using
   the template format; phase 2 does not ask it again.

Done when every item has a status and every pending item has an owner.
