# Sandstone Kingdom: the game

A tower defense game set in medieval India. Plain JavaScript on an HTML canvas, with no game
engine. It is wrapped for Android with Capacitor.

## Run it in a browser

```bash
cd game
npm install
npm run serve          # then open http://localhost:8090 (landscape)
```

In the browser, ads, purchases and Google Play Games are simulated, so every screen can be tried.

## Test it

```bash
npm test               # game rules, meta game (rewards, quests, shop, ads rules), and a bot that must win every level and challenge
npm run devices        # needs `npm run serve` running; checks 7 phone and tablet screen shapes, every screen
```

## Build for Android

GitHub Actions (`.github/workflows/android.yml`) builds on every push and attaches:
- `app-debug.apk`: install it on a phone to test
- `app-release.aab`: upload it to Play Console (signed once the upload-key secrets are set)

Locally, with Android Studio and JDK 21: `npm run android:sync`, then `npm run android:open`.
Everything the Founder sets up (IDs, keys, Play Console) is in [`docs/release-setup.md`](../docs/release-setup.md).

## Layout

| Folder | What's inside |
|---|---|
| `src/engine/` | Game rules with no drawing: roads, unit and tower stats (including royal towers and power-ups), levels with stories and special spots, and the battle simulation (challenge rules, endless waves, revive, workshop bonuses) |
| `src/meta/` | The player profile and the meta game (`profile.js`: coins, rubies, daily login, quests, challenges, achievements, workshop, shop products, ad rules, cloud merge) and saving (`store.js`) |
| `src/platform/` | AdMob, Google Play Billing, Google Play Games, haptics and the back button, with browser stand-ins. IDs go in `config.js` |
| `src/audio/` | Music and sound effects synthesised in code (`sound.js`) |
| `src/ui/` | Every screen outside battle (`screens.js`): main menu, world map, briefing, shop, daily, quests, workshop, achievements, rankings, settings |
| `src/render/` | Screen fitting, art to bitmaps, the battlefield and the battle HUD |
| `src/art/` | All drawing code (`art.js`, `ui-art.js`, `scenes-art.js`), shared with the concept boards in `docs/style-boards/` |
| `android/` | The Capacitor Android project, including the native Play Games plugin (`PlayGamesPlugin.java`) |
| `tools/` | `make-icons.mjs` renders the launcher icons, splash screens and store graphics from the game art |
| `store/` | Play Store icon and feature graphic |
| `test/` | Rule and meta tests, the test bot, and the device check |
