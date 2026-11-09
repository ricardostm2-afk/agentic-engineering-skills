import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canRead } from '../src/access.js';
test('own organization can read', () => assert.equal(canRead('acme', 'acme'), true));
test('other organization cannot read', () => assert.equal(canRead('acme', 'other'), false));
test('missing identities cannot grant access', () => assert.equal(canRead(undefined, undefined), false));
