// Os manifestos do plugin e do marketplace do Claude Code, a licença e o package.json
// (node --test, a partir da raiz do repo). O formato completo confere-se com: claude plugin validate .
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = (p) => JSON.parse(readFileSync(path.join(RAIZ, p), "utf8"));

test("o plugin e o marketplace têm o mesmo nome (os ids de instalação dependem disso) e o plugin é a raiz", () => {
  const plugin = json(".claude-plugin/plugin.json");
  const mercado = json(".claude-plugin/marketplace.json");
  assert.equal(plugin.name, "agentic-skills");
  assert.equal(mercado.name, plugin.name);
  assert.equal(mercado.plugins.length, 1);
  assert.equal(mercado.plugins[0].name, plugin.name);
  assert.equal(mercado.plugins[0].source, "./");
  assert.ok(mercado.owner?.name, "o marketplace precisa de um dono");
  assert.match(plugin.version, /^\d+\.\d+\.\d+$/);
  assert.equal(plugin.license, "MIT");
  assert.ok(plugin.author?.name);
});

test("a raiz do plugin tem skills/ com as dez skills e nada dentro de .claude-plugin/ além dos manifestos", () => {
  const pastas = readdirSync(path.join(RAIZ, "skills"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  assert.equal(pastas.length, 10);
  for (const p of pastas) assert.ok(existsSync(path.join(RAIZ, "skills", p, "SKILL.md")), p);
  assert.deepEqual(readdirSync(path.join(RAIZ, ".claude-plugin")).sort(), ["marketplace.json", "plugin.json"]);
});

test("LICENSE é MIT, com o titular dos manifestos", () => {
  const licenca = readFileSync(path.join(RAIZ, "LICENSE"), "utf8");
  assert.match(licenca, /^MIT License\n\nCopyright \(c\) 2026 /);
  const titular = /^Copyright \(c\) 2026 (.+)$/m.exec(licenca)[1];
  assert.equal(json(".claude-plugin/plugin.json").author.name, titular);
  assert.equal(json(".claude-plugin/marketplace.json").owner.name, titular);
  assert.equal(json("package.json").license, "MIT");
});

test("package.json: privado (não se publica no npm por engano) e o teste é node --test", () => {
  const pacote = json("package.json");
  assert.equal(pacote.private, true);
  assert.equal(pacote.scripts.test, "node --test");
  assert.match(pacote.engines.node, />=\s?20/);
});

test("o README tem as secções que os utilizadores procuram", () => {
  const readme = readFileSync(path.join(RAIZ, "README.md"), "utf8");
  for (const titulo of ["## What is inside", "## How they fit together", "## Install", "## Agents and models per task (optional)", "## A memory system for Claude Code (optional)", "## Limits", "## Optional skills from other authors (not included)", "## Licence and credits"])
    assert.ok(readme.includes("\n" + titulo + "\n"), titulo);
  for (const f of ["CREDITS.md", "LICENSE", "install.sh", "install.ps1"]) assert.ok(existsSync(path.join(RAIZ, f)), f);
});
