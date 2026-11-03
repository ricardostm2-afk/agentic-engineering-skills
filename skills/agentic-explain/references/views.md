# Views: which to choose and their fields

A page has 1 to 4 views, chosen for what the explanation needs. Each view shows the same nodes from
a different angle; each document step points to one (`view`) and highlights its elements
(`highlight`). An extra view adds noise: one view is enough for most explanations, and a second
only earns its place by answering a question the first does not.

The common fields are `id` (unique across nodes, views and messages), `type` and `title`. Each
type's fields are below; rules and limits are in `references/data.md`. All views use the same
tokens and highlighting, and show labels as text. Without WebGL, each view has a text version.

## Which to choose

| The explanation needs to show | View |
|---|---|
| parts and what depends on what | `graph` |
| a stack: interface, server, data; the layers of a protocol | `layers` |
| who talks to whom, in time order | `sequence` |
| a lifecycle, with states and transitions | `states` |
| events in order: the history of a decision, stages of a process | `timeline` |
| a shape none of the above can draw: a tree, a physical shape, a mechanism, a space | `scene` |

Choose the first one that fits. Two views of the same type on one page are rarely worthwhile.
Useful combinations: `graph` with `sequence` (the parts, then what passes between them), `layers`
with `states` (where things live and how they change).

## graph

For parts and dependencies: modules, services, connected concepts. Uses forces to position nodes
(`3d-force-graph`) and, in Flat mode, places them on screen without depth. The text version lists
the edges.

Fields: `nodes` (optional; defaults to all document nodes) and `edges`, each with `from`, `to`,
`type` (the edge's verb: “reads”, “calls”, “stores in”), and optionally `ref` (`path:N`) and `mode`
(profile C only). `from` and `to` differ and are within the view.

```json
{ "id": "v1", "type": "graph", "title": "The parts",
  "nodes": ["cart", "price", "coupon"],
  "edges": [{ "from": "cart", "to": "price", "type": "requests price from", "ref": "src/cart.ts:14" }] }
```

## layers

For a stack, top to bottom, in data order: stacked plates, the nodes of each layer in a row on its
plate, and the layer's name on the left. Edges are straight lines. The text version lists nodes by
layer, with edges.

Fields: `layers` (2 to 6, each with `name` and `nodes`; each node in only one layer) and `edges`
(optional, between nodes in the layers).

```json
{ "id": "v2", "type": "layers", "title": "From page to data",
  "layers": [{ "name": "Interface", "nodes": ["screen"] }, { "name": "Server", "nodes": ["api"] }, { "name": "Data", "nodes": ["database"] }],
  "edges": [{ "from": "screen", "to": "api", "type": "requests from" }] }
```

## sequence

For who talks to whom, in order. Participants stand in a row, each with a post and its name on top;
messages descend in order, as arrows from `from` to `to`, with the text in the middle; asynchronous
messages use dashed lines. The text version is a numbered message list.

Fields: `participants` (2 to 8 node ids) and `messages` (1 to 30, each with `id`, `from`, `to`, `text`
and, only in profile C, `mode`). A step highlights nodes and messages.

```json
{ "id": "v3", "type": "sequence", "title": "Who talks to whom",
  "participants": ["screen", "api"],
  "messages": [{ "id": "m1", "from": "screen", "to": "api", "text": "Requests the total" },
                { "id": "m2", "from": "api", "to": "screen", "text": "Returns the total" }] }
```

## states

For a lifecycle: possible states, and what changes them. States sit in a ring, transitions are
arcs with an arrowhead and the event in the middle, self-transitions loop back, and the initial
state has “initial” in its label. The text version lists transitions, with the initial state first.

Fields: `states` (2 to 16 node ids), `initial` (one of the states) and `transitions`, each with `from`,
`to` and `event`. States are document nodes, so they have both texts like the others.

```json
{ "id": "v4", "type": "states", "title": "A request's lifecycle",
  "states": ["open", "paid", "shipped"], "initial": "open",
  "transitions": [{ "from": "open", "to": "paid", "event": "payment confirmed" },
                 { "from": "paid", "to": "shipped", "event": "leaves the warehouse" }] }
```

## timeline

For events in order: the history of a decision, stages of a process. On wide screens, a horizontal
axis with a mark per event, `when` above and the node's short name below, alternating heights to
avoid collisions; below 520 px, with 3 or more events, the axis is vertical, top to bottom, with
`when` on the left and the name on the right. The text version is the ordered list.

Fields: `events` (2 to 30, each with `node` and `when`). `when` is free text (“1998”, “stage 2”,
“after payment”); the list determines the order.

```json
{ "id": "v5", "type": "timeline", "title": "How it was decided",
  "events": [{ "node": "proposal", "when": "March" }, { "node": "review", "when": "April" }] }
```

## scene

Only when none of the above draws what the explanation needs: a tree, a physical shape, a
mechanism, a space. Write a `scene(ctx)` function in three.js, within the page's frame; the
generator validates it before writing it (`references/scene.md`). This is the most expensive
view: you maintain the code and the page treats it as external code. A scene standing in for a
graph or sequence is a sign you should have used the catalog view.

Fields: `nodes` (1 to 40 node ids), and the scene file in `--scene`. At most one per page.
Every node in the view must be registered in the scene with `ctx.element`.

```json
{ "id": "v6", "type": "scene", "title": "The tree", "nodes": ["root", "branch", "leaf"] }
```
