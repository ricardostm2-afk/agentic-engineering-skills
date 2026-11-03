// Claude Code and Codex plugin manifests, license and package.json. Run: node --test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = (p) => JSON.parse(readFileSync(path.join(ROOT, p), "utf8"));

test("plugin and marketplace names agree; plugin source is the root", () => {
  const plugin = json(".claude-plugin/plugin.json");
  const marketplace = json(".claude-plugin/marketplace.json");
  assert.equal(plugin.name, "agentic-skills");
  assert.equal(marketplace.name, plugin.name);
  assert.equal(marketplace.plugins.length, 1);
  assert.equal(marketplace.plugins[0].name, plugin.name);
  assert.equal(marketplace.plugins[0].source, "./");
  assert.ok(marketplace.owner?.name, "marketplace needs an owner");
  assert.equal(plugin.version, "2.1.0");
  assert.equal(plugin.license, "MIT");
  assert.ok(plugin.author?.name);
});
test("Codex portable manifest points at the root skills folder", () => {
  const codex = json("plugin.json");
  assert.equal(codex.name, "agentic-skills");
  assert.equal(codex.version, "2.1.0");
  assert.equal(codex.skills, "./skills/");
  assert.equal(codex.license, "MIT");
  assert.ok(existsSync(path.join(ROOT, codex.skills, "agentic-project", "SKILL.md")));
});
test("root holds eleven skills; .claude-plugin contains manifests only", () => {
  const folders = readdirSync(path.join(ROOT, "skills"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  assert.equal(folders.length, 11);
  for (const p of folders) assert.ok(existsSync(path.join(ROOT, "skills", p, "SKILL.md")), p);
  assert.deepEqual(readdirSync(path.join(ROOT, ".claude-plugin")).sort(), ["marketplace.json", "plugin.json"]);
});
test("MIT license holder matches the manifests", () => {
  const license = readFileSync(path.join(ROOT, "LICENSE"), "utf8");
  assert.match(license, /^MIT License\n\nCopyright \(c\) 2026 /);
  const holder = /^Copyright \(c\) 2026 (.+)$/m.exec(license)[1];
  assert.equal(json(".claude-plugin/plugin.json").author.name, holder);
  assert.equal(json(".claude-plugin/marketplace.json").owner.name, holder);
  assert.equal(json("package.json").license, "MIT");
});
test("package.json is private and tests with node --test", () => {
  const pkg = json("package.json");
  assert.equal(pkg.private, true);
  assert.equal(pkg.scripts.test, "node --test");
  assert.match(pkg.engines.node, />=\s?20/);
});
test("README contains the sections users look for", () => {
  const readme = readFileSync(path.join(ROOT, "README.md"), "utf8");
  for (const title of ["## What is inside", "## How they fit together", "## Install", "## Agents and models per task (optional)", "## A memory system for Claude Code (optional)", "## Limits", "## Optional skills from other authors (not included)", "## Licence and credits"]) assert.ok(readme.includes("\n" + title + "\n"), title);
  for (const file of ["CREDITS.md", "LICENSE", "install.sh", "install.ps1"]) assert.ok(existsSync(path.join(ROOT, file)), file);
});
