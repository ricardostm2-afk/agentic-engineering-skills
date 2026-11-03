# Data: schema 2

The agent writes JSON outside the repo (the session's temporary folder). `scripts/generate-page.mjs`
validates it, with the scene if present, and puts it in the page. The validator rejects and never
corrects: each error line names the field and what failed; you correct the data.

## Schema

```json
{
  "version": 2,
  "title": "2 to 4 words",
  "question": "the request, in the agent's words",
  "topic": "code|general",
  "area": "the paths explained (code only)",
  "base": "<SHA of the code read> (code only)",
  "sources": [{ "url": "https://…", "title": "…", "read_at": "YYYY-MM-DD" }],
  "profile": "A|B|C",
  "granularity": "blocks|components|detail",
  "objective": "understand|solve|change",
  "intro": { "simple": "…", "technical": "…" },
  "types": [{ "id": "code", "name": "Code" }],
  "nodes": [{ "id": "…", "short": "…", "type": "code", "files": ["path:12-30"], "simple": "…", "technical": "…", "risk": "low|medium|high" }],
  "views": [
    { "id": "v1", "type": "graph", "title": "…", "nodes": ["…"], "edges": [{ "from": "…", "to": "…", "type": "reads", "mode": "sync|async", "ref": "path:40" }] },
    { "id": "v2", "type": "layers", "title": "…", "layers": [{ "name": "…", "nodes": ["…"] }], "edges": [] },
    { "id": "v3", "type": "sequence", "title": "…", "participants": ["…"], "messages": [{ "id": "m1", "from": "…", "to": "…", "text": "…", "mode": "sync|async" }] },
    { "id": "v4", "type": "states", "title": "…", "states": ["…"], "initial": "…", "transitions": [{ "from": "…", "to": "…", "event": "…" }] },
    { "id": "v5", "type": "timeline", "title": "…", "events": [{ "node": "…", "when": "…" }] },
    { "id": "v6", "type": "scene", "title": "…", "nodes": ["…"] }
  ],
  "steps": [{ "title": "…", "view": "v1", "highlight": ["…"], "citations": ["path:10-20", "https://…"], "simple": "…", "technical": "…" }],
  "concepts": [{ "term": "…", "simple": "…", "technical": "…" }]
}
```

A page has 1 to 4 views; each type's fields are in `references/views.md`. `risk` and `mode` only
exist in profile C (`references/profiles.md`). A `scene` view requires a scene file
(`references/scene.md`).

## Validator rules

- **Closed lists.** `version` is 2. `topic` is `code` or `general`; `profile` is `A`, `B` or `C`;
  `granularity` is `blocks`, `components` or `detail`; `objective` is `understand`, `solve` or `change`.
- **Title.** 2 to 4 words: the page's `<title>` and the Artifact name, escaped by the generator.
  The long sentence goes in `question`.
- **Topic.** `code` requires `area` and `base`. `general` requires nonempty `sources`.
- **Sources.** Each has an https `url`, `title` and `read_at` (a real `YYYY-MM-DD` date).
  Every URL cited in steps exists in `sources`.
- **Types.** 1 to 6, with unique ids and `name`.
- **Nodes.** 1 to 60, with unique ids. The `type` exists in `types`. With `granularity: blocks`,
  there are 5 to 8. Each node has `id`, `short`, `type`, `simple` and `technical`.
- **Ids.** Ids of `nodes`, `views` and `messages` do not repeat across these sets.
- **Views.** 1 to 4. The `type` is from the catalog, the fields follow the schema, and every cited id
  exists in `nodes`. Limits for each type:
  - `graph`: optional `nodes` (defaults to all); `edges` with different `from` and `to`, both within the view;
  - `layers`: 2 to 6 layers, each node in only one layer;
  - `sequence`: 2 to 8 participants and 1 to 30 messages, with `from` and `to` among the participants;
  - `states`: 2 to 16 states; `initial` is one of them; transitions are between them (`from` equal
    to `to` is allowed);
  - `timeline`: 2 to 30 events;
  - `scene`: 1 to 40 `nodes`; requires `--scene`. A page has at most one `scene` view.
- **Texts.** Nonempty `simple` and `technical`: `intro`, each node, each step and each concept.
- **Steps.** 1 to 12. Each has an existing `view` and a `highlight` with ids from that view: nodes or,
  in a sequence, messages.
- **Citations.** At least one per step. Each is `path:N`, `path:N-M` (with M at least N), or a URL
  from `sources`. With `topic: code`, each step has at least one `path:N`. An edge's `ref` and each
  entry in a node's `files` only accept `path:N` or `path:N-M`: a URL does not fit there; cite an
  edge's source in the step. The path is relative to the root of what you read: no scheme
  (`javascript:`, `data:`, `C:`), no leading `/`, `\` or `~`, and no `..` segment.
- **Profile C.** `risk` (on nodes) and `mode` (on edges and messages) only exist with `profile: C`.
- **Concepts.** 0 to 6.
- **Secrets.** The validator rejects obvious key patterns such as `sk-`, `ghp_`, `AKIA` and
  `-----BEGIN`, in texts and field names; the error line says where without repeating the
  value. Data values echoed by other lines are truncated to 40 characters.

The validator does not check that cited lines exist or that the text is correct: cite only lines
you read.

## The text

It is plain text. Only code between backticks becomes `<code>`. The page inserts everything with
`textContent`, never as HTML; the JSON is embedded with `<` escaped, so a `</script>` in text does
not close the block. Long paths and URLs wrap after “/”.

The data contains no secrets or personal data: no `.env` values, keys, tokens or people's data;
only file names, parts and explanations.

## What the generator returns

```text
node <skill>/scripts/generate-page.mjs <data.json> [--scene <scene.js>] --out <page.html>
```

- **0**: wrote the page.
- **1**: one line per violated rule on stderr, nothing written. Data gives `field: what failed`,
  for example `steps[2].highlight[0]: "ghost" is not an element of view "v1"`; scenes give
  `scene:<line>: what failed`. Correct and repeat.
- **2**: usage or read error: arguments, missing file, invalid JSON, writing, or a template without
  a place for the scene.
