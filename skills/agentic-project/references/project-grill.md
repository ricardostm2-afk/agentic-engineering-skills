# Project interview (phase 2)

Goal: reach a shared, written understanding of the project before any architecture. Every
undecided question here gets silently decided by an agent during a feature, when it costs more.

## Protocol

1. **Investigate before asking.** Discover facts (repo contents, versions, services already in
   use) yourself through reading or subagents. Only **decisions** go to the human. Do not ask
   again about phase 1 decisions (`docs/decisions.md` or `docs/prerequisites.md`: user, payer,
   metric, data, region, costs); explore further only if a new answer challenges one.
2. **Decision tree.** Each decision opens others. Ask first about decisions independent of
   unanswered questions (the “frontier”); wait for answers before dependent questions.
3. **Each question's format:** short title; one or two context lines; 2–4 concrete options;
   your recommendation and why. Phrase it so “yes” accepts the recommendation. One round =
   the whole frontier (all questions ready to ask). With AskUserQuestion, split rounds into
   calls of up to 4 questions (tool limit); without it, up to 4 independent numbered questions
   in one message, each with options and recommendation first (dependent questions one at a
   time; the rest of the round in the next message).
4. **Challenge.** “Why?”, “What happens when…?”, “How do you know it worked?”, “Who loses if
   this does not exist?”. Flag answers contradicting another answer or the code immediately.
5. **Delegation.** “You choose” = apply your recommendation and mark the decision delegated.
   “Follow the recommendations” = the same for all pending questions in this phase.
6. **Record as you go.** Every answer goes straight into `docs/decisions.md` (format in
   `assets/decisions.template.md`); every resolved domain term into `GLOSSARY.md`. Do not save
   them for the end: a dropped session must not lose decisions.

**Adopt mode.** Before round 1, read existing repo rules (`AGENTS.md`, `CLAUDE.md`,
`CONTRIBUTING`, CI, hooks) and compare them with SKILL.md defaults (trunk-based, branches < 24 h,
push at session end, approval before irreversible actions…). Each conflicting rule becomes a
round 1 question with both options and your recommendation; until then, the repo rule applies.
Discovering such a conflict during a feature stops an agent's work.

With `mattpocock-skills:grilling` available, invoke it with phase 0 context and this dimension
bank. The rules fit together as follows: grilling provides frontier rounds and fact-finding
without human questions (subagents if available, otherwise read yourself); this protocol
provides question format, the limit of 4 per call and immediate recording. This protocol
prevails in doubt. With `mattpocock-skills:domain-modeling` available, invoke it for the glossary
and ADRs (its default `GLOSSARY.md` is also this project's file).

## Order and question bank

You need not ask every question; every dimension must be resolved, delegated or out of scope.
Parenthetical suggestions are typical recommendations, not answers.

1. **Problem and user.** Who has the problem, how often, how do they solve it today? Who is the
   main MVP user (only one)? What would bring them back the next day?
2. **MVP scope and exclusions.** What is the smallest end-to-end journey delivering value?
   Explicitly list what does NOT enter the MVP (as important as what does). Any deadline or
   event fixing the date?
3. **Data and domain.** Main entities and the user's words for them? What is stored, for how
   long, who sees what? Multi-tenant? How are tenants isolated (recommend: isolation checked
   in every query and tested)?
4. **Integrations.** Which external systems (payments, email, SMS, identity, billing, calendars,
   AI)? For each: required in MVP or later? What happens when it is down?
5. **Security and privacy.** Who authenticates, and how (recommend: managed provider or mature
   library, never homemade authentication)? Roles/permissions? Which actions require records?
   Personal data in logs, AI prompts or test environments (recommend: never)?
6. **Operations and costs.** Who gets called when it goes down? Backups: where, retention,
   restoration tested? Environments (local, staging, production)? Deployment: who approves,
   how often?
7. **UI/UX and brand.** Devices and resolutions? Target browsers and platforms (recommend:
   `baseline widely available`; also any WebViews or kiosk tablets and minimum OS version)?
   Existing brand (colors, font, logo)? Visual references the human likes and dislikes?
   Language(s) and writing tone? Minimum accessibility (recommend: WCAG 2.2 AA, keyboard
   navigation and AA contrast)? These targets feed phase 3's radar and every feature's
   research filter.
   Fixed rule, no question: UI work follows `agentic-design`
   (`<agentic-design>/references/ui-without-slop.md`) and runs its detector
   (`<agentic-design>/scripts/detect-slop.mjs`). With UI, phase 4 versions copies of both in
   `.agentic/` without asking (agents without the skill have the rules; pre-commit fails
   closed). Ask only about intentional brand exceptions (e.g. glass in the frame, a brand
   gradient): record a “UI exceptions” decision in `docs/decisions.md` with scope (where it
   applies and where it does not), turn it into `slop-ok: <reason>` in code, and link to it
   from `AGENTS.md` (phase 6).
8. **Success metrics.** What number proves the MVP worked? How is it measured without
   collecting unnecessary data?
9. **Risks.** What could kill the project (legal, technical, adoption)? Riskiest assumption,
   and how to test it sooner and cheaper?

## Stopping criterion

Stop when all 9 dimensions are resolved, delegated or marked “out of scope”; no open question
changes architecture choice; and the human confirms your decision summary (≤ 15 lines).

## Glossary (`GLOSSARY.md`)

Domain terms only, in user language, without implementation details. When the human uses two
words for one thing or one word for two things, propose a canonical term and record synonyms
to avoid. Format per term:

```markdown
**Order**: a customer-confirmed purchase with finalized items, price and address.
_Avoid_: request (a different domain concept: a request is not confirmed yet), booking.
```
