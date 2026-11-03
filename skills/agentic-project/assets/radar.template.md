# Technology radar: <project name>

<!--
Rules (remove comments when filling this in):
- The radar is not a rule: AGENTS.md, the constitution and ADRs take precedence in a conflict.
- Read at agentic-feature step 1b (research), write at delivery before the final commit.
- One line per entry, with a primary source (URL) and the last verification date. Versions and
  support status require a source, never memory.
- Refresh entries older than ~6 months at step 1b when a feature touches them.
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

| Ring | Entry | Area | Why (one line) | Source | Verified on | Decided by |
|---|---|---|---|---|---|---|
| Adopt | <e.g. framework X 1.2> | stack | <chosen in architecture: …> | <URL> | <date> | <human \| delegated, ADR-0001> |
| Adopt | <e.g. test runner Y 3.1> | tests | <phase 3 technical choice: …> | <URL> | <date> | <agent, D-NNN (phase 3)> |
| Trial | <e.g. `<dialog>` + invoker commands on screen Y> | frontend | <one fewer dependency; measure …> | <URL> | <date> | <human, feature NNN grill> |
| Assess | <…> | <…> | <trigger: “when Baseline Newly” / “when upgrading to vN”> | <URL> | <date> | <agent, feature NNN> |
| Avoid | <…> | <…> | <e.g. experimental, one browser only> | <URL> | <date> | <agent, feature NNN> |
