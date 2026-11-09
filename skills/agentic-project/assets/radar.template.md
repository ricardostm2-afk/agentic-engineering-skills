# Technology radar: <project name>

<!--
Rules (remove comments when filling this in):
- The radar is not a rule: AGENTS.md, the constitution and ADRs take precedence in a conflict.
- This optional file stores reusable evidence; do not create it merely to close setup.
- Read relevant entries when a material research question arises; write when new evidence matters.
- One line per entry, with a primary source (URL), verification date, component/version/target
  scope and invalidation trigger. Versions and support status require a source, never memory.
- Refresh only invalidated evidence or material unknown currentness (changed versions, APIs,
  constraints, support/security state, provider terms/prices, or the entry's Review on trigger).
  Reuse matching valid evidence; never refresh the whole stack solely because a new task starts.
- New entries go into Trial, Assess or Avoid. Adopt, and changes between Adopt and Avoid,
  require a human decision recorded under “Decided by”. Exception: at agentic-project phase 3,
  its decisions go straight into Adopt: the stack (human or delegated, ADR-NNNN or D-NNN),
  technical choices recorded as “agent” in docs/decisions.md and, in adopt mode, the existing stack.
- Avoid: only failures of a mandatory criterion (end of life, unsafe, experimental) that
  another agent would probably propose again. “Not chosen” belongs in the ADR, not here.
-->

## Targets

| What | Value | Source / decision | Verified on |
|---|---|---|---|
| Target browsers | <e.g. `baseline widely available` (browserslist)> | <ADR or decision> | <date> |
| Native platforms / WebViews | <e.g. Android `minSdk` 26; kiosk tablets; or “none”> | <ADR or decision> | <date> |
| Runtime | <e.g. Node.js x.y LTS> | <support policy URL> | <date> |
| Accessibility | <e.g. WCAG 2.2 AA> | <standard URL> | <date> |
| Performance | <e.g. “good” Core Web Vitals at p75> | <URL> | <date> |

## Entries

- **Adopt**: the default for this project.
- **Trial**: limited use (one feature, behind a flag), being measured.
- **Assess**: promising, not used yet. State the trigger for a trial.
- **Avoid**: do not use. State why so nobody researches it again without a new reason.

| Ring | Entry | Area / target scope | Why (one line) | Source | Verified on | Review on / invalidation | Decided by |
|---|---|---|---|---|---|---|---|
| Adopt | <framework X 1.2> | <runtime/target> | <chosen for …> | <URL> | <date> | <version/support/constraint change> | <human \| delegated, ADR-0001> |
| Trial | <bounded option> | <affected area> | <gain being measured> | <URL> | <date> | <trial result / end date> | <decision> |
| Assess | <promising option> | <scope> | <unresolved question> | <URL> | <date> | <event that warrants a trial> | <decision> |
| Avoid | <unsuitable option/version> | <affected target> | <failed mandatory criterion> | <URL> | <date> | <fix/support/target change> | <decision> |
