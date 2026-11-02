// Renders the launcher icons and splash screens in android/ from the game's artwork,
// replacing Capacitor's placeholder images at the same pixel sizes.
// Needs Playwright. Usage: node tools/render-android-icons.mjs
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require(`${execSync('npm root -g').toString().trim()}/playwright`);
}

const BG = '#1b1d2a';
const RES = fileURLToPath(new URL('../android/app/src/main/res/', import.meta.url));

// The board artwork from icon.svg, drawn inside a 512-unit box.
const ART = `
  <rect x="96" y="96" width="320" height="320" rx="40" fill="#262938"/>
  <circle cx="176" cy="176" r="52" fill="#ff6b6b"/>
  <circle cx="336" cy="176" r="56" fill="#11121a" stroke="#4ecdc4" stroke-width="14"/>
  <circle cx="176" cy="336" r="56" fill="#11121a" stroke="#ff6b6b" stroke-width="14"/>
  <circle cx="336" cy="336" r="52" fill="#4ecdc4"/>`;

const svg = {
  // Legacy square launcher icon.
  ic_launcher: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="112" fill="${BG}"/>${ART}</svg>`,
  // Legacy round launcher icon.
  ic_launcher_round: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <circle cx="256" cy="256" r="256" fill="${BG}"/>
    <g transform="translate(256 256) scale(0.82) translate(-256 -256)">${ART}</g></svg>`,
  // Adaptive icon foreground: transparent, art kept inside the central safe zone.
  ic_launcher_foreground: () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <g transform="translate(256 256) scale(0.78) translate(-256 -256)">${ART}</g></svg>`,
  // Splash screen: solid background with the icon centred.
  splash: (w, h) => {
    const s = Math.min(w, h) * 0.3;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
      <rect width="${w}" height="${h}" fill="${BG}"/>
      <g transform="translate(${(w - s) / 2} ${(h - s) / 2}) scale(${s / 512})">${ART}</g></svg>`;
  },
};

const pngSize = (file) => {
  const buf = readFileSync(file);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
};

const targets = [];
for (const dir of readdirSync(RES)) {
  if (!dir.startsWith('mipmap') && !dir.startsWith('drawable')) continue;
  for (const file of readdirSync(join(RES, dir))) {
    const name = file.replace(/\.png$/, '');
    if (file.endsWith('.png') && svg[name]) targets.push({ path: join(RES, dir, file), name });
  }
}

const browser = await playwright.chromium.launch();
const page = await browser.newPage();
for (const t of targets) {
  const { w, h } = pngSize(t.path);
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg[t.name](w, h).replace('<svg ', `<svg width="${w}" height="${h}" `)}</body></html>`,
  );
  await page.screenshot({ path: t.path, omitBackground: true });
}
await browser.close();

// The adaptive icon's background layer colour.
const bgXml = join(RES, 'values', 'ic_launcher_background.xml');
writeFileSync(bgXml, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n</resources>\n`);
console.log(`Rendered ${targets.length} images`);
