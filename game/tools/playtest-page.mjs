// Builds the playtest page that is published as a claude.ai Artifact.
// The page is index.html with the fonts inlined as data URIs (so they load inside the
// Artifact's sandbox); the scripts in src/ and vendor/ are published beside it as files.
//
//   node tools/playtest-page.mjs <out.html>
//
// Then publish <out.html> with files = every path printed by this script (root = game/).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const gameDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2];
if (!out) { console.error('usage: node tools/playtest-page.mjs <out.html>'); process.exit(1); }

// fonts.css with each url('x.woff2') swapped for a data URI
const fontsCss = fs.readFileSync(path.join(gameDir, 'fonts/fonts.css'), 'utf8')
  .replace(/url\('([^']+)'\)/g, (_, f) =>
    `url(data:font/woff2;base64,${fs.readFileSync(path.join(gameDir, 'fonts', f)).toString('base64')})`);

let html = fs.readFileSync(path.join(gameDir, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m => m[1]);
// The Artifact host wraps the page in its own doctype/html/head/body with charset and viewport
// metas, so those come out here and the title goes first.
html = html
  .replace(/<!doctype html>\s*|<\/?(html|head|body)[^>]*>\s*|<meta (charset|name="viewport")[^>]*>\s*/gi, '')
  .replace(/<link href="fonts\/fonts.css" rel="stylesheet">/, `<style>\n${fontsCss}\n</style>`);
fs.writeFileSync(out, html);

// every script the page loads, plus every module main.js imports (all of src/)
const files = new Set(scripts);
const walk = d => fs.readdirSync(path.join(gameDir, d), { withFileTypes: true }).forEach(e =>
  e.isDirectory() ? walk(`${d}/${e.name}`) : e.name.endsWith('.js') && files.add(`${d}/${e.name}`));
walk('src');
console.log([...files].sort().join('\n'));
