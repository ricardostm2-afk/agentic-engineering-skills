# Diagnosing an unknown cause

For step 4 of `agentic-fix`, when step 3's red does not point to the line. Enter only with the red
loop already running: reading code to theorize without it is the error this method prevents.

## Secrets

You show commands, outputs and captured artifacts: replace every secret with `<REDACTED>` before
showing them. The loop reads credentials from environment variables. From an artifact with
authentication headers, quote only the lines carrying the signal.

## 1. Minimize

Cut inputs, callers, configuration, data and steps **one at a time**, rerunning the loop after each
cut. Keep only what red requires.

Done when every remaining element is necessary: removing any one turns the loop green.

## 2. Evidence

Before theorizing, gather what the system already knows about the defect:

- `git log -S '<symbol>'` and `git log -p -- <file>`: when behavior changed and why;
- `git blame` on the path's lines: the commit and message introducing them;
- PRs and issues linked to those commits;
- logs and errors from the environment showing the defect, without personal data.

## 3. Hypotheses

Write **3 to 5 ordered hypotheses** before testing any. Each is **falsifiable**:
`If the cause is <X>, changing <Y> makes the defect disappear` (or `changing <Z> worsens it`).
A hypothesis without a prediction is a guess: sharpen it or discard it.

When red comes from an existing test or spec (rather than step 3's loop), the list always includes
hypotheses that the spec or test is wrong rather than the code: the “Code, spec or test” triage
in step 5 of `<agentic-implement>/SKILL.md`.

With the human nearby, show the ordered list: they often reorder it in a second. Without them,
follow your order.

## 4. Instrument

Each probe tests one hypothesis's prediction; change **one variable at a time**. In order:
debugger or REPL; logs targeted at boundaries separating hypotheses. Every temporary log carries
a unique prefix (`[DEBUG-a4f2]`) so all can be removed with a grep at the end.

Performance regression: first a baseline measurement (timing harness, profiler, query plan),
then bisection. Measure before fixing.

Defect appearing between two known states (commits, versions, data): automate “start in state X,
check” and use `git bisect run`.

## 5. Close

Done when:

- a confirmed hypothesis explains the exact reported symptom (not a neighboring defect);
- the root cause fits one sentence, which goes in the commit body;
- the confirming probe repeats with the same result.

Then proceed to the class in step 4 of `agentic-fix`.
