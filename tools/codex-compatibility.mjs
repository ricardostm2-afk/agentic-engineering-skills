#!/usr/bin/env node
// Hermetic Codex compatibility proof. It checks local discovery/install layouts only; it never
// launches Codex, changes a real home directory or copies credentials. Run it from the exported
// package (or from this repository after the exporter tests); all temporary trees are retained.
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const AGENTIC_NAMES = [
  "agentic-analysis-optimization", "agentic-architecture", "agentic-ci-audit", "agentic-code-review",
  "agentic-design", "agentic-explain", "agentic-feature", "agentic-fix", "agentic-implement",
  "agentic-project", "agentic-tool-design",
];

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shortHash = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const skillFile = (root, name) => path.join(root, "skills", name, "SKILL.md");
const fail = (message) => { throw new Error(message); };

const HOSTS = Object.freeze({
  codex: {
    projectSkills: ".agents/skills",
    globalSkills: (home) => [path.join(home, ".agents", "skills"), "/etc/codex/skills"],
  },
  claude: {
    projectSkills: ".claude/skills",
    globalSkills: (home, env) => [
      path.join(env.CLAUDE_CONFIG_DIR || path.join(home, ".claude"), "skills"),
      path.join(home, ".claude", "skills"),
    ],
  },
});

function hostSpec(host) {
  if (typeof host !== "string" || !HOSTS[host]) fail(`unsupported host ${String(host)} (expected codex or claude)`);
  return HOSTS[host];
}

function frontmatterName(file) {
  const text = readFileSync(file, "utf8");
  const block = /^---\s*\n([\s\S]*?)\n---(?:\s|$)/.exec(text)?.[1] ?? "";
  const value = /^name:\s*(.+?)\s*$/m.exec(block)?.[1]?.trim();
  return value?.replace(/^("|')(.*)\1$/, "$2");
}

function inspectSkill(candidate, expectedName) {
  let resolved;
  try {
    resolved = realpathSync(candidate);
    if (!statSync(resolved).isDirectory()) return { valid: false, reason: "not a directory" };
    const file = path.join(resolved, "SKILL.md");
    if (!statSync(file).isFile()) return { valid: false, reason: "missing SKILL.md" };
    if (frontmatterName(file) !== expectedName) return { valid: false, reason: `SKILL.md name is not ${expectedName}` };
    return { valid: true, path: resolved };
  } catch (error) {
    return { valid: false, reason: error.code === "ENOENT" ? "does not exist" : error.message };
  }
}

function candidatePath(root, name) {
  return path.join(root, name);
}

function projectSkillCandidates(projectRoot, name, host) {
  if (!projectRoot) return [];
  const spec = hostSpec(host);
  const roots = [];
  let base = path.resolve(projectRoot);
  while (true) {
    roots.push(path.join(base, spec.projectSkills));
    const parent = path.dirname(base);
    if (parent === base) break;
    base = parent;
  }
  return roots.map((root) => candidatePath(root, name));
}

function pluginSkillsRoot(pluginRoot, host) {
  if (!pluginRoot) return null;
  const root = realpathSync(pluginRoot);
  if (host === "claude") return path.join(root, "skills");
  const manifestFile = [path.join(root, "plugin.json"), path.join(root, ".codex-plugin", "plugin.json")]
    .find((file) => existsSync(file));
  if (!manifestFile) fail(`Codex plugin has no plugin.json: ${pluginRoot}`);
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  if (typeof manifest.skills !== "string") fail(`Codex plugin manifest has no skills path: ${manifestFile}`);
  const skills = path.resolve(root, manifest.skills);
  const relative = path.relative(root, skills);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) fail(`Codex plugin skills path escapes its root: ${manifest.skills}`);
  return skills;
}

function requireCatalog(root) {
  const missing = AGENTIC_NAMES.filter((name) => !existsSync(skillFile(root, name)));
  if (missing.length) fail(`catalog is missing ${missing.join(", ")}: ${root}`);
  const names = readdirSync(path.join(root, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && AGENTIC_NAMES.includes(entry.name))
    .map((entry) => entry.name).sort();
  if (names.length !== AGENTIC_NAMES.length || names.join("\n") !== [...AGENTIC_NAMES].sort().join("\n")) {
    fail(`expected exactly the eleven local agentic names; got ${names.join(", ")}`);
  }
  return names;
}

function runInstaller(root, home, symlink) {
  const script = readFileSync(path.join(root, "install.sh"), "utf8");
  const flag = (localCodes, english) => {
    const local = "--" + String.fromCharCode(...localCodes);
    if (script.includes(`${local})`)) return local;
    if (script.includes(`${english})`)) return english;
    fail(`install.sh has neither local or English ${english} form`);
  };
  const applyFlag = flag([97, 112, 108, 105, 99, 97, 114], "--apply");
  const agentFlag = flag([97, 103, 101, 110, 116, 101], "--agent");
  const linkFlag = flag([108, 105, 103, 97, 114], "--link");
  const result = spawnSync("bash", [path.join(root, "install.sh"), applyFlag, agentFlag, "codex", ...(symlink ? [linkFlag] : [])], {
    cwd: root, encoding: "utf8", env: { ...process.env, HOME: home },
  });
  if (result.status !== 0) fail(`install.sh failed (${result.status}): ${result.stderr || result.stdout}`);
  return path.join(home, ".agents", "skills");
}

function verifyInstalled(sourceRoot, installedRoot, symlink) {
  const names = readdirSync(installedRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
    .map((entry) => entry.name).filter((name) => AGENTIC_NAMES.includes(name)).sort();
  if (names.join("\n") !== [...AGENTIC_NAMES].sort().join("\n")) fail(`installed catalog is not exactly eleven local names: ${names.join(", ")}`);
  for (const name of AGENTIC_NAMES) {
    const installed = path.join(installedRoot, name);
    const source = path.join(sourceRoot, "skills", name);
    if (symlink) {
      if (!lstatSync(installed).isSymbolicLink()) fail(`${name} is not a symlink`);
      if (realpathSync(installed) !== realpathSync(source)) fail(`${name} symlink target differs`);
    } else {
      if (lstatSync(installed).isSymbolicLink() || shortHash(path.join(installed, "SKILL.md")) !== shortHash(path.join(source, "SKILL.md"))) {
        fail(`${name} copy differs from the source`);
      }
    }
  }
  return names;
}

function verifyPortablePlugin(root, tempRoot) {
  const manifestPath = path.join(root, "plugin.json");
  const manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf8"))
    : { name: "agentic-skills", skills: "./skills/", version: "source-not-exported" };
  if (manifest.skills !== "./skills/") fail(`portable plugin manifest must point to ./skills/: ${manifest.skills}`);
  const pluginRoot = mkdtempSync(path.join(tempRoot, "plugin-"));
  mkdirSync(path.join(pluginRoot, "skills"));
  for (const name of AGENTIC_NAMES) cpSync(path.join(root, "skills", name), path.join(pluginRoot, "skills", name), { recursive: true });
  writeFileSync(path.join(pluginRoot, "plugin.json"), JSON.stringify(manifest, null, 2) + "\n");
  const parsed = JSON.parse(readFileSync(path.join(pluginRoot, "plugin.json"), "utf8"));
  if (parsed.skills !== "./skills/" || !existsSync(path.join(pluginRoot, "skills", "agentic-project", "SKILL.md"))) fail("portable plugin copy is incomplete");
  return { root: pluginRoot, generatedManifest: existsSync(manifestPath), version: parsed.version };
}

export function resolveSibling({ skillDir, name, host = "codex", env = process.env, projectRoot, pluginRoot, home }) {
  const spec = hostSpec(host);
  const variable = `${name.replaceAll("-", "_").toUpperCase()}_DIR`;
  const invalid = [];
  const inspect = (where, candidate) => {
    const result = inspectSkill(candidate, name);
    if (!result.valid && result.reason !== "does not exist") invalid.push(`${where}: ${candidate} (${result.reason})`);
    return result;
  };

  if (env[variable]) {
    const explicit = inspect("explicit", env[variable]);
    if (!explicit.valid) fail(`explicit sibling ${name} is invalid: ${invalid.at(-1) ?? env[variable]}`);
    return explicit.path;
  }

  const adjacent = inspect("adjacent", path.join(skillDir, "..", name));
  if (adjacent.valid) return adjacent.path;

  const project = projectSkillCandidates(projectRoot, name, host)
    .map((candidate) => ({ candidate, result: inspect("project", candidate) }))
    .filter(({ result }) => result.valid);
  if (project.length > 1) {
    fail(`ambiguous ${host} project sibling ${name}; choose an explicit ${variable}: ${project.map(({ result }) => result.path).join(", ")}`);
  }
  if (project.length === 1) return project[0].result.path;

  if (home) {
    const globals = spec.globalSkills(home, env)
      .map((root) => ({ root, result: inspect(`global ${root}`, candidatePath(root, name)) }))
      .find(({ result }) => result.valid);
    if (globals) return globals.result.path;
  }

  if (pluginRoot) {
    const skillsRoot = pluginSkillsRoot(pluginRoot, host);
    const plugin = inspect("plugin", candidatePath(skillsRoot, name));
    if (plugin.valid) return plugin.path;
  }
  const detail = invalid.length ? `; invalid candidates: ${invalid.join("; ")}` : "";
  fail(`missing sibling ${name} for ${host} (searched explicit, adjacent, ${spec.projectSkills}, host globals, then plugin${detail})`);
}

function verifySiblingResolution(root, tempRoot, plugin) {
  const projectRoot = mkdtempSync(path.join(tempRoot, "project-"));
  const projectSkill = path.join(projectRoot, ".agents", "skills", "agentic-tool-design");
  mkdirSync(path.dirname(projectSkill), { recursive: true });
  cpSync(path.join(root, "skills", "agentic-tool-design"), projectSkill, { recursive: true });
  const claudeProjectSkill = path.join(projectRoot, ".claude", "skills", "agentic-tool-design");
  mkdirSync(path.dirname(claudeProjectSkill), { recursive: true });
  cpSync(path.join(root, "skills", "agentic-tool-design"), claudeProjectSkill, { recursive: true });
  const isolatedSkill = path.join(projectRoot, "current", "agentic-project");
  mkdirSync(path.dirname(isolatedSkill), { recursive: true });
  cpSync(path.join(root, "skills", "agentic-project"), isolatedSkill, { recursive: true });
  const projectResult = resolveSibling({ skillDir: isolatedSkill, name: "agentic-tool-design", host: "codex", projectRoot, home: path.join(tempRoot, "empty-home") });
  if (realpathSync(projectResult) !== realpathSync(projectSkill)) fail("project sibling resolution did not use the project root");
  const claudeResult = resolveSibling({ skillDir: isolatedSkill, name: "agentic-tool-design", host: "claude", projectRoot, home: path.join(tempRoot, "empty-home") });
  if (realpathSync(claudeResult) !== realpathSync(claudeProjectSkill)) fail("Claude sibling resolution did not use .claude");
  const wrongHost = mkdtempSync(path.join(tempRoot, "wrong-host-"));
  const wrongHostSkill = path.join(wrongHost, ".claude", "skills", "agentic-tool-design");
  mkdirSync(path.dirname(wrongHostSkill), { recursive: true });
  cpSync(path.join(root, "skills", "agentic-tool-design"), wrongHostSkill, { recursive: true });
  let hostRejected = false;
  try { resolveSibling({ skillDir: path.join(wrongHost, "current", "agentic-project"), name: "agentic-tool-design", host: "codex", projectRoot: wrongHost, home: path.join(tempRoot, "empty-home") }); } catch { hostRejected = true; }
  if (!hostRejected) fail("Codex resolver mixed the Claude project folder");
  const explicit = mkdtempSync(path.join(tempRoot, "explicit-"));
  cpSync(path.join(root, "skills", "agentic-feature"), explicit, { recursive: true });
  const explicitResult = resolveSibling({ skillDir: path.join(root, "skills", "agentic-project"), name: "agentic-feature", env: { ...process.env, AGENTIC_FEATURE_DIR: explicit }, projectRoot, home: path.join(tempRoot, "empty-home") });
  if (realpathSync(explicitResult) !== realpathSync(explicit)) fail("explicit sibling resolution did not win");
  const invalidExplicit = mkdtempSync(path.join(tempRoot, "invalid-explicit-"));
  writeFileSync(path.join(invalidExplicit, "SKILL.md"), "---\nname: agentic-fix\n---\n");
  let identityRejected = false;
  try { resolveSibling({ skillDir: isolatedSkill, name: "agentic-feature", env: { AGENTIC_FEATURE_DIR: invalidExplicit }, projectRoot, home: path.join(tempRoot, "empty-home") }); } catch { identityRejected = true; }
  if (!identityRejected) fail("explicit sibling resolver accepted a mismatched name");
  const globalHome = mkdtempSync(path.join(tempRoot, "global-home-"));
  const globalSkill = path.join(globalHome, ".agents", "skills", "agentic-tool-design");
  mkdirSync(path.dirname(globalSkill), { recursive: true });
  cpSync(path.join(root, "skills", "agentic-tool-design"), globalSkill, { recursive: true });
  const pluginResult = resolveSibling({ skillDir: path.join(tempRoot, "missing-skill"), name: "agentic-tool-design", host: "codex", projectRoot: path.join(tempRoot, "none"), pluginRoot: plugin.root, home: globalHome });
  if (realpathSync(pluginResult) !== realpathSync(globalSkill)) fail("global Codex sibling did not win before plugin");
  const pluginOnlyResult = resolveSibling({ skillDir: path.join(tempRoot, "missing-skill"), name: "agentic-tool-design", host: "codex", projectRoot: path.join(tempRoot, "none"), pluginRoot: plugin.root, home: path.join(tempRoot, "empty-home") });
  if (realpathSync(pluginOnlyResult) !== realpathSync(path.join(plugin.root, "skills", "agentic-tool-design"))) fail("plugin sibling resolution failed");
  const ambiguousBase = mkdtempSync(path.join(tempRoot, "ambiguous-base-"));
  const ambiguousProject = path.join(ambiguousBase, "nested");
  mkdirSync(path.join(ambiguousProject, ".agents", "skills"), { recursive: true });
  mkdirSync(path.join(ambiguousBase, ".agents", "skills"), { recursive: true });
  cpSync(path.join(root, "skills", "agentic-tool-design"), path.join(ambiguousProject, ".agents", "skills", "agentic-tool-design"), { recursive: true });
  cpSync(path.join(root, "skills", "agentic-tool-design"), path.join(ambiguousBase, ".agents", "skills", "agentic-tool-design"), { recursive: true });
  let ambiguityRejected = false;
  try { resolveSibling({ skillDir: path.join(ambiguousProject, "current", "agentic-project"), name: "agentic-tool-design", host: "codex", projectRoot: ambiguousProject, home: path.join(tempRoot, "empty-home") }); } catch { ambiguityRejected = true; }
  if (!ambiguityRejected) fail("ambiguous project siblings were silently selected");
  let missing = false;
  try { resolveSibling({ skillDir: path.join(tempRoot, "missing-skill"), name: "agentic-absent", projectRoot: path.join(tempRoot, "none"), home: path.join(tempRoot, "empty-home") }); } catch { missing = true; }
  if (!missing) fail("missing sibling did not produce a diagnostic");
}

export function runProof(root = ROOT) {
  const names = requireCatalog(root);
  const catalogSha = createHash("sha256").update(names.map((name) => `${name}:${shortHash(skillFile(root, name))}`).join("\n")).digest("hex");
  const versionResult = spawnSync(process.env.CODEX_BIN || "codex", ["--version"], { encoding: "utf8" });
  const clientVersion = versionResult.status === 0 ? (versionResult.stdout || "").trim() : "unavailable";
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "agentic-skills-codex-"));
  const copyHome = mkdtempSync(path.join(tempRoot, "copy-home-"));
  const copyInstalled = runInstaller(root, copyHome, false);
  verifyInstalled(root, copyInstalled, false);
  const linkHome = mkdtempSync(path.join(tempRoot, "link-home-"));
  const linkInstalled = runInstaller(root, linkHome, true);
  verifyInstalled(root, linkInstalled, true);
  const plugin = verifyPortablePlugin(root, tempRoot);
  verifySiblingResolution(root, tempRoot, plugin);
  return { root, names, catalogSha, clientVersion, tempRoot, copyHome, linkHome, pluginRoot: plugin.root, generatedManifest: plugin.generatedManifest, version: plugin.version, livePluginDiscovery: false };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(runProof(), null, 2)); }
  catch (error) { console.error(`codex-compatibility: ${error.message}`); process.exitCode = 1; }
}
