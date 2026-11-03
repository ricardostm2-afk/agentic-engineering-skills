# Authoring recipes — an open repertoire

Choose the representation from the question. These fragments pass the static packager and
consume the common theme. They are not a `type` catalogue or required sections. Keep labels
near relationships, a text equivalent and a task that uses the mechanism. For larger diagrams,
segment or recompose; do not shrink text to fit. Check 375/1366 px and light/dark.

## Flowchart: which condition selects the outcome?

Write the condition as a question and label both branches. Distinguish “yes” from the condition
that the protocol evaluates as true: the first lesson illustrates this difference. Ask for a
prediction with an input taking the other branch; feedback explains the condition, not just the exit.

```html
<figure>
<svg viewBox="0 0 330 230" role="img" aria-label="If the structure is valid, write; otherwise, reject.">
<defs><marker id="flow-tip" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"></path></marker></defs>
<polygon points="165,8 285,62 165,116 45,62"></polygon><text x="165" y="66" text-anchor="middle">Valid structure?</text>
<path d="M45 62H20V174H65" marker-end="url(#flow-tip)"></path><text x="24" y="148">No</text>
<path d="M285 62H310V174H245" marker-end="url(#flow-tip)"></path><text x="274" y="148">Yes</text>
<rect x="65" y="150" width="90" height="48"></rect><text x="110" y="180" text-anchor="middle">Reject</text>
<rect x="165" y="150" width="80" height="48"></rect><text x="205" y="180" text-anchor="middle">Write</text>
</svg>
<figcaption>Validity selects the branch; write order requires proof in the program.</figcaption>
</figure>
```

## Sequence: who does what, in what order?

Stable participants; time goes top to bottom; arrows carry verbs. If waiting, return or
asynchrony matter, distinguish them with text and line style, not just color. Do not invent messages
between tools called by the agent. Ask for the missing step and why it belongs there.

```html
<figure>
<svg viewBox="0 0 330 220" role="img" aria-label="The agent requests validation; the tool returns the result; the agent checks it.">
<defs><marker id="seq-tip" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"></path></marker></defs>
<text x="55" y="25" text-anchor="middle">Agent</text><text x="270" y="25" text-anchor="middle">Tool</text>
<line x1="55" y1="40" x2="55" y2="205"></line><line x1="270" y1="40" x2="270" y2="205"></line>
<text x="165" y="65" text-anchor="middle">Validate</text><path d="M55 80H270" marker-end="url(#seq-tip)"></path>
<text x="165" y="115" text-anchor="middle">Return result</text><path d="M270 130H55" marker-end="url(#seq-tip)"></path>
<text x="165" y="180" text-anchor="middle">The agent checks</text>
</svg>
<figcaption>Action and result; the tool does not approve delivery.</figcaption>
</figure>
```

## States: which event is allowed now?

Name states, event and guard. Use the real topology, not a ring for convenience. In a synthetic
example, state the local rule before using it: it is not a universal document rule. Ask for
an event rejected from the same state and explain the guard preventing the transition.

```html
<figure>
<svg viewBox="0 0 330 250" role="img" aria-label="Draft becomes ready on submission only if all required fields are complete.">
<defs><marker id="state-tip" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z"></path></marker></defs>
<rect x="50" y="8" width="230" height="48"></rect><text x="165" y="38" text-anchor="middle">Draft</text>
<path d="M50 32H20V218H50" marker-end="url(#state-tip)"></path>
<text x="45" y="103">Submit</text><text x="45" y="131">If fields complete</text>
<rect x="50" y="194" width="230" height="48"></rect><text x="165" y="224" text-anchor="middle">Ready</text>
</svg>
<figcaption>Rule for this example: without complete fields, submission keeps the draft.</figcaption>
</figure>
```

## Comparison: what changes under the same condition?

Same criteria, units and scales; in a narrow table, keep the comparison side by side with short
text or recompose by criterion. Do not truncate what decides. Ask for a choice under another
condition and a reason; avoid two cards with incompatible criteria.

```html
<table>
<caption>Same output destination, different inputs</caption>
<thead><tr><th scope="col">Valid input</th><th scope="col">Rejected input</th></tr></thead>
<tbody>
<tr><td>New write, if the operation succeeds.</td><td>No new write.</td></tr>
<tr><td>Check the result before delivery.</td><td>Fix the cause and repeat.</td></tr>
</tbody>
</table>
```

## D2 and Mermaid are authoring tools only

If manual layout no longer pays off, read the tool's primary documentation and check the exact
version, licenses and dependencies of the local tool. Render SVG during authoring, keep the
notation source with the delivery and embed only static SVG that passes the guard.
Remove scripts/events, `foreignObject`, resources and styles outside the theme. Compiled output
is not automatically approved: inspect text, topology and geometry in the browser. Do not add
runtime to the reader. No version of these tools is approved as a dependency on this path.
