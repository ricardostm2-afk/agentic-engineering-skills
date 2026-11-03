# Implementation by agents (step 5)

You orchestrate: split work, write briefs, launch agents, combine lanes, verify. Agents (Claude
subagents or Codex jobs with agentic-implement) implement in separate worktrees without collisions.

## 1. Split into lanes

1. List each tasks.md task's created/modified files (plan says which; otherwise confirm in code).
2. Tasks sharing a file share a lane. Dependent tasks follow prerequisites (same lane or sequential lane).
3. **Meeting files** (route index, database schema, component registry, translations, shared config)
   are the main conflict source. Assign one owning lane or prepare yourself in a pre-launch commit
   (“make change easy, then make easy change”): e.g. migration/types first for lanes to consume.
4. Parallel lanes meeting at an interface (route and calling screen): fix signature, request/
   response shape, errors before launch. Both briefs carry agreed interface neither changes alone.
5. Maximum ~3 parallel lanes per feature: integration ceiling, not machine capacity. More means
   feature slices (`references/too-big.md`). Capacity: choosing-the-agent.md §4 in agentic-implement.
6. One lane = vertical slice or coherent part, green independently.

Record grouping in `batch.md` from `assets/batch.template.md`: base, groups/owners (one per file),
meeting files/guards, order. Do not copy rules into batch.

Without subagents/jobs: execute lanes yourself with agentic-implement using §4 short form.

## 2. Prepare worktrees

One agent, worktree, branch. Two agents in one tree erase each other's work (one's git add/stash
captures the other's files).

```bash
BASE=$(git rev-parse HEAD)            # after preparation commit, if any
git worktree add ../<repo>-<feature>-<lane> -b agent/<id>-<topic> "$BASE"
```

- Follow project's branch/worktree conventions (`AGENTS.md`).
- New worktrees lack dependencies/generated artifacts: run project startup there (dependencies,
  shared-package builds, development environment file); confirm area tests run before agent handoff.
- Native subagent worktree isolation (e.g. launch isolation parameter) may replace manual creation;
  rest of protocol stays.

## 3. Write briefs

Copy/fill `assets/agent-brief.template.md` per lane. Brief is agent prompt for subagent and Codex
job, and its only context: it has not seen conversation, Reading or grill. Reread as that agent:
can I finish without questions? Which exact command proves done? Which files are forbidden?
Any “no” means brief is not closed.

If project launcher requires header (AGENTS.md/CLAUDE.md names launcher/contract), begin with it,
using lane values in that format.

Exclude personal data, secrets, conversation history, open options. Include closed decisions,
exact paths/commands, agreed interface, relevant approved Research rows (avoid repeated research
or rejected choices). UI lane: absolute agentic-design path and chosen variant.

## 4. Launch

- **Who/how**: choose level/model/effort/agent by
  `<agentic-implement>/references/choosing-the-agent.md` §1–§3; launch per §4: Claude subagent in
  lane worktree or Codex job through launcher, otherwise codex exec. Prompt is brief; load
  agentic-implement (Codex `$agentic-implement`). Prepended common launcher rules plus brief by
  pointer, as project AGENTS.md/CLAUDE.md specifies. Every lane/job uses launch script when
  available, with choosing-the-agent.md §4 checks; never bypass with direct launch.
- **No subagents/jobs, short form**: execute lanes yourself with agentic-implement, sequentially
  in one feature branch, without worktrees (one executor cannot collide with itself). Brief shrinks
  to 3-line checklist: agreed interface, forbidden files, proving command. Still perform §3's
  brief test: catches wrong names/examples before code. No formal report: proof goes in log and
  commit message. Also use when sandbox cannot create ../ worktrees/write .git and human has not
  approved Git commands (Codex workspace-write; SKILL.md “In other agents”).
- **Pilot**: over 3 similar lanes: launch one first; immediately review with 1 fresh-context
  reviewer using agentic-code-review. Found classes enter remaining briefs before launch. Final
  review still required.
- **Mechanical batch** (same transformation across files: rename, move, pattern replacement,
  design-system component adoption): one script, not N lanes. In order:
  1. manually transform one unit of each distinct shape; write **playbook** in batch.md:
     transformation, scripted/manual shapes, files, proving command;
  2. human approves playbook before batch (`decision add`, recommendation): rule, not each file;
  3. script reproduces manual unit byte-for-byte (empty git diff against it) before rest;
  4. one agent runs script, commit per class, green area tests after each;
  5. class review per `<agentic-code-review>/references/maintenance.md`, “Mechanical batch”.

  In sensitive zones (REVIEW.md; otherwise tenant, session, billing, personal data), playbook does
  not replace diff review: exclude these files from script or review at their level.
- Independent lanes parallel in one message, after pilot where applicable; dependent lanes only
  after predecessor combined/green (§6).
- Record each lane's board `start`.

**While they run**:

- Do not edit their worktrees. To change brief, stop agent, correct, relaunch.
- Monitor intervals ≥10 min. Wake orchestrator only for actionable event: end, blocked, decision.
  Batch news in one message.
- Read logs through one command returning at most 40 lines filtered for concrete question.
- At phase changes (spec committed, lanes launched, lanes combined), prepare compaction/new-session
  summary: base/SHAs, briefs, owners, state, decisions, blockers, next step. Compaction rules live
  in user/project CLAUDE.md. Model does not run /compact.

**Stop lanes** (human stop after Standard notice or wrong brief): use launching agent's stop tool
for subagent; launcher stop command (or codex exec process) for Codex. Worktrees/branches remain:
nothing entered trunk, nothing to undo; resume/discard later.

## 5. Receive

Each agent returns agentic-implement step 8 handoff plus brief's extra lines (deviations, new data/
readers, seen/not touched). Before combining:

- Confirm outputs yourself in worktree (run verification; do not trust report). “All green” without
  pasted output is unverified.
- Read scope decisions; correct spec contradictions before combining.
- Dead, expired or empty-return agent did not “find no problems”: unfinished; relaunch or do yourself.
- `blocked: <question>`: collect across lanes, answer as SKILL.md step 5 (decide reversible technical
  matters/relaunch; human matters in one message).

## 6. Combine lanes

Combine on short feature branch (or main if project works directly on trunk and permits it);
main integration is step 7. Lane by lane in dependency order:

```bash
git -C ../<worktree> rebase <feature-branch>      # bring lane above already combined work
git merge --ff-only agent/<id>-<topic>             # or project's required merge
<full-project-verification>                        # after EACH lane, not only at end
```

- Step 6 review applies to reviewed SHA. Later additions (rebase, resolved conflict, fix) follow
  `<agentic-code-review>/references/panel-and-rounds.md` §9: exception or new round, human at limit.
- Resolve conflicts yourself reading both sides/spec; never wholesale ours/theirs. Full verification again.
- Never force-push shared branch. Rewriting private agent branch before combining is acceptable.
- Red after combining: identify causing lane (git bisect if unclear), fix with reproducing test,
  then next lane.
- End: remove only worktrees/branches you created for feature (`git worktree remove`, `git branch -d`)
  after combining. Step 3 disposable prototype branch never integrates: stays through step 6,
  removed at delivery (step 3).
- Record every entering feature-branch `commit` on board.
