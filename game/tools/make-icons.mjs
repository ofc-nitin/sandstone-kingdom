// Renders the launcher icons, splash screens and Play Store graphics from the game's art.
// Needs the local server (npm run serve). Usage: node tools/make-icons.mjs
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(`${execSync('npm root -g').toString().trim()}/playwright`); }
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const res = join(root, 'android/app/src/main/res');
const b = await pw.chromium.launch();
const p = await b.newPage();
await p.goto('http://localhost:8090/tools/icon.html');
await p.evaluate(() => window.ready);
const get = async (kind) => Buffer.from((await p.evaluate((k) => window.render(k), kind)).split(',')[1], 'base64');
const resize = async (buf, w, h) => {
  const out = await p.evaluate(async ([src, w2, h2]) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = w2; c.height = h2;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    const sc = Math.max(w2 / img.width, h2 / img.height);
    x.drawImage(img, (w2 - img.width * sc) / 2, (h2 - img.height * sc) / 2, img.width * sc, img.height * sc);
    return c.toDataURL('image/png');
  }, ['data:image/png;base64,' + buf.toString('base64'), w, h]);
  return Buffer.from(out.split(',')[1], 'base64');
};
const icon = await get('icon'), fg = await get('fg'), bg = await get('bg'), splash = await get('splash'), feature = await get('feature');
const store = join(root, 'store');
mkdirSync(store, { recursive: true });
writeFileSync(join(store, 'icon-512.png'), icon);
writeFileSync(join(store, 'feature-graphic-1024x500.png'), feature);
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(dens)) {
  const dir = join(res, `mipmap-${d}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'ic_launcher.png'), await resize(icon, 48 * k, 48 * k));
  writeFileSync(join(dir, 'ic_launcher_round.png'), await resize(icon, 48 * k, 48 * k));
  writeFileSync(join(dir, 'ic_launcher_foreground.png'), await resize(fg, 108 * k, 108 * k));
  writeFileSync(join(dir, 'ic_launcher_background.png'), await resize(bg, 108 * k, 108 * k));
  const land = join(res, `drawable-land-${d}`);
  mkdirSync(land, { recursive: true });
  writeFileSync(join(land, 'splash.png'), await resize(splash, Math.round(480 * k), Math.round(320 * k)));
  const port = join(res, `drawable-port-${d}`);
  mkdirSync(port, { recursive: true });
  writeFileSync(join(port, 'splash.png'), await resize(splash, Math.round(320 * k), Math.round(480 * k)));
}
writeFileSync(join(res, 'drawable/splash.png'), await resize(splash, 480, 320));
await b.close();
console.log('icons, splash screens and store graphics written');
