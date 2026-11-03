# Pilot lessons

## HTTP validation — a decision walkthrough

Sources: RFC 9110, June 2022,
[§13.1.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.2) and
[§15.4.5](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.4.5), accessed on 2026-11-03.
The lesson is synthetic reasoning from the standard, not a capture of executed requests.

Example calibration: an intermediate reader familiar with requests/responses/headers, aiming
to predict outcomes at mechanism level. ETag and weak comparison are prepared in the lesson.

| Goal | Explanation | Activity | Expected answer and error | Evidence |
|---|---|---|---|---|
| Predict a conditional GET | Comparison → condition → response, example beside SVG | Same GET with a different current tag, no worked steps | No match, true condition, 200 within scope; a stored copy alone does not imply 304 | §13.1.2; check both branches |
| Transfer the condition to a write | Response also depends on method | PUT with wildcard and existing resource | False condition, 412, not applied; 304 is not the PUT response | §13.1.2; three-criterion answer rubric |
| Retrieve the mechanism | The condition is “none match” | Next day, explain 304/412 and invent the other branch | Distinguish condition and method without consulting | Real answer not yet collected |

The initial prediction discriminates condition reversal; hints and answers use reader-controlled
`details`. There are no fictional scores. POE only covers predicting/explaining here:
execution is not observed and no such claim is made. Fading removes solution steps; transfer
changes method and condition form, beyond renaming a resource path.

Authoring review: goal/prior knowledge 2; fidelity/sources 2; progression 2; visual function 2;
activity/feedback 2; transfer/retrieval 2. Legibility and safety only reach 2 after delivery's
browser and guard checks. This self-assessment is not a learning study.

## Comparing structures

The first lesson uses a prediction, flowchart beside the example and sequential exercises.
A second may start with a comparison under the same condition and end with a state case;
it need not repeat these sections. The theme stays; the question and layout may change.

## HTTP absence — comparison and knowledge states

`assets/lessons/absence.html`/`.css` starts with a comparison table, moves to a vertical diagram
with the transition condition, and transfers to the client's perspective. It does not repeat the
flowchart or layout of the first lesson. The composition is independent; the theme is the same.

Sources: RFC 9110, June 2022, [§15.5.5](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.5)
and [§15.5.11](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.11), sections read on 2026-11-03.
Calibration: intermediate reader, familiar with GET and response codes, wants to choose and
interpret codes with a reason; scope excludes caching and redirects. Synthetic normative cases.

| Goal | Explanation | Activity | Expected answer and error | Proof |
|---|---|---|---|---|
| Choose from permanence information | Worked comparison: same absence, different knowledge | Guide unavailable for a month, without history or a way to determine permanence | 404; elapsed time alone does not support 410; 404 does not promise a return | §15.5.11 and condition on the arrow |
| Limit the client's inference | The code does not disclose all server policy | Existing resource concealed with 404; assess “deleted forever” message | 404 can conceal existence; message exceeds evidence; propose neutral wording without disclosing the catalogue | §15.5.5; existence/duration/message rubric |
| Retrieve the distinction | Extra evidence, not a timer | Tomorrow explain the codes and counter “404 = deleted” | Own reasoning and a concealment case | Real responses not collected |

The worked example is the contrast; the case with less help removes the solution and stepwise
comparison; transfer changes existence and actor. The POE branch includes no observation:
no requests were executed. The authoring rubric is the same as for the first lesson; learning
was not measured. Optional recipes in `references/repertoire.md` prescribe neither structure.

## Examples A, B and C

The three method examples have different goals and structures:

- **A — validation** (`assets/lessons/validation.html`): predict a conditional GET response,
  follow a worked example, and transfer the condition to a PUT. It is a static composition with a
  flowchart and `details`.
- **B — absence** (`assets/lessons/absence.html`): choose between 404 and 410 and limit what a
  client can infer. It starts with a comparison and moves to states, without repeating A's flowchart.
- **C — interaction** (`assets/lessons/interaction.html` + `interaction.srcdoc`): vary a duration,
  predict the branch, observe the result, and receive causal feedback. The transfer asks for another
  limit and leaves a reference answer and rubric to check after the attempt. The parent is static;
  JavaScript lives in the sandboxed iframe and the page has a text fallback.

Legacy mode (`generate-page.mjs` and the viewer) remains available during the pilot for v2 JSON and
the three.js scene. It is an optional compatibility path, not the template for new lessons.
