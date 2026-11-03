# Contracts, availability and ownership

Selective adaptation of REA's `docs/tool-design.md`; revision and license are in [origin](origin.md). REA implementation details, constants and providers are not requirements of this guide.

## Availability and identity

Keep the catalog and report availability/capability per session/provider rather than silently omitting tools from schemas. A candidate provider is not the selected provider; an advertised tool does not demonstrate its prerequisite is installed.

Separate canonical identity from readable labels. Include digest/version/options affecting reuse and source linkage. In static relationships, completeness means the actually observed set returned without a known limit, not every relationship that may occur at runtime.

Every error or partial result must let callers distinguish rejected input, unavailable provider, physical failure, limit, cancellation, incomplete coverage and pending cleanup. Preserve primary diagnostics and observations already obtained; do not turn failed shutdown into a claim that analysis never produced anything.

## Lifecycle

Give acquired resources an owner: handles, processes, connections, temporary directories and shared work. Distinguish target admission, readiness, active work, process exit, output closure and release. A PID or successful launcher establishes only its own fact.

Release only owned resources. Attach may own only the connection, not the observed application. Parent process exit does not demonstrate child termination or stream closure. Preserve enough identity to confirm ownership before stopping/removing resources.

Shared work has one producer and individually cancellable consumers. One consumer must not destroy another's result; the last tracks cleanup. Retain failures per resource and retry only pending closures. A retry does not erase prior success/failure or demonstrate an unknown resource was released.

Propagate cancellation through consumption/finalization. Before returning success, observe cancellation after the last relevant wait. Define the commit point for atomic publication and preserve its receipt if it has already occurred; later cancellation does not undo it.

Preserve accepted execution controls across queues and retries. Store cancellation reasons separately from producer failures rather than reconstructing them by comparing messages.

## Limits and verification

Choose limits by format, authority, protocol and measured cost. Account for child processes, decoding, serialization and retained state, not just workers or one response's size. Describe coverage precisely when paginating or stopping early.

Verify failure and cleanup through the same public path the consumer uses. A cache of prior success does not prove current service/host readiness. A green profiler wrapper does not prove the payload; read both exit statuses.

Reuse the project's own error types, supervisors and contracts when they fit the intent. Do not import internal helpers or timeout numbers from another project as universal requirements.
