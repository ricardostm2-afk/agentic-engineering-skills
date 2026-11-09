# Security lens: operational checklist

This is the single operational source for the security lens. Read it when assigned security;
the panel and reviewer brief point here rather than maintaining separate checklists. Apply it
to the fixed review diff and affected callers under project `REVIEW.md`. Do not broaden to an
unsolicited whole-repo audit. Use the brief's evidence, severity and report format.

1. **Permissions and isolation.** Verify server enforcement, including refusal for a role without
   access and isolation between customers/organizations. Trace affected reads and writes; hiding
   a control in the UI is not enforcement. Test relevant negative paths with safe fixtures.
2. **Untrusted input.** Follow input through validation and its sensitive use (queries, shell,
   paths, rendering, redirects, outbound requests). Identify a concrete path and effect rather
   than flagging an API name alone.
3. **Secrets and private data.** Check changed code/config for credentials, insecure exposure,
   and logs/errors containing personal data or database values. Reproduction and reports must
   redact secrets and avoid production data.
4. **Dependencies and supply chain.** Inspect new or changed dependencies, including changed
   transitive packages in the lockfile. Record exact resolved versions/source and why relevant
   code becomes reachable. Check **known vulnerabilities** using applicable current primary
   advisories; reuse evidence only while version, context and external advisory state remain
   valid under `<agentic-implement>/references/evidence.md`. State unavailable/stale checks as
   unverified, never “no vulnerabilities”. Inspect **install-time code** (lifecycle scripts,
   fetched binaries, executable hooks), integrity/origin and affected packaging/update paths.
   Do not execute an install script or install into the review tree merely to inspect it.
5. **Hooks, CI and installers.** Trace privilege, credentials, untrusted branch/PR input, install
   and update commands, and whether guards fail closed. Reproduce safely in authorized scratch
   or describe the exact unrun check; do not run production or destructive operations.

Each finding needs an actually read `file:line`, exploitable or broken path, effect and proof
under the brief's rules. A dependency finding cites manifest/lockfile lines, advisory/version
evidence and affected use; uncertainty without a demonstrated effect belongs in Not read or
Not confirmed. Search other instances of the demonstrated class in the diff. The lens never
fixes reviewed production code. `/security-review` may implement this lens only under the panel's
fixed-base/worktree conditions and with this same scope.
