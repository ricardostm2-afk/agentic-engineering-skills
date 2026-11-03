import assert from "node:assert/strict";
import {test} from "node:test";
import {mkdtempSync, readFileSync, readdirSync, writeFileSync, rmSync, symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
import {packagePage, MAX_BYTES} from "./package-page.mjs";

const valid = "<main><h1>A question</h1><p>An example.</p></main>";
const rejections = [
  ["script", "<script>alert(1)</script>"],
  ["on*=", '<p onclick="alert(1)">Text</p>'],
  ["javascript:", '<a href="javascript:alert(1)">Source</a>'],
  ["unauthorised resource", '<img src="https://example.invalid/a.png">'],
  ["size", "x".repeat(MAX_BYTES + 1)],
];
for (const [name, composition] of rejections) {
  test("reject: " + name, () => assert.throws(() => packagePage({composition}), /EXPLAIN_/));
}
test("accepts a composition without a view catalogue", () => {
  const html = packagePage({composition: valid});
  assert.ok(html.includes(valid));
  assert.match(html, /--page:/);
});
test("normalizes HTML/SVG and keeps only local references and https links", () => {
  const html = packagePage({composition: '<main id="lesson"><a href="#lesson">Back</a><svg viewBox="0 0 100 100"><defs><marker id="tip"><path d="M0 0L4 2L0 4Z"/></marker></defs><path d="M0 0L50 50" marker-end="url(#tip)"/></svg><a href="https://example.org/?a=1&amp;b=2">Source</a></main>'});
  assert.match(html, /viewBox="0 0 100 100"/);
  assert.match(html, /script-src 'none'/);
  assert.doesNotMatch(html, /<script[\s>]/i);
  assert.match(html, /a=1&amp;b=2/);
});
const attacks = [
  '<ScRiPt src="https://cdn.jsdelivr.net/npm/example@1.2.3/a.js"></ScRiPt>',
  '<p ONpointerenter="alert(1)">Text</p>',
  '<a href="java&#x73;cript:alert(1)">Source</a>',
  '<a href="java&Tab;script:alert(1)">Source</a>',
  '<a href="data:text/html,test">Source</a>',
  '<a href="//example.org">Source</a>',
  '<a href="https://user:password@example.org">Source</a>',
  '<img alt="External" src="https://cdn.jsdelivr.net/npm/example@latest/a.png">',
  '<iframe srcdoc="text"></iframe>',
  '<svg><foreignObject><p>Text</p></foreignObject></svg>',
  '<svg><animate attributeName="href" values="javascript:alert(1)"></animate></svg>',
  '<svg><use href="https://example.org/a.svg#x"></use></svg>',
  '<p style="color:red">Text</p>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Example">',
  '<base href="https://example.org">',
  '<meta http-equiv="refresh" content="0;url=https://example.org">',
  '<form action="https://example.org"><button>Send</button></form>',
  '<p id="x" ID="y">Text</p>',
  '<main><p>Unclosed</main>',
  '<a href=#x>Unquoted</a>',
  '<a href="#missing">Jump</a>',
  '<svg><path marker-end="url(#missing)"></path></svg>',
  '<!-- unreviewed comment -->',
];
for (const [i, composition] of attacks.entries()) test(`reject HTML variant ${i + 1}`, () => {
  assert.throws(() => packagePage({composition}), /EXPLAIN_/);
});
for (const [i, css] of [
  '@import "https://example.org/a.css";',
  'p { background: url(https://example.org/a.png); }',
  'p { background: image-set("https://example.org/a.png" 1x); }',
  'p { color: red; }',
  ':root { --page: white; }',
  'p { color: var(--missing); }',
  'p { font-size: 12px; }',
  'p { border-radius: 99px; }',
  'p { c\\6flor: red; }',
  'p { color: var(--text); }</style><script>alert(1)</script>',
  '@font-face { font-family: example; src: url(https://example.org/a.woff); }',
  '@media (max-width: 760px) { p { width: 100%; }',
].entries()) test(`reject CSS variant ${i + 1}`, () => {
  assert.throws(() => packagePage({composition: valid, css}), /EXPLAIN_/);
});
test("escapes metadata and applies the theme without prescribing layout", () => {
  const html = packagePage({composition: valid, title: '</title><script>alert(1)</script>', theme: "dark", css: 'main { max-width: 70ch; padding: var(--space-4); } @media (max-width: 760px) { main { display: block; } }'});
  assert.match(html, /data-theme="dark"/);
  assert.match(html, /&lt;\/title&gt;/);
  assert.doesNotMatch(html, /<script[\s>]/i);
  assert.throws(() => packagePage({composition: valid, language: 'en" onload="alert(1)'}), /EXPLAIN_/);
  assert.throws(() => packagePage({composition: valid, theme: "other"}), /EXPLAIN_/);
});
test("measures UTF-8 bytes and the final file including the theme", () => {
  assert.throws(() => packagePage({composition: "\u00e9".repeat(MAX_BYTES / 2 + 1)}), /EXPLAIN_SIZE/);
  assert.throws(() => packagePage({composition: "x".repeat(MAX_BYTES - 100)}), /EXPLAIN_SIZE/);
});
test("packages the supplied lessons without changing the theme", () => {
  const folder = new URL("../assets/lessons/", import.meta.url);
  const theme = readFileSync(new URL("../assets/theme.css", import.meta.url), "utf8");
  for (const name of readdirSync(folder).filter(n => n.endsWith(".html"))) {
    const composition = readFileSync(new URL(name, folder), "utf8");
    const css = readFileSync(new URL(name.replace(/\.html$/, ".css"), folder), "utf8");
    const html = packagePage({composition, css});
    assert.ok(html.includes(theme), name);
    assert.doesNotMatch(html, /<script[\s>]|<link[\s>]/i);
  }
});
test("CLI preserves the output on every rejection and distinguishes usage/read errors", () => {
  const folder = mkdtempSync(join(tmpdir(), "explain-cli-"));
  try {
    const input = join(folder, "input.html"), output = join(folder, "output.html");
    const script = fileURLToPath(new URL("./package-page.mjs", import.meta.url));
    const run = (...args) => spawnSync(process.execPath, [script, ...args], {encoding: "utf8"});
    writeFileSync(output, "PREVIOUS");
    for (const [, composition] of rejections) {
      writeFileSync(input, composition);
      const r = run(input, "--output", output);
      assert.equal(r.status, 1, r.stderr);
      assert.equal(readFileSync(output, "utf8"), "PREVIOUS");
      assert.match(r.stderr, /^EXPLAIN_/);
    }
    assert.equal(run().status, 2);
    assert.equal(run(input, "--unknown", "x").status, 2);
    assert.equal(run(join(folder, "missing"), "--output", output).status, 2);
    assert.equal(run(input, "--output", input).status, 2);
    writeFileSync(input, valid);
    const r = run(input, "--title", "A question", "--theme", "light", "--output", output);
    assert.equal(r.status, 0, r.stderr);
    assert.match(readFileSync(output, "utf8"), /<title>A question<\/title>/);
    assert.deepEqual(readdirSync(folder).sort(), ["input.html", "output.html"]);
  } finally { rmSync(folder, {recursive: true, force: true}); }
});
test("CLI writes the page when called through a symlinked scripts folder", () => {
  const folder = mkdtempSync(join(tmpdir(), "explain-cli-link-"));
  try {
    const input = join(folder, "input.html"), output = join(folder, "output.html");
    writeFileSync(input, valid);
    const realScripts = fileURLToPath(new URL(".", import.meta.url));
    const linkedScripts = join(folder, "linked-scripts");
    symlinkSync(realScripts, linkedScripts, "dir");
    const script = join(linkedScripts, "package-page.mjs");
    const result = spawnSync(process.execPath, [script, input, "--output", output], {encoding: "utf8"});
    assert.equal(result.status, 0, result.stderr);
    assert.match(readFileSync(output, "utf8"), /<main><h1>A question/);
  } finally { rmSync(folder, {recursive: true, force: true}); }
});
test("the four recipes are usable static fragments", () => {
  const text = readFileSync(new URL("../references/repertoire.md", import.meta.url), "utf8");
  const blocks = [...text.matchAll(/```html\n([\s\S]*?)```/g)];
  assert.equal(blocks.length, 4);
  for (const [, composition] of blocks) assert.doesNotThrow(() => packagePage({composition}));
});
