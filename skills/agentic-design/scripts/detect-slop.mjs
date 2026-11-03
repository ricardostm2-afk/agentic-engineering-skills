#!/usr/bin/env node
// =============================================================================
// detect-slop.mjs — MECHANICAL findings of "AI aesthetics" in UI files.
//
// Catches only what a text pattern can catch precisely. The rest (hierarchy,
// ugly lists, empty states without an answer, cards inside cards) requires
// judgement and lives in the ui-without-slop.md checklist. A detector that
// shouts everywhere gets disabled the next day: each rule here was tuned
// against a well-designed product until blockers were rare and real.
//
// Usage:
//   node detect-slop.mjs <file|folder>...       analyse paths (whole files)
//   node detect-slop.mjs --diff <ref> [paths]   only lines changed since <ref>
//   --json                                     machine-readable output
//
// With --diff, a finding on a line untouched by the diff is "pre-existing":
// listed separately and does not affect the exit code. A new file (including
// one not tracked by git) counts in full.
//
// Exit: 0 without blockers (notices possible), 1 with blockers, 2 if unable
// to analyse (invalid argument, unreadable file, git failure, no files
// analysed, or UI files it cannot read).
// Fail closed: never says "clean" about what it has not read.
//
// Escape: `slop-ok: <reason>` in a comment on the finding's line or, alone
// on a line, on the previous one. For a block (e.g. a list of emoji used as
// data): `slop-ok-block: <reason>` … `slop-ok-end`. Without a reason, the
// escape itself is a blocker. Used escapes are always listed.
//
// Allowed without an escape (listed under "Allowed" for the reviewer to judge):
// - emoji as DATA: an emoji-only literal in a list or object (reactions the
//   user chooses), or the value of a content key (`message`, `comment`,
//   `emoji`…). In JSX, an attribute, an icon/label key, a standalone constant
//   or beside text, it is an icon: blocked.
// - a BRAND gradient declared in `.agentic/ui.json` at the project root:
//   {"brand_gradients": ["--brand-gradient"]}. Allows that token's definition
//   (CSS, Sass or config key) and declarations using it with var(); a
//   handwritten gradient or Tailwind gradient classes still block.
// =============================================================================

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXT_JS = [".js", ".mjs", ".cjs", ".ts", ".mts", ".cts"];
const EXT_MARKUP = [".html", ".htm", ".vue", ".svelte", ".astro", ".hbs", ".handlebars", ".njk", ".ejs", ".erb", ".liquid", ".twig", ".jinja", ".jinja2", ".j2"];
const EXTENSIONS = [".css", ".scss", ".tsx", ".jsx", ...EXT_JS, ...EXT_MARKUP];
// Translation files: text rules only (emoji, marketing, "no data").
const EXT_TRANSLATION_ALWAYS = [".po", ".pot", ".arb", ".xliff", ".xlf", ".strings"];
const EXT_TRANSLATION_IN_FOLDER = [".json", ".yml", ".yaml", ".properties"];
const IS_TRANSLATION_FOLDER = /(^|[\\/])(locales?|i18n|l10n|lang|langs|languages|translations?|messages|intl)[\\/]/i;
const IS_TRANSLATION_NAME = /^[a-z]{2,3}([-_][A-Za-z]{2,4})?\.(json|ya?ml|properties)$/;
// Not UI: type declarations and minified code.
const IS_EXCLUDED = /\.d\.[mc]?ts$|\.min\.(js|css)$/;
// Documentation and data not searched for markup with --diff.
const EXT_WITHOUT_UI = new Set([".md", ".mdx", ".txt", ".rst", ".adoc", ".svg", ".lock", ".map", ".csv", ".sql", ".snap"]);
const IS_MARKUP = /<(html|body|div|span|p|a|button|section|header|footer|main|nav|aside|h[1-6]|ul|ol|li|table|tr|td|th|form|input|label|select|textarea|img|style)\b[^>]*>/i;
const IGNORED_FOLDERS = new Set(["node_modules", ".git", ".next", "dist", "build", "out", "coverage", ".turbo", ".svelte-kit", ".nuxt", "vendor"]);
const IS_TEST = /(^|[\\/])(__tests__|__mocks__|tests?|e2e)[\\/]|\.(test|spec|stories)\.[^.\\/]+$/;
// Files where colour literals ARE the system (token definitions).
const IS_TOKEN_FILE = /(tokens?|theme|palette|colou?rs?|variables|globals|brand|tailwind)[^\\/]*$/i;

const RULES = {
  "purple-gradient": { severity: "blocker", suggestion: "Remove the gradient. Use a flat colour from the project's tokens; if the brand needs depth, a lightness step in the SAME hue. For an owner-approved brand gradient: define it in a token, declare the token in .agentic/ui.json (\"brand_gradients\") and use it with var()." },
  "background-gradient": { severity: "blocker", suggestion: "Use a flat section background (surface token). For a brand gradient: a token declared in .agentic/ui.json (\"brand_gradients\"), used with var(); another recorded decision carries `slop-ok: <reason>`." },
  emoji: { severity: "blocker", suggestion: "Remove the emoji. If the idea needs a sign, use the project's icon set; the word is almost always enough. If the emoji is data (reactions, people's content), it comes from data or a list of emoji-only values, not JSX." },
  "small-text": { severity: "blocker", suggestion: "Minimum 12 px (13–14 px in data rows). If the text cannot withstand a readable size, it probably does not need to be there." },
  "spaced-uppercase": { severity: "blocker", suggestion: "Use a sentence-case label, without tracking. The spaced uppercase overline is a tic; the heading is enough." },
  "transition-all": { severity: "blocker", suggestion: "Name the properties that change (e.g. transition: opacity 150ms, background-color 150ms). all also animates layout and things nobody requested." },
  "marketing-microcopy": { severity: "blocker", suggestion: "Say what happens in domain words: Save, 3 orders to send. No promises or enthusiasm." },
  "literal-color": { severity: "notice", suggestion: "Use the design system token. Legitimate exceptions (data, charts, security alerts) carry `slop-ok: <reason>`." },
  "large-radius": { severity: "notice", suggestion: "Use the project's radius scale (typically 4–12 px). Large radii only for pills and avatars." },
  "large-shadow": { severity: "notice", suggestion: "Large shadows are for floating layers (dialog, menu). In content, separate with space and alignment." },
  "no-data": { severity: "notice", suggestion: "An empty state is not an answer: say what it means (No orders to send today) and the next action, with a button." },
  "hover-moves-target": { severity: "notice", suggestion: "Hover does not move the target: change background or weight, inside @media (hover: hover). On a touchscreen, a moving target turns the first tap into selection." },
  "continuous-motion": { severity: "notice", suggestion: "Continuous motion only during a real wait (spinner, skeleton, progress). Otherwise the state appears still in the first frame." },
  "glass-on-content": { severity: "notice", suggestion: "Glass belongs on the frame (sidebar, top bar) and floating layers; content sits on a solid surface with a static background." },
  "side-border": { severity: "notice", suggestion: "A coloured side border marking a block is a tic: state is expressed in words, with colour only where attention is needed. For navigation and the active item, the selector says so (nav, active, aria-current)." },
  "outlined-button": { severity: "notice", suggestion: "No button is bounded by a line, in any state: secondary actions use a tonal background or a light shadow, or go in the menu. Keep the focus ring and forced-colors." },
  "empty-dash": { severity: "notice", suggestion: "Omit an empty field (label and value) instead of showing a dash." },
  "decorative-numbering": { severity: "notice", suggestion: "Remove 01 / … numbering: the heading is enough. Step 2 of 3 is information and stays." },
  "escape-no-reason": { severity: "blocker", suggestion: "Write the reason: `slop-ok: <why this exception is a decision rather than a tic>`." },
  "escape-no-end": { severity: "blocker", suggestion: "Close the block with `slop-ok-end`: an open block suppresses nothing." }
};

// -----------------------------------------------------------------------------
// Colour
// -----------------------------------------------------------------------------

const RE_COLOR = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\([^()]*\)/gi;

function toRgb(colour) {
  const c = colour.trim().toLowerCase();
  if (c.startsWith("#")) {
    let h = c.slice(1);
    if (h.length <= 4) h = [...h].map((x) => x + x).join("");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  }
  const m = /^([a-z]+)\(([^)]*)\)$/.exec(c);
  if (!m) return null;
  const parts = m[2].replace(/\//g, " ").split(/[\s,]+/).filter(Boolean);
  const num = (s, scale) => (s.endsWith("%") ? parseFloat(s) / 100 : parseFloat(s) / scale);
  if (m[1].startsWith("rgb")) return parts.slice(0, 3).map((p) => num(p, 255));
  if (m[1].startsWith("hsl")) {
    const h = parseFloat(parts[0]);
    const s = num(parts[1] ?? "0", 100);
    const l = num(parts[2] ?? "0", 100);
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return [0, 8, 4].map((n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)));
  }
  if (m[1] === "oklch" || m[1] === "oklab") {
    const L = num(parts[0], 1);
    let A = parseFloat(parts[1]);
    let B = parseFloat(parts[2]);
    if (m[1] === "oklch") {
      const C = A;
      const H = (B * Math.PI) / 180;
      A = C * Math.cos(H);
      B = C * Math.sin(H);
    }
    const l_ = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
    const m_ = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
    const s_ = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    const lin = [
      4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
      -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
      -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_
    ];
    return lin.map((v) => Math.min(1, Math.max(0, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
  }
  return null; // lab/lch/hwb: counts as a literal, but hue is not measured
}

function hsl([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s, l };
}

// Purple/indigo/violet: HSL hue 230–290, saturated, neither near-white nor near-black.
function isPurple(colour) {
  const rgb = toRgb(colour);
  if (!rgb || rgb.some((v) => Number.isNaN(v))) return false;
  const { h, s, l } = hsl(rgb);
  return h >= 230 && h <= 290 && s >= 0.3 && l >= 0.15 && l <= 0.92;
}

// -----------------------------------------------------------------------------
// Measurements
// -----------------------------------------------------------------------------

function toPx(number, unit) {
  const n = parseFloat(number);
  if (unit === "px" || unit === "") return n;
  if (unit === "rem" || unit === "em") return n * 16;
  if (unit === "pt") return (n * 4) / 3;
  if (unit === "mm") return n * 3.7795;
  if (unit === "cm") return n * 37.795;
  return NaN;
}

const RE_MEASUREMENT = /(-?\d*\.?\d+)(px|rem|em|pt|mm|cm)\b/g;

// Tracking that counts as "spaced": positive and from 0.03 em (0.5 px). The same threshold
// applies in CSS (`letter-spacing`) and arbitrary Tailwind classes (`tracking-[…]`).
function positiveSpacing(value) {
  const m = /(-?\d*\.?\d+)(em|px|rem)?/.exec(value);
  return Boolean(m) && parseFloat(m[1]) >= (m[2] === "px" ? 0.5 : 0.03);
}

// "Large" shadows: blur ≥ 20 px, without `inset`. Returns the largest blur.
function maxBlur(value) {
  let largest = 0;
  for (const part of splitTopLevel(value)) {
    if (/\binset\b/.test(part)) continue;
    const withoutColour = part.replace(RE_COLOR, " ");
    const measurements = [...withoutColour.matchAll(/(-?\d*\.?\d+)(px|rem|em)?(?![\w%(])/g)].map((m) => toPx(m[1], m[2] ?? "px"));
    if (measurements.length >= 3) largest = Math.max(largest, measurements[2]);
  }
  return largest;
}

function splitTopLevel(value) {
  const out = [];
  let depth = 0;
  let current = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(current);
      current = "";
    } else current += ch;
  }
  out.push(current);
  return out;
}

// -----------------------------------------------------------------------------
// Remove comments, preserve positions (replace with spaces, keep line breaks)
// -----------------------------------------------------------------------------

function withoutComments(text, type) {
  const out = text.split("");
  const erase = (from, to) => {
    for (let k = from; k < to && k < out.length; k++) if (out[k] !== "\n") out[k] = " ";
  };
  if (type === "markup") {
    for (const m of text.matchAll(/<!--[\s\S]*?-->/g)) erase(m.index, m.index + m[0].length);
  }
  const doubleSlash = type !== "css"; // `//` is a comment in JS/TS and SCSS; not CSS
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (out[i] === " " && ch !== " ") continue; // already erased (HTML)
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      else if (ch === "\n" && quote !== "`") quote = null;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      const to = end === -1 ? text.length : end + 2;
      erase(i, to);
      i = to - 1;
    } else if (doubleSlash && ch === "/" && text[i + 1] === "/" && text[i - 1] !== ":") {
      const end = text.indexOf("\n", i);
      const to = end === -1 ? text.length : end;
      erase(i, to);
      i = to - 1;
    } else if (ch === '"' || ch === "'" || (ch === "`" && type !== "css" && type !== "scss")) {
      quote = ch;
    }
  }
  return out.join("");
}

// -----------------------------------------------------------------------------
// CSS: declarations with their containing selector
// -----------------------------------------------------------------------------

function cssDeclarations(css, lineAt) {
  const decls = [];
  const stack = [];
  let start = 0;
  let parentheses = 0;
  let quote = null;
  const close = (end) => {
    const raw = css.slice(start, end);
    const colon = raw.indexOf(":");
    if (colon > 0 && /\S/.test(raw)) {
      const offset = raw.search(/\S/);
      decls.push({
        prop: raw.slice(0, colon).trim().toLowerCase(),
        value: raw.slice(colon + 1).trim(),
        line: lineAt(start + offset),
        selectors: [...stack]
      });
    }
  };
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") parentheses++;
    else if (ch === ")") parentheses = Math.max(0, parentheses - 1);
    else if (parentheses > 0) continue;
    else if (ch === "{") {
      stack.push(css.slice(start, i).trim());
      start = i + 1;
    } else if (ch === "}") {
      close(i);
      stack.pop();
      start = i + 1;
    } else if (ch === ";") {
      close(i);
      start = i + 1;
    }
  }
  return decls;
}

// Only CSS inside <style> in a markup file (the rest becomes spaces).
function stylesOnly(text) {
  const out = text.replace(/[^\n]/g, " ").split("");
  for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    const from = m.index + m[0].indexOf(">") + 1;
    for (let k = from; k < from + m[1].length; k++) out[k] = text[k];
  }
  return out.join("");
}

// -----------------------------------------------------------------------------
// UI text on a markup line: literals and text between tags
// -----------------------------------------------------------------------------

function textSegments(line) {
  const segs = [];
  for (const m of line.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|`([^`]*)`/g)) segs.push(m[1] ?? m[2] ?? m[3]);
  for (const m of line.matchAll(/[>}]([^<>{}]+)(?=[<{])/g)) segs.push(m[1]);
  const t = line.trim();
  // A prose-only line between tags (JSX/HTML splitting text over lines).
  if (/^[\p{L}«"“(¿¡]/u.test(t) && !/[=;{}<>]|=>/.test(t) && /\s/.test(t) && !/^(import|export|const|let|var|return|if|else|function|type|interface)\b/.test(t)) segs.push(t);
  return segs.filter((s) => /\p{L}/u.test(s));
}

const withoutAccents = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const MARKETING = [
  /\bunlock\s+(the|your|full|all|new|more|premium|powerful)\b/,
  /\bunlock\s+(the\s+)?(potential|power)\b/,
  /\bwithout\s+(effort|complications|stress)\b/,
  /\bwelcome\s+back\b/,
  /\bin\s+the\s+blink\s+of\s+an\s+eye\b/,
  /\brevolutionary\b/,
  /\bmaximi[sz]e\s+your\s+potential\b/,
  /\bnext[- ]level\b/,
  /\b(amazing|unique|magical|fluid|perfect)\s+experience\b/,
  /\beverything\s+in\s+one\s+place\b/,
  /\bsupercharg/,
  /\bunlock\s+(the|your|full|all|new|more|premium|powerful)\b/,
  /\beffortless(ly)?\b/,
  /\bseamless(ly)?\b/,
  /\bsupercharg/,
  /\bgame[- ]?changer\b/,
  /\bnext[- ]level\b/,
  /\bwelcome\s+back\b/,
  /\brevolutioni[sz]/,
  /\belevate\s+your\b/,
  /\ball[- ]in[- ]one\b/,
  /\bblazing(ly)?[- ]fast\b/,
  /\blike\s+never\s+before\b/,
  /\bsay\s+goodbye\s+to\b/,
  /\bcutting[- ]edge\b/,
  /\bbest[- ]in[- ]class\b/,
  /\bworld[- ]class\b/
];

const NO_DATA = new Set(["no data", "no data available", "no data yet", "there is no data", "nothing to display", "nothing to show", "nothing here", "nothing here yet"]);

// Layers floating above content: a large shadow is structure there, not decoration.
const IS_FLOATING_LAYER = /dialog|modal|popover|popup|menu|dropdown|tooltip|toast|sheet|drawer|overlay|backdrop|float|combobox|listbox|command|lightbox|snackbar|side-?nav|sidebar/i;

// Application frame: glass is brand material there, not a veil over content.
const IS_FRAME = /\bnav|topbar|top-bar|toolbar|header|frame|shell|appbar|app-bar/i;
// Real waits: continuous animation signals ongoing work there.
const IS_WAIT = /spinner|loader|loading|skeleton|progress|busy|wait|pending/i;
// Functional side borders: navigation, active or selected items, tabs and quotes.
const IS_SIDE_OK = /nav|menu|sidebar|tab|active|current|selected|blockquote|citation|quote/i;
// Buttons (where an outline is the B20 tic) and fields (where an outline has a function).
const IS_BUTTON = /button|btn|outline|ghost/i;
const IS_FIELD = /input|select|textarea|field|form-control/i;
// Decorative numbering before a heading: "01 / Data", "02 · Summary".
const RE_NUMBERING = /^\s*0\d\s*[/·•.|—–-]\s*\p{L}/u;

const RE_EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u;

const RE_EMOJI_G = new RegExp(RE_EMOJI.source, "gu");
const RE_LITERAL = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`([^`]*)`/g;
// Keys whose value is an icon or UI text: emoji is decoration there.
const IS_ICON_KEY = /icon|glyph|symbol|label|title|heading|header|prefix|suffix|badge|button|cta|menu|nav/i;
// Keys whose value is content: emoji is data, even beside text.
const IS_DATA_KEY = /emoji|reaction|content|message|comment|body|post|reply/i;

// Emoji as data or icon, by key and value (no letters = data atom).
function classifyValue(key, value) {
  if (/<[a-z]/i.test(value)) return "icon"; // HTML in a template string
  if (key && IS_ICON_KEY.test(key)) return "icon";
  if (key && IS_DATA_KEY.test(key)) return "data";
  return /\p{L}/u.test(value) ? "icon" : "data";
}

// On a code line: emoji is data only inside a literal that is a list element
// (`[` or `,` before it, or alone at the start of a line) or a key's value
// (`:` before it). Outside a literal (JSX text), in an attribute (`=`), an
// expression (`{`, `(`) or a standalone constant, it is an icon.
function emojiOnLine(line) {
  const literals = [...line.matchAll(RE_LITERAL)].map((m) => ({ from: m.index, to: m.index + m[0].length, value: m[1] ?? m[2] ?? m[3] }));
  let data = null;
  for (const e of line.matchAll(RE_EMOJI_G)) {
    const lit = literals.find((l) => e.index > l.from && e.index < l.to);
    const before = lit ? line.slice(0, lit.from).trimEnd() : "";
    let type = "icon";
    if (lit && before.endsWith(":")) type = classifyValue(/["'`]?([\p{L}\w$-]+)["'`]?\s*:$/u.exec(before)?.[1] ?? "", lit.value);
    else if (lit && (before === "" || /[[,]$/.test(before))) type = classifyValue("", lit.value); // list element (also alone on its line)
    if (type === "icon") return { type, emoji: e[0] };
    data ??= { type, emoji: e[0] };
  }
  return data;
}

// On a translation line (`"key": "value"`, `key = value`, `key: value`).
function emojiInTranslation(line) {
  const e = RE_EMOJI.exec(line);
  if (!e) return null;
  const m = /^\s*["']?([\w.\-[\]]+)["']?\s*[:=]\s*(.*)$/.exec(line);
  if (!m) return { type: "icon", emoji: e[0] };
  return { type: classifyValue(m[1], m[2].replace(/^["']|["'],?\s*$/g, "")), emoji: e[0] };
}

// -----------------------------------------------------------------------------
// Project declaration: .agentic/ui.json
// -----------------------------------------------------------------------------

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function readDeclaration(root) {
  const f = path.join(root, ".agentic", "ui.json");
  const empty = { source: null, brandGradients: [] };
  if (!existsSync(f)) return empty;
  const source = path.relative(process.cwd(), f) || f;
  let json;
  try {
    json = JSON.parse(readFileSync(f, "utf8"));
  } catch (e) {
    throw new UsageError(`${source} is not valid JSON: ${e.message}`);
  }
  const list = json?.brand_gradients ?? [];
  if (!Array.isArray(list) || !list.every((n) => typeof n === "string" && /^(--|\$)?[A-Za-z_][\w-]*$/.test(n))) {
    throw new UsageError(`${source}: "brand_gradients" must be a list of token names (e.g. ["--brand-gradient"])`);
  }
  return { source, brandGradients: list.map((n) => n.replace(/^(--|\$)/, "")) };
}

// Brand name this declaration/line defines or uses, or null.
function brandIn(text, prop, decl) {
  for (const n of decl.brandGradients) {
    if (prop !== undefined && prop.replace(/^(--|\$)/, "") === n && /^(--|\$)/.test(prop)) return n;
    if (new RegExp(`var\\(\\s*--${escRe(n)}\\s*[,)]|\\$${escRe(n)}\\b`).test(text)) return n;
    if (prop === undefined && new RegExp(`(^|[\\s{,(])["'\`]?(--|\\$)?${escRe(n)}["'\`]?\\s*:`).test(text)) return n;
  }
  return null;
}

// -----------------------------------------------------------------------------
// Analyse a file
// -----------------------------------------------------------------------------

// Translation file comments: `#`/`!` lines (po, yaml, properties);
// .strings uses JS-style comments.
function withoutTranslationComments(text, ext) {
  if (ext === ".strings") return withoutComments(text, "js");
  return text
    .split("\n")
    .map((l) => (/^\s*[#!]/.test(l) ? l.replace(/[^\n]/g, " ") : l))
    .join("\n");
}

function analyse(filePath, text, translation = false, decl = { source: null, brandGradients: [] }) {
  const ext = path.extname(filePath).toLowerCase();
  const isCss = ext === ".css" || ext === ".scss";
  const type = translation ? "text" : ext === ".css" ? "css" : ext === ".scss" ? "scss" : EXT_MARKUP.includes(ext) ? "markup" : "js";
  const clean = type === "text" ? withoutTranslationComments(text, ext) : withoutComments(text, type);
  const lines = clean.split("\n");
  const rawLines = text.split("\n");
  const lineStarts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") lineStarts.push(i + 1);
  const lineAt = (pos) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= pos) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
  const tokens = IS_TOKEN_FILE.test(path.basename(filePath));
  const findings = [];
  const shadows = [];
  const allowed = [];
  const seen = new Set();
  const find = (line, rule, message) => {
    const key = `${line}|${rule}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({ file: filePath, line, rule, severity: RULES[rule].severity, message, suggestion: RULES[rule].suggestion, snippet: (rawLines[line - 1] ?? "").trim().slice(0, 140) });
  };
  const allow = (line, rule, reason) => {
    if (!seen.has(`${line}|${rule}`)) allowed.push({ file: filePath, line, rule, reason, snippet: (rawLines[line - 1] ?? "").trim().slice(0, 140) });
    seen.add(`${line}|${rule}`);
  };
  // Gradient: allow and list it if it is the declared brand token.
  const gradient = (brand, line, rule, message) =>
    brand ? allow(line, rule, `brand gradient --${brand} declared in ${decl.source}`) : find(line, rule, message);
  const emoji = (r, line, where) => {
    if (!r) return;
    if (r.type === "data") allow(line, "emoji", `emoji «${r.emoji}» as data (list or content-key value, not an icon)`);
    else find(line, "emoji", `emoji «${r.emoji}» ${where}`);
  };

  // --- CSS (style files and <style> inside markup) ----------------------------
  // In JS/TS, <style> in a template string (server-generated HTML) counts too.
  const css = isCss ? clean : type === "markup" || (type === "js" && /<style[\s>]/i.test(clean)) ? stylesOnly(clean) : "";
  if (css.trim()) {
    const decls = cssDeclarations(css, lineAt);
    const byBlock = new Map();
    for (const d of decls) {
      const selector = d.selectors.filter((s) => !s.startsWith("@")).at(-1) ?? "";
      const inPrint = d.selectors.some((s) => /^@media\b[^{]*\bprint\b/.test(s) && !/\bscreen\b/.test(s));
      const v = d.value;
      const countBefore = findings.length;
      if (/gradient\(/.test(v) && !d.prop.startsWith("--") && !d.prop.startsWith("$")) {
        const purples = (v.match(RE_COLOR) ?? []).filter(isPurple);
        const brand = brandIn(v, d.prop, decl);
        if (purples.length) gradient(brand, d.line, "purple-gradient", `gradient with ${purples[0]} (purple/indigo)`);
        else if (/^background(-image)?$/.test(d.prop) && /(^|[\s.#>+~,(-])(body|html|main|section|header|footer)\b|hero|banner|landing|jumbotron|splash/i.test(selector) && !/mask/.test(d.prop)) {
          gradient(brand, d.line, "background-gradient", `gradient on the background of «${selector.slice(0, 60)}»`);
        }
      } else if (/gradient\(/.test(v) && (v.match(RE_COLOR) ?? []).some(isPurple)) {
        gradient(brandIn(v, d.prop, decl), d.line, "purple-gradient", "gradient token with purple/indigo");
      }
      if ((d.prop === "font-size" || d.prop === "font") && !/\b(calc|clamp|min|max|var)\(/.test(v) && !inPrint) {
        const m = [...v.matchAll(RE_MEASUREMENT)][0];
        if (m && toPx(m[1], m[2]) < 12 && toPx(m[1], m[2]) > 0) find(d.line, "small-text", `${d.prop}: ${m[0]} (< 12 px)`);
      }
      if (/radius$/.test(d.prop) && !d.prop.startsWith("--") && !/pill|avatar|chip|badge|circle|round|dot|toggle|switch|thumb|capsul|knob|handle|fab\b/i.test(selector)) {
        const px = [...v.matchAll(RE_MEASUREMENT)].map((m) => toPx(m[1], m[2]));
        const large = px.find((n) => n >= 20 && n < 999);
        if (large !== undefined) find(d.line, "large-radius", `${d.prop}: ${v} (≥ 20 px)`);
      }
      if (d.prop === "box-shadow" && !/^none$/i.test(v) && !IS_FLOATING_LAYER.test(d.selectors.join(" "))) {
        const blur = maxBlur(v);
        if (blur >= 20) shadows.push({ line: d.line, message: `box-shadow with ${Math.round(blur)} px blur` });
      }
      if (!tokens && !d.prop.startsWith("--") && !d.prop.startsWith("$") && findings.length === countBefore) {
        const colour = v.match(RE_COLOR);
        if (colour) find(d.line, "literal-color", `${d.prop}: ${colour[0]} outside tokens`);
      }
      const selectors = d.selectors.filter((s) => !s.startsWith("@")).join(" ");
      const inMedia = (re) => d.selectors.some((s) => s.startsWith("@media") && re.test(s));
      if ((d.prop === "transition" && splitTopLevel(v).some((p) => /(^|\s)all(\s|$)/.test(p.trim()))) || (d.prop === "transition-property" && /\ball\b/.test(v))) {
        find(d.line, "transition-all", `${d.prop}: ${v.slice(0, 50)}`);
      }
      const withoutImportant = v.replace(/\s*!important\s*$/i, "");
      // The target is the :hover element itself (last compound selector), not its descendant.
      const targetOnHover = splitTopLevel(selectors).some((s) => /:hover\b/.test(s.trim().split(/\s*[\s>+~]\s*/).at(-1) ?? ""));
      if (/^(transform|translate|scale)$/.test(d.prop) && !/^none$/i.test(withoutImportant) && targetOnHover && !inMedia(/\(\s*hover\s*:\s*hover\s*\)/)) {
        find(d.line, "hover-moves-target", `${d.prop}: ${v.slice(0, 40)} in «${selectors.slice(0, 60)}», outside @media (hover: hover)`);
      }
      if ((d.prop === "animation" || d.prop === "animation-iteration-count") && /\binfinite\b/.test(v) && !IS_WAIT.test(selectors)) {
        find(d.line, "continuous-motion", `${d.prop}: ${v.slice(0, 50)} in «${selectors.slice(0, 60)}»`);
      }
      if (/^border-(left|inline-start)$/.test(d.prop) && !/\b(none|hidden)\b/.test(v) && !IS_SIDE_OK.test(selectors) && !inMedia(/forced-colors/)) {
        const width = Math.max(0, ...[...v.matchAll(RE_MEASUREMENT)].map((m) => toPx(m[1], m[2])), /\bthick\b/.test(v) ? 5 : /\bmedium\b/.test(v) ? 3 : 0);
        if (width >= 2) find(d.line, "side-border", `${d.prop}: ${v.slice(0, 40)} in «${selectors.slice(0, 60)}»`);
      }
      const key = d.selectors.join(" » ");
      const block = byBlock.get(key) ?? { uppercase: 0, spaced: false, glass: 0, border: 0, transparentBackground: false, selectors, forced: inMedia(/forced-colors/) };
      if (/^(-webkit-)?backdrop-filter$/.test(d.prop) && !/^none$/i.test(v)) block.glass ||= d.line;
      if (d.prop === "border" && !/\b(none|hidden|transparent)\b|^0(px)?\b/.test(v)) block.border ||= d.line;
      if (/^background(-color)?$/.test(d.prop) && /^(transparent|none)$/i.test(v.trim())) block.transparentBackground = true;
      if (d.prop === "text-transform" && /uppercase/.test(v)) block.uppercase = d.line;
      if (d.prop === "letter-spacing" && positiveSpacing(v)) block.spaced = true;
      byBlock.set(key, block);
    }
    for (const [key, b] of byBlock) {
      if (b.uppercase && b.spaced) find(b.uppercase, "spaced-uppercase", `uppercase with letter-spacing in «${key.split(" » ").at(-1).slice(0, 60)}»`);
      if (b.glass && !IS_FLOATING_LAYER.test(b.selectors) && !IS_FRAME.test(b.selectors)) find(b.glass, "glass-on-content", `backdrop-filter in «${b.selectors.slice(0, 60)}», outside the frame and floating layers`);
      if (b.border && IS_BUTTON.test(b.selectors) && (b.transparentBackground || /outline|ghost/i.test(b.selectors)) && !IS_FIELD.test(b.selectors) && !/:focus/.test(b.selectors) && !b.forced) {
        find(b.border, "outlined-button", `button with an outline and transparent background in «${b.selectors.slice(0, 60)}»`);
      }
    }
  }

  // UI text: marketing and "no data" in each segment.
  const textRules = (n, segs) => {
    for (const seg of segs) {
      const t = withoutAccents(seg);
      const mk = MARKETING.map((re) => re.exec(t)).find(Boolean);
      if (mk) find(n, "marketing-microcopy", `«${seg.trim().slice(0, 60)}»`);
      if (NO_DATA.has(t.trim().replace(/[.!…:]+$/, "").trim())) find(n, "no-data", `«${seg.trim()}» alone`);
      if (RE_NUMBERING.test(seg)) find(n, "decorative-numbering", `«${seg.trim().slice(0, 40)}»`);
    }
  };

  // --- Translation files: text rules only ------------------------------------
  if (type === "text") {
    lines.forEach((line, i) => {
      if (!line.trim()) return;
      emoji(emojiInTranslation(line), i + 1, "in UI text");
      const value = line.replace(/^\s*["']?[\w.\-[\]]+["']?\s*[:=]\s*/, "");
      textRules(i + 1, [...textSegments(line), ...(value !== line && /\p{L}/u.test(value) ? [value] : [])]);
    });
  }

  // --- Markup and code (TSX/JSX/JS/TS/HTML/Vue/Svelte/Astro…), line by line
  if (!isCss && type !== "text") {
    lines.forEach((line, i) => {
      const n = i + 1;
      if (!line.trim()) return;
      emoji(emojiOnLine(line), n, "in the UI");
      // Gradients: Tailwind classes and inline styles. Handwritten classes
      // are never the brand; a literal defining or using the declared token is.
      const twPurple = /\b(?:from|via|to)-(indigo|violet|purple|fuchsia)-\d{2,3}\b/.exec(line);
      const gradientColour = (/gradient\(/.test(line) || /\b(?:from|via|to)-\[/.test(line)) && (line.match(RE_COLOR) ?? []).find(isPurple);
      if (twPurple) find(n, "purple-gradient", `Tailwind gradient with ${twPurple[0]}`);
      else if (gradientColour) gradient(brandIn(line, undefined, decl), n, "purple-gradient", `gradient with ${gradientColour} (purple/indigo)`);
      else if (/\bbg-(gradient-to-\w+|linear-(to-\w+|\d+)|radial|conic)\b|gradient\(/.test(line) && (/<(section|header|main|body|footer)\b/.test(line) || /\b(hero|banner|landing|jumbotron)\b/i.test(line))) {
        gradient(/gradient\(/.test(line) ? brandIn(line, undefined, decl) : null, n, "background-gradient", "gradient on a section background");
      }
      // Small text.
      for (const m of line.matchAll(/\btext-\[(\d*\.?\d+)(px|rem|em)\]/g)) if (toPx(m[1], m[2]) < 12) find(n, "small-text", `${m[0]} (< 12 px)`);
      for (const m of line.matchAll(/\bfont-?size\s*[:=]\s*\{?\s*["'`]?(\d*\.?\d+)(px|rem|em|pt|mm|cm)?(?![\w.%])/gi)) {
        const px = toPx(m[1], m[2] ?? "px");
        if (px > 0 && px < 12) find(n, "small-text", `font size ${m[1]}${m[2] ?? "px"} (< 12 px)`);
      }
      if (/\buppercase\b/.test(line) && [...line.matchAll(/(?<![\w-])tracking-(?:(?:wide|wider|widest)(?![\w-])|\[([^\]]+)\])/g)].some((m) => m[1] === undefined || positiveSpacing(m[1]))) {
        find(n, "spaced-uppercase", "uppercase + tracking classes on the same element");
      }
      // Motion, material, borders and buttons (B13, B15, B17, B18, B20, B22).
      if (/(?<![\w-])transition-all\b|\btransition(?:-?[Pp]roperty)?\s*:\s*["'`]?\s*all\b/.test(line)) find(n, "transition-all", "transition of all properties (all)");
      const hoverMove = /(?<![\w-])hover:-?(?:translate|scale)-[\w[\].-]+/.exec(line);
      if (hoverMove) find(n, "hover-moves-target", `${hoverMove[0]} moves the target on hover`);
      const continuous = /(?<![\w-])animate-(?:ping|bounce)\b|\banimation(?:IterationCount)?\s*:\s*["'`][^"'`]*\binfinite\b/.exec(line);
      if (continuous && !IS_WAIT.test(line)) find(n, "continuous-motion", `${continuous[0].slice(0, 50)} outside a wait`);
      const glass = /(?<![\w-])backdrop-blur(?:-[\w[\].]+)?(?![\w-])|\bbackdrop-?[Ff]ilter\s*:\s*["'`]?\s*(?!none)\w/.exec(line);
      if (glass) {
        const rest = line.replace(/(?<![\w-])backdrop-[\w[\].-]+|\bbackdrop-?[Ff]ilter/g, " ");
        if (!IS_FLOATING_LAYER.test(rest) && !IS_FRAME.test(rest)) find(n, "glass-on-content", `${glass[0].slice(0, 40)} outside the frame and floating layers`);
      }
      const side = /(?<![\w:-])border-[ls]-(?:[2-8]|\[\d+px\])(?![\w-])/.exec(line);
      if (side && !IS_SIDE_OK.test(line)) find(n, "side-border", `${side[0]} marking a block`);
      if (/\bvariant=\{?["'`]outline["'`]/.test(line) || (/<button\b/.test(line) && /(?<![\w:-])border(?:-[1-8])?(?![\w-])/.test(line) && /(?<![\w:-])bg-transparent\b/.test(line))) {
        find(n, "outlined-button", "button drawn as an outline");
      }
      const dash = /(?:\?\?|\|\|)\s*["'`]\s*[-–—]\s*["'`]|\?[^:?]*:\s*["'`]\s*[-–—]\s*["'`]/.exec(line);
      if (dash) find(n, "empty-dash", `${dash[0].trim()} in place of an empty field`);
      // Corners.
      for (const m of line.matchAll(/\brounded(?:-[trblse]{1,2})?-(3xl|\[(\d*\.?\d+)(px|rem)\])/g)) {
        const px = m[1] === "3xl" ? 24 : toPx(m[2], m[3]);
        if (px >= 20 && px < 999 && !/avatar|pill|chip|badge|circle/i.test(line)) find(n, "large-radius", `${m[0]} (≥ 20 px)`);
      }
      // Shadows.
      const floating = /\b(fixed|absolute)\b|role=["'](dialog|menu|listbox|tooltip)/.test(line) || IS_FLOATING_LAYER.test(line);
      for (const m of floating ? [] : line.matchAll(/\bshadow-(xl|2xl|\[[^\]]+\])/g)) {
        const blur = m[1].startsWith("[") ? maxBlur(m[1].slice(1, -1).replace(/_/g, " ")) : 25;
        if (blur >= 20) shadows.push({ line: n, message: `${m[0]} (${Math.round(blur)} px blur)` });
      }
      for (const m of floating ? [] : line.matchAll(/\bbox-?shadow\s*:\s*["'`]?([^"'`;}]+)/gi)) {
        const blur = maxBlur(m[1]);
        if (blur >= 20) shadows.push({ line: n, message: `box-shadow with ${Math.round(blur)} px blur` });
      }
      // Literal colour (one per line).
      if (!tokens && !/^\s*--[\w-]+\s*:/.test(line)) {
        const tw = /\b[a-z-]+-\[(#[0-9a-fA-F]{3,8}|(?:rgba?|hsla?|oklch)\([^\]]*\))\]/.exec(line);
        const inline = /\b(?:color|background(?:Color)?|fill|stroke|borderColor|border(?:-color)?)\s*[:=]\s*\{?\s*["'`]\s*(#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?|oklch)\([^)]*\))/.exec(line);
        const lit = tw?.[1] ?? inline?.[1];
        if (lit) find(n, "literal-color", `${lit} outside tokens`);
      }
      // UI text.
      textRules(n, textSegments(line));
    });
  }

  // `content: "✨"` in a style file is also UI.
  if (isCss) {
    lines.forEach((line, i) => {
      const emoji = /content\s*:/.test(line) && RE_EMOJI.exec(line);
      if (emoji) find(i + 1, "emoji", `emoji «${emoji[0]}» in content:`);
    });
  }

  // --- Escapes ---------------------------------------------------------------
  // An escape alone on a line (comment only) covers that line and the next;
  // an escape at the end of a code line covers only that line.
  const cleanReason = (s) => (s ?? "").replace(/\*\/|-->|\}\s*$|\*\/\s*\}|["',]+\s*$/g, "").trim();
  const hasReason = (s) => (s.match(/\p{L}/gu) ?? []).length >= 3;
  const commentOnly = (i) => /^\s*[{}]*\s*$/.test(lines[i] ?? "") || /^\s*"\/\/"\s*:/.test(rawLines[i] ?? "");
  const escapes = [];
  let block = null;
  rawLines.forEach((line, i) => {
    const n = i + 1;
    const start = /slop-ok-block\b\s*(?::\s*(.*))?/.exec(line);
    if (start) {
      const reason = cleanReason(start[1]);
      if (block) find(block.from, "escape-no-end", "`slop-ok-block` opened before closing the previous one");
      if (hasReason(reason)) block = { from: n, reason };
      else {
        block = null;
        find(n, "escape-no-reason", "`slop-ok-block` without a reason");
      }
      return;
    }
    if (/slop-ok-end\b/.test(line)) {
      if (block) escapes.push({ from: block.from, to: n, line: block.from, reason: block.reason });
      block = null;
      return;
    }
    const m = /slop-ok\b(?!-)\s*(?::\s*(.*))?/.exec(line);
    if (!m) return;
    const reason = cleanReason(m[1]);
    if (hasReason(reason)) escapes.push({ from: n, to: commentOnly(i) ? n + 1 : n, line: n, reason });
    else find(n, "escape-no-reason", "`slop-ok` without a reason");
  });
  if (block) find(block.from, "escape-no-end", "`slop-ok-block` without `slop-ok-end`");

  const escapeAt = (line) => escapes.find((e) => line >= e.from && line <= e.to);
  const cannotEscape = new Set(["escape-no-reason", "escape-no-end"]);
  const final = [];
  for (const a of findings) {
    const e = cannotEscape.has(a.rule) ? null : escapeAt(a.line);
    if (e) (e.suppresses ??= []).push(`${a.line} ${a.rule}`);
    else final.push(a);
  }
  const finalShadows = [];
  for (const s of shadows) {
    const e = escapeAt(s.line);
    if (e) (e.suppresses ??= []).push(`${s.line} large-shadow`);
    else finalShadows.push({ ...s, file: filePath, snippet: (rawLines[s.line - 1] ?? "").trim().slice(0, 140) });
  }

  return {
    findings: final,
    shadows: finalShadows,
    allowed,
    escapes: escapes.map((e) => ({ file: filePath, line: e.line, to: e.to, reason: e.reason, suppresses: e.suppresses ?? [] }))
  };
}

// -----------------------------------------------------------------------------
// Files to analyse
// -----------------------------------------------------------------------------

class UsageError extends Error {}

function isTranslation(rel) {
  const ext = path.extname(rel).toLowerCase();
  if (EXT_TRANSLATION_ALWAYS.includes(ext)) return true;
  return EXT_TRANSLATION_IN_FOLDER.includes(ext) && (IS_TRANSLATION_FOLDER.test(rel) || IS_TRANSLATION_NAME.test(path.basename(rel)));
}

// `rel` is relative to the analysis root (the given folder or repository root
// for --diff), never absolute: a repository inside a `test/` folder is not a test.
function classify(rel) {
  if (IS_TEST.test(rel) || IS_EXCLUDED.test(rel)) return "excluded";
  if (EXTENSIONS.includes(path.extname(rel).toLowerCase())) return "interface";
  if (isTranslation(rel)) return "translation";
  return "other";
}

// A changed file in an unread extension, but with HTML markup (template in
// .py, .php, .rb…): not analysed, and not silenced.
function hasMarkup(f) {
  if (EXT_WITHOUT_UI.has(path.extname(f).toLowerCase())) return false;
  try {
    if (statSync(f).size > 2_000_000) return false;
    const t = readFileSync(f, "utf8");
    return !t.includes("\u0000") && IS_MARKUP.test(t);
  } catch {
    return false;
  }
}

function walk(filePath, sel, root) {
  let st;
  try {
    st = statSync(filePath);
  } catch {
    throw new UsageError(`does not exist or cannot be read: ${filePath}`);
  }
  if (st.isDirectory()) {
    for (const name of readdirSync(filePath).sort()) {
      if (IGNORED_FOLDERS.has(name)) continue;
      walk(path.join(filePath, name), sel, root);
    }
    return;
  }
  const explicit = filePath === root;
  const c = classify(explicit ? path.basename(filePath) : path.relative(root, filePath));
  if (c === "interface" || c === "translation") sel.files.push({ f: filePath, translation: c === "translation", changed: null });
  else if (explicit) sel.notAnalysed.push({ f: filePath, reason: c === "excluded" ? "test, type declaration or minified file" : "extension the detector does not read" });
}

function git(args, cwd) {
  try {
    return execFileSync("git", ["-c", "core.quotePath=false", ...args], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 256 * 1024 * 1024 });
  } catch (e) {
    throw new UsageError(`git ${args.join(" ")} failed: ${(e.stderr || e.message || "").toString().trim()}`);
  }
}

// New-side lines of each changed file, read from `git diff -U0` hunks.
function changedLines(ref, root) {
  const out = git(["diff", "-U0", "--no-color", "--no-ext-diff", "--src-prefix=a/", "--dst-prefix=b/", "--diff-filter=ACMRT", ref, "--"], root);
  const map = new Map();
  let current = null;
  for (const l of out.split("\n")) {
    if (l.startsWith("+++ ")) {
      const p = l.slice(4).replace(/\t$/, "");
      current = p === "/dev/null" ? null : p.replace(/^b\//, "");
      if (current && !map.has(current)) map.set(current, new Set());
      continue;
    }
    const h = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(l);
    if (h && current) {
      const from = Number(h[1]);
      const n = h[2] === undefined ? 1 : Number(h[2]);
      for (let k = from; k < from + n; k++) map.get(current).add(k);
    }
  }
  return map;
}

function changedSince(ref, filters) {
  const root = git(["rev-parse", "--show-toplevel"], process.cwd()).trim();
  git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], root);
  const lines = changedLines(ref, root);
  const untracked = new Set(git(["ls-files", "--others", "--exclude-standard"], root).split("\n").filter(Boolean));
  const names = [...new Set([...git(["diff", "--name-only", "--diff-filter=ACMRT", ref, "--"], root).split("\n").filter(Boolean), ...untracked])].sort();
  const bases = filters.map((f) => path.resolve(f));
  const sel = { files: [], notAnalysed: [] };
  for (const n of names) {
    const abs = path.join(root, n);
    if (bases.length && !bases.some((b) => abs === b || abs.startsWith(b + path.sep))) continue;
    const c = classify(n);
    // A file not yet tracked by git is entirely new.
    const changed = untracked.has(n) ? "all" : (lines.get(n) ?? new Set());
    if (c === "interface" || c === "translation") sel.files.push({ f: abs, translation: c === "translation", changed });
    else if (c === "other" && hasMarkup(abs)) sel.notAnalysed.push({ f: abs, reason: "HTML markup in an extension the detector does not read" });
  }
  return sel;
}

// Root used to find `.agentic/ui.json`: the current folder's git repository
// root, or the current folder itself outside a repository.
function projectRoot() {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: process.cwd(), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || process.cwd();
  } catch {
    return process.cwd();
  }
}

function readArguments(argv) {
  const op = { json: false, diff: null, paths: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") op.json = true;
    else if (a === "--diff") {
      op.diff = argv[++i];
      if (!op.diff || op.diff.startsWith("--")) throw new UsageError("--diff needs a ref (e.g. --diff \"$(git merge-base origin/main HEAD)\")");
    } else if (a === "-h" || a === "--help") op.help = true;
    else if (a.startsWith("-")) throw new UsageError(`unknown option: ${a}`);
    else op.paths.push(a);
  }
  if (!op.help && !op.diff && !op.paths.length) throw new UsageError("provide at least one path, or --diff <ref>");
  return op;
}

const HELP = `usage: node detect-slop.mjs [--json] (<file|folder>... | --diff <ref> [paths...])
Analyses ${EXTENSIONS.join(" ")} (excluding tests) and, using text rules only, translation
files (${EXT_TRANSLATION_ALWAYS.join(" ")}; ${EXT_TRANSLATION_IN_FOLDER.join(" ")} in translation folders).
With --diff, only changed lines count (and new files in full); the rest is "pre-existing".
Exits 0 without blockers, 1 with blockers, 2 if unable to analyse or nothing was analysed.
Escape: "slop-ok: <reason>" in a comment on the finding's line (or alone on the previous one);
for a block, "slop-ok-block: <reason>" … "slop-ok-end".
Emoji as data (emoji-only value in a list/object, content key) and brand gradients declared
in .agentic/ui.json ({"brand_gradients": ["--brand-gradient"]}) do not block and are listed.`;

const findingLine = (a) => `${a.file}:${a.line}  ${a.severity}  ${a.rule}  ${a.message}\n    → ${a.suggestion}`;

export function run(argv) {
  const op = readArguments(argv);
  if (op.help) return { code: 0, text: HELP };
  const sel = { files: [], notAnalysed: [] };
  if (op.diff) Object.assign(sel, changedSince(op.diff, op.paths));
  else for (const c of op.paths) walk(c, sel, c);
  const decl = readDeclaration(projectRoot());
  const allowed = [];
  const findings = [];
  const preExisting = [];
  const shadows = [];
  const escapes = [];
  let preExistingEscapes = 0;
  for (const { f, translation, changed } of sel.files) {
    let text;
    try {
      text = readFileSync(f, "utf8");
    } catch (e) {
      throw new UsageError(`could not read ${f}: ${e.message}`);
    }
    const r = analyse(path.relative(process.cwd(), f) || f, text, translation, decl);
    const isNew = (line) => changed === null || changed === "all" || changed.has(line);
    for (const a of r.findings) (isNew(a.line) ? findings : preExisting).push(a);
    for (const p of r.allowed) if (isNew(p.line)) allowed.push(p);
    for (const s of r.shadows) shadows.push({ ...s, isNew: isNew(s.line) });
    for (const e of r.escapes) {
      if (isNew(e.line)) escapes.push(e);
      else preExistingEscapes++;
    }
  }
  // One large shadow is a floating layer; three or more mean "shadows everywhere".
  if (shadows.length >= 3) {
    for (const s of shadows) {
      (s.isNew ? findings : preExisting).push({ file: s.file, line: s.line, rule: "large-shadow", severity: "notice", message: `${s.message} (${shadows.length} in the set)`, suggestion: RULES["large-shadow"].suggestion, snippet: s.snippet });
    }
  }
  const order = (a, b) => a.file.localeCompare(b.file) || a.line - b.line || (a.rule ?? "").localeCompare(b.rule ?? "");
  findings.sort(order);
  preExisting.sort(order);
  escapes.sort(order);
  allowed.sort(order);
  const byRule = {};
  for (const a of findings) byRule[a.rule] = (byRule[a.rule] ?? 0) + 1;
  const blockers = findings.filter((a) => a.severity === "blocker").length;
  const notAnalysed = sel.notAnalysed.map(({ f, reason }) => ({ file: path.relative(process.cwd(), f) || f, reason }));
  const nothing = sel.files.length === 0;
  const summary = { files: sel.files.length, blockers, notices: findings.length - blockers, byRule, preExisting: preExisting.length, escapes: escapes.length, preExistingEscapes, allowed: allowed.length, notAnalysed: notAnalysed.length };
  // Fail closed: what was not read never comes out clean.
  const code = blockers > 0 ? 1 : nothing || notAnalysed.length ? 2 : 0;
  if (op.json) return { code, text: JSON.stringify({ summary, findings, preExisting, escapes, allowed, notAnalysed }, null, 2) };
  const lines = findings.map(findingLine);
  if (preExisting.length) {
    lines.push(`Pre-existing (lines untouched by the diff; do not affect the exit code, stay in one report line, do not go to the backlog):`);
    for (const a of preExisting) lines.push(`  ${a.file}:${a.line}  ${a.severity}  ${a.rule}  ${a.message}`);
  }
  if (escapes.length) {
    lines.push(`Escapes used (each reason must be a project decision):`);
    for (const e of escapes) lines.push(`  ${e.file}:${e.line}${e.to > e.line ? `-${e.to}` : ""}  «${e.reason}»  suppresses: ${e.suppresses.length ? e.suppresses.join(", ") : "nothing (unused escape)"}`);
  }
  if (allowed.length) {
    lines.push(`Allowed without an escape (emoji as data, declared brand gradient; the reviewer confirms each):`);
    for (const p of allowed) lines.push(`  ${p.file}:${p.line}  ${p.rule}  ${p.reason}`);
  }
  if (notAnalysed.length) {
    lines.push(`Not analysed (check manually against ui-without-slop.md §2; do not count as clean):`);
    for (const n of notAnalysed) lines.push(`  ${n.file}  ${n.reason}`);
  }
  lines.push(`${sel.files.length} file(s) analysed: ${blockers} blocker(s), ${summary.notices} notice(s).`);
  const extra = [preExisting.length && `${preExisting.length} pre-existing`, (escapes.length || preExistingEscapes) && `${escapes.length} escape(s) used${preExistingEscapes ? ` (+${preExistingEscapes} on untouched lines)` : ""}`, allowed.length && `${allowed.length} allowed without an escape`, notAnalysed.length && `${notAnalysed.length} not analysed`].filter(Boolean);
  if (extra.length) lines.push(extra.join(" · ") + ".");
  if (nothing) lines.push("Nothing analysed: this is not proof of clean (exit 2).");
  return { code, text: lines.join("\n") };
}

// Node resolves the main module's symlink (the --link installation): compare real paths.
const realPath = (p) => {
  try {
    return realpathSync(p);
  } catch {
    return path.resolve(p);
  }
};

if (process.argv[1] && realPath(process.argv[1]) === realPath(fileURLToPath(import.meta.url))) {
  try {
    const { code, text } = run(process.argv.slice(2));
    process.stdout.write(text + "\n");
    process.exitCode = code;
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`detect-slop: ${e.message}\n${HELP}\n`);
      process.exitCode = 2;
    } else {
      process.stderr.write(`detect-slop: unexpected error: ${e.stack || e}\n`);
      process.exitCode = 2;
    }
  }
}
