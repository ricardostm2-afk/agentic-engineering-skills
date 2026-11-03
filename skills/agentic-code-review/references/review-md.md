# Writing `REVIEW.md`

Adapted from https://claude.dev/blog/solving-code-review-at-anthropic/. `REVIEW.md` tells a reviewer
what failure means in **this** repo. Without it reviewers flag generic matters (names, style,
“could be simpler”) and miss what matters here. Template: `assets/REVIEW.template.md`.

## Who and where

- Code owners write it (one-human project: agent proposes, human approves “What failure means
  here”, because they know what hurts).
- Owners check the reviewer follows it: run the reviewer on a known case (`learning.md`) and
  see whether it flags what `REVIEW.md` says.
- Root, or where `AGENTS.md`/`CLAUDE.md` points (“what review looks for: `REVIEW.md`”).
- Overrides reviewer brief and this skill's defaults on repo-specific matters (sections below);
  process and model do not belong here.

## Sections

1. **What failure means here**, a line per area: what user or owner sees when it fails and proof.
   The article's examples set the tone: a doc fails by **lying** (claiming a command, path or rule
   absent from the tree); configuration by **misrouting**; a guard by **letting through**; a test
   by **being unable to fail**. Include decisions that look like defects but are not, with pointers.
2. **Skip**: generated files, lockfiles, large fixtures, evidence folders. Confirm generation
   with its checking command; review the source. Name the tool owning style and formatting
   (lint, formatter, hooks): these are not findings.
3. **Repeated findings**: class → what to look for → proof. Start with “(none yet)”.
4. **Process**, one line: review follows `agentic-code-review` (labels, proof, report format,
   rounds, ceiling); model belongs to the user. `REVIEW.md` only supplies repo-specific rules.

Optional only if needed: **Levels** (names, paths for each, always-high paths, diff classifier
command) and **Lenses by zone** (zones and lenses, guards and proof commands). If present they
override `risk-levels.md` and `panel-and-rounds.md` §3's lens list; model is not defined here.

## Keep it short

- **~3 KB** (`wc -c REVIEW.md`). Overflow goes to an area brief or doc, with a pointer stating
  **when** to read it.
- Do not repeat `AGENTS.md` or what a hook, lint or test checks: a rule a machine checks without
  false positives is worth more as a check than as prose.
- `AGENTS.md`/`CLAUDE.md` is short too: stack, conventions, goals and **non-goals**, runnable commands,
  pointers. Review flags convention violations and lines the change made stale (standards lens).

## How it grows

Through repeated findings, not intuition:
- second occurrence of a class becomes either an automatic check (guard, lint, test), or a line
  under “Repeated findings” or “What failure means here”;
- when a defect escapes review, ask what information the reviewer lacked and fix that here
  (or in brief), recording the lesson (`learning.md`);
- a `REVIEW.md` change is a reviewer change: run evaluation cases before adoption.

## Without `REVIEW.md`

Use skill defaults (`risk-levels.md`, `panel-and-rounds.md`) and in the final message suggest
creating one from the template with reviewed areas. Do not create without human OK. Never rewrite
an existing `REVIEW.md`: propose a diff.
