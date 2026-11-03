#!/usr/bin/env node
// Package a static composition with one isolated JavaScript interaction.
import {readFileSync, writeFileSync, mkdtempSync, renameSync, rmSync, realpathSync} from "node:fs";
import {basename, dirname, resolve, join} from "node:path";
import {fileURLToPath} from "node:url";
import {packagePage, MAX_BYTES as MAX_PAGE_BYTES} from "./package-page.mjs";

export const MAX_INTERACTION_BYTES = 512_000;
export const MAX_MESSAGE_BYTES = 4096;
const CHILD_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'none'; media-src 'none'; font-src 'none'; connect-src 'none'; frame-src 'none'; child-src 'none'; object-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'; navigate-to 'none'; webrtc 'block'";
const reject = rule => { throw new Error(`EXPLAIN_${rule}`); };
const escapeAttribute = text => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function record(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function exactKeys(value, keys) {
  const present = Object.keys(value).sort();
  return present.length === keys.length && present.every((key, index) => key === keys.slice().sort()[index]);
}

export function validateMessage(data) {
  if (!record(data) || Buffer.byteLength(JSON.stringify(data), "utf8") > MAX_MESSAGE_BYTES || data.version !== 1 || typeof data.kind !== "string") return false;
  if (data.kind === "ready") return exactKeys(data, ["kind", "version"]);
  if (data.kind === "state") {
    return exactKeys(data, ["kind", "state", "version"]) && record(data.state) && exactKeys(data.state, ["outcome", "variable"]) && Number.isFinite(data.state.variable) && ["pending", "accepted", "rejected"].includes(data.state.outcome);
  }
  if (data.kind === "result") {
    const result = data.result;
    return exactKeys(data, ["kind", "result", "version"]) && record(result) && exactKeys(result, ["feedback", "observed", "prediction", "variable"]) && typeof result.feedback === "string" && result.feedback.length <= 500 && typeof result.observed === "string" && ["accepted", "rejected"].includes(result.observed) && typeof result.prediction === "string" && result.prediction.length <= 120 && Number.isFinite(result.variable);
  }
  if (data.kind === "error") return exactKeys(data, ["kind", "message", "version"]) && typeof data.message === "string" && data.message.length <= 300;
  return false;
}

function validateInteraction(interaction) {
  if (typeof interaction !== "string") reject("INPUT");
  if (Buffer.byteLength(interaction, "utf8") > MAX_INTERACTION_BYTES) reject("SIZE");
  if (!/<script\b[^>]*>[\s\S]*<\/script>/i.test(interaction)) reject("SCRIPT");
  if (/<script\b[^>]*\bsrc\s*=|<\/(?:iframe|object|embed|form|base|link)\b|<\s*(?:iframe|object|embed|form|base|link)\b/i.test(interaction)) reject("RESOURCE");
  if (/\bon[a-z]+\s*=|\b(?:src|href)\s*=\s*["'](?:https?:|\/\/|data:|javascript:)/i.test(interaction)) reject("RESOURCE");
  if (/allow-(?:same-origin|forms|popups|top-navigation|downloads|modals)|sandbox\s*=/i.test(interaction)) reject("SANDBOX");
  if (/parent\s*\.\s*(?:document|window|localStorage|sessionStorage|indexedDB|frames|opener)|\b(?:localStorage|sessionStorage|indexedDB)\b|\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b|\b(?:window\s*\.\s*open|top\s*\.|window\s*\.\s*top)/i.test(interaction)) reject("CAPABILITY");
  if (!/parent\s*\.\s*postMessage\s*\(/.test(interaction)) reject("PROTOCOL");
  return interaction;
}

function prepareChild(interaction, theme) {
  const childTheme = theme === "dark" ? '<style>:root { color-scheme: dark !important; } body { color: #ededed !important; background: #171717 !important; }</style>' : theme === "light" ? '<style>:root { color-scheme: light !important; } body { color: #202020 !important; background: #ffffff !important; }</style>' : "";
  // Prefix the policy before caller HTML so it also covers a script/resource placed
  // before a caller-supplied <head>; the caller never controls this boundary.
  return `<!doctype html><meta http-equiv="Content-Security-Policy" content="${CHILD_CSP}">${childTheme}${interaction}`;
}

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

function collidesWithInput(output, inputs) {
  const destination = realPath(output);
  return inputs.filter(Boolean).some(input => realPath(input) === destination);
}

const runtime = `(() => {
  const frame = document.getElementById("explain-interaction");
  const fallback = document.getElementById("interaction-fallback");
  const status = document.getElementById("interaction-status");
  let last = 0;
  let frameLoads = 0;
  let terminal = false;
  function setStatus(text) { if (status) status.textContent = text; }
  function fail(text) { if (terminal) return; terminal = true; frame.remove(); fallback?.classList.remove("is-hidden"); setStatus(text); }
  frame.addEventListener("load", () => { frameLoads += 1; if (frameLoads > 1) fail("The interaction left the isolated document; use the written fallback."); });
  window.addEventListener("message", event => {
    if (terminal) return;
    if (event.source !== frame.contentWindow || event.origin !== "null") return;
    const data = event.data;
    if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).length === 0) return;
    if (Date.now() - last < 30) return;
    last = Date.now();
    const keys = Object.keys(data).sort();
    if (data.version !== 1 || typeof data.kind !== "string") return;
    const exact = (wanted) => keys.length === wanted.length && wanted.slice().sort().every((key, i) => key === keys[i]);
    if (data.kind === "ready" && exact(["kind", "version"])) {
      fallback?.classList.add("is-hidden");
      setStatus("Interaction ready.");
    } else if (data.kind === "state" && exact(["kind", "state", "version"]) && data.state && exactState(data.state)) {
      setStatus("Variable updated; make your prediction before observing.");
    } else if (data.kind === "result" && exact(["kind", "result", "version"]) && data.result && exactResult(data.result)) {
      setStatus("Result received: " + data.result.observed + ". " + data.result.feedback);
    } else if (data.kind === "error" && exact(["kind", "message", "version"]) && typeof data.message === "string" && data.message.length <= 300) {
      fail("Interaction failed: " + data.message);
    }
  });
  function exactState(value) { const keys = Object.keys(value).sort(); return keys.length === 2 && keys[0] === "outcome" && keys[1] === "variable" && Number.isFinite(value.variable) && ["pending", "accepted", "rejected"].includes(value.outcome); }
  function exactResult(value) { const keys = Object.keys(value).sort(); return keys.length === 4 && keys[0] === "feedback" && keys[1] === "observed" && keys[2] === "prediction" && keys[3] === "variable" && typeof value.feedback === "string" && value.feedback.length <= 500 && ["accepted", "rejected"].includes(value.observed) && typeof value.prediction === "string" && value.prediction.length <= 120 && Number.isFinite(value.variable); }
  frame.addEventListener("error", () => fail("Interaction did not open; use the written fallback."));
})();`;

export function packageInteraction({composition, css = "", interaction, title = "Interactive lesson", language = "en", theme = "auto"}) {
  if (![composition, css, interaction, title, language, theme].every(value => typeof value === "string")) reject("INPUT");
  const childBase = validateInteraction(interaction);
  // slop-ok: the opaque srcdoc cannot consume the parent's design tokens.
  const child = prepareChild(childBase, theme);
  const marker = '<div id="interaction-slot"></div>';
  if (composition.split(marker).length !== 2) reject("SLOT");
  const base = packagePage({composition, css, title, language, theme});
  const frame = `<iframe id="explain-interaction" class="interaction-frame" title="Prediction and observation interaction" sandbox="allow-scripts" allow="camera 'none'; microphone 'none'; geolocation 'none'; usb 'none'; payment 'none'; fullscreen 'none'; autoplay 'none'" referrerpolicy="no-referrer" loading="lazy" srcdoc="${escapeAttribute(child)}"></iframe>`;
  const injected = base.replace(marker, `${marker.slice(0, -6)}${frame}</div>`).replace('<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'none\'; style-src \'unsafe-inline\'; img-src data:; font-src \'none\'; connect-src \'none\'; frame-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'">', '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src \'none\'; font-src \'none\'; connect-src \'none\'; frame-src \'none\'; child-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'; navigate-to \'none\'; webrtc \'block\'"><meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), usb=(), payment=(), fullscreen=(), autoplay=()">');
  const withStatus = injected.replace('<div id="interaction-slot">', '<p id="interaction-status" role="status">Preparing the interaction…</p><div id="interaction-slot">');
  const html = withStatus.replace('</body>', `<script>${runtime}</script>\n</body>`);
  if (Buffer.byteLength(html, "utf8") > MAX_PAGE_BYTES) reject("SIZE");
  return html;
}

function cli(args) {
  const usage = "Usage: package-interaction.mjs composition.html --interaction interaction.srcdoc [--css layout.css] [--title text] [--language en] [--theme auto|light|dark] --output page.html";
  const input = args.shift(), options = {}, map = {"--css": "css", "--interaction": "interaction", "--title": "title", "--language": "language", "--theme": "theme", "--output": "output"};
  if (!input || input.startsWith("--")) { process.stderr.write(usage + "\n"); return 2; }
  while (args.length) {
    const key = map[args.shift()], value = args.shift();
    if (!key || !value || value.startsWith("--") || Object.hasOwn(options, key)) { process.stderr.write(usage + "\n"); return 2; }
    options[key] = value;
  }
  if (!options.output || !options.interaction || collidesWithInput(options.output, [input, options.interaction, options.css])) { process.stderr.write(usage + "\n"); return 2; }
  try {
    const html = packageInteraction({title: options.title, language: options.language, theme: options.theme, composition: readFileSync(input, "utf8"), interaction: readFileSync(options.interaction, "utf8"), css: options.css ? readFileSync(options.css, "utf8") : ""});
    const temporary = mkdtempSync(join(dirname(resolve(options.output)), ".explain-interaction-"));
    try { const file = join(temporary, "page.html"); writeFileSync(file, html); renameSync(file, resolve(options.output)); } finally { rmSync(temporary, {recursive: true, force: true}); }
    process.stdout.write(`Interactive page: ${Buffer.byteLength(html)} bytes.\n`); return 0;
  } catch (error) { const refusal = /^EXPLAIN_/.test(error.message); process.stderr.write((refusal ? error.message : "Read error.") + "\n"); return refusal ? 1 : 2; }
}
if (process.argv[1] && realPath(process.argv[1]) === realPath(fileURLToPath(import.meta.url))) process.exitCode = cli(process.argv.slice(2));
