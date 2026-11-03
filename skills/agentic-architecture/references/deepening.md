# Deepening

How to safely deepen a group of shallow modules, given its dependencies. Read in
steps 2 (each candidate's category) and 5 (the seam and tests). Terms follow
`references/vocabulary.md`.

## Dependency categories

When assessing a candidate, classify its dependencies. The category determines how to test
the deepened module through the seam.

### 1. In-process

Pure computation, in-memory state, no I/O. Always deepen: merge the modules and
test directly through the new interface. No adapter.

### 2. Locally substitutable

Dependencies with a local substitute for tests (PGLite for Postgres, an in-memory
filesystem). Deepen if the substitute exists: the deepened module's tests run
with it. The seam is internal; there is no port in the module's external interface.

### 3. Remote but ours (ports and adapters)

Our services across the network (microservices, internal APIs). Define a **port** at the
seam: the deep module owns the logic and transport enters as an **adapter**. Tests
use an in-memory adapter; production uses an HTTP, gRPC or queue adapter.

Recommendation format: “Define a port at the seam, with an HTTP adapter for production and an
in-memory one for tests, so the logic stays in a deep module even when distributed across the network.”

### 4. Truly external (mock)

Third-party services you do not control (Stripe, Twilio, …). The deepened module receives the
external dependency as an injected port; tests supply a mock adapter.

In the report, write the category in full beside the strength: `in-process`, `locally
substitutable`, `ports and adapters` or `mock`.

## Seam discipline

- **One adapter is a hypothetical seam; two are a real seam.** Introduce a port only with
  at least two justified adapters (usually production and test). A seam with just one
  adapter is merely indirection.
- **Internal and external seams.** A deep module can have internal seams (private to the
  implementation, used by its tests) as well as the external seam at the interface. An
  internal seam stays outside the interface, even when tests use it.

## Tests: replace, do not stack

- Old unit tests for shallow modules become waste once tests exist at the deepened module's
  interface: delete them, but only after behavior is pinned down and proven unchanged
  using the `agentic-implement` refactor recipe
  (`<agentic-implement>/references/tests.md`, “Refactor”).
- Write new tests at the deepened module's interface. The **interface is the testing surface**.
- Tests check observable results through the interface, not internal state.
- Tests survive internal refactors because they describe behavior, not implementation.
  A test that must change when the implementation changes is testing beyond the interface.
