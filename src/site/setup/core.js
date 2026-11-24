// Refs, pointer handlers and the magnetic hover. Runs once from the Component constructor with `this` set to the component.
export function installCore() {
  this.m = { x: -400, y: -400, cx: -400, cy: -400, nx: 0, ny: 0 };
  this.rig = { x: 0, y: 0 };
  this.angle = 38;
  this.vel = 0;
  this.drag = null;
  this.tDrag = null;
  this.glide = null;
  this.raf = 0;
  this.shades = [null, null, null];
  this.tickFn = () => this.tick();
  this.setCursor = (el) => { this.cursorEl = el; };
  this.setScene = (el) => { this.sceneEl = el; };
  this.setRig = (el) => { this.rigEl = el; };
  this.setTotem = (el) => { this.totemEl = el; };
  this.setShade0 = (el) => { this.shades[0] = el; };
  this.setShade1 = (el) => { this.shades[1] = el; };
  this.setShade2 = (el) => { this.shades[2] = el; };
  this.setDesk = (el) => { this.deskEl = el; };
  this.setRoot = (el) => { this.rootEl = el; };
  this.setBar = (el) => { this.barEl = el; };
  this.setNameEl = (el) => { this.nameEl = el; };
  this.setUv = (el) => { this.uvEl = el; };
  this.setStudio = (el) => { this.studioEl = el; };
  this.setPad = (el) => { this.padEl = el; };
  this.setStage = (el) => { this.bsEl = el; };
  this.setSheen = (el) => { this.sheenEl = el; };
  this.onPMove = (e) => this.handleMove(e);
  this.onPUp = (e) => this.handleUp(e);
  this.onPLeave = () => { this.resetTilt(); this.resetName(); this.mirrorReset(); };
  this.mag = (e) => {
      const el = e.currentTarget;
      if (!el || !el.getBoundingClientRect) return;
      const r = el.getBoundingClientRect();
      el.style.transform = 'translate(' + ((e.clientX - (r.left + r.width / 2)) * 0.28).toFixed(1) + 'px,' + ((e.clientY - (r.top + r.height / 2)) * 0.38).toFixed(1) + 'px)';
    };
  this.magOut = (e) => { if (e.currentTarget) e.currentTarget.style.transform = ''; };
}
