import { FONTS, FX, HEX_TEXT, PAIRS, PENCILS, POSTER_STYLES, THEMES } from '../../data/playground.js';
import { CHARACTER, CONTACT, PROFILE } from '../../data/profile.js';
import { CHIPS, LAB } from '../../data/lab.js';
import { PROJECTS } from '../../data/projects/index.js';
import { CHAPTERS } from '../../data/navigation.js';
import { ASSETS } from '../../assets/index.js';
export const viewModelMethods = {
  renderVals() {
    const s = this.state;
    const pad = (n) => (n < 10 ? '0' : '') + n;
    const mode = this.mode();
    const modeNames = ['the engineer', 'the artist', 'the performer'];
    const calm = this.props.calm ?? false;
    const lc = this.lcModel();

    /* poster + type lab + desk (unchanged logic) */
    const ps = POSTER_STYLES[s.pStyle];
    const th = THEMES[s.pTheme];
    const words = (s.pText || ' ').trim().split(/\s+/);
    const len = Math.max(1, (s.pText || '').length);
    const longest = ps.id === 'ps-mixed' ? Math.max(1, (words[0] || '').length) : Math.max(1, ...words.map((w) => w.length));
    const pSize = Math.max(6, Math.min(34, 140 / Math.sqrt(len) * ps.k, 84 / (longest * ps.w))).toFixed(1);
    const f = FONTS[s.lFont];
    const pair = PAIRS[s.lPair];
    const lChars = Array.from(s.lText || ' ').map((ch, i) => ({ ch: ch === ' ' ? ' ' : ch, d: (i * 0.08).toFixed(2), r: s.lFx.jit ? ((i * 37) % 17) - 8 : 0 }));
    const lLen = Math.max(1, lChars.length);
    const shadows = [];
    if (s.lFx.mis) shadows.push('0.05em 0.035em 0 rgba(255,93,168,.8)', '-0.03em -0.02em 0 rgba(60,203,200,.8)');
    if (s.lFx.ext) { for (let k = 1; k <= 12; k++) shadows.push((k * 0.012).toFixed(3) + 'em ' + (k * 0.012).toFixed(3) + 'em 0 rgba(46,23,14,' + (0.9 - k * 0.03).toFixed(2) + ')'); }
    const fxOn = (id) => !!s.lFx[id];
    const stk = s.st.map((x0, i) => (x => ({
      x: x.x, y: x.y, w: x.w, r: Math.round(x.r * 10) / 10, z: x.z,
      cls: 'stk' + (s.sel === i ? ' sel' : '') + (s.dragI === i ? ' lift' : ''),
      isImg: x.k === 'img', src: x.src || '', isTxt: x.k !== 'img', text: x.text || '', tcls: 'tk-' + x.k, sel: s.sel === i,
      down: (e) => this.startDrag(e, i), rot: (e) => this.startRot(e, i)
    }))(this.live && this.liveI === i ? Object.assign({}, x0, this.live) : x0));
    const toolVals = {
      posterText: s.pText, setPosterText: this.setPosterText, posterShuffle: this.posterShuffle,
      posterStyles: POSTER_STYLES.map((o, i) => ({ label: o.label, on: i === s.pStyle ? 'true' : 'false', cls: 'opt' + (i === s.pStyle ? ' on' : ''), pick: () => this.setState({ pStyle: i }) })),
      posterThemes: THEMES.map((o, i) => ({ label: o.label, bg: o.bg, fg: o.ac, on: i === s.pTheme ? 'true' : 'false', cls: 'sw' + (i === s.pTheme ? ' on' : ''), pick: () => this.setState({ pTheme: i }) })),
      posterCls: 'poster tilt thick ' + ps.id, pBg: th.bg, pFg: th.fg, pAccent: th.ac, pSize: pSize,
      pA: words[0] || '', pB: words.slice(1).join(' '), posterNo: pad(s.pNo), posterStyleName: ps.label,
      stickers: stk, deskBg: this.deskBg, rotL: this.rotL, rotR: this.rotR, deskShuffle: this.deskShuffle, deskReset: this.deskReset,
      deskHint: s.sel >= 0 ? 'selected. drag the red dot to spin it, or fling it.' : 'pick something up. it all moves, and it slides if you throw it.',
      labText: s.lText, setLabText: this.setLabText, setLabSize: this.setLabSize, setLabWeight: this.setLabWeight, setLabTrack: this.setLabTrack,
      labCls: 'lab-stage' + (fxOn('wave') ? ' fx-wave' : '') + (fxOn('out') ? ' fx-out' : ''),
      lBg: pair.bg, lFg: pair.fg, lFont: f.ff, lFontName: f.label, lFontNo: pad(s.lFont + 1),
      lSize: s.lSize, lSizeCq: (Math.min(40, 150 / lLen) * f.k + 6).toFixed(1), lWeight: s.lWeight, lTrack: s.lTrack.toFixed(2), lTrackRaw: Math.round(s.lTrack * 100),
      lShadow: shadows.length ? shadows.join(', ') : 'none', labChars: lChars,
      labFonts: FONTS.map((o, i) => ({ label: o.label, on: i === s.lFont ? 'true' : 'false', cls: 'opt' + (i === s.lFont ? ' on' : ''), pick: () => this.setState({ lFont: i }) })),
      labPairs: PAIRS.map((o, i) => ({ label: o.label, bg: o.bg, fg: o.fg, on: i === s.lPair ? 'true' : 'false', cls: 'sw' + (i === s.lPair ? ' on' : ''), pick: () => this.setState({ lPair: i }) })),
      labFx: FX.map((o) => ({ label: o.label, on: fxOn(o.id) ? 'true' : 'false', cls: 'opt' + (fxOn(o.id) ? ' on' : ''), pick: () => this.setState({ lFx: Object.assign({}, this.state.lFx, { [o.id]: !this.state.lFx[o.id] }) }) })),
      pgPick0: this.pgPick[0], pgPick1: this.pgPick[1], pgPick2: this.pgPick[2]
    };

    /* profile */
    const nodes = PROFILE.nodes.map((n, i) => ({ t: n.t, x: n.x, y: n.y, href: n.href, cls: 'cn' + (s.mapOn === i ? ' on' : ''), on: this.mapOn[i] }));
    const trail = PROFILE.trail.map((t) => ({ when: t.when, what: t.what, note: t.note === 'Learning, building and practising problem solving' ? 'Learning, building and practising on LeetCode (longest streak ' + lc.maxStreak + ' days, ' + lc.factHuman + ')' : t.note, cls: 'trl' + (t.k ? ' ' + t.k : '') }));

    /* worlds */
    const room = s.room;
    const roomCls = (i) => 'room r' + i + (room === i ? ' on' : '');
    const chipOn = s.chip >= 0 ? CHIPS[s.chip] : null;
    const bytes = Array.from(HEX_TEXT).map((ch) => ch.charCodeAt(0));
    const hex = [];
    for (let i = 0; i < bytes.length; i += 8) {
      const row = bytes.slice(i, i + 8), k = i / 8;
      hex.push({ off: '0x' + ('000' + i.toString(16)).slice(-4), bytes: row.map((b) => ('0' + b.toString(16)).slice(-2)).join(' '), ascii: row.map((b) => String.fromCharCode(b)).join(''), cls: 'hx' + (s.hexRow === k ? ' on' : ''), on: this.hexOn[k], pressed: s.hexRow === k ? 'true' : 'false', aria: 'Decode row ' + (k + 1) + ' of 12' });
    }
    let rdK = 'BOARD 01 / ' + (s.power ? 'POWERED' : 'IDLE'), rdT = 'Pick a part', rdL = 'Every chip on the board is something real from my toolkit. The sheet below is my opening line, as raw bytes.';
    if (chipOn) { rdK = chipOn.k; rdT = chipOn.t; rdL = chipOn.line; }
    else if (s.hexRow >= 0 && hex[s.hexRow]) { rdK = 'OFFSET ' + hex[s.hexRow].off; rdT = '"' + hex[s.hexRow].ascii + '"'; rdL = 'Decoded from ' + hex[s.hexRow].bytes.split(' ').length + ' bytes of hexadecimal.'; }
    const bulbs = [];
    for (let i = 0; i < 6; i++) { bulbs.push({ x: 8 + i * 16.8, y: 0, d: (i * 0.05).toFixed(2) }); bulbs.push({ x: 8 + i * 16.8, y: 100, d: (0.3 + i * 0.05).toFixed(2) }); }
    [33, 66].forEach((y, i) => { bulbs.push({ x: 0, y: y, d: (0.6 + i * 0.05).toFixed(2) }); bulbs.push({ x: 100, y: y, d: (0.7 + i * 0.05).toFixed(2) }); });
    const MK = [[16, 34], [38, 22], [62, 32], [84, 20], [22, 74], [44, 62], [66, 76], [86, 62]];
    const marks = MK.map((p, i) => ({ x: p[0], y: p[1], n: i + 1, cls: 'mk' + (s.count >= i + 1 ? ' lit' : '') + (s.count === i + 1 ? ' now' : '') }));

    /* work */
    const crates = [];
    for (let i = 0; i < 9; i++) { const t = i / 8; crates.push({ x: (22 + 56 * t).toFixed(1), y: (56 - 34 * Math.sin(Math.PI * t)).toFixed(1), r: ((t - 0.5) * -34).toFixed(1), d: (i * 0.12).toFixed(2) }); }
    const calBlocks = [];
    const BL = { 2: 1, 3: 1, 9: 2, 10: 2, 11: 2, 15: 3, 19: 1, 23: 2, 24: 2, 30: 3, 31: 3 };
    for (let i = 0; i < 35; i++) calBlocks.push({ cls: 'sdc' + (BL[i] ? ' f' + BL[i] : '') });
    const pjs = PROJECTS.map((p, i) => ({ n: pad(i + 1), name: p.name, tcls: p.tcls, line: p.line, tags: p.tags, c: p.c, fg: p.fg, cls: 'pj' + (s.proj === i ? ' on' : ''), hover: this.pjHover[i], open: this.pjOpen[i], go: p.cs ? 'CASE STUDY' : 'ARCHIVE', aria: p.cs ? 'Open the case study for ' + p.name : 'Open the archive entry for ' + p.name }));
    let ds = null, fb = {}, sc = {}, ce = {}, pwv = {};
    const csP = s.ds >= 0 ? PROJECTS[s.ds] : null;
    if (csP && csP.cs) {
      const p = csP, c = p.cs, L = this.cases, k = Math.max(0, L.indexOf(s.ds));
      const prevP = PROJECTS[L[(k + L.length - 1) % L.length]], nextP = PROJECTS[L[(k + 1) % L.length]];
      const TOC = ['Overview', 'Problem', 'Role', 'Stack', 'Architecture', 'Implementation', 'Decisions', 'Limits', 'Code'];
      ds = {
        n: pad(k + 1), name: p.name, tcls: p.tcls + ' ds-t', kicker: c.kicker, wrap: 'ds ds-' + c.kind, c: p.c, fg: p.fg, cls: 'ds-in cs cs-' + c.kind,
        type: c.type, started: c.started, deck: c.deck, overview: c.overview, problem: c.problem, role: c.role,
        stack: c.stack.map((g) => ({ g: g.g, items: g.items.map((t) => ({ t: t })) })),
        decisions: c.decisions.map((x, i) => ({ n: pad(i + 1), d: x.d, t: x.t })), limits: c.limits.map((t) => ({ t: t })),
        repo: p.repo, hasRepo: !!p.repo, demo: p.demo, hasDemo: !!p.demo,
        shots: c.shots, hasShots: c.shots.length > 0,
        visNote: c.shots.length ? 'Screenshots are marked as screenshots. Everything else on this page is a diagram drawn from the code, or a browser re-creation.' : 'Every visual on this page is a diagram drawn from the code, or a browser re-creation, and is labelled that way. The repository has no screenshots, so none are shown.',
        sources: c.sources.map((t) => ({ t: t })), srcRepo: p.repo.replace(/^https?:\/\//, ''),
        isFb: c.kind === 'fb', isSc: c.kind === 'sc', isCe: c.kind === 'ce', isPw: c.kind === 'pw',
        prevAria: 'Previous case study: ' + prevP.name, nextAria: 'Next case study: ' + nextP.name, nextName: nextP.name,
        toc: TOC.map((t, i) => ({ n: pad(i + 1), t: t, go: this.csGo[i] }))
      };
      if (c.kind === 'fb') {
        const f = s.fbIn, cur = c.route[s.fbStop] || c.route[0];
        fb = Object.assign(this.fbView(f), {
          at: s.fbStop, tabId: 'fb-stop-' + s.fbStop, cur: Object.assign({ n: pad(s.fbStop + 1) }, cur),
          stops: c.route.map((x, i) => ({ n: pad(i + 1), t: x.t, id: 'fb-stop-' + i, cls: 'fb-st' + (i === s.fbStop ? ' on' : i < s.fbStop ? ' done' : ''), on: i === s.fbStop ? 'true' : 'false', ti: i === s.fbStop ? '0' : '-1', pick: this.fbPick[i], key: this.fbKey[i] })),
          security: c.security, handover: c.handover.map((t) => ({ t: t })), impl: c.impl.map((t) => ({ t: t })),
          rgRef: this.fbRgRef,
          stores: [['ambient', 'Ambient'], ['refrigerated', 'Refrigerated'], ['frozen', 'Frozen']].map((x, i) => ({ t: x[1], cls: 'fb-tg', on: f.st === x[0] ? 'true' : 'false', pick: this.fbStore[i] })),
          togs: [['v', 'Verified'], ['fr', 'Has a fridge'], ['fz', 'Has a freezer']].map((x, i) => ({ t: x[1], cls: 'fb-tg', on: f[x[0]] ? 'true' : 'false', pick: this.fbTog[i] }))
        });
      }
      if (c.kind === 'sc') {
        const cur = c.chain[s.scNode] || c.chain[0], r = this.scParse(s.scLine), last = s.scLast || { g: 0, a: 0, unsafe: false };
        const kg = last.g / 1000, zone = kg > 0.8 ? 'over' : kg >= 0.68 ? 'caution' : 'safe', tilt = Math.abs(last.a) > 20;
        sc = {
          notice: c.notice, bom: c.bom, statuses: c.statuses, impl: c.impl.map((t) => ({ t: t })),
          tabId: 'sc-node-' + s.scNode, cur: Object.assign({ n: pad(s.scNode + 1) }, cur),
          nodes: c.chain.map((x, i) => ({ k: x.k, t: x.t, id: 'sc-node-' + i, cls: 'sc-nd' + (i === s.scNode ? ' on' : ''), on: i === s.scNode ? 'true' : 'false', ti: i === s.scNode ? '0' : '-1', pick: this.scPick[i], key: this.scKey[i] })),
          samples: c.samples.map((x, i) => ({ t: x.label, cls: 'sc-sm', on: s.scPickI === i ? 'true' : 'false', pick: this.scSample[i] })),
          line: s.scLine, setLine: this.scSetLine, send: this.scSendNow, lineKey: this.scLineKey,
          vCls: 'sc-v ' + (r.ok ? 'ok' : 'no'), vHead: r.ok ? 'WOULD BE ACCEPTED' : 'WOULD BE IGNORED AND COUNTED', vWhy: r.why,
          ok: s.scOk, bad: s.scBad,
          last: {
            kg: kg.toFixed(3), ang: last.a.toFixed(1), unsafe: last.unsafe ? 'true' : 'false',
            buzz: last.unsafe ? 'With a valid reading, that sounds the buzzer.' : 'The buzzer stays quiet.',
            zone: zone === 'over' ? 'Above limit' : zone === 'caution' ? 'Approaching limit' : 'Within limit', zCls: zone,
            lPct: Math.max(0, Math.min(100, kg / 1.2 * 100)).toFixed(1), tilt: tilt ? 'Tilt above 20°' : 'Tilt within 20°', tCls: tilt ? 'tilt' : '', a: last.a.toFixed(1)
          }
        };
      }
      if (c.kind === 'ce') {
        const tr = c.traces[s.ceCase] || c.traces[0], onSet = {};
        tr.path.forEach((x) => { onSet[x] = true; });
        const nc = {};
        ['q', 'small', 'reply', 'retr', 'gate', 'none', 'llm', 'err', 'ans'].forEach((x) => { nc[x] = 'ce-n cn-' + x + (onSet[x] ? ' on' : ' off'); });
        ce = {
          kb: c.kb, topics: c.topics.map((t) => ({ t: t })), accounts: c.accounts,
          weights: c.weights.map((w) => ({ k: w.k, v: w.v.toFixed(2), pct: (w.v / 4 * 100).toFixed(1) })),
          picks: c.traces.map((t, i) => ({ t: t.label, id: 'ce-case-' + i, cls: 'ce-pk' + (i === s.ceCase ? ' on' : ''), on: i === s.ceCase ? 'true' : 'false', ti: i === s.ceCase ? '0' : '-1', pick: this.cePick[i], key: this.ceKey[i] })),
          tabId: 'ce-case-' + s.ceCase, q: tr.q, nc: nc, log: tr.log.map((t, i) => ({ n: i + 1, t: t }))
        };
      }
      if (c.kind === 'pw') {
        const r = s.pwRes, cls = (x) => 'pc pc-' + x.k + (x.g ? ' g' : '');
        const names = { u: 'Uppercase', l: 'Lowercase', d: 'Digits', s: 'Punctuation' };
        pwv = {
          steps: c.steps.map((x, i) => ({ n: i + 1, t: x.t, code: x.code, d: x.d })), code: c.code,
          len: s.pwLen, setLen: this.pwSetLen, lenKey: this.pwLenKey, go: this.pwRunNow, copy: this.pwCopy, copied: s.pwCopied,
          err: !!s.pwErr && !s.pwSoft, note: !!s.pwErr && s.pwSoft, errText: s.pwErr, ok: !!r && !s.pwErr
        };
        if (r) {
          pwv.n = r.n; pwv.passAria = 'Generated password, ' + r.n + ' characters: ' + r.pass.split('').join(' ');
          pwv.chars = r.fin.map((x) => ({ c: x.c, cls: cls(x) }));
          pwv.pre1 = r.pre.slice(0, 4).map((x) => ({ c: x.c, cls: cls(x) }));
          pwv.pre2 = r.pre.slice(4).map((x) => ({ c: x.c, cls: cls(x) }));
          pwv.counts = ['u', 'l', 'd', 's'].map((kk) => ({ k: names[kk], n: r.fin.filter((x) => x.k === kk).length, cls: 'pc-' + kk }));
        }
      }
    }
    const axOpen = !!s.arc && s.ds < 0;
    const axItems = axOpen ? PROJECTS.map((p, i) => ({
      n: pad(i + 1), name: p.name, tcls: p.tcls, line: p.line, c: p.c, fg: p.fg, cls: 'ax-it' + (p.cs ? '' : ' arch'),
      has: !!p.cs, none: !p.cs, type: p.cs ? p.cs.type : '', started: p.cs ? p.cs.started : '', inside: p.cs ? p.cs.interactive : '',
      goId: 'ax-go-' + i, stId: 'ax-i-' + i, open: this.axOpenCase[i], aria: 'Read the case study for ' + p.name
    })) : [];

    /* lab */
    const ev = (k) => k === 'leetcode' ? 'LeetCode: ' + lc.solved + ' problems solved, longest streak ' + lc.maxStreak + ' days (' + lc.factHuman + ').' : k === 'tryhackme' ? 'TryHackMe: ' + PROFILE.tryHackMeRooms + ' rooms completed, as of ' + PROFILE.tryHackMeAsOf + '.' : 'No tracked progress yet, so no progress bar.';
    const inL = s.labSel.charAt(0) === 'l', inC = s.labSel.charAt(0) === 'c';
    const learning = LAB.learning.map((x, i) => ({ t: x.t, obj: x.obj, cls: 'md' + (s.labSel === 'l' + i ? ' on' : ''), on: s.labSel === 'l' + i ? 'true' : 'false', pick: this.labPick['l' + i], key: this.labKey['l' + i], id: 'lab-l' + i, ti: (inL ? s.labSel === 'l' + i : i === 0) ? '0' : '-1' }));
    const curious = LAB.curious.map((x, i) => ({ t: x.t, obj: x.obj, cls: 'md jarmd' + (s.labSel === 'c' + i ? ' on' : ''), on: s.labSel === 'c' + i ? 'true' : 'false', pick: this.labPick['c' + i], key: this.labKey['c' + i], id: 'lab-c' + i, ti: (inC ? s.labSel === 'c' + i : i === 0) ? '0' : '-1' }));
    const isL = s.labSel.charAt(0) === 'l', li = Number(s.labSel.slice(1));
    const sel = isL ? LAB.learning[li] : LAB.curious[li];

    const ci = this.chapNow || 0, ch = CHAPTERS[ci] || CHAPTERS[0];
    const stations = [['A', 'Poster press', 'Type a line, print a poster', '#FFE11A'], ['B', 'Collage board', 'Drag, spin and throw paper', '#3CCBC8'], ['C', 'Type lab', 'Bend letters until they break', '#FF7A1C'], ['D', 'Hash garden', 'Words in, patterns out', '#F0442B']];
    const hm = this.hashModel();

    return Object.assign(toolVals, {
      grain: this.props.grain ?? 0.18,
      rootClass: 'root' + (s.party ? ' party' : '') + (calm ? ' calm' : '') + ((s.ds >= 0 || s.arc) ? ' ovl' : ''),
      pageClass: 'page' + (s.xerox ? ' xerox' : ''),
      heroClass: 'hero m' + mode,
      cur: s.cur, curClass: 'cur-in' + (s.cur ? ' on' : ''),
      setCursor: this.setCursor, setScene: this.setScene, setRig: this.setRig, setTotem: this.setTotem,
      setShade0: this.setShade0, setShade1: this.setShade1, setShade2: this.setShade2, setDesk: this.setDesk, setRoot: this.setRoot,
      totemDown: this.totemDown, totemClick: this.totemClick, totemKey: this.totemKey,
      onPMove: this.onPMove, onPUp: this.onPUp, onPLeave: this.onPLeave, mag: this.mag, magOut: this.magOut,
      pairCls0: 'pair' + (s.focus === 0 ? ' on' : ''), pairCls1: 'pair' + (s.focus === 1 ? ' on' : ''), pairCls2: 'pair' + (s.focus === 2 ? ' on' : ''),
      wEnter0: this.wEnter[0], wEnter1: this.wEnter[1], wEnter2: this.wEnter[2], wLeave: this.wLeave,
      wClick0: this.wClick[0], wClick1: this.wClick[1], wClick2: this.wClick[2],
      modeN: pad(mode + 1), modeName: modeNames[mode], hiClick: this.hiClick, toggleXerox: this.toggleXerox,
      hasToast: !!s.toast, toast: s.toast,
      av: { fullbody: CHARACTER.fullbody.cut, fullbodyAlt: CHARACTER.fullbody.alt },
      /* nav */
      nvCls: 'nv c' + ci, setBar: this.setBar, navPrev: this.navPrev, navNext: this.navNext,
      menu: s.menu, menuOpen: this.menuOpen, menuClose: this.menuClose, menuExp: s.menu ? 'true' : 'false',
      menuKey: this.menuKey, dsKey: this.dsKey, roomKey: this.roomKey, skipGo: this.skipGo,
      bgInert: (s.menu || s.ds >= 0 || s.arc) ? '' : null, hallInert: room >= 0 ? '' : null, bsInert: s.stageOn ? '' : null,
      mapCurH: room === -1 ? 'true' : null, mapCur0: room === 0 ? 'true' : null, mapCur1: room === 1 ? 'true' : null, mapCur2: room === 2 ? 'true' : null,
      curN: pad(ci), curT: ch.t,
      navDots: CHAPTERS.map((c, i) => ({ cls: i === ci ? 'on' : '' })),
      chapters: CHAPTERS.map((c, i) => ({ n: pad(i), t: c.t, d: c.d, c: c.c, f: c.f, href: '#' + c.id, go: this.chGo[i], cls: 'mn-row' + (i === ci ? ' on' : '') })),
      /* profile */
      setNameEl: this.setNameEl, thmRooms: PROFILE.tryHackMeRooms, thmAsOf: PROFILE.tryHackMeAsOf,
      nodes: nodes, mapCls: 'cm' + (s.mapOn >= 0 ? ' on' + s.mapOn : ''), mapOff: this.mapOff, trail: trail,
      /* worlds */
      setUv: this.setUv, ox: s.ox, oy: s.oy, uvCls: 'uv-stage' + (room >= 0 ? ' in' : ''),
      hallCls: 'hall' + (room >= 0 ? ' away' : ''), hallHidden: room >= 0 ? 'true' : 'false',
      roomCls0: roomCls(0), roomCls1: roomCls(1), roomCls2: roomCls(2),
      roomHidden0: room === 0 ? 'false' : 'true', roomHidden1: room === 1 ? 'false' : 'true', roomHidden2: room === 2 ? 'false' : 'true',
      enter0: this.enter[0], enter1: this.enter[1], enter2: this.enter[2], toHall: this.toHall,
      mapHall: 'mp mh' + (room === -1 ? ' on' : ''), map0: 'mp m0' + (room === 0 ? ' on' : ''), map1: 'mp m1' + (room === 1 ? ' on' : ''), map2: 'mp m2' + (room === 2 ? ' on' : ''),
      roomHint: room === -1 ? 'pick a door' : room === 0 ? 'next door: the studio' : room === 1 ? 'next door: backstage' : 'back to the hall, or the lab again',
      powerPressed: s.power ? 'true' : 'false', powerToggle: this.powerToggle, powerLabel: s.power ? 'Power off' : 'Power on',
      explodePressed: s.explode ? 'true' : 'false', explodeToggle: this.explodeToggle,
      pcbCls: 'pcb' + (s.power ? ' on' : '') + (s.explode ? ' ex' : ''),
      chips: CHIPS.map((c, i) => ({ label: c.label, x: c.x, y: c.y, w: c.w, h: c.h, cls: 'pchip' + (c.tone ? ' ' + c.tone : '') + (s.chip === i ? ' on' : ''), pick: this.chipPick[i], aria: c.k.toLowerCase() + ': ' + c.t + '. ' + c.line })),
      hex: hex, rdK: rdK, rdT: rdT, rdL: rdL,
      setStudio: this.setStudio, setPad: this.setPad, padDown: this.padDown, padMove: this.padMove, padUp: this.padUp, padClear: this.padClear,
      padHint: s.drew ? '' : (s.mirror ? 'draw here, it mirrors' : 'draw here'),
      mirrorPressed: s.mirror ? 'true' : 'false', mirrorToggle: this.mirrorToggle,
      pencils: PENCILS.map((p, i) => ({ c: p.c, label: p.label, r: [-9, -5, -2, 1, 4, 7, 10][i], cls: 'pcl' + (s.pencil === i ? ' on' : ''), on: s.pencil === i ? 'true' : 'false', pick: this.pencilPick[i] })),
      setStage: this.setStage, setSheen: this.setSheen, bsCls: 'bs' + (s.lights ? ' lit' : ''), bulbs: bulbs, marks: marks,
      lightsPressed: s.lights ? 'true' : 'false', lightsToggle: this.lightsToggle, countIn: this.countIn,
      countCls: 'count' + (s.count ? ' on' : ''), countText: s.count ? String(s.count) : '',
      passCls: 'pass' + (s.passFlip ? ' flip' : ''), passFlip: this.passFlip,
      stageGo: this.stageGo, stageBack: this.stageBack, showCls: 'show' + (s.stageOn ? ' on' : ''), showHidden: s.stageOn ? 'false' : 'true',
      /* images: templates read these as {{asset.<name>}} (see src/assets/index.js) */
      asset: ASSETS,
      /* work */
      pjs: pjs, crates: crates, calBlocks: calBlocks, pwOut: s.pw, pwGen: this.pwGen,
      spec0: 'spec s-fb' + (s.proj === 0 ? ' on' : ''), spec1: 'spec s-sc' + (s.proj === 1 ? ' on' : ''), spec2: 'spec s-ce' + (s.proj === 2 ? ' on' : ''), spec3: 'spec s-pw' + (s.proj === 3 ? ' on' : ''), spec4: 'spec s-sd' + (s.proj === 4 ? ' on' : ''),
      dsOpen: !!ds, ds: ds || {}, dsClose: this.dsClose, dsPrev: this.dsPrev, dsNext: this.dsNext, toArchive: this.toArchive,
      fb: fb, sc: sc, ce: ce, pwv: pwv,
      axOpen: axOpen, axItems: axItems, axCount: PROJECTS.length, axKey: this.axKey, arcOpen: this.arcOpen, arcClose: this.arcClose,
      /* lab */
      learning: learning, curious: curious, labUpdated: LAB.updated, labTabId: 'lab-' + s.labSel,
      logCls: 'log2' + (isL ? ' now' : ' next'), logNo: (isL ? 'A' : 'B') + pad(li + 1), logT: sel.t,
      logPill: 'pill ' + (isL ? 'now' : 'next'), logStatus: isL ? 'LEARNING NOW' : 'CURIOUS ABOUT, NEXT',
      logZone: isL ? 'On the bench' : 'On the shelf', logEvidence: isL ? ev(sel.evidence) : 'Exploring out of curiosity. No tracked progress, so no progress bar.', logLink: sel.link,
      /* report card */
      lc: lc, calCls: 'lc-cal' + (s.cal3d ? ' iso' : ''), calBtn: s.cal3d ? 'Flat view' : 'View in 3D', calPressed: s.cal3d ? 'true' : 'false', calToggle: this.calToggle,
      /* playground */
      stations: stations.map((t, i) => ({ l: 'STATION ' + t[0], t: t[1], d: t[2], c: t[3], cls: 'stn' + (s.pg === i ? ' on' : ''), sel: s.pg === i ? 'true' : 'false', pick: this.pgPick[i], key: this.pgKey[i], id: 'pg-tab-' + i, ti: s.pg === i ? '0' : '-1' })),
      pgTabId: 'pg-tab-' + s.pg,
      pg0: s.pg === 0, pg1: s.pg === 1, pg2: s.pg === 2, pg3: s.pg === 3,
      hashText: s.hText, setHashText: this.setHashText, hashSalt: this.hashSalt, hashUnsalt: this.hashUnsalt,
      hashSaltShow: s.hSalt || '(none)', hashHex: hm.hex, hashTiles: hm.tiles, hashBg: hm.bg, hashCap: 'fnv-1a / ' + hm.hex.slice(0, 8),
      /* contact */
      email: CONTACT.email, mailto: 'mailto:' + CONTACT.email, copyEmail: this.copyEmail,
      copyLabel: s.copied ? 'Copied' : 'Copy email', copyCls: 'cr-btn solid' + (s.copied ? ' copied' : ''),
      linkedin: CONTACT.linkedin, linkedinShort: CONTACT.linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''),
      github: CONTACT.github, githubShort: CONTACT.github.replace(/^https?:\/\//, '')
    });
  }
};
