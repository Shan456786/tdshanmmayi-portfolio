import { LAB } from '../../data/lab.js';
// The learning lab. Runs once from the Component constructor with `this` set to the component.
export function installLearningLab() {
  /* lab */
  this.labPick = {};
  LAB.learning.forEach((x, i) => { this.labPick['l' + i] = () => this.setState({ labSel: 'l' + i }); });
  LAB.curious.forEach((x, i) => { this.labPick['c' + i] = () => this.setState({ labSel: 'c' + i }); });
  this.labKey = {};
  LAB.learning.forEach((x, i) => { this.labKey['l' + i] = (e) => this.tabKey(e, LAB.learning.length, i, (n) => this.labPick['l' + n](), 'lab-l'); });
  LAB.curious.forEach((x, i) => { this.labKey['c' + i] = (e) => this.tabKey(e, LAB.curious.length, i, (n) => this.labPick['c' + n](), 'lab-c'); });
  this.calToggle = () => this.setState({ cal3d: !this.state.cal3d });
}
