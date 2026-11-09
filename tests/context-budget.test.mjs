import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { measureContext } from '../tools/context-budget.mjs';

function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'context-budget-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'skills', 'example'), { recursive: true });
  writeFileSync(path.join(root, 'skills/example/SKILL.md'), '---\nname: example\ndescription: Example\n---\nText é.\n');
  return { root, config: { schemaVersion: 1, metadataMaxBytes: 100, skillMaxBytes: 100,
    routes: [{ name: 'example', files: ['skills/example/SKILL.md'], maxBytes: 100 }] } };
}
test('static budgets count full loaded text, including frontmatter and comments', (t) => {
  const { root, config } = fixture(t), first = measureContext(root, config);
  assert.equal(first.passed, true); assert.ok(first.skills[0].bytes > first.skills[0].characters);
  writeFileSync(path.join(root, 'skills/example/SKILL.md'), '---\nname: example\ndescription: Example\n---\n<!--' + 'x'.repeat(150) + '-->\n');
  const next = measureContext(root, config);
  assert.equal(next.passed, false); assert.equal(next.problems.length, 2);
});
test('metadata budget catches discoverability overhead independently', (t) => {
  const { root, config } = fixture(t); config.metadataMaxBytes = 1;
  assert.match(measureContext(root, config).problems[0], /metadata/);
});
test('missing, escaping, duplicated and stale paths cannot yield a passing measurement', (t) => {
  const { root, config } = fixture(t);
  for (const files of [['missing.md'], ['../outside.md'], ['/etc/passwd'], ['skills/example/SKILL.md', 'skills/example/SKILL.md']]) {
    assert.throws(() => measureContext(root, { ...config, routes: [{ name: 'bad', files, maxBytes: 100 }] }));
  }
  assert.throws(() => measureContext(root, { ...config, skills: { absent: 10 } }), /absent/);
});
