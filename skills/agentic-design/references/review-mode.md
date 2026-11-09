# Review mode: UI lens

Receive the fixed base/reviewed SHA, selected UI mode, written intent, project design rules,
chosen variant or preserved baseline, and implementation screenshots. Read this capsule,
`references/mode-rules.md` and `references/ui-without-slop.md` §5, then only §2 blockers for failed
items and §6/§7 for exceptions/detector output. Do not load build or variants workflows.

1. Obtain detector proof for the review diff: `node <skill>/scripts/detect-slop.mjs --diff <base>`.
   Reuse only exact applicable evidence under `mode-rules.md`. Each blocker on a changed line is
   Important with detector proof. Exit 2 is red until unread files have manual review and the
   supported remainder passes; never call “0 files analysed” clean.
2. Apply §5 against the actual screenshots and affected scope. Use `references/proof.md` §2–§5
   for proportional evidence and honest status. A targeted correction compares its before/after
   screen; a new screen/redesign compares the chosen variant and agreed matrix. Missing evidence
   is unverified, not a claimed visual defect without a source line.
3. Give each demonstrated failure `file:line`, effect and the applicable blocker; use the caller's
   Important / Nit / Pre-existing labels and report format. Unagreed visual differences are findings.
   Keep untouched defects on one Pre-existing line; review each escape/Allowed reason.

The lens does not fix what it reviews or add a new visual direction. Code correctness belongs to
`agentic-code-review`. Return findings, detector output, checked screenshot sample and unread or
unexercised scope. Independent critique of variants uses `references/variants-mode.md`'s critique
contract; no extra review agent is required for this capsule itself.
