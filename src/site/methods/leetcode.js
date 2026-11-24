import { LEETCODE } from '../../data/leetcode.js';
export const leetcodeMethods = {
  lcValid(d) {
    const n = (x) => Number.isInteger(x) && x >= 0;
    const day = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !isNaN(Date.parse(x + 'T00:00:00Z'));
    if (!d || typeof d !== 'object' || d.schema !== 1) return false;
    if (d.user !== LEETCODE.user) return false;
    if (!['solved', 'easy', 'medium', 'hard', 'submissions', 'activeDays', 'maxStreak'].every((k) => n(d[k]))) return false;
    if (d.easy + d.medium + d.hard !== d.solved || d.maxStreak > d.activeDays) return false;
    if (isNaN(Date.parse(d.fetchedAt)) || !day(d.calStart)) return false;
    if (!Array.isArray(d.cal) || !d.cal.length || d.cal.length > 366 || !d.cal.every(n)) return false;
    if (!Array.isArray(d.badges) || !Array.isArray(d.recent)) return false;
    if (!d.recent.every((r) => r && r.title && /^[a-z0-9-]+$/.test(r.slug || '') && isFinite(r.ts))) return false;
    return true;
  },

  lcLoad() {
    if (typeof fetch !== 'function') { this.setState({ lcStatus: 'error' }); return; }
    if (!this.state.lcData) this.setState({ lcStatus: 'loading' });
    let ctl = null;
    try { ctl = new AbortController(); } catch (err) { ctl = null; }
    const to = setTimeout(() => { if (ctl) ctl.abort(); }, 8000);
    fetch(LEETCODE.liveUrl, { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then((d) => {
        clearTimeout(to);
        if (!this.lcValid(d)) throw new Error('unexpected shape');
        if (this.raf !== -1) this.setState({ lcData: d, lcStatus: 'loaded' });
      })
      .catch(() => {
        clearTimeout(to);
        if (this.raf !== -1 && !this.state.lcData) this.setState({ lcStatus: 'error' });
      });
  },

  lcModel() {
    const s = this.state;
    const live = s.lcData;
    const d = live || LEETCODE.snapshot;
    const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const DAY = 86400000;
    const fmt = (t, yr) => { const x = new Date(t); return x.getUTCDate() + ' ' + MON[x.getUTCMonth()] + (yr ? ' ' + x.getUTCFullYear() : ''); };
    const at = Date.parse(d.fetchedAt) || Date.now();
    const ageH = (Date.now() - at) / 3600000;
    const cal = d.cal || [];
    const human = (t) => fmt(t, true).replace(/[A-Z]{3}/, (m) => m.charAt(0) + m.slice(1).toLowerCase());
    const hhmm = (t) => { const x = new Date(t); return String(x.getUTCHours()).padStart(2, '0') + ':' + String(x.getUTCMinutes()).padStart(2, '0') + ' UTC'; };
    const stamp = fmt(at, true) + ', ' + hhmm(at);
    const synced = !!(live && live.origin === 'sync');
    const tried = live && live.lastAttempt && Date.parse(live.lastAttempt.at);
    let st, stText, foot;
    if (synced && live.lastAttempt && live.lastAttempt.ok === false && tried > at) {
      st = 'stale'; stText = 'LATEST DAILY REFRESH FAILED ' + fmt(tried, true) + ' / SHOWING DATA FROM ' + fmt(at, true);
      foot = 'LAST SUCCESSFUL UPDATE ' + stamp;
    } else if (synced && ageH < 36) {
      const ago = ageH < 1 ? Math.max(1, Math.round(ageH * 60)) + ' MIN AGO' : Math.round(ageH) + (Math.round(ageH) === 1 ? ' HOUR AGO' : ' HOURS AGO');
      st = 'live'; stText = 'UPDATED DAILY FROM LEETCODE / LAST UPDATED ' + ago;
      foot = 'LAST SUCCESSFUL UPDATE ' + stamp + ' / REFRESHES ONCE A DAY';
    } else if (synced) {
      st = 'stale'; stText = 'LAST UPDATED ' + fmt(at, true) + ' / MAY BE OUT OF DATE';
      foot = 'LAST SUCCESSFUL UPDATE ' + stamp;
    } else if (!live && s.lcStatus === 'loading') {
      st = 'load'; stText = 'LOADING THE DAILY UPDATE / SHOWING ' + fmt(at, true) + ' SNAPSHOT';
      foot = 'FIGURES FROM MY PUBLIC PROFILE, RECORDED ' + stamp;
    } else if (!live && s.lcStatus === 'error') {
      st = 'err'; stText = 'COULD NOT LOAD THE DAILY UPDATE / SHOWING ' + fmt(at, true) + ' SNAPSHOT';
      foot = 'SNAPSHOT FROM MY PUBLIC PROFILE, RECORDED ' + stamp;
    } else {
      st = 'snap'; stText = 'SNAPSHOT, NOT LIVE / RECORDED ' + fmt(at, true) + (ageH >= 36 ? ' / MAY BE OUT OF DATE' : '');
      foot = 'FIGURES FROM MY PUBLIC PROFILE, RECORDED ' + stamp;
    }
    const start = Date.parse(d.calStart + 'T00:00:00Z');
    const WEEKS = 22;
    let from = 0;
    const lead0 = new Date(start).getUTCDay();
    if (lead0 + cal.length > WEEKS * 7) from = lead0 + cal.length - WEEKS * 7;
    const s0 = start + from * DAY;
    const lead = new Date(s0).getUTCDay();
    const cells = [];
    for (let k = 0; k < lead; k++) cells.push({ cls: 'lc-d pad', h: 0, t: '' });
    let activeShown = 0;
    for (let k = from; k < cal.length; k++) {
      const c = cal[k] || 0;
      if (c) activeShown++;
      const lv = c === 0 ? 0 : c === 1 ? 1 : c <= 3 ? 2 : c <= 9 ? 3 : 4;
      cells.push({ cls: 'lc-d' + (lv ? ' l' + lv : ''), h: c ? Math.min(c, 12) * 4 + 4 : 0, t: fmt(start + k * DAY, true) + ': ' + c + (c === 1 ? ' submission' : ' submissions') });
    }
    const endT = start + (cal.length - 1) * DAY;
    const badges = (d.badges || []).slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return {
      user: LEETCODE.user, url: LEETCODE.url,
      solved: d.solved, easy: d.easy, medium: d.medium, hard: d.hard,
      barLabel: d.easy + ' easy, ' + d.medium + ' medium and ' + d.hard + ' hard problems solved',
      maxStreak: d.maxStreak, activeDays: d.activeDays, submissions: d.submissions,
      badgeCount: badges.length, badgeLatest: badges.length ? badges[0].name : 'none yet',
      maxWhen: 'days, as of ' + human(at), badgeWhen: 'earned, as of ' + human(at), yearWhen: 'in the year to ' + human(at),
      stCls: 'lc-status ' + st, stText: stText, foot: foot,
      cells: cells, calRange: fmt(s0) + ' TO ' + fmt(endT, true),
      calAria: 'Activity calendar: ' + activeShown + ' active days between ' + fmt(s0, true) + ' and ' + fmt(endT, true) + '.',
      pe: Math.round(d.easy / Math.max(1, d.solved) * 100), pm: Math.round(d.medium / Math.max(1, d.solved) * 100), ph: Math.round(d.hard / Math.max(1, d.solved) * 100),
      factWhen: 'AS OF ' + fmt(at, true),
      sub: synced ? 'I practise problem solving on LeetCode. This card updates from my public profile once a day and says exactly when it last updated.' : 'I practise problem solving on LeetCode. This card is a dated snapshot of my public profile, not a live feed, and it says exactly when its numbers were recorded.', factHuman: 'as of ' + human(at),
      recent: (d.recent || []).slice(0, 5).map((r) => ({ title: r.title, href: 'https://leetcode.com/problems/' + r.slug + '/', date: fmt(r.ts * 1000) }))
    };
  }
};
