<!-- Fix agent brief (step 2 of agentic-fix). Remove inapplicable lines.
`human order:` carries the human's words only when they asked this fix to do orchestrator work;
otherwise “none”. In a Codex job, the same order goes through the launcher's mechanism, if it has
one that records the order and appends it to the prompt. -->

# Fix: {{short title}}

level: {{well-defined — decisions closed: <which> | complex — <unknown cause|design that only shows in the code|steps not enumerable|already failed>: <detail> | <level> — forced by the human: <their words>}}
worktree: {{path}} · branch: {{branch}} · area: {{area}}

human order: {{their exact words for orchestrator work (push, deploy, production), or “none”}}

Load `agentic-implement` and read `<absolute agentic-fix path>/references/writer-steps.md` only.
Do not preload `agentic-fix` or run its orchestrator steps. Visual correction: also read the exact
`<agentic-design>/references/targeted-adjustment.md` (absolute path) and required proof sections.

## The defect

- Symptom: {{what happens, with screen, route or command}}
- Expected: {{what should happen}}
- Report: {{the human's words, or link}}
- Cause: {{known: file:line | unknown}}

## Where to change

- Likely files: {{list}}
- Sensitive zone: {{yes: which | no}}
- Out of scope: {{what stays untouched}}
- Do what `human order:` requests only for this fix. Without an order, commits stay on the branch;
  push, deploy and production belong to the orchestrator.

## Success criterion

`{{command}}` goes green after being red on the base for the symptom above; area tests
(`{{area command}}`) remain green.

## Delivery

`agentic-implement` handoff (step 8), with root cause and class:
`N instances: file:line, …` or `only this one`.
