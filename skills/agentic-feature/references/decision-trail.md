# Decision trail for long or unattended work

Read when the work will outlive one sitting: several lanes, a run the human reviews after stepping
away, a session that will be compacted or resumed by another agent, or a loop of attempts against
one metric. A short task or one direct lane does not keep a trail: the commit message and final
message are its record.

The trail answers the question a returning human or a replacement agent asks: what was decided,
why, and what proves it. It is the “existing work log” other steps refer to when the project has no
board and no log of its own. Where the project has an adopted board or log format, use that and
carry the same fields; do not keep two.

## Format

One tab-separated file, one row per decision, cells on a single line:

| Column | Holds |
|---|---|
| `ts` | ISO 8601 time |
| `phase` | step, lane or attempt id |
| `decision` | what was chosen or done, one line |
| `why` | the reason in plain words; for a call made on the human's behalf, also what it costs if wrong |
| `evidence` | a pointer that resolves: full commit SHA, `file:line`, saved output or screenshot path. Never prose |
| `result` | the outcome or current state: `tests green`, `reverted`, `no measurable difference`, `open` |

```
ts	phase	decision	why	evidence	result
2026-11-18T09:02:00Z	lanes	one lane owns the schema file	two lanes needed the same migration	batch.md	prepared in commit 3a9f1c2e…
2026-11-18T11:15:00Z	lane-api	discarded the retry wrapper	the timeout came from an unindexed query, not the network	out/explain-before.txt	reverted; index added in 7c21e0a4…
```

No secrets or personal data in any cell; point at a safe artifact instead. A cell that starts with
`=`, `+`, `-` or `@` gets a leading apostrophe, so a spreadsheet does not run it.

## What earns a row

Decision points and checkpoints, not every action: a fork chosen, an interpretation taken where the
brief allowed two, a lane or unit completed with its verification result, an attempt kept or
reverted, a pivot with its trigger, a blocker raised, a brief corrected. In a loop, one row per
iteration, including rejected ones. Skip the self-evident.

## Rules

- **Append only.** A wrong call gets a new row that supersedes it; history is not edited or deleted.
- **The orchestrator owns the file.** Lanes return their decisions in the handoff and the
  orchestrator appends them with the lane's SHA, the same way it alone reconciles `tasks.md`.
- **A new session starts with a `start` row** naming who continues and the last row it inherited.
  The trail is input, not proof: a resumed session verifies inherited claims against the real state
  (the commits, the saved outputs, a rerun where an input changed) before building on them, and
  does not redo work whose evidence still matches. After a compaction, trust the trail and `git log` over your
  recollection of what was done.
- **Where it lives.** Outside the tree by default (`decisions.tsv` beside the plan or in the
  feature's scratch folder), uncommitted. Commit it only when the project asks or a reviewer needs
  the trail to trust the result.
- A compaction or pause summary (`implementation.md` §4) points at the trail instead of repeating it.

## Before handing back

Walk this run's rows once against what happened: every row maps to a real decision, every evidence
pointer resolves and shows what the row claims, and a fork or abandoned approach that shaped the
work but is missing gets its row. Correct by appending, never by rewriting.

In the final message's fixed shape (`review-and-delivery.md`, “Delivery”), `Proof:` names the
trail's path and `Not covered by proof:` carries up to five rows the human should look at first:
decisions with weak evidence, verification claimed without saved output, choices that widened
scope or covered a symptom, and calls made on the human's behalf that cost most if wrong.
“Nothing to flag” is a valid answer. This is the author's own audit; it does not count as review
and does not replace the level `agentic-code-review` requires.

Ideas from the `show-me-your-work` skill and the pause and pickup playbooks of `cursor/plugins`
pstack (MIT, revision `93b916d4a`), in our own words. The cost of a wrong call in `why`, and the
trail outranking memory after a compaction, adapt the plan-execution skills of `obra/superpowers`
(MIT, revision `22f0b463`).
