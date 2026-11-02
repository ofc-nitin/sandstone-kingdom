# Visual Direction: making the game look like nobody else's

_Started 2026-11-02. Purpose: decide how our game looks **before** building it, and keep
a list of the "vibecoded" defaults we refuse to use._

## 1. What went wrong with the first prototype

The Gravity Flip Sort prototype looked generic because nearly every choice was a default:

| Default it used | Why it reads as AI-made |
|---|---|
| Dark navy background (#1b1d2a) with slate-grey panels | The standard "dark mode app" look from countless templates |
| Coral + teal + mustard + purple ball colours | The same pastel set AI tools reach for every time |
| Orange → yellow → teal gradient title text | Gradient text on a headline is a top AI tell |
| System font, centred everything | Nothing was chosen; it's what the browser gives you |
| Full-width yellow pill "Play" button | Template call to action |
| 5-column grid of numbered rounded squares for levels | Every AI puzzle game's level select |
| Glossy spheres with a white highlight top-left and an oval shadow | The textbook "3D ball" recipe |
| Checkerboard floor of rounded tiles | Generic grid placeholder |
| "Sorted!" popup with 3 stars and Replay / Next | Copy-paste win screen |
| Unicode ‹ ↻ ← → ★ as icons | No icon design at all |

Rule from now on: **if a choice was not made on purpose, it's a default, and defaults are banned.**

## 2. The "vibecoded" do-not-use list

If any of these show up in our game, it gets redone.

### Colour
- [ ] Dark navy, slate or charcoal backgrounds (#0f172a, #1a1b26, #1e1e2e and their cousins)
- [ ] Purple → blue, pink → orange or orange → teal gradients, especially on text
- [ ] Neon glow and "cyberpunk" cyan/magenta
- [ ] Tailwind default palette colours (indigo-500, emerald-400, slate-800…) used as-is
- [ ] Coral / teal / mustard / lavender "friendly pastel" sets
- [ ] One bright accent (yellow or purple) on an otherwise grey UI
- [ ] Glassmorphism: frosted blurred panels with thin white borders
- [ ] Pure #000000 or #ffffff as the main colours with no tint

### Typography
- [ ] System font, Inter, Roboto, Poppins, Montserrat, Nunito or Open Sans
- [ ] "Playful" defaults: Fredoka, Baloo, Lilita One, Luckiest Guy, Bubblegum
- [ ] Gradient-filled headline text
- [ ] Small ALL-CAPS letter-spaced section labels ("LEVELS", "SETTINGS")
- [ ] Two-beat taglines ("Tilt the board. Sort the balls.")
- [ ] Everything centred and the same weight

### Layout
- [ ] Single centred column with everything stacked
- [ ] Equal rounded corners on every element (the "rounded-2xl everywhere" look)
- [ ] Even spacing everywhere with no rhythm or tension
- [ ] Header with a round back button left, title centre, round icon button right
- [ ] Two equal-width buttons pinned to the bottom (Undo / Hint)
- [ ] Perfect symmetry on every screen

### Components and icons
- [ ] Pill-shaped buttons, especially full-width yellow/purple ones
- [ ] Unicode characters or emoji used as icons (‹ ↻ ★ → 🎉 🔥 💡)
- [ ] Stock icon sets used unedited (Lucide, Heroicons, Material, Font Awesome)
- [ ] Centred modal card with title, 3 stars and two buttons
- [ ] Toast messages that slide in at the bottom
- [ ] iOS-style toggle switches in settings
- [ ] "X / Y stars" progress counters
- [ ] Circular progress rings and percentage bars as decoration

### Effects and motion
- [ ] Radial-gradient "glossy sphere" with a white highlight top-left
- [ ] Soft oval drop shadow under every object
- [ ] Outer glow / bloom on buttons and pieces
- [ ] Scale-to-0.97 press effect on every button
- [ ] Pop-in modal (scale 0.85 → 1 with fade)
- [ ] Pulsing hint indicators
- [ ] Confetti bursts and generic sparkle particles
- [ ] Screen shake for every event
- [ ] Ease-out-cubic on everything (same timing curve for all motion)

### Game-specific clichés
- [ ] 3-star rating per level
- [ ] Numbered square level-select grid
- [ ] Win words: "Awesome!", "Level Complete!", "Sorted!", "Perfect!", "Great Job!"
- [ ] "Moves: N · Best: N" counter in the header
- [ ] The Undo / Hint / Restart button trio
- [ ] Big arrow overlay as a hint
- [ ] Checkerboard or plain grid tiles as the board
- [ ] Pieces that are just coloured circles or squares with no character
- [ ] Lock icon over greyed-out future levels
- [ ] Daily reward calendar with 7 boxes

### Writing (copy)
- [ ] Exclamation-mark praise everywhere
- [ ] "Can you do it in N moves?", "More levels coming soon!"
- [ ] Words like unleash, embark, journey, elevate, seamless, immersive, epic
- [ ] Em dashes all over the UI text
- [ ] Tutorials that explain instead of letting the player discover

### Sound
- [ ] Stock "pop", "ding" and "whoosh" sounds
- [ ] Generic upbeat ukulele / marimba casual loop
- [ ] The same success chime for every win

### AI-generated art tells (if we use image generators)
- [ ] Over-smooth "cute 3D" Pixar-like characters
- [ ] Glossy plastic look on everything
- [ ] Inconsistent details between images (hands, edges, line weight changing)
- [ ] Busy backgrounds with meaningless detail
- [ ] Every asset in a different style

### Branding and store listing
- [ ] Icon = gameplay pieces on a dark rounded square
- [ ] Name formula "Adjective + Noun + Verb" (Gravity Flip Sort)
- [ ] Store screenshots in stacked phone mock-ups with gradient banners
- [ ] Gradient logo text

## 3. What makes a game look made by a person instead

1. **One strong constraint.** A limited palette, one material (paper, clay, ink) or one
   era. Constraints force decisions, and decisions are what look unique.
2. **UI that lives in the world.** Buttons, menus and scores belong to the world itself:
   a stamp, a lever, a page, a chalk mark, rather than floating app widgets.
3. **Texture and imperfection.** Grain, wobble, misprints and hand-drawn lines.
4. **Characters and a world.** Even a puzzle needs a "who" and a "where".
5. **Our own lettering.** A distinctive typeface, or hand-made lettering for the logo.
6. **Signature motion and sound.** One recognisable way things move and sound.

## 4. Visual directions to choose from

Each one works for any puzzle or casual game. "Code-drawn" means AI can make every
asset in code (fully AI-built, consistent). "Needs generated art" means it relies on AI
image generation or an illustrator, which is harder to keep consistent.

| # | Direction | What it looks like | How the UI works | Uniqueness on Play Store | Fully AI-buildable? |
|---|---|---|---|---|---|
| 1 | **Risograph print** | Off-white paper, 2–3 spot inks (e.g. fluorescent pink + blue), visible grain, slightly misaligned colour layers | Menus look like printed zines and posters; buttons are stamped labels | High; very few games use it | ✅ Code-drawn |
| 2 | **Folk art (Warli / Madhubani / Gond)** | Earthy backgrounds, white or ink line patterns, dense borders, stylised people and animals | Menus framed with painted borders; levels as scenes in a mural | Very high; almost no casual games use it, and it fits a Sanskrit studio name (Samvardhana) | ✅ Warli is geometric and code-drawable; Madhubani/Gond are harder |
| 3 | **Cut paper / papercraft** | Layered paper with real shadows, torn edges, visible fibres | Menus are paper tabs and cards you flip and slide | Medium–high | ✅ Mostly code-drawn (SVG + texture) |
| 4 | **1-bit / handheld retro** | 2–4 colours only, crisp pixels, dithering | UI looks like an old handheld device screen | Medium; there is a known niche | ✅ Code-drawn |
| 5 | **Blueprint / technical drawing** | Blue paper, white construction lines, measurements and annotations | UI as drawing notes, stamps and margin scribbles | High | ✅ Code-drawn |
| 6 | **Tabletop object** | The game is a physical toy: wood, brass, felt, an old arcade machine | Real-looking levers, dials and counters do the UI | High, but the art must be excellent | ⚠️ Needs generated art |
| 7 | **Claymation** | Chunky plasticine with fingerprints and squash-and-stretch | UI made of clay pieces | High | ⚠️ Needs generated art; hard to keep consistent |
| 8 | **Ink and watercolour storybook** | Washes of colour, ink lines, a page-turning story | Menus are pages; progress is a book | Medium–high | ⚠️ Needs generated art |

**My recommendation:** **#2 Folk art (Warli style)** or **#1 Risograph**. Both are rare
in mobile games, both can be built entirely in code (so you really do only test), and
both make every screen, including the menus, look like nothing else in the store.

## 5. Option: free pre-made assets

Free asset packs are a valid shortcut. They give us real, hand-made art and sound, and
they look more consistent than AI-generated images. The catch is that popular packs are
used in thousands of games, so used as-is they become their own "seen it before" tell.

### Where to get them (free for commercial use; check each pack's licence)

| Source | What | Usual licence |
|---|---|---|
| [Kenney.nl](https://kenney.nl) | 2D/3D sprites, UI, icons, sounds | CC0 (no credit needed) |
| [itch.io free game assets](https://itch.io/game-assets/free) | Huge variety of art styles | Varies per pack: read each one |
| [OpenGameArt.org](https://opengameart.org) | Sprites, tiles, music, sounds | Mixed: CC0, CC-BY, GPL |
| [Quaternius](https://quaternius.com) | Low-poly 3D models | CC0 |
| [game-icons.net](https://game-icons.net) | 4,000+ game icons | CC BY 3.0 (credit needed) |
| [Google Fonts](https://fonts.google.com) | Fonts | OFL (free for commercial use) |
| [Freesound.org](https://freesound.org) | Sound effects | Mixed: avoid "NonCommercial" |
| [Pixabay](https://pixabay.com/music/) | Music and sound effects | Pixabay licence (free, no credit) |

**Licence rules for a Play Store game:** CC0 is safest. CC-BY is fine if we credit the
author in the game's credits screen. **Never use "NC" (NonCommercial) or "personal use
only" assets**, because our game makes money. We keep a `CREDITS.md` file that lists
every asset, its source and its licence.

### How to keep pre-made assets from looking generic
- **Choose less-known packs.** Kenney's most popular packs are instantly recognisable.
- **One style only.** Never mix packs from different artists on the same screen.
- **Repaint with our own palette.** AI can recolour sprites in code to fit our look.
- **Add our own layer.** Paper grain, print texture, custom borders, our own font and
  logo on top of the pack.
- **Use the pack for pieces, and make the UI and branding ourselves.** The icon,
  logo, menus and win moments are what players remember, so those must be ours.

## 6. Next decisions (in order)

1. Pick 1–2 visual directions → I make a style board (palette, type, sample screen) for each.
2. Pick the game mechanic, choosing one that suits the chosen look.
3. Name the game and design the icon in that style.
4. Only then build.
