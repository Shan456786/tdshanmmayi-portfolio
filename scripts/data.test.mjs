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

test('the report card reads ./leetcode.json (relative, so it works under the project Pages path)', () => {
  assert.equal(LEETCODE.liveUrl, './leetcode.json');
});

test('the sync workflow runs daily at 06:00 IST (00:30 UTC), keeps the manual button, and asks for little', async () => {
  const yml = await readFile(fileURLToPath(new URL('../.github/workflows/leetcode-sync.yml', import.meta.url)), 'utf8');
  const live = yml.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
  assert.match(live, /^on:\n {2}schedule:\n {4}- cron: '30 0 \* \* \*'/m, 'daily schedule at 00:30 UTC');
  assert.match(live, /^ {2}workflow_dispatch:/m, 'manual run kept');
  assert.match(live, /^permissions: \{\}/m, 'no permissions by default');
  assert.equal((live.match(/contents: write/g) || []).length, 1, 'only the one sync job may write');
  assert.ok(!/secrets\./.test(live), 'no repository secrets');
  assert.ok(!/GH_TOKEN|PERSONAL|PAT\b/.test(live), 'no personal access token');
});

test('the data file is never older than the snapshot in the page', () => {
  assert.ok(Date.parse(file.fetchedAt) >= Date.parse(LEETCODE.snapshot.fetchedAt));
});

test('the deploy workflow runs on push to main, after the LeetCode sync, and by hand, with only the Pages permissions', async () => {
  const yml = await readFile(fileURLToPath(new URL('../.github/workflows/deploy-pages.yml', import.meta.url)), 'utf8');
  const live = yml.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
  assert.match(live, /^ {2}push:\n {4}branches: \[main\]/m, 'push to main');
  assert.match(live, /^ {2}workflow_run:\n {4}workflows: \['Sync LeetCode stats'\]\n {4}types: \[completed\]/m, 'after the sync workflow');
  assert.match(live, /^ {2}workflow_dispatch:/m, 'manual run kept');
  assert.match(live, /^permissions: \{\}/m, 'no permissions by default');
  assert.match(live, /contents: read/);
  assert.match(live, /pages: write/);
  assert.match(live, /id-token: write/);
  assert.ok(!/contents: write/.test(live), 'the deploy job never writes to the repository');
  const sync = await readFile(fileURLToPath(new URL('../.github/workflows/leetcode-sync.yml', import.meta.url)), 'utf8');
  const name = (sync.match(/^name: (.+)$/m) || [])[1];
  assert.equal(name, 'Sync LeetCode stats', 'the deploy trigger names the sync workflow exactly');
});
