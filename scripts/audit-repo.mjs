// Pre-publish audit. Run with: npm run audit
// Fails if the repository contains anything that must never be public:
//   credentials or tokens, .env files, the private photographs, an unfinished project that must stay out,
//   or em dashes (house style: never used). The blocked terms live in forbidden-terms.mjs.
// It reads files only. Nothing is sent anywhere.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NO_PHOTO, NO_PROJECT } from './forbidden-terms.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.vite', 'coverage', 'test-results', 'playwright-report', '.out']);
const TEXT = /\.(js|mjs|cjs|json|html|css|md|yml|yaml|svg|txt|webmanifest|xml|gitignore|gitattributes|nvmrc)$/i;
const BINARY_OK = /\.(webp|png|jpg|jpeg|woff2|ico|gif)$/i;

const SECRETS = [
  ['GitHub token', /\b(ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Private key block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['OpenAI or Anthropic style key', /\bsk-(ant-)?[A-Za-z0-9_-]{24,}/],
  ['Bearer token', /Bearer\s+[A-Za-z0-9._-]{24,}/],
  ['Password or secret assignment', /\b(password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token)\b\s*[:=]\s*['"][^'"\s]{8,}['"]/i],
  ['LeetCode session cookie', /LEETCODE_SESSION|csrftoken\s*[:=]/i]
];
const FORBIDDEN_NAMES = [NO_PHOTO, NO_PROJECT, /\.env(\.|$)/, /\.(pem|key|p12)$/i, /^id_rsa/];
const FORBIDDEN_TEXT = [['a project that must stay out', NO_PROJECT], ['a private photograph', NO_PHOTO]];
const EM_DASH = '—';

const problems = []; let files = 0;
const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const SELF = 'scripts/audit-repo.mjs';

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(full); continue; }
    files++;
    const r = rel(full);
    if (r === SELF || r === '.gitignore' || r === 'scripts/forbidden-terms.mjs') continue;
    for (const re of FORBIDDEN_NAMES) if (re.test(e.name) && !/\.env\.example$/.test(e.name)) problems.push(`${r}: forbidden file name`);
    if (!TEXT.test(e.name)) { if (!BINARY_OK.test(e.name) && !/^(package-lock\.json)$/.test(e.name)) problems.push(`${r}: unexpected file type, review it`); continue; }
    const text = fs.readFileSync(full, 'utf8');
    text.split('\n').forEach((line, i) => {
      for (const [name, re] of SECRETS) if (re.test(line)) problems.push(`${r}:${i + 1}: possible ${name}`);
      for (const [name, re] of FORBIDDEN_TEXT) if (re.test(line) && !/^LICENSES\//.test(r)) problems.push(`${r}:${i + 1}: mentions ${name}`);
      if (line.includes(EM_DASH) && !/^LICENSES\//.test(r)) problems.push(`${r}:${i + 1}: em dash`);
    });
  }
}
walk(root);

if (problems.length) {
  console.error(`Audit FAILED (${problems.length} finding${problems.length === 1 ? '' : 's'} in ${files} files):`);
  problems.slice(0, 60).forEach((p) => console.error('  ' + p));
  process.exit(1);
}
console.log(`Audit passed: ${files} files scanned. No credentials, no .env files, no private photographs, no blocked project, no em dashes.`);
