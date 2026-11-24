// Guards the LeetCode data: the committed data file, the snapshot built into the page, and the "not live yet" switch.
// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validate } from './leetcode-sync.mjs';
import { LEETCODE } from '../src/data/leetcode.js';

const file = JSON.parse(await readFile(fileURLToPath(new URL('../public/leetcode.json', import.meta.url)), 'utf8'));

test('public/leetcode.json passes the same checks the sync and the page use', () => {
  validate(file, null);
  assert.equal(file.user, 'ShanmayiShree');
  assert.equal(file.profileUrl, 'https://leetcode.com/u/ShanmayiShree/');
});

test('the snapshot built into the page is internally consistent', () => {
  const s = LEETCODE.snapshot;
  assert.equal(s.easy + s.medium + s.hard, s.solved);
  assert.equal(s.cal.reduce((a, b) => a + b, 0), s.submissions);
  assert.ok(s.maxStreak <= s.activeDays);
  assert.ok(!Number.isNaN(Date.parse(s.fetchedAt)));
});

test('the page stays in dated snapshot mode until the automation has been verified', () => {
  // Switching this on is a manual step, documented in docs/leetcode-sync.md, after one verified run in the real repository.
  assert.ok(LEETCODE.liveUrl === '' || LEETCODE.liveUrl === './leetcode.json', 'liveUrl must be empty or ./leetcode.json');
});

test('the data file is never older than the snapshot in the page', () => {
  assert.ok(Date.parse(file.fetchedAt) >= Date.parse(LEETCODE.snapshot.fetchedAt));
});
