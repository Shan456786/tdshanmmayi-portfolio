// Opening hall: poses, totem, easter egg. Runs once from the Component constructor with `this` set to the component.
export function installHall() {
  /* hero (unchanged) */
  this.wEnter = [0, 1, 2].map((i) => () => { if (this.state.focus !== i) this.setState({ focus: i }); });
  this.wLeave = () => this.setState({ focus: -1 });
  this.wClick = [0, 1, 2].map((i) => () => this.setState({ pose: i, focus: i }));
  this.nextPose = (d) => this.setState({ pose: (this.mode() + (d || 1) + 3) % 3, focus: -1 });
  this.totemDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      this.tDrag = { sx: e.clientX, sa: this.angle, lx: e.clientX, lt: performance.now(), moved: false };
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
      this.kick();
    };
  this.totemClick = (e) => { if (e && e.detail === 0) this.nextPose(1); };
  this.totemKey = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); this.nextPose(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.nextPose(-1); }
    };
  this.hiClick = () => {
      const n = this.state.hi + 1;
      if (n >= 5) {
        this.setState({ hi: 0, party: true });
        this.say('Secret 1 of 2: party mode. You stamped hello five times.');
        clearTimeout(this.pt);
        this.pt = setTimeout(() => this.setState({ party: false }), 4200);
      } else {
        this.setState({ hi: n });
        if (n === 3) this.say('hello! (keep going...)');
      }
    };
  this.toggleXerox = () => {
      const on = !this.state.xerox;
      this.setState({ xerox: on });
      this.say(on ? 'Secret 2 of 2: photocopy mode. Click the name again to bring the colour back.' : 'Colour restored.');
    };
}
