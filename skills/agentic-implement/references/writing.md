# Writing for the person who reads the work

Read when you write prose a person will read to understand or decide: a final message, a PR or
commit body, a review report's free text, a spec summary, documentation, a brief for another agent.
Text shown to the product's end user follows “Product text” in `preferences.md` and the project's
design rules instead.

These are the writer's habits. They apply in the language you are answering in, and they never
override a format a template or the project defines: status lines, report lines, commit trailers
and their separators stay exactly as specified. A reviewer does not raise them as findings; prose
is a finding only when it is false, contradicts the code or hides a limit.

## Say the thing

- Lead with the result or the request, then what it depends on. No preamble about what you are
  about to say, no closing offer or summary of what was just said.
- Name the mechanism or the number. “Search was slow because the query had no index” beats “a
  performance issue was addressed”. Cut any sentence that could sit unchanged in another project's
  report.
- One name per thing, repeated. Do not rotate synonyms for the same module, branch or concept, and
  call things by the names the reader already uses, not labels invented during the work.
- Name the source or drop the claim: no “it is generally recommended”, no unsourced statistics.
- State a limit once, plainly, where it applies. One hedge, not three. “Not run”, “unknown” and
  “unproven” are complete answers.
- Whole sentences, with their verbs and articles. No arrows, shorthand or private abbreviations in
  text meant for a person, except where a template defines them.
- Plain verbs: “use”, “is”, “has”. No inflated vocabulary, no praise, no enthusiasm, no decorative
  emphasis or emoji. Do not force points into threes, and do not write “not just X but Y” when
  stating Y is enough.
- Leave out hashes, paths and command lines unless the reader needs them to act or verify. Then
  give the exact one.

## Shape by what the reader will do

- **Deciding:** the options actually weighed, what each gains and costs, your recommendation, and
  what cannot be undone. The reply alone is enough to decide.
- **Verifying:** the command or steps, the expected result, and what the proof does not cover.
- **Resuming later:** state, next step, blockers, pointers to evidence.
- **Learning how something works:** explanation and reference are different documents. Instructions
  are numbered steps with one action each, in the order performed, each with its visible result.
  Reference is complete and uniform. Explanation gives the reason and the alternatives rejected.
  Do not mix them in one section.

A PR or integration description is a one-minute briefing: why, what changed, what is out of scope,
what it can break and for whom, how it was verified. The project's template and the required
fields of `<agentic-code-review>/references/panel-and-rounds.md` §10 decide the headings.

## Before sending

Reread as the person who was not there: can they act on this without opening another file? Is every
claim backed by something they can check? Remove what repeats, and what only shows effort.

Ideas from the `unslop`, `technical-writing` and `ketchup` skills of `cursor/plugins` pstack (MIT,
revision `93b916d4a`), reduced to rules that hold in any language; see `origin.md`.
