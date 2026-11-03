# Prerequisites (phase 1)

Goal: discover early what blocks or increases the cost of the project and only the human can
resolve. A forgotten prerequisite later becomes a lost week (slow account approval, data that
cannot leave its chosen region, costs exceeding budget).

How to use: first check whether context, code or docs answer each item. Ask only what is
missing, in category order (earlier categories change more things). Include a recommendation
with each question. Record everything in `docs/prerequisites.md`.

## 1. Goal and user
- What problem does it solve, for whom, and how is it done today without the product?
- Who pays and who uses it (may be different people)?
- How will we know in 3 months that it was worthwhile (one observable metric)?

## 2. Legal and data constraints
- Personal data? Which categories? Sensitive data (such as biometric records), data about minors
  or criminal convictions require a dedicated legal basis, access records and usually an impact
  assessment under applicable law. Recommend treating uncertain categories as sensitive from
  the start; cheaper than migration.
- Where may data reside? Recommend the chosen operating region by default (hosting, backups,
  subprocessors, including email, logs and AI).
- Retention and deletion (data subject request, end of contract)?
- Payments: never store card data; use a processor (Stripe, Adyen, etc.). Local billing law
  (e.g. mandatory invoice records) is a requirement, not a detail.
- Other sector regimes (finance, education)? If unknown, record a pending item with a human owner.

## 3. Budget and costs
- Monthly infrastructure cost ceiling in year one?
- Usage costs (AI, SMS, email, storage) with consumption alerts?
- Who pays service bills (company card, not developer's)?

## 4. Hosting and region
- Where does it run (VPS, managed cloud, PaaS, serverless)? Final decision in phase 3; collect
  only constraints here (region, latency, provider preference, operator).
- Existing domain? Who controls DNS?

## 5. Accounts and external services
For each service (git remote, hosting, managed database, transactional email, payments,
monitoring, app stores): account exists? **Who owns it** (organization, with 2FA, not personal)?
Who has admin access? DPA when processing personal data?

## 6. Local tools
Run `scripts/check-environment.sh`. Essential: `git`, `node>=20`. Recommended: `gh`, `uv`,
`specify`, `agentic-feature` (entry point for every feature), `agentic-design` (essential with
UI: rules and slop detector used by phases 2, 4, 6), and the `mattpocock-skills` plugin.
Optional: `gitleaks`. Install only with human approval; the script prints the exact command.

Ask all authorizations together in one question (each a table row, approval recorded in
`docs/decisions.md`):
- **Web research**: `WebSearch` and `WebFetch` (no domain list, or a minimal list: package
  registry, stack docs, price pages) in `.claude/settings.local.json`, outside git (phase 4's
  base `.gitignore` ignores it; until then, explicit-path commits exclude it). Without approval
  or network, phase 3 marks versions/prices “not confirmed” and this item stays pending.
- **Phase 3 skeleton**: downloading dependencies into a temporary folder (scaffolder and
  `npm install`) runs third-party code; without approval, “Measured in skeleton” is “not measured”.
- **Sandbox git commands** (only for read-only `.git` sandboxes, such as Codex
  `workspace-write`): approve `git commit`, `git worktree add`, `git config` for the session,
  or open with full permissions (`codex --sandbox danger-full-access`). Without approval,
  every skill commit needs approval and agent lanes run sequentially on one branch.

## 7. Human-only access
List explicitly; these are the most common critical path:
- secrets and API keys (human puts them in local `.env` or secret manager, never chat);
- DNS and domain;
- billing and cards;
- account creation and terms acceptance;
- app stores, code-signing certificates;
- `gh` authentication (`gh auth login`).

The agent never creates accounts, enters payment details or asks for secrets in chat.

## `docs/prerequisites.md` format

```markdown
# Prerequisites

| Item | Status | Owner | Note |
|---|---|---|---|
| Personal data → legal basis | pending | <human> | ask privacy officer by <date> |
| Node >= 20 | ok | - | 22.x |

## Only the human can do this
- [ ] Create account X for the company (2FA on)
- [ ] Put key Y into `.env` (variable `Y_API_KEY`)
```

Statuses: `ok`, `pending` (always has an owner), `n/a` (with a word explaining why).
