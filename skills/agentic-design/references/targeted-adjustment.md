# Targeted adjustment mode

Use for a specific label, contrast, spacing or other correction with settled visual direction.
Preserve this mode when called by `agentic-feature`, `agentic-fix` or a UI lane: no variants,
redesign or full design grill. Read `references/mode-rules.md` and the affected project design
rules, component and current-screen baseline. Keep scope to the requested screen/change.

Read `references/ui-without-slop.md` §3/§5 for relevant requirements and only the §2 blockers that
apply to the correction or detector output; §6/§7 handle exceptions and detector results. Existing
unaffected UI is context, not a new design task. Report unrelated defects without changing them.

1. State the correction, the existing tokens/components reused and its visible success criterion.
2. Follow the repo's implementation/test workflow; use `agentic-implement` for a closed brief.
3. Capture the reported screen before and after in its theme and resolution (`references/proof.md`
   §2). Add data states, themes, widths or interactions only when affected by this correction;
   a small change does not trigger the full new-screen matrix.
4. Measure the changed property in the browser (`proof.md` §3): for example painted contrast,
   remaining width, reflow or the affected focus/keyboard path. Click affected controls to confirm
   state changes; a screenshot alone cannot prove them.
5. Obtain detector output for the diff, then return the correction, before/after measurements,
   screenshot paths, command/results and remaining limitations using `proof.md` §5 status.
   Reuse valid evidence under `mode-rules.md`; do not repeat the same capture just for a handoff.

If the requested correction reveals a material visual or behavior decision, or requires broader
scope, return that decision to the caller before dependent work. The caller re-triages; do not
silently turn targeted adjustment into variants or a redesign.
