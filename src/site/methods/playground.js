import { HASH_PALETTE, PENCILS } from '../../data/playground.js';
export const playgroundMethods = {
  resetName() {
    if (!this.nameOn || !this.nameEl) return;
    this.nameOn = false;
    this.nameEl.querySelectorAll('.pl').forEach((el) => { el.style.fontWeight = ''; el.style.transform = ''; });
  },

  nameMove(e) {
    const box = this.nameEl.getBoundingClientRect();
    if (e.clientX < box.left - 40 || e.clientX > box.right + 40 || e.clientY < box.top - 40 || e.clientY > box.bottom + 40) { this.resetName(); return; }
    this.nameOn = true;
    this.nameEl.querySelectorAll('.pl').forEach((el) => {
      const r = el.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      const f = Math.max(0, 1 - d / 220);
      if (el.classList.contains('s')) el.style.transform = 'translateY(' + (-f * 0.14).toFixed(3) + 'em) rotate(' + (-f * 10).toFixed(1) + 'deg)';
      else el.style.fontWeight = String(Math.round((el.parentNode.classList.contains('pn3') ? 200 : 800) + (el.parentNode.classList.contains('pn3') ? 700 : -700) * f));
    });
  },

  sizePad() {
    const c = this.padEl;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
    if (c.width !== w || c.height !== h) {
      let snap = null;
      try { if (c.width && c.height) { snap = document.createElement('canvas'); snap.width = c.width; snap.height = c.height; snap.getContext('2d').drawImage(c, 0, 0); } } catch (err) { snap = null; }
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      if (snap) ctx.drawImage(snap, 0, 0, w, h);
    }
  },

  padPoint(e) {
    const c = this.padEl;
    if (!c) return null;
    const r = c.getBoundingClientRect();
    if (!r.width) return null;
    return { x: (e.clientX - r.left) / r.width * c.width, y: (e.clientY - r.top) / r.height * c.height, w: c.width };
  },

  clearPad() {
    const c = this.padEl;
    if (!c) return;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
  },

  dot(p) { this.stroke(p, { x: p.x + 0.5, y: p.y + 0.5, w: p.w }); },

  stroke(a, b) {
    const c = this.padEl;
    if (!c) return;
    const ctx = c.getContext('2d');
    const col = PENCILS[this.state.pencil].c;
    const k = c.width / 600;
    const draw = (x1, y1, x2, y2) => {
      for (let j = 0; j < 3; j++) {
        const jx = (Math.random() - 0.5) * 2.4 * k, jy = (Math.random() - 0.5) * 2.4 * k;
        ctx.globalAlpha = 0.32 + Math.random() * 0.25;
        ctx.strokeStyle = col; ctx.lineWidth = (1.1 + Math.random() * 0.9) * k; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x1 + jx, y1 + jy); ctx.lineTo(x2 + jx, y2 + jy); ctx.stroke();
      }
    };
    draw(a.x, a.y, b.x, b.y);
    if (this.state.mirror) draw(c.width - a.x, a.y, c.width - b.x, b.y);
    ctx.globalAlpha = 1;
  },

  makePassword(n) {
    const U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', L = 'abcdefghijklmnopqrstuvwxyz', D = '0123456789', S = '!@#$%^&*()-_=+[]{};:,.?';
    const all = U + L + D + S;
    const rnd = (m) => {
      try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % m; } catch (err) { return Math.floor(Math.random() * m); }
    };
    const out = [U[rnd(U.length)], L[rnd(L.length)], D[rnd(D.length)], S[rnd(S.length)]];
    while (out.length < n) out.push(all[rnd(all.length)]);
    for (let i = out.length - 1; i > 0; i--) { const j = rnd(i + 1); const t = out[i]; out[i] = out[j]; out[j] = t; }
    return out.join('');
  },

  startDrag(e, i) {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.stopPropagation) e.stopPropagation();
    const r = this.deskRect();
    if (!r) return;
    const s = this.state.st[i];
    this.glide = null;
    this.drag = { mode: 'move', i: i, sx: e.clientX, sy: e.clientY, ox: s.x, oy: s.y, w: r.width, h: r.height, lx: e.clientX, ly: e.clientY, lt: performance.now(), vx: 0, vy: 0 };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    const z = this.state.zTop + 1;
    const st = this.state.st.slice();
    st[i] = Object.assign({}, s, { z: z });
    this.setState({ st: st, zTop: z, sel: i, dragI: i });
  },

  startRot(e, i) {
    if (e.stopPropagation) e.stopPropagation();
    const r = this.deskRect();
    if (!r) return;
    const s = this.state.st[i];
    this.drag = { mode: 'rot', i: i, cx: r.left + s.x / 100 * r.width, cy: r.top + s.y / 100 * r.height };
    this.commitLive();
    this.live = Object.assign({}, s); this.liveI = i; this.liveEl = e.currentTarget && e.currentTarget.closest ? e.currentTarget.closest('.stk') : null;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
  },

  deskRect() { return this.deskEl ? this.deskEl.getBoundingClientRect() : null; },

  hashModel() {
    const s = this.state;
    const input = (s.hSalt ? s.hSalt + ':' : '') + (s.hText || '');
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) { h ^= input.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    let h2 = h ^ 0x5bd1e995;
    for (let i = input.length - 1; i >= 0; i--) { h2 ^= input.charCodeAt(i); h2 = Math.imul(h2, 0x01000193) >>> 0; }
    let x = (h || 1) >>> 0;
    const rnd = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
    const pal = HASH_PALETTE.slice();
    const bg = pal.splice(Math.floor(rnd() * pal.length), 1)[0];
    const tiles = [];
    for (let i = 0; i < 64; i++) {
      const shape = Math.floor(rnd() * 7);
      tiles.push({ cls: 'ht s' + shape, c: pal[Math.floor(rnd() * pal.length)], r: [0, 90, 180, 270][Math.floor(rnd() * 4)] });
    }
    const hex = ('00000000' + h.toString(16)).slice(-8) + ('00000000' + (h2 >>> 0).toString(16)).slice(-8);
    return { tiles: tiles, bg: bg, hex: hex };
  }
};
