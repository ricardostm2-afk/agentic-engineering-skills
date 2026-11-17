# Project `verify` skill: run the change, not only its tests

Adapted from https://claude.dev/blog/how-the-claude-code-team-thinks-about-verification/
(2026-11-16), summarized in our own words. That team found that running the app end to end
matters more than tests. Tests are still needed, but a passing suite does not show that the
feature works for a user. A project `verify` skill gives an agent hands and eyes on the running
system. It holds one repeatable way to boot the app, drive it like a QA engineer and inspect the
result.

## When to create it

- The repo ships something a user or another system drives: a web or mobile app, a desktop app,
  a CLI or an HTTP/queue service. A library with no runnable surface does not need one. Its seam
  tests are its proof.
- Create it in phase 6. In adopt mode, propose it as a diff. Never overwrite an existing `verify` skill.
- Put it at `.claude/skills/verify/SKILL.md`, and also at `.agents/skills/verify/SKILL.md` when
  another host reads that folder. Write it from `assets/verify-skill.template.md`. Link it from
  `AGENTS.md` (Commands → “User-visible change: run the `verify` skill”) only once it runs green.

## What it contains

1. **Boot.** Exact commands to start the app with synthetic data, and the readiness signal to wait
   for (a health URL, a log line, a port). Never a fixed sleep.
2. **Drive.** The tool for this surface. A browser goes through Playwright, CDP or the host's
   browser tool. Mobile goes through a simulator or emulator MCP. Desktop goes through computer
   use. A backend goes through an API harness (`curl`, a small script) or the queue's CLI. Name the
   tool and how to install it.
3. **Feature map.** One row per user-facing feature: entry path or command, the steps, stable
   selectors or requests, and the expected observable result. This is the rubric. A finding is a
   row whose result differs.
4. **Inspect.** What to collect for each failed step: a screenshot, the DOM or response body,
   console and server logs, and the network trace. A failure report names the step, what was
   expected, what was seen, and the path to the evidence. “Timeout after 30s” on its own is not
   a report.
5. **Teardown.** Stop every process it started, including after a failure midway.

## Keep it fast and reliable

It is the smoke-test harness that every user-visible change passes through, so treat it as code:

- Target under ~2 minutes for the whole map on a laptop. Add a `--only <feature>` path so a change
  runs only the rows it touches.
- Stress it before adoption: run it 3 times in a row on a clean tree. All 3 runs pass and leave no
  orphan processes. A flaky step is fixed or removed under `<agentic-implement>/references/tests.md`
  “Flaky tests”, never retried until it passes.
- Prove that it can fail. Break one feature-map row (a selector, a status code), see red, and
  restore.
- Prune rows for features that no longer exist, in the same change that removes the feature.

## How the other skills use it

- `agentic-implement` and `agentic-fix` writers run the affected rows before committing a
  user-visible change, and record the result as proof in the handoff.
- `agentic-code-review` uses a red or missing `verify` run on a user-visible change as evidence. It
  does not replace a lens.
- The commit's `Verified:` trailer names `verify` when the skill ran (`git-environment.md`, “Commit
  rules”).
