# LeetCode daily sync for the report card

**Status: prepared in this repository, not yet proven.** The report card is in dated snapshot mode. It says "SNAPSHOT, NOT LIVE / RECORDED <date>" and `LEETCODE.liveUrl` in `src/data/leetcode.js` is empty. Do not switch it on, and do not describe the automation as running, until you have completed "Switch the page on" below.

## What is in this repository

```
.github/workflows/leetcode-sync.yml     Action: fetch, validate, commit public/leetcode.json (manual until the daily schedule is switched on)
.github/workflows/deploy-pages.yml      builds and publishes the site (manual-only until switched on; see the file header)
.github/workflows/ci.yml                lint, tests, build on pull requests
scripts/leetcode-sync.mjs               fetch, validate, write public/leetcode.json (no npm packages)
scripts/leetcode-sync.test.mjs          offline tests of the sync, with a fake LeetCode server
scripts/data.test.mjs                   checks the data file, the built-in snapshot and the "not live yet" switch
scripts/fixtures/                       frozen real responses (22 and 24 Nov 2026) and a frozen seed for the tests
public/leetcode.json                    the data file (starts as the 24 Nov 2026 snapshot read from the public profile)
src/data/leetcode.js                    the built-in snapshot and the liveUrl switch
```

No secrets, tokens or passwords anywhere. The sync workflow uses the built-in `GITHUB_TOKEN` with `contents: write` for the one job that commits the data file. Every other permission is off.

## How it works

1. When you press "Run workflow", and once a day (02:41 UTC) after the schedule is switched on (see "Setup"), GitHub runs the Action.
2. The Action first runs the offline tests. If the script is broken, it stops before touching any data.
3. The script asks LeetCode's public GraphQL endpoint for Shanmayi's profile, with a 20-second timeout and up to 3 tries.
4. Every answer is checked before anything is saved (see "Validation" below).
5. **Success:** `public/leetcode.json` gets the new figures and a new `fetchedAt` (the time of the last successful refresh). The file is committed.
6. **Failure:** every figure and `fetchedAt` stay exactly as they were. Only `lastAttempt` is updated with the time and the reason. That change is committed, and the run is marked failed so GitHub notifies you.
7. The page reads `./leetcode.json`, checks it again, and shows an honest label (see "What visitors see").

Permissions: the workflow turns every permission off, then gives the job only `contents: write`, which it needs to commit one file. It uses the built-in `GITHUB_TOKEN`. No personal access token.

## Data file: `public/leetcode.json`

```json
{
  "schema": 1,
  "user": "ShanmayiShree",
  "profileUrl": "https://leetcode.com/u/ShanmayiShree/",
  "source": "leetcode.com/graphql (public, unofficial)",
  "origin": "sync",
  "fetchedAt": "2026-11-23T02:41:07.512Z",
  "lastAttempt": { "at": "2026-11-23T02:41:07.512Z", "ok": true, "error": null },
  "solved": 254, "easy": 78, "medium": 135, "hard": 41,
  "submissions": 315,
  "activeDays": 130,
  "maxStreak": 75,
  "badges": [ { "name": "100 Days Badge 2026", "date": "2026-11-05" } ],
  "calStart": "2026-07-17",
  "cal": [3, 5, 20, 32],
  "recent": [ { "title": "Find Subtree Sizes After Changes", "slug": "find-subtree-sizes-after-changes", "ts": 1795265077 } ]
}
```

(Arrays shortened here. The real file has every badge, every day and the last 10 accepted problems.)

| Field | Meaning |
| --- | --- |
| `origin` | `sync` when written by the Action. `snapshot` for the starting file. The page never shows `snapshot` data as live. |
| `fetchedAt` | Time of the last **successful** refresh. This is the data's timestamp. |
| `lastAttempt` | Time and result of the most recent try, successful or not. `null` in the starting file. |
| `solved`, `easy`, `medium`, `hard` | Accepted problems by difficulty. |
| `submissions` | Submissions in the last 365 days (the sum of `cal`). |
| `activeDays` | Active days in the past year, as LeetCode reports it. |
| `maxStreak` | LeetCode's "max streak" for the past year. The **longest** streak, never a current streak. |
| `badges` | Badge name and the date it was earned. |
| `calStart`, `cal` | Daily submission counts, one per UTC day, from `calStart` to the day of the refresh. |
| `recent` | Last 10 accepted problems: title, LeetCode slug, Unix time. |

There is no current-streak field. LeetCode does not give one reliably, so the script does not make one up.

## Validation

The script and the page both reject data where:

- a count is missing, negative or not a whole number
- easy + medium + hard does not equal solved
- the longest streak is longer than the number of active days, or there are more than 366 active days
- dates do not parse, or the calendar is empty, longer than a year, or does not add up to `submissions`
- badges or recent problems are malformed
- the solved count is lower than in the previous good file (solved problems cannot go down)

The script also treats these as failures: timeout, network error, any HTTP error, a response that is not JSON (for example a bot-check page), and a GraphQL error.

## What visitors see

| Situation | Label | Footer |
| --- | --- | --- |
| `liveUrl` empty (today) | SNAPSHOT, NOT LIVE / RECORDED 24 NOV 2026 | FIGURES FROM MY PUBLIC PROFILE, RECORDED 24 NOV 2026, 13:35 UTC |
| Page is loading the file | LOADING THE DAILY UPDATE / SHOWING 24 NOV 2026 SNAPSHOT | (snapshot time) |
| Synced in the last 36 hours | UPDATED DAILY FROM LEETCODE / LAST UPDATED 5 HOURS AGO | LAST SUCCESSFUL UPDATE 23 NOV 2026, 02:41 UTC / REFRESHES ONCE A DAY |
| Last sync more than 36 hours old | LAST UPDATED 20 NOV 2026 / MAY BE OUT OF DATE | LAST SUCCESSFUL UPDATE (time) |
| Newest refresh failed | LATEST DAILY REFRESH FAILED 24 NOV 2026 / SHOWING DATA FROM 23 NOV 2026 | LAST SUCCESSFUL UPDATE (time) |
| File missing, broken, invalid or slower than 8 s | COULD NOT LOAD THE DAILY UPDATE / SHOWING 24 NOV 2026 SNAPSHOT | (snapshot time) |
| File still says `origin: snapshot` | SNAPSHOT, NOT LIVE / RECORDED 24 NOV 2026 | (snapshot time) |

An open page checks the file again every 60 minutes and moves the "hours ago" text forward.

## Setup after the repository is on GitHub

1. **Push the repository.** The workflows start working once they are on the default branch (`main`).
2. **Allow Actions.** Settings > Actions > General: allow Actions for this repository. The workflows request their own permissions.
3. **Turn on Pages** (skip this if you host somewhere else). Settings > Pages > Build and deployment > Source: **GitHub Actions**.
4. **Host somewhere else?** Vercel, Netlify and Cloudflare Pages rebuild on every commit by themselves. Delete `deploy-pages.yml` and keep `leetcode-sync.yml`. Build command `npm run build`, output folder `dist`.
5. **Protected branch?** If `main` only accepts pull requests, the sync cannot push to it. Allow GitHub Actions to bypass the rule for this branch, or the daily commit will fail.
6. **Run the sync once by hand:** Actions tab > "Sync LeetCode stats" > Run workflow.
7. **Verify the first run** (next section). Only when every check passes, go on.
8. **Switch the daily schedule on:** in `.github/workflows/leetcode-sync.yml`, remove the leading `# ` from the two `schedule` lines, commit and push.
9. **Optional, GitHub Pages:** to deploy automatically on every push and after every sync, remove the leading `# ` from the two blocks under `on:` in `.github/workflows/deploy-pages.yml`. Then go to "Switch the page on".

## Switch the page on

Do this only after the verification below has passed in the real repository.

1. In `src/data/leetcode.js` set `liveUrl: './leetcode.json'`. Keep the leading `./`, it works from any hosting path.
2. Commit and push. The deploy workflow publishes it.
3. Open the live site. The card should say "UPDATED DAILY FROM LEETCODE / LAST UPDATED ... AGO". If it says "COULD NOT LOAD THE DAILY UPDATE", the file is not being served. Set `liveUrl` back to `''` and re-check step 5 of the verification.

## How to verify the first automated refresh

All of these should be true:

1. **Actions tab:** the run has a green tick. The step "Fetch public LeetCode data" printed a line starting with `OK:` and the solved count.
2. **Run summary** (bottom of the run page): "Last successful refresh (fetchedAt)" is a time from that run, and "This attempt" says `ok`.
3. **Commit history:** a new commit by `github-actions[bot]` named "LeetCode stats refreshed".
4. **The file:** open `public/leetcode.json` on GitHub. `origin` is `sync`, `fetchedAt` is from that run, `lastAttempt.ok` is `true`, and the numbers match the profile page at https://leetcode.com/u/ShanmayiShree/.
5. **The deployed file:** after the 'Deploy to GitHub Pages' run that follows the sync, open `https://<your site>/leetcode.json` in a browser and check the same `fetchedAt`.
6. **The next day:** the scheduled run has happened on its own (Actions tab shows an event called "schedule"), and `fetchedAt` moved forward.

If the first run fails, the summary and the red step show the reason. The file keeps the 24 Nov snapshot and the page, if switched on, keeps saying "SNAPSHOT, NOT LIVE".

## Run the tests yourself

```
npm test
```

The sync tests start a local server that plays the part of LeetCode, so the real network code is tested without contacting leetcode.com. Covered: success with a real captured response, HTTP 500, a server that never answers (timeout), an HTML page instead of JSON, a GraphQL error, a missing profile, numbers that do not add up, zeroed data, no previous file, retry after one failure, timestamps across success, failure and success again, a corrupt previous file, and the starting file being valid. `data.test.mjs` also checks that the page is still in snapshot mode.

## Known limits

- `leetcode.com/graphql` is unofficial and undocumented. LeetCode can change it or block requests from GitHub's servers. If that happens the run fails, the previous data stays, and the card says so.
- Whether LeetCode accepts requests from GitHub's servers can only be known after the first real run.
- GitHub can start scheduled runs late when it is busy. Daily is the target, not an exact time.
- In a public repo, GitHub disables scheduled workflows after 60 days without repository activity. The daily data commits may count as activity, but GitHub does not say clearly whether commits made by the Action itself do. If the workflow gets disabled, re-enable it in the Actions tab.
- The page treats data older than 36 hours as "may be out of date". One late or failed run is enough to show that label, which is intended.
- The deploy workflow runs after the sync workflow finishes (`workflow_run`). That only works once both files are on the default branch.
