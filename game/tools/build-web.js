// Copies the playable game into dist/, the folder Capacitor packages into the Android app.
// Usage: node tools/build-web.js
import { cpSync, rmSync, mkdirSync } from 'node:fs';

const FILES = ['index.html', 'style.css', 'icon.svg', 'manifest.webmanifest', 'src'];
const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist);
for (const f of FILES) cpSync(new URL(f, root), new URL(f, dist), { recursive: true });
console.log(`Copied ${FILES.length} entries to dist/`);
