# Sandstone Kingdom: Game Design Document

_Version 0.2 · 2026-11-03 · Owner: Founder (decisions) + AI (design and build)_
_Name: **Sandstone Kingdom: Tower Defense** (confirmed). Package: `com.samvardhanstudios.sandstonekingdom`._

**Founder decisions (2026-11-03):** name confirmed · art made only in code or with free tools · music must be free of copyright (CC0 / royalty-free) · prices affordable in India and worldwide · challenges pay rubies only · a dedicated tutorial level · privacy, age rating, `ads.txt` and `app-ads.txt` live on the website · live events and the updates roadmap come in later versions.

---

## 1. The pitch

A hand-painted tower defense journey across six regions of India, through the **six
Indian seasons** (the *ritus*). Every region changes how you play: summer sandstorms,
monsoon rain, harvest-moon nights, winter fog, mountain snow. Defend sandstone forts,
lead the Sun Knight, defeat six legendary bosses and restore the shattered Sun Crown.

**What makes it memorable:**
1. **The seasons change the rules.** Each region has its own weather mechanic, so
   it never feels like the same level again.
2. **A real story with a hero you care about**, told in short comic-style cutscenes.
3. **Boss fights with personality**: name cards, music stings and multi-phase attacks.
4. **A world players don't see in other games**: stepwells, banyan trees, peacocks,
   sandstone forts and mangrove rivers, all inspired by real Indian places.
5. **Secrets in every level**: tap the peacock, light the shrine lamp, find the lost
   scrolls. Hidden achievements reward curious players.

---

## 2. Story

### Setting
The fictional kingdom of **Suryagarh** ("Sun Fort") is protected by the **Sun Crown**.
Its six **Season Gems** keep the year in balance.

### Characters

| Character | Role |
|---|---|
| **The Sun Knight** | The hero. Young captain of the fort guard, brave and a bit reckless. Player-controlled on the battlefield. |
| **The Royal Sage** | Old mentor who explains the seasons and gives the tutorial. Wise, dry humour. |
| **Princess Tara** | Heir to Suryagarh. Leads the defence of the capital; becomes a playable hero in Region 4. |
| **The Shadow Emperor** | Villain from beyond the mountains. Shatters the Sun Crown and gives each Season Gem to a monster or warlord. |
| **The six bosses** | Each guards one Season Gem (see section 3). |

### Story beats (8 cutscenes, all skippable, under 3 minutes in total)
1. **Prologue:** a festival at Suryagarh. The Shadow Emperor appears, shatters the Sun
   Crown, and the six gems scatter across the land. The seasons go wild.
2. **Region 1 intro:** bandits raid the Aravalli villages. The Sage sends the Sun
   Knight out with a handful of archers.
3. **Region 2 intro:** the Thar desert burns in an endless summer.
4. **Region 3 intro:** a monsoon that never stops floods the Western Ghats.
5. **Region 4 intro:** the Deccan harvest moon will not set. Princess Tara joins.
6. **Region 5 intro:** a strange fog swallows the Sundarbans.
7. **Region 6 intro:** the Himalayan winter march to the Shadow Emperor's fortress.
8. **Ending:** the Sun Crown is restored, the seasons return, and the festival resumes.
   A hint of a new threat sets up future updates.

**Cutscene style:** illustrated comic panels with gentle pan and zoom, parallax layers,
text bubbles (fully translated, no voice acting at launch), and a music sting. Each boss
also gets a 3-second **intro card**: name, title, a one-line taunt, and a camera shake.

---

## 3. World: six regions × five levels = 30 levels

Every region has 4 normal levels and **1 boss level (level 5)**. Beating a region's boss
**unlocks that region's Endless mode**.

**Level 0, Training Grounds (tutorial):** before Region 1, a short level in the fort
courtyard. The Royal Sage teaches by doing: build a tower, upgrade it, move the hero,
cast a spell, and call a wave early. It takes about 3 minutes, can be skipped, and can be
replayed from Settings.

Enemy art for every region: [`style-boards/enemies.png`](style-boards/enemies.png).

| # | Region (inspired by) | Season | Weather mechanic | New enemies | Boss (level 5) | Hero unlocked |
|---|---|---|---|---|---|---|
| 1 | **Aravalli Hills** (Rajasthan) | **Vasant**, spring | None. Teaching region: learn towers, hero, spells | Bandits, Wolf Riders, Barbarians | **The Bandit King**: rides a war-boar, throws fire pots, calls bandit waves | The Sun Knight (start) |
| 2 | **Thar Desert** | **Grishma**, summer | **Sandstorms** shrink tower range for a few seconds; **mirages** show fake enemies | Scorpion Swarms, Camel Raiders, Sand Burrowers (go underground) | **The Dune Colossus**: a sand giant that splits into smaller golems when hit | The Royal Archer |
| 3 | **Western Ghats** | **Varsha**, monsoon | **Rain** slows enemies but douses fire attacks; **floods** open a second path mid-level | River Raiders on boats, Mud Brutes, Storm Bats (flying) | **The Storm Serpent**: flies over the map and breathes lightning at towers | The Monsoon Sage |
| 4 | **Deccan Ruins** (Hampi-inspired) | **Sharad**, autumn | **Harvest-moon nights**: darkness hides enemies outside lit areas; light braziers to see | Stone Golems (magic only), Night Stalkers, Shamans | **The Stone Titan**: wakes up the ruins and throws boulders | Princess Tara |
| 5 | **Sundarbans Delta** | **Hemant**, pre-winter | **Fog** hides incoming waves; **tides** change water paths; enemies come by land *and* river | Crocodiles, River Pirates, Swamp Witches | **The Crocodile Warlord**: dives underwater, ambushes from new paths | The Mangrove Ranger |
| 6 | **Himalayas** | **Shishir**, winter | **Frost** slows your towers' fire rate; **avalanches** block paths; snow covers build plots | Ice Wolves, Frost Mages, Yeti Brutes | **The Shadow Emperor** (final): 3 phases, steals a tower each phase, summons all past bosses as shadows | The Snow Leopard Guard |

### Every level gets harder, and new enemies keep arriving

- **One new enemy (or more) in almost every level.** When it first appears, the game
  pauses for a moment and shows a short "New enemy!" card with its art, name, weakness
  and a one-line lore note, and adds it to the Encyclopedia.
- **36 enemy types** in the campaign: per region, 3 core enemies, 2 elites and a boss.
  Earlier enemies keep returning in later regions, mixed with the new ones.
- **Each level is tougher than the last:** enemies have about 12% more health per level,
  waves get longer (6 waves in level 1, up to 15 in boss levels), later levels add a
  second entrance, more build spots start locked, and starting gold gets tighter.

| Region | Core enemies | Elites | Boss | Level-by-level introductions |
|---|---|---|---|---|
| 1 Aravalli Hills | Bandit, Wolf Rider, Barbarian | Bandit Archer (shoots soldiers), Armored Brute | Bandit King | L1 Bandit · L2 Wolf Rider · L3 Barbarian · L4 Bandit Archer, Armored Brute · L5 boss |
| 2 Thar Desert | Scorpion Swarm, Camel Raider, Sand Burrower | Desert Shaman (heals, casts mirages), War Elephant | Dune Colossus | L6 Scorpions · L7 Camel Raider · L8 Sand Burrower · L9 Shaman, War Elephant · L10 boss |
| 3 Western Ghats | River Raider, Mud Brute, Storm Bat | Thunder Drummer (speeds up enemies), Boar Rider | Storm Serpent | L11 River Raider · L12 Mud Brute · L13 Storm Bat · L14 Drummer, Boar Rider · L15 boss |
| 4 Deccan Ruins | Stone Golem, Night Stalker, Shaman | Golem Sentinel (huge armour), Night Archer | Stone Titan | L16 Golem · L17 Night Stalker · L18 Shaman · L19 Sentinel, Night Archer · L20 boss |
| 5 Sundarbans | Crocodile, River Pirate, Swamp Witch | Pirate Captain (boosts pirates), Giant Turtle (carries raiders across water) | Crocodile Warlord | L21 Crocodile · L22 Pirate · L23 Witch · L24 Captain, Turtle · L25 boss |
| 6 Himalayas | Ice Wolf, Frost Mage, Yeti Brute | Frost Giant, Shadow Knight | Shadow Emperor | L26 Ice Wolf · L27 Frost Mage · L28 Yeti · L29 Frost Giant, Shadow Knight · L30 final boss |

### Build spots: some start locked

Every map has open build spots plus a few **locked** ones, which are more common in later levels:
- **Rubble spots** (covered in rocks and bushes): tap and pay **battle gold** to clear
  them (40, then 60, then 80 for each further spot in that level).
- **Timed spots** (a sundial icon): they clear by themselves after a set number of
  waves, for example "opens after wave 4".
- **Royal spots** (gold-edged, rare): give towers +15% range, but cost more to clear.

Planning which spots to open first becomes part of the strategy.

### Difficulty curve
- Region 1 teaches. Every later region introduces one new weather mechanic, 3 new
  enemies and one new hero.
- Each level has **3 Diya rating** (lamps instead of stars): win = 1, lose ≤ 5 lives =
  2, lose no lives = 3.
- **Map challenges pay rubies only, never coins.** Once a level is beaten, its map
  unlocks 1–2 special challenges written for that map (for example "keep the bandits
  away from the stepwell", "win with only Archer Towers", "win in under 4 minutes"), plus
  the two standard modes: **Heroic** (one life, extra waves) and **Iron** (one tower
  type only). About 90 challenges in total, each paying a one-time ruby reward.
- **Difficulty setting:** Casual / Normal / Veteran (more enemy health, fewer coins).

### Level naming (example, Region 1)
1. Village at the Pass · 2. The Stepwell Road · 3. Banyan Crossing · 4. The Old Watchtower ·
5. **BOSS: The Bandit King's Camp**

### Endless mode
- Unlocked per region by beating its boss: 6 endless maps.
- Waves get harder forever. Every 10 waves brings a mini-boss and a "season shift"
  (weather changes).
- The score is the waves survived plus bonuses. It feeds the leaderboards (section 7).
- **Weekly Challenge** (from v1.5): one endless map with special rules, the same for
  everyone that week.

---

## 4. Towers, heroes, spells

### Towers (4 types × 3 tiers + 2 specialisations at tier 3)

| Tower | Tier 1 → 2 → 3 | Tier 3 specialisations (choose one) |
|---|---|---|
| Archer Tower | Archers → Marksmen → Royal Longbows | **Fire Arrows** (burn) or **Eagle Eye** (huge range, critical hits) |
| Barracks | Spearmen → Knights → Holy Knights | **Sun Guard** (heal over time) or **Elephant Corps** (one war elephant that tramples) |
| Mage Tower | Magic Caster → Arcane Sage → Sun Mage | **Lightning Sage** (chain lightning) or **Time Sage** (slows everything) |
| Cannon Tower | Cannon → Bombard → Thunder Cannon | **Rocket Battery** (Mysore-rocket inspired, long range) or **Mortar** (huge splash) |

### Royal towers: unlocked with rubies

Four special towers, unlocked **once, permanently** in the shop or the Royal Workshop
with rubies, then usable in every level. They are side-grades that add new tactics, not
must-haves. Each can also be earned free by mastering a region (all 3 diyas), so the
game stays fair for players who never pay.

| Royal tower | Rubies | Free unlock | What it does |
|---|---|---|---|
| **Royal Falconer** | 400 | 3 diyas on all of Region 2 | Falcons hunt flying enemies and mark targets for extra damage |
| **Stepwell Fountain** | 500 | 3 diyas on all of Region 3 | Slows enemies in its water and heals nearby soldiers |
| **Alchemist's Workshop** | 650 | 3 diyas on all of Region 4 | Throws poison clouds that weaken armour |
| **War Elephant Stable** | 800 | 3 diyas on all of Region 5 | A war elephant patrols the road, trampling groups |

### Heroes
- One hero per level, controlled by tapping on the map.
- Each hero has 2 active skills, a passive and a level cap of 20. Heroes gain XP from playing.
- 6 heroes at launch: one per region, unlocked by story progress. Premium hero skins
  are cosmetic only.

### Spells (bottom-right buttons, with cooldowns)
**Arrow Rain** (damage area) · **Reinforcements** (call 2 soldiers) · **Holy Fire**
(burn and stun). Later regions unlock seasonal spells, such as **Monsoon Burst**
(slow everything).

### Meta progression: the Royal Workshop
Diyas earned in levels are spent in a skill tree (towers, spells, hero) that gives
permanent bonuses. You can reset it for free at any time.

---

## 5. Economy and shop

### Currencies

| Currency | Earned by | Used for |
|---|---|---|
| **Battle gold** (in-level only, resets each level) | Defeating enemies, calling waves early | Building and upgrading towers during that level |
| **Coins** | Winning campaign levels, daily login | Hero levels, Royal Workshop upgrades, power-ups |
| **Diyas** (rating lamps) | Level ratings (1–3 per level) | Unlocking Royal Workshop tiers |
| **Rubies** (premium) | **Map challenges and daily quests (rubies only)**, achievements, daily login, rewarded ads; or purchase | Heroes, cosmetics, extra power-ups, skips |

### Shop: affordable in India, fair worldwide

Google Play lets us set a **separate price for each country**. India gets prices well
below a straight dollar conversion, so a purchase costs about the same as a cup of chai
or a snack. Other countries use Play's local pricing templates, which adjust for each
market (for example Indonesia, Brazil and Turkey are priced lower than the US).

| Item | India | USA (reference) | Contents |
|---|---|---|---|
| **Starter Pack** (one-time) | **₹49** | $1.99 | 150 rubies + Sun Knight skin + 3 power-ups. Offered once after Level 5. |
| Ruby Handful | **₹29** | $0.99 | 80 rubies |
| Ruby Pouch | **₹99** | $2.99 | 300 + 30 bonus rubies |
| Ruby Chest | **₹199** | $5.99 | 700 + 100 bonus rubies |
| Ruby Vault | **₹449** | $11.99 | 1,600 + 300 bonus rubies |
| Ruby Treasury | **₹999** | $24.99 | 4,000 + 1,000 bonus rubies |
| **Remove Ads** | **₹99** | $2.99 | Removes interstitials and banners forever. Optional rewarded ads stay. |
| Hero Bundle | **₹149** | $3.99 | An early hero unlock + skin (heroes also unlock free through the story) |
| Skins | **₹79** | $1.99 | One tower or hero skin (also buyable with rubies) |

Power-ups (Extra Lives, Gold Boost, Freeze Bomb) are bought with coins or rubies and
are limited per level. The final prices are set in Play Console, which shows Google's
allowed price range for each country.

**Fair-play rules:** the whole campaign is beatable without paying. There are no random
loot boxes; all chests show their contents, which keeps us clear of loot-box rules (e.g. Belgium's ban) and
future regulation. No energy or stamina system.

### Ads (AdMob)
- **Rewarded:** double level rewards, revive once (+5 lives), a free power-up,
  extra daily chest. Always optional.
- **Interstitial:** between levels only, never before level 4, at most every 3 minutes,
  never right after a loss.
- **Banner:** menus only.

---

## 6. Daily login, quests and notifications

### Daily login: works for everyone, no sign-in needed
- A 7-day reward calendar: coins, rubies, power-ups, hero XP. **Day 7 is a big chest
  with fixed contents.** The calendar works fully offline for guests.
- **Guest players (not signed in):** progress is saved on the phone. The streak breaks
  if the game is reinstalled.
- **Signed in with Google Play Games:** the streak and all progress are cloud-saved
  across phones, plus a **+20% login bonus** and leaderboard ranking. This is the
  reason to sign in.
- **Anti-cheat:** the game checks the device clock against Google's time when online,
  so moving the phone's clock forward doesn't skip days.

### Daily quests
Three per day (e.g. "win 2 levels using only Archer Towers", "defeat 50 Wolf Riders"),
each paying **rubies only**. A bonus chest unlocks when all three are done.

### Notifications (opt-in, never spammy)
"Your daily reward is ready" (once a day at most) and, from v1.5, "the Weekly Challenge has started".

---

## 7. Achievements and leaderboards (Google Play Games Services)

### Achievements (32 at launch)

| Type | Examples |
|---|---|
| Story (6) | *Spring Returns* (beat the Bandit King) … *The Sun Rises Again* (beat the Shadow Emperor) |
| Mastery (8) | *Lamplighter* (3 diyas on every Region 1 level), *Perfect Year* (3 diyas on all 30) |
| Challenge (6) | *Iron Will* (beat any Iron challenge), *Untouchable* (win a boss level losing no lives) |
| Towers (4) | *Thunder Lord* (upgrade a Thunder Cannon), *Full Arsenal* (use every specialisation) |
| Heroes (3) | *Sun Knight Rising* (hero level 10) … |
| Endless (3) | *Survivor* (wave 25), *Legend of the Seasons* (wave 100) |
| **Secret (2)** | *Peacock Whisperer* (tap the peacock 10 times), *Keeper of Lamps* (light every shrine lamp) |

### Leaderboards
- **8 leaderboards:** Endless score for each of the 6 regions, Total Diyas, and the
  Weekly Challenge.
- **Signed-in players** submit scores to Google Play Games leaderboards.
- **Guest players can still see the endless rankings.** Google Play Games only shows
  leaderboards to signed-in players, so we also keep a small **public top-100 copy** on
  Firebase (free tier). Guests see that list with a "Sign in to get ranked" button.
- **Anti-cheat:** reject impossible scores (above the maximum for the wave count),
  submit only from completed runs, and use Google Play Games' built-in tamper flags.

---

## 8. Screens and UI

**Flow:** splash → loading (with tips) → **main menu** → **world map** (6 region
medallions on an illustrated journey route) → level card (diyas, challenges, start) →
battle → victory/defeat → back to the map.

| Screen | Contents |
|---|---|
| Main menu | Animated fort at sunrise, logo, Play, Endless, Heroes, Shop; corner buttons for Settings, Achievements, Leaderboards, Daily reward |
| World map | Illustrated journey route through the 6 regions, season icon per region, level nodes with diyas, boss nodes, and a lock on unbeaten regions |
| Battle HUD | Lives, coins, wave counter, speed ×2, pause, hero portrait with health, 3 spells, build menu, and a "call next wave early" button for bonus coins |
| Heroes | Hero gallery, skills, level, skins |
| Royal Workshop | Skill tree |
| Shop | Offers, ruby packs, skins, Remove Ads, Restore Purchases |
| Encyclopedia | Every tower and enemy with art, stats and a lore line. It fills as you meet them, which players love collecting. |
| Settings | Music, sound effects, haptics, language, graphics quality (Low/Medium/High), battery saver (30 fps), colourblind mode, text size, notifications, Google Play sign-in/out, privacy and consent, credits, support/FAQ, delete my data |

**UI art style:** carved sandstone and gold-trimmed buttons with jewel centres,
parchment panels with gold corner filigree, ribbon title banners and lotus finials.
See [`style-boards/ui-kit.png`](style-boards/ui-kit.png).

---

## 9. Audio
- **Music:** an Indian-classical-inspired orchestral soundtrack, with **one theme per
  season**: bansuri flute (spring), desert sarangi (summer), rain on tabla (monsoon),
  festival shehnai (autumn), misty santoor (pre-winter) and a deep Himalayan horn
  (winter). One memorable **Sun Crown motif** recurs in the menu, victories and the
  ending.
- **Sound effects:** distinct sounds for every tower type, boss roars, the coin
  "chink", and a *dhol* drum hit when a wave starts.
- **Source: free and copyright-free only.** In order of preference:
  1. **CC0 (public domain)**: OpenGameArt.org and Freesound.org tracks marked CC0. No
     credit needed, no strings attached.
  2. **Royalty-free licences that allow commercial games**: Pixabay Music and Sound
     Effects (free, no credit required; check each track's page), and CC-BY tracks such
     as Kevin MacLeod's (free, but the composer must be credited in-game).
  3. **Made in code:** sound effects (arrows, coins, hits, explosions) generated with the
     free jsfxr tool, and simple drum loops (dhol, tabla patterns) synthesised in code.
  - Never use "NonCommercial" (CC-NC) tracks or YouTube "no copyright" music without a
    clear licence page.
- Every track and sound is listed in `CREDITS.md` with its source link and licence.
- Indian-instrument music in CC0 libraries is limited, so the season themes may combine
  free instrument samples (e.g. CC0 sitar, flute and tabla recordings) into our own loops.

---

## 9b. Works properly on every Android device

The game must look right on every phone and tablet, not just one.

| Rule | How |
|---|---|
| Landscape only | Locked to landscape, so layouts never flip |
| No zoomed or squashed screens | The battlefield is drawn at a fixed design size (844 × 390) and scaled to fit the screen **without stretching**. Phones wider than that see extra scenery at the sides; tablets (4:3) see extra scenery above and below. Nothing important is ever cut off. |
| UI pinned to screen edges | HUD, buttons and menus are positioned from the real screen corners, not the battlefield, so they are always reachable and never pushed off-screen |
| Notches and rounded corners | Android safe-area insets are respected, so nothing hides behind a camera cut-out |
| Sharp on every screen | Drawing uses the phone's real pixel density (up to 3×), so art is crisp, not blurry |
| Touch targets | Every button and build spot is at least 44 × 44 points, so it is easy to tap even on small phones |
| Text size | Settings offer three text sizes; text never overflows its box (it shrinks to fit) |
| Checked automatically | Every build is screenshot on a range of screen sizes (small and large phones, 20:9 tall phones, tablets) to catch layout problems before players see them |

---

## 10. Technical

| Topic | Plan |
|---|---|
| Engine | Our own small 2D engine on the **HTML Canvas** (no third-party game engine needed for this many sprites), inside **Capacitor** for Android. Game rules are kept separate from drawing so they can be tested automatically. |
| Art pipeline | All art drawn in code as vector (SVG), then rendered to sprite sheets at build time for speed; UI and effects stay live in code (section 11) |
| Saving | Autosave on the phone after every level; **cloud save via Play Games Saved Games** when signed in, with conflict handling (keep the furthest progress) |
| Offline | The whole campaign works offline. Ads, the shop, leaderboards and cloud save need a connection. |
| Performance | 60 fps on mid-range and 30 fps on low-end (2 GB RAM, Android 8+); first download < 150 MB; regions download on demand if needed |
| Tuning | Firebase Remote Config, so balance (enemy health, prices) can change without an app update |
| Analytics | Firebase Analytics: level start/win/lose, where players quit, purchases, ad views |
| Store integration | AdMob + Google consent tool (UMP) · Google Play Billing for purchases · Google Play Games Services v2 (sign-in, achievements, leaderboards, saved games) · Play In-App Review prompt after the first boss win |
| Plugins (to verify) | `@capacitor-community/admob`, a Play Games plugin (e.g. `@openforge/capacitor-game-connect`), and `cordova-plugin-purchase` for billing. Where a plugin falls short, we write a small native Android bridge. |

---

## 11. Art: made only in code or with free tools

**Founder decision:** no paid tools or artists. All art is drawn in code, the way the
concept boards are, and pushed as far as code can go.

**How we make code art look richer and more "painted":**
- **Layered shading** on every shape: base colour, shadow side, light side, rim light and
  highlights, with soft cast shadows on the ground.
- **Textures generated in code** (SVG noise filters) for stone, sand, wood, cloth, fur and
  water, so surfaces don't look flat.
- **Lighting per region**: warm spring sun, harsh desert noon, grey monsoon light, blue
  moonlit nights, misty delta mornings and cold mountain light.
- **Effects**: bloom on magic and fire, smoke, dust, rain, snow, fog, sparks, all animated.
- **Performance**: each character and building is drawn once, rendered to an image
  (sprite sheet) at build time, and the game draws those images. That gives smooth
  60 fps even on cheap phones.

**Free tools you can use if you ever want to touch up art yourself (optional):**
Inkscape (vector editing), Krita (painting) and Blender (3D renders), all free and
open source. Nothing in the plan depends on them.

**Honest note:** code art will look clean, colourful and consistent, but it will not
look like hand-painted art from a big studio. The concept boards show the real ceiling.

---

## 12. Other areas (Founder asked AI to decide)

| Area | Decision |
|---|---|
| **Tutorial** | Level 0 "Training Grounds" plus short tips in levels 1–3 (section 3). No walls of text. |
| **Accessibility** | Colourblind mode (enemy shapes and outlines, not only colour), 3 text sizes, reduced motion, haptics on/off, everything playable with one thumb, pause anywhere. |
| **Languages** | **Launch with 8:** English, Hindi, Spanish, Portuguese (Brazil), Indonesian, French, German, Russian. **Next:** Bengali, Tamil, Telugu, Marathi, Turkish, Japanese, Korean, Vietnamese. All text lives in translation files from day one; machine translation reviewed by native speakers where possible. |
| **Privacy, age rating, ads.txt** | Handled on the **website** (separate branch): privacy policy, terms, data deletion page, `app-ads.txt` and `ads.txt`. In the game: Google's consent screen (UMP) for EU/UK, target age 13+, and a "Privacy" link in Settings. |
| **Cultural care** | No real gods, religions, communities or kingdoms as villains. Regions are *inspired by* real places. Names, costumes and symbols reviewed for respect before each region ships. |
| **India map law** | **We will not draw an outline of India or its borders.** The world map is an illustrated journey route, not a political map. |
| **Rate the game** | Google's in-app review prompt after the first boss win, never during play. |
| **Support** | FAQ, contact email and "Restore purchases" in Settings. |
| **Store assets** | Icon 512×512, feature graphic 1024×500 (the splash art), 8 screenshots, a 30-second trailer recorded from the game; store text in all launch languages. |
| **Quality checks** | Bots auto-play every level after each change, unit tests for game rules, a crash and slow-frame check on a cheap and a mid-range phone, and Firebase Crashlytics after launch. |

---

## 12b. Later versions (after launch)

| Version | Content |
|---|---|
| v1.1 – v1.3 | Regions 4–6, one per month, ending with the Shadow Emperor |
| v1.4 | **Live events**: Holi (colour spells, March), Monsoon Week, Diwali (lamp-lighting level, Oct/Nov), New Year; each with special levels and cosmetics |
| v1.5 | Weekly Challenge (endless map with special rules) |
| v1.6 | Royal Pass (free and paid reward tracks, cosmetics only) |
| v2.0 | New region (Northeast India: hill tea gardens and misty forests), new heroes and towers |

---

## 13. Release strategy (recommended)

Building all 30 levels before launch delays any income and feedback. Instead:

| Release | Content | Why |
|---|---|---|
| **Closed test** (12 testers × 14 days) | Regions 1–2 (10 levels, 2 bosses) | Google Play requirement and early feedback |
| **v1.0 global launch** | Regions 1–3 (15 levels, 3 bosses, 3 endless), shop, daily login, achievements, leaderboards | Enough for days of play; start earning and learning |
| v1.1 and later | +1 region per month, then live events and new features (section 12b) | Regular updates keep players and improve store ranking |

**Rough timeline:** v1.0 in about 10–14 weeks; the full 30 levels about 3 months after
that. These are estimates.
