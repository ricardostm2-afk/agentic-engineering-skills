# Prerequisites (phase 1)

Goal: discover early what blocks or increases the cost of the project and only the human can
resolve. A forgotten prerequisite later becomes a lost week (slow account approval, data that
cannot leave its chosen region, costs exceeding budget).

Use only categories affecting selected setup modules. First check whether context, code or docs
answer the question. Ask only a material unknown, in order of impact, with a recommendation.
Record real prerequisites in the existing record or `docs/prerequisites.md` when useful; minimal
bootstrap can report its few blockers in the handoff. This is a question bank, not a census.

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
Inspect the repo's actual runtime and package manager first. `scripts/check-environment.sh`
checks this set's optional setup toolchain (`git`, `node>=20`; recommended `gh`, `uv`, `specify`
and sibling/plugin skills). Its missing-tool status blocks only a selected module using that
tool, not preparation of an unrelated stack. `agentic-design` is needed for selected UI checks;
Spec Kit and the third-party plugin are not prerequisites for minimal bootstrap.

Use `host-compatibility.md` for observed capabilities and approvals. Existing authorization
persists. Do not infer read-only git from a host/sandbox name or ask for blanket full access.
Request only a concrete needed operation when the host actually requires permission:

- **Research:** use available web access for the scoped question; if unavailable, mark the
  relevant claim “not confirmed”. Do not edit approval configuration merely to avoid prompts.
- **Skeleton/install:** state command, purpose and destination; reuse installation authorization.
  Without access, record the measurement as not performed.
- **Git:** try authorized operations in the intended directory. Diagnose an observed failure
  before proposing an allowed alternative or the host's real approval mechanism. Never weaken
  controls or repeat a rejected escalation.

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
