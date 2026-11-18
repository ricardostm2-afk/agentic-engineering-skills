# Measured claims: performance and other numbers

Read when the task's criterion or its report contains a number produced by a run: a speedup, a
regression, a latency, a throughput, a size, a cost, an evaluation score. A number is a claim about
the system, and most wrong ones measured something else. Correctness proof still follows step 3 and
`tests.md`; this reference only covers the number.

Domain detail stays where it lives and adds to these rules: test suites and CI in the
`agentic-ci-audit` skill's measurement reference, agent analysis pipelines in
`agentic-analysis-optimization`, saved proof with the rest of the task's proof (step 5 of
`agentic-implement`).

## Before running

- Write the sentence you expect to report, with its unit, workload and percentile (“export is 30%
  faster at p50 on the 60k-row dataset”), and the decision it feeds. The checks below test that
  sentence. If no result would change the decision, do not measure.
- Read the measuring script: what it times, counts and leaves out.
- Check what else the machine is doing. If it cannot be quiet, alternate the sides so both see the
  same interference, and report it.

## Where to look for the improvement

For a slow path, try in this order and stop at the first that meets the target. Earlier ones are
cheaper and remove more:

1. do not do the work (nothing uses the result);
2. do it once (reuse, with the lifetime and invalidation stated);
3. do less of it;
4. do it later, off the path the user waits on;
5. do it while nobody waits;
6. do it concurrently;
7. make the remaining work cheaper.

Ground each attempt in a profile or trace of the real path, not in reading the code. One change, one
measurement, keep or revert in full. Never stack unmeasured changes, and never keep one because it
“might help”.

## Seven checks on the number

Answer each from a run, not from a guess about the code.

1. **What limits it?** Ask why the result is not twice as good and name the resource or code path
   that bounds it, from a profile or counters taken in a run you do not report (profilers slow the
   work). Watch the load generator too: if it saturates first, you measured the generator. A change
   that did not move the number is explained by the limiter; find it before calling the change useless.
2. **Was each side run the way it ships?** Release build, production flags, the same data, versions,
   batching, pools and cache temperature. A side left on defaults compares configurations, not code.
   A limiter that is a setting (a debug build, a commit per row, a missing index) means that side is
   untuned: tune it and measure again before choosing.
3. **Is it physically possible?** Do the arithmetic against disk, network and core limits, and against
   the share of time the changed piece took. Removing something that takes 10% of a run cannot make
   it more than about 11% faster. A result beyond a limit measured a cache, a no-op or a defect.
4. **Did it fail?** Count errors and non-success results and check outputs are correct, not merely
   present. Rejections are fast; timeouts and retries are slow. If the script does not count
   failures, add the count.
5. **Does it repeat?** For a comparison, alternate the sides (A, B, A, B) for at least 5 runs each
   unless the domain reference or project sets another count, and report median and range. A gap
   smaller than the run-to-run spread is “no measurable difference”.
6. **Does it matter?** Next to a micro result, measure the path a user or caller waits on, with
   realistic size and concurrency, and state the micro result as a share of it.
7. **Did the work happen?** Confirm inside the timed region that the request arrived, the rows were
   written, the bytes were read and the result was used. Lazy values nobody consumes, discarded
   results and early exits produce fast numbers for work that never ran.

A quick ballpark the human asked for may be one run: still answer checks 4 and 7 and say it is one
run. A choice between options is never a ballpark.

## Sustained improvement of one metric

When the task is to keep improving one number toward a target, fix these before the first change:
the metric and which direction is better; a workload that reproduces the complaint (if none does,
fix the reproduction first); a stop rule pairing the target with a minimum number of attempts, so an
early lucky run cannot end the work; and one frozen command that prints the metric, its error count
and a count of work done. Prove the command can tell an easy workload from the hard one before
freezing it. Record the baseline and a green run of the tests that must keep passing.

Then loop: one hypothesis naming a mechanism, one change, measure before and after, accept only when
the number moves beyond noise and the tests stay green, otherwise revert. One commit per accepted
change; record rejected attempts too, in the task's existing log (the decision trail, when
`agentic-feature` keeps one for a long run). On a plateau, change category or
re-read the profile before concluding. Correctness and simplicity outrank the number. Do not relax
the stop rule to meet it; report where it stands.

## Report

- Lead with the verdict: faster, slower, no measurable difference, or inconclusive.
- Give the number with unit, run count, range and limiter: “p50 41 ms → 33 ms, median of 7 runs per
  side, range 32–35 ms after, bound by JSON parsing on one core”.
- The verdict is **inconclusive** when a difference is claimed without a named limiter, when a side
  ran untuned, or when checks 4 or 7 could not be answered. Name the gap.
- A commit or PR body carries one primary number; runs, range and limiter evidence go with the
  saved proof.

A reviewer treats a performance or score claim without run count, spread and a check that the work
happened as unproven, not as false: `<agentic-code-review>/references/panel-and-rounds.md` §7.
