import { STICKERS0 } from '../data/playground.js';
// The component's starting state.
export function initialState() {
  return {
        pose: 0, focus: -1, cur: '', xerox: false, party: false, hi: 0, toast: '',
        menu: false, chap: 0, mapOn: -1,
        room: -1, ox: '50%', oy: '50%', power: false, explode: false, chip: -1, hexRow: -1,
        pencil: 0, mirror: false, drew: false, lights: false, count: 0, passFlip: false, stageOn: false,
        proj: 0, ds: -1, pw: '',
        arc: false, arcAt: -1, fbStop: 0, fbIn: { d: 3.5, r: 8, m: 90, meals: 40, cap: 120, st: 'refrigerated', fr: true, fz: false, v: true },
        scNode: 2, scLine: '', scPickI: 0, scOk: 1, scBad: 0, scLast: null, ceCase: 1, pwLen: '16', pwRes: null, pwErr: '', pwSoft: false, pwCopied: '',
        labSel: 'l0',
        lcData: null, lcStatus: '', lcTick: 0, cal3d: false,
        pg: 0, flip: false,
        pText: 'Engineer by curiosity', pStyle: 2, pTheme: 0, pNo: 1,
        lText: 'curiosity', lFont: 0, lSize: 150, lWeight: 800, lTrack: 0, lPair: 0, lFx: { ext: false, mis: true, out: false, wave: false, jit: false },
        st: STICKERS0.map((s, i) => Object.assign({ z: i + 1 }, s)), sel: -1, zTop: STICKERS0.length + 1, dragI: -1,
        hText: 'tdshanmmayi', hSalt: 'a7f3',
        copied: false
      };
}
