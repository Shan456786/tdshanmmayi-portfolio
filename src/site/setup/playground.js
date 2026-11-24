import { POSTER_STYLES, STICKERS0, THEMES } from '../../data/playground.js';
// Playground: poster, type lab, collage desk, hash. Runs once from the Component constructor with `this` set to the component.
export function installPlayground() {
  /* playground */
  this.pgPick = [0, 1, 2, 3].map((i) => () => this.setState({ pg: i, sel: -1 }));
  this.pgKey = [0, 1, 2, 3].map((i) => (e) => this.tabKey(e, 4, i, (n) => this.pgPick[n](), 'pg-tab-'));
  this.setPosterText = (e) => this.setState({ pText: e.target.value });
  this.posterShuffle = () => {
      const s = this.state;
      let st = s.pStyle, th = s.pTheme;
      while (st === s.pStyle) st = Math.floor(Math.random() * POSTER_STYLES.length);
      while (th === s.pTheme) th = Math.floor(Math.random() * THEMES.length);
      this.setState({ pStyle: st, pTheme: th, pNo: s.pNo + 1 });
    };
  this.setLabText = (e) => this.setState({ lText: e.target.value });
  this.setLabSize = (e) => this.setState({ lSize: Number(e.target.value) });
  this.setLabWeight = (e) => this.setState({ lWeight: Number(e.target.value) });
  this.setLabTrack = (e) => this.setState({ lTrack: Number(e.target.value) / 100 });
  this.deskBg = () => { if (this.state.sel !== -1) this.setState({ sel: -1 }); };
  this.rotBy = (d) => {
      const i = this.state.sel;
      if (i < 0) { this.say('Tap a piece first, then rotate it.'); return; }
      const st = this.state.st.slice();
      st[i] = Object.assign({}, st[i], { r: st[i].r + d });
      this.setState({ st });
    };
  this.rotL = () => this.rotBy(-15);
  this.rotR = () => this.rotBy(15);
  this.deskShuffle = () => {
      const rnd = (a, b) => a + Math.random() * (b - a);
      this.glide = null;
      const st = this.state.st.map((s) => Object.assign({}, s, { x: Math.round(rnd(12, 88)), y: Math.round(rnd(15, 85)), r: Math.round(rnd(-25, 25)) }));
      this.setState({ st, sel: -1 });
    };
  this.deskReset = () => { this.glide = null; this.setState({ st: STICKERS0.map((s, i) => Object.assign({ z: i + 1 }, s)), sel: -1 }); };
  this.setHashText = (e) => this.setState({ hText: e.target.value });
  this.hashSalt = () => this.setState({ hSalt: this.makePassword(4).replace(/[^A-Za-z0-9]/g, 'x').toLowerCase() });
  this.hashUnsalt = () => this.setState({ hSalt: '' });
}
