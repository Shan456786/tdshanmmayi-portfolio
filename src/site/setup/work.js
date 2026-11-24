import { PROJECTS } from '../../data/projects/index.js';
// Work section, case studies and the project archive. Runs once from the Component constructor with `this` set to the component.
export function installWork() {
  /* work */
  this.pjHover = PROJECTS.map((p, i) => () => { if (this.state.proj !== i) this.setState({ proj: i }); });
  this.pjOpen = PROJECTS.map((p, i) => (e) => {
      if (!p.cs) { this.arcTrigger = e && e.currentTarget; this.navState({ arc: true, arcAt: i, ds: -1, proj: i }, 'push'); return; }
      this.dsTrigger = e && e.currentTarget; this.navState({ ds: i, proj: i, arc: false }, 'push');
    });
  this.dsClose = () => {
      if (this.state.ds < 0) return;
      /* if the previous history entry is exactly where closing should land, step back to it, so Back does not reopen the file */
      const target = this.routeFor(Object.assign({}, this.state, { ds: -1 }));
      let hs = null;
      try { hs = history.state; } catch (err) { hs = null; }
      if (hs && hs.dc && hs.prev === target) { this.setState({ ds: -1 }); try { history.back(); } catch (err) {} return; }
      this.navState({ ds: -1 }, 'replace');
    };
  this.pwGen = () => this.setState({ pw: this.makePassword(16) });
  /* case studies (#/work/<project>) and the archive (#/work) */
  this.cases = PROJECTS.map((p, i) => i).filter((i) => !!PROJECTS[i].cs);
  const caseStep = (d) => { const L = this.cases, k = Math.max(0, L.indexOf(this.state.ds)); return L[(k + d + L.length) % L.length]; };
  this.dsPrev = () => { const i = caseStep(-1); this.navState({ ds: i, proj: i }, 'replace'); };
  this.dsNext = () => { const i = caseStep(1); this.navState({ ds: i, proj: i }, 'replace'); };
  this.toArchive = () => {
      if (this.state.arc) { this.dsClose(); return; }
      this.arcTrigger = this.dsTrigger || null;
      this.navState({ ds: -1, arc: true, arcAt: -1 }, 'push');
    };
  this.arcOpen = (e) => { this.arcTrigger = e && e.currentTarget; this.navState({ arc: true, arcAt: -1, ds: -1 }, 'push'); };
  this.arcClose = () => {
      if (!this.state.arc) return;
      const target = this.routeFor(Object.assign({}, this.state, { arc: false, ds: -1 }));
      let hs = null;
      try { hs = history.state; } catch (err) { hs = null; }
      if (hs && hs.dc && hs.prev === target) { this.setState({ arc: false, ds: -1 }); try { history.back(); } catch (err) {} return; }
      this.navState({ arc: false, ds: -1 }, 'replace');
    };
  this.axKey = (e) => this.trapKey(e, '.ax', () => this.arcClose());
  this.axOpenCase = PROJECTS.map((p, i) => () => { this.navState({ ds: i, proj: i }, 'push'); });
  this.csGo = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => () => {
      const sec = document.getElementById('cs-' + k), h = document.getElementById('cs-' + k + '-h');
      const box = sec && sec.closest('.ds'), top = box && box.querySelector('.ds-top');
      if (box) box.scrollTo({ top: Math.max(0, sec.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - (top ? top.offsetHeight : 0) - 12), behavior: this.calm() ? 'auto' : 'smooth' });
      if (h) h.focus({ preventScroll: true });
    });
  /* FoodBridge */
  this.fbPick = [0, 1, 2, 3, 4, 5].map((i) => () => this.setState({ fbStop: i }));
  this.fbKey = [0, 1, 2, 3, 4, 5].map((i) => (e) => this.tabKey(e, 6, i, (n) => this.fbPick[n](), 'fb-stop-'));
  this.fbRgRef = (el) => {
      if (!el || el.__fb) return;
      el.__fb = true;
      const k = el.getAttribute('data-k');
      el.value = String(this.state.fbIn[k]);
      el.addEventListener('input', () => { const v = Number(el.value); if (!isFinite(v)) return; this.state.fbIn = Object.assign({}, this.state.fbIn, { [k]: v }); this.fbPaint(); });
      el.addEventListener('change', () => this.setState({ fbIn: Object.assign({}, this.state.fbIn) }));
    };
  this.fbStore = ['ambient', 'refrigerated', 'frozen'].map((v) => () => this.setState({ fbIn: Object.assign({}, this.state.fbIn, { st: v }) }));
  this.fbTog = ['v', 'fr', 'fz'].map((k) => () => this.setState({ fbIn: Object.assign({}, this.state.fbIn, { [k]: !this.state.fbIn[k] }) }));
  /* SmartCrutch+ */
  this.scPick = [0, 1, 2, 3, 4, 5].map((i) => () => this.setState({ scNode: i }));
  this.scKey = [0, 1, 2, 3, 4, 5].map((i) => (e) => this.tabKey(e, 6, i, (n) => this.scPick[n](), 'sc-node-'));
  this.scSample = (this.csOf('sc').samples || []).map((x, i) => () => this.scSend(x.line, i));
  this.scSetLine = (e) => this.setState({ scLine: e.target.value, scPickI: -1 });
  this.scSendNow = () => this.scSend(this.state.scLine, -1);
  this.scLineKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); this.scSendNow(); } };
  /* Campus Expert */
  this.cePick = [0, 1, 2, 3].map((i) => () => this.setState({ ceCase: i }));
  this.ceKey = [0, 1, 2, 3].map((i) => (e) => this.tabKey(e, 4, i, (n) => this.cePick[n](), 'ce-case-'));
  /* Password Generator (browser re-creation) */
  this.pwSetLen = (e) => this.setState({ pwLen: e.target.value });
  this.pwRunNow = () => {
      const r = this.pwRun(this.state.pwLen);
      this.setState({ pwRes: r.res || null, pwErr: r.err || '', pwSoft: !!r.soft, pwCopied: '' });
    };
  this.pwLenKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); this.pwRunNow(); } };
  this.pwCopy = () => {
      const r = this.state.pwRes;
      if (!r) return;
      const done = (ok) => this.setState({ pwCopied: ok ? 'Copied to the clipboard.' : 'Could not copy here. Select the characters and copy them yourself.' });
      try { navigator.clipboard.writeText(r.pass).then(() => done(true), () => done(false)); } catch (err) { done(false); }
    };
  { const s0 = (this.csOf('sc').samples || [])[0]; if (s0) { this.state.scLine = s0.line; const r0 = this.scParse(s0.line); if (r0.ok) this.state.scLast = r0.reading; } }
  try { this.state.pwRes = this.pwBuild(16); } catch (err) { this.state.pwRes = null; }
}
