import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const INVENTORY = JSON.parse(readFileSync(path.join(ROOT, "UPSTREAMS.json"), "utf8"));
const GIT_SHA = /^[a-f0-9]{40}$/;
const SHA256 = /^[a-f0-9]{64}$/;

function relativePath(value) {
  assert.equal(typeof value, "string");
  assert.ok(value.length > 0 && !/[\\:]/.test(value), "invalid path: " + value);
  assert.ok(!path.posix.isAbsolute(value) && !path.win32.isAbsolute(value), "absolute path: " + value);
  assert.equal(path.posix.normalize(value), value, "noncanonical path: " + value);
  assert.ok(value.split("/").every((part) => part && part !== "." && part !== ".."), "path outside root: " + value);
  return value;
}

function localFile(value) {
  const relative = relativePath(value);
  const absolute = realpathSync(path.resolve(ROOT, relative));
  const fromRoot = path.relative(ROOT, absolute);
  assert.ok(fromRoot && fromRoot !== ".." && !fromRoot.startsWith(".." + path.sep) && !path.isAbsolute(fromRoot), "path leaves repository: " + value);
  assert.ok(statSync(absolute).isFile(), "not a file: " + value);
  return absolute;
}

function filesIn(folder) {
  return readdirSync(path.join(ROOT, folder), { withFileTypes: true }).flatMap((entry) => {
    const relative = folder + "/" + entry.name;
    if (entry.isDirectory()) return filesIn(relative);
    assert.ok(entry.isFile(), "nonregular entry: " + relative);
    localFile(relative);
    return [relative];
  });
}

function markdownLinks(text) {
  return [...text.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)].map((match) => match[1]);
}

test("six skills adapt material with pinned origins and identified licenses", () => {
  assert.equal(INVENTORY.schemaVersion, 1);
  assert.deepEqual(INVENTORY.skills.map((skill) => skill.name).sort(), [
    "agentic-analysis-optimization", "agentic-architecture", "agentic-ci-audit",
    "agentic-fix", "agentic-implement", "agentic-tool-design",
  ]);
  for (const skill of INVENTORY.skills) assert.ok(skill.coverage === undefined || skill.coverage === "partial", skill.name + ": invalid coverage");
  assert.equal(new Set(INVENTORY.skills.map((skill) => skill.name)).size, INVENTORY.skills.length);
  assert.ok(Object.keys(INVENTORY.upstreams).length > 0);
  for (const [name, upstream] of Object.entries(INVENTORY.upstreams)) {
    assert.match(upstream.commit, GIT_SHA, name + ": revision is not fully pinned");
    assert.match(upstream.repository, /^https:\/\/github\.com\/[^/]+\/[^/]+$/);
    assert.equal(upstream.gitUrl, upstream.repository + ".git");
    assert.ok(upstream.license.length > 0, name + ": missing license");
  }
  for (const skill of INVENTORY.skills) {
    assert.ok(skill.origin.startsWith("skills/" + skill.name + "/"));
    assert.ok(skill.licenseFile.startsWith("skills/" + skill.name + "/"));
    localFile("skills/" + skill.name + "/SKILL.md");
    localFile(skill.origin);
    localFile(skill.licenseFile);
  }
});

test("README table points to the upstream of each adapted skill", () => {
  const lines = readFileSync(path.join(ROOT, "README.md"), "utf8").split(/\r?\n/);
  for (const skill of INVENTORY.skills) {
    const file = INVENTORY.files.find((entry) => entry.targetPath === "skills/" + skill.name + "/SKILL.md");
    assert.ok(file, skill.name + ": SKILL.md has no provenance");
    const line = lines.find((entry) => entry.startsWith("| `" + skill.name + "` |"));
    assert.ok(line, skill.name + ": missing README table row");
    assert.deepEqual(markdownLinks(line), [INVENTORY.upstreams[file.upstream].repository], skill.name + ": README origin differs");
  }
});

test("each mapping preserves identity, mode and SHA-256 of local bytes", () => {
  assert.ok(INVENTORY.files.length > 0);
  assert.equal(new Set(INVENTORY.files.map((file) => file.targetPath)).size, INVENTORY.files.length, "duplicate destination");
  for (const file of INVENTORY.files) {
    assert.ok(Object.hasOwn(INVENTORY.upstreams, file.upstream), "unknown upstream: " + file.upstream);
    relativePath(file.sourcePath);
    const destination = localFile(file.targetPath);
    assert.match(file.sourceSha256, SHA256, file.sourcePath);
    assert.match(file.targetSha256, SHA256, file.targetPath);
    assert.ok(file.mode === "verbatim" || file.mode === "adapted", "invalid mode: " + file.mode);
    assert.ok(typeof file.reason === "string" && file.reason.trim(), "missing reason: " + file.targetPath);
    const observed = createHash("sha256").update(readFileSync(destination)).digest("hex");
    assert.equal(observed, file.targetSha256, "local hash differs: " + file.targetPath);
    if (file.mode === "verbatim") assert.equal(file.targetSha256, file.sourceSha256, "verbatim copy changed: " + file.targetPath);
    else assert.notEqual(file.targetSha256, file.sourceSha256, "adaptation has no difference: " + file.targetPath);
  }
});

test("inventory covers every adapted file and copied license", () => {
  const expected = new Set(INVENTORY.files.map((file) => file.targetPath));
  for (const skill of INVENTORY.skills) expected.add(skill.origin);
  // Partial skills include only adapted files; their original material stays outside this inventory.
  const whole = INVENTORY.skills.filter((skill) => skill.coverage !== "partial");
  const existing = whole.flatMap((skill) => filesIn("skills/" + skill.name));
  const fromWhole = [...expected].filter((p) => whole.some((skill) => p.startsWith("skills/" + skill.name + "/")));
  assert.deepEqual(existing.sort(), fromWhole.sort());
  for (const skill of INVENTORY.skills.filter((s) => s.coverage === "partial")) {
    const own = [...expected].filter((p) => p.startsWith("skills/" + skill.name + "/"));
    assert.ok(own.length >= 3, skill.name + ": missing adapted files");
    for (const p of own) localFile(p);
  }
  for (const skill of INVENTORY.skills) {
    const license = INVENTORY.files.find((file) => file.targetPath === skill.licenseFile);
    assert.ok(license, skill.name + ": license has no provenance");
    assert.equal(license.mode, "verbatim", skill.name + ": license changed");
    assert.equal(license.sourcePath, "LICENSE");
    assert.ok(INVENTORY.files.some((file) => file.targetPath === "skills/" + skill.name + "/SKILL.md"), skill.name + ": SKILL.md has no provenance");
  }
});

test("origins link to existing licenses and all pinned source files", () => {
  for (const skill of INVENTORY.skills) {
    const origin = localFile(skill.origin);
    const links = markdownLinks(readFileSync(origin, "utf8"));
    const local = links.filter((link) => !/^[a-z][a-z0-9+.-]*:/i.test(link) && !link.startsWith("#"));
    const destinations = local.map((link) => {
      const withoutFragment = decodeURIComponent(link.split("#")[0]);
      const relative = path.relative(ROOT, path.resolve(path.dirname(origin), withoutFragment)).split(path.sep).join("/");
      localFile(relative);
      return relative;
    });
    assert.ok(destinations.includes(skill.licenseFile), skill.name + ": missing license link");
    for (const file of INVENTORY.files.filter((entry) => entry.targetPath.startsWith("skills/" + skill.name + "/"))) {
      const upstream = INVENTORY.upstreams[file.upstream];
      const expected = upstream.repository + "/blob/" + upstream.commit + "/" + file.sourcePath;
      assert.ok(links.includes(expected), skill.name + ": origin lacks " + expected);
    }
  }
});

test("imported material uses pinned file links, without moving main references", () => {
  const paths = new Set([...INVENTORY.files.map((file) => file.targetPath), ...INVENTORY.skills.map((skill) => skill.origin)]);
  for (const relative of paths) {
    const text = readFileSync(localFile(relative), "utf8");
    assert.doesNotMatch(text, /https?:\/\/(?:github\.com\/[^/\s]+\/[^/\s]+\/(?:blob|raw|tree)|raw\.githubusercontent\.com\/[^/\s]+\/[^/\s]+)\/(?:main|master|HEAD)(?=[/#\s)<>]|$)/i, relative + ": moving link");
    for (const upstream of Object.values(INVENTORY.upstreams)) {
      const prefix = upstream.repository + "/blob/";
      for (const link of markdownLinks(text).filter((destination) => destination.startsWith(prefix))) {
        assert.match(link.slice(prefix.length).split("/")[0], GIT_SHA, relative + ": link has no full revision");
      }
    }
  }
});
