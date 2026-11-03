# Directions: grammars, diversity and combinations

For conceiving directions or variants for new work, or combining references. In an existing
product, the current grammar is the reference: first ask what already distinguishes the product,
then refine the direction within those strengths.

## 1. Grammars, not templates

Starting points for reasoning, not presets to apply. A grammar defines organisation, hierarchy,
density, material and behaviour; the palette comes later. New directions can emerge: explain
them along the same axes and show why they fit.

| Grammar | Structure and signature | Useful for | Risk / counterpoint |
|---|---|---|---|
| Humanist service | Today's task first; simple reading, groups by intent, space only where it helps decisions | Libraries, education, customer services | Confusing calm with empty space, pastel cards and hidden actions |
| Operational instrument | Aligned grid, short rhythms, tabular numbers, action and detail next to the record | Frequent operations, rotas, finance | Density without hierarchy and tiny targets; provide a keyboard path and progressive detail |
| Cultural editorial | Deliberate type scale, asymmetric sequences, images and quotations with a narrative function | Culture, publications, exhibitions | Turning everything into a hero; long content needs an index and comfortable reading |
| Industrial workshop | Groups by process, robust geometry, explicit labels and states | Creation, maintenance, production tools | Decorating with screws and hatching, or monospace everywhere; the machine is not the user |
| Archive and paper | Visible metadata and index, document as the unit, page rhythm | Research, archives, libraries | Textures that impair reading; paper is an organisational metaphor, not a sepia filter |
| Scientific observatory | Comparison, scales and units, layers of detail and evidence | Data, research, monitoring | Charts and glow without a decision; identify absence and uncertainty, do not invent readings |
| Wayfinding | Recognisable route and position, landmarks, predictable next step and return | Services, guidance, multi-step flows | Colour as the only instruction, or needlessly breaking a process into a wizard |
| Playful tactile | Shapes and manipulation feedback, direct cause and effect, variable rhythm | Learning, creation, experiences suited to the person | Expensive effects, mandatory hover or infantilising professional tools |
| Quiet precision | Few surfaces, consistent typographic and geometric details, unambiguous action | Premium products, focused tools | Weak greys and hidden affordances in the name of minimalism |
| Immersive night | Controlled visual field, luminous content, task-related depth | Music, games, audiovisual creation | Neon and glass across the whole UI; keep work areas readable and exits obvious |
| Public service | Direct language, clear form and state, content above ornament | Requests, education, civic information | Visual bureaucracy, walls of text, needlessly copying an institutional appearance |
| Field notebook | Collection and observation by context, images and annotations, navigation through time and space | Nature, travel, field research | Organic aesthetics unrelated to the data; different shapes for comparable fields |

## 2. Real diversity

"Blue editorial" and "green editorial" are the same concept. "Read a narrative by chapters"
and "explore a map with evidence records" change discovery, order, focus and interaction.
Compare the costs of those choices, not adjectives. An existing system does not have to adopt
another grammar from this table.

## 3. Coherence without monotony

Reserve variation for content and states that deserve it. Repeating alignments and control
contracts reduces effort; varying composition, rhythm and narrative distinguishes surfaces. A
consistent component family does not require every page to use the same card grid. Unrelated
pieces (radius and icon scales, animations and materials from several demos, with no rule to
combine them) signal a missing dominant grammar.

## 4. Combine without making a mess

Choose a dominant grammar first and add only mechanisms that strengthen the thesis; one or two
supporting influences usually suffice, but coherence is the criterion, not a quota. Each mechanism
follows **reference → principle → role in the task → adaptation → proof**: keep the useful
principle, not the example's flaw (focusable native input, associated label, state in words,
correct link or button, reduced motion). A success animation does not implement a notice; a
padlock does not implement security. The record fits in a paragraph: changing a button does not
require a form.

### Compatibility test

| Axis | Question | If it fails |
|---|---|---|
| Organisation | Do both references assume the same work order? | One dominant structure; take only a local mechanism from the other |
| Density and rhythm | Do spacing, size and action frequency serve the same device? | Adjust to actual density without shrinking targets until unusable |
| Typography | Do hierarchy and text length fit without cutting decision-making content? | One shared scale; a new font only with a reason, support and authorisation |
| Geometry | Are radii, borders, alignments and icon weights related? | Reimplement the idea in the app's tokens; do not approximate values by eye |
| Material | Does depth explain a layer or manipulation, or merely decorate? | Remove the extra surface; do not mix paper, glass and metal without a thesis (B22) |
| Semantics | Do the same colour and shape convey the same state? Is it understandable without colour? | Separate brand, action and state; text, icon and focus complement colour |
| Motion | Does the effect explain a change? Does it work without hover and with reduced motion? | Equivalent static state or feedback; animation is not authorisation, progress or success (B23) |
| Cost | Are GPU, layout, dependencies and maintenance worth the gain? | Use the simple mechanism; measure when the cost is material |

If two references fail on these axes, extract the principle and reimplement it in existing tokens;
do not carry over the CSS to disguise the conflict.

### Combinations with a reason

- **Humanist service + operational instrument**: a clear daily schedule, an aligned grid to compare
  the team, editing in context. The grid serves comparison; do not import a financial tool's
  terminal language.
- **Editorial + wayfinding**: programme by day and venue, editorial rhythm to highlight sessions,
  predictable route to buy or save. Ornament does not cross the reading of the timetable.
- **Archive + observatory**: document index to find evidence, visualisation to compare readings
  with units and uncertainty. No panels of numbers just to fill the top.
- **Workshop + tactile**: tools grouped by process, snapping feedback when an object is being
  manipulated. A save button does not need a 3D object.

### Combinations to reject or transform

- A calm form and a neon field with a running border: extract the idea of unambiguous focus,
  without continuous animation.
- A frequently used operations table and pointer-tilted 3D cards: keep detail in context,
  without turning every row into a stage.
- A celebration notification and a save error: keep message hierarchy, without confetti,
  and prove the retry and actual state.
- A hidden checkbox and a theatrical switch: keep distinguishable state, with a focusable native
  input and a stable label.

These are suitability tests, not universal prohibitions. In a game or cultural installation,
the same materiality may have a function: demonstrate that, rather than invoking "creativity"
to ignore the task. Control and surface mechanisms worth knowing are in `mechanisms.md`.
