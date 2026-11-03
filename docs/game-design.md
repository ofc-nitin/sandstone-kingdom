# Sandstone Kingdom: Game Design Document

_Version 0.1 · 2026-11-03 · Owner: Founder (decisions) + AI (design and build)_
_Working title: **Sandstone Kingdom: Tower Defense**. Package: `com.samvardhanstudios.sandstonekingdom` (name not final)._

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

| # | Region (inspired by) | Season | Weather mechanic | New enemies | Boss (level 5) | Hero unlocked |
|---|---|---|---|---|---|---|
| 1 | **Aravalli Hills** (Rajasthan) | **Vasant**, spring | None. Teaching region: learn towers, hero, spells | Bandits, Wolf Riders, Barbarians | **The Bandit King**: rides a war-boar, throws fire pots, calls bandit waves | The Sun Knight (start) |
| 2 | **Thar Desert** | **Grishma**, summer | **Sandstorms** shrink tower range for a few seconds; **mirages** show fake enemies | Scorpion Swarms, Camel Raiders, Sand Burrowers (go underground) | **The Dune Colossus**: a sand giant that splits into smaller golems when hit | The Royal Archer |
| 3 | **Western Ghats** | **Varsha**, monsoon | **Rain** slows enemies but douses fire attacks; **floods** open a second path mid-level | Leech Swarms, River Raiders on boats, Mud Brutes | **The Storm Serpent**: flies over the map and breathes lightning at towers | The Monsoon Sage |
| 4 | **Deccan Ruins** (Hampi-inspired) | **Sharad**, autumn | **Harvest-moon nights**: darkness hides enemies outside lit areas; light braziers to see | Stone Golems (magic only), Night Stalkers, Shamans | **The Stone Titan**: wakes up the ruins and throws boulders | Princess Tara |
| 5 | **Sundarbans Delta** | **Hemant**, pre-winter | **Fog** hides incoming waves; **tides** change water paths; enemies come by land *and* river | Crocodiles, River Pirates, Swamp Witches | **The Crocodile Warlord**: dives underwater, ambushes from new paths | The Mangrove Ranger |
| 6 | **Himalayas** | **Shishir**, winter | **Frost** slows your towers' fire rate; **avalanches** block paths; snow covers build plots | Ice Wolves, Frost Mages, Yeti Brutes | **The Shadow Emperor** (final): 3 phases, steals a tower each phase, summons all past bosses as shadows | The Snow Leopard Guard |

### Difficulty curve
- Region 1 teaches. Every later region introduces one new weather mechanic, 3 new
  enemies and one new hero.
- Each level has **3 Diya rating** (lamps instead of stars): win = 1, lose ≤ 5 lives =
  2, lose no lives = 3.
- **Challenge modes per level** (unlocked after 3 diyas): **Heroic** (one life, extra
  waves) and **Iron** (only one tower type). These add 60 extra challenges for replay.
- **Difficulty setting:** Casual / Normal / Veteran (more enemy health, fewer coins).

### Level naming (example, Region 1)
1. Village at the Pass · 2. The Stepwell Road · 3. Banyan Crossing · 4. The Old Watchtower ·
5. **BOSS: The Bandit King's Camp**

### Endless mode
- Unlocked per region by beating its boss: 6 endless maps.
- Waves get harder forever. Every 10 waves brings a mini-boss and a "season shift"
  (weather changes).
- The score is the waves survived plus bonuses. It feeds the leaderboards (section 7).
- **Weekly Challenge** (live-ops): one endless map with special rules, the same for
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
| **Coins** (in-level only) | Defeating enemies, calling waves early | Building and upgrading towers in that level |
| **Diyas** | Level ratings and challenges | Royal Workshop upgrades |
| **Rubies** (premium) | Small amounts from play, daily login, achievements; or purchase | Heroes, power-ups, cosmetics, skips |

### Shop (prices in USD; Google Play converts to local prices)

| Item | Price | Notes |
|---|---|---|
| **Remove Ads** | $2.99 | Removes interstitials and banners. Optional rewarded ads stay. |
| **Starter Pack** | $1.99 | Rubies + a premium hero skin + power-ups. Shown once after level 5. |
| Ruby packs | $0.99 / $4.99 / $9.99 / $19.99 / $49.99 | Bigger packs give bonus rubies. |
| Hero unlock (early) | 500–900 rubies | Heroes are also unlocked free by story progress. |
| Power-ups | Rubies | Extra Lives, Gold Boost, Freeze Bomb. Limited per level. |
| Cosmetic skins | Rubies or $1.99–3.99 | Tower skins (marble, gold), hero skins. |
| **Royal Pass** (later) | $4.99/season | Free and paid reward tracks, cosmetics only. After launch. |

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
  with fixed contents.**
- **Guest players (not signed in):** progress is saved on the phone. The streak breaks
  if the game is reinstalled.
- **Signed in with Google Play Games:** the streak and all progress are cloud-saved
  across phones, plus a **+20% login bonus** and leaderboard ranking. This is the
  reason to sign in.
- **Anti-cheat:** the game checks the device clock against Google's time when online,
  so moving the phone's clock forward doesn't skip days.

### Daily quests
Three per day (e.g. "win 2 levels using only Archer Towers"), with a ruby reward.

### Notifications (opt-in, never spammy)
"Your daily reward is ready" (once a day at most) and "the Weekly Challenge has started".

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
- **Source:** licensed from a royalty-free library with a commercial licence, or
  commissioned (Founder decision, see the task list). Every track is listed in
  `CREDITS.md`.

---

## 10. Technical

| Topic | Plan |
|---|---|
| Engine | **PixiJS** (WebGL 2D: fast sprites, particles, effects) inside **Capacitor** for Android |
| Art pipeline | Painted raster art as sprite sheets for characters, buildings and backgrounds; UI and effects generated in code (section 11) |
| Saving | Autosave on the phone after every level; **cloud save via Play Games Saved Games** when signed in, with conflict handling (keep the furthest progress) |
| Offline | The whole campaign works offline. Ads, the shop, leaderboards and cloud save need a connection. |
| Performance | 60 fps on mid-range and 30 fps on low-end (2 GB RAM, Android 8+); first download < 150 MB; regions download on demand if needed |
| Tuning | Firebase Remote Config, so balance (enemy health, prices) can change without an app update |
| Analytics | Firebase Analytics: level start/win/lose, where players quit, purchases, ad views |
| Store integration | AdMob + Google consent tool (UMP) · Google Play Billing for purchases · Google Play Games Services v2 (sign-in, achievements, leaderboards, saved games) · Play In-App Review prompt after the first boss win |
| Plugins (to verify) | `@capacitor-community/admob`, a Play Games plugin (e.g. `@openforge/capacitor-game-connect`), and `cordova-plugin-purchase` for billing. Where a plugin falls short, we write a small native Android bridge. |

---

## 11. About "more realistic" art: an honest note

The concept boards are **drawn entirely in code**, and that style has a ceiling. It can
look clean and polished, but not painterly or realistic like the top games in the
genre. Those use **painted art**: characters, buildings and backgrounds painted
by hand (or with AI tools), then cut into sprites.

**Recommended pipeline (hybrid):**

| Part | How it's made |
|---|---|
| Characters, towers, enemies, bosses, backgrounds, splash art, icon | **Painted raster art**, made with an AI image tool that can learn one consistent game style (e.g. Scenario or Leonardo, trained on our concept boards), or by a freelance illustrator for the most important pieces |
| UI (buttons, panels, icons), particles, weather, lighting, glows | **Code**, as in the UI kit board: crisp at every screen size, small download, easy to animate |
| Cutscene panels | Painted, re-using character art |

**Founder decision needed:** pick an AI art tool with a **commercial licence** (about
$10–30/month), or set a budget for a freelance artist (roughly $500–2,000 for key art:
icon, splash, 6 heroes, 6 bosses), or a mix of both. The AI then writes the prompts, the
style guide, sizes, sprite-sheet layout and in-game integration.

---

## 12. Things you didn't mention but we need

| Area | What we'll do |
|---|---|
| **Tutorial** | Levels 1–3 teach by doing: the Royal Sage points at things, and there are no walls of text. It's skippable for returning players. |
| **Accessibility** | Colourblind mode (enemy shapes and outlines, not only colours), text size, reduced motion, everything playable with one thumb |
| **Languages** | 12 at launch, including Hindi. Text lives in translation files from day one. |
| **Privacy and age** | Rated for ages 13+; GDPR consent (UMP); privacy policy; data deletion page; data safety form |
| **Cultural care** | No real gods, religions, communities or kingdoms as villains. Regions are *inspired by* real places. Names and costumes reviewed for respect. |
| **India map law** | **We will not draw an outline of India or its borders.** Incorrect borders are a legal problem in India. The world map is an illustrated journey route, not a political map. |
| **Live events** | Seasonal festival events with special levels and cosmetics: **Holi** (colour splash spells, March), **Diwali** (lamp-lighting level, Oct/Nov), Monsoon Week, New Year. They bring players back and suit a global audience. |
| **Rate the game** | Google's in-app review prompt after the first boss win, never during play |
| **Support** | FAQ, contact email and "restore purchases" in Settings |
| **Store assets** | Icon 512×512, feature graphic 1024×500, 8 screenshots, a 30-second trailer, all translated |
| **Updates roadmap** | v1.1: Weekly Challenge · v1.2: Royal Pass · v2: a new region (Northeast India, hill tea gardens), more heroes |
| **Quality checks** | Automated bots play every level after each change; test devices (cheap and mid-range); crash reporting with Firebase Crashlytics |

---

## 13. Release strategy (recommended)

Building all 30 levels before launch delays any income and feedback. Instead:

| Release | Content | Why |
|---|---|---|
| **Closed test** (12 testers × 14 days) | Regions 1–2 (10 levels, 2 bosses) | Google Play requirement and early feedback |
| **v1.0 global launch** | Regions 1–3 (15 levels, 3 bosses, 3 endless), shop, daily login, achievements, leaderboards | Enough for days of play; start earning and learning |
| v1.1 – v1.3 | +1 region per month, then the finale | Regular updates keep players and improve store ranking |

**Rough timeline:** v1.0 in about 10–14 weeks; the full 30 levels about 3 months after
that. These are estimates and depend on how the art pipeline is set up.
