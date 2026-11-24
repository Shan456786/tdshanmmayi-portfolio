import { CHAPTERS } from '../../data/navigation.js';
export const stageMethods = {
  mode() { return this.state.focus >= 0 ? this.state.focus : this.state.pose; },

  say(msg) {
    clearTimeout(this.tt);
    this.setState({ toast: msg });
    this.tt = setTimeout(() => this.setState({ toast: '' }), 3600);
  },

  kick() { if (!this.raf) this.raf = requestAnimationFrame(this.tickFn); },

  calm() { return this.reduced || !!(this.props.calm); },

  resetTilt() {
    const el = this.tiltEl;
    if (!el) return;
    el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.style.setProperty('--go', '0');
    this.tiltEl = null;
  },

  handleMove(e) {
    const m = this.m;
    m.x = e.clientX; m.y = e.clientY;
    if (this.tDrag) {
      const t = this.tDrag, now = performance.now();
      if (Math.abs(e.clientX - t.sx) > 4) t.moved = true;
      this.angle = t.sa + (e.clientX - t.sx) * 0.55;
      this.vel = (e.clientX - t.lx) * 0.55 / Math.max(1, (now - t.lt) / 16);
      t.lx = e.clientX; t.lt = now;
      this.kick();
      return;
    }
    const d = this.drag;
    if (d) {
      const live = this.liveFor(d.i);
      if (d.mode === 'move') {
        const now = performance.now(), dt = Math.max(1, (now - d.lt) / 16);
        d.vx = (e.clientX - d.lx) / d.w * 100 / dt; d.vy = (e.clientY - d.ly) / d.h * 100 / dt;
        d.lx = e.clientX; d.ly = e.clientY; d.lt = now;
        const x = Math.max(2, Math.min(98, d.ox + (e.clientX - d.sx) / d.w * 100));
        const y = Math.max(2, Math.min(98, d.oy + (e.clientY - d.sy) / d.h * 100));
        live.x = Math.round(x * 10) / 10; live.y = Math.round(y * 10) / 10;
      } else {
        live.r = Math.round(Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180 / Math.PI + 90);
      }
      this.paintLiveSoon();
      return;
    }
    if (e.pointerType === 'mouse') {
      const tEl = e.target && e.target.closest ? e.target.closest('[data-tilt]') : null;
      if (tEl !== this.tiltEl) { this.resetTilt(); this.tiltEl = tEl; }
      if (tEl && !this.calm()) {
        const r = tEl.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        tEl.style.setProperty('--rx', (-py * 9).toFixed(2) + 'deg');
        tEl.style.setProperty('--ry', (px * 11).toFixed(2) + 'deg');
        tEl.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
        tEl.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
        tEl.style.setProperty('--go', '1');
      }
      if (this.nameEl && !this.calm()) this.nameMove(e);
      if (!this.calm()) {
        /* only the open room reacts to the pointer, so closed rooms cost no layout reads */
        [this.state.room === 1 ? this.studioEl : null, this.state.room === 2 ? this.bsEl : null].forEach((el) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (!r.width || e.clientY < r.top || e.clientY > r.bottom) return;
          el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
          el.style.setProperty('--my', (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
        });
      }
      if (this.sheenEl) this.mirrorMove(e);
      const W = window.innerWidth || 1, H = window.innerHeight || 1;
      m.tnx = m.x / W - 0.5; m.tny = Math.min(m.y, H) / H - 0.5;
      this.kick();
    }
    const t = e.target && e.target.closest ? e.target.closest('[data-cur]') : null;
    this.setCurLabel(t ? t.getAttribute('data-cur') : '');
  },

  handleUp() {
    if (this.tDrag) {
      const t = this.tDrag;
      this.tDrag = null;
      if (!t.moved) { this.nextPose(1); return; }
      const proj = this.angle + this.vel * 8;
      let steps = Math.round((t.sa - proj) / 120);
      if (steps === 0 && Math.abs(t.sa - proj) > 22) steps = t.sa > proj ? 1 : -1;
      const idx = (((this.mode() + steps) % 3) + 3) % 3;
      this.setState({ pose: idx, focus: -1 });
      this.kick();
      return;
    }
    const d = this.drag;
    this.drag = null;
    if (d && d.mode === 'move' && !this.calm()) {
      const sp = Math.hypot(d.vx, d.vy);
      if (sp > 0.25 && performance.now() - d.lt < 80) {
        const k = Math.min(1, 3 / sp);
        this.glide = { i: d.i, vx: d.vx * k, vy: d.vy * k };
        this.kick();
      }
    }
    if (!this.glide) this.commitLive();
    else if (this.state.dragI !== -1) this.setState({ dragI: -1 });
  },

  /* ---- high-frequency visuals: written straight to the element, never through a full redraw ---- */
  paintNav() {
    /* the chapter pill updates in place while scrolling, without redrawing the page */
    const nv = document.querySelector('.nv');
    if (!nv) return;
    const i = this.chapNow || 0, c = CHAPTERS[i] || CHAPTERS[0];
    for (let k = 0; k < CHAPTERS.length; k++) nv.classList.toggle('c' + k, k === i);
    const n = nv.querySelector('.nv-n'), t = nv.querySelector('.nv-t');
    if (n) n.textContent = (i < 10 ? '0' : '') + i;
    if (t) t.textContent = c.t;
    nv.querySelectorAll('.nv-dots i').forEach((d, k) => d.classList.toggle('on', k === i));
  },

  /* backstage mirror: the sheen follows the pointer across the glass only, at most once per frame */
  mirrorMove(e) {
    if (this.state.room !== 2 || this.state.stageOn || this.worldsOff || this.calm()) { this.mirrorReset(); return; }
    this.mPt = { x: e.clientX, y: e.clientY };
    if (this.mRaf) return;
    this.mRaf = requestAnimationFrame(() => {
      this.mRaf = 0;
      const sh = this.sheenEl, g = sh && sh.parentElement, pt = this.mPt;
      if (!g || !pt) return;
      const r = g.getBoundingClientRect();
      if (!r.width || pt.x < r.left || pt.x > r.right || pt.y < r.top || pt.y > r.bottom) { this.mirrorReset(); return; }
      sh.style.setProperty('--sd', '.2s');
      sh.style.setProperty('--sx', ((pt.x - r.left) / r.width - 0.5).toFixed(3));
      sh.style.setProperty('--sy', ((pt.y - r.top) / r.height - 0.5).toFixed(3));
      this.mOn = true;
    });
  },

  mirrorReset() {
    if (this.mRaf) { cancelAnimationFrame(this.mRaf); this.mRaf = 0; }
    if (!this.mOn) return;
    this.mOn = false;
    const sh = this.sheenEl;
    if (!sh) return;
    sh.style.setProperty('--sd', '.7s');
    sh.style.setProperty('--sx', '0');
    sh.style.setProperty('--sy', '0');
  },

  setCurLabel(lab) {
    if (lab === this.curLab) return;
    this.curLab = lab;
    const inn = this.cursorEl && this.cursorEl.firstElementChild;
    if (!inn) return;
    if (inn.firstElementChild) inn.firstElementChild.textContent = lab;
    inn.classList.toggle('on', !!lab);
  },

  liveFor(i) {
    if (!this.live || this.liveI !== i) { this.live = Object.assign({}, this.state.st[i]); this.liveI = i; this.liveEl = null; }
    return this.live;
  },

  paintLive() {
    const s = this.live;
    if (!s) return;
    let el = this.liveEl;
    if (!el || !el.isConnected) { el = this.deskEl ? this.deskEl.querySelectorAll('.stk')[this.liveI] : null; this.liveEl = el; }
    if (!el) return;
    el.style.left = s.x + '%';
    el.style.top = s.y + '%';
    el.style.transform = 'translate(-50%, -50%) rotate(' + (Math.round(s.r * 10) / 10) + 'deg)';
  },

  paintLiveSoon() {
    if (this.liveRaf) return;
    this.liveRaf = requestAnimationFrame(() => { this.liveRaf = 0; this.paintLive(); });
  },

  commitLive() {
    if (!this.live) return;
    const st = this.state.st.slice(), i = this.liveI;
    st[i] = Object.assign({}, st[i], { x: this.live.x, y: this.live.y, r: this.live.r });
    this.live = null; this.liveEl = null;
    this.setState({ st: st, dragI: -1 });
  },

  revealWorlds() {
    const el = this.uvEl;
    if (!el || !el.getBoundingClientRect) return;
    const r = el.getBoundingClientRect(), vh = window.innerHeight || 800;
    if (r.top < -r.height / 2 || r.top > vh * 0.5) {
      el.scrollIntoView({ behavior: this.calm() ? 'auto' : 'smooth', block: 'start' });
      this.settleWorlds(el);
    }
  },

  // Standalone addition. A deep link such as #/studio scrolls to the worlds section shortly after load, while web fonts are
  // still arriving and the page height is still changing, so the landing spot could be a few pixels off. Once fonts have
  // loaded, align once more. Skipped if the visitor has scrolled, touched or pressed a key in the meantime.
  settleWorlds(el) {
    if (!document.fonts || document.fonts.status === 'loaded') return;
    let moved = false;
    const stop = () => { moved = true; };
    const evs = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    evs.forEach((e) => window.addEventListener(e, stop, { passive: true, once: true }));
    document.fonts.ready.then(() => this.later(() => {
      evs.forEach((e) => window.removeEventListener(e, stop));
      if (moved || !el.isConnected || this.state.room < 0) return;
      if (Math.abs(el.getBoundingClientRect().top) > 1) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    }, 120));
  }
};
