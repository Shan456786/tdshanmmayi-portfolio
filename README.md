# Shanmayi Tadala Portfolio

An interactive editorial-scrapbook portfolio for Shanmayi Shree Tadala. It is a static site (no server, no database, no API keys): React 18 and Vite, with every font, image and script self-hosted.

This repository was exported from the approved Claude Design version. The design, copy, animations and behaviour are the approved ones. Nothing was redesigned in the export. See "How this relates to the Claude Design version" at the end.

## Contents

1. [Quick start](#quick-start)
2. [Scripts](#scripts)
3. [Project structure](#project-structure)
4. [Pages and shareable URLs](#pages-and-shareable-urls)
5. [How the page is built](#how-the-page-is-built)
6. [Add a new project](#add-a-new-project)
7. [Replace the avatar and other images](#replace-the-avatar-and-other-images)
8. [Edit text and links](#edit-text-and-links)
9. [LeetCode automation](#leetcode-automation)
10. [Deploy](#deploy)
11. [Tests and checks](#tests-and-checks)
12. [Security and privacy](#security-and-privacy)
13. [What still needs manual setup](#what-still-needs-manual-setup)
14. [How this relates to the Claude Design version](#how-this-relates-to-the-claude-design-version)

## Quick start

You need Node.js 20.19 or newer (22 is what the workflows use; `.nvmrc` says 22) and npm.

```bash
npm ci            # install exact versions from package-lock.json
npm run dev       # development server with hot reload, http://localhost:5173
```

Build and look at the production version:

```bash
npm run build     # writes the site to dist/
npm run preview   # serves dist/ at http://localhost:4173
```

The opening screen plays for about three seconds on every load. That is part of the design.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload. |
| `npm run build` | Production build into `dist/`. Copies `public/` (favicon, `leetcode.json`) next to it. |
| `npm run preview` | Serves the production build locally. |
| `npm run lint` | ESLint over the whole repository. |
| `npm test` | 17 fast unit tests: the LeetCode sync (with a fake LeetCode server) and the data checks. No browser needed. |
| `npm run test:e2e` | Browser tests against `dist/` (needs `npm run build` first and a one-time `npx playwright install chromium`). Add `-- --dev` to also load every route in development mode and catch React warnings. |
| `npm run audit` | Fails if the repository contains credentials, `.env` files, the private photographs, an unfinished project that must stay out, or em dashes. |
| `npm run check` | audit, lint, tests and build in one go. Run it before every push. |
| `npm run sync:leetcode` | Runs the LeetCode sync once on your computer and rewrites `public/leetcode.json`. Normally the GitHub Action does this. |

## Project structure

```
.
├── index.html                  page shell: title, description, favicon, noscript links
├── package.json, package-lock.json, .nvmrc
├── vite.config.js              base './' (works at any hosting path) and the template plugin
├── eslint.config.js
├── public/
│   ├── favicon.svg
│   └── leetcode.json           LeetCode data file, rewritten daily by the GitHub Action
├── build/                      build-time tooling (not shipped to the browser)
│   ├── dc-compiler.js          turns src/template/*.html into React render functions
│   └── vite-plugin-dc.js       Vite plugin that runs the compiler
├── src/
│   ├── main.js                 entry point
│   ├── template/               the page markup, split by section (see src/template/README.md)
│   │   ├── page.html           root; includes everything else
│   │   ├── chrome.html, menu.html, toast.html
│   │   ├── sections/           hero, strip, profile, worlds, work, learning-lab,
│   │   │                       report-card, playground, contact, footer
│   │   └── overlays/           case-study.html, archive.html
│   ├── data/                   all content as plain data
│   │   ├── profile.js          bio, nodes, CONTACT (email, LinkedIn, GitHub)
│   │   ├── projects/           one file per project, plus index.js
│   │   ├── lab.js              learning lab entries
│   │   ├── leetcode.js         dated snapshot and the liveUrl switch
│   │   ├── playground.js       playground defaults
│   │   └── navigation.js       chapters and URL helpers
│   ├── site/                   behaviour: state, routing, focus, animation, view model
│   │   ├── Component.js        the page component, assembled from the parts below
│   │   ├── initial-state.js
│   │   ├── setup/              one-time installers (hall, rooms, work, playground, ...)
│   │   └── methods/            routing, lifecycle, focus, leetcode, case-studies, stage, view-model
│   ├── runtime/                small runtime used by compiled templates
│   ├── assets/                 characters/, doodles/, textures/ and index.js (the image list)
│   ├── fonts/                  self-hosted woff2 files
│   └── styles/                 23 CSS files, loaded in the order set in index.js
├── scripts/
│   ├── leetcode-sync.mjs       fetch, validate and write public/leetcode.json
│   ├── leetcode-sync.test.mjs  offline tests for the sync
│   ├── data.test.mjs           guards the data file and the "not live yet" switch
│   ├── audit-repo.mjs          pre-publish audit
│   └── fixtures/               frozen real LeetCode responses used by the tests
├── tests/e2e/run.mjs           browser tests
├── docs/leetcode-sync.md       full LeetCode automation guide
├── LICENSES/                   licences of the five self-hosted fonts (SIL OFL)
└── .github/workflows/          leetcode-sync.yml, deploy-pages.yml, ci.yml
```

## Pages and shareable URLs

The site is one page with hash routes, so every URL below can be shared and works after a refresh. Hash routing also means GitHub Pages and any static host need no rewrite rules.

| URL | Shows |
| --- | --- |
| `/` | Home: opening, profile, three worlds, work, learning lab, report card, playground, contact. |
| `/#/lab`, `/#/studio`, `/#/backstage` | The three interactive worlds, opened directly. |
| `/#/work` | The project archive (all five projects). |
| `/#/work/foodbridge` | FoodBridge case study. |
| `/#/work/smartcrutch` | SmartCrutch+ case study. |
| `/#/work/campus-expert` | Campus Expert case study. |
| `/#/work/password-generator` | Password Generator case study. |

Browser back and forward work through rooms and case studies. Escape closes the open room, case study, archive or menu. An unknown route (for example `#/work/typo`) leaves you on the home page.

The chapters (profile, worlds, work, learning lab, report card, playground, contact) are reached by scrolling, the menu pill or its arrows. They do not have their own URLs: a link such as `/#about` opens the home page at the top, exactly as in the approved version. Adding chapter URLs would be a small follow-up if you want them.

A project's URL slug comes from its name: lowercase, with anything that is not a letter or digit turned into a hyphen (`Password Generator` becomes `password-generator`).

## How the page is built

The approved design was written as HTML templates with `{{ value }}` holes. In this repository those templates are kept as HTML (so the markup stays readable and unchanged) and compiled to plain React at build time by `build/dc-compiler.js`. There is no runtime template engine and nothing is fetched from Claude Design.

- Markup is in `src/template/`. The syntax is tiny and documented in `src/template/README.md`.
- Everything the markup shows comes from one object returned by `renderVals()` in `src/site/methods/view-model.js`.
- Content (text, projects, links) is data in `src/data/`. Behaviour is in `src/site/`.
- Parts of the page that never change are created once at load, so React skips them on every update.

## Add a new project

There are three levels. Pick the smallest one that fits.

### 1. Archive-only entry (data only, about two minutes)

This is how Schedura is listed. The project shows in the homepage list and in `#/work`, with no case study and no links.

1. Create `src/data/projects/my-project.js`:

   ```js
   export default {
     name: 'My Project',            // the URL slug is derived from this
     tcls: 'ptt pt-sd',             // title style, see "Title style" below
     c: '#FCEFC7', fg: '#2E170E',   // background and text colour of the project card
     tag: 'PROJECT',                // small label above the title
     line: 'One honest sentence about what it is.',
     tags: 'PYTHON / CLI',          // small label below
     repo: '',                      // GitHub URL once it exists; leave '' for none
     demo: '',                      // live demo URL; leave '' unless a real one exists
     cs: null                       // null means archive only
   };
   ```

2. Open `src/data/projects/index.js`, import it and add it to the `PROJECTS` array:

   ```js
   import myProject from './my-project.js';
   export const PROJECTS = [foodbridge, smartcrutch, campusExpert, passwordGenerator, schedura, myProject];
   ```

3. Optional: the chapter blurb in `src/data/navigation.js` says "Four case studies and the archive." Change it if the count changes.

Title style: `ptt` is required. `pt-fb`, `pt-sd` and the others are in `src/styles/work.css`. Reuse one, or add a `.pt-xx` rule there.

### 2. Full case study of an existing kind (data only)

The case study page has four layouts, chosen by `cs.kind`: `fb` (FoodBridge: route and handover), `sc` (SmartCrutch+: hardware), `ce` (Campus Expert: information system) and `pw` (Password Generator: step through). If the new project fits one, copy that project's file, change every value, and keep the same keys. The page reads those keys, so a missing one stops the case study from rendering.

Rules that keep the content honest, and that the existing four follow:

- Write only what the project's own repository shows, and list the files you read in `cs.sources`.
- Diagrams and browser demos are labelled as diagrams or re-creations. Do not call them screenshots.
- Leave `shots: []` until real screenshots exist (next section).
- Leave `demo: ''` unless a deployed demo is live and you have opened it.

### 3. A case study with a new layout

Add a new `kind`:

1. In `src/site/methods/view-model.js`, add the `is<Kind>` flag next to `isFb`, `isSc`, `isCe`, `isPw` and build the values the layout needs, the way the `pw` block does.
2. In `src/template/overlays/case-study.html`, add the layout inside a `<sc-if value="{{ ds.is<Kind> }}">` block, like the others.
3. Add styles in `src/styles/case-studies.css`, or in a new CSS file imported in `src/styles/index.js` (order matters: later files override earlier ones).
4. Run `npm run dev`, open `#/work/<slug>`, then run `npm run test:e2e`.

### Real screenshots

1. Put the image in `src/assets/projects/<slug>/`, for example `home.webp`. Use WebP, under 200 KB, 1600 px wide at most.
2. Import it at the top of the project file and fill `shots`:

   ```js
   import home from '../../assets/projects/foodbridge/home.webp';
   // ...
   shots: [{ src: home, alt: 'FoodBridge donor dashboard showing three open listings', cap: 'Donor dashboard' }],
   ```

   The page then shows a "SCREENSHOT" caption on each image and changes its note about visuals automatically.

## Replace the avatar and other images

Every image is listed in `src/assets/index.js`. To replace one, overwrite the file in `src/assets/` with a new file of the **same name, the same pixel size and the same transparency**, then reload. Nothing else needs to change.

| Files | Where they appear | Size |
| --- | --- | --- |
| `characters/fullbody-cutout.webp` | Hero avatar. Its alt text is `av.fullbodyAlt` in `src/data/profile.js`. | 603 x 1400 |
| `characters/full-flat`, `full-ink`, `full-back` | The lab world figure. The three are layers of one drawing (colour, ink outline, back plate). Replace all three together. | 420 x 975 |
| `characters/main-flat`, `main-ink`, `main-back` | The studio world figure, same three layers. | 720 x 574 |
| `characters/reading-flat`, `reading-ink`, `reading-back` | The profile section figure, same three layers. | 720 x 605 |
| `characters/silhouette.webp` | The hall and stage silhouette. | 420 x 975 |
| `doodles/star`, `star-2`, `burst` | Hand-drawn stars and burst in the hero and playground. | about 70 to 92 px |
| `textures/grain-tile.svg` | Paper grain over the page. | tile |

If the new image has a different size, check the hero and the three worlds at 1440, 768 and 390 px wide. Run `npm run test:e2e` afterwards: it fails if an image does not load.

To add an image that is not in the list: put it in the right `src/assets/` folder, import it in `src/assets/index.js`, add it to `ASSETS`, and use it in a template as `{{asset.yourName}}`.

Do not add private photographs or any image you would not want public. `npm run audit` blocks a list of names, but it is only a safety net.

## Edit text and links

| What | Where |
| --- | --- |
| Email, LinkedIn, GitHub | `CONTACT` in `src/data/profile.js` |
| Bio, curiosity nodes, avatar alt text | `src/data/profile.js` |
| Learning lab entries | `src/data/lab.js` |
| Project cards and case studies | `src/data/projects/` |
| Playground defaults | `src/data/playground.js` |
| Page title and description (search results, link previews) | `index.html` |
| Fixed headings and microcopy | `src/template/sections/*.html` |

The email address in `CONTACT` is shown publicly and is also in the page source. Change it there if she prefers another one.

## LeetCode automation

**Current state: prepared, not proven.** The report card is in dated snapshot mode. It says "SNAPSHOT, NOT LIVE" with the recording date, and `liveUrl` in `src/data/leetcode.js` is empty. The page makes no request to LeetCode.

What is in the repository:

- `scripts/leetcode-sync.mjs` reads the public profile `https://leetcode.com/u/ShanmayiShree/`, validates the answer, and writes `public/leetcode.json`. If the refresh fails or the numbers look wrong, it keeps the last good data and only records the failed attempt.
- `.github/workflows/leetcode-sync.yml` runs it on demand (Actions tab, "Run workflow"). The daily schedule (02:41 UTC) is written but switched off until one manual run has been checked; see `docs/leetcode-sync.md`. It uses the built-in `GITHUB_TOKEN` with `contents: write` for the one job that commits the file. Every other permission is off. No personal access token and no secrets.
- `.github/workflows/deploy-pages.yml` publishes the site. It is manual-only for now. When switched on, it also runs after each sync, because a commit made with `GITHUB_TOKEN` does not start other workflows by itself.
- `scripts/leetcode-sync.test.mjs` and `scripts/data.test.mjs` test all of it offline.

Nothing has run on GitHub yet, so the automation has not been proven. After the repository exists:

1. Push. Turn on Pages: Settings > Pages > Source: GitHub Actions.
2. Run "Sync LeetCode stats" once by hand and check the run (the checklist is in `docs/leetcode-sync.md`).
3. Only after that passes, set `liveUrl: './leetcode.json'` in `src/data/leetcode.js`, push, and confirm the card says "UPDATED DAILY FROM LEETCODE".

`leetcode.com/graphql` is unofficial. LeetCode can change it or block GitHub's servers. If that happens the run fails, the old data stays, and the card says it may be out of date. Read `docs/leetcode-sync.md` for the full guide, the data format and the known limits.

## Deploy

The build is a folder of static files (`dist/`). Paths are relative (`base: './'`), so it works at the root of a domain or under `https://<user>.github.io/<repo>/`.

### GitHub Pages (included)

1. Create the repository on GitHub and push this code to `main`.
2. Settings > Pages > Build and deployment > Source: **GitHub Actions**.
3. The "Deploy to GitHub Pages" workflow is **manual-only** as shipped, so pushing the code does not publish anything. Run it from the Actions tab ("Run workflow") for the first deploy. To make it deploy automatically on every push and after every LeetCode sync, remove the leading `# ` from the two blocks under `on:` in `.github/workflows/deploy-pages.yml`.

### Vercel, Netlify or Cloudflare Pages

Connect the repository. Build command `npm run build`, output directory `dist`, Node 22. No environment variables. Delete `.github/workflows/deploy-pages.yml`; keep `leetcode-sync.yml` (the host redeploys on each data commit).

### Any other static host

Run `npm run build` and upload the contents of `dist/`.

### Custom domain

Add it in the host's settings. If you use GitHub Pages, also add a `public/CNAME` file containing the domain. No code change is needed.

## Tests and checks

`npm run check` runs audit, lint, unit tests and the build. `npm run test:e2e` adds the browser tests.

The browser tests (202 checks in the last run) cover: every image, font and script loading from the site itself with no failed or outside requests; all routes and deep links at desktop and phone width, refresh, back, forward and Escape; focus handling and inert backgrounds; the three worlds and everything clickable in them; all four case studies and the archive; the playground tools; contact links; the LeetCode card in snapshot, fresh, stale, failed-refresh, invalid and missing-file states; layouts from 360 to 1920 px wide with no sideways scrolling; accessibility basics (landmarks, names, alt text, skip link, focus); load performance; and React warnings in development mode.

What they do **not** cover: browsers other than Chromium (Safari and Firefox are untested), screen readers, real phones and tablets, and a real run of the GitHub workflows.

The e2e run writes screenshots and a `results.json` to `tests/e2e/.out/` (ignored by git).

## Security and privacy

- No `.env` file is needed. The site uses **no environment variables**, API keys, tokens or cookies, in code or in the build. `.gitignore` blocks `.env*`, keys and certificates in case that changes.
- No GitHub token is ever in the frontend. The workflows use the built-in `GITHUB_TOKEN` on the GitHub side only, with minimum permissions.
- The site loads nothing from other sites: fonts, images and scripts are self-hosted, and it has no analytics or trackers. In snapshot mode it makes no request to LeetCode or GitHub (links only).
- Public details in the source: the email address, LinkedIn URL, GitHub profile, the four project repositories and the LeetCode profile, all in `src/data/`. Nothing else personal is included.
- `npm run audit` scans for credentials, `.env` files, private photographs and unfinished projects, and runs in `npm run check`.
- Run `npm audit` now and then for dependency advisories.

## What still needs manual setup

1. Create the GitHub repository and push (this export did not create or push anything).
2. Settings > Pages > Source: GitHub Actions (or connect another host).
3. Settings > Actions > General: allow Actions. If `main` is protected, allow GitHub Actions to push to it, or the daily data commit fails.
4. Run "Sync LeetCode stats" once, verify, switch the daily schedule on (uncomment the two `schedule` lines in `leetcode-sync.yml`), then switch `liveUrl` on (see above). Until then the card stays a dated snapshot.
5. Choose a licence for the code. None was added. The fonts keep their own SIL Open Font Licence files in `LICENSES/`.
6. Confirm the public email address is the one she wants shown.
7. Optional: real project screenshots, a custom domain, an Open Graph preview image.

## How this relates to the Claude Design version

The approved page was compared with this build element by element (about 1,300 elements per scenario, covering tag, classes, attributes, inline styles, text, position, size and computed styles) in 18 scenarios: the home page at four widths, the open menu, the three worlds, the archive at two widths and all four case studies at two widths. All 18 matched. The comparison ignores only the live state of the custom cursor.

Things that had to change, and why:

- **Runtime.** The canvas runtime that Claude Design provided is replaced by the template compiler, React 18.3.1 and `src/site/`. Behaviour is unchanged.
- **Assets.** Images were `/_blob/...` links inside Claude Design. They are now real files in `src/assets/` (checked byte for byte against the originals). Fonts came from Google Fonts; they are now self-hosted woff2 files under their original family names.
- **Deep link scroll.** One small addition: when a room link such as `#/studio` is opened, the page realigns once after fonts finish loading, so the landing position is stable. It does nothing if the visitor has already scrolled.
- **Added.** A favicon, a page description, a `noscript` fallback with the public links, the CI and deploy workflows, the tests and this documentation.
- **Not exported.** An old unused avatar page from the canvas, a retired drag handler (`startDragOld`), duplicate method definitions, and canvas assets that the final page does not use.
- **Left out on purpose.** Private photographs and projects that are not finished.
