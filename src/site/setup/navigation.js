import { CHAPTERS } from '../../data/navigation.js';
// Chapter navigation, contents menu, skip link and URL changes. Runs once from the Component constructor with `this` set to the component.
export function installNavigation() {
  /* navigation */
  this.goTo = (id) => {
      const el = document.getElementById(id);
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: this.calm() ? 'auto' : 'smooth', block: 'start' });
    };
  this.navPrev = () => this.goTo(CHAPTERS[Math.max(0, (this.chapNow || 0) - 1)].id);
  this.navNext = () => this.goTo(CHAPTERS[Math.min(CHAPTERS.length - 1, (this.chapNow || 0) + 1)].id);
  this.menuOpen = (e) => { this.menuTrigger = e && e.currentTarget; this.setState({ menu: true }); };
  this.menuClose = () => this.setState({ menu: false });
  this.chGo = CHAPTERS.map((c) => (e) => { if (e && e.preventDefault) e.preventDefault(); this.focusAfterMenu = c.id; this.setState({ menu: false }); setTimeout(() => this.goTo(c.id), 40); });
  /* keyboard: Escape and Tab are handled on each overlay, not globally */
  this.menuKey = (e) => this.trapKey(e, '.mn', () => this.setState({ menu: false }));
  this.dsKey = (e) => this.trapKey(e, '.ds', () => this.dsClose());
  this.roomKey = (e) => {
      if (e.key !== 'Escape') return;
      if (this.state.stageOn) { e.preventDefault(); this.setState({ stageOn: false }); return; }
      if (this.state.room >= 0) { e.preventDefault(); this.roomTrigger = this.roomTrigger || null; this.navState({ room: -1, stageOn: false }, 'push'); }
    };
  this.skipGo = (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const m = document.getElementById('main');
      if (m) { m.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'auto' }); }
    };
  /* browser history: #/lab, #/studio, #/backstage, #/work/<project> */
  this.onRoute = () => {
      const r = this.parseRoute(location.hash);
      if (!r) return;
      const st = {};
      if (r.room !== undefined && r.room !== this.state.room) { st.room = r.room; st.stageOn = false; }
      if (r.ds !== undefined && r.ds !== this.state.ds) { st.ds = r.ds; if (r.ds >= 0) st.proj = r.ds; }
      if (r.arc !== undefined && r.arc !== this.state.arc) st.arc = r.arc;
      if (r.arcAt !== undefined && r.arcAt !== this.state.arcAt) st.arcAt = r.arcAt;
      if (this.state.menu) st.menu = false;
      if (Object.keys(st).length) { this.fromHistory = true; this.setState(st); }
    };
}
