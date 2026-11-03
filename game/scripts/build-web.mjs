// Copies the game into www/ for Capacitor (the Android app loads it from there).
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const item of ['index.html', 'src', 'fonts', 'vendor', 'icons']) {
  try { cpSync(join(root, item), join(out, item), { recursive: true }); } catch (e) { if (item !== 'icons') throw e; }
}
// stamp the version so a stale WebView cache never mixes old and new files
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const html = readFileSync(join(out, 'index.html'), 'utf8').replace(/(src|href)="((?:src|vendor|fonts)\/[^"]+)"/g, `$1="$2?v=${pkg.version}"`);
writeFileSync(join(out, 'index.html'), html);
console.log('www/ ready, version', pkg.version);
