# Blast radius: what a change breaks somewhere else

For the correctness lens (`panel-and-rounds.md` §3) when the level is Complete, when a small diff
touches something many things depend on, or when the human asks “what could this break?” before
shipping. It adds no reviewer, round or call: the reviewer who owns correctness applies it inside the
same brief. Asked on its own outside a review, answer it read-only with the hand-back below; it is
not a review and does not replace one.

Listing callers is not the job; a search does that in a second. The job is the breakage a search
does not show, and proof instead of a convincing paragraph. A blast-radius writeup reads as plausible
whether or not it is true.

## The safety fact

Most changes that look risky are safe because of one or two facts: “this call only drops entries
that are already dead”, “no caller reads the field before the migration runs”. Find that fact and
spend the time there, not on a long list of maybes. If it holds, most risky cases clear at once; if
it does not, that is the finding.

## How far the proof got

For the safety fact and for each Important, say which rung the proof reached. Go as far down as is
cheap and stop there honestly:

1. **stated**: asserted, nothing read. Never enough, for a finding or for “safe”.
2. **read**: a real `file:line` in the reviewed tree, or in the dependency's own source at the
   pinned version.
3. **traced**: the path walked step by step from cause to effect (or to where it cannot reach).
4. **ran**: a script or test that calls the real code and fails loudly when the claim is wrong.
5. **reproduced**: seen in the running application.

Rung 4 is usually one short script importing the same library version the product ships and calling
the exact function in doubt. It runs only in a scratch folder the brief grants on the terms of
`panel-and-rounds.md` §2 (outside the review worktree, prepared dependencies, nothing installed),
and is returned unchanged like the acceptance test. Without that folder or its dependencies the
proof stops at **traced**, with the command that would reproduce it marked unrun and the blocker
named. That is a limit to report, not a pass.

In the report, the finding's `reproduce:` field starts with the rung: `ran: <command> → <output>`,
`traced: <file:line> → <file:line>`, `read: <file:line>`. §7's proof rule is unchanged: a code
finding still needs its effect and a reproduction; the rung says what kind, and `traced:` or `read:`
still gives the command that would reproduce it, unrun. An Important that stops
at **read** when a run was cheap says why it was not run.

## Where a search stops

- The dependency's source at the version in the lockfile, and any local patch to it.
- When things run: ordering, teardown and unmount, retries, timers, concurrent actors.
- What a symbol search misses: the JSON an API returns, a database column, a wire or file format,
  another language or service reading the same bytes, a feature flag, a consumer three hops away.
- Deletions keep the three proofs of §3 (history, indirect uses, live configuration).

A search that finds nothing is an answer; record the command. Never invent a caller or an API.

## Hand back

Inside a review, findings use the normal report lines and the safety fact goes on its own report
line: `Safe because: <fact> — <rung and proof>`, or `Safe because: unproven — <what is missing>`.
`0 Important` on a Complete change with the fact unproven is reported as such; it is not upgraded
to “safe”.

Asked on its own:

- **What it does**, including the part the diff does not spell out.
- **Safe because**: the fact, its rung and the proof, or `unproven`.
- **Risks**: how each breaks, `file:line`, likelihood, cost, and how to check.
- **Cleared**: what was checked and why it is fine.
- **Before integrating**: the cheapest test or script that would catch the real defect.

Ideas from the `blast-radius` and `interrogate` skills of `cursor/plugins` pstack (MIT, revision
`93b916d4a`), in our own words.
