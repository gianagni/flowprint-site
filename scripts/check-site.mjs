#!/usr/bin/env node
/**
 * Post-build checks over dist/. No dependencies.
 *  - every required route exists
 *  - every internal link and #anchor resolves; no href="#" placeholders
 *  - external links only go where we expect; no remote scripts, styles or images
 *  - one <h1>, a <main id="main">, a <title> per page
 *  - copyable Flowprint commands use only alpha.5 options
 *  - known-false claims from the Stitch exports never appear
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const REQUIRED = ['/', '/docs', '/docs/quick-start', '/docs/first-analysis', '/docs/reading-output', '/docs/cli-reference', '/docs/limitations'];
const EXTERNAL_OK = [/^https:\/\/github\.com\/gianagni\/flowprint\/?$/];
const CLI_OPTIONS = new Set(['--app', '--full', '--version', '--help']);
const FORBIDDEN = [
  [/Node(\.js)?\s*18/i, 'wrong Node.js requirement'],
  [/npm link/i, 'npm link install path'],
  [/tar -xzf/i, 'tarball extraction install path'],
  [/npm (i|install) (-g )?flowprint\b/i, 'public npm install'],
  [/air[- ]gapped/i, 'air-gapped claim'],
  [/\[C\]/, 'invented [C] label'],
  [/Next\.js 12\s*[–-]\s*15/i, 'blanket Next.js version claim'],
  [/zero (node|network)/i, 'zero runtime/network claim'],
  [/100% (deterministic|offline|static)/i, 'absolute certainty claim'],
  [/App Router only/i, '--app described as router filter'],
];

const errors = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith('.html') ? [p] : [];
  });
}

function fileFor(path) {
  const clean = path.replace(/\/+$/, '') || '/';
  const candidates = clean === '/' ? ['index.html'] : [`${clean.slice(1)}/index.html`, `${clean.slice(1)}.html`, clean.slice(1)];
  return candidates.map((c) => join(DIST, c)).find((p) => existsSync(p) && statSync(p).isFile());
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => decode(m[1])));
const text = (html) =>
  decode(html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' '));

for (const route of REQUIRED) if (!fileFor(route)) err(route, 'required route missing from build');
if (!existsSync(join(DIST, '404.html'))) err('/404', '404.html missing');

const pages = htmlFiles(DIST);
for (const file of pages) {
  const rel = '/' + relative(DIST, file);
  const html = readFileSync(file, 'utf8');

  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) err(rel, 'expected exactly one <h1>');
  if (!/<main[^>]*id="main"/.test(html)) err(rel, 'missing <main id="main">');
  if (!/<title>[^<]+<\/title>/.test(html)) err(rel, 'missing <title>');
  if (!/<html lang="en"/.test(html)) err(rel, 'missing lang attribute');

  for (const m of html.matchAll(/<(?:script|link|img|source)\b[^>]*?\s(?:src|href|srcset)="(https?:)?\/\/[^"]*"/g)) {
    if (!/<link[^>]*rel="(?:canonical|alternate)"/.test(m[0])) err(rel, `remote resource: ${m[0].slice(0, 120)}`);
  }

  const pageIds = ids(html);
  for (const m of html.matchAll(/<a\b[^>]*>/g)) {
    const hrefMatch = m[0].match(/\shref="([^"]*)"/);
    if (!hrefMatch) continue;
    const href = decode(hrefMatch[1]);
    if (href === '' || href === '#') { err(rel, `placeholder link href="${href}"`); continue; }
    if (/^https?:/.test(href)) {
      if (!EXTERNAL_OK.some((re) => re.test(href))) err(rel, `unexpected external link ${href}`);
      if (!/target="_blank"/.test(m[0]) || !/rel="noopener noreferrer"/.test(m[0])) err(rel, `external link without target/rel: ${href}`);
      continue;
    }
    if (href.startsWith('#')) {
      if (!pageIds.has(href.slice(1))) err(rel, `broken same-page anchor ${href}`);
      continue;
    }
    if (href.startsWith('/')) {
      const [path, hash] = href.split('#');
      const target = fileFor(path);
      if (!target) { err(rel, `broken internal link ${href}`); continue; }
      if (hash && target.endsWith('.html') && !ids(readFileSync(target, 'utf8')).has(hash)) err(rel, `broken anchor ${href}`);
      continue;
    }
    err(rel, `unexpected link form ${href}`);
  }

  for (const m of html.matchAll(/data-copy="([^"]*)"/g)) {
    const cmd = decode(m[1]);
    if (!cmd.trim()) err(rel, 'empty copy payload');
    for (const line of cmd.split('\n')) {
      if (!/\bflowprint\b/.test(line) || !/^npx\s/.test(line)) continue;
      if (!/^npx flowprint(\s|$)/.test(line)) err(rel, `unexpected npx form: ${line}`);
      for (const opt of line.match(/(?<=\s)--?[a-z][\w-]*/g) ?? []) {
        if (!CLI_OPTIONS.has(opt)) err(rel, `unsupported CLI option in copyable command: ${line}`);
      }
    }
  }

  // Words glued to inline elements ("in<a>", "</code>for") mean whitespace was lost.
  for (const m of html.matchAll(/[A-Za-z,]<(?:a|code|strong|em)[\s>]|<\/(?:a|code|strong|em)>[A-Za-z(]/g)) {
    err(rel, `missing whitespace around inline element: …${html.slice(m.index - 20, m.index + 30)}…`);
  }

  const body = text(html);
  for (const [re, why] of FORBIDDEN) if (re.test(body)) err(rel, `forbidden claim (${why}): ${body.match(re)[0]}`);
  for (const m of body.matchAll(/0\.1\.0-alpha\.(\d+)/g)) if (m[1] !== '5') err(rel, `wrong version ${m[0]}`);
}

if (errors.length) {
  console.error(`check-site: ${errors.length} problem(s)\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log(`check-site: OK — ${pages.length} pages, ${REQUIRED.length} required routes, links/anchors/claims verified`);
