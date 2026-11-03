#!/usr/bin/env node
// Static path: a closed capability grammar, with no prescribed layout.
import {readFileSync, writeFileSync, mkdtempSync, renameSync, rmSync, realpathSync} from "node:fs";
import {basename, dirname, resolve, join} from "node:path";
import {fileURLToPath} from "node:url";

export const MAX_BYTES = 16_000_000;
const tokens = readFileSync(new URL("../assets/theme.css", import.meta.url), "utf8");
const tokenNames = new Set([...tokens.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
const htmlTags = new Set("main article section header footer nav div span p h1 h2 h3 h4 h5 h6 strong b em i small code pre kbd samp var ul ol li dl dt dd figure figcaption details summary a blockquote table caption thead tbody tfoot tr th td br wbr hr sup sub time abbr mark img".split(" "));
const svgTags = new Map("svg g title desc defs marker path rect polygon polyline line circle ellipse text tspan use".split(" ").map(t => [t.toLowerCase(), t]));
const voidTags = new Set(["br", "wbr", "hr", "img"]);
const common = new Set("id class role title lang dir aria-label aria-labelledby aria-describedby aria-hidden".split(" "));
const svgAttrs = new Map("viewBox x y x1 y1 x2 y2 cx cy r rx ry dx dy width height d points markerWidth markerHeight markerUnits refX refY orient preserveAspectRatio text-anchor dominant-baseline pathLength".split(" ").map(a => [a.toLowerCase(), a]));
const geometry = new Set("display grid-template-columns grid-template-rows grid-auto-flow grid-column grid-row flex flex-direction flex-wrap flex-grow flex-shrink flex-basis align-items align-self justify-content justify-items width min-width max-width height min-height max-height aspect-ratio margin margin-top margin-right margin-bottom margin-left margin-inline margin-block padding padding-top padding-right padding-bottom padding-left padding-inline padding-block gap row-gap column-gap text-align white-space overflow-wrap word-break overflow overflow-x overflow-y position top right bottom left order table-layout border-collapse vertical-align break-inside scroll-margin-top".split(" "));
const appearance = new Set("color background background-color font-family font-size font-weight line-height border-radius border-color outline-color fill stroke".split(" "));
const borders = new Set(["border", "border-top", "border-bottom", "border-left", "border-right", "outline"]);
const reject = rule => { throw new Error(`EXPLAIN_${rule}`); };
const escape = text => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const controls = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

function realPath(path) {
  const absolute = resolve(path);
  const parts = [];
  let current = absolute;
  while (true) {
    try { return join(realpathSync(current), ...parts.reverse()); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      const parent = dirname(current);
      if (parent === current) return absolute;
      parts.push(basename(current));
      current = parent;
    }
  }
}

function decode(value) {
  // Only unambiguous entities; normalize before checking and escape again on output.
  const names = {amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", colon: ":", Tab: "\t", NewLine: "\n"};
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);?/gi, (whole, name) => {
    if (name[0] !== "#") return names[name] ?? reject("ENTITY");
    const n = name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : Number(name.slice(1));
    if (!n || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) reject("ENTITY");
    return String.fromCodePoint(n);
  });
}

function local(value, references) {
  if (!/^#[a-zA-Z][\w.-]*$/.test(value)) reject("URL");
  references.push(value.slice(1));
}
function url(value, references) {
  if (value.startsWith("#")) return local(value, references);
  if (!/^https:\/\/[^\s]+$/.test(value) || controls.test(value)) reject("URL");
  let u;
  try { u = new URL(value); } catch { reject("URL"); }
  if (u.protocol !== "https:" || !u.hostname || u.username || u.password) reject("URL");
}

function validateCss(css, references) {
  // CSS subset without escapes, imports, strings, resources or token declarations.
  if (/[<>\\\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(css)) reject("CSS");
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const vars = /var\((--[\w-]+)\)/g;
  let pos = 0;
  function rules(nested = false) {
    while (pos < clean.length) {
      while (/\s/.test(clean[pos] ?? "") && pos < clean.length) pos++;
      if (pos === clean.length) break;
      if (clean[pos] === "}" && nested) { pos++; return; }
      const opening = clean.indexOf("{", pos);
      if (opening < 0) reject("CSS");
      const selector = clean.slice(pos, opening).trim();
      pos = opening + 1;
      if (selector.startsWith("@")) {
        if (nested || !/^@media\s*\((?:min|max)-width:\s*\d+(?:\.\d+)?(?:px|rem)\)$/.test(selector)) reject("CSS_RESOURCE");
        rules(true);
        continue;
      }
      if (!selector || !/^[\w\s.#:>+~,*()[\]="'-]+$/.test(selector)) reject("CSS");
      const closing = clean.indexOf("}", pos);
      if (closing < 0) reject("CSS");
      const body = clean.slice(pos, closing);
      pos = closing + 1;
      for (const declaration of body.split(";")) {
        if (!declaration.trim()) continue;
        const m = /^\s*([a-z-]+)\s*:\s*([\s\S]+?)\s*$/.exec(declaration);
        if (!m) reject("CSS");
        const [, property, value] = m;
        if (property.startsWith("--")) reject("THEME");
        for (const [, name] of value.matchAll(vars)) if (!tokenNames.has(name)) reject("THEME");
        const withoutVars = value.replace(vars, "TOKEN");
        if (!/^[\w\s.,%()#+*/-]+$/.test(withoutVars)) reject("CSS");
        if (/url\s*\(/i.test(value)) reject("CSS_RESOURCE");
        if (appearance.has(property)) {
          if (!/^var\(--[\w-]+\)$/.test(value)) reject("THEME");
        } else if (borders.has(property)) {
          if (!/^(?:0|\d+(?:\.\d+)?px solid var\(--[\w-]+\))$/.test(value)) reject("THEME");
        } else if (!geometry.has(property)) reject("CSS_PROPERTY");
      }
    }
    if (nested) reject("CSS");
  }
  rules();
  return clean;
}

function validateComposition(composition, references) {
  const stack = [], ids = new Set();
  let output = "", pos = 0;
  while (pos < composition.length) {
    if (composition[pos] !== "<") {
      const end = composition.indexOf("<", pos);
      const until = end < 0 ? composition.length : end;
      output += composition.slice(pos, until);
      pos = until;
      continue;
    }
    const tag = /^<(\/?)([a-zA-Z][\w-]*)(\s+(?:[^<>"']|"[^"<>]*"|'[^'<>]*')*?)?\s*(\/?)>/.exec(composition.slice(pos));
    if (!tag) reject("HTML");
    pos += tag[0].length;
    const [, closing, name, attributes = "", selfClosing] = tag;
    const lower = name.toLowerCase();
    if (closing) {
      if (attributes.trim() || selfClosing || stack.at(-1)?.lower !== lower) reject("HTML");
      output += `</${stack.pop().name}>`;
      continue;
    }
    const inSvg = lower === "svg" || stack.some(t => t.lower === "svg");
    const canonical = inSvg ? svgTags.get(lower) : htmlTags.has(lower) && lower;
    if (!canonical) reject("ELEMENT");
    const seen = new Set();
    let rest = attributes, attrs = "";
    while (rest.trim()) {
      const a = /^\s+([a-zA-Z][\w:-]*)(?:\s*=\s*(?:"([^"<>]*)"|'([^'<>]*)'))?/.exec(rest);
      if (!a) reject("ATTRIBUTE");
      rest = rest.slice(a[0].length);
      const key = a[1].toLowerCase();
      if (seen.has(key) || key.startsWith("on")) reject("ATTRIBUTE");
      seen.add(key);
      const value = decode(a[2] ?? a[3] ?? "");
      if (controls.test(value)) reject("ATTRIBUTE");
      let canonicalKey = key;
      if (key === "id") {
        if (!/^[a-zA-Z][\w.-]*$/.test(value) || ids.has(value)) reject("ID");
        ids.add(value);
      } else if (key === "href" && lower === "a" && !inSvg) url(value, references);
      else if ((key === "href" || key === "xlink:href") && lower === "use" && inSvg) local(value, references);
      else if (key === "src" && lower === "img") {
        if (!/^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) reject("RESOURCE");
      } else if (key === "alt" && lower === "img") { /* Alternative text. */ }
      else if (["width", "height"].includes(key) && lower === "img") {
        if (!/^\d+$/.test(value)) reject("ATTRIBUTE");
      } else if (key === "open" && lower === "details" && value === "") { /* Native control. */ }
      else if (key === "scope" && lower === "th" && ["row", "col", "rowgroup", "colgroup"].includes(value)) { /* Table. */ }
      else if (["colspan", "rowspan"].includes(key) && ["td", "th"].includes(lower) && /^[1-9]\d?$/.test(value)) { /* Table. */ }
      else if (common.has(key)) { /* No execution or network capabilities. */ }
      else if (inSvg && svgAttrs.has(key)) {
        canonicalKey = svgAttrs.get(key);
        if (!/^[\w\s.,%()+-]+$/.test(value)) reject("ATTRIBUTE");
      } else if (inSvg && ["marker-end", "marker-start", "marker-mid"].includes(key)) {
        const m = /^url\((#[\w.-]+)\)$/.exec(value);
        if (!m) reject("URL");
        local(m[1], references);
      } else reject("ATTRIBUTE");
      attrs += ` ${canonicalKey}="${escape(value)}"`;
    }
    if (lower === "img" && (!seen.has("src") || !seen.has("alt"))) reject("ATTRIBUTE");
    output += `<${canonical}${attrs}>`;
    if (inSvg && selfClosing) output += `</${canonical}>`;
    else if (!voidTags.has(lower)) {
      if (selfClosing) reject("HTML");
      stack.push({lower, name: canonical});
    }
  }
  if (stack.length) reject("HTML");
  for (const id of references) if (!ids.has(id)) reject("REFERENCE");
  return output;
}

export function packagePage({composition, css = "", title = "Lesson", language = "en", theme = "auto"}) {
  if (![composition, css, title, language, theme].every(v => typeof v === "string")) reject("INPUT");
  if (Buffer.byteLength(composition + css + title) > MAX_BYTES) reject("SIZE");
  if (controls.test(composition) || !/^[a-z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(language) || !["auto", "light", "dark"].includes(theme)) reject("INPUT");
  const references = [];
  const layout = validateCss(css, references);
  const content = validateComposition(composition, references);
  const html = `<!doctype html>\n<html lang="${language}"${theme === "auto" ? "" : ` data-theme="${theme}"`}><head>\n<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="color-scheme" content="light dark">\n<title>${escape(title)}</title>\n<style>\n${tokens}\n${layout}\n</style></head><body>\n${content}\n</body></html>\n`;
  if (Buffer.byteLength(html) > MAX_BYTES) reject("SIZE");
  return html;
}

function cli(args) {
  const usage = "Usage: package-page.mjs composition.html [--css layout.css] [--title text] [--language en] [--theme auto|light|dark] --output page.html";
  const options = {}, mapping = {"--css": "css", "--title": "title", "--language": "language", "--theme": "theme", "--output": "output"};
  const input = args.shift();
  if (!input || input.startsWith("--")) { process.stderr.write(usage + "\n"); return 2; }
  while (args.length) {
    const key = mapping[args.shift()], value = args.shift();
    if (!key || !value || value.startsWith("--") || Object.hasOwn(options, key)) { process.stderr.write(usage + "\n"); return 2; }
    options[key] = value;
  }
  if (!options.output || [input, options.css, fileURLToPath(new URL("../assets/theme.css", import.meta.url))].filter(Boolean).some(p => realPath(p) === realPath(options.output))) { process.stderr.write(usage + "\n"); return 2; }
  let html;
  try {
    html = packagePage({...options, composition: readFileSync(input, "utf8"), css: options.css ? readFileSync(options.css, "utf8") : ""});
  } catch (error) {
    const rejection = /^EXPLAIN_/.test(error.message);
    process.stderr.write(rejection ? error.message + "\n" : "Read error.\n");
    return rejection ? 1 : 2;
  }
  let temporary;
  try {
    temporary = mkdtempSync(join(dirname(resolve(options.output)), ".explain-"));
    const file = join(temporary, "page.html");
    writeFileSync(file, html);
    renameSync(file, resolve(options.output));
    process.stdout.write(`Static page: ${Buffer.byteLength(html)} bytes.\n`);
    return 0;
  } catch { process.stderr.write("Write error.\n"); return 2; }
  finally { if (temporary) rmSync(temporary, {recursive: true, force: true}); }
}
if (process.argv[1] && realPath(process.argv[1]) === realPath(fileURLToPath(import.meta.url))) process.exitCode = cli(process.argv.slice(2));
