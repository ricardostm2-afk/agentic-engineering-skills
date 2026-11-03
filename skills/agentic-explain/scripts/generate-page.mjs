#!/usr/bin/env node
// Validate explanation data (and a scene, if present) and write the page from assets/viewer.html.
//
// Usage: node generate-page.mjs <data.json> [--scene <scene.js>] --out <page.html>
// Exit: 0 wrote the page;
//       1 invalid data or scene: one line per violated rule ("field: what failed"; for scenes,
//         "scene:<line>: what failed"), on stderr, and nothing is written;
//       2 usage or read error (arguments, files, invalid JSON, template, writing).
// Schema 2 and its rules are in references/data.md; scenes are in references/scene.md.
// Also exports `validate` (data, plus scene cross-checks), `validateScene` (static scene code
// rules) and `generatePage`.

import { mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.join(HERE, "..", "assets", "viewer.html");

const TOPICS = ["code", "general"];
const PROFILES = ["A", "B", "C"];
const GRANULARITIES = ["blocks", "components", "detail"];
const OBJECTIVES = ["understand", "solve", "change"];
const VIEWS = ["graph", "layers", "sequence", "states", "timeline", "scene"];
const RISKS = ["low", "medium", "high"];
const MODES = ["sync", "async"];

// `path:N` or `path:N-M` (N and M start at 1). The path has no spaces and may contain ":", but is relative to
// the root read: no leading scheme ("javascript:", "data:", "C:"), "/", "\" or "~", and no ".." segment.
const CITATION = /^(\S+):([1-9]\d*)(?:-([1-9]\d*))?$/;
const CITATION_FORM = "must have the form path:N or path:N-M, with M at least N, and a root-relative path (no scheme, no leading /, no ..)";
const relativePath = (p) => !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(p) && !/^[\\/~]/.test(p) && !p.split(/[\\/]/).includes("..");
const isUrl = (v) => typeof v === "string" && /^https?:\/\//i.test(v);

// Obvious key patterns. Require a key's shape, not just its prefix, so "risk-based" and "task-queue" pass.
const SECRETS = [
  /\bsk-[A-Za-z0-9_-]{10,}/,
  /\bghp_[A-Za-z0-9]{10,}/,
  /\bgithub_pat_[A-Za-z0-9_]{10,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /-----BEGIN\b/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
  /\bAIza[0-9A-Za-z_-]{30,}/,
  /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\./,
];
// No output line repeats a suspicious value: a pattern match becomes "[hidden]".
const redact = (text) => SECRETS.reduce((t, re) => t.replace(new RegExp(re.source, "g"), "[hidden]"), text);
// A data value within a message: quoted, redacted and truncated to 40 characters.
const echo = (v) => {
  const t = redact(typeof v === "string" ? v : (JSON.stringify(v) ?? ""));
  return `"${t.length > 40 ? `${t.slice(0, 40)}…` : t}"`;
};

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isText = (v) => typeof v === "string";
const empty = (v) => !isText(v) || v.trim() === "";
const list = (values) => (values.length === 2 ? values.join(" or ") : `${values.slice(0, -1).join(", ")} or ${values.at(-1)}`);
const validDate = (v) => {
  if (!isText(v) || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

// Return "field: what failed" lines, one per violated rule; empty when the data passes.
// `scene` is the text of the file passed to --scene, or null/undefined if absent: a scene view requires it
// and it requires a scene view. Static scene code rules belong to `validateScene`.
export function validate(data, scene = null) {
  const errors = [];
  const fail = (field, msg) => errors.push(redact(`${field}: ${msg}`));
  if (!isObject(data)) return ["data: must be a JSON object"];

  if (data.version !== 2) fail("version", "must be 2");
  if (!TOPICS.includes(data.topic)) fail("topic", `must be ${list(TOPICS)}`);
  const profileOk = PROFILES.includes(data.profile);
  if (!profileOk) fail("profile", `must be ${list(PROFILES)}`);
  if (!GRANULARITIES.includes(data.granularity)) fail("granularity", `must be ${list(GRANULARITIES)}`);
  if (!OBJECTIVES.includes(data.objective)) fail("objective", `must be ${list(OBJECTIVES)}`);
  const profileC = profileOk && data.profile === "C";

  if (empty(data.title)) fail("title", "must be text, 2 to 4 words");
  else {
    const words = data.title.trim().split(/\s+/).length;
    if (words < 2 || words > 4) fail("title", `must have 2 to 4 words (has ${words}); the long sentence goes in question`);
  }
  if (empty(data.question)) fail("question", "must be nonempty text");
  if (data.topic === "code") for (const field of ["area", "base"]) if (empty(data[field])) fail(field, "must be nonempty text (topic code)");

  const texts = (field, o) => {
    if (!isObject(o)) return fail(field, "must be an object with simple and technical");
    for (const k of ["simple", "technical"]) if (empty(o[k])) fail(`${field}.${k}`, "must be nonempty text");
  };
  texts("intro", data.intro);

  // sources
  const urls = new Set();
  if ("sources" in data && !Array.isArray(data.sources)) fail("sources", "must be a list of sources with url, title and read_at");
  else if (data.topic === "general" && !(data.sources?.length > 0)) fail("sources", "must have at least one source (topic general)");
  if (Array.isArray(data.sources)) {
    data.sources.forEach((s, i) => {
      if (!isObject(s)) return fail(`sources[${i}]`, "must be an object with url, title and read_at");
      let https = false;
      try { https = isUrl(s.url) && new URL(s.url).protocol === "https:"; } catch { /* not an address */ }
      if (!https) fail(`sources[${i}].url`, "must be an https:// address");
      else urls.add(s.url);
      if (empty(s.title)) fail(`sources[${i}].title`, "must be nonempty text");
      if (!validDate(s.read_at)) fail(`sources[${i}].read_at`, "must be a YYYY-MM-DD date");
    });
  }

  // types
  const types = new Set();
  if (!Array.isArray(data.types)) fail("types", "must be a list of 1 to 6 types");
  else {
    if (data.types.length < 1 || data.types.length > 6) fail("types", `must have 1 to 6 types (has ${data.types.length})`);
    data.types.forEach((t, i) => {
      if (!isObject(t) || empty(t.id)) return fail(`types[${i}].id`, "must be nonempty text");
      if (types.has(t.id)) fail(`types[${i}].id`, `${echo(t.id)} repeated`);
      types.add(t.id);
      if (empty(t.name)) fail(`types[${i}].name`, "must be nonempty text");
    });
  }

  // Node, view and message ids share a namespace: no duplicates across them.
  const used = new Map();
  const registerId = (field, id) => {
    if (used.has(id)) fail(field, `${echo(id)} repeated (already the id of ${used.get(id)})`);
    else used.set(id, field);
  };

  // citations: `path:N` or `path:N-M`. A URL (http or https) is never a path.
  function citation(field, v) {
    const m = !isUrl(v) && typeof v === "string" ? CITATION.exec(v) : null;
    if (!m || !relativePath(m[1]) || (m[3] !== undefined && Number(m[3]) < Number(m[2]))) { fail(field, CITATION_FORM); return false; }
    return true;
  }
  const citations = (field, v) => {
    if (!Array.isArray(v)) return fail(field, "must be a list of path:N or path:N-M");
    v.forEach((c, i) => citation(`${field}[${i}]`, c));
  };

  // nodes
  const ids = new Set();
  if (!Array.isArray(data.nodes)) fail("nodes", "must be a list of 1 to 60 nodes");
  else {
    const n = data.nodes.length;
    if (n < 1 || n > 60) fail("nodes", `must have 1 to 60 nodes (has ${n}); above that, group by folder or module`);
    else if (data.granularity === "blocks" && (n < 5 || n > 8)) fail("nodes", `with granularity blocks, there must be 5 to 8 nodes (has ${n})`);
    data.nodes.forEach((node, i) => {
      if (!isObject(node)) return fail(`nodes[${i}]`, "must be an object");
      if (empty(node.id)) fail(`nodes[${i}].id`, "must be nonempty text");
      else {
        registerId(`nodes[${i}].id`, node.id);
        ids.add(node.id);
      }
      if (empty(node.short)) fail(`nodes[${i}].short`, "must be nonempty text");
      if (empty(node.type) || !types.has(node.type)) fail(`nodes[${i}].type`, `${echo(node.type ?? "")} does not exist in types`);
      texts(`nodes[${i}]`, node);
      if ("files" in node) citations(`nodes[${i}].files`, node.files);
      if ("risk" in node) {
        if (profileOk && !profileC) fail(`nodes[${i}].risk`, "only exists with profile C");
        else if (!RISKS.includes(node.risk)) fail(`nodes[${i}].risk`, `must be ${list(RISKS)}`);
      }
    });
  }

  // A list of node ids; return those that exist in nodes.
  function nodeIds(field, v, { min = 0, max = Infinity, name = "nodes" } = {}) {
    if (!Array.isArray(v)) { fail(field, "must be a list of node ids"); return []; }
    if (v.length < min || v.length > max) {
      fail(field, min > 0 && max === Infinity ? "must have at least one node" : `must have ${min} to ${max} ${name} (has ${v.length})`);
    }
    return v.filter((id, j) => ids.has(id) || (fail(`${field}[${j}]`, `${echo(id)} does not exist in nodes`), false));
  }

  // A graph or layer edge: different `from` and `to`, both within the view.
  function edges(field, v, inView) {
    if (v === undefined) return;
    if (!Array.isArray(v)) return fail(field, "must be a list");
    v.forEach((e, i) => {
      const c = `${field}[${i}]`;
      if (!isObject(e)) return fail(c, "must be an object");
      for (const k of ["from", "to"]) {
        if (!ids.has(e[k])) fail(`${c}.${k}`, `${echo(e[k] ?? "")} does not exist in nodes`);
        else if (!inView.has(e[k])) fail(`${c}.${k}`, `${echo(e[k])} is outside this view`);
      }
      if (ids.has(e.from) && e.from === e.to) fail(`${c}.to`, "must differ from from");
      if (empty(e.type)) fail(`${c}.type`, "must be nonempty text (the edge's verb)");
      if ("ref" in e) citation(`${c}.ref`, e.ref);
      mode(c, e);
    });
  }
  function mode(field, o) {
    if (!("mode" in o)) return;
    if (profileOk && !profileC) fail(`${field}.mode`, "only exists with profile C");
    else if (!MODES.includes(o.mode)) fail(`${field}.mode`, `must be ${list(MODES)}`);
  }
  const range = (field, n, min, max, name) => {
    if (n < min || n > max) fail(field, `must have ${min} to ${max} ${name} (has ${n})`);
  };

  // views: each returns the ids a step can highlight within it (nodes and messages).
  const views = new Map();
  const scenes = [];
  if (!Array.isArray(data.views)) fail("views", "must be a list of 1 to 4 views");
  else {
    range("views", data.views.length, 1, 4, "views");
    data.views.forEach((v, i) => {
      const c = `views[${i}]`;
      if (!isObject(v)) return fail(c, "must be an object");
      if (empty(v.id)) fail(`${c}.id`, "must be nonempty text");
      else registerId(`${c}.id`, v.id);
      if (empty(v.title)) fail(`${c}.title`, "must be nonempty text");
      if (!VIEWS.includes(v.type)) return fail(`${c}.type`, `must be ${list(VIEWS)}`);
      const highlightable = new Set();
      if (v.type === "graph") {
        const nodes = "nodes" in v ? nodeIds(`${c}.nodes`, v.nodes, { min: 1 }) : [...ids];
        nodes.forEach((id) => highlightable.add(id));
        edges(`${c}.edges`, v.edges, highlightable);
      } else if (v.type === "layers") {
        if (!Array.isArray(v.layers)) fail(`${c}.layers`, "must be a list of 2 to 6 layers");
        else {
          range(`${c}.layers`, v.layers.length, 2, 6, "layers");
          const owner = new Map();
          v.layers.forEach((layer, j) => {
            if (!isObject(layer)) return fail(`${c}.layers[${j}]`, "must be an object with name and nodes");
            if (empty(layer.name)) fail(`${c}.layers[${j}].name`, "must be nonempty text");
            nodeIds(`${c}.layers[${j}].nodes`, layer.nodes, { min: 1 });
            (Array.isArray(layer.nodes) ? layer.nodes : []).forEach((id, k) => {
              if (!ids.has(id)) return;
              if (owner.has(id)) fail(`${c}.layers[${j}].nodes[${k}]`, `${echo(id)} is already in a layer (layers[${owner.get(id)}])`);
              else owner.set(id, j);
              highlightable.add(id);
            });
          });
        }
        edges(`${c}.edges`, v.edges, highlightable);
      } else if (v.type === "sequence") {
        const participants = nodeIds(`${c}.participants`, v.participants, { min: 2, max: 8, name: "participants" });
        const who = new Set(participants);
        participants.forEach((id) => highlightable.add(id));
        if (!Array.isArray(v.messages)) fail(`${c}.messages`, "must be a list of 1 to 30 messages");
        else {
          range(`${c}.messages`, v.messages.length, 1, 30, "messages");
          v.messages.forEach((m, j) => {
            const mc = `${c}.messages[${j}]`;
            if (!isObject(m)) return fail(mc, "must be an object");
            if (empty(m.id)) fail(`${mc}.id`, "must be nonempty text");
            else { registerId(`${mc}.id`, m.id); highlightable.add(m.id); }
            for (const k of ["from", "to"]) if (!who.has(m[k])) fail(`${mc}.${k}`, `${echo(m[k] ?? "")} is not a participant in this view`);
            if (empty(m.text)) fail(`${mc}.text`, "must be nonempty text");
            mode(mc, m);
          });
        }
      } else if (v.type === "states") {
        const states = nodeIds(`${c}.states`, v.states, { min: 2, max: 16, name: "states" });
        const members = new Set(states);
        states.forEach((id) => highlightable.add(id));
        if (!members.has(v.initial)) fail(`${c}.initial`, "must be one of the states");
        if (!Array.isArray(v.transitions)) fail(`${c}.transitions`, "must be a list");
        else {
          v.transitions.forEach((t, j) => {
            const tc = `${c}.transitions[${j}]`;
            if (!isObject(t)) return fail(tc, "must be an object");
            for (const k of ["from", "to"]) if (!members.has(t[k])) fail(`${tc}.${k}`, `${echo(t[k] ?? "")} is not one of the states`);
            if (empty(t.event)) fail(`${tc}.event`, "must be nonempty text");
          });
        }
      } else if (v.type === "timeline") {
        if (!Array.isArray(v.events)) fail(`${c}.events`, "must be a list of 2 to 30 events");
        else {
          range(`${c}.events`, v.events.length, 2, 30, "events");
          v.events.forEach((e, j) => {
            const ec = `${c}.events[${j}]`;
            if (!isObject(e)) return fail(ec, "must be an object");
            if (!ids.has(e.node)) fail(`${ec}.node`, `${echo(e.node ?? "")} does not exist in nodes`);
            else highlightable.add(e.node);
            if (empty(e.when)) fail(`${ec}.when`, "must be nonempty text");
          });
        }
      } else {
        nodeIds(`${c}.nodes`, v.nodes, { min: 1, max: 40 }).forEach((id) => highlightable.add(id));
        if (scenes.length > 0) fail(c, `at most one scene view (another exists in views[${scenes[0]}])`);
        scenes.push(i);
        if (scene == null) fail(c, "a scene view requires --scene <scene.js>");
      }
      if (isText(v.id) && !empty(v.id)) views.set(v.id, highlightable);
    });
  }
  if (scene != null && scenes.length === 0 && Array.isArray(data.views)) fail("scene", "a scene file was supplied (--scene) but no view has type scene");

  // steps
  if (!Array.isArray(data.steps)) fail("steps", "must be a list of 1 to 12 steps");
  else {
    range("steps", data.steps.length, 1, 12, "steps");
    data.steps.forEach((p, i) => {
      const c = `steps[${i}]`;
      if (!isObject(p)) return fail(c, "must be an object");
      if (empty(p.title)) fail(`${c}.title`, "must be nonempty text");
      const inView = views.get(p.view);
      if (!inView) fail(`${c}.view`, `${echo(p.view ?? "")} does not exist in views`);
      if (!Array.isArray(p.highlight)) fail(`${c}.highlight`, "must be a list of view ids (nodes or messages)");
      else if (inView) p.highlight.forEach((id, j) => { if (!inView.has(id)) fail(`${c}.highlight[${j}]`, `${echo(id ?? "")} is not an element of view ${echo(p.view)}`); });
      if (!Array.isArray(p.citations)) fail(`${c}.citations`, "must be a list of path:N, path:N-M or URLs from sources");
      else if (p.citations.length === 0) fail(`${c}.citations`, "must have at least one citation");
      else {
        let paths = 0;
        p.citations.forEach((cit, j) => {
          if (isUrl(cit)) { if (!urls.has(cit)) fail(`${c}.citations[${j}]`, "the URL does not exist in sources"); }
          else if (citation(`${c}.citations[${j}]`, cit)) paths++;
        });
        if (data.topic === "code" && paths === 0) fail(`${c}.citations`, "with topic code, each step cites at least one path:N");
      }
      texts(c, p);
    });
  }

  // concepts
  if ("concepts" in data) {
    if (!Array.isArray(data.concepts)) fail("concepts", "must be a list of 0 to 6 concepts");
    else {
      range("concepts", data.concepts.length, 0, 6, "concepts");
      data.concepts.forEach((c, i) => {
        if (!isObject(c)) return fail(`concepts[${i}]`, "must be an object");
        if (empty(c.term)) fail(`concepts[${i}].term`, "must be nonempty text");
        texts(`concepts[${i}]`, c);
      });
    }
  }

  // No secrets: no text or field name may contain an obvious key pattern. Say where, never repeat the value:
  // a suspicious key yields one finding on its object; do not descend through it (the path would contain the key).
  const looksSecret = (t) => SECRETS.some((re) => re.test(t));
  const scan = (v, field) => {
    if (typeof v === "string") {
      if (looksSecret(v)) fail(field, "appears to contain a key or a secret; data contains only file names, parts and explanations");
    } else if (Array.isArray(v)) v.forEach((x, i) => scan(x, `${field}[${i}]`));
    else if (isObject(v)) {
      const entries = Object.entries(v);
      if (entries.some(([k]) => looksSecret(k))) fail(field || "data", "a field name looks like a key or a secret");
      for (const [k, x] of entries) if (!looksSecret(k)) scan(x, field ? `${field}.${k}` : k);
    }
  };
  scan(data, "");

  return errors;
}

// Static scene rules (references/scene.md): return "scene:<line>: what failed" lines.
// Apply throughout the text, including comments and strings; never echo what was found. Run on the whole
// text, not line by line: a match split across lines (`window` and `.open` on different lines) counts
// on its starting line, with one finding per rule per line.
const SCENE_LIMIT = 40 * 1024;
const NO_NETWORK = "no network, no storage, no HTML or own render loop";
const NO_WINDOW = "the scene only uses what ctx provides: no window, no document, no global object";
const FORBIDDEN = [
  ["import", "import"], ["export", "export"], ["require", "require"], ["fetch", "fetch"],
  ["XMLHttpRequest", "XMLHttpRequest"], ["WebSocket", "WebSocket"], ["EventSource", "EventSource"],
  ["eval", "eval"], ["Function(", "Function\\s*\\("], ["setInterval", "setInterval"],
  ["requestAnimationFrame", "requestAnimationFrame"], ["localStorage", "localStorage"],
  ["sessionStorage", "sessionStorage"], ["indexedDB", "indexedDB"], ["cookie", "cookie"],
  ["innerHTML", "innerHTML"], ["outerHTML", "outerHTML"], ["insertAdjacentHTML", "insertAdjacentHTML"],
  ["document.write", "document\\s*\\.\\s*write"], ["window.open", "window\\s*\\.\\s*open"],
  ["location", "location"], ["navigator", "navigator"], ["postMessage", "postMessage"], ["Worker", "Worker"],
].map(([name, pattern]) => [name, pattern, NO_NETWORK]).concat(
  ["window", "document", "globalThis", "self", "constructor", "Reflect", "opener", "frames"].map((name) => [name, name, NO_WINDOW]),
).map(([name, pattern, reason]) => {
  // Identifier boundary on the left; on the right only when the pattern ends with a whole word.
  const right = /[()]$|write$|open$/.test(pattern) ? "" : "(?![\\w$])";
  return [`«${name}» is not allowed in the scene (${reason})`, new RegExp(`(?<![\\w$])${pattern}${right}`, "g")];
});
const OTHER = [
  ["«</script» would close the page's block", /<\/script/ig],
  ["«<!--» is not allowed in the scene", /<!--/g],
  ["http:// and https:// addresses are not allowed: the scene does not access the network", /https?:\/\//ig],
  ["literal color: colors come from ctx.colors", /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_])|(?<![\w$])0[xX][0-9a-fA-F]{6}(?![0-9a-zA-Z_])|(?<![\w$])(?:rgba?|hsla?)\s*\(/g],
  // An escape could spell a forbidden word without it appearing in the text ("\u0066etch").
  ["the «\\u» escape sequence is not allowed in the scene (it could hide a forbidden word)", /\\u/g],
  ["the «\\x» escape sequence is not allowed in the scene (it could hide a forbidden word)", /\\x/g],
];

export function validateScene(code) {
  if (typeof code !== "string") return ["scene:1: must be the scene file's text"];
  const errors = [];
  const fail = (line, msg) => errors.push(`scene:${line}: ${msg}`);
  const bytes = Buffer.byteLength(code, "utf8");
  if (bytes > SCENE_LIMIT) fail(1, `has ${Math.ceil(bytes / 1024)} KB; the maximum is 40 KB`);

  const declarations = [];
  code.split("\n").forEach((text, i) => {
    for (const _ of text.matchAll(/(?<![\w$])function\s+scene\s*\(/g)) declarations.push(i + 1);
  });

  // Line for a text index: 1 plus the preceding line breaks.
  const breaks = [];
  for (let i = code.indexOf("\n"); i !== -1; i = code.indexOf("\n", i + 1)) breaks.push(i);
  const lineAt = (index) => {
    let a = 0;
    let b = breaks.length;
    while (a < b) { const mid = (a + b) >> 1; if (breaks[mid] < index) a = mid + 1; else b = mid; }
    return a + 1;
  };
  for (const [msg, re] of [...FORBIDDEN, ...OTHER]) {
    const ruleLines = new Set();
    for (const m of code.matchAll(re)) ruleLines.add(lineAt(m.index));
    for (const line of ruleLines) fail(line, msg);
  }
  if (declarations.length === 0) fail(1, "missing declaration function scene(ctx)");
  else if (declarations.length > 1) fail(declarations[1], `function scene( declared more than once (the first is on line ${declarations[0]})`);
  return errors.sort((a, b) => Number(/^scene:(\d+)/.exec(a)[1]) - Number(/^scene:(\d+)/.exec(b)[1]));
}

const escapeTitle = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const DATA_BLOCK = /(<script type="application\/json" id="data">)[\s\S]*?(<\/script>)/g;
const SCENE_BLOCK = /(<script\b[^>]*\bid="scene-code"[^>]*>)[\s\S]*?(<\/script>)/g;

function readTemplate() {
  try { return readFileSync(TEMPLATE, "utf8"); } catch (e) { throw new Error(`could not read template ${TEMPLATE}: ${e.message}`); }
}

// The page: the template with its data block, <title> and, if present, scene code. Escape JSON's `<` as
// unicode so a </script> in text cannot close the block; use replacement functions so "$&" in data or
// scenes is not interpreted as a pattern. The validated scene contains no </script or <!--. Scene code
// enters a strict function called without this: the file's top level creates no globals and sees no window in this.
export function generatePage(data, { scene = null, template = readTemplate() } = {}) {
  const json = JSON.stringify(data).replaceAll("<", "\\u003c");
  if ([...template.matchAll(DATA_BLOCK)].length !== 1) throw new Error("the template must have exactly one <script type=\"application/json\" id=\"data\"> block");
  if (!template.includes("<title>{{title}}</title>")) throw new Error("the template has no <title>{{title}}</title> marker");
  if (scene != null && [...template.matchAll(SCENE_BLOCK)].length !== 1) throw new Error("the template has no place for the scene (exactly one <script id=\"scene-code\"></script>)");
  let page = template
    .replace(DATA_BLOCK, (_, open, close) => `${open}${json}${close}`)
    .replace("<title>{{title}}</title>", () => `<title>${escapeTitle(data.title.trim().replace(/\s+/g, " "))}</title>`);
  if (scene != null) page = page.replace(SCENE_BLOCK, (_, open, close) => `${open}window.explainScene = (function () {\n"use strict";\n${scene}\nreturn scene;\n}).call(undefined);${close}`);
  return page;
}

const USAGE = "usage: node generate-page.mjs <data.json> [--scene <scene.js>] --out <page.html>";

export function main(argv, { err = (l) => process.stderr.write(`${l}\n`) } = {}) {
  let input = null;
  let output = null;
  let sceneFile = null;
  const value = (i, name) => {
    if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) { err(`generate-page: ${name} needs a path\n${USAGE}`); return null; }
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out" || a === "--scene") {
      const v = value(i, a);
      if (v === null) return 2;
      if (a === "--out") output = v;
      else if (sceneFile !== null) { err(`generate-page: only one scene (received --scene twice)\n${USAGE}`); return 2; }
      else sceneFile = v;
      i++;
    } else if (a.startsWith("--")) { err(`generate-page: unknown option ${a}\n${USAGE}`); return 2; }
    else if (input === null) input = a;
    else { err(`generate-page: only one data file (also received ${a})\n${USAGE}`); return 2; }
  }
  if (input === null || output === null) { err(USAGE); return 2; }

  const read = (f) => { if (!statSync(f).isFile()) throw new Error("not a file"); return readFileSync(f, "utf8"); };
  let text;
  try { text = read(input); } catch (e) { err(`generate-page: could not read ${input}: ${e.message}`); return 2; }
  // JSON.parse errors quote part of the file: do not repeat them, so data does not end up in a log.
  let data;
  try { data = JSON.parse(text); } catch { err(`generate-page: ${input} is not valid JSON`); return 2; }
  let scene = null;
  if (sceneFile !== null) {
    try { scene = read(sceneFile); } catch (e) { err(`generate-page: could not read ${sceneFile}: ${e.message}`); return 2; }
  }

  const problems = [...validate(data, scene), ...(scene === null ? [] : validateScene(scene))];
  if (problems.length > 0) { problems.forEach((p) => err(p)); return 1; }

  let html;
  try { html = generatePage(data, { scene }); } catch (e) { err(`generate-page: ${e.message}`); return 2; }
  try {
    mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    writeFileSync(output, html);
  } catch (e) { err(`generate-page: could not write ${output}: ${e.message}`); return 2; }
  return 0;
}

// Run only as a program, also when called through a symlink (`install.sh --link`): Node resolves
// the link in `import.meta.url`, but not in `process.argv[1]`.
const asProgram = () => {
  try { return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href; } catch { return false; }
};
if (process.argv[1] && asProgram()) process.exitCode = main(process.argv.slice(2));
