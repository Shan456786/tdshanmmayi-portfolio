export const focusMethods = {
  later(fn, ms) { setTimeout(fn, ms === undefined ? 30 : ms); },

  focusable(el) {
    return !!(el && el.isConnected && el.getClientRects().length && !(el.closest && el.closest('[inert]')) && getComputedStyle(el).visibility !== 'hidden');
  },

  tabbables(box) {
    return Array.from(box.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')).filter((el) => this.focusable(el));
  },

  trapKey(e, sel, close) {
    if (e.key === 'Escape') { e.preventDefault(); if (e.stopPropagation) e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const box = document.querySelector(sel);
    if (!box) return;
    const f = this.tabbables(box);
    if (!f.length) { e.preventDefault(); box.focus(); return; }
    const first = f[0], last = f[f.length - 1], act = document.activeElement;
    if (e.shiftKey && (act === first || act === box || !box.contains(act))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (act === last || !box.contains(act))) { e.preventDefault(); first.focus(); }
  },

  tabKey(e, count, cur, pick, prefix) {
    const k = e.key;
    let n = -1;
    if (k === 'ArrowRight' || k === 'ArrowDown') n = (cur + 1) % count;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') n = (cur + count - 1) % count;
    else if (k === 'Home') n = 0;
    else if (k === 'End') n = count - 1;
    if (n < 0) return;
    e.preventDefault();
    pick(n);
    this.later(() => { const t = document.getElementById(prefix + n); if (t) t.focus(); }, 0);
  },

  restore(el, sel, idx) {
    if (this.focusable(el)) { el.focus({ preventScroll: true }); return; }
    let t = null;
    if (sel) t = document.querySelectorAll(sel)[idx || 0];
    else if (idx >= 0) t = [document.querySelector('.door.d' + idx), document.querySelector('.hm.d' + idx)].find((x) => this.focusable(x));
    if (this.focusable(t)) t.focus({ preventScroll: true });
  }
};
