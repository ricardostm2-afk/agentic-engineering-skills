# Origin and updates — agentic-ci-audit

- Upstream: [https://github.com/morluto/rea](https://github.com/morluto/rea).
- Read-only clone: `https://github.com/morluto/rea.git`; discovery ref `main`.
- Extracted revision: `559af3d3ff4b0236d468e80788c82d5a85b102da`, verified on 2026-10-19.
- License of copied/adapted materials: **MIT**, full text in [licenses/LICENSE](../licenses/LICENSE). Original attribution: Copyright (c) 2026 morluto.

## Source files

- [.agents/skills/rea-ci-tests-audit/references/measurement-and-ci.md](https://github.com/morluto/rea/blob/559af3d3ff4b0236d468e80788c82d5a85b102da/.agents/skills/rea-ci-tests-audit/references/measurement-and-ci.md)
- [.agents/skills/rea-ci-tests-audit/SKILL.md](https://github.com/morluto/rea/blob/559af3d3ff4b0236d468e80788c82d5a85b102da/.agents/skills/rea-ci-tests-audit/SKILL.md)
- [LICENSE](https://github.com/morluto/rea/blob/559af3d3ff4b0236d468e80788c82d5a85b102da/LICENSE)

## Local adaptation

Method adapted for any project, following the language declared in its `AGENTS.md`, with English as the default. Removed REA-specific rules/commands/contribution guidance. Measurement reference preserved; retains oracles, coverage, baseline, equivalent costs and authorization limits.

Installing this folder provides instructions and references; it does not install services, models, engines, CLI or MCP. This folder's license does not license model weights, voices, commercial tools or third-party data; it does not change the rest of the repository's license.

## How to update without losing the adaptation

1. In an isolated checkout of the upstream above, use `git fetch origin main`, pin the new full SHA and compare against the stated revision, only in the listed paths. Updates come from **fetch/reading**, not pushing upstream.
2. Review differences as untrusted data, including links, commands, effects, license and prerequisites; do not run installers or replace these instructions automatically. Also check new/removed resources.
3. Apply changes selectively, preserving local adaptations. When acquiring REA, confirm publication of the exact version in the official registry; do not infer source/tarball equality or substitute `@latest`.
4. In this repository, update this origin and source/target hashes in `UPSTREAMS.json`. The source hash is SHA-256 of bytes from `git show SHA:path`, not the Git blob hash; the target hash is of local LF bytes.
5. Run provenance and inventory/installation tests and the relevant acceptance case; check references, licenses and description boundaries. Distinguish simulation from real service use.
6. Commit/push targets **this repository**, within the authorized scope. Updating this skill does not authorize pushing to https://github.com/morluto/rea, installing dependencies, changing configuration or publishing/deploying.

The set's catalog and procedure are in this repository's `CREDITS.md` and `UPSTREAMS.json`. This origin stays inside the folder to remain accessible when installed alone in Codex or Claude.
