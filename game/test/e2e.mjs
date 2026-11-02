// Browser test: plays the game on a phone-sized screen and checks the full loop.
// Needs Playwright and a server on http://localhost:8080 (npm run serve).
// Usage: node test/e2e.mjs [screenshot-dir]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require(`${execSync('npm root -g').toString().trim()}/playwright`);
}

const URL = process.env.GAME_URL ?? 'http://localhost:8080/';
const shots = process.argv[2];
const errors = [];

const browser = await playwright.chromium.launch();
const context = await browser.newContext({ ...playwright.devices['iPhone 13'], hasTouch: true });
const page = await context.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const snap = async (name) => { if (shots) await page.screenshot({ path: `${shots}/${name}.png` }); };
const waitIdle = () => page.waitForFunction(() => !window.__game.animating);

// Swipes across the board with real touch-style pointer events.
async function swipe(dir) {
  const box = await page.locator('#board-wrap').boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const d = { up: [0, -80], down: [0, 80], left: [-80, 0], right: [80, 0] }[dir];
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + d[0], cy + d[1], { steps: 5 });
  await page.mouse.up();
  await waitIdle();
}

await page.goto(URL);
await page.evaluate(() => localStorage.clear());
await page.reload();
await snap('01-home');
assert.equal(await page.locator('.level-tile').count(), 60, '60 level tiles');
assert.equal(await page.locator('.level-tile:not(.locked)').count(), 1, 'only level 1 unlocked');

// Level 1 by swiping the solver's moves.
await page.click('#play-btn');
await page.waitForSelector('#game:not([hidden])');
await snap('02-level1');
const sol1 = await page.evaluate(() => window.__game.solution());
for (const dir of sol1) await swipe(dir);
await page.waitForSelector('#win:not([hidden])');
assert.match(await page.locator('#win-stars').getAttribute('aria-label'), /3 of 3/);
await snap('03-win');

// Level 2: make a move, undo it, then use a hint.
await page.click('#next-btn');
await page.waitForFunction(() => window.__game.levelIndex === 1);
const before = await page.evaluate(() => JSON.stringify(window.__game.state));
const sol2 = await page.evaluate(() => window.__game.solution());
await page.keyboard.press(`Arrow${sol2[0][0].toUpperCase()}${sol2[0].slice(1)}`);
await waitIdle();
assert.equal(await page.evaluate(() => window.__game.moves), 1);
await page.click('#undo-btn');
assert.equal(await page.evaluate(() => JSON.stringify(window.__game.state)), before, 'undo restores state');
await page.click('#hint-btn');
await page.waitForSelector('#hint-arrow:not([hidden])');
await snap('04-hint');

// Play levels 2-60 with the keyboard to prove every level is reachable and winnable.
const KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
for (let i = 1; i < 60; i++) {
  await page.waitForFunction((n) => window.__game.levelIndex === n, i);
  const sol = await page.evaluate(() => window.__game.solution());
  assert.ok(sol, `level ${i + 1} solvable in browser`);
  for (const dir of sol) {
    await page.keyboard.press(KEY[dir]);
    await waitIdle();
  }
  await page.waitForSelector('#win:not([hidden])');
  if (i === 45) await snap('05-late-level-win');
  if (i < 59) await page.click('#next-btn');
}
assert.equal(await page.locator('#next-btn').isHidden(), true, 'no Next after the last level');

// Progress survives a reload.
await page.reload();
assert.equal(await page.locator('.level-tile:not(.locked)').count(), 60, 'all levels unlocked after reload');
assert.equal(await page.locator('#home-progress').textContent(), '180 / 180 stars');
await snap('06-home-complete');

// A larger level on screen, for a visual check.
await page.locator('.level-tile').nth(55).click();
await page.waitForSelector('#game:not([hidden])');
await snap('07-level56');
const canvasBox = await page.locator('#board').boundingBox();
const viewport = page.viewportSize();
assert.ok(canvasBox.x >= 0 && canvasBox.x + canvasBox.width <= viewport.width, 'board fits the screen width');
assert.ok(canvasBox.y + canvasBox.height <= viewport.height, 'board fits the screen height');

await browser.close();
assert.deepEqual(errors, [], 'no console or page errors');
console.log('e2e: all checks passed');
