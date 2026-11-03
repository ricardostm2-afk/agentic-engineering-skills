# Architecture vocabulary

The single source of terms for designing modules and interfaces: in this skill,
`agentic-feature` (the plan), `agentic-implement` (test seams) and
`agentic-project` (phase 3). Use them exactly: consistent language makes the vocabulary
useful. Each term says what to avoid because the avoided word means something else or
says less.

## Terms

**Module**: anything with an interface and an implementation, at any scale: a function, a
class, a package, a slice across layers. _Avoid_: unit, component, service, and
layer or wrapper when you mean module.

**Interface**: everything a caller must know to use the module correctly: type signatures,
but also invariants, call ordering, failure modes, required configuration and
performance. _Avoid_: API, signature (they cover only the type surface).

**Implementation**: what is inside the module, the body of code. Distinct from **adapter**: an
adapter can be small with a large implementation (a Postgres repository) or
large with a small implementation (an in-memory double). Say “adapter” when discussing
the seam, and “implementation” otherwise.

**Depth**: leverage at the interface: how much behavior a caller (or a test) can
exercise per unit of interface it must learn. A module is **deep** when much
behavior sits behind a small interface, and **shallow** when the interface is almost as
complex as the implementation.

**Seam** (Michael Feathers): a place where behavior can change without editing at that
place; where a module's interface lives. Seam placement is its own decision,
separate from what goes behind it. _Avoid_: boundary or limit as synonyms for seam or
interface (in DDD the word already belongs to “bounded context”).

**Adapter**: a concrete thing satisfying an interface at a seam. It names the role (the place
it occupies), not the substance (what it contains).

**Port**: the interface defined at a seam for a dependency across the network or
outside your control; the deep module owns the logic and transport enters as an adapter
(`references/deepening.md`, categories 3 and 4).

**Leverage**: what callers gain from depth: more capability per unit of
interface learned. An implementation pays off across N callers and M tests.

**Locality**: what maintainers gain from depth: changes, defects, knowledge
and verification concentrate in one place rather than spreading across callers. Fixed
once, fixed everywhere.

**Deepening**: the refactor replacing shallow modules with a deep module. A **candidate** is a
deepening opportunity with evidence of the friction that justifies it.

**Friction**: what architecture charges people changing code: jumping between many small modules
to understand a concept, defects living in how functions are called, coupling
leaking through the seam, parts hard to test through their interface.

**Domain glossary**: the project's terms file (`GLOSSARY.md` or whatever
`AGENTS.md` names). It names modules and seams; this vocabulary names the
architecture. If the glossary defines “Order”, say “the order intake module”, rather than
the class name or “the order service”.

## Deep and shallow

**Deep module** = small interface + much implementation:

```
┌──────────────────────────┐
│     Small interface      │  ← few entry points, simple parameters
├──────────────────────────┤
│                          │
│   Deep implementation    │  ← complex logic stays hidden
│                          │
└──────────────────────────┘
```

**Shallow module** = large interface + little implementation (avoid):

```
┌──────────────────────────────────┐
│         Large interface          │  ← many entry points, complex parameters
├──────────────────────────────────┤
│  Thin implementation             │  ← just passes the call through
└──────────────────────────────────┘
```

When designing an interface, ask: can it have fewer entry points? Simpler parameters? Hide
more complexity inside?

## Principles

- **Depth belongs to the interface, not the implementation.** Internally, a deep module can
  consist of small, replaceable pieces with doubles; they just are not part of its interface. A
  module can have **internal seams** (private to the implementation, used by its tests) as well
  as the **external seam** at the interface.
- **The deletion test.** Imagine deleting the module. If the complexity disappears, it was just pass-through.
  If it reappears across N callers, it earned its place.
- **The interface is the testing surface.** Callers and tests cross the same seam. If
  you want to test beyond the interface, the module probably has the wrong shape.
- **One adapter is a hypothetical seam; two are a real seam.** Introduce a seam only
  when something changes through it (usually the production and test adapters).

## Design for testing

1. **Receive dependencies, do not create them.**

   ```typescript
   // Testable
   function processOrder(order, paymentGateway) {}

   // Hard to test
   function processOrder(order) {
     const gateway = new StripeGateway();
   }
   ```

2. **Return results, do not produce side effects.**

   ```typescript
   // Testable
   function calculateDiscount(cart): Discount {}

   // Hard to test
   function applyDiscount(cart): void {
     cart.total -= discount;
   }
   ```

3. **Small surface.** Fewer entry points, fewer tests; fewer parameters, simpler setup.

## Relationships

- A **module** has exactly one **interface** (the surface it shows callers and
  tests).
- **Depth** belongs to a **module**, measured against its **interface**.
- A **seam** is where a **module**'s **interface** lives.
- An **adapter** sits at a **seam** and satisfies the **interface**.
- **Depth** gives **leverage** to callers and **locality** to maintainers.

## Rejected readings

- **Depth as the ratio of implementation lines to interface lines** (Ousterhout):
  rewards bloating the implementation. Here depth is leverage.
- **“Interface” as the TypeScript `interface` keyword or a class's public methods**:
  too narrow; the interface includes every fact a caller must know.
- **“Boundary” as a synonym for seam or interface**: in DDD the word belongs to “bounded
  context”. Say **seam** or **interface**.

## Writing with it

Short sentences using the nouns and verbs here:

- “The order intake module is shallow: its interface almost matches its implementation.”
- “Price calculation leaks through the seam.”
- “Deepen: one interface, one place to test.”
- “Two adapters justify the seam: HTTP in production, in-memory in tests.”

State gains in these terms (“locality: defects concentrate in one module”,
“leverage: one interface, N callers”, “the interface shrinks and the implementation absorbs the
wrappers”), rather than “easier to maintain” or “cleaner code”, which do not say what changed.
Before inventing a term, look here for one that fits.
