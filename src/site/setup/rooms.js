import { PROFILE } from '../../data/profile.js';
import { CHIPS } from '../../data/lab.js';
import { PENCILS } from '../../data/playground.js';
// The three interactive worlds: lab, studio, backstage. Runs once from the Component constructor with `this` set to the component.
export function installRooms() {
  /* profile */
  this.mapOn = PROFILE.nodes.map((n, i) => () => { if (this.state.mapOn !== i) this.setState({ mapOn: i }); });
  this.mapOff = () => { if (this.state.mapOn !== -1) this.setState({ mapOn: -1 }); };
  /* three worlds */
  const DOORS = [['18%', '55%'], ['50%', '50%'], ['82%', '55%']];
  this.enter = [0, 1, 2].map((i) => (e) => {
      let ox = DOORS[i][0], oy = DOORS[i][1];
      const r = this.uvEl && this.uvEl.getBoundingClientRect ? this.uvEl.getBoundingClientRect() : null;
      if (r && e && e.clientX && e.detail !== 0 && e.clientY >= r.top && e.clientY <= r.bottom) {
        ox = ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%';
        oy = ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%';
      }
      this.roomTrigger = e && e.currentTarget;
      this.navState({ room: i, ox: ox, oy: oy, stageOn: false }, 'push');
    });
  this.toHall = () => { if (this.state.room !== -1) this.navState({ room: -1, stageOn: false }, 'push'); };
  this.powerToggle = () => this.setState({ power: !this.state.power });
  this.explodeToggle = () => this.setState({ explode: !this.state.explode });
  this.chipPick = CHIPS.map((c, i) => () => { if (this.state.chip !== i) this.setState({ chip: i, hexRow: -1 }); });
  this.hexOn = [];
  for (let i = 0; i < 12; i++) this.hexOn.push(() => { if (this.state.hexRow !== i) this.setState({ hexRow: i, chip: -1 }); });
  this.pencilPick = PENCILS.map((p, i) => () => this.setState({ pencil: i }));
  this.mirrorToggle = () => this.setState({ mirror: !this.state.mirror });
  this.padClear = () => { this.clearPad(); if (this.state.drew) this.setState({ drew: false }); };
  this.padDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      this.sizePad();
      const p = this.padPoint(e);
      if (!p) return;
      this.pen = p;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
      this.dot(p);
      if (!this.state.drew) this.setState({ drew: true });
    };
  this.padMove = (e) => {
      if (!this.pen) return;
      const p = this.padPoint(e);
      if (!p) return;
      this.stroke(this.pen, p);
      this.pen = p;
    };
  this.padUp = () => { this.pen = null; };
  this.lightsToggle = () => this.setState({ lights: !this.state.lights });
  this.passFlip = () => this.setState({ passFlip: !this.state.passFlip });
  this.stageGo = () => this.setState({ stageOn: true });
  this.stageBack = () => this.setState({ stageOn: false });
  this.countIn = () => {
      clearInterval(this.cT); clearTimeout(this.cT2);
      if (this.calm()) { this.setState({ count: 8 }); this.cT2 = setTimeout(() => this.setState({ count: 0 }), 1600); return; }
      let n = 0;
      this.cT = setInterval(() => {
        n++;
        this.setState({ count: n });
        if (n >= 8) { clearInterval(this.cT); this.cT2 = setTimeout(() => this.setState({ count: 0 }), 1400); }
      }, 430);
    };
}
