import { PROJECTS } from '../../data/projects/index.js';
export const caseStudyMethods = {
  /* ---- case studies ---- */
  csOf(kind) { const p = PROJECTS.find((x) => x.cs && x.cs.kind === kind); return (p && p.cs) || {}; },

  /* FoodBridge: evaluateMatch() from src/lib/matching.ts, same weights and rules, with example inputs */
  fbMatch(f) {
    const W = { distance: 0.35, urgency: 0.2, quantity: 0.2, storage: 0.1, feasibility: 0.15 };
    const clamp01 = (n) => Math.min(1, Math.max(0, n));
    const km = (d) => (d < 1 ? Math.round(d * 1000) + ' m' : d.toFixed(1) + ' km');
    const blockers = [], reasons = [];
    const storageOk = f.st === 'frozen' ? f.fz : f.st === 'refrigerated' ? (f.fr || f.fz) : true;
    if (f.m <= 0) blockers.push('pickup window has closed');
    if (!f.v) blockers.push('receiver is not yet verified');
    if (!storageOk) blockers.push(f.st === 'frozen' ? 'freezer storage required' : 'refrigerated storage required');
    if (f.cap < f.meals) blockers.push('needs capacity for ' + f.meals + ' meals (has ' + f.cap + ')');
    if (f.d > f.r) blockers.push(km(f.d) + ' away, outside the ' + f.r + ' km pickup radius');
    const c = {};
    c.distance = clamp01(1 - f.d / f.r);
    c.feasibility = f.m <= 0 ? 0 : clamp01(f.m / 60);
    c.urgency = c.feasibility > 0 ? clamp01(1 - f.m / 60 / 12) * c.feasibility : 0;
    c.quantity = f.cap > 0 ? clamp01(f.meals / (0.5 * f.cap)) : 0;
    c.storage = storageOk ? 1 : 0;
    const raw = Object.keys(W).reduce((a, k) => a + c[k] * W[k], 0);
    const eligible = blockers.length === 0;
    const score = eligible ? Math.round(raw * 100) : 0;
    reasons.push(km(f.d) + ' away (straight-line)');
    if (f.st !== 'ambient' && c.storage) reasons.push(f.st + ' storage available');
    else if (f.st === 'ambient') reasons.push('no special storage needed');
    if (c.feasibility >= 1) reasons.push('pickup window compatible');
    else if (c.feasibility > 0) reasons.push('only ' + Math.max(1, Math.round(f.m)) + ' min of pickup window left');
    if (c.urgency >= 0.6) reasons.push('urgent, prioritised');
    if (f.cap >= f.meals) reasons.push('fits capacity (' + f.meals + '/' + f.cap + ' meals)');
    return { W: W, c: c, eligible: eligible, score: score, blockers: blockers, reasons: reasons };
  },

  fbView(f) {
    const m = this.fbMatch(f);
    const hm = (mins) => (mins <= 0 ? 'closed' : (mins >= 60 ? Math.floor(mins / 60) + ' h ' : '') + (mins % 60 ? (mins % 60) + ' min' : '')).trim();
    const names = { distance: 'Distance', urgency: 'Urgency', quantity: 'Quantity fit', storage: 'Storage fit', feasibility: 'Feasibility' };
    return {
      dTxt: f.d.toFixed(1) + ' km', rTxt: f.r + ' km', mTxt: hm(f.m), mealsTxt: String(f.meals), capTxt: f.cap + ' meals',
      stampCls: 'fb-stamp ' + (m.eligible ? 'ok' : 'no'), stampK: m.eligible ? 'ELIGIBLE' : 'HARD FILTER FAILED', stamp: m.eligible ? m.score + ' / 100' : 'NOT ELIGIBLE',
      barsHidden: m.eligible ? 'false' : 'true',
      bars: Object.keys(m.W).map((key) => ({ k: names[key], w: '\u00d7 ' + m.W[key].toFixed(2), share: (m.W[key] / 0.35 * 100).toFixed(1), v: (m.c[key] * 100).toFixed(1), pts: m.eligible ? (m.c[key] * m.W[key] * 100).toFixed(1) : '0' })),
      summary: m.eligible ? m.score + '% match: ' + m.reasons.join(', ') + '.' : 'Not eligible: ' + m.blockers.join('; ') + '. However close the receiver is, the score stays at zero.'
    };
  },

  /* while a slider moves, only the matcher's own text and bars are written, with no page redraw; releasing it commits the value */
  fbPaint() {
    const box = document.querySelector('.fb-mx');
    if (!box) return;
    const v = this.fbView(this.state.fbIn);
    const txt = (el, t) => { if (!el) return; const n = el.firstChild; if (n && n.nodeType === 3 && !n.nextSibling) { if (n.nodeValue !== t) n.nodeValue = t; } else el.textContent = t; };
    const lab = { d: v.dTxt, r: v.rTxt, m: v.mTxt, meals: v.mealsTxt, cap: v.capTxt };
    box.querySelectorAll('[data-v]').forEach((el) => txt(el, lab[el.getAttribute('data-v')]));
    box.querySelectorAll('input[data-k]').forEach((el) => el.setAttribute('aria-valuetext', lab[el.getAttribute('data-k')]));
    const st = box.querySelector('.fb-stamp');
    if (st) { st.className = v.stampCls; txt(st.querySelector('span'), v.stampK); txt(st.querySelector('b'), v.stamp); }
    const bars = box.querySelector('.fb-bars');
    if (bars) bars.setAttribute('aria-hidden', v.barsHidden);
    box.querySelectorAll('.fb-bar').forEach((row, i) => { const b = v.bars[i]; if (!b) return; const fill = row.querySelector('.fb-trk b'); if (fill) fill.style.setProperty('--v', b.v + '%'); txt(row.querySelector('.fb-pt'), b.pts); });
    txt(box.querySelector('.fb-sum'), v.summary);
  },

  /* SmartCrutch+: parseProtocolLine() from src/lib/serialProtocol.ts, with a reason for every rejection */
  scParse(rawLine) {
    const line = String(rawLine == null ? '' : rawLine).trim();
    const no = (why) => ({ ok: false, why: why });
    if (line.length === 0) return no('The line is empty.');
    if (line.length > 512) return no('Longer than 512 characters, so it cannot be a protocol message.');
    if (line[0] !== '{') return no('Does not start with "{". Startup banners and error lines end up here.');
    let m;
    try { m = JSON.parse(line); } catch (err) { return no('Not valid JSON. Half-received lines end up here.'); }
    if (typeof m !== 'object' || m === null || Array.isArray(m)) return no('Not a JSON object.');
    if (m.type !== 'smartcrutch') return no('"type" is not "smartcrutch".');
    if (typeof m.weight_g !== 'number' || !isFinite(m.weight_g)) return no('"weight_g" is not a finite number.');
    if (typeof m.angle_deg !== 'number' || !isFinite(m.angle_deg) || m.angle_deg < -180 || m.angle_deg > 180) return no('"angle_deg" is not a number between -180 and 180.');
    if (typeof m.unsafe !== 'boolean') return no('"unsafe" is not true or false.');
    return { ok: true, why: 'Every check passed. This line becomes a reading.', reading: { g: m.weight_g, a: m.angle_deg, unsafe: m.unsafe } };
  },

  scSend(line, i) {
    const r = this.scParse(line), s = this.state;
    const st = { scLine: line, scPickI: i, scOk: s.scOk + (r.ok ? 1 : 0), scBad: s.scBad + (r.ok ? 0 : 1) };
    if (r.ok) st.scLast = r.reading;
    this.setState(st);
  },

  /* Password Generator: the steps of generate_password() in main.py, using crypto.getRandomValues */
  pwRandom(m) {
    const a = new Uint32Array(1), lim = Math.floor(4294967296 / m) * m;
    for (;;) { crypto.getRandomValues(a); if (a[0] < lim) return a[0] % m; }
  },

  pwBuild(n) {
    const U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', L = 'abcdefghijklmnopqrstuvwxyz', D = '0123456789', P = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
    const ALL = U + L + D + P;
    const kind = (ch) => (U.indexOf(ch) >= 0 ? 'u' : L.indexOf(ch) >= 0 ? 'l' : D.indexOf(ch) >= 0 ? 'd' : 's');
    const pick = (set, g) => { const ch = set[this.pwRandom(set.length)]; return { c: ch, k: kind(ch), g: g }; };
    const pre = [pick(U, true), pick(L, true), pick(D, true), pick(P, true)];
    for (let i = 0; i < n - 4; i++) pre.push(pick(ALL, false));
    const fin = pre.slice();
    for (let i = fin.length - 1; i > 0; i--) { const j = this.pwRandom(i + 1); const t = fin[i]; fin[i] = fin[j]; fin[j] = t; }
    return { n: n, pre: pre, fin: fin, pass: fin.map((x) => x.c).join('') };
  },

  pwRun(raw) {
    const txt = String(raw == null ? '' : raw);
    const t = txt.trim();
    if (!/^[+-]?\d+$/.test(t)) return { err: 'invalid literal for int() with base 10: \'' + txt + '\'' };
    const n = parseInt(t, 10);
    if (n < 4) return { err: 'Password length must be at least 4.' };
    if (n > 64) return { err: 'Note: this browser re-creation stops at 64 characters. The Python program has no upper limit.', soft: true };
    try { if (!window.crypto || !crypto.getRandomValues) throw new Error('no crypto'); } catch (err) { return { err: 'This browser has no secure random source, so nothing was generated.', soft: true }; }
    return { res: this.pwBuild(n) };
  }
};
