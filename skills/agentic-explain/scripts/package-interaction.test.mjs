import assert from "node:assert/strict";
import {test} from "node:test";
import {mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import {packageInteraction, validateMessage, MAX_INTERACTION_BYTES} from "./package-interaction.mjs";

const composition = readFileSync(new URL("../assets/lessons/interaction.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../assets/lessons/interaction.css", import.meta.url), "utf8");
const interaction = readFileSync(new URL("../assets/lessons/interaction.srcdoc", import.meta.url), "utf8");

test("packages an interaction with sandbox without same-origin and a fallback", () => {
  const html = packageInteraction({composition, css, interaction, title: "Predict a limit"});
  assert.match(html, /id="explain-interaction"/);
  assert.match(html, /sandbox="allow-scripts"/);
  assert.doesNotMatch(html, /allow-same-origin/);
  assert.match(html, /srcdoc="[^"]+"/);
  assert.match(html, /frame-src 'none'/);
  assert.match(html, /child-src 'none'/);
  assert.match(html, /webrtc 'block'/);
  assert.match(html, /navigate-to 'none'/);
  assert.match(html, /Permissions-Policy/);
  assert.match(html, /allow="camera 'none'; microphone 'none'/);
  assert.match(html, /interaction-fallback/);
  assert.match(html, /event\.source\s*!==\s*frame\.contentWindow/);
  assert.match(html, /event\.origin\s*!==\s*"null"/);
  assert.match(html, /Object\.keys\(data\)/);
  assert.match(html, /frameLoads/);
  assert.match(html, /frame\.remove\(\)/);
});

test("injects a fixed CSP before the supplied srcdoc", () => {
  const withoutPolicy = '<script>parent.postMessage({version:1,kind:"ready"},"*");const f=document.createElement("ifr"+"ame");f.src="/probe";document.body.append(f);</script>';
  const html = packageInteraction({composition, interaction: withoutPolicy});
  const start = html.indexOf('srcdoc="');
  assert.ok(start >= 0);
  const srcdoc = html.slice(start, html.indexOf('"', start + 8));
  assert.match(srcdoc, /default-src &#39;none&#39;|default-src 'none'/);
  assert.match(html, /frame-src &#39;none&#39;|frame-src 'none'/);
  assert.match(html, /child-src &#39;none&#39;|child-src 'none'/);
  assert.match(html, /worker-src &#39;none&#39;|worker-src 'none'/);
  assert.ok(srcdoc.indexOf("Content-Security-Policy") < srcdoc.indexOf("parent.postMessage"));
});

test("passes the selected theme into the isolated document", () => {
  const dark = packageInteraction({composition, css, interaction, theme: "dark"});
  const light = packageInteraction({composition, css, interaction, theme: "light"});
  assert.match(dark, /color-scheme: dark !important/);
  assert.match(dark, /body \{ color: #ededed !important; background: #171717 !important; \}/);
  assert.match(light, /color-scheme: light !important/);
  assert.match(light, /body \{ color: #202020 !important; background: #ffffff !important; \}/);
});

test("rejects a missing or duplicated marker", () => {
  assert.throws(() => packageInteraction({composition: "<main><p>No slot</p></main>", interaction}), /EXPLAIN_SLOT/);
  assert.throws(() => packageInteraction({composition: '<main><div id="interaction-slot"></div><div id="interaction-slot"></div></main>', interaction}), /EXPLAIN_SLOT/);
});

for (const [name, attempt] of [
  ["same-origin token", `${interaction}\nallow-same-origin`],
  ["external resource", interaction.replace("<style>", '<link rel="stylesheet" href="https://example.invalid/style.css"><style>')],
  ["external script", interaction.replace("<script>", '<script src="https://example.invalid/code.js"></script><script>')],
  ["child iframe", interaction.replace("<body>", '<body><iframe src="https://example.invalid"></iframe>')],
  ["inline event", interaction.replace("<button", '<button onclick="alert(1)"')],
  ["parent DOM", interaction.replace("parent.postMessage", "parent.document.body.dataset.bad='1'; parent.postMessage")],
  ["storage", interaction.replace("parent.postMessage", "localStorage.setItem('bad','1'); parent.postMessage")],
  ["top navigation", interaction.replace("parent.postMessage", "top.location='https://example.invalid'; parent.postMessage")],
]) test(`rejects child content: ${name}`, () => {
  assert.throws(() => packageInteraction({composition, interaction: attempt}), /EXPLAIN_/);
});

test("rejects an oversized child and keeps the static policy", () => {
  assert.throws(() => packageInteraction({composition, interaction: "x".repeat(MAX_INTERACTION_BYTES + 1)}), /EXPLAIN_SIZE/);
  const html = packageInteraction({composition, css, interaction});
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.match(html, /script-src 'unsafe-inline'/);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /form-action 'none'/);
  assert.match(html, /navigate-to 'none'/);
});

test("accepts only the closed message contract", () => {
  assert.equal(validateMessage({version: 1, kind: "ready"}), true);
  assert.equal(validateMessage({version: 1, kind: "state", state: {variable: 60, outcome: "pending"}}), true);
  assert.equal(validateMessage({version: 1, kind: "result", result: {variable: 70, prediction: "hypothesis", observed: "rejected", feedback: "because"}}), true);
  assert.equal(validateMessage({version: 1, kind: "ready", extra: true}), false);
  assert.equal(validateMessage({version: 1, kind: "unknown"}), false);
});

test("the interactive lesson contains a causal variable, prediction, observation and feedback", () => {
  assert.match(interaction, /input[^>]+type="range"/);
  assert.match(interaction, /select id="prediction"/);
  assert.match(interaction, /predict/i);
  assert.match(interaction, /observ/i);
  assert.match(interaction, /feedback/i);
  assert.match(interaction, /predicted === observed/);
  assert.match(interaction, /postMessage/);
});

test("transfer C provides an answer and rubric after the attempt", () => {
  assert.match(composition, /id="transfer-rubric"/);
  assert.match(composition, /limit 50/);
  assert.match(composition, /equals the limit.*accepted/);
  assert.match(composition, /Identify duration and limit/);
});

function simulateRuntime(html) {
  const script = /<script>(\(\(\) => \{[\s\S]*?\}\)\(\);)<\/script>/.exec(html)?.[1];
  assert.ok(script, "fixed runtime is missing");
  const frameListeners = new Map();
  const windowListeners = new Map();
  let removed = false;
  let hidden = false;
  let now = 0;
  const frame = {contentWindow: {}, addEventListener: (type, fn) => frameListeners.set(type, fn), remove: () => { removed = true; }};
  const fallback = {classList: {add: () => { hidden = true; }, remove: () => { hidden = false; }}};
  const status = {textContent: ""};
  const context = {
    document: {getElementById: (id) => ({"explain-interaction": frame, "interaction-fallback": fallback, "interaction-status": status}[id])},
    window: {addEventListener: (type, fn) => windowListeners.set(type, fn)},
    Date: {now: () => { now += 31; return now; }},
  };
  vm.runInNewContext(script, context);
  const message = (data) => windowListeners.get("message")({source: frame.contentWindow, origin: "null", data});
  return {message, fail: () => frameListeners.get("error")(), state: () => ({hidden, removed, status: status.textContent})};
}

test("runtime restores fallback after ready followed by error and becomes terminal", () => {
  const runtime = simulateRuntime(packageInteraction({composition, css, interaction}));
  runtime.message({version: 1, kind: "ready"});
  assert.equal(runtime.state().hidden, true);
  runtime.message({version: 1, kind: "error", message: "Simulation stopped"});
  assert.deepEqual(runtime.state(), {hidden: false, removed: true, status: "Interaction failed: Simulation stopped"});
  runtime.message({version: 1, kind: "ready"});
  assert.equal(runtime.state().hidden, false);
});

test("runtime keeps fallback when the frame fails without ready", () => {
  const runtime = simulateRuntime(packageInteraction({composition, interaction}));
  runtime.fail();
  assert.deepEqual(runtime.state(), {hidden: false, removed: true, status: "Interaction did not open; use the written fallback."});
});

test("interactive CLI runs through a symlink and rejects every collision without changing inputs", () => {
  const folder = mkdtempSync(join(tmpdir(), "explain-interaction-cli-"));
  try {
    const compositionPath = join(folder, "composition.html");
    const interactionPath = join(folder, "interaction.srcdoc");
    const cssPath = join(folder, "layout.css");
    writeFileSync(compositionPath, composition);
    writeFileSync(interactionPath, interaction);
    writeFileSync(cssPath, css);
    const realScripts = fileURLToPath(new URL(".", import.meta.url));
    const linkedScripts = join(folder, "linked-scripts");
    symlinkSync(realScripts, linkedScripts, "dir");
    const script = join(linkedScripts, "package-interaction.mjs");
    const run = (...args) => spawnSync(process.execPath, [script, ...args], {encoding: "utf8"});
    const inputs = [compositionPath, interactionPath, cssPath];
    const bytes = new Map(inputs.map(path => [path, readFileSync(path)]));
    for (const output of inputs) {
      const result = run(compositionPath, "--interaction", interactionPath, "--css", cssPath, "--output", output);
      assert.equal(result.status, 2, `${output}: ${result.stderr}`);
    }
    const interactionAlias = join(folder, "interaction-alias.srcdoc");
    symlinkSync(interactionPath, interactionAlias);
    const inputAlias = run(compositionPath, "--interaction", interactionAlias, "--css", cssPath, "--output", interactionPath);
    assert.equal(inputAlias.status, 2, inputAlias.stderr);
    const outputAlias = join(folder, "output-alias.html");
    symlinkSync(compositionPath, outputAlias);
    const destinationAlias = run(compositionPath, "--interaction", interactionPath, "--css", cssPath, "--output", outputAlias);
    assert.equal(destinationAlias.status, 2, destinationAlias.stderr);
    for (const path of inputs) assert.deepEqual(readFileSync(path), bytes.get(path), path);
    const output = join(folder, "page.html");
    const success = run(compositionPath, "--interaction", interactionPath, "--css", cssPath, "--output", output);
    assert.equal(success.status, 0, success.stderr);
    assert.match(readFileSync(output, "utf8"), /explain-interaction/);
  } finally { rmSync(folder, {recursive: true, force: true}); }
});
