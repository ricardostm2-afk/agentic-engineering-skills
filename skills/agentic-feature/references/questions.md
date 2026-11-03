# Feature grill (step 2, checkpoint 1)

Goal is not collecting requirements: make human decide what only they can, with your best proposal
in front, until no decisions remain open.

## Method

If `mattpocock-skills:grilling` exists invoke with Reading context. Use only its decision tree and
frontier (1/2 below). Ignore other formatting: recommendation precedes question, no emojis, maximum
4 questions at a time (not whole frontier), checkpoint closes without understanding confirmation
(point 7/“Closing”), because decisions return in step 4 spec summary. Otherwise:

1. **Decision tree.** Each decision opens dependents. **Frontier** is decisions whose prerequisites
   are resolved: only these may be asked now.
2. **Facts are yours, decisions theirs.** Answers in code, docs, data, Reading: look (or delegate)
   instead of asking. Ask only choices: priority, tradeoff, desired behavior, acceptable risk.
3. **Question format**: decision title; 1–2-line context citing Reading fact; 2–4 concrete mutually
   exclusive options; **recommendation** first with why. Make “yes” accept recommendation.
4. **Delivery**: up to 4 independent questions at a time; sequential if one answer changes another.
   With AskUserQuestion, one call; otherwise one chat message with numbered independent questions
   (up to 4), each with options/recommendation first.
5. **Challenge.** Before accepting a weak answer ask a follow-up: “why?”, “what happens when…?”
   with concrete case, “how do you know it worked?”. At most one per answer; no interrogation.
6. **“Choose for me” / “follow recommendations”** closes all pending: apply recommendations,
   record each as delegated decision (board/spec), continue.
7. **Stop** when frontier empty: all dimensions below decided or explicitly out of scope. Volume
   reference for whole checkpoint 1 (including frontend block and up to 2 research questions,
   with browser targets counting): Standard 4–8 questions, Complete up to ~12. Over 15 likely
   means Too big: return to triage.

Record every decision immediately (board: `decision`; spec: decisions section), origin human,
delegated, or your default.

An agentic-architecture handoff already has design decisions from its grill (interface, seam,
tests, each origin): prefill table with those; ask only what design left open.

## Question bank

Do not ask everything. Select unresolved Reading questions, adapt to domain with actual code and
glossary names. Recommendation column is what must be prepared first; without it question is not ready.

### Problem and beneficiary

| Question | Recommendation to bring |
|---|---|
| What task/decision can user do afterward that they cannot today? | Proposed sentence with actual role (“order manager can…”). |
| How do they solve this today without feature? | Found workaround (manual export, spreadsheet, support request), time cost. If good, recommend not building. |
| If only half could ship, which half? | Minimum valuable vertical slice, what stays for second. |
| Who is worse off? | Who loses step, screen or habit, mitigation. |

### Behavior and edge cases

Invent concrete domain scenarios; do not ask “what about edge cases?”.

| Question | Recommendation to bring |
|---|---|
| What happens with <zero / one / many> <entity>? | Each behavior, realistic “many” measured from data/fixtures. |
| Two users perform <action> simultaneously on same <record>? | Last write wins, conflict refusal, queue; recommend by lost-write cost. |
| Midway: window closes, network lost, double-click? | What persists/how to resume; idempotency for sending/money. |
| Dates/times: whose timezone defines today, midnight, daylight saving? | User/organization timezone consistent with code (`path`). |
| Can it be undone? | Undo preferred, otherwise confirmation; permanent deletion needs reason. |

### Data

| Question | Recommendation to bring |
|---|---|
| Each new value: who reads it and why? | Concrete consumer (screen, report, rule). None: do not collect even if “useful someday” (Reading Cut suggestion). |
| Retention and account/organization deletion? | Existing policy for similar data (`path`), or applicable law for personal data. |
| Who sees it? Exports, logs, emails? | Minimum locations, masking requirements. |
| Existing data: backfill, empty, new records only? | Least migration serving case, affected record count. |
| Source of truth or copy? | If copy, source/synchronization; prefer reading source. |

### Permissions

| Question | Recommendation to bring |
|---|---|
| Who can act and see result? | Reuse existing role/rule (`path`) rather than create. |
| Unauthorized user sees nothing, disabled reason, error? | Consistent neighbors; server refusal uses same rule as screen. |
| Risk of another customer's/organization's data? | Existing isolation enforcement and proving test. |

### Errors and failures

| Question | Recommendation to bring |
|---|---|
| <External dependency> fails/takes 30s: user sees what, what persists? | Timeout, retry, visible intermediate state; never success without effect. |
| What errors can user fix, which message? | Proposed user-language message, no internal codes. |
| How do operations know failure? | Existing log/alert, no personal data. |

### Performance and scale

| Question | Recommendation to bring |
|---|---|
| Records for largest customer today/in a year? | Measured count (development database, fixtures, or explicit estimate and calculation). |
| Acceptable response time? | Concrete target (<300ms for 1000 rows), measurement method. |

### Migration and compatibility

| Question | Recommendation to bring |
|---|---|
| Who uses what changes (API clients, screens, integrations, exports)? | Code-derived list; expand then contract for external consumers. |
| Everyone at once or flag? | Flag only for real risk/gradual rollout; otherwise direct. Flag starts with human/team only. |

### Success

| Question | Recommendation to bring |
|---|---|
| In 2 weeks, how know it worked? | Existing measurable observation (count, event, time) or question to specific user. |
| Which passing acceptance test reassures you? | End-to-end user-language scenario with distinguishing data. |

### Out of scope

| Question | Recommendation to bring |
|---|---|
| What deliberately stays out? | 2–3 concrete Reading cuts, each reason. |

### Challenge follow-ups

- “Why this now rather than <Reading alternative>?”
- “What happens if we do nothing?”
- “Simpler way to solve 80%?” (bring that way yourself)
- “How often per week is ‘sometimes’?”
- “Who asked, what exactly did they say?”

## Closing checkpoint 1

Show short decision table (decision · choice · origin), move on without extra confirmation:
decisions return in step 4 spec summary (Complete gate, Standard notice).
