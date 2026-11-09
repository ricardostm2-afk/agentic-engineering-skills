# Fix writer: steps 3–5

This is the delegated writer's complete fix-specific procedure. Read it with the closed brief,
project rules and `agentic-implement`; do not load the fix orchestrator's planning, launch, review
or integration steps. Paths beginning `references/` here are relative to the fix skill folder.
The brief fixes symptom, expected behavior, allowed scope and success criterion. Return material
ambiguity or out-of-scope work to the orchestrator; do not question the human or launch a panel.

## Step 3: reproduce (agent)

Build a **red** loop before reading code to theorize: a command following the defect's real path
and failing with the reported symptom. In preference order:

1. test at the entry point reaching the defect (unit, integration or end-to-end);
2. HTTP script against the development server;
3. command with a fixture, comparing output against a good reference;
4. headless browser driving the interface and checking DOM, console or network;
5. a real captured trace (request, payload, log), replayed in isolation;
6. a minimal harness calling the defect's path.

For a visual defect, proof is a screenshot showing the defect plus a test catching it when
available; how much to capture before and after: `<agentic-design>/references/proof.md` §2.

Tighten the loop until it is **tight**: seconds rather than minutes, deterministic (fixed time,
seed and network), asserting the exact symptom rather than “did not crash”. For an intermittent
defect, raise the reproduction rate (repeat, parallelize, narrow windows) until debuggable.

No possible loop: return `blocked: <what is missing>`, with what you tried and what you request
(environment access, a captured artifact without secrets, or temporary instrumentation).

Done when there is **one** command, already run with output shown without secrets, that goes red
for this defect and only this defect.

## Step 4: cause and class (agent)

- **Known cause** (red points to the line): proceed to the class.
- **Unknown cause**: follow `references/diagnosis.md` in the fix skill (minimize, falsifiable hypotheses, instrument
  one at a time, evidence from Git, PRs and logs).

Then search the **class**: other instances of the same defect (same pattern in other files) and
indirect uses of what you will change (callers, enums, constants, wrappers, runtime-built names,
other services). Every instance enters the fix; every indirect use enters verification. In an
interface report, the class stays within the screen named in the brief; other screens go in
Seen, not touched for the orchestrator.

A defect that returned after a fix, or whose class spreads across many places, is **structural**:
the root cause is the producing mechanism (data model, contract, component, generator); another
symptom adjustment (another forbidden rule, parameter, more prompt text) does not count as a fix.

Done when you write the root cause in one sentence and the class in one line: `N instances:
file:line, …`, or `only this one`, with the search command proving it.

## Step 5: fix and turn green (agent)

Follow steps 3 to 8 of `agentic-implement`, with fix-specific requirements. Reuse applicable red
and green proof under `<agentic-implement>/references/evidence.md`; a handoff alone does not require rerunning it:

- The red test is step 3's, at the entry point catching the real pattern. If the only possible
  test is too shallow to catch it, record it in the handoff: architecture prevents pinning the defect.
- The smallest change fixes every class instance and nothing else.
- **Safeguards** (killswitch, flag marked permanent, mitigation path, security guard): if the fix
  touches one, stop before changing it and ask. In a subagent or job, return
  `status: blocked: <the question>` to the orchestrator, who takes it to the human.
- Green: the new test, step 3's loop against the original scenario (not only the minimized one),
  and area tests.
- Cleanup: remove temporary instrumentation (marked with a unique prefix, removed with a grep)
  and disposable prototypes.
- The commit body carries root cause and `Tested:` (commands and result); risk and undo go in
  the integration commit (step 7).

Done when the agent returns `done` with the commit, red then green, and the class addressed;
or `blocked` or `spec-conflict` with the reason.

