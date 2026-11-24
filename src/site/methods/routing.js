import { ROOM_SLUGS, projSlug } from '../../data/navigation.js';
import { PROJECTS } from '../../data/projects/index.js';
export const routingMethods = {
  /* ---- navigation, history and focus ---- */
  parseRoute(hash) {
    const h = String(hash || '');
    if (h === '' || h === '#' || h === '#/' || h === '#/hall') return { room: -1, ds: -1, arc: false };
    if (h.indexOf('#/') !== 0) return null;
    let parts;
    try { parts = h.slice(2).split('/').map((x) => decodeURIComponent(x)); } catch (err) { return null; }
    const r = ROOM_SLUGS.indexOf(parts[0]);
    if (r >= 0 && parts.length === 1) return { room: r, ds: -1, arc: false };
    if (parts[0] === 'work' && (parts.length === 1 || (parts.length === 2 && parts[1] === ''))) return { ds: -1, arc: true, arcAt: -1 };
    if (parts[0] === 'work' && parts.length === 2) {
      const i = PROJECTS.findIndex((p) => projSlug(p) === parts[1]);
      if (i >= 0) return PROJECTS[i].cs ? { ds: i } : { ds: -1, arc: true, arcAt: i };
    }
    return null;
  },

  routeFor(st) {
    if (st.ds >= 0 && PROJECTS[st.ds] && PROJECTS[st.ds].cs) return '#/work/' + projSlug(PROJECTS[st.ds]);
    if (st.arc) return '#/work';
    if (st.room >= 0) return '#/' + ROOM_SLUGS[st.room];
    return '';
  },

  setUrl(hash, mode) {
    try {
      const cur = location.hash || '';
      if (cur === hash) return false;
      if (!hash && this.parseRoute(cur) === null) return false;
      const url = location.href.split('#')[0] + hash;
      if (mode === 'replace') history.replaceState({ dc: 1, prev: (history.state && history.state.prev) || '' }, '', url);
      else history.pushState({ dc: 1, prev: cur }, '', url);
      return mode !== 'replace';
    } catch (err) {
      try { if (mode !== 'replace' && hash) { location.hash = hash.slice(1); return true; } } catch (e2) {}
      return false;
    }
  },

  navState(partial, mode) {
    const pushed = this.setUrl(this.routeFor(Object.assign({}, this.state, partial)), mode);
    this.setState(partial);
    return pushed;
  }
};
