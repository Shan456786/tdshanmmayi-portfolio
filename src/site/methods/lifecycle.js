import { CHAPTERS } from '../../data/navigation.js';
import { LEETCODE } from '../../data/leetcode.js';
export const lifecycleMethods = {
  componentDidMount() {
    try { this.mq = window.matchMedia('(prefers-reduced-motion: reduce)'); this.reduced = this.mq.matches; } catch (err) { this.reduced = false; }
    this.kick();
    this.setState({ pw: this.makePassword(16) });
    try {
      this.onMq = (e) => { this.reduced = !!(e && e.matches); this.setState({ rmTick: Date.now() }); };
      if (this.mq && this.mq.addEventListener) this.mq.addEventListener('change', this.onMq);
      else if (this.mq && this.mq.addListener) this.mq.addListener(this.onMq);
    } catch (err) {}
    try { window.addEventListener('popstate', this.onRoute); window.addEventListener('hashchange', this.onRoute); } catch (err) {}
    try {
      if ('IntersectionObserver' in window) {
        /* no redraw: the observer writes one inherited custom property straight onto the section */
        this.visIO = new IntersectionObserver((ents) => {
          ents.forEach((en) => {
            const off = !en.isIntersecting;
            en.target.style.setProperty('--ps', off ? 'paused' : 'running');
            if (en.target.getAttribute('data-vis') === 'hero') { const was = this.heroOff; this.heroOff = off; if (was && !off) this.kick(); }
            if (en.target.getAttribute('data-vis') === 'worlds') { this.worldsOff = off; if (off) this.mirrorReset(); }
          });
        }, { rootMargin: '300px 0px 300px 0px' });
        document.querySelectorAll('[data-vis]').forEach((el) => this.visIO.observe(el));
      }
    } catch (err) {}
    try {
      const r0 = this.parseRoute(location.hash);
      if (r0 && (r0.room >= 0 || r0.ds >= 0 || r0.arc)) {
        const st = {};
        if (r0.room !== undefined) st.room = r0.room;
        if (r0.ds !== undefined) { st.ds = r0.ds; if (r0.ds >= 0) st.proj = r0.ds; }
        if (r0.arc) { st.arc = true; st.arcAt = r0.arcAt; if (r0.arcAt >= 0) st.proj = r0.arcAt; }
        this.fromHistory = true;
        this.setState(st);
      }
    } catch (err) {}
    this.onScroll = () => {
      if (this.sRaf) return;
      this.sRaf = requestAnimationFrame(() => {
        this.sRaf = 0;
        const de = document.documentElement;
        const max = Math.max(1, (de.scrollHeight || 1) - (window.innerHeight || 1));
        if (this.barEl) this.barEl.style.width = Math.min(100, Math.max(0, (window.scrollY || de.scrollTop || 0) / max * 100)).toFixed(1) + '%';
      });
    };
    try { window.addEventListener('scroll', this.onScroll, { passive: true }); this.onScroll(); } catch (err) {}
    try {
      if ('IntersectionObserver' in window) {
        this.io = new IntersectionObserver((ents) => {
          ents.forEach((en) => {
            if (!en.isIntersecting) return;
            const id = en.target.id;
            const i = CHAPTERS.findIndex((c) => c.id === id);
            if (i >= 0 && i !== (this.chapNow || 0)) { this.chapNow = i; this.paintNav(); }
          });
        }, { rootMargin: '-45% 0px -50% 0px' });
        CHAPTERS.forEach((c) => { const el = document.getElementById(c.id); if (el) this.io.observe(el); });
      }
    } catch (err) {}
    if (LEETCODE.liveUrl) {
      this.lcLoad();
      this.lcTimer = setInterval(() => { this.lcLoad(); this.setState({ lcTick: Date.now() }); }, Math.max(5, LEETCODE.refreshMinutes || 30) * 60000);
    }
  },

  componentDidUpdate(prevProps, ps) {
    const s = this.state;
    if (!ps) return;
    const hist = this.fromHistory;
    this.fromHistory = false;
    if (s.menu && !ps.menu) this.later(() => { const m = document.querySelector('.mn'); const t = m && (m.querySelector('.mn-row.on') || m.querySelector('.mn-row')); if (t) t.focus(); else if (m) m.focus(); });
    if (!s.menu && ps.menu) {
      const id = this.focusAfterMenu;
      this.focusAfterMenu = null;
      this.later(() => { const sec = id && document.getElementById(id); if (sec) sec.focus({ preventScroll: true }); else this.restore(this.menuTrigger, '.nv-cur', 0); });
    }
    if (s.ds >= 0 && ps.ds < 0) this.later(() => { const h = document.getElementById('ds-h'); if (h) h.focus({ preventScroll: true }); });
    if (s.ds < 0 && ps.ds >= 0 && !s.arc) { const at = ps.ds; this.later(() => this.restore(this.dsTrigger, '.pj-row', at)); }
    if (s.ds >= 0 && ps.ds >= 0 && s.ds !== ps.ds) this.later(() => { const d = document.querySelector('.ds'); if (d) d.scrollTop = 0; }, 0);
    const axNow = !!s.arc && s.ds < 0, axWas = !!ps.arc && ps.ds < 0;
    if (axNow && !axWas) {
      const from = ps.ds, at = s.arcAt;
      this.later(() => {
        let t = null;
        if (from >= 0) t = document.getElementById('ax-go-' + from);
        else if (at >= 0) t = document.getElementById('ax-go-' + at) || document.getElementById('ax-i-' + at);
        if (!this.focusable(t)) t = document.getElementById('ax-h');
        if (t) t.focus({ preventScroll: from < 0 && !(at >= 0) });
      });
    }
    if (!axNow && axWas && s.ds < 0) this.later(() => { const a = document.activeElement; if (!a || a === document.body || !a.isConnected || (a.closest && a.closest('.ax'))) this.restore(this.arcTrigger, '.wk2-arc', 0); });
    if (s.room !== ps.room) {
      const was = ps.room, now = s.room;
      if (now >= 0) this.later(() => { if (hist) this.revealWorlds(); const h = document.getElementById('r' + now + '-h'); if (h && this.state.room === now) h.focus({ preventScroll: true }); }, 60);
      else this.later(() => {
        const a = document.activeElement;
        if (!a || a === document.body || (a.closest && a.closest('.room'))) this.restore(this.roomTrigger, null, was);
        if (hist) this.revealWorlds();
      });
    }
    if (s.room !== ps.room || s.stageOn !== ps.stageOn) this.mirrorReset();
    if (s.stageOn && !ps.stageOn) this.later(() => { const b = document.querySelector('.show .rm-btn'); if (b) b.focus({ preventScroll: true }); });
    if (!s.stageOn && ps.stageOn && s.room === 2) this.later(() => { const a = document.activeElement; if (!a || a === document.body || (a.closest && a.closest('.show'))) { const b = document.querySelector('.to-stage'); if (this.focusable(b)) b.focus({ preventScroll: true }); } });
  },

  componentWillUnmount() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = -1;
    clearTimeout(this.tt); clearTimeout(this.pt); clearTimeout(this.ct); clearTimeout(this.cT2);
    clearInterval(this.cT); clearInterval(this.lcTimer);
    try { window.removeEventListener('scroll', this.onScroll); window.removeEventListener('popstate', this.onRoute); window.removeEventListener('hashchange', this.onRoute); } catch (err) {}
    try { if (this.mq && this.mq.removeEventListener) this.mq.removeEventListener('change', this.onMq); else if (this.mq && this.mq.removeListener) this.mq.removeListener(this.onMq); } catch (err) {}
    if (this.io) this.io.disconnect();
    if (this.visIO) this.visIO.disconnect();
    if (this.liveRaf) cancelAnimationFrame(this.liveRaf);
    if (this.mRaf) cancelAnimationFrame(this.mRaf);
  },

  tick() {
    this.raf = 0;
    let busy = false;
    const m = this.m, calm = this.calm();
    m.cx += (m.x - m.cx) * 0.24; m.cy += (m.y - m.cy) * 0.24;
    if (Math.abs(m.x - m.cx) + Math.abs(m.y - m.cy) > 0.4) busy = true;
    if (this.cursorEl) this.cursorEl.style.transform = 'translate3d(' + m.cx.toFixed(1) + 'px,' + m.cy.toFixed(1) + 'px,0)';
    const heroOn = !this.heroOff;
    const tx = calm || m.tnx === undefined ? 0 : m.tnx * 18, ty = calm || m.tny === undefined ? 0 : -m.tny * 10;
    if (heroOn) {
    this.rig.x += (tx - this.rig.x) * 0.07; this.rig.y += (ty - this.rig.y) * 0.07;
    if (Math.abs(tx - this.rig.x) + Math.abs(ty - this.rig.y) > 0.02) busy = true;
    if (this.rigEl) this.rigEl.style.transform = 'rotateX(' + (this.rig.y - 11).toFixed(2) + 'deg) rotateY(' + this.rig.x.toFixed(2) + 'deg)';
    if (this.tDrag) busy = true;
    else {
      const want = -this.mode() * 120 + 38;
      const delta = ((((want - this.angle) % 360) + 540) % 360) - 180;
      if (calm) { this.angle += delta; this.vel = 0; }
      else {
        this.vel += delta * 0.055; this.vel *= 0.8; this.angle += this.vel;
        if (Math.abs(delta) > 0.05 || Math.abs(this.vel) > 0.02) busy = true;
      }
    }
    if (this.totemEl) this.totemEl.style.transform = 'rotateY(' + this.angle.toFixed(2) + 'deg)';
    for (let i = 0; i < 3; i++) {
      const el = this.shades[i];
      if (!el) continue;
      const a = (this.angle + i * 120 + this.rig.x) * Math.PI / 180;
      el.style.opacity = Math.max(0, Math.min(0.62, (1 - Math.cos(a)) * 0.3 + Math.sin(a) * 0.08)).toFixed(3);
    }
    }
    if (this.glide) {
      const g = this.glide, s = this.liveFor(g.i);
      let x = s.x + g.vx, y = s.y + g.vy;
      if (x < 3 || x > 97) { g.vx = -g.vx * 0.5; x = Math.max(3, Math.min(97, x)); }
      if (y < 3 || y > 97) { g.vy = -g.vy * 0.5; y = Math.max(3, Math.min(97, y)); }
      g.vx *= 0.9; g.vy *= 0.9;
      s.x = Math.round(x * 10) / 10; s.y = Math.round(y * 10) / 10; s.r = s.r + g.vx * 1.5;
      this.paintLive();
      if (Math.abs(g.vx) + Math.abs(g.vy) < 0.04) { this.glide = null; this.commitLive(); } else busy = true;
    }
    if (busy) this.kick();
  }
};
