// LeetCode daily sync for the portfolio report card.
//
// Reads Shanmayi's PUBLIC LeetCode profile and writes public/leetcode.json.
// No login, token, cookie or API key is used or needed.
//
// Usage (Node 18 or newer, no npm packages):
//   node scripts/leetcode-sync.mjs ShanmayiShree public/leetcode.json
//
// Exit code 0 = fresh data written. Exit code 1 = refresh failed; the previous
// good data is kept and only lastAttempt is updated, so the page can say so.
//
// Source: https://leetcode.com/graphql is unofficial and undocumented. LeetCode
// can change or block it at any time, which is why every response is validated
// before anything is written.

import { readFile, writeFile, rename } from 'node:fs/promises';

export const ENDPOINT = 'https://leetcode.com/graphql';
export const SCHEMA = 1;
const DAY = 86400;

export const QUERY = `query($u: String!) {
  matchedUser(username: $u) {
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    userCalendar { streak totalActiveDays submissionCalendar }
    badges { displayName creationDate }
  }
  recentAcSubmissionList(username: $u, limit: 10) { title titleSlug timestamp }
}`;

const isCount = (n) => Number.isInteger(n) && n >= 0;
const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));

// Turn LeetCode's GraphQL answer into the portfolio's data shape.
// Throws if the answer is missing anything the card needs.
export function toPortfolioShape(data, user, now = Date.now()) {
  const u = data && data.matchedUser;
  if (!u) throw new Error('Profile not found or not public');
  if (!u.submitStatsGlobal || !Array.isArray(u.submitStatsGlobal.acSubmissionNum)) throw new Error('Solved counts missing');
  if (!u.userCalendar || typeof u.userCalendar.submissionCalendar !== 'string') throw new Error('Activity calendar missing');
  const ac = Object.fromEntries(u.submitStatsGlobal.acSubmissionNum.map((x) => [x.difficulty, x.count]));
  let raw;
  try { raw = JSON.parse(u.userCalendar.submissionCalendar || '{}'); } catch (e) { throw new Error('Activity calendar is not valid JSON', { cause: e }); }
  // The last 365 UTC days, oldest first, one submission count per day.
  const today = Math.floor(now / 1000 / DAY) * DAY;
  const first = today - 364 * DAY;
  const cal = [];
  for (let t = first; t <= today; t += DAY) cal.push(Number(raw[t] || 0));
  // Start the calendar at the first active day (never longer than one year).
  let lead = 0;
  while (lead < cal.length - 1 && cal[lead] === 0) lead++;
  return {
    schema: SCHEMA,
    user,
    profileUrl: 'https://leetcode.com/u/' + user + '/',
    source: 'leetcode.com/graphql (public, unofficial)',
    origin: 'sync',
    fetchedAt: new Date(now).toISOString(),
    lastAttempt: { at: new Date(now).toISOString(), ok: true, error: null },
    solved: ac.All,
    easy: ac.Easy,
    medium: ac.Medium,
    hard: ac.Hard,
    submissions: cal.reduce((a, b) => a + b, 0),
    activeDays: u.userCalendar.totalActiveDays,
    maxStreak: u.userCalendar.streak,
    badges: (u.badges || []).map((b) => ({ name: String(b.displayName || '').trim(), date: b.creationDate })),
    calStart: new Date((first + lead * DAY) * 1000).toISOString().slice(0, 10),
    cal: cal.slice(lead),
    recent: (data.recentAcSubmissionList || []).map((r) => ({ title: String(r.title || '').trim(), slug: r.titleSlug, ts: Number(r.timestamp) }))
  };
}

// Checks a data object before it is written (sync) or shown (the page runs the same checks).
// prev is the last good file, used to catch impossible drops.
export function validate(d, prev) {
  if (!d || typeof d !== 'object') throw new Error('No data');
  if (d.schema !== SCHEMA) throw new Error('Unknown schema ' + d.schema);
  for (const k of ['solved', 'easy', 'medium', 'hard', 'submissions', 'activeDays', 'maxStreak']) {
    if (!isCount(d[k])) throw new Error('Bad value for ' + k + ': ' + d[k]);
  }
  if (d.easy + d.medium + d.hard !== d.solved) throw new Error('Easy + medium + hard does not equal solved');
  if (d.activeDays > 366) throw new Error('More active days than a year has');
  if (d.maxStreak > d.activeDays) throw new Error('Longest streak is longer than the number of active days');
  if (Number.isNaN(Date.parse(d.fetchedAt))) throw new Error('fetchedAt is not a date');
  if (!isDay(d.calStart)) throw new Error('calStart is not a date');
  if (!Array.isArray(d.cal) || d.cal.length < 1 || d.cal.length > 366 || !d.cal.every(isCount)) throw new Error('Activity calendar is malformed');
  if (d.cal.reduce((a, b) => a + b, 0) !== d.submissions) throw new Error('Submissions do not match the calendar');
  if (!Array.isArray(d.badges) || !d.badges.every((b) => b && b.name && isDay(b.date))) throw new Error('Badges are malformed');
  if (!Array.isArray(d.recent) || !d.recent.every((r) => r && r.title && /^[a-z0-9-]+$/.test(r.slug || '') && Number.isFinite(r.ts))) throw new Error('Recent submissions are malformed');
  if (prev && isCount(prev.solved) && d.solved < prev.solved) {
    throw new Error('Solved count went down (' + prev.solved + ' to ' + d.solved + ')');
  }
  return d;
}

async function fetchOnce(user, { endpoint, fetchImpl, timeoutMs }) {
  let res;
  try {
    res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://leetcode.com/u/' + user + '/',
        'User-Agent': 'portfolio-leetcode-sync (GitHub Actions; reads public profile data only)'
      },
      body: JSON.stringify({ query: QUERY, variables: { u: user } }),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (e) {
    if (e && (e.name === 'TimeoutError' || e.name === 'AbortError')) throw new Error('Timed out after ' + timeoutMs / 1000 + 's', { cause: e });
    throw new Error('Network error: ' + (e && e.message) + (e && e.cause && e.cause.code ? ' (' + e.cause.code + ')' : ''), { cause: e });
  }
  if (!res.ok) throw new Error('LeetCode returned HTTP ' + res.status);
  let json;
  try { json = await res.json(); } catch (e) { throw new Error('Response was not valid JSON', { cause: e }); }
  if (json && json.errors) throw new Error('GraphQL error: ' + json.errors.map((x) => x.message).join('; '));
  if (!json || !json.data) throw new Error('Response had no data');
  return json.data;
}

async function readPrevious(out) {
  try {
    const prev = JSON.parse(await readFile(out, 'utf8'));
    validate(prev, null);
    return prev;
  } catch {
    return null; // missing or unreadable: treated as "no previous good data"
  }
}

async function writeAtomic(path, obj) {
  const tmp = path + '.tmp';
  await writeFile(tmp, JSON.stringify(obj, null, 2) + '\n');
  await rename(tmp, path);
}

// One full refresh. Returns { ok, error, data }.
export async function run({
  user = 'ShanmayiShree',
  out = 'public/leetcode.json',
  endpoint = ENDPOINT,
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  timeoutMs = 20000,
  attempts = 3,
  retryDelayMs = 15000,
  log = console
} = {}) {
  const prev = await readPrevious(out);
  let lastError = null;
  for (let i = 1; i <= attempts; i++) {
    try {
      const data = await fetchOnce(user, { endpoint, fetchImpl, timeoutMs });
      const shaped = validate(toPortfolioShape(data, user, now()), prev);
      await writeAtomic(out, shaped);
      log.log(`OK: ${shaped.solved} solved (${shaped.easy}/${shaped.medium}/${shaped.hard}), ${shaped.activeDays} active days, longest streak ${shaped.maxStreak}, fetchedAt ${shaped.fetchedAt}`);
      return { ok: true, error: null, data: shaped };
    } catch (e) {
      lastError = e.message;
      log.error(`Attempt ${i} of ${attempts} failed: ${lastError}`);
      // A validation failure will not fix itself on retry.
      if (/went down|does not equal|malformed|not a date|Bad value|More active|Longest streak|do not match|not found/.test(lastError)) break;
      if (i < attempts) await new Promise((r) => setTimeout(r, retryDelayMs * i));
    }
  }
  if (prev) {
    // Keep every figure and fetchedAt exactly as they were. Only record the failed attempt.
    const kept = Object.assign({}, prev, { lastAttempt: { at: new Date(now()).toISOString(), ok: false, error: String(lastError).slice(0, 200) } });
    await writeAtomic(out, kept);
    log.error('Kept the previous data from ' + prev.fetchedAt + '.');
  } else {
    log.error('No previous good data to keep, so nothing was written.');
  }
  return { ok: false, error: lastError, data: prev };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [user, out] = [process.argv[2] || 'ShanmayiShree', process.argv[3] || 'public/leetcode.json'];
  run({ user, out }).then((r) => process.exit(r.ok ? 0 : 1), (e) => { console.error(e.message); process.exit(1); });
}
