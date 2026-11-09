<!--
agentic-project template. Record each decision when it is made (not at the end),
so nothing is lost if the session stops. Sequential numbering; never reuse a number.
Do not delete a revoked decision: mark it “superseded by D-NNN”.
-->
# Decisions: {{project name}}

## Context
- **What it is**: {{one sentence}}
- **Mode**: {{new | adopt}} — {{why, one line}}
- **Selected setup modules**: {{minimal bootstrap plus justified additions; omit unselected artifacts}}
- **Detected / chosen stack**: {{…}}
- **What already existed**: {{code, docs, accounts, services}}
- **Document language**: {{as declared in AGENTS.md; English by default}}

## Principles
<!-- Only without Spec Kit; with Spec Kit these live in .specify/memory/constitution.md. -->
- {{project principle, with a reason}}

## Decisions

### D-001 {{short title}}
- **Decision**: {{what was chosen}}
- **Why**: {{the constraint or fact that mattered}}
- **Alternatives**: {{other options and why not}}
- **Decided by**: {{human | human (against recommendation) | delegated (recommendation accepted with “you choose”) | agent (technical and reversible, no question: e.g. test runner, ORM)}}
- **Date**: {{YYYY-MM-DD}}
- **Reversible?**: {{yes, cheap | expensive → see docs/adr/NNNN}}

## Out of scope (MVP)
- {{what is explicitly left out, and when to revisit it}}

## Delegated decisions to review
<!-- Short list for the human to review when they have time. -->
- D-{{NNN}}: {{title}}

## Pending human actions
- [ ] {{account / secret / DNS / decision}} — {{owner}}
