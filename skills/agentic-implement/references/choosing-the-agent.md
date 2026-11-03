# Choosing the agent that writes the code

For the orchestrator: step 2 of `agentic-fix` and step 5 of `agentic-feature` launch the code writer
and choose here, in order, the **level**, **model and effort**, and **agent** (Claude or Codex).
For a short task (§1), the orchestrator writes the code. The reviewer's model is different and comes
from the panel (`<agentic-code-review>/references/panel-and-rounds.md` §3).

This page's level is the agent's, from the brief's `level:` line. It is neither the review level
nor the feature track: the three scales and their mappings are in
`<agentic-code-review>/references/risk-levels.md`, “Three scales”.

The user's model rules (global or repo `CLAUDE.md` or `AGENTS.md`) override this page.

## 1. The level

Level measures what the agent still needs to decide or discover that the brief does not say.
Turning the request into closed tasks is the orchestrator's work; the human request need not carry
every detail. Before calling a task complex, close what you can: read more, decide the contract,
schema, invariants, edge cases and red test, or split it into sequential steps.

Then ask the four questions in order and stop at the first that leads to **complex**:

<!-- card:level-1 -->
1. **Unknown cause?** A defect whose cause is still unknown, or a race to diagnose. Yes: complex.
2. **Design that only shows in the code?** The contract, schema or module can only be decided
   through an experiment in the code. Yes: complex.
3. **Steps not enumerable?** A refactor so coupled that the brief cannot list the steps.
   Yes: complex.
4. **Already failed?** An agent failed this task once at the well-defined level. Yes: complex,
   and the new brief carries the premise the agent returned (step 5 of `agentic-implement`).

Passed all four: **well-defined**. New design, delicate logic (money, concurrency, access rules)
or multiple areas do not make the task complex when the brief has already decided them. Examples:
a label; rounding; a lane with a spec and tasks; fixing an Important the orchestrator reproduced
and wrote a rule for.
<!-- /card:level-1 -->

A well-defined task is **short** when it fits one lane, with 1 code file and its test, up to
~50 changed lines, outside sensitive zones (tenant, session, billing, personal data and those in
the repo's `REVIEW.md`) and outside hooks, CI and installers. The orchestrator handles short tasks
with `agentic-implement`, without a brief or agent: writing the brief and having another agent
reread the same files costs more than the change, and a summary loses what the orchestrator already
read. Sections 2 to 4 do not apply. Review still belongs to a subagent with fresh context: the writer
does not review. If the change exceeds these limits midway, stop and launch an agent at its actual level.

- The human may force the level.
<!-- card:level-2 -->
- A sensitive zone (tenant, session, billing, personal data) does not raise the level: the brief
  carries invariants and refusal tests, and the zone affects the review level (`agentic-code-review`).
<!-- /card:level-2 -->

<!-- card:level-3 -->
Write the brief's `level:` line with these labels; the launch guard reads it:

- `level: well-defined — decisions closed: <which>`;
- `level: complex — <label>: <detail>`, using one of the four questions as the label, lowercase
  without “?”: `unknown cause`, `design that only shows in the code`, `steps not enumerable`,
  `already failed`;
- the human forced the level: `level: <level> — forced by the human: <their words>`.
<!-- /card:level-3 -->

Examples: `level: well-defined — decisions closed: contract, 4 rules, red tests`;
`level: complex — unknown cause: the total diverges only in production`. A short task has no brief:
tell the human in one line `level: short — <why>`.

Done when the brief has a `level:` line (for a short task, when you told the human) stating the
closed decisions or what remains to discover.

## 2. Model and effort

The project chooses its models and efforts, and the user's rule always wins. Without one, for example:

<!-- card:model -->
| Level | Claude | Codex |
|---|---|---|
| well-defined | Sonnet 5.5, effort xhigh | gpt-6.1-sol, effort medium |
| complex | Opus 5.5, effort xhigh | gpt-6.1-sol, effort max |
<!-- /card:model -->

These are example model names; the project picks its own. Names age quickly: replace them with
what your provider offers today. The table fixes the ordering: a complex task gets more capability
or effort than a well-defined one.

Done when the agent launch names model and effort.

## 3. Claude or Codex

Use the orchestrator's agent. The other is involved only on an explicit human request for that work
(a lane, fix, review or verifier), valid only for that work.

- Low headroom at the orchestrator's provider (less than 20% in the week or 5 h window) does not
  change the agent: tell the human the remaining headroom and ask whether they want the other for this work.
- Work only the other can do (because of tool, access or environment) also requires asking the
  human before launching it.

Tell the human in one line: `agent: <Claude|Codex> — <why>`.

Done when the line has been said.

## 4. Launch

If `AGENTS.md` or `CLAUDE.md` names a launch script, every lane and job goes through it. Before
launching, the script measures the machine and checks owners, scope, guards on shared meeting files
and a closed brief. Concurrency comes from that measurement, not a fixed number.

For Claude subagents, launch the definitions in `assets/agents/` rather than `general-purpose`:
they have a closed tool list and start with less context. Adapt them to project rules and install
them in its agents folder (`install.sh --agents`, or copy files without overwriting existing ones):

- `assets/agents/implementer.md`: a lane's code and tests.
- `assets/agents/implementer-ui.md`: a UI lane; also preloads `agentic-design`.
- `assets/agents/researcher.md`: research by axis, inventory or read-only diagnosis;
  receives question, limits and return format from the calling skill.
- `assets/agents/reviewer.md`: read-only review with fresh context; the brief comes from `agentic-code-review`.

The project chooses model and effort; for implementation follow §2.
`assets/agents/claude-md-excerpt.md` is the model-per-task rule to paste into `CLAUDE.md`, and
`assets/agents/README.md` explains changing each agent's model and effort. Check installed skill
names: preloading includes only `SKILL.md`, not references. Without a script:

- **Claude**: subagent with section 2's model and effort, in the lane's or fix's worktree.
- **Codex**: use the job launcher named by the project's `AGENTS.md` or `CLAUDE.md`, with a model
  and effort it accepts; without a launcher,
  `codex exec -m <model> -c model_reasoning_effort="<effort>" -C <worktree> - < <brief>`. The job
  commits only with writable `.git`: session approval for Git commands, or unrestricted sandbox,
  only with human OK. If Codex, its launcher or the sandbox cannot meet the brief, state `blocked:`
  and ask for an explicit decision: a sequential route from the same provider or a different
  provider. Never switch to Claude automatically; record the decision on the `agent:` line.

**Job without subagents** (launcher disables Codex multiagents, or the agent lacks that tool): the
brief says to load `agentic-implement` and, from another skill, only the writer's steps (3 to 5 of
`agentic-fix`, the vocabulary of `agentic-architecture`); never run an orchestrator skill in full
(`agentic-feature`, the `agentic-code-review` panel). Lanes, panels and verifiers require subagents
the job does not have, and the plan is already decided in the brief. A review assigned to a job
follows “In other agents” in `<agentic-code-review>/SKILL.md`.

Done when the chosen agent has started with brief, model and effort.
