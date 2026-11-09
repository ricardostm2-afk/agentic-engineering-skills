# Build mode

Use for a closed UI brief or approved direction. A delegated writer reads this capsule directly;
do not load the whole design `SKILL.md`, questions or variants workflow. Follow `agentic-implement`
for tests, scope, commits and delivery; the caller has already settled product and approval gates.

## Load the minimum context

Read `references/mode-rules.md`; the brief's exact design-system sections, tokens/components and
chosen variant (`choice.md` and screenshots) or already approved baseline. Read
`references/ui-without-slop.md` §3 and §5, then only the §2 blocker relevant to a failed item or
detector line. Read §6/§7 for detector output and exceptions. For first-screen design without a
system, read §1/§2 as well before establishing reusable tokens.

Use `references/proof.md` §2–§5 for the requested states, widths, themes, affected interactions
and output status. A small correction uses `references/targeted-adjustment.md` instead of expanding
to the full new-screen matrix.

## Execute and return

Before writing, state the direction and components you will reuse in one sentence. Use existing
tokens/components; a missing token is a question or a stated deviation. Keep business logic out
of the visual layer. Rewrite disposable prototypes as production code, never promote their route.

At the end of each UI slice, obtain detector proof on the diff and compare actual running-app
screenshots with the approved reference at matching states, widths and themes. Reuse valid proof
under `mode-rules.md`; rerun affected checks after changes. Passing tests does not authorize an
unapproved visual difference. Exercise affected keyboard, focus and interactions in the browser.
Return diff/commit, detector command/output, screenshot paths and measured sample, interaction
results, exact proof state and limitations with the implementation handoff. Do not edit shared
`tasks.md`; return assigned task IDs and evidence to the orchestrator.
