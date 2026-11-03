# Sandstone Kingdom: the game

A tower defense game set in medieval India. Plain JavaScript on an HTML canvas, no
game engine and no build step. It will be wrapped for Android with Capacitor.

## Run it

```bash
cd game
npm run serve          # then open http://localhost:8090 (landscape)
```

## Test it

```bash
npm test               # game rules + a bot that must win every level (and lose if it builds nothing)
npm run devices        # needs `npm run serve` running; checks 7 phone and tablet screen shapes
```

`npm run devices` saves screenshots to `test/screens/` and fails if any button falls off the
screen, the canvas is the wrong size, or the page logs an error.

## Layout

| Folder | What's inside |
|---|---|
| `src/engine/` | Game rules with no drawing: roads (`path.js`), unit and tower stats (`data.js`), levels (`levels.js`), the battle simulation (`game.js`) |
| `src/render/` | Screen fitting (`view.js`), turning art into bitmaps (`raster.js`, `assets.js`), the battlefield (`world.js`) and the HUD and menus (`hud.js`) |
| `src/art/` | The shared drawing code (`art.js`, `ui-art.js`), also used by the concept boards in `docs/style-boards/` |
| `test/` | Rule tests, the test bot, and the device check |

After editing `src/art/`, run `python3 docs/style-boards/build.py` so the concept boards pick up the change.
