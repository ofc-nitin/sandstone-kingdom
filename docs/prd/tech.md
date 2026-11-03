# Technical design

## Stack
- **Game:** plain JavaScript (ES modules) drawing on an HTML canvas, with no game engine and no bundler.
- **Android:** Capacitor 8 (minSdk 24 / Android 7, target and compile SDK 36, Java 21).
- **Plugins:** `@capacitor-community/admob` (ads + UMP consent), `cordova-plugin-purchase` (Google Play Billing 9),
  our own `PlayGamesPlugin.java` (Play Games Services v2 sign-in, achievements, leaderboards, Saved Games,
  plus Play in-app review), and `@capacitor/app`, `haptics`, `screen-orientation` and `status-bar`.

## Structure (`game/`)

| Part | Files | Notes |
|---|---|---|
| Battle rules | `src/engine/` | Pure and deterministic (seeded random), no DOM, so it runs in Node tests. A fixed 1/60 s step; it sends events to the renderer and the sound |
| Meta game | `src/meta/profile.js`, `store.js` | Pure functions over a JSON profile; saved to localStorage, merged with the cloud save ("furthest progress wins") |
| Platform | `src/platform/` | One interface for ads, billing, Play Games, haptics and lifecycle; browser stand-ins make every screen testable |
| Rendering | `src/render/`, `src/ui/` | Vector art is drawn once into bitmaps at the screen's exact pixel density, then drawn each frame. The HUD and menus are drawn in CSS pixels × `u` (UI scale) from the safe-area edges |
| Art | `src/art/*.js` | All art is SVG built in code, shared with the concept boards |
| Audio | `src/audio/sound.js` | WebAudio synthesis: SFX and generated music |

## Screen fit
`s = min(cssW / 844, cssH / 390)` scales the world without stretching. The background is painted
for the whole visible area, so wide phones and tablets see more scenery. The UI scale is `u = clamp(0.82, 1.6)`,
and the safe area comes from CSS `env(safe-area-inset-*)`.

## Quality gates (every push)
1. `npm test`: 51 tests, covering the rules, the meta game (rewards, quests, daily calendar, purchases, ad rules, cloud
   merge), and a **bot that must win every level and every challenge** while losing if it builds nothing.
2. `npm run devices`: 7 screen shapes; every screen must have all buttons on screen, no errors and the right canvas size.
3. GitHub Actions builds `app-debug.apk` and `app-release.aab` (`.github/workflows/android.yml`).

## Data and IDs
All store and service IDs are in `src/platform/config.js` and `android/app/src/main/res/values/strings.xml`.
They hold Google's test IDs until the Founder adds real ones ([release-setup.md](../release-setup.md)).
Play Games stays off while `game_services_project_id` is `0`.

## Security and anti-cheat
- Purchases are granted once per purchase token, then acknowledged or consumed. Non-consumables restore from Google Play.
- The daily calendar refuses a clock moved back. Leaderboard scores must be possible for the wave reached.
- No secrets in the app; the signing key exists only in GitHub secrets.
