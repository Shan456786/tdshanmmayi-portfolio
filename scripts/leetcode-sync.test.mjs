// Tests for the LeetCode sync. Run with:  node --test scripts/
// They start a small local HTTP server that plays the part of LeetCode, so the
// script's real network code (timeouts, HTTP errors, bad JSON) is exercised.
// The success case replays a real response captured from LeetCode on 22 Nov 2026.
// Nothing here contacts leetcode.com.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, readFile, writeFile, copyFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run, validate, toPortfolioShape } from './leetcode-sync.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const REAL = JSON.parse(await readFile(join(here, 'fixtures/leetcode-response-2026-11-22.json'), 'utf8'));
// A frozen copy of the 22 Nov data, so these tests never depend on the live public/leetcode.json.
const SEED = join(here, 'fixtures/seed-2026-11-22.json');
const REAL24 = JSON.parse(await readFile(join(here, 'fixtures/leetcode-response-2026-11-24.json'), 'utf8'));
const NOW = Date.parse('2026-11-22T13:13:45Z');
const quiet = { log() {}, error() {} };

// A fake LeetCode. `plan` is a list of behaviours, one per request.
async function server(plan) {
  let i = 0;
  const s = http.createServer((req, res) => {
    const step = plan[Math.min(i++, plan.length - 1)];
    if (step === 'hang') return; // never answers
    if (step === 'garbage') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end('<html>Just a moment...</html>'); }
    if (typeof step === 'number') { res.writeHead(step); return res.end('error'); }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(step));
  });
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  return { url: 'http://127.0.0.1:' + s.address().port + '/graphql', close: () => { s.closeAllConnections(); s.close(); }, hits: () => i };
}

async function workdir(withSeed = true) {
  const d = await mkdtemp(join(tmpdir(), 'lc-'));
  const out = join(d, 'leetcode.json');
  if (withSeed) await copyFile(SEED, out);
  return out;
}
const read = async (p) => JSON.parse(await readFile(p, 'utf8'));
const opts = (url, out, extra = {}) => Object.assign({ endpoint: url, out, now: () => NOW, timeoutMs: 400, attempts: 1, retryDelayMs: 10, log: quiet }, extra);

test('success: real captured response is converted, validated and written', async () => {
  const srv = await server([REAL.response]);
  const out = await workdir();
  const r = await run(opts(srv.url, out));
  srv.close();
  assert.equal(r.ok, true);
  const d = await read(out);
  assert.equal(d.origin, 'sync');
  assert.equal(d.fetchedAt, '2026-11-22T13:13:45.000Z');
  assert.deepEqual(d.lastAttempt, { at: '2026-11-22T13:13:45.000Z', ok: true, error: null });
  assert.deepEqual([d.solved, d.easy, d.medium, d.hard], [252, 77, 134, 41]);
  assert.equal(d.maxStreak, 75);
  assert.equal(d.activeDays, 128);
  assert.equal(d.submissions, 313);
  assert.equal(d.calStart, '2026-07-17');
  assert.equal(d.cal.length, 129);
  assert.equal(d.badges.length, 5);
  assert.equal(d.recent.length, 10);
  assert.equal(d.recent[8].title, 'Minimum Positive Sum Subarray', 'trailing space in LeetCode title is trimmed');
  assert.equal('currentStreak' in d, false, 'no current streak is invented');
});

test('success: real response captured 24 Nov moves the 22 Nov data forward', async () => {
  const srv = await server([REAL24]);
  const out = await workdir();
  const r = await run(Object.assign(opts(srv.url, out), { now: () => Date.parse('2026-11-24T13:35:52Z') }));
  srv.close();
  assert.equal(r.ok, true);
  const d = await read(out);
  assert.equal(d.fetchedAt, '2026-11-24T13:35:52.000Z');
  assert.deepEqual([d.solved, d.easy, d.medium, d.hard], [254, 78, 135, 41]);
  assert.equal(d.maxStreak, 77);
  assert.equal(d.activeDays, 130);
  assert.equal(d.submissions, 315);
  assert.equal(d.cal.length, 131);
  assert.equal(d.recent[0].title, 'Maximum Subarray With Equal Products');
  const old = JSON.parse(await readFile(SEED, 'utf8'));
  assert.deepEqual(d.cal.slice(0, old.cal.length), old.cal, 'earlier days are unchanged, two new days added');
});

test('HTTP 500: previous data kept, failure recorded', async () => {
  const srv = await server([500]);
  const out = await workdir();
  const before = await read(out);
  const r = await run(opts(srv.url, out));
  srv.close();
  assert.equal(r.ok, false);
  const d = await read(out);
  assert.equal(d.fetchedAt, before.fetchedAt, 'data timestamp unchanged');
  assert.equal(d.solved, before.solved);
  assert.deepEqual(d.cal, before.cal);
  assert.equal(d.lastAttempt.ok, false);
  assert.match(d.lastAttempt.error, /HTTP 500/);
});

test('timeout: a server that never answers is abandoned and data kept', async () => {
  const srv = await server(['hang']);
  const out = await workdir();
  const t0 = Date.now();
  const r = await run(opts(srv.url, out, { timeoutMs: 300 }));
  srv.close();
  assert.equal(r.ok, false);
  assert.match(r.error, /Timed out/);
  assert.ok(Date.now() - t0 < 3000, 'gave up quickly');
  assert.equal((await read(out)).fetchedAt, '2026-11-22T08:14:19Z');
});

test('invalid response: HTML instead of JSON (e.g. a bot check page)', async () => {
  const srv = await server(['garbage']);
  const out = await workdir();
  const r = await run(opts(srv.url, out));
  srv.close();
  assert.match(r.error, /not valid JSON/);
  assert.equal((await read(out)).solved, 252);
});

test('invalid response: GraphQL error, missing user, numbers that do not add up', async () => {
  const bad = structuredClone(REAL.response);
  bad.data.matchedUser.submitStatsGlobal.acSubmissionNum[1].count = 70;
  for (const [body, msg] of [
    [{ errors: [{ message: 'rate limited' }] }, /GraphQL error: rate limited/],
    [{ data: { matchedUser: null } }, /not found/],
    [bad, /does not equal solved/]
  ]) {
    const srv = await server([body]);
    const out = await workdir();
    const r = await run(opts(srv.url, out));
    srv.close();
    assert.equal(r.ok, false);
    assert.match(r.error, msg);
    assert.equal((await read(out)).solved, 252, 'previous data kept');
  }
});

test('empty or zeroed data never replaces good data', async () => {
  const zero = structuredClone(REAL.response);
  zero.data.matchedUser.submitStatsGlobal.acSubmissionNum = [{ difficulty: 'All', count: 0 }, { difficulty: 'Easy', count: 0 }, { difficulty: 'Medium', count: 0 }, { difficulty: 'Hard', count: 0 }];
  const srv = await server([zero]);
  const out = await workdir();
  const r = await run(opts(srv.url, out));
  srv.close();
  assert.match(r.error, /went down/);
  assert.equal((await read(out)).solved, 252);
});

test('fallback: with no previous file, a failure writes nothing', async () => {
  const srv = await server([503]);
  const out = await workdir(false);
  const r = await run(opts(srv.url, out));
  srv.close();
  assert.equal(r.ok, false);
  await assert.rejects(access(out));
});

test('retry: one failure then success', async () => {
  const srv = await server([502, REAL.response]);
  const out = await workdir();
  const r = await run(opts(srv.url, out, { attempts: 3 }));
  srv.close();
  assert.equal(r.ok, true);
  assert.equal(srv.hits(), 2);
});

test('timestamps: success moves fetchedAt; a later failure keeps it and records the attempt', async () => {
  const out = await workdir();
  let srv = await server([REAL.response]);
  await run(opts(srv.url, out, { now: () => Date.parse('2026-11-23T02:41:00Z') }));
  srv.close();
  assert.equal((await read(out)).fetchedAt, '2026-11-23T02:41:00.000Z');
  srv = await server([500]);
  await run(opts(srv.url, out, { now: () => Date.parse('2026-11-24T02:41:00Z') }));
  srv.close();
  const d = await read(out);
  assert.equal(d.fetchedAt, '2026-11-23T02:41:00.000Z', 'last successful refresh unchanged');
  assert.equal(d.lastAttempt.at, '2026-11-24T02:41:00.000Z');
  assert.equal(d.lastAttempt.ok, false);
  srv = await server([REAL.response]);
  await run(opts(srv.url, out, { now: () => Date.parse('2026-11-25T02:41:00Z') }));
  srv.close();
  const e = await read(out);
  assert.equal(e.fetchedAt, '2026-11-25T02:41:00.000Z');
  assert.equal(e.lastAttempt.ok, true);
});

test('corrupt previous file does not block a good refresh', async () => {
  const out = await workdir(false);
  await writeFile(out, '{ not json');
  const srv = await server([REAL.response]);
  const r = await run(opts(srv.url, out));
  srv.close();
  assert.equal(r.ok, true);
  assert.equal((await read(out)).solved, 252);
});

test('the seed file in public/ is valid', async () => {
  const seed = await read(SEED);
  validate(seed, null);
  assert.equal(seed.origin, 'snapshot');
});

test('calendar is aligned to UTC days', () => {
  const d = toPortfolioShape(REAL.response.data, 'ShanmayiShree', NOW);
  assert.equal(d.cal[0], 3);
  assert.equal(d.cal[d.cal.length - 1], 1, '22 Nov 2026 had one accepted submission at capture time');
});
