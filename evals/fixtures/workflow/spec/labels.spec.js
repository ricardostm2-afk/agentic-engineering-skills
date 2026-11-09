import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statusLabel } from '../src/labels.js';
test('known status labels', () => { assert.equal(statusLabel('open'), 'Open'); assert.equal(statusLabel('closed'), 'Closed'); });
test('unknown status', () => assert.equal(statusLabel('other'), 'Unknown'));
test('inherited object names remain unknown', () => {
  for (const name of ['toString', 'constructor', '__proto__']) assert.equal(statusLabel(name), 'Unknown');
});
