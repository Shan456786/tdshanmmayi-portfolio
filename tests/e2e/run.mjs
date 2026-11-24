// End-to-end checks against the PRODUCTION build (dist/) in headless Chromium.
//
//   npm run build && npm run test:e2e          production build only
//   npm run test:e2e -- --dev                  also loads every route from the dev server, to catch React warnings
//
// Covers: asset loading, routes and deep links, history, keyboard and focus, the three worlds, the playground,
// the project archive and case studies, the LeetCode card (snapshot, live, stale and failed states), responsive layout,
// accessibility basics and load performance. Only Chromium is used. Safari, Firefox, screen readers and real
// phones are NOT covered by this suite.
import { chromium } from 'playwright';
import { preview, createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { NO_PHOTO, NO_PROJECT } from '../../scripts/forbidden-terms.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(root, 'tests/e2e/.out');
const WITH_DEV = process.argv.includes('--dev');
if (!fs.existsSync(path.join(root, 'dist/index.html'))) { console.error('dist/ not found. Run "npm run build" first.'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (group, name, cond, note = '') => results.push({ group, name, pass: !!cond, note: String(note) });
const wait = (p, ms = 250) => p.waitForTimeout(ms);

const server = await preview({ root, logLevel: 'silent', preview: { port: 0, host: '127.0.0.1' } });
const BASE = server.resolvedUrls.local[0];
const browser = await chromium.launch();

/** A page that records errors, warnings, failed requests and requests to other sites. */
async function open(opts = {}) {
  const { w = 1440, h = 900, touch = false, reduced = false, base = BASE, hash = '', patch = null, route = null } = opts;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch && w < 800, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const log = { errors: [], warnings: [], failed: [], external: [], requests: [] };
  const origin = new URL(base).origin;
  page.on('pageerror', (e) => log.errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') log.errors.push('console: ' + m.text().slice(0, 200)); else if (m.type() === 'warning') log.warnings.push(m.text().slice(0, 200)); });
  page.on('requestfailed', (r) => log.failed.push(r.url() + ' ' + (r.failure() && r.failure().errorText)));
  page.on('response', (r) => { if (r.status() >= 400) log.failed.push(r.url() + ' HTTP ' + r.status()); });
  page.on('request', (r) => { log.requests.push(r.url()); if (!r.url().startsWith(origin) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) log.external.push(r.url()); });
  if (patch) await page.route(/assets\/index-.*\.js$/, async (r) => { const res = await r.fetch(); await r.fulfill({ response: res, body: patch(await res.text()) }); });
  if (route) await route(page);
  await page.goto(base + hash);
  await wait(page, 900);
  return { ctx, page, log };
}
const cls = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); return e ? e.className : null; }, sel);
const txt = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); return e ? e.textContent.trim() : null; }, sel);
const count = (p, sel) => p.evaluate((s) => document.querySelectorAll(s).length, sel);
const hashOf = (p) => p.evaluate(() => location.hash);
const active = (p) => p.evaluate(() => { const a = document.activeElement; if (!a) return ''; return (a.id ? '#' + a.id : a.localName + (a.className && typeof a.className === 'string' ? '.' + a.className.split(' ')[0] : '')); });
const click = async (p, sel, i = 0) => { await p.evaluate(([s, k]) => { const e = document.querySelectorAll(s)[k]; if (!e) throw new Error('missing ' + s); e.scrollIntoView({ block: 'center', behavior: 'instant' }); }, [sel, i]); await wait(p, 120); await p.locator(sel).nth(i).click(); await wait(p, 200); };
const key = async (p, k) => { await p.keyboard.press(k); await wait(p, 300); };
/** Waits until the page has stopped scrolling (smooth scrolling takes up to about 2 seconds). */
const settled = async (p) => { let last = -1; for (let i = 0; i < 30; i++) { const y = await p.evaluate(() => Math.round(scrollY)); if (y === last) { await wait(p, 200); if (y === (await p.evaluate(() => Math.round(scrollY)))) return; } last = y; await wait(p, 150); } };
const scrollThrough = async (p) => { const hgt = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < hgt; y += 700) { await p.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y); await wait(p, 60); } await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await wait(p, 300); };

try {
  // ------------------------------------------------------------------ 1. Load and assets
  {
    const G = 'Load and assets';
    const { ctx, page: p, log } = await open();
    await scrollThrough(p);
    check(G, 'Home loads with no page errors or console errors', log.errors.length === 0, log.errors.join(' | '));
    check(G, 'No console warnings', log.warnings.length === 0, log.warnings.join(' | '));
    check(G, 'No failed requests (404, blocked, network)', log.failed.length === 0, log.failed.join(' | '));
    check(G, 'Every request stays on the site (fonts, images and scripts are self-hosted)', log.external.length === 0, log.external.join(' | '));
    check(G, 'No request to leetcode.com or github.com while the card is in snapshot mode', !log.requests.some((u) => /leetcode\.com|github\.com|githubusercontent/.test(u)));
    check(G, 'No leftover Claude Design asset paths', !log.requests.some((u) => u.includes('/_blob/')));
    const imgs = await p.evaluate(() => [...document.images].map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0, lazy: i.loading === 'lazy' })));
    check(G, `All ${imgs.length} images on the home page decoded (${imgs.filter((i) => i.lazy).length} lazy)`, imgs.length > 10 && imgs.every((i) => i.ok), imgs.filter((i) => !i.ok).map((i) => i.src).join(' | '));
    const fam = ['bricolage', 'caveat', 'space-mono', 'instrument-serif', 'big-shoulders'];
    check(G, 'All five font families were requested as woff2 and loaded', fam.every((f) => log.requests.some((u) => u.includes(f) && u.endsWith('.woff2'))), fam.filter((f) => !log.requests.some((u) => u.includes(f))).join(','));
    // Caveat ships weights 600 and 700 (as the original Google Fonts request did). Only 700 is used on the home page, so it is checked at 700.
    const fonts = await p.evaluate(async () => { await document.fonts.ready; return [['Bricolage Grotesque', 400], ['Caveat', 700], ['Space Mono', 400], ['Instrument Serif', 400], ['Big Shoulders Display', 400]].map(([f, w]) => [f, document.fonts.check(w + ' 16px "' + f + '"')]); });
    check(G, 'document.fonts reports every family available', fonts.every(([, ok]) => ok), JSON.stringify(fonts));
    const doc = await p.evaluate(() => ({ lang: document.documentElement.lang, title: document.title, desc: !!document.querySelector('meta[name=description]'), vp: !!document.querySelector('meta[name=viewport]'), icon: !!document.querySelector('link[rel=icon]') }));
    check(G, 'lang, title, description, viewport and favicon are set', doc.lang === 'en' && doc.title && doc.desc && doc.vp && doc.icon, JSON.stringify(doc));
    const all = await p.evaluate(() => document.documentElement.outerHTML);
    check(G, 'The private photographs are not on the page or in any request', !NO_PHOTO.test(all) && !log.requests.some((u) => NO_PHOTO.test(u)));
    check(G, 'The unfinished project does not appear anywhere on the page', !NO_PROJECT.test(all + (await p.evaluate(() => document.body.innerText))));
    await p.screenshot({ path: path.join(OUT, 'home-1440.png') });
    await ctx.close();
  }

  // ------------------------------------------------------------------ 2. Routes and deep links
  {
    const G = 'Routes and deep links';
    const rooms = [['#/lab', 'r0'], ['#/studio', 'r1'], ['#/backstage', 'r2']];
    for (const [hash, r] of rooms) {
      for (const [w, touch] of [[1440, false], [390, true]]) {
        const { ctx, page: p, log } = await open({ hash, w, h: w > 800 ? 900 : 844, touch });
        check(G, `${hash} opens its world directly (${w}px)`, (await cls(p, '.room.' + r)).includes(' on'), await cls(p, '.room.' + r));
        await settled(p);
        check(G, `${hash} scrolls the worlds section into view (${w}px)`, await p.evaluate(() => { const b = document.querySelector('.uv-stage').getBoundingClientRect(); return b.top < innerHeight * 0.6 && b.bottom > 0; }));
        check(G, `${hash} has no errors (${w}px)`, log.errors.length === 0, log.errors.join(' | '));
        if (w === 1440) { await p.reload(); await wait(p, 900); check(G, `${hash} survives a refresh`, (await cls(p, '.room.' + r)).includes(' on') && (await hashOf(p)) === hash); }
        await ctx.close();
      }
    }
    const cases = [['foodbridge', 'FoodBridge'], ['smartcrutch', 'SmartCrutch+'], ['campus-expert', 'Campus Expert'], ['password-generator', 'Password Generator']];
    for (const [slug, title] of cases) {
      for (const [w, touch] of [[1440, false], [390, true]]) {
        const { ctx, page: p, log } = await open({ hash: '#/work/' + slug, w, h: w > 800 ? 900 : 844, touch });
        check(G, `#/work/${slug} opens the "${title}" case study (${w}px)`, (await txt(p, '.ds-t')) === title, await txt(p, '.ds-t'));
        check(G, `#/work/${slug} moves focus into the case study and makes the page behind it inert (${w}px)`, (await active(p)) === '#ds-h' && (await p.evaluate(() => !!document.querySelector('main[inert]'))), await active(p));
        check(G, `#/work/${slug} has no errors (${w}px)`, log.errors.length === 0, log.errors.join(' | '));
        await ctx.close();
      }
    }
    {
      const { ctx, page: p } = await open({ hash: '#/work' });
      check(G, '#/work opens the project archive', !!(await cls(p, '.ax')), await cls(p, '.ax'));
      check(G, 'The archive lists all five projects, Schedura included', (await count(p, '.ax-it')) === 5, await count(p, '.ax-it'));
      check(G, 'Schedura is archive-only: no links or buttons on its row', (await p.evaluate(() => document.querySelectorAll('.ax-it.arch a, .ax-it.arch button').length)) === 0);
      await key(p, 'Escape');
      check(G, 'Escape closes the archive and the URL drops the route', !(await cls(p, '.ax')) && (await hashOf(p)) === '', await hashOf(p));
      await ctx.close();
    }
    for (const bad of ['#/work/not-a-project', '#/nowhere', '#/work/schedura']) {
      const { ctx, page: p, log } = await open({ hash: bad });
      check(G, `${bad} does not crash and shows no case study`, log.errors.length === 0 && !(await cls(p, '.ds')) && (await count(p, '.hero, .totem, .hav')) > 0, log.errors.join(' | '));
      await ctx.close();
    }
    {
      // history: hall -> lab -> case study -> back -> forward -> escape -> escape -> back
      const { ctx, page: p } = await open();
      await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
      const door = '.door.d0';
      await p.evaluate((s) => { const e = document.querySelector(s); e.scrollIntoView({ block: 'center' }); e.focus(); }, door); await key(p, 'Enter'); await wait(p, 300);
      check(G, 'Opening the engineer door sets #/lab and focuses the room heading', (await hashOf(p)) === '#/lab' && (await active(p)) === '#r0-h', (await hashOf(p)) + ' ' + (await active(p)));
      check(G, 'The hall behind an open room is inert', await p.evaluate(() => !!document.querySelector('.hall[inert]')));
      await p.evaluate(() => { const e = document.querySelector('.pj-row'); e.scrollIntoView({ block: 'center' }); e.focus(); }); await key(p, 'Enter');
      check(G, 'Opening a project sets #/work/foodbridge', (await hashOf(p)) === '#/work/foodbridge', await hashOf(p));
      await p.goBack(); await wait(p, 600);
      check(G, 'Back closes the case study and returns to #/lab', (await hashOf(p)) === '#/lab' && !(await cls(p, '.ds')), await hashOf(p));
      await p.goForward(); await wait(p, 600);
      check(G, 'Forward reopens the case study', (await hashOf(p)) === '#/work/foodbridge' && !!(await cls(p, '.ds')), await hashOf(p));
      await key(p, 'Escape'); check(G, 'Escape closes the case study, URL back to #/lab', !(await cls(p, '.ds')) && (await hashOf(p)) === '#/lab', await hashOf(p));
      await p.evaluate(() => document.getElementById('r0-h').focus()); // project rows live in the Work chapter, outside the room, so focus the room first
      await key(p, 'Escape'); check(G, 'Escape inside the room closes it, URL has no route', (await hashOf(p)) === '' && !(await cls(p, '.room.r0')).includes(' on'), await hashOf(p));
      await ctx.close();
    }
  }

  // ------------------------------------------------------------------ 3. Navigation, worlds, work, playground, contact
  {
    const G = 'Functional';
    const { ctx, page: p, log } = await open();
    await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    await click(p, '.nv-cur');
    check(G, 'Chapter menu opens', !!(await cls(p, '.mn')));
    await key(p, 'Escape'); check(G, 'Escape closes the chapter menu', !(await cls(p, '.mn')));
    await click(p, '.nv-cur'); await click(p, '.mn-row', 4); await wait(p, 900);
    const near = await p.evaluate(() => Math.abs(document.getElementById('lab').getBoundingClientRect().top));
    check(G, 'A menu link closes the menu and scrolls to its chapter', !(await cls(p, '.mn')) && near < 150, 'distance ' + Math.round(near));
    await wait(p, 400); check(G, 'The pill names the current chapter', (await txt(p, '.nv-t')) === 'The learning lab', await txt(p, '.nv-t'));
    await click(p, '.nv-arr', 1); await wait(p, 900); check(G, 'Next arrow moves to the report card', (await txt(p, '.nv-t')) === 'Report card', await txt(p, '.nv-t'));

    // worlds
    await p.evaluate(() => document.getElementById('worlds').scrollIntoView({ behavior: 'instant' })); await wait(p, 400);
    await p.evaluate(() => { const e = document.querySelector('.door.d0'); e.scrollIntoView({ block: 'center' }); e.focus(); }); await key(p, 'Enter'); await wait(p, 900);
    check(G, 'Engineer world opens', (await cls(p, '.room.r0')).includes(' on'));
    await click(p, '.r0 .rm-btn', 0); check(G, 'Power on lights the board', (await cls(p, '.pcb')).includes(' on'));
    await click(p, '.r0 .rm-btn', 1); check(G, 'Exploded view toggles', (await cls(p, '.pcb')).includes(' ex'));
    await p.evaluate(() => document.querySelectorAll('.pchip')[1].scrollIntoView({ block: 'center', behavior: 'instant' })); await wait(p, 200);
    const cb = await p.evaluate(() => { const r = document.querySelectorAll('.pchip')[1].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await p.mouse.move(cb.x - 40, cb.y - 40); await p.mouse.move(cb.x, cb.y, { steps: 4 }); await wait(p, 300);
    check(G, 'Hovering a chip updates the readout', (await txt(p, '.readout .rd-t')) === 'Python', await txt(p, '.readout .rd-t'));
    await click(p, '.mp.m1'); await wait(p, 900);
    check(G, 'The map moves from the lab to the studio', (await cls(p, '.room.r1')).includes(' on') && !(await cls(p, '.room.r0')).includes(' on'));
    await click(p, '.pcl', 3); check(G, 'Pencil selection', (await cls(p, '.pcl:nth-of-type(4)')).includes(' on'));
    await p.evaluate(() => { document.querySelector('.dpad').scrollIntoView({ block: 'center', behavior: 'instant' }); }); await wait(p, 300);
    const box = await p.evaluate(() => { const r = document.querySelector('.dpad').getBoundingClientRect(); return { x: r.x, y: r.y }; });
    await p.mouse.move(box.x + 40, box.y + 40); await p.mouse.down(); await p.mouse.move(box.x + 160, box.y + 120, { steps: 8 }); await p.mouse.up();
    const ink = () => p.evaluate(() => { const c = document.querySelector('.dpad'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; });
    check(G, 'Drawing on the easel paints pixels', (await ink()) > 50, await ink());
    await click(p, '.r1 .rm-btn', 1); check(G, 'Fresh sheet clears the easel', (await ink()) === 0);
    await click(p, '.mp.m2'); await wait(p, 900); check(G, 'The map moves to backstage', (await cls(p, '.room.r2')).includes(' on'));
    await click(p, '.r2 .rm-btn', 0); check(G, 'The mirror lights', (await cls(p, '.bs')).includes('lit'));
    await click(p, '.r2 .rm-btn', 1); await wait(p, 3800); check(G, '"Count it in" lights all 8 marks', (await count(p, '.mk.lit')) === 8, await count(p, '.mk.lit'));
    await p.evaluate(() => document.querySelector('.pass').scrollIntoView({ block: 'center', behavior: 'instant' })); await wait(p, 200);
    await p.locator('.pass').click({ force: true }); await wait(p, 300); check(G, 'The stage pass flips', (await cls(p, '.pass')).includes('flip'));
    await p.evaluate(() => document.querySelector('.to-stage').scrollIntoView({ block: 'center', behavior: 'instant' })); await wait(p, 200);
    await p.locator('.to-stage').click({ force: true }); await wait(p, 300); check(G, 'Walk to the stage', (await cls(p, '.show')).includes(' on'));
    await key(p, 'Escape'); check(G, 'Escape leaves the stage', !(await cls(p, '.show')).includes(' on'));
    await click(p, '.mp.mh'); await wait(p, 900); check(G, 'Back to the hall', !(await cls(p, '.room.r2')).includes(' on'));

    // work: case studies in order
    await click(p, '.pj-row', 1);
    check(G, 'Case study opens from the project list', (await txt(p, '.ds-t')) === 'SmartCrutch+', await txt(p, '.ds-t'));
    const links = await p.evaluate(() => [...document.querySelectorAll('.ds a')].map((a) => a.href + '|' + a.target + '|' + a.rel));
    check(G, 'SmartCrutch+ repository link opens in a new tab with noopener noreferrer', links.some((h) => h.startsWith('https://github.com/Shan456786/SmartCrutch-|_blank|noopener noreferrer')), links.join(' '));
    await click(p, '.ds-b', 2); check(G, 'Next goes to Campus Expert', (await txt(p, '.ds-t')) === 'Campus Expert', await txt(p, '.ds-t'));
    const ce = await p.evaluate(() => [...document.querySelectorAll('.ds a')].map((a) => a.href));
    check(G, 'Campus Expert: repository linked, live demo hidden', ce.includes('https://github.com/Shan456786/CampusExpert') && !ce.some((h) => h.includes('vercel.app')), ce.join(' '));
    await click(p, '.ds-b', 2);
    const pw = () => p.evaluate(() => Array.from(document.querySelectorAll('.pw-pass .pc')).map((e) => e.textContent).join(''));
    const pw1 = await pw(); await click(p, '.pw-go'); const pw2 = await pw();
    check(G, 'Password Generator browser demo makes a new password with all character types', pw1 && pw2 && pw1 !== pw2 && /[A-Z]/.test(pw2) && /[a-z]/.test(pw2) && /\d/.test(pw2), pw1 + ' -> ' + pw2);
    await click(p, '.ds-b', 2); check(G, 'Next wraps past the archive-only project to FoodBridge', (await txt(p, '.ds-t')) === 'FoodBridge', await txt(p, '.ds-t'));
    await key(p, 'Escape'); check(G, 'Escape closes the case study', !(await cls(p, '.ds')));

    // lab, calendar, playground
    await click(p, '.jarmd', 1); check(G, 'Learning lab log changes with the selected entry', (await txt(p, '.log2-h')) === 'Cloud computing and DevSecOps', await txt(p, '.log2-h'));
    await click(p, '.lc-3d'); check(G, 'Activity calendar 3D toggle', (await cls(p, '.lc-cal')).includes('iso'));
    await click(p, '.stn', 3); check(G, 'Hash garden opens', !!(await cls(p, '.hash')));
    const hx1 = await p.evaluate(() => document.querySelectorAll('.hash-dl dd')[1].textContent);
    await p.locator('.hash input').fill('hello'); await wait(p, 250);
    const hx2 = await p.evaluate(() => document.querySelectorAll('.hash-dl dd')[1].textContent);
    check(G, 'Hash garden output follows the input', hx1 !== hx2 && /^[0-9a-f]+$/i.test(hx2.replace(/\s/g, '')), hx1.slice(0, 16) + ' -> ' + hx2.slice(0, 16));
    await click(p, '.stn', 0); await p.locator('.pm input').fill('Hello world'); await wait(p, 250); check(G, 'Poster maker follows the input', (await txt(p, '.pst-a')) === 'Hello', await txt(p, '.pst-a'));
    await click(p, '.stn', 2); await p.locator('.lab input[type=text]').fill('abc'); await wait(p, 250); check(G, 'Type lab renders one glyph per letter', (await count(p, '.lch')) === 3, await count(p, '.lch'));
    await click(p, '.stn', 1);
    const s0 = await p.evaluate(() => document.querySelectorAll('.stk')[1].style.left);
    await p.evaluate(() => document.querySelector('.desk').scrollIntoView({ block: 'center', behavior: 'instant' })); await wait(p, 250);
    const sb = await p.evaluate(() => { const r = document.querySelectorAll('.stk')[1].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await p.mouse.move(sb.x, sb.y); await p.mouse.down(); await p.mouse.move(sb.x + 90, sb.y + 40, { steps: 6 }); await p.mouse.up(); await wait(p, 200);
    const s1 = await p.evaluate(() => document.querySelectorAll('.stk')[1].style.left);
    check(G, 'Collage pieces can be dragged', s0 !== s1, s0 + ' -> ' + s1);

    // contact
    const c = await p.evaluate(() => [...document.querySelectorAll('.ct2 a')].map((a) => a.getAttribute('href') + '|' + (a.target || '') + '|' + (a.rel || '')).join(','));
    check(G, 'Contact links: email, LinkedIn and GitHub, external ones with noopener noreferrer', c.includes('mailto:tdshanmmayi@gmail.com') && c.includes('https://www.linkedin.com/in/shanmayi-tadala-45955b417/|_blank|noopener noreferrer') && c.includes('https://github.com/Shan456786|_blank|noopener noreferrer'), c);
    await p.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await click(p, '.cr-act button'); await wait(p, 300);
    check(G, 'Copy email button confirms', (await txt(p, '.cr-act button')) === 'Copied', await txt(p, '.cr-act button'));
    check(G, 'Report card links to the public LeetCode profile', (await p.evaluate(() => document.querySelector('.rc-link').getAttribute('href'))) === 'https://leetcode.com/u/ShanmayiShree/');
    check(G, 'No errors during the whole walkthrough', log.errors.length === 0, log.errors.join(' | '));
    await ctx.close();
  }

  // ------------------------------------------------------------------ 4. LeetCode card states
  {
    const G = 'LeetCode card';
    const live = (src) => src.replace('liveUrl:``', 'liveUrl:`./leetcode.json`');
    const fileData = JSON.parse(fs.readFileSync(path.join(root, 'public/leetcode.json'), 'utf8'));
    const read = (p) => p.evaluate(() => ({ status: document.querySelector('.lc-status').textContent.trim().replace(/\s+/g, ' '), sub: document.querySelector('.rc-sub').textContent.trim(), foot: document.querySelector('.rc-foot span').textContent.trim(), body: document.querySelector('.rc-card').innerText }));
    {
      const { ctx, page: p, log } = await open();
      const r = await read(p);
      check(G, 'Shipped build is in dated snapshot mode: "SNAPSHOT, NOT LIVE" with a date', /SNAPSHOT, NOT LIVE/.test(r.status) && /\d{1,2} NOV 2026/i.test(r.status), r.status);
      check(G, 'Snapshot mode never says live or daily', !/UPDATED DAILY|LIVE UPDATE|AUTOMATIC/i.test(r.status + r.sub + r.foot) || /NOT LIVE/.test(r.status), r.status + ' / ' + r.sub);
      check(G, 'Card shows 254 solved with 78 easy, 135 medium and 41 hard', /254/.test(r.body) && /78/.test(r.body) && /135/.test(r.body) && /41/.test(r.body));
      check(G, 'Card shows 130 active days, 315 submissions and the dated longest streak of 77', /130/.test(r.body) && /315/.test(r.body) && /77/.test(r.body));
      check(G, 'The 77 is labelled as a longest streak, never a current streak', /longest|max/i.test(r.body) && !/current streak/i.test(r.body));
      check(G, 'Snapshot mode makes no request to leetcode.json or leetcode.com', !log.requests.some((u) => /leetcode\.json|leetcode\.com/.test(u)));
      await ctx.close();
    }
    const synced = (hoursAgo, extra = {}) => Object.assign({}, fileData, { origin: 'sync', fetchedAt: new Date(Date.now() - hoursAgo * 3600e3).toISOString(), lastAttempt: { at: new Date(Date.now() - hoursAgo * 3600e3).toISOString(), ok: true, error: null } }, extra);
    const scenarios = [
      ['Fresh sync (5 hours old)', synced(5), 200, /UPDATED DAILY FROM LEETCODE/i],
      ['Sync older than 36 hours', synced(50), 200, /MAY BE OUT OF DATE|LAST UPDATED/i],
      ['Newest refresh failed, older good data kept', synced(30, { lastAttempt: { at: new Date().toISOString(), ok: false, error: 'HTTP 403' } }), 200, /REFRESH FAILED/i],
      ['The data file is still the starting snapshot (origin snapshot)', fileData, 200, /SNAPSHOT, NOT LIVE/i],
      ['Invalid data (counts do not add up)', synced(2, { easy: 1 }), 200, /COULD NOT LOAD|SNAPSHOT/i],
      ['File missing (404)', null, 404, /COULD NOT LOAD/i],
      ['File is not JSON', 'Just a moment...', 200, /COULD NOT LOAD/i]
    ];
    for (const [name, body, status, expect] of scenarios) {
      const { ctx, page: p, log } = await open({
        patch: live,
        route: (pg) => pg.route(/leetcode\.json/, (r) => r.fulfill(status === 404 ? { status: 404, body: 'nope' } : { status, contentType: 'application/json', body: typeof body === 'string' ? body : JSON.stringify(body) }))
      });
      await wait(p, 700);
      const r = await read(p);
      check(G, `${name}: label reads ${expect}`, expect.test(r.status), r.status);
      check(G, `${name}: the card still shows complete figures`, /\d{3}/.test(r.body) && (await count(p, '.rc-card')) === 1);
      check(G, `${name}: no page errors`, log.errors.filter((e) => !/404|Failed to load resource/.test(e)).length === 0, log.errors.join(' | '));
      await ctx.close();
    }
  }

  // ------------------------------------------------------------------ 5. Responsive layout
  {
    const G = 'Responsive layout';
    for (const [w, h, touch] of [[1920, 1080, false], [1440, 900, false], [1024, 768, false], [768, 1024, true], [430, 932, true], [390, 844, true], [360, 740, true]]) {
      const { ctx, page: p, log } = await open({ w, h, touch });
      await scrollThrough(p);
      const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, nav: (() => { const r = document.querySelector('nav.nv').getBoundingClientRect(); return [r.left, r.right]; })(), wide: [...document.querySelectorAll('main *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 2 && getComputedStyle(e).position !== 'fixed' && !e.closest('.hall,.uv-stage,.strip,.track,.lx-track,[class*=marq],.lc-cal,.cal-wrap,.sk-track,svg,canvas'); }).length }));
      check(G, `${w}px: no horizontal page scroll`, m.sw <= m.iw, `scrollWidth ${m.sw} vs ${m.iw}`);
      check(G, `${w}px: the navigation pill fits inside the viewport`, m.nav[0] >= 0 && m.nav[1] <= w, m.nav.map(Math.round).join('-'));
      check(G, `${w}px: no console errors after scrolling the whole page`, log.errors.length === 0, log.errors.join(' | '));
      await wait(p, 3600); // let the opening animation finish so the picture shows the page, not the intro
      await p.screenshot({ path: path.join(OUT, `home-${w}.png`) });
      if (w <= 430) {
        await p.goto(BASE + '#/work'); await wait(p, 900);
        check(G, `${w}px: project archive fits`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        for (const slug of ['foodbridge', 'smartcrutch', 'campus-expert', 'password-generator']) {
          await p.goto(BASE + '#/work/' + slug); await wait(p, 700);
          const ok = await p.evaluate(() => { const d = document.querySelector('.ds'); return !!d && d.scrollWidth <= d.clientWidth + 1; });
          check(G, `${w}px: ${slug} case study fits`, ok);
        }
      }
      await ctx.close();
    }
  }

  // ------------------------------------------------------------------ 6. Accessibility
  {
    const G = 'Accessibility';
    const { ctx, page: p } = await open();
    const a = await p.evaluate(() => {
      const name = (e) => (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') && [...e.getAttribute('aria-labelledby').split(' ')].map((i) => (document.getElementById(i) || {}).textContent || '').join(' ') || (e.labels && [...e.labels].map((l) => l.textContent).join(' ')) || e.textContent || e.getAttribute('title') || e.querySelector('img[alt]')?.getAttribute('alt') || '').trim();
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id); const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      return {
        h1: document.querySelectorAll('h1').length, main: document.querySelectorAll('main').length, nav: document.querySelectorAll('nav').length,
        noAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
        unnamed: [...document.querySelectorAll('button,a[href],input,select,textarea,[role=button]')].filter((e) => !name(e) && !e.closest('[aria-hidden=true]') && e.getClientRects().length).map((e) => e.outerHTML.slice(0, 70)),
        dup, skip: !!document.querySelector('a.skip[href="#main"]'), targetBlank: [...document.querySelectorAll('a[target=_blank]')].filter((e) => !/noopener/.test(e.rel)).length,
        tabindexPositive: [...document.querySelectorAll('[tabindex]')].filter((e) => +e.getAttribute('tabindex') > 0).length
      };
    });
    check(G, 'Exactly one h1', a.h1 === 1, a.h1);
    check(G, 'One main landmark and a nav landmark', a.main === 1 && a.nav >= 1, `main ${a.main}, nav ${a.nav}`);
    check(G, 'Every image has an alt attribute (empty for decoration)', a.noAlt === 0, a.noAlt);
    check(G, 'Every visible button, link and field has an accessible name', a.unnamed.length === 0, a.unnamed.join(' | '));
    check(G, 'No duplicate ids', a.dup.length === 0, a.dup.join(','));
    check(G, 'A skip link points at #main', a.skip);
    check(G, 'Every target=_blank link has noopener', a.targetBlank === 0, a.targetBlank);
    check(G, 'No positive tabindex values', a.tabindexPositive === 0, a.tabindexPositive);
    await p.keyboard.press('Tab'); await wait(p, 150);
    check(G, 'The first Tab stop is the skip link', (await p.evaluate(() => document.activeElement.className)).includes('skip'), await active(p));
    await p.keyboard.press('Enter'); await wait(p, 300);
    check(G, 'Using the skip link moves focus to the main content', await p.evaluate(() => document.activeElement.id === 'main' || !!document.activeElement.closest('#main')), await active(p));
    // case study dialog: Tab stays inside, Escape returns focus
    await p.goto(BASE + '#/work/foodbridge'); await wait(p, 900);
    for (let i = 0; i < 14; i++) await p.keyboard.press('Tab');
    check(G, 'Keyboard focus stays inside the open case study', await p.evaluate(() => !!document.activeElement.closest('.ds')), await active(p));
    await ctx.close();
    for (const [name, o] of [['reduced motion', { reduced: true }], ['touch, 390px', { w: 390, h: 844, touch: true }]]) {
      const x = await open(o); await scrollThrough(x.page);
      check(G, `Loads and scrolls cleanly with ${name}`, x.log.errors.length === 0 && (await count(x.page, '.hav, .totem')) > 0, x.log.errors.join(' | '));
      await x.ctx.close();
    }
  }

  // ------------------------------------------------------------------ 7. Performance (local, cold cache, no throttling)
  {
    const G = 'Performance';
    const dist = path.join(root, 'dist/assets');
    const files = fs.readdirSync(dist);
    const gz = (f) => zlib.gzipSync(fs.readFileSync(path.join(dist, f))).length;
    const js = files.filter((f) => f.endsWith('.js')).reduce((s, f) => s + gz(f), 0), css = files.filter((f) => f.endsWith('.css')).reduce((s, f) => s + gz(f), 0);
    const total = (function sum(d) { return fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? sum(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0); })(path.join(root, 'dist'));
    check(G, `JavaScript is ${(js / 1024).toFixed(0)} KB gzipped (budget 150 KB)`, js < 150 * 1024);
    check(G, `CSS is ${(css / 1024).toFixed(0)} KB gzipped (budget 50 KB)`, css < 50 * 1024);
    check(G, `Whole site is ${(total / 1048576).toFixed(2)} MB on disk (budget 3 MB)`, total < 3 * 1048576);
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const p2 = await ctx2.newPage();
    await p2.addInitScript(() => {
      window.__m = { cls: 0, lcp: 0, long: 0, longMax: 0 };
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__m.long += e.duration; window.__m.longMax = Math.max(window.__m.longMax, e.duration); } }).observe({ type: 'longtask', buffered: true });
    });
    await p2.goto(BASE); await wait(p2, 2500);
    const m = await p2.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; const fcp = performance.getEntriesByName('first-contentful-paint')[0]; const res = performance.getEntriesByType('resource'); return { dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd, fcp: fcp ? fcp.startTime : 0, reqs: res.length, bytes: res.reduce((s, r) => s + (r.encodedBodySize || 0), 0), m: window.__m }; });
    check(G, `First contentful paint ${Math.round(m.fcp)} ms (budget 1500 ms, local)`, m.fcp > 0 && m.fcp < 1500);
    check(G, `Largest contentful paint ${Math.round(m.m.lcp)} ms (budget 2500 ms, local)`, m.m.lcp < 2500);
    check(G, `Cumulative layout shift ${m.m.cls.toFixed(3)} (budget 0.1)`, m.m.cls < 0.1);
    check(G, `Longest main-thread task ${Math.round(m.m.longMax)} ms (budget 250 ms)`, m.m.longMax < 250);
    check(G, `${m.reqs} requests, ${(m.bytes / 1048576).toFixed(2)} MB transferred on first load`, m.reqs < 80 && m.bytes < 4 * 1048576);
    await ctx2.close();
  }

  // ------------------------------------------------------------------ 8. Development build: React warnings
  if (WITH_DEV) {
    const G = 'Development build';
    const dev = await createServer({ root, logLevel: 'silent', server: { port: 0, host: '127.0.0.1' } });
    await dev.listen();
    const devBase = dev.resolvedUrls.local[0];
    for (const hash of ['', '#/lab', '#/studio', '#/backstage', '#/work', '#/work/foodbridge', '#/work/smartcrutch', '#/work/campus-expert', '#/work/password-generator']) {
      const { ctx, page: p, log } = await open({ base: devBase, hash });
      await scrollThrough(p);
      check(G, `${hash || '#/'}: no React or console warnings or errors in development mode`, log.errors.length === 0 && log.warnings.filter((w) => !/Download the React DevTools|\[vite\]/.test(w)).length === 0, log.errors.concat(log.warnings).join(' | '));
      await ctx.close();
    }
    await dev.close();
  }
} catch (e) {
  check('Runner', 'The test run completed without throwing', false, e.stack || e);
}

await browser.close();
await new Promise((r) => server.httpServer.close(r));

let group = ''; let fails = 0;
for (const r of results) {
  if (r.group !== group) { group = r.group; console.log('\n' + group); }
  if (!r.pass) fails++;
  console.log('  ' + (r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.note && (!r.pass || /\d/.test(r.name) === false && false) ? '  [' + r.note + ']' : ''));
}
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
console.log(`\n${results.length - fails} passed, ${fails} failed, ${results.length} checks. Screenshots and results.json are in tests/e2e/.out/`);
process.exit(fails ? 1 : 0);
