// Tests for generate-page.mjs — `node --test skills/agentic-explain/scripts/` from the skills repo root.
// Each validator rule (schema 2) and static scene rule has a negative control (the case it rejects),
// alongside valid documents that pass; JSON escaping, scene placement, CLI exit codes and the template's
// approved address list prove the rest of the contract.
// Writing cases use a minimal fixture template, not the real template (rewritten in another lane).

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { generatePage, validate, validateScene } from "./generate-page.mjs";

const HERE = import.meta.dirname;
const SCRIPT = path.join(HERE, "generate-page.mjs");
const TEMPLATE = path.join(HERE, "..", "assets", "viewer.html");

// Minimal template: only the contract's markers (data, title and scene slot).
const FIXTURE_TEMPLATE = [
  "<!doctype html><html><head><title>{{title}}</title></head><body>",
  '<script type="application/json" id="data">{}</script>',
  '<script id="scene-code"></script>',
  "</body></html>",
  "",
].join("\n");
const TEMPLATE_WITHOUT_SCENE = FIXTURE_TEMPLATE.replace('<script id="scene-code"></script>\n', "");

const SHA = "0a1b2c3d4e5f60718293a4b5c6d7e8f901234567";

// A valid document, handwritten without running the code: expected values come from the spec's schema.
// Five nodes, a graph and a sequence view, one step and one concept.
function node(id, type = "code") {
  return { id, short: id, type, simple: `The ${id}, in simple words.`, technical: `The ${id}, with technical detail.` };
}
function good(extra = {}) {
  return {
    version: 2,
    title: "Page generator",
    question: "What happens when the generator runs",
    topic: "code",
    area: "skills/agentic-explain/scripts",
    base: SHA,
    profile: "B",
    granularity: "components",
    objective: "understand",
    intro: { simple: "A simple introduction.", technical: "A technical introduction." },
    types: [{ id: "code", name: "Code" }, { id: "data", name: "Data" }],
    nodes: [node("read"), node("validate"), node("write"), node("template", "data"), node("page", "data")],
    views: [
      {
        id: "v1", type: "graph", title: "The parts", nodes: ["read", "validate", "write", "template"],
        edges: [{ from: "read", to: "validate", type: "passes to", ref: "scripts/generate-page.mjs:40" }],
      },
      {
        id: "v2", type: "sequence", title: "Who talks to whom", participants: ["read", "validate", "write"],
        messages: [
          { id: "m1", from: "read", to: "validate", text: "The data read" },
          { id: "m2", from: "validate", to: "write", text: "Valid data" },
        ],
      },
    ],
    steps: [{ title: "Read the data", view: "v1", highlight: ["read", "validate"], citations: ["scripts/generate-page.mjs:10-20"], simple: "First, read.", technical: "First, read the JSON." }],
    concepts: [{ term: "template", simple: "A ready-made page.", technical: "HTML with a data block." }],
    ...extra,
  };
}

// One view of each catalog type, over the same five nodes, and what a step can highlight in it.
const VIEWS = {
  graph: () => ({ id: "v1", type: "graph", title: "The parts", nodes: ["read", "validate", "write", "template"], edges: [{ from: "read", to: "validate", type: "passes to" }] }),
  layers: () => ({
    id: "v1", type: "layers", title: "The layers",
    layers: [{ name: "Input", nodes: ["read"] }, { name: "Rules", nodes: ["validate"] }, { name: "Output", nodes: ["write", "page"] }],
    edges: [{ from: "read", to: "validate", type: "passes to" }],
  }),
  sequence: () => ({
    id: "v1", type: "sequence", title: "Who talks to whom", participants: ["read", "validate", "write"],
    messages: [{ id: "m1", from: "read", to: "validate", text: "The data read" }, { id: "m2", from: "validate", to: "write", text: "Valid data" }],
  }),
  states: () => ({
    id: "v1", type: "states", title: "The cycle", states: ["read", "validate", "write"], initial: "read",
    transitions: [{ from: "read", to: "validate", event: "data read" }, { from: "validate", to: "validate", event: "rule by rule" }, { from: "validate", to: "write", event: "no errors" }],
  }),
  timeline: () => ({ id: "v1", type: "timeline", title: "In order", events: [{ node: "read", when: "first" }, { node: "write", when: "at the end" }] }),
  scene: () => ({ id: "v1", type: "scene", title: "The scene", nodes: ["template", "page"] }),
};
const HIGHLIGHT = { graph: ["read"], layers: ["read"], sequence: ["read", "m1"], states: ["read"], timeline: ["read"], scene: ["template"] };

// A valid scene: one function, no forbidden words or literal colors.
const GOOD_SCENE = [
  "function scene(ctx) {",
  "  const { THREE, colors } = ctx;",
  "  const box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: colors.neutral }));",
  "  ctx.scene.add(box);",
  '  ctx.element("template", box);',
  '  ctx.element("page", box);',
  "}",
].join("\n");

// A document with one view of the supplied type; `adjust` changes it before returning.
function withView(type, adjust) {
  const d = good({ views: [VIEWS[type]()] });
  d.steps[0].view = "v1";
  d.steps[0].highlight = [...HIGHLIGHT[type]];
  adjust?.(d);
  return d;
}
// Profile C, with risk on nodes and mode on edges and messages.
function goodC() {
  const d = good({ profile: "C", granularity: "detail" });
  d.nodes.forEach((n, i) => { n.risk = ["low", "medium", "high"][i % 3]; });
  d.views[0].edges[0].mode = "sync";
  d.views[1].messages[0].mode = "async";
  return d;
}
// General topic: no area or base, with sources, and a step citing one of them.
const SOURCE = "https://developer.example.org/dns";
function goodGeneral(adjust) {
  const d = good({ topic: "general", profile: "A" });
  delete d.area;
  delete d.base;
  d.sources = [{ url: SOURCE, title: "How DNS works", read_at: "2026-10-31" }];
  d.steps[0].citations = [SOURCE];
  adjust?.(d);
  return d;
}

const lines = (data, scene = null) => validate(data, scene);
// Reject the document and show at least one line starting with the field and describing the failure.
function rejects(data, field, pattern = /\S/, scene = null) {
  const r = lines(data, scene);
  assert.ok(r.length > 0, `should reject (${field})`);
  const found = r.find((l) => l.startsWith(`${field}: `) && pattern.test(l.slice(field.length + 2)));
  assert.ok(found, `no line «${field}: …» matching ${pattern}; received:\n${r.join("\n")}`);
}
const copy = (o) => structuredClone(o);

test("a valid document passes in all three profiles and both topics", () => {
  assert.deepEqual(lines(good()), []);
  assert.deepEqual(lines(good({ profile: "A", granularity: "blocks" })), []);
  assert.deepEqual(lines(goodC()), []);
  assert.deepEqual(lines(goodGeneral()), []);
});

test("each catalog view type passes with its fields (a scene with its scene code)", () => {
  for (const type of Object.keys(VIEWS)) {
    assert.deepEqual(lines(withView(type), type === "scene" ? GOOD_SCENE : null), [], type);
  }
});

test("omitting concepts also passes (0 to 6)", () => {
  const d = good();
  delete d.concepts;
  assert.deepEqual(lines(d), []);
  assert.deepEqual(lines(good({ concepts: [] })), []);
});

test("the root must be an object", () => {
  rejects([], "data", /object/);
  rejects(null, "data", /object/);
});

// --- closed lists

test("version must be 2: schema 1 JSON is rejected by this rule", () => {
  rejects(good({ version: 1 }), "version", /2/);
  rejects(good({ version: "2" }), "version", /2/);
  const d = good();
  delete d.version;
  rejects(d, "version");
  const old = { version: 1, title: "Page generator", question: "x", area: "a", base: "b", profile: "A", granularity: "blocks", objective: "understand", nodes: [], edges: [], steps: [] };
  rejects(old, "version", /2/);
});

test("topic, profile, granularity and objective come from closed lists", () => {
  rejects(good({ topic: "other" }), "topic", /code or general/);
  rejects(good({ profile: "D" }), "profile", /A, B or C/);
  rejects(good({ granularity: "lines" }), "granularity", /blocks, components or detail/);
  rejects(good({ granularity: "functions" }), "granularity", /blocks, components or detail/);
  rejects(good({ objective: "refactor" }), "objective", /understand, solve or change/);
  rejects(good({ objective: "debug" }), "objective", /understand, solve or change/);
  for (const field of ["topic", "profile", "granularity", "objective"]) {
    const d = good();
    delete d[field];
    rejects(d, field);
  }
});

// --- title and question

test("the title has 2 to 4 words", () => {
  rejects(good({ title: "Generator" }), "title", /2 to 4 words/);
  rejects(good({ title: "A very simple page generator" }), "title", /2 to 4 words/);
  rejects(good({ title: "   " }), "title");
  assert.deepEqual(lines(good({ title: "The web page generator" })), []);
  assert.deepEqual(lines(good({ title: "  The   page  generator " })), []);
});

test("the question is nonempty text", () => {
  rejects(good({ question: "" }), "question");
  const d = good();
  delete d.question;
  rejects(d, "question");
});

// --- topic, area, base and sources

test("topic code requires area and base", () => {
  for (const field of ["area", "base"]) {
    const d = good();
    delete d[field];
    rejects(d, field, /code/);
    rejects(good({ [field]: "  " }), field, /code/);
  }
});

test("topic general requires nonempty sources and does not require area or base", () => {
  const without = goodGeneral((d) => { delete d.sources; });
  rejects(without, "sources", /at least one/);
  rejects(goodGeneral((d) => { d.sources = []; }), "sources", /at least one/);
  assert.deepEqual(lines(goodGeneral()), []);
  // Sources are optional for code topics.
  assert.deepEqual(lines(good()), []);
});

test("sources: https url, title and read_at with a YYYY-MM-DD date", () => {
  const f = (adjust) => goodGeneral((d) => adjust(d.sources[0]));
  rejects(f((x) => { x.url = "http://developer.example.org/dns"; }), "sources[0].url", /https/);
  rejects(f((x) => { x.url = "developer.example.org/dns"; }), "sources[0].url", /https/);
  rejects(f((x) => { x.url = "https://"; }), "sources[0].url", /https/);
  rejects(f((x) => { delete x.url; }), "sources[0].url", /https/);
  rejects(f((x) => { x.title = ""; }), "sources[0].title");
  rejects(f((x) => { delete x.read_at; }), "sources[0].read_at", /YYYY-MM-DD/);
  for (const bad of ["31-10-2026", "2026-10-3", "2026-13-01", "2026-02-30", "today", 20261031]) {
    rejects(f((x) => { x.read_at = bad; }), "sources[0].read_at", /YYYY-MM-DD/);
  }
  assert.deepEqual(lines(f((x) => { x.read_at = "2028-02-29"; })), []);
  rejects(goodGeneral((d) => { d.sources = "x"; }), "sources", /list/);
  rejects(goodGeneral((d) => { d.sources = ["x"]; }), "sources[0]", /object/);
});

test("every URL cited in a step exists in sources", () => {
  rejects(goodGeneral((d) => { d.steps[0].citations = ["https://other.example.org/x"]; }), "steps[0].citations[0]", /sources/);
  rejects(goodGeneral((d) => { d.steps[0].citations = ["http://developer.example.org/dns"]; }), "steps[0].citations[0]", /sources/);
  assert.deepEqual(lines(goodGeneral((d) => { d.steps[0].citations = [SOURCE, "scripts/a.mjs:3"]; })), []);
  // Also for code: a URL only counts if listed in sources.
  rejects(good({ steps: [{ ...good().steps[0], citations: ["scripts/a.mjs:3", "https://missing.example.org"] }] }), "steps[0].citations[1]", /sources/);
});

// --- types and nodes

test("types: 1 to 6, with unique ids", () => {
  rejects(good({ types: [] }), "types", /1 to 6/);
  const seven = Array.from({ length: 7 }, (_, i) => ({ id: `t${i}`, name: `Type ${i}` }));
  rejects(good({ types: seven }), "types", /1 to 6/);
  const dup = good({ types: [{ id: "code", name: "Code" }, { id: "code", name: "Other" }] });
  rejects(dup, "types[1].id", /repeated/);
  rejects(good({ types: [{ id: "code" }, { id: "data", name: "Data" }] }), "types[0].name");
  const six = ["code", "data", "t2", "t3", "t4", "t5"].map((id) => ({ id, name: `Type ${id}` }));
  assert.deepEqual(lines(good({ types: six })), []);
});

const MANY_NODES = Array.from({ length: 61 }, (_, i) => ({ id: `n${i}`, short: `n${i}`, type: "code", simple: "s", technical: "t" }));
const ONLY_THE_FIRST = { views: [{ id: "v1", type: "graph", title: "All" }], steps: [{ title: "x", view: "v1", highlight: ["n0"], citations: ["a.mjs:1"], simple: "s", technical: "t" }] };

test("nodes: 1 to 60, with unique ids, and type exists in types", () => {
  rejects(good({ nodes: [] }), "nodes", /1 to 60/);
  rejects(good({ nodes: MANY_NODES, ...ONLY_THE_FIRST }), "nodes", /1 to 60.*61/);
  assert.deepEqual(lines(good({ nodes: MANY_NODES.slice(0, 60), ...ONLY_THE_FIRST })), []);
  const d = good();
  d.nodes[2].id = "read";
  rejects(d, "nodes[2].id", /repeated/);
  const e = good();
  e.nodes[1].type = "missing";
  rejects(e, "nodes[1].type", /does not exist in types/);
});

test("with granularity blocks, there are 5 to 8 nodes", () => {
  const four = good({ granularity: "blocks" });
  four.nodes = four.nodes.slice(0, 4);
  four.views = [VIEWS.graph()];
  four.views[0].nodes = ["read", "validate", "write", "template"];
  four.steps[0].view = "v1";
  rejects(four, "nodes", /blocks.*5 to 8.*4/);
  const nine = good({ granularity: "blocks", nodes: MANY_NODES.slice(0, 9), ...ONLY_THE_FIRST });
  rejects(nine, "nodes", /blocks.*5 to 8.*9/);
  // The same node count is valid at another granularity; 8 is valid for blocks.
  const other = copy(four);
  other.granularity = "components";
  assert.deepEqual(lines(other), []);
  assert.deepEqual(lines(good({ granularity: "blocks", nodes: MANY_NODES.slice(0, 8), ...ONLY_THE_FIRST })), []);
  assert.deepEqual(lines(good({ granularity: "blocks", nodes: MANY_NODES.slice(0, 5), ...ONLY_THE_FIRST })), []);
});

test("each node has a text id and short name", () => {
  const d = good();
  delete d.nodes[0].short;
  rejects(d, "nodes[0].short");
  const e = good();
  e.nodes[0].id = "";
  rejects(e, "nodes[0].id");
});

test("node, view and message ids do not repeat across these sets", () => {
  const viewAsNode = good();
  viewAsNode.views[0].id = "read";
  viewAsNode.steps[0].view = "read";
  rejects(viewAsNode, "views[0].id", /repeated/);
  const messageAsNode = good();
  messageAsNode.views[1].messages[0].id = "validate";
  rejects(messageAsNode, "views[1].messages[0].id", /repeated/);
  const messageAsView = good();
  messageAsView.views[1].messages[1].id = "v1";
  rejects(messageAsView, "views[1].messages[1].id", /repeated/);
  const twoMessages = good();
  twoMessages.views[1].messages[1].id = "m1";
  rejects(twoMessages, "views[1].messages[1].id", /repeated/);
  const twoViews = good();
  twoViews.views[1].id = "v1";
  rejects(twoViews, "views[1].id", /repeated/);
});

// --- simple and technical texts

test("nonempty simple and technical: intro, every node, step and concept", () => {
  const cases = [
    ["intro.simple", (d) => { d.intro.simple = ""; }],
    ["intro.technical", (d) => { d.intro.technical = "   "; }],
    ["nodes[3].simple", (d) => { d.nodes[3].simple = ""; }],
    ["nodes[0].technical", (d) => { delete d.nodes[0].technical; }],
    ["steps[0].simple", (d) => { d.steps[0].simple = ""; }],
    ["steps[0].technical", (d) => { d.steps[0].technical = 3; }],
    ["concepts[0].simple", (d) => { d.concepts[0].simple = ""; }],
    ["concepts[0].technical", (d) => { d.concepts[0].technical = ""; }],
  ];
  for (const [field, change] of cases) {
    const d = good();
    change(d);
    rejects(d, field, /text/);
  }
  const noIntro = good();
  delete noIntro.intro;
  rejects(noIntro, "intro");
});

// --- views: list and catalog

test("views: 1 to 4, with a catalog type, id and title", () => {
  rejects(good({ views: [] }), "views", /1 to 4/);
  const four = [VIEWS.graph(), VIEWS.sequence(), VIEWS.states(), VIEWS.timeline()].map((v, i) => ({ ...v, id: `v${i + 1}` }));
  const five = [...four, { ...VIEWS.layers(), id: "v5" }];
  rejects(good({ views: five }), "views", /1 to 4.*5/);
  assert.deepEqual(lines(good({ views: four })), []);
  rejects(good({ views: "v1" }), "views", /list/);
  const d = good();
  d.views[0].type = "map";
  rejects(d, "views[0].type", /graph, layers, sequence, states, timeline or scene/);
  const e = good();
  e.views[0].title = "";
  rejects(e, "views[0].title");
  const f = good();
  f.views[0].id = "";
  rejects(f, "views[0].id");
});

test("graph: optional nodes (defaults to all); edges have different from and to within the view", () => {
  const without = withView("graph", (d) => { delete d.views[0].nodes; delete d.views[0].edges; });
  assert.deepEqual(lines(without), []);
  rejects(withView("graph", (d) => { d.views[0].nodes = ["read", "ghost"]; }), "views[0].nodes[1]", /does not exist in nodes/);
  rejects(withView("graph", (d) => { d.views[0].nodes = []; }), "views[0].nodes", /at least one/);
  const edge = (e, adjust) => withView("graph", (d) => { d.views[0].edges = [e]; adjust?.(d); });
  rejects(edge({ from: "nothing", to: "validate", type: "reads" }), "views[0].edges[0].from", /does not exist in nodes/);
  rejects(edge({ from: "read", to: "nothing", type: "reads" }), "views[0].edges[0].to", /does not exist in nodes/);
  rejects(edge({ from: "read", to: "read", type: "reads" }), "views[0].edges[0].to", /differ/);
  rejects(edge({ from: "read", to: "validate" }), "views[0].edges[0].type");
  // "page" exists in nodes but not in this view.
  rejects(edge({ from: "read", to: "page", type: "reads" }), "views[0].edges[0].to", /outside this view/);
  // Without `nodes`, the view contains all nodes, and an edge to "page" passes.
  assert.deepEqual(lines(edge({ from: "read", to: "page", type: "reads" }, (d) => { delete d.views[0].nodes; })), []);
  rejects(withView("graph", (d) => { d.views[0].edges = "reads"; }), "views[0].edges", /list/);
});

test("layers: 2 to 6 layers, each node in only one", () => {
  const layers = (n) => Array.from({ length: n }, (_, i) => ({ name: `Layer ${i}`, nodes: [["read", "validate", "write", "template", "page"][i] ?? "read"] }));
  rejects(withView("layers", (d) => { d.views[0].layers = layers(1); }), "views[0].layers", /2 to 6.*1/);
  rejects(withView("layers", (d) => { d.views[0].layers = layers(7); }), "views[0].layers", /2 to 6.*7/);
  assert.deepEqual(lines(withView("layers", (d) => { d.views[0].layers = layers(2); })), []);
  assert.deepEqual(lines(withView("layers", (d) => { d.views[0].layers = layers(5); d.views[0].edges = []; })), []);
  const repeated = withView("layers", (d) => { d.views[0].layers[1].nodes = ["read"]; });
  rejects(repeated, "views[0].layers[1].nodes[0]", /already.*layers\[0\]/);
  rejects(withView("layers", (d) => { d.views[0].layers[0].nodes = ["ghost"]; }), "views[0].layers[0].nodes[0]", /does not exist in nodes/);
  rejects(withView("layers", (d) => { d.views[0].layers[0].name = ""; }), "views[0].layers[0].name");
  rejects(withView("layers", (d) => { d.views[0].layers[0].nodes = []; }), "views[0].layers[0].nodes", /at least one/);
  // Edges stay within the view's layers.
  rejects(withView("layers", (d) => { d.views[0].edges = [{ from: "read", to: "template", type: "reads" }]; }), "views[0].edges[0].to", /outside this view/);
});

test("sequence: 2 to 8 participants and 1 to 30 messages between participants", () => {
  rejects(withView("sequence", (d) => { d.views[0].participants = ["read"]; d.views[0].messages = [{ id: "m1", from: "read", to: "read", text: "x" }]; }), "views[0].participants", /2 to 8.*1/);
  const nine = Array.from({ length: 9 }, (_, i) => `p${i}`);
  const many = good({ nodes: nine.map((id) => node(id)), views: [{ id: "v1", type: "sequence", title: "Many", participants: nine, messages: [{ id: "m1", from: "p0", to: "p1", text: "x" }] }], steps: [{ ...good().steps[0], view: "v1", highlight: ["p0"] }] });
  rejects(many, "views[0].participants", /2 to 8.*9/);
  const eight = copy(many);
  eight.views[0].participants = nine.slice(0, 8);
  assert.deepEqual(lines(eight), []);
  rejects(withView("sequence", (d) => { d.views[0].participants = ["read", "ghost"]; }), "views[0].participants[1]", /does not exist in nodes/);
  rejects(withView("sequence", (d) => { d.views[0].messages = []; }), "views[0].messages", /1 to 30.*0/);
  const messages = (n) => Array.from({ length: n }, (_, i) => ({ id: `m${i + 1}`, from: "read", to: "validate", text: `Message ${i + 1}` }));
  rejects(withView("sequence", (d) => { d.views[0].messages = messages(31); }), "views[0].messages", /1 to 30.*31/);
  assert.deepEqual(lines(withView("sequence", (d) => { d.views[0].messages = messages(30); })), []);
  // `from` and `to` must be participants: "template" is a node but does not participate.
  rejects(withView("sequence", (d) => { d.views[0].messages[0].from = "template"; }), "views[0].messages[0].from", /participant/);
  rejects(withView("sequence", (d) => { d.views[0].messages[0].to = "nothing"; }), "views[0].messages[0].to", /participant/);
  rejects(withView("sequence", (d) => { d.views[0].messages[0].text = ""; }), "views[0].messages[0].text");
  rejects(withView("sequence", (d) => { d.views[0].messages[0].id = ""; }), "views[0].messages[0].id");
});

test("states: 2 to 16 states, initial is one of them, transitions between them", () => {
  const ids = Array.from({ length: 17 }, (_, i) => `s${i}`);
  const withCount = (n) => good({
    nodes: ids.slice(0, n).map((id) => node(id)),
    views: [{ id: "v1", type: "states", title: "Cycle", states: ids.slice(0, n), initial: "s0", transitions: [{ from: "s0", to: "s1", event: "advances" }] }],
    steps: [{ ...good().steps[0], view: "v1", highlight: ["s0"] }],
  });
  rejects(withCount(1), "views[0].states", /2 to 16.*1/);
  rejects(withCount(17), "views[0].states", /2 to 16.*17/);
  assert.deepEqual(lines(withCount(16)), []);
  rejects(withView("states", (d) => { d.views[0].initial = "template"; }), "views[0].initial", /one of the states/);
  rejects(withView("states", (d) => { delete d.views[0].initial; }), "views[0].initial", /one of the states/);
  rejects(withView("states", (d) => { d.views[0].states = ["read", "ghost"]; }), "views[0].states[1]", /does not exist in nodes/);
  rejects(withView("states", (d) => { d.views[0].transitions[0].from = "template"; }), "views[0].transitions[0].from", /state/);
  rejects(withView("states", (d) => { d.views[0].transitions[0].to = "nothing"; }), "views[0].transitions[0].to", /state/);
  rejects(withView("states", (d) => { d.views[0].transitions[0].event = ""; }), "views[0].transitions[0].event");
  rejects(withView("states", (d) => { d.views[0].transitions = "x"; }), "views[0].transitions", /list/);
  // Equal `from` and `to` is allowed (already in the valid document: validate → validate).
  assert.deepEqual(lines(withView("states")), []);
});

test("timeline: 2 to 30 events, each with a node and a when", () => {
  const nodes30 = Array.from({ length: 31 }, (_, i) => node(`t${i}`));
  const withCount = (n) => good({
    nodes: nodes30,
    views: [{ id: "v1", type: "timeline", title: "Time", events: nodes30.slice(0, n).map((x, i) => ({ node: x.id, when: `Day ${i}` })) }],
    steps: [{ ...good().steps[0], view: "v1", highlight: ["t0"] }],
  });
  rejects(withCount(1), "views[0].events", /2 to 30.*1/);
  rejects(withCount(31), "views[0].events", /2 to 30.*31/);
  assert.deepEqual(lines(withCount(30)), []);
  assert.deepEqual(lines(withCount(2)), []);
  rejects(withView("timeline", (d) => { d.views[0].events[0].node = "ghost"; }), "views[0].events[0].node", /does not exist in nodes/);
  rejects(withView("timeline", (d) => { d.views[0].events[0].when = ""; }), "views[0].events[0].when");
  rejects(withView("timeline", (d) => { d.views[0].events = "x"; }), "views[0].events", /list/);
});

test("scene: 1 to 40 nodes, at most one view, requires --scene (and --scene requires a scene view)", () => {
  const nodes41 = Array.from({ length: 41 }, (_, i) => node(`c${i}`));
  const withCount = (n) => good({
    nodes: nodes41,
    views: [{ id: "v1", type: "scene", title: "The scene", nodes: nodes41.slice(0, n).map((x) => x.id) }],
    steps: [{ ...good().steps[0], view: "v1", highlight: ["c0"] }],
  });
  rejects(withCount(0), "views[0].nodes", /1 to 40.*0/, GOOD_SCENE);
  rejects(withCount(41), "views[0].nodes", /1 to 40.*41/, GOOD_SCENE);
  assert.deepEqual(lines(withCount(40), GOOD_SCENE), []);
  rejects(withView("scene", (d) => { d.views[0].nodes = ["template", "ghost"]; }), "views[0].nodes[1]", /does not exist in nodes/, GOOD_SCENE);
  // Two scene views.
  const two = withView("scene", (d) => { d.views.push({ ...VIEWS.scene(), id: "v2" }); });
  rejects(two, "views[1]", /at most one scene view/, GOOD_SCENE);
  // Scene view without --scene.
  rejects(withView("scene"), "views[0]", /requires --scene/);
  // --scene without a scene view.
  rejects(good(), "scene", /no view/, GOOD_SCENE);
  assert.deepEqual(lines(good(), null), []);
});

// --- steps

test("steps: 1 to 12, each with an existing view and a highlight containing that view's ids", () => {
  rejects(good({ steps: [] }), "steps", /1 to 12/);
  const p = good().steps[0];
  rejects(good({ steps: Array.from({ length: 13 }, () => copy(p)) }), "steps", /1 to 12.*13/);
  assert.deepEqual(lines(good({ steps: Array.from({ length: 12 }, () => copy(p)) })), []);
  const d = good();
  d.steps[0].view = "v9";
  rejects(d, "steps[0].view", /does not exist in views/);
  const e = good();
  e.steps[0].highlight = ["read", "ghost"];
  rejects(e, "steps[0].highlight[1]", /is not an element of view/);
  // "page" exists in nodes but not view v1 (a graph of 4 nodes): cannot highlight it there.
  const f = good();
  f.steps[0].highlight = ["page"];
  rejects(f, "steps[0].highlight[0]", /is not an element of view/);
  rejects(good({ steps: [{ ...p, highlight: "read" }] }), "steps[0].highlight", /list/);
  rejects(good({ steps: [{ ...p, title: "" }] }), "steps[0].title");
});

test("highlight accepts nodes and messages from the view, and only from that view", () => {
  const d = good();
  d.steps[0].view = "v2";
  d.steps[0].highlight = ["read", "m1", "m2", "write"];
  assert.deepEqual(lines(d), []);
  // A message from view v2 is not an element of view v1.
  const e = good();
  e.steps[0].highlight = ["m1"];
  rejects(e, "steps[0].highlight[0]", /is not an element of view/);
  // Each view accepts its highlight targets (`HIGHLIGHT`) and rejects a node outside it.
  for (const type of Object.keys(VIEWS)) {
    const x = withView(type, (doc) => { doc.steps[0].highlight = ["ghost"]; });
    assert.ok(lines(x, type === "scene" ? GOOD_SCENE : null).some((l) => l.startsWith("steps[0].highlight[0]: ")), type);
  }
});

// --- citations

test("citations: at least one per step, each path:N, path:N-M (M at least N) or URL from sources", () => {
  const FORM = /path:N or path:N-M/;
  rejects(good({ steps: [{ ...good().steps[0], citations: [] }] }), "steps[0].citations", /at least one/);
  const missingField = good();
  delete missingField.steps[0].citations;
  rejects(missingField, "steps[0].citations", /list/);
  rejects(good({ steps: [{ ...good().steps[0], citations: "a.mjs:1" }] }), "steps[0].citations", /list/);
  for (const bad of ["no-line", "file.mjs:", "file.mjs:abc", "file.mjs:0", "file.mjs:5-3", "file.mjs:1-", "file.mjs:1-2-3", ":10", "with space.mjs:10", 7]) {
    const d = good();
    d.steps[0].citations = [bad, "ok.mjs:1"];
    rejects(d, "steps[0].citations[0]", FORM);
  }
  for (const valid of ["a.mjs:1", "folder/a.mjs:12-30", "skills/agentic-explain/SKILL.md:7-7"]) {
    const d = good();
    d.steps[0].citations = [valid];
    assert.deepEqual(lines(d), [], valid);
  }
});

// Citation paths are root-relative: no scheme, leading "/", "\" or "~", or ".." segment.
const PATHS_OUTSIDE_ROOT = [
  "javascript:alert(1):1", "data:x:1", "/srv/x/a.js:1", "~/a.js:1", "../a.js:1", "a/../b.js:2", "C:\\a.js:1",
  "c:/x.mjs:4", "\\\\server\\a.js:1", "file:///etc/passwd:1", "a\\..\\b.js:3",
];
test("citations: paths are root-relative (no scheme, leading / \\ ~, or ..), in citations, ref and files", () => {
  const FORM = /path:N or path:N-M, with M at least N, and a root-relative path \(no scheme, no leading \/, no \.\.\)/;
  for (const bad of PATHS_OUTSIDE_ROOT) {
    const a = good();
    a.steps[0].citations = [bad, "ok.mjs:1"];
    rejects(a, "steps[0].citations[0]", FORM);
    const b = good();
    b.views[0].edges[0].ref = bad;
    rejects(b, "views[0].edges[0].ref", FORM);
    const c = good();
    c.nodes[0].files = [bad];
    rejects(c, "nodes[0].files[0]", FORM);
  }
  // Characterization: relative paths still pass, and ".." only counts as an entire segment.
  for (const valid of ["src/a.ts:1-2", "a.js:3", "a/b..c.js:3", "..a.js:4", "a/~b.js:5", "folder/.hidden/a.js:6"]) {
    const d = good();
    d.steps[0].citations = [valid];
    d.views[0].edges[0].ref = valid;
    d.nodes[0].files = [valid];
    assert.deepEqual(lines(d), [], valid);
  }
  // Source URLs still use the URL path; a URL never counts as a file path.
  assert.deepEqual(lines(goodGeneral()), []);
});

test("with topic code, each step cites at least one path:N; with topic general a URL suffices", () => {
  const onlyUrl = good({ steps: [{ ...good().steps[0], citations: [SOURCE] }], sources: [{ url: SOURCE, title: "DNS", read_at: "2026-10-31" }] });
  rejects(onlyUrl, "steps[0].citations", /path:N/);
  const withUrlAndPath = copy(onlyUrl);
  withUrlAndPath.steps[0].citations = [SOURCE, "a.mjs:3"];
  assert.deepEqual(lines(withUrlAndPath), []);
  assert.deepEqual(lines(goodGeneral()), []);
});

test("an edge's ref and a node's files have the form path:N or path:N-M", () => {
  const FORM = /path:N or path:N-M/;
  for (const bad of ["no-line", "file.mjs:0", "file.mjs:5-3", "file.mjs:1-", "with space.mjs:10", 7, "https://example.org/x", "https://example.org:8080"]) {
    const a = good();
    a.views[0].edges[0].ref = bad;
    rejects(a, "views[0].edges[0].ref", FORM);
    const b = good();
    b.nodes[0].files = [bad];
    rejects(b, "nodes[0].files[0]", FORM);
  }
  for (const valid of ["a.mjs:1", "folder/a.mjs:12-30"]) {
    const d = good();
    d.views[0].edges[0].ref = valid;
    d.nodes[0].files = [valid, "b.mjs:2"];
    assert.deepEqual(lines(d), [], valid);
  }
  const c = good();
  c.nodes[0].files = "a.mjs:1";
  rejects(c, "nodes[0].files", /list/);
});

// --- risk and mode

test("risk and mode only exist in profile C", () => {
  const a = good();
  a.nodes[0].risk = "high";
  rejects(a, "nodes[0].risk", /only exists with profile C/);
  const b = good({ profile: "A" });
  b.views[0].edges[0].mode = "sync";
  rejects(b, "views[0].edges[0].mode", /only exists with profile C/);
  const m = good({ profile: "B" });
  m.views[1].messages[0].mode = "async";
  rejects(m, "views[1].messages[0].mode", /only exists with profile C/);
  // With C, they pass, and values come from the lists.
  const c = goodC();
  const r = copy(c);
  r.nodes[0].risk = "dangerous";
  rejects(r, "nodes[0].risk", /low, medium or high/);
  const n = copy(c);
  n.views[0].edges[0].mode = "parallel";
  rejects(n, "views[0].edges[0].mode", /sync or async/);
  const o = copy(c);
  o.views[1].messages[0].mode = "parallel";
  rejects(o, "views[1].messages[0].mode", /sync or async/);
  assert.deepEqual(lines(c), []);
});

// --- concepts

test("concepts: 0 to 6", () => {
  const c = good().concepts[0];
  rejects(good({ concepts: Array.from({ length: 7 }, (_, i) => ({ ...c, term: `t${i}` })) }), "concepts", /0 to 6.*7/);
  assert.deepEqual(lines(good({ concepts: Array.from({ length: 6 }, (_, i) => ({ ...c, term: `t${i}` })) })), []);
  rejects(good({ concepts: [{ ...c, term: "" }] }), "concepts[0].term");
  rejects(good({ concepts: "x" }), "concepts", /list/);
});

// --- secrets

test("no secrets: reject obvious key patterns in any text without echoing them", () => {
  const secrets = [
    "sk-test-abcdefghijkl",
    "ghp_abcdefghijklmnopqrstuvwxyz0123",
    "AKIA".padEnd(20, "X"),
    "-----BEGIN PRIVATE KEY",
    "-----BEGIN OPENSSH PRIVATE KEY",
    "github_pat_11ABCDEFG0abcdefghijkl",
    "xoxb-123456789-abcdef",
  ];
  const places = [
    ["intro.technical", (d, s) => { d.intro.technical = `Use key ${s} at startup.`; }],
    ["nodes[0].simple", (d, s) => { d.nodes[0].simple = s; }],
    ["steps[0].title", (d, s) => { d.steps[0].title = `Step ${s}`; }],
    ["concepts[0].term", (d, s) => { d.concepts[0].term = s; }],
    ["question", (d, s) => { d.question = `Where is ${s}`; }],
    ["views[0].title", (d, s) => { d.views[0].title = s; }],
    ["views[1].messages[0].text", (d, s) => { d.views[1].messages[0].text = s; }],
  ];
  for (const s of secrets) {
    for (const [field, put] of places) {
      const d = good();
      put(d, s);
      rejects(d, field, /key or a secret/);
      assert.ok(lines(d).every((l) => !l.includes(s)), "output repeats the secret");
    }
  }
});

test("a key-like field name yields one finding on its object, without echoing or descending through it", () => {
  const MSG = "a field name looks like a key or a secret";
  const keys = [
    "sk-test-ABCDEFGHIJKL",
    "ghp_abcdefghijklmnopqrstuvwxyz0123",
    "AKIA".padEnd(20, "X"),
    "-----BEGIN PRIVATE KEY",
    "github_pat_11ABCDEFG0abcdefghijkl",
    "xoxb-123456789-abcdef",
  ];
  const places = [
    ["nodes[0]", (d, k, v) => { d.nodes[0][k] = v; }],
    ["intro", (d, k, v) => { d.intro[k] = v; }],
    ["views[1].messages[0]", (d, k, v) => { d.views[1].messages[0][k] = v; }],
    ["concepts[0]", (d, k, v) => { d.concepts[0][k] = v; }],
    ["data", (d, k, v) => { d[k] = v; }],
  ];
  for (const k of keys) {
    for (const [field, put] of places) {
      const d = good();
      put(d, k, "any value");
      assert.deepEqual(lines(d), [`${field}: ${MSG}`], `${field} with key ${k.slice(0, 6)}…`);
      // No error path contains the key; the scan does not descend through it: the nested object remains unscanned.
      const nested = good();
      put(nested, k, { text: "ghp_abcdefghijklmnopqrstuvwxyz0123", other: { [k]: 1 } });
      assert.deepEqual(lines(nested), [`${field}: ${MSG}`], `${field}: descended through the key`);
    }
  }
  // Two suspicious keys in one object yield one finding; its other keys are still scanned.
  const two = good();
  two.nodes[0]["sk-test-ABCDEFGHIJKL"] = 1;
  two.nodes[0]["AKIA".padEnd(20, "X")] = 2;
  two.nodes[0].extra = "sk-test-abcdefghijkl";
  assert.deepEqual(lines(two), [`nodes[0]: ${MSG}`, "nodes[0].extra: appears to contain a key or a secret; data contains only file names, parts and explanations"]);
  // Characterization: ordinary field names with a hyphen or similar prefix are not keys.
  const ordinary = good();
  Object.assign(ordinary.nodes[0], { "risk-based": 1, "task-queue": 2, "sk-learn": 3, Akiapp: 4, ghp: 5, "x-ray": 6 });
  assert.deepEqual(lines(ordinary), []);
});

test("no other message echoes a suspected secret; echoed values are truncated", () => {
  const s = "sk-test-abcdefghijkl";
  // A suspicious value reaches rules that normally echo it ("does not exist in types", "repeated", "does not exist in nodes").
  const cases = [
    (d) => { d.nodes[1].type = s; },
    (d) => { d.nodes[2].id = s; d.nodes[3].id = s; },
    (d) => { d.views[0].edges[0].from = s; },
    (d) => { d.steps[0].view = s; },
    (d) => { d.steps[0].highlight = [s]; },
    (d) => { d.steps[0].citations = [s]; },
    (d) => { d.views[0].nodes = [s]; },
  ];
  for (const change of cases) {
    const d = good();
    change(d);
    const r = lines(d);
    assert.ok(r.length > 0);
    assert.ok(r.every((l) => !l.includes(s) && !l.includes("sk-test")), `repeats the secret:\n${r.join("\n")}`);
  }
  // A long value that is not a secret appears truncated.
  const long = good();
  long.nodes[1].type = "x".repeat(300);
  const line = lines(long).find((l) => l.startsWith("nodes[1].type: "));
  assert.ok(line && line.length < 120, line);
});

test("ordinary words containing «sk-» or «AKIA» are not secrets", () => {
  const d = good();
  d.intro.simple = "Risk-based logic in a task-runner, with names such as Akiapp and sk-learn.";
  d.nodes[0].technical = "The --risk-level flag and task-queue function are not keys.";
  assert.deepEqual(lines(d), []);
});

test("multiple violated rules yield one line per rule, each starting with the field", () => {
  const d = good({ version: 3, profile: "Z", title: "One", steps: [] });
  const r = lines(d);
  for (const field of ["version", "profile", "title", "steps"]) assert.ok(r.some((l) => l.startsWith(`${field}: `)), `missing ${field}`);
  assert.equal(new Set(r).size, r.length, "repeated lines");
  assert.ok(r.every((l) => /^[\w.[\]]+: \S/.test(l)), r.join("\n"));
});

// --- scene: static rules

// Insert a line into the valid scene's body (line 3) to check the reported line number.
const withLine = (text, n = 3) => {
  const l = GOOD_SCENE.split("\n");
  l.splice(n - 1, 0, text);
  return l.join("\n");
};
const sceneLines = (code) => validateScene(code);

test("a valid scene passes", () => {
  assert.deepEqual(sceneLines(GOOD_SCENE), []);
  assert.deepEqual(sceneLines(`${GOOD_SCENE}\n`), []);
  assert.deepEqual(lines(withView("scene"), GOOD_SCENE), []);
});

test("scenes have at most 40 KB (in bytes) and exactly one function scene( declaration", () => {
  const fill = (bytes) => {
    const rest = bytes - Buffer.byteLength(`//\n${GOOD_SCENE}`, "utf8");
    return `//${"a".repeat(rest)}\n${GOOD_SCENE}`;
  };
  assert.equal(Buffer.byteLength(fill(40 * 1024), "utf8"), 40 * 1024);
  assert.deepEqual(sceneLines(fill(40 * 1024)), []);
  const big = sceneLines(fill(40 * 1024 + 1));
  assert.equal(big.length, 1);
  assert.match(big[0], /^scene:1: .*40 KB/);
  // Count bytes, not characters: 20481 instances of U+00E9 are 40962 bytes.
  const accents = sceneLines(`//${"\u00e9".repeat(20481)}\n${GOOD_SCENE}`);
  assert.ok(accents.some((l) => /^scene:1: .*40 KB/.test(l)), accents.join("\n"));
  // Missing function scene(, or declared twice.
  assert.match(sceneLines("const x = 1;")[0], /^scene:1: .*function scene\(/);
  assert.match(sceneLines("function scenery(ctx) {}")[0], /^scene:1: .*function scene\(/);
  const two = sceneLines(`${GOOD_SCENE}\nfunction scene(ctx) {}`);
  assert.equal(two.length, 1);
  assert.match(two[0], /^scene:8: .*more than once/);
});

const WORDS = [
  ["import", 'import * as X from "x";'],
  ["export", "export const a = 1;"],
  ["require", 'const m = require("x");'],
  ["fetch", "fetch(ctx);"],
  ["XMLHttpRequest", "const r = new XMLHttpRequest();"],
  ["WebSocket", "const s = new WebSocket(ctx);"],
  ["EventSource", "const s = new EventSource(ctx);"],
  ["eval", 'eval("1");'],
  ["Function(", 'const f = new Function("return 1");'],
  ["setInterval", "setInterval(ctx.animate, 10);"],
  ["requestAnimationFrame", "requestAnimationFrame(ctx.animate);"],
  ["localStorage", 'localStorage.setItem("a", "b");'],
  ["sessionStorage", 'sessionStorage.getItem("a");'],
  ["indexedDB", 'indexedDB.open("a");'],
  ["cookie", "const c = ctx.cookie;"],
  ["innerHTML", 'ctx.label("x").innerHTML = "y";'],
  ["outerHTML", "const h = ctx.scene.outerHTML;"],
  ["insertAdjacentHTML", 'ctx.scene.insertAdjacentHTML("beforeend", "y");'],
  ["document.write", 'document.write("x");'],
  ["window.open", 'window.open("x");'],
  ["location", "const l = location.href;"],
  ["navigator", "const n = navigator.userAgent;"],
  ["postMessage", 'postMessage("x");'],
  ["Worker", 'const w = new Worker("w");'],
];

// "document.write" and "window.open" also contain "document" or "window", each forbidden on its own.
const WITH_PARENT_WORD = { "document.write": "document", "window.open": "window" };

test("each forbidden scene word is rejected on its line, and only that line", () => {
  assert.equal(WORDS.length, 24, "the spec lists 24 original words");
  for (const [word, code] of WORDS) {
    const r = sceneLines(withLine(code));
    const expected = [word, WITH_PARENT_WORD[word]].filter(Boolean);
    assert.equal(r.length, expected.length, `${word}:\n${r.join("\n")}`);
    assert.ok(r.every((l) => l.startsWith("scene:3: ")), r.join("\n"));
    for (const e of expected) assert.ok(r.some((l) => l.includes(`«${e}»`)), `${word}: missing «${e}» in\n${r.join("\n")}`);
  }
});

// Added scene words: access to the window, document, global object and paths to the constructor.
const NEW_WORDS = [
  ["window", "const w = window;"],
  ["document", "const d = document;"],
  ["globalThis", "const g = globalThis;"],
  ["self", "const s = self;"],
  ["constructor", "const c = ctx.constructor;"],
  ["Reflect", "Reflect.get(ctx, 'x');"],
  ["opener", "const o = opener;"],
  ["frames", "const f = frames[0];"],
];

test("window, document, globalThis, self, constructor, Reflect, opener and frames are rejected as whole words only", () => {
  assert.equal(NEW_WORDS.length, 8);
  for (const [word, code] of NEW_WORDS) {
    const r = sceneLines(withLine(code));
    assert.equal(r.length, 1, `${word}:\n${r.join("\n")}`);
    assert.match(r[0], /^scene:3: /);
    assert.ok(r[0].includes(`«${word}»`), `${word}: ${r[0]}`);
  }
  // Also in comments and strings, and after a dot.
  assert.equal(sceneLines(withLine("// the window does not belong to the scene")).length, 1);
  assert.equal(sceneLines(withLine('const t = "document";')).length, 1);
  assert.equal(sceneLines(withLine("const w = ctx.window;")).length, 1);
  // Characterization: parent, top and this remain allowed (three.js uses obj.parent); similar words pass.
  const allowed = [
    "ctx.scene.add(box); box.parent.add(box); const topmost = 1, top = 2; this.x = 1;",
    "const selfie = 1, windows = 2, documents = 3, frame = 4, openers = 5, Reflection = 6, constructors = 7, globalThisArg = 8;",
  ];
  for (const code of allowed) assert.deepEqual(sceneLines(withLine(code)), [], code);
  assert.deepEqual(sceneLines(readFileSync(path.join(HERE, "..", "assets", "examples", "general-a.scene.js"), "utf8")), []);
});

test("escape sequences \\u and \\x are rejected anywhere in the text without echoing what they hide", () => {
  const cases = [
    ["\\u", 'const s = "\\u0066etch";'],
    ["\\u", "const s = '\\u{66}etch';"],
    ["\\u", "const s = `\\u0077indow`;"],
    ["\\x", 'const s = "\\x66etch";'],
    ["\\u", "// a comment with \\u0041"],
    ["\\x", "const re = /\\x41/;"],
    ["\\x", "const n = ctx.\\x66;"],
  ];
  for (const [escape, code] of cases) {
    const r = sceneLines(withLine(code));
    assert.equal(r.length, 1, `${code}:\n${r.join("\n")}`);
    assert.match(r[0], /^scene:3: /);
    assert.ok(r[0].includes(`«${escape}»`), `${code}: ${r[0]}`);
    assert.ok(!r[0].includes("0066") && !r[0].includes("etch"), `echoes the match: ${r[0]}`);
  }
  // A backslash followed by another letter, or "u" or "x" without a backslash, passes.
  assert.deepEqual(sceneLines(withLine('const s = "a\\nb\\tc", u = 1, x = 2, ux = "ux";')), []);
});

test("static rules scan the entire text: a cross-line match is reported on its starting line", () => {
  const split = [
    ["window.open", 'function scene(ctx) {\n  window\n  .open("x");\n}', 2],
    ["document.write", 'function scene(ctx) {\n  document.\n  write("x");\n}', 2],
    ["Function(", 'function scene(ctx) {\n  new Function\n  ("return 1");\n}', 2],
    ["Function(", 'function scene(ctx) {\n\n  Function\n\n\n  (1);\n}', 3],
    ["Function(", 'function scene(ctx) {\r\n  Function\r\n  ("return 1");\r\n}', 2],
    ["literal color", 'function scene(ctx) {\n  const c = rgb\n  (1, 2, 3);\n}', 2],
    ["literal color", 'function scene(ctx) {\n  const c = hsla\n\n  (1, 2, 3, 1);\n}', 2],
  ];
  for (const [rule, code, line] of split) {
    const r = sceneLines(code);
    assert.ok(r.length >= 1, `${rule}: found nothing`);
    assert.ok(r.every((l) => l.startsWith(`scene:${line}: `)), `${rule}: should be on line ${line}\n${r.join("\n")}`);
    assert.ok(r.some((l) => l.includes(rule === "literal color" ? "ctx.colors" : `«${rule}»`)), `${rule}:\n${r.join("\n")}`);
  }
});

test("one finding per rule per line, sorted by line", () => {
  // The same rule twice on one line yields one output line.
  assert.equal(sceneLines(withLine("fetch(a); fetch(b);")).length, 1);
  // Two matches starting on the same line, one split across lines, also yield one.
  const sameLine = sceneLines(withLine("window.open(1); window\n  .open(2);"));
  assert.deepEqual(sameLine.filter((l) => l.includes("«window.open»")).map((l) => l.slice(0, 8)), ["scene:3:"]);
  // Different rules on the same line yield one each; different lines are sorted.
  const code = ["function scene(ctx) {", "  eval(1);", "  window", "  .open(1);", '  const c = "#fff"; fetch(1);', "  eval(2);", "}"].join("\n");
  const r = sceneLines(code);
  const numbers = r.map((l) => Number(/^scene:(\d+): /.exec(l)[1]));
  assert.deepEqual(numbers, [...numbers].sort((a, b) => a - b), r.join("\n"));
  assert.deepEqual([...new Set(numbers)], [2, 3, 5, 6]);
  assert.equal(r.filter((l) => l.startsWith("scene:3: ")).length, 2, "window and window.open");
  assert.equal(r.filter((l) => l.startsWith("scene:5: ")).length, 2, "color and fetch");
  assert.equal(new Set(r).size, r.length, "repeated lines");
});

test("forbidden words also apply in comments and strings, but only as whole words", () => {
  assert.equal(sceneLines(withLine("// fetch is not allowed")).length, 1);
  assert.equal(sceneLines(withLine('const t = "location";')).length, 1);
  const similar = "const important = 1, evaluate = 2, relocation = 3, cookies = 4, exporter = 5, workers = 6, fetched = 7;";
  assert.deepEqual(sceneLines(withLine(similar)), []);
  assert.deepEqual(sceneLines(withLine("const Functions = 1; ctx.colors.highlight;")), []);
});

test("</script, <!-- and http:// or https:// addresses are rejected without echoing the address", () => {
  const cases = [
    ["</script", "const a = '</script>';"],
    ["</script", "const a = '</SCRIPT>';"],
    ["<!--", "const a = '<!-- x';"],
    ["http://", "const a = 'http://example.invalid/x?token=abc';"],
    ["https://", "const a = 'https://example.invalid/x?token=abc';"],
    ["https://", "const a = 'HTTPS://example.invalid/x';"],
  ];
  for (const [marker, code] of cases) {
    const r = sceneLines(withLine(code));
    assert.equal(r.length, 1, `${marker}:\n${r.join("\n")}`);
    assert.match(r[0], /^scene:3: /);
    assert.ok(!r[0].includes("example.invalid") && !r[0].includes("token"), `echoes the address: ${r[0]}`);
  }
});

test("literal colors are rejected (#rgb, #rrggbb, 0xrrggbb, rgb(, hsl(); ctx.colors passes", () => {
  const literals = [
    'const a = "#fff";',
    'const a = "#1a2B3c";',
    'const a = "#abcd";',
    'const a = "#11223344";',
    "const a = 0xff0000;",
    "const a = 0XFF00aa;",
    'const a = "rgb(1, 2, 3)";',
    'const a = "rgba(1, 2, 3, .5)";',
    'const a = "hsl(10, 20%, 30%)";',
    'const a = "hsla(10, 20%, 30%, .5)";',
    "// color #fff is forbidden even in comments",
  ];
  for (const code of literals) {
    const r = sceneLines(withLine(code));
    assert.equal(r.length, 1, `${code}:\n${r.join("\n")}`);
    assert.match(r[0], /^scene:3: .*ctx\.colors/);
  }
  // Color lookalikes: short hex number, "#" with 2 or 5 digits, and ctx colors.
  const passes = ['const a = 0xff, b = 0x12345, c = "#12", d = "#12345";', "const e = ctx.colors.series[0], f = ctx.colors.risk.high;"];
  for (const code of passes) assert.deepEqual(sceneLines(withLine(code)), [], code);
});

test("each violation yields a scene:<line> line, across different lines, in order", () => {
  const code = withLine('const b = "#fff"; fetch(ctx);', 2).replace("  ctx.scene.add(box);", "  ctx.scene.add(box); eval(1);");
  const r = sceneLines(code);
  assert.deepEqual(r.map((l) => l.split(":").slice(0, 2).join(":")), ["scene:2", "scene:2", "scene:5"]);
  assert.ok(r.every((l) => /^scene:\d+: \S/.test(l)));
  assert.deepEqual(sceneLines(42).length, 1);
});

// --- page

const BLOCK = /(<script type="application\/json" id="data">)([\s\S]*?)(<\/script>)/;
const SCENE_CODE = /<script id="scene-code">([\s\S]*?)<\/script>/;
// What the generator writes in <script id="scene-code">: scene code inside a strict function called without this,
// so the file's top level creates no globals and cannot see the window through this.
const sceneBlock = (scene) => `window.explainScene = (function () {\n"use strict";\n${scene}\nreturn scene;\n}).call(undefined);`;

test("a </script> in text is escaped in the page and the JSON reparses identically", () => {
  const d = good();
  d.nodes[0].technical = "A `// </script><script>alert(1)</script>` comment and `<!-- x -->` in code.";
  d.question = "What if text contains </script> and <b>HTML</b> & entities &amp;?";
  assert.deepEqual(lines(d), []);
  const page = generatePage(d, { template: FIXTURE_TEMPLATE });
  const m = BLOCK.exec(page);
  assert.ok(m, "the page lost its data block");
  assert.ok(!m[2].includes("<"), "the data block contains an unescaped <");
  assert.ok(m[2].includes("\\u003c/script>"), "</script> in text should become \\u003c/script>");
  assert.deepEqual(JSON.parse(m[2]), d);
  // The rest of the page neither gains nor loses a script closing tag.
  assert.equal(page.split("</script>").length, FIXTURE_TEMPLATE.split("</script>").length);
});

test("a title with < and & is escaped in <title>, and the marker disappears", () => {
  const page = generatePage(good({ title: "The <b> & 'c'" }), { template: FIXTURE_TEMPLATE });
  assert.equal(/<title>([^]*?)<\/title>/.exec(page)[1], "The &lt;b&gt; &amp; &#39;c&#39;");
  assert.equal(/<title>([^]*?)<\/title>/.exec(generatePage(good({ title: 'One "two"' }), { template: FIXTURE_TEMPLATE }))[1], "One &quot;two&quot;");
  assert.equal(page.split("<title>").length, 2, "more than one <title>");
  assert.ok(!page.includes("{{title}}"), "the marker stayed in the page");
});

test("JavaScript replacement patterns ($&, $1) remain literal in data and scene", () => {
  const d = good({ title: "Costs $& and $1" });
  d.nodes[0].simple = "The symbols $& and $' and $` do not change.";
  const scene = `${GOOD_SCENE}\n// costs $& and $' and $\``;
  const page = generatePage(d, { template: FIXTURE_TEMPLATE, scene });
  assert.match(page, /<title>Costs \$&amp; and \$1<\/title>/);
  assert.deepEqual(JSON.parse(BLOCK.exec(page)[2]), d);
  assert.equal(SCENE_CODE.exec(page)[1], sceneBlock(scene));
});

test("scene enters the template's scene-code script inside a strict function and is assigned to window.explainScene", () => {
  const page = generatePage(withView("scene"), { template: FIXTURE_TEMPLATE, scene: GOOD_SCENE });
  assert.equal(SCENE_CODE.exec(page)[1], sceneBlock(GOOD_SCENE));
  assert.equal(page.split('id="scene-code"').length, 2);
  // Without a scene, the slot stays empty.
  const without = generatePage(good(), { template: FIXTURE_TEMPLATE });
  assert.equal(SCENE_CODE.exec(without)[1], "");
  // A template without a scene slot only works without a scene.
  assert.doesNotThrow(() => generatePage(good(), { template: TEMPLATE_WITHOUT_SCENE }));
  assert.throws(() => generatePage(withView("scene"), { template: TEMPLATE_WITHOUT_SCENE, scene: GOOD_SCENE }), /the template has no place for the scene/);
});

test("the scene's top level creates no globals or window access through this, and code stays strict", () => {
  const scene = [
    "var loose = 1;",
    "const seen = this;",
    "function helper() { return 2; }",
    "function scene(ctx) { return [loose + helper(), seen, this]; }",
  ].join("\n");
  const page = generatePage(withView("scene"), { template: FIXTURE_TEMPLATE, scene });
  const window = {};
  const context = vm.createContext({ window });
  vm.runInContext(SCENE_CODE.exec(page)[1], context);
  assert.equal(typeof window.explainScene, "function");
  assert.deepEqual(Object.keys(context), ["window"], "the scene's top level created globals");
  assert.deepEqual(Object.keys(window), ["explainScene"], "the scene only hands over its function");
  // The frame calls it without this: neither the top level nor the function sees the window.
  const r = window.explainScene.call(undefined, {});
  assert.equal(r[0], 3);
  assert.equal(r[1], undefined, "file's top-level this");
  assert.equal(r[2], undefined, "this within the scene");
  // Strict: assigning an undeclared name throws instead of creating a global.
  const loose = generatePage(withView("scene"), { template: FIXTURE_TEMPLATE, scene: "function scene(ctx) { newName = 1; }" });
  const w2 = {};
  vm.runInContext(SCENE_CODE.exec(loose)[1], vm.createContext({ window: w2 }));
  assert.throws(() => w2.explainScene.call(undefined, {}), (e) => e.name === "ReferenceError");
});

test("a template missing data or title markers generates nothing", () => {
  assert.throws(() => generatePage(good(), { template: FIXTURE_TEMPLATE.replace('id="data"', 'id="other"') }), /block/);
  assert.throws(() => generatePage(good(), { template: FIXTURE_TEMPLATE.replace("{{title}}", "x") }), /<title>/);
});

// --- command line

function run(args, { script = SCRIPT } = {}) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
  return { status: r.status, out: r.stdout, err: r.stderr };
}
function folder(t) {
  const p = mkdtempSync(path.join(tmpdir(), "generate-page-"));
  t.after(() => rmSync(p, { recursive: true, force: true }));
  return p;
}
// Copy the script beside a chosen template: it looks for ../assets/viewer.html.
function withTemplate(t, template) {
  const root = folder(t);
  mkdirSync(path.join(root, "scripts"));
  mkdirSync(path.join(root, "assets"));
  copyFileSync(SCRIPT, path.join(root, "scripts", "generate-page.mjs"));
  writeFileSync(path.join(root, "assets", "viewer.html"), template);
  return path.join(root, "scripts", "generate-page.mjs");
}
const write = (p, name, content) => {
  const f = path.join(p, name);
  writeFileSync(f, typeof content === "string" ? content : JSON.stringify(content));
  return f;
};

test("exits 0 and writes the page", (t) => {
  const p = folder(t);
  const data = write(p, "d.json", good());
  const output = path.join(p, "page.html");
  const script = withTemplate(t, FIXTURE_TEMPLATE);
  const r = run([data, "--out", output], { script });
  assert.equal(r.status, 0, r.err);
  const html = readFileSync(output, "utf8");
  assert.match(html, /<title>Page generator<\/title>/);
  assert.deepEqual(JSON.parse(BLOCK.exec(html)[2]), good());
  assert.equal(SCENE_CODE.exec(html)[1], "", "without --scene the scene slot stays empty");
  // Arguments may appear in any order.
  const other = path.join(p, "other.html");
  assert.equal(run(["--out", other, data], { script }).status, 0);
  assert.ok(existsSync(other));
});

test("exits 0 with --scene and embeds the scene in the page", (t) => {
  const p = folder(t);
  const data = write(p, "d.json", withView("scene"));
  const scene = write(p, "scene.js", GOOD_SCENE);
  const output = path.join(p, "page.html");
  const r = run([data, "--scene", scene, "--out", output], { script: withTemplate(t, FIXTURE_TEMPLATE) });
  assert.equal(r.status, 0, r.err);
  assert.equal(SCENE_CODE.exec(readFileSync(output, "utf8"))[1], sceneBlock(GOOD_SCENE));
  // With the option before the data file.
  const other = path.join(p, "other.html");
  assert.equal(run(["--scene", scene, data, "--out", other], { script: withTemplate(t, FIXTURE_TEMPLATE) }).status, 0);
});

test("exits 0 with the real template and a document without a scene", (t) => {
  const p = folder(t);
  const output = path.join(p, "page.html");
  const r = run([write(p, "d.json", good()), "--out", output]);
  assert.equal(r.status, 0, r.err);
  const html = readFileSync(output, "utf8");
  assert.match(html, /<title>Page generator<\/title>/);
  assert.deepEqual(JSON.parse(BLOCK.exec(html)[2]), good());
});

test("also runs through a symlink (install.sh --link), and does not exit 0 without writing", (t) => {
  const p = folder(t);
  const link = path.join(p, "linked-skill");
  symlinkSync(path.join(HERE, ".."), link);
  const output = path.join(p, "page.html");
  const r = run([write(p, "d.json", good()), "--out", output], { script: path.join(link, "scripts", "generate-page.mjs") });
  assert.equal(r.status, 0, r.err);
  assert.ok(existsSync(output), "exited 0 without writing the page");
  // Invalid data still exits 1 through this link.
  assert.equal(run([write(p, "bad.json", good({ version: 1 })), "--out", path.join(p, "x.html")], { script: path.join(link, "scripts", "generate-page.mjs") }).status, 1);
});

test("exits 1 with one line per violated rule and creates no output file", (t) => {
  const p = folder(t);
  const data = write(p, "d.json", good({ version: 3, title: "One", steps: [] }));
  const output = path.join(p, "page.html");
  const script = withTemplate(t, FIXTURE_TEMPLATE);
  const r = run([data, "--out", output], { script });
  assert.equal(r.status, 1);
  const l = r.err.trim().split("\n");
  assert.equal(l.length, 3, r.err);
  assert.ok(l.every((x) => /^[\w.[\]]+: \S/.test(x)), r.err);
  assert.ok(!existsSync(output), "the output file was created");
  // An existing file stays unchanged.
  writeFileSync(output, "old");
  assert.equal(run([data, "--out", output], { script }).status, 1);
  assert.equal(readFileSync(output, "utf8"), "old");
});

test("exits 1 with scene:<line> lines when a scene violates a rule, without creating the file", (t) => {
  const p = folder(t);
  const data = write(p, "d.json", withView("scene"));
  const scene = write(p, "scene.js", withLine('const x = "#fff"; fetch(ctx);'));
  const output = path.join(p, "page.html");
  const r = run([data, "--scene", scene, "--out", output], { script: withTemplate(t, FIXTURE_TEMPLATE) });
  assert.equal(r.status, 1);
  const l = r.err.trim().split("\n");
  assert.equal(l.length, 2, r.err);
  assert.ok(l.every((x) => /^scene:3: \S/.test(x)), r.err);
  assert.ok(!existsSync(output));
});

test("exits 1 for --scene without a scene view, and a scene view without --scene", (t) => {
  const p = folder(t);
  const script = withTemplate(t, FIXTURE_TEMPLATE);
  const output = path.join(p, "page.html");
  const scene = write(p, "scene.js", GOOD_SCENE);
  const noView = run([write(p, "a.json", good()), "--scene", scene, "--out", output], { script });
  assert.equal(noView.status, 1);
  assert.match(noView.err, /^scene: .*no view/m);
  const noScene = run([write(p, "b.json", withView("scene")), "--out", output], { script });
  assert.equal(noScene.status, 1);
  assert.match(noScene.err, /^views\[0\]: .*requires --scene/m);
  assert.ok(!existsSync(output));
});

test("exits 2 on usage or read errors", (t) => {
  const p = folder(t);
  const d = write(p, "d.json", good());
  const scene = write(p, "scene.js", GOOD_SCENE);
  const output = path.join(p, "page.html");
  write(p, "bad.json", "{ not json");
  const cases = [
    [[], "no arguments"],
    [[d], "no --out"],
    [["--out", output], "no data file"],
    [[d, "--out"], "--out without a value"],
    [[d, "--scene", "--out", output], "--scene without a value"],
    [[d, "--out", output, "--scene"], "--scene at the end, without a value"],
    [[d, "--scene", scene, "--scene", scene, "--out", output], "two scenes"],
    [[d, "--out", output, "--extra"], "unknown option"],
    [[d, "other.json", "--out", output], "two data files"],
    [[path.join(p, "missing.json"), "--out", output], "missing data file"],
    [[path.join(p, "bad.json"), "--out", output], "invalid JSON"],
    [[p, "--out", output], "data is a directory"],
    [[d, "--scene", path.join(p, "missing.js"), "--out", output], "missing scene file"],
    [[d, "--scene", p, "--out", output], "scene is a directory"],
  ];
  for (const [args, name] of cases) {
    const r = run(args);
    assert.equal(r.status, 2, `${name}: exited ${r.status}\n${r.err}`);
    assert.ok(r.err.trim().length > 0, `${name}: no message`);
    assert.ok(!existsSync(output), `${name}: created output`);
  }
});

test("exits 2 for invalid JSON without echoing file contents, and read errors retain their code", (t) => {
  const p = folder(t);
  const output = path.join(p, "page.html");
  // A key-like value in broken JSON: JSON.parse's error would quote part of the file.
  const bad = write(p, "bad.json", '{"x": sk-test-ABCDEFGHIJKLMNOP}');
  const r = run([bad, "--out", output]);
  assert.equal(r.status, 2, r.err);
  assert.equal(r.err.trim(), `generate-page: ${bad} is not valid JSON`);
  assert.ok(!r.err.includes("ABCDEFGH") && !r.err.includes("sk-test") && !r.err.includes("Unexpected"), r.err);
  assert.ok(!existsSync(output));
  // Also when JSON is truncated midway through text containing personal data.
  const truncated = write(p, "truncated.json", '{"intro": {"simple": "Library member Example Person, national id 123456789');
  const t2 = run([truncated, "--out", output]);
  assert.equal(t2.status, 2);
  assert.equal(t2.err.trim(), `generate-page: ${truncated} is not valid JSON`);
  // Read errors still report their error code (which carries no content).
  const missing = run([path.join(p, "missing.json"), "--out", output]);
  assert.equal(missing.status, 2);
  assert.match(missing.err, /ENOENT/);
  const folderAsData = run([p, "--out", output]);
  assert.equal(folderAsData.status, 2);
  assert.match(folderAsData.err, /could not read/);
});

test("exits 2 with 'the template has no place for the scene' when the scene-code script is missing", (t) => {
  const p = folder(t);
  const data = write(p, "d.json", withView("scene"));
  const scene = write(p, "scene.js", GOOD_SCENE);
  const output = path.join(p, "page.html");
  const r = run([data, "--scene", scene, "--out", output], { script: withTemplate(t, TEMPLATE_WITHOUT_SCENE) });
  assert.equal(r.status, 2, r.err);
  assert.match(r.err, /the template has no place for the scene/);
  assert.ok(!existsSync(output));
  // The same template works without a scene.
  assert.equal(run([write(p, "b.json", good()), "--out", output], { script: withTemplate(t, TEMPLATE_WITHOUT_SCENE) }).status, 0);
});

// --- real template

// The template's CSP restricts network access: only jsDelivr loads code, and no requests leave the page (fetch,
// images, frames, workers or forms). It does not cover navigation or WebRTC. Fix the exact text so the test
// reports any expansion of the policy.
const CSP = "default-src 'none'; script-src 'unsafe-inline' https://cdn.jsdelivr.net ; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; base-uri 'none'; form-action 'none'";
const META_CSP = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/g;

test("the real template restricts network access with the approved CSP, before any script or style", () => {
  const m = readFileSync(TEMPLATE, "utf8");
  const metas = [...m.matchAll(META_CSP)];
  assert.equal(metas.length, 1, "exactly one CSP meta");
  assert.equal(metas[0][1], CSP);
  const first = Math.min(...["<script", "<style"].map((t) => m.indexOf(t)).filter((i) => i >= 0));
  assert.ok(metas[0].index < first, "CSP precedes the first script or style");
});

// 3d-force-graph is a single file: load with checksum (SRI) and anonymous crossOrigin; the browser rejects
// different contents from jsDelivr. The three modules have no hash: jsDelivr's +esm files are generated
// by the service and their hash is not guaranteed.
const GRAPH_SRI = "sha384-i98VDQKdpyVrtyuFn0fjUWJBLBmxnqHqOANcvYe9HLJUgT2wPixa4ZkLd7Dh3VEk";

test("the real template loads 3d-force-graph with integrity and crossOrigin, its hash beside the address", () => {
  const m = readFileSync(TEMPLATE, "utf8");
  const adjacent = new RegExp(`graph: 'https://cdn\\.jsdelivr\\.net/npm/3d-force-graph@1\\.80\\.1/dist/3d-force-graph\\.min\\.js',\\s*graphSri: '${GRAPH_SRI}',`);
  assert.match(m, adjacent);
  assert.match(m, /s\.src = URLS\.graph;\s*s\.integrity = URLS\.graphSri;\s*s\.crossOrigin = 'anonymous';/);
  assert.equal(m.split(GRAPH_SRI).length, 2, "the hash appears exactly once");
  // The three modules have no hash; the template explains why.
  assert.doesNotMatch(m, /three:[^\n]*sha384|orbit:[^\n]*sha384|css2d:[^\n]*sha384/);
  assert.match(m, /\+esm[^\n]*generated by the service|generated by the service[^\n]*\+esm/);
});

test("every literal http(s) template address is approved", () => {
  // Exclude the jsDelivr origin in the CSP: the CSP test fixes it.
  const m = readFileSync(TEMPLATE, "utf8").replace(META_CSP, "");
  const APPROVED = [
    "https://cdn.jsdelivr.net/npm/3d-force-graph@1.80.1/dist/3d-force-graph.min.js",
    "https://cdn.jsdelivr.net/npm/three@0.186.1/+esm",
  ];
  const ADDONS = /^https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.186\.1\/examples\/jsm\/[A-Za-z0-9/_.-]+\.js\/\+esm$/;
  const found = [...m.matchAll(/https?:\/\/[^\s"'<>)`]+/g)].map((x) => x[0]);
  assert.ok(found.length > 0, "the template should load at least one library");
  const outside = found.filter((u) => !APPROVED.includes(u) && !ADDONS.test(u));
  assert.deepEqual(outside, [], "external address outside the approved list");
});

test("the real template has exactly one data block and one title marker", () => {
  const m = readFileSync(TEMPLATE, "utf8");
  assert.equal([...m.matchAll(/<script type="application\/json" id="data">/g)].length, 1);
  assert.equal([...m.matchAll(/<title>\{\{title\}\}<\/title>/g)].length, 1);
});

// --- examples in assets/examples/

// Examples are valid data: they show schema 2 in action and provide a starting point. If a schema or rule change
// invalidates an example, this test reports it. Code example citations are fixed at each example's `base`;
// here, only check that paths exist in the repo.
import vm from "node:vm"; // only the scene and viewer execution tests use it

const EXAMPLES = path.join(HERE, "..", "assets", "examples");
const REPO_ROOT = path.join(HERE, "..", "..", "..");
const example = (name) => readFileSync(path.join(EXAMPLES, name), "utf8");
const dataFrom = (name) => JSON.parse(example(name));
const PATH_LINES = /^(.+?):(\d+)(?:-(\d+))?$/;

// An object accepting everything (properties, calls and constructors): run a scene without three.js to prove
// registrations and that its animation does not throw. The drawing itself is checked in a browser.
function anything() {
  const p = new Proxy(function () {}, {
    get: (_, k) => (k === Symbol.toPrimitive ? () => 0 : p),
    set: () => true,
    apply: () => p,
    construct: () => p,
  });
  return p;
}

function runScene(code, { reducedMotion = false } = {}) {
  const window = {};
  vm.runInNewContext(sceneBlock(code), { window }); // the block the generator writes into the page
  const fn = window.explainScene;
  const registered = [];
  const labels = [];
  const animations = [];
  const ctx = {
    THREE: anything(),
    scene: anything(),
    camera: anything(),
    colors: { background: "b", ink: "i", muted: "m", line: "l", highlight: "h", neutral: "n", series: ["s0", "s1", "s2", "s3"], risk: { low: "l", medium: "m", high: "h" } },
    element: (id) => { registered.push(id); },
    label: (text) => { labels.push(text); return anything(); },
    animate: reducedMotion ? undefined : (fn) => { animations.push(fn); },
    reducedMotion,
    touch: false,
  };
  fn(ctx);
  for (let i = 0; i < 300; i++) for (const fn of animations) fn(0.016);
  return { registered, labels, animations: animations.length };
}

test("examples cover code in profiles B and C and a general topic in profile A", () => {
  const combinations = ["code-b.json", "code-c.json", "general-a.json"].map((n) => {
    const d = dataFrom(n);
    return `${d.topic}/${d.profile}/${d.granularity}/${d.objective}`;
  });
  assert.deepEqual(combinations, ["code/B/components/understand", "code/C/detail/change", "general/A/blocks/understand"]);
});

test("code-b.json passes validation, is profile B and generates the page", () => {
  const d = dataFrom("code-b.json");
  assert.deepEqual(validate(d), []);
  assert.match(d.base, /^[0-9a-f]{40}$/);
  assert.deepEqual(d.views.map((v) => v.type), ["graph", "sequence"]);
  assert.ok(d.nodes.length > 8 && d.nodes.length <= 60, "components: more than blocks");
  assert.ok(d.nodes.every((n) => !("risk" in n)), "risk belongs to profile C");
  const html = generatePage(d, { template: FIXTURE_TEMPLATE });
  assert.match(html, /<title>The agentic-explain skill<\/title>/);
});

test("code-c.json passes validation, is profile C and includes risk and mode", () => {
  const d = dataFrom("code-c.json");
  assert.deepEqual(validate(d), []);
  assert.match(d.base, /^[0-9a-f]{40}$/);
  assert.deepEqual(d.views.map((v) => v.type), ["layers", "states"]);
  assert.ok(d.nodes.every((n) => ["low", "medium", "high"].includes(n.risk)), "each node has its risk");
  const edges = d.views.flatMap((v) => v.edges ?? []);
  assert.ok(edges.length > 0 && edges.every((e) => ["sync", "async"].includes(e.mode)), "each edge has its mode");
  assert.ok(d.nodes.some((n) => n.risk === "high"), "a risk example shows high risk");
  assert.match(generatePage(d, { template: FIXTURE_TEMPLATE }), /<title>The generate-page CLI<\/title>/);
});

test("general-a.json passes validation with its scene, is profile A and cites sources read", () => {
  const d = dataFrom("general-a.json");
  const scene = example("general-a.scene.js");
  assert.deepEqual(validate(d, scene), []);
  assert.deepEqual(validateScene(scene), []);
  assert.ok(d.nodes.length >= 5 && d.nodes.length <= 8, "blocks: 5 to 8 nodes");
  assert.ok(d.views.some((v) => v.type === "scene"), "includes a scene view");
  assert.ok(!("area" in d) && !("base" in d), "general topics have no area or base");
  assert.ok(d.nodes.every((n) => !("risk" in n)));
  const urls = new Set(d.sources.map((s) => s.url));
  assert.ok(d.sources.every((s) => s.read_at === "2026-10-31"), "each source has its read date");
  assert.ok(d.steps.every((p) => p.citations.some((c) => urls.has(c))), "each step cites a source");
  assert.ok(d.sources.every((s) => d.steps.some((p) => p.citations.includes(s.url))), "no source left uncited");
  const html = generatePage(d, { scene, template: FIXTURE_TEMPLATE });
  assert.equal(SCENE_CODE.exec(html)[1], sceneBlock(scene));
});

test("general-a's scene registers exactly its view's nodes and its animation does not throw", () => {
  const d = dataFrom("general-a.json");
  const scene = example("general-a.scene.js");
  const view = d.views.find((v) => v.type === "scene");
  const r = runScene(scene);
  assert.deepEqual([...r.registered].sort(), [...view.nodes].sort());
  assert.ok(r.labels.length >= view.nodes.length && r.labels.every((t) => typeof t === "string" && t.trim() !== ""));
  assert.equal(r.animations, 1, "one animation, only when motion is enabled");
  // With reduced motion, the scene requests no animation and still registers everything.
  const still = runScene(scene, { reducedMotion: true });
  assert.equal(still.animations, 0);
  assert.deepEqual([...still.registered].sort(), [...view.nodes].sort());
});

test("examples generate through the CLI (0), and general-a without its scene exits 1", (t) => {
  const p = folder(t);
  const script = withTemplate(t, FIXTURE_TEMPLATE);
  for (const name of ["code-b", "code-c"]) {
    const output = path.join(p, `${name}.html`);
    const r = run([path.join(EXAMPLES, `${name}.json`), "--out", output], { script });
    assert.equal(r.status, 0, `${name}: ${r.err}`);
    assert.ok(existsSync(output));
  }
  const output = path.join(p, "general-a.html");
  const r = run([path.join(EXAMPLES, "general-a.json"), "--scene", path.join(EXAMPLES, "general-a.scene.js"), "--out", output], { script });
  assert.equal(r.status, 0, r.err);
  assert.match(readFileSync(output, "utf8"), /window\.explainScene = \(function \(\) \{\n"use strict";\n/);
  // Without its scene, general-a is rejected: a scene view requires --scene.
  const without = run([path.join(EXAMPLES, "general-a.json"), "--out", path.join(p, "without.html")], { script });
  assert.equal(without.status, 1);
  assert.match(without.err, /scene/);
});

test("code example citations point to existing files, never to the template", () => {
  for (const name of ["code-b.json", "code-c.json"]) {
    const d = dataFrom(name);
    const cited = [
      ...d.nodes.flatMap((n) => n.files ?? []),
      ...d.views.flatMap((v) => (v.edges ?? []).map((e) => e.ref).filter(Boolean)),
      ...d.steps.flatMap((p) => p.citations),
    ];
    assert.ok(cited.length > 20, `${name}: too few citations`);
    for (const c of cited) {
      const m = PATH_LINES.exec(c);
      assert.ok(m, `${name}: ${c} is neither path:N nor path:N-M`);
      assert.ok(existsSync(path.join(REPO_ROOT, m[1])), `${name}: ${m[1]} does not exist in the repo`);
      assert.ok(!m[1].endsWith("viewer.html"), `${name}: the template changes in its lane; examples do not cite its lines`);
    }
    assert.ok(existsSync(path.join(REPO_ROOT, d.area)), `${name}: area ${d.area} does not exist`);
  }
});

// --- English data → real viewer → DOM

// The DOM is a browser boundary double, with WebGL explicitly unavailable. Execute the actual viewer
// script and assert visible content and navigation; this does not claim to prove WebGL drawing.
async function openViewer(data, { query = "", scene = null } = {}) {
  const html = generatePage(data, { scene });
  const listeners = new Map();
  class Element {
    constructor(tag) {
      this.tagName = tag;
      this.attributes = new Map();
      this.children = [];
      this.dataset = {};
      this.style = {};
      this.listeners = new Map();
      this.classList = { contains: (name) => (this.attributes.get("class") || "").split(/\s+/).includes(name) };
    }
    setAttribute(key, value) {
      this.attributes.set(key, String(value));
      if (key === "id") this.id = String(value);
      if (key.startsWith("data-")) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value);
    }
    getAttribute(key) { return this.attributes.get(key) ?? null; }
    removeAttribute(key) { this.attributes.delete(key); }
    toggleAttribute(key, enabled) { if (enabled) this.setAttribute(key, ""); else this.removeAttribute(key); }
    append(...children) {
      for (const child of children) {
        if (child instanceof Element) {
          if (child.parentElement) child.parentElement.children = child.parentElement.children.filter((x) => x !== child);
          child.parentElement = this;
        }
        this.children.push(child);
      }
    }
    appendChild(child) { this.append(child); return child; }
    insertAdjacentElement(position, child) {
      assert.equal(position, "afterend");
      if (child.parentElement) child.parentElement.children = child.parentElement.children.filter((x) => x !== child);
      const parent = this.parentElement;
      parent.children.splice(parent.children.indexOf(this) + 1, 0, child);
      child.parentElement = parent;
      return child;
    }
    replaceChildren(...children) { this.children.forEach((c) => { if (c instanceof Element) c.parentElement = null; }); this.children = []; this.append(...children); }
    get textContent() { return this.children.map((c) => c instanceof Element ? c.textContent : String(c)).join(""); }
    set textContent(value) { this.replaceChildren(String(value)); }
    addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(fn); }
    matchesSimple(selector) {
      const tag = /^[a-z][\w-]*/i.exec(selector)?.[0];
      if (tag && tag !== this.tagName) return false;
      for (const m of selector.matchAll(/([.#])([\w-]+)/g)) {
        if (m[1] === "#" ? this.id !== m[2] : !this.classList.contains(m[2])) return false;
      }
      for (const m of selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)) {
        if (!this.attributes.has(m[1]) || (m[2] !== undefined && this.getAttribute(m[1]) !== m[2])) return false;
      }
      return true;
    }
    matches(selector) {
      const parts = selector.trim().split(/\s+/);
      if (!this.matchesSimple(parts.pop())) return false;
      let ancestor = this.parentElement;
      while (parts.length) {
        const part = parts.pop();
        while (ancestor && !ancestor.matchesSimple(part)) ancestor = ancestor.parentElement;
        if (!ancestor) return false;
        ancestor = ancestor.parentElement;
      }
      return true;
    }
    querySelectorAll(selector) {
      const choices = selector.split(",");
      const found = [];
      const visit = (el) => {
        for (const c of el.children) if (c instanceof Element) {
          if (choices.some((s) => c.matches(s))) found.push(c);
          visit(c);
        }
      };
      visit(this);
      return found;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) ?? null; }
    focus() { document.activeElement = this; }
    getBoundingClientRect() { return { top: 0, bottom: 100, left: 0, width: 640, height: 420 }; }
    scrollIntoView() {}
  }
  const root = new Element("html");
  const document = {
    documentElement: root,
    createElement: (tag) => new Element(tag),
    createDocumentFragment: () => new Element("fragment"),
    querySelector: (s) => root.querySelector(s),
    querySelectorAll: (s) => root.querySelectorAll(s),
    getElementById: (id) => root.querySelector(`#${id}`),
    addEventListener: (type, fn) => { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
  };
  // Parse only the template's static body. Insert the generated data block as text, as a browser does.
  const body = /<body>([^]*?)<\/body>/.exec(html)[1].replace(/<script\b[^>]*>[^]*?<\/script>/g, "");
  const stack = [root];
  for (const m of body.matchAll(/<(\/)?([\w-]+)([^>]*)>|([^<]+)/g)) {
    if (m[4]) { stack.at(-1).append(m[4]); continue; }
    if (m[1]) { stack.pop(); continue; }
    const el = new Element(m[2]);
    for (const attr of m[3].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) el.setAttribute(attr[1], attr[2] ?? "");
    stack.at(-1).append(el);
    if (!["br", "wbr", "input", "img", "meta", "link"].includes(m[2])) stack.push(el);
  }
  const dataElement = new Element("script");
  dataElement.setAttribute("id", "data");
  dataElement.textContent = BLOCK.exec(html)[2];
  root.append(dataElement);
  const window = { scrollY: 0, innerHeight: 900, scrollTo() {} };
  const context = vm.createContext({
    document, window, location: { search: `?no-webgl=1${query}` }, URL, URLSearchParams,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    MutationObserver: class { observe() {} },
  });
  new vm.Script(/<script>\n([^]*?)<\/script>/.exec(html)[1]).runInContext(context);
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  await settle();
  const click = async (element) => {
    assert.ok(element, "click target exists");
    const event = { target: element, preventDefault() {} };
    for (let el = element; el; el = el.parentElement) for (const fn of el.listeners.get("click") ?? []) fn(event);
    for (const fn of listeners.get("click") ?? []) fn(event);
    await settle();
  };
  return { document, click };
}

test("all English examples render their data, switch text level, select tabs and open nodes in the real viewer", async () => {
  for (const name of ["code-b.json", "code-c.json", "general-a.json"]) {
    const d = dataFrom(name);
    const { document, click } = await openViewer(d, { scene: d.topic === "general" ? example("general-a.scene.js") : null });
    const $ = (s) => document.querySelector(s);
    const initialLevel = d.profile === "A" ? "simple" : "technical";
    assert.equal($("#title").textContent, d.title, name);
    assert.ok($("#intro").textContent.includes(d.intro[initialLevel].replaceAll("`", "")), name);
    assert.ok($("#document").textContent.includes(d.question), name);
    assert.equal($("#index").querySelectorAll(".node").length, d.nodes.length);
    if (d.profile === "A") assert.ok($("#concepts").textContent.includes(d.concepts[0].term));
    else assert.ok($("#glossary").textContent.includes(d.concepts[0].term));
    for (const [i, view] of d.views.entries()) {
      await click($(`#tab-${i}`));
      const panel = $("#view-panel");
      const activeBody = $(`.view-body[data-view="${i}"]`);
      assert.equal(panel.getAttribute("aria-labelledby"), `tab-${i}`);
      assert.equal(activeBody.hidden, false);
      assert.ok(activeBody.textContent.includes("The 3D views could not open in this browser."));
      if (view.type === "states") assert.ok(activeBody.textContent.includes("Initial: "));
    }
    const otherLevel = initialLevel === "simple" ? "technical" : "simple";
    await click($(`button[data-level="${otherLevel}"]`));
    assert.ok($("#intro").textContent.includes(d.intro[otherLevel].replaceAll("`", "")));
    await click($("#index .node"));
    assert.ok($("#document").hidden);
    assert.ok($("#node-block").textContent.includes(d.nodes[0][otherLevel].replaceAll("`", "")));
    if (d.profile === "C") assert.ok($("#node-block").textContent.includes(`Risk ${d.nodes[0].risk}`));
    await click($("#back"));
    assert.equal($("#document").hidden, false);
    await click($(".step-header"));
    assert.equal($(".step-header").getAttribute("aria-pressed"), "true");
    assert.ok(document.querySelectorAll(".node[data-highlighted]").length > 0);
    assert.ok($(".legend .dot"), "legend uses the styled dot selector");
    if (d.topic === "code") assert.ok($("#index .path"), "code labels use the styled path selector");
  }
});

test("the viewer reads every English catalog shape and URL option through the generated page", async () => {
  const expected = {
    graph: "Edges, as text:", layers: "Layers, top to bottom", sequence: "Messages, in the order",
    states: "Initial: read", timeline: "Events, in order", scene: "The elements of this view:",
  };
  for (const type of Object.keys(VIEWS)) {
    const d = withView(type);
    const { document } = await openViewer(d, { query: "&theme=dark&flat=1&level=simple&step=1&node=read&view=v1", scene: type === "scene" ? GOOD_SCENE : null });
    assert.ok(document.querySelector("#view-panel").textContent.includes(expected[type]), type);
    assert.equal(document.documentElement.getAttribute("data-theme"), "dark");
    assert.equal(document.querySelector("button[data-level=\"simple\"]").getAttribute("aria-pressed"), "true");
  }
});
