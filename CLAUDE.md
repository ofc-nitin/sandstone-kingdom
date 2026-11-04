# Sandstone Kingdom: Tower Defense (handoff notes for Claude sessions)

Read this first in every new session. It says what the game is, how the code is laid out, how
we work, and exactly where the last session stopped.

## The project

- A cartoon tower defense game set in medieval India, by **Samvardhan Studios** (the user is the
  Founder and "boss"; they want a polished, publish-ready game and expect professional game-dev
  judgement, including small realism details nobody asked for).
- Package `com.samvardhanstudios.sandstonekingdom`, for Google Play worldwide: AdMob, in-app
  purchases (IAP) and Play Games.
- **All art is drawn in code** (SVG, rasterized to bitmaps at load). All music and sound is made in
  code with WebAudio, so nothing is copyrighted. Never add third-party art or music.
- Never copy a specific existing game (names, characters, art, levels). The genre and its mechanics
  are fine.
- GitHub repo: `ofc-nitin/sandstone-kingdom` (the old name `AI-Learning` redirects to it).
- Branches: work on `claude/exciting-sagan-dooxr8` and push the same commit to `main` too (the
  user asked for that pattern). CI (`.github/workflows/android.yml`) builds the APK and AAB on push.
- Commit messages: no model names. End them with the session's attribution lines.

## Layout

| Path | What it is |
|---|---|
| `game/src/engine/` | Pure game rules, tested in Node: `game.js` (the Game class), `data.js` (towers, enemies, heroes, spells, power-ups), `levels.js` (roads, build spots, waves), `path.js` |
| `game/src/meta/` | Player profile and economy (`profile.js`: coins, rubies, Royal Forge timed upgrades, heroes, products and IAP grants, daily rewards, challenges), `store.js` |
| `game/src/art/` | All drawings: `art.js` (people, towers, enemies, scenery), `scenes-art.js` (menu, map, Bazaar and Treasury scenes), `ui-art.js` |
| `game/src/render/` | `assets.js` (rasterizes every sprite), `world.js` (battlefield and effects), `hud.js` (in-battle UI), `raster.js`, `view.js` |
| `game/src/ui/screens.js` | Every menu screen and modal |
| `game/src/main.js` | App wiring: screens, battle loop, sound events, `window.__sk` test hooks |
| `game/android/` | Capacitor 8 Android project (native Play Games plugin) |
| `game/test/` | `engine.test.js`, `meta.test.js` (run with `npm test`), `bot.js` (a bot that plays levels), `devices.mjs` (layout check on 7 Android screen shapes) |
| `game/tools/` | Generators and checks: `place-plots.mjs` (writes build spots into levels.js), `prd-doc.mjs` (PRD HTML + PDF), `levels-doc.mjs`, `catalog.mjs`, `balance.mjs`, `shots-screens.mjs`, `shots-battle-fx.mjs` |
| `docs/prd/` | PRD.md plus art bible, levels, screens, tech, QA plan, `alive-ideas.md` (realism backlog with status), generated `Sandstone-Kingdom-PRD.html` / `.pdf` |
| `docs/release-setup.md` | Founder's checklist for signing, Play Console, AdMob, Play Games |

## How to check work

```bash
cd game
npm test                                   # engine + meta tests (63, all must pass)
npm run serve &                            # http://localhost:8090 (python http.server)
node test/devices.mjs <outDir>             # 7 screen shapes, 0 off-screen buttons
node tools/balance.mjs [forgeBonus]        # bot win rates per level, 6 seeds
node tools/shots-screens.mjs <outDir>      # menu, briefing, heroes, treasury, bazaar, battle
node tools/shots-battle-fx.mjs <outDir>    # boss battle with effects
node tools/levels-doc.mjs                  # regenerate docs/prd/levels.md
node tools/prd-doc.mjs                     # regenerate the PRD HTML + PDF (takes a few minutes)
```

Playwright and Chromium are preinstalled at `/opt/node-tools` (the scripts load from there; set
`PW_NODE_PATH` if it moves). Always look at screenshots after visual changes.

- World size is 844×390. The UI scale `u` is fitted to the screen. Tap areas are at least 44 px and stay on screen.
- If you change roads in `levels.js`, run `node tools/place-plots.mjs` to place the build spots again.
  Then re-check balance and the tutorial: it points at spot 0, and spot 3 must be the rubble spot.

Published previews (private links that belong to the user; republish them if the old session's
files are gone, after building the HTML again):
- Playtest: https://claude.ai/artifact/PiGUipAjmQzhdo7GijjEWC (a page that loads `game/src` and `fonts`)
- PRD: https://claude.ai/artifact/Hc7ZyYLruHNtZZpnENKhmU (`node tools/prd-doc.mjs --artifact <file>`)

## Where we are (end of session, 2026-11-04)

Done and pushed (commit `599be9c` and the handoff commit after it):
- Region 1 (6 levels): crossroads, multiple entrances, a self-crossing road, a portal in Level 5,
  and 8 enemy types (including the drummer who buffs, the shield bearer, the saboteur who jams towers, and the Bandit King boss).
- Towers: archer, barracks, mage and cannon, plus 4 special towers (falconer, fountain, alchemist,
  war elephant) with 8 levels each. Specials are bought with rubies or high coin prices and only go
  on special spots. Up to 3 are picked per level (never tell players "up to 3").
- Build spot kinds: open, gold-unlock (rubble) and special (opens by wave or for gold).
- Spots are placed by design (crossings, bends, fort approach, entrances) by `place-plots.mjs`.
- Royal Forge: timed upgrades across 7 tracks × 5 ranks, from 3 minutes to 8 hours.
- Heroes:
  - No hero in Levels 0–1.
  - Sun Knight is free after Level 1.
  - Rani Meera costs coins or rubies; Guru Agastya costs rubies.
  - Maharaja Vikram is IAP only (`hero_vikram`).
- Battle start: double-tap to start, then a continuous wave timer that can be called early.
- Towers and crews aim where they shoot.
- Royal Treasury (real money) is separate from the Royal Bazaar (coins and rubies); both have painted scenes.
- Realism pass (all done; the full list is in `docs/prd/alive-ideas.md`):
  - arcing arrows, stuck arrows, mage bolt trails
  - coins flying to the gold counter
  - fort jolt and heart on a leak, fort smoke and fire at low lives
  - cost and refund floats, sell crumble
  - heavy footstep dust
  - live campfires and ponds
  - boss health bar with the boss's name
  - plus earlier work: live menu, dynamic music, daily popup
- Balance (bot):
  - Levels 0–3 can be won with basic towers.
  - Level 4 needs special towers (5/6 wins).
  - Level 5 needs special towers (6/6 wins with them, 0/6 without).

## Next steps (suggested order; confirm with the user)

1. Have the user playtest Region 1 on a real Android phone (APK from the CI artifacts) and fix what they report.
2. The "next" items in `docs/prd/alive-ideas.md`:
   - boss phases
   - the sage giving hints
   - comic cutscenes before bosses
   - villagers and animals reacting
   - weather per region
   - wounded enemies limping
   - soldiers raising dust when they run
3. Region 2 (levels, enemies, art) after Region 1 is signed off.
4. Release setup with the Founder (`docs/release-setup.md`):
   - real AdMob and product IDs in `game/src/platform/config.js`
   - signing key
   - Play Console listing
