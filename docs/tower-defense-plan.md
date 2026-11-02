# Tower Defense Game: Launch Plan

_Created 2026-11-02 · Owner: Founder (decisions) + AI (build) · Status: **draft, waiting for Founder approval**_

Who does what in the task lists below:
- 🤖 **AI** does it, in this repo.
- 👤 **Founder (you)** must do it: anything needing your identity, money, accounts,
  a real phone, or approval to publish.
- 🤝 **Together**: AI prepares it, you check it and press the button.

---

## 1. The game in one paragraph

A **tower defense game painted in Warli folk art**. Pests and raiders march along
paths painted on a mud wall towards the village granary. You place villagers along the
path (archers, drummers, beehive keepers, slingers) to stop them before the harvest is
lost. Each defended level adds a painted scene to the village wall, and that mural is
the level select. Short levels (3–5 minutes), playable offline, one-handed in portrait.

### Why Warli for tower defense
- Tower defense needs many easily recognisable units. Warli figures are built from
  circles, triangles and lines, so code can draw dozens of towers and enemies in one
  consistent style, with no artist or AI image generator needed.
- The tower defense genre on Play Store is full of glossy 3D fantasy and sci-fi.
  A flat, painted, cream-on-mud look stands out instantly in store screenshots.
- Paths, waves and the village are exactly what Warli paintings already show: rows of
  people, animals, harvest and dance circles.
- It's family-friendly by nature, so no blood or gore and a wide audience rating.

**Rejected:** Risograph. It suits puzzles, but doesn't give tower defense a world or
characters.

### Core design (draft)

| Part | Draft |
|---|---|
| **Defend** | The granary (lives = sacks of grain) |
| **Enemies** | Locust swarms (fast, weak), crows (fly over walls), wild boars (tanky), jackals (fast packs), porcupines (armoured), storm spirits (bosses, monsoon levels) |
| **Towers (villagers)** | Archer (single target), slinger kids (cheap, fast), drummer (slows nearby enemies), beehive keeper (damage over time), scarecrow (distracts flyers), tarpa player (boosts nearby towers) |
| **Upgrades** | Each tower has 3 upgrade levels. Each level adds detail to the figure (headdress, more arrows, bigger drum) |
| **Economy** | Rice earned per enemy, spent on towers. Stars replaced by "harvest saved" (sacks left) |
| **Meta-progress** | Village wall mural (level select) and unlocking new villagers. Light permanent upgrades bought with seeds (soft currency) |
| **Content at launch** | 3 seasons × 12 levels = **36 levels**, plus an endless "monsoon" mode |
| **Session** | 3–5 minutes per level, 2× speed button, pause anytime |
| **Controls** | Tap a painted spot to build, tap a tower to upgrade or sell. No dragging needed |

### Name shortlist (you pick; I check store availability)
1. **Harvest Keepers**: `com.samvardhanastudios.harvestkeepers`
2. **The Painted Village**: `com.samvardhanastudios.paintedvillage`
3. **Warli Watch**: `com.samvardhanastudios.warliwatch`
4. **Granary Guard**: `com.samvardhanastudios.granaryguard`

⚠️ The package name **can never be changed** after the first upload to Play Console.

---

## 2. Tech approach

| Part | Choice | Why |
|---|---|---|
| Game | HTML5 canvas + JavaScript, no engine | AI can build and test all of it here, small app size, runs on low-end phones |
| Android app | Capacitor wrapper | Real Android app, offline, access to native ads and in-app purchases |
| Android builds | GitHub Actions | This AI workspace can't download the Android SDK; GitHub's servers can. You download the test APK from GitHub |
| Website | Static site in `website/`, hosted on Cloudflare Pages or GitHub Pages | Free, fast worldwide, HTTPS included |
| Tests | Node unit tests + automated browser play-throughs | Every level is auto-played to prove it can be won |

---

## 3. Ads: which platform

### Recommendation: **Google AdMob with mediation** at launch, then test **AppLovin MAX** once we have traffic

| Platform | Strength | Weakness for us |
|---|---|---|
| **AdMob** (Google) | Biggest advertiser demand worldwide, best fill in every country, built-in Google consent tool (GDPR), and a mature, maintained Capacitor plugin (`@capacitor-community/admob`) | Usually slightly lower rewarded-video prices in rich markets than MAX |
| **AppLovin MAX** | The market leader in mediation (more than half the market by some reports), often the highest game ad prices in US/EU | No official Capacitor plugin, so we would have to write and maintain our own native bridge |
| **Unity LevelPlay** | Strong for games, good Unity Ads demand | Built around Unity; no Capacitor support |

**Why AdMob first:** for a global launch, *fill rate* (an ad actually shows) matters as
much as price. In India, Indonesia, Brazil and other big-audience countries, AdMob's
demand is the deepest. AdMob **mediation** lets AppLovin, Unity Ads, Meta, Mintegral,
Pangle and Liftoff bid for the same ad slot, so we still get their money without
leaving AdMob. Once the game has steady traffic (roughly 5,000+ daily players), we
A/B test AppLovin MAX against AdMob and keep whichever earns more **per daily user**.
We judge by revenue per daily user, not the advertised "eCPM", which is misleading.

### Where ads appear (player-friendly placement)
| Ad type | When | Rule |
|---|---|---|
| **Rewarded video** (main earner) | Player chooses: double rice reward, revive the granary once, free tower upgrade, extra seeds | Always optional, always pays out |
| **Interstitial** | Between levels only, never mid-wave | Not before level 4; at most one every 3 minutes; never after a loss twice in a row |
| **Banner** | Menus only (village wall screen) | Never during play |
| **Remove ads** (in-app purchase) | One-time purchase | Removes interstitials and banners; rewarded stays (player's choice) |

Other in-app purchases: starter pack, seed bundles, a premium "festival" villager.
Nothing that makes the game unwinnable without paying.

### ads.txt / app-ads.txt (important difference)
- **`app-ads.txt`** is the one the **game's** ads need. Ad networks check it on the
  website listed as the developer site in Play Console. Without it, many advertisers
  won't buy our ad space, so revenue drops. It lives at
  `https://<our-domain>/app-ads.txt`.
- **`ads.txt`** is only needed if the **website itself** shows ads (e.g. AdSense on a
  playable web version of the game). We'll include it too, ready for that.
- Both files list our AdMob publisher ID plus one line per mediation partner. AI writes
  them; you give the publisher ID from your AdMob account.

---

## 4. Global launch planning

| Topic | Plan |
|---|---|
| **Languages at launch** | English, Hindi, Spanish, Portuguese (Brazil), Indonesian, French, German, Russian, Turkish, Japanese, Korean, Vietnamese. Arabic later (needs right-to-left layout). The game uses few words and mostly icons, which keeps translation cheap |
| **Low-end phones** | Target Android 8+ and phones with 2 GB RAM at 60 fps; app size under 40 MB |
| **Offline** | Fully playable offline; ads and purchases only when online |
| **Privacy and consent** | Google's consent tool (UMP) for EU/UK/Switzerland (GDPR) and US state privacy laws; consent asked before any personalised ads |
| **Age rating** | Target audience **13+**. Avoids Google's "Families" policy, which bans most ad networks for kids' apps. Content is mild, so the IARC rating should be about "Everyone / PEGI 3–7" |
| **Prices** | In-app purchases set in USD; Play converts to local prices. Cheaper "regional" prices for India, Indonesia, Brazil |
| **Store listing** | Translated title, description and screenshots for the top languages |
| **Analytics** | Firebase Analytics (free) for retention and level difficulty, disclosed in the privacy policy |

---

## 5. Website

Lives in `website/`, in the same Warli style as the game (and checked against the
"never use" list in `visual-direction.md`).

| Page | Why |
|---|---|
| Home: the game, trailer GIF, Play Store button | Marketing |
| Privacy policy | **Required** by Google Play and ad networks |
| Terms of use | Standard for in-app purchases |
| Support / contact | **Required** by Play Store listing |
| Press kit (logo, screenshots, description) | For YouTubers and reviewers |
| `app-ads.txt` | **Required** for ad revenue |
| `ads.txt` | Only if the site shows ads (prepared anyway) |
| Optional: playable web demo | Extra reach plus web ad revenue via AdSense for games |

---

## 6. Task list

Estimates are rough and assume quick feedback from you.

### Phase 0: Decisions (this week)
| # | Task | Who |
|---|---|---|
| 0.1 | Approve this plan (game, Warli art, AdMob-first) | 👤 |
| 0.2 | Pick the game name from the shortlist (or suggest one) | 👤 |
| 0.3 | Check the name is free on Play Store and the domain is available | 🤖 |
| 0.4 | **Buy the domain** (about $10–15/year, e.g. Cloudflare or Namecheap) | 👤 |
| 0.5 | Create a support email address (e.g. support@yourdomain) | 👤 |
| 0.6 | Decide account type: **personal** Play account ($25, needs 12 testers for 14 days before launch) or **organization** ($25, needs a registered business + free D-U-N-S number, no tester rule) | 👤 |
| 0.7 | Remove the paused "Gravity Flip Sort" prototype from the repo | 🤖 (after your OK) |

### Phase 1: Prototype (about 1–2 weeks)
| # | Task | Who |
|---|---|---|
| 1.1 | Game design document: towers, enemies, numbers, wave rules | 🤖 |
| 1.2 | Warli art system: figure generator, path painting, wall textures | 🤖 |
| 1.3 | Core engine: paths, waves, towers, targeting, upgrades, economy | 🤖 |
| 1.4 | 3 playable levels | 🤖 |
| 1.5 | Automated tests + bots that play every level | 🤖 |
| 1.6 | Playable link for you to try on your phone's browser | 🤖 |
| 1.7 | **Play the prototype on your phone, say what's fun and what isn't** | 👤 |

### Phase 2: Full game (about 3–4 weeks)
| # | Task | Who |
|---|---|---|
| 2.1 | All 6 towers × 3 upgrades, 6 enemies, 2 bosses | 🤖 |
| 2.2 | 36 levels + endless mode, auto-balanced by simulation | 🤖 |
| 2.3 | Village wall level select, settings, pause, 2× speed | 🤖 |
| 2.4 | Sound: free licensed sounds (CC0) + code-made drums/flute, listed in `CREDITS.md` | 🤖 |
| 2.5 | Translations for 12 languages | 🤖 (machine + review) |
| 2.6 | Ask native-speaker friends to check 2–3 key languages | 👤 (optional) |
| 2.7 | **Weekly test on your phone; report bugs/feel** | 👤 |

### Phase 3: Android app + money (about 1–2 weeks, can overlap Phase 2)
| # | Task | Who |
|---|---|---|
| 3.1 | **Create Google Play Developer account** ($25, ID verification takes days) | 👤 |
| 3.2 | **Create AdMob account**, add payment and tax info (non-US: W-8BEN form) | 👤 |
| 3.3 | **Create a Google Payments merchant profile** (for in-app purchases) | 👤 |
| 3.4 | Capacitor Android project with your package name, icons, splash | 🤖 |
| 3.5 | GitHub Actions: build test APK + signed release bundle (AAB) | 🤖 |
| 3.6 | Create the app signing ("upload") key, add it to GitHub Secrets, **keep a backup** (lose it and you can't update the game easily) | 🤝 (I give exact steps) |
| 3.7 | Create the ad units in AdMob (rewarded, interstitial, banner) and send me the IDs | 👤 (I give a checklist) |
| 3.8 | Integrate AdMob + consent tool + rewarded/interstitial/banner rules | 🤖 |
| 3.9 | Create in-app products in Play Console (remove ads, packs) | 👤 (I give exact list) |
| 3.10 | Integrate in-app purchases + restore purchases | 🤖 |
| 3.11 | Add mediation partners: create AppLovin, Unity, Meta, Mintegral and Pangle accounts | 👤 (later, after launch is fine) |
| 3.12 | Install test APK on **2 real phones** (one cheap, one mid-range) and test ads/purchases | 👤 |

### Phase 4: Website (about 1 week, can overlap)
| # | Task | Who |
|---|---|---|
| 4.1 | Build website in Warli style: home, privacy, terms, support, press kit | 🤖 |
| 4.2 | `app-ads.txt` and `ads.txt` with your AdMob publisher ID | 🤖 |
| 4.3 | **Connect the domain to Cloudflare Pages / GitHub Pages** (I give click-by-click steps) | 👤 |
| 4.4 | Approve the website before it goes live | 👤 |
| 4.5 | Check `app-ads.txt` is reachable and verified in AdMob | 🤝 |

### Phase 5: Store listing + testing (2–3 weeks; mostly the 14-day test)
| # | Task | Who |
|---|---|---|
| 5.1 | Store text (short + full description) in 12 languages | 🤖 |
| 5.2 | Icon, feature graphic, 8 screenshots, short trailer | 🤖 |
| 5.3 | Privacy policy URL, data safety form answers, content rating answers (prepared for you) | 🤖 |
| 5.4 | **Fill in Play Console forms** using the prepared answers | 👤 |
| 5.5 | **Personal account only: recruit 12+ testers who keep the game installed for 14 days** (friends, family, tester communities) | 👤 |
| 5.6 | Fix everything testers report | 🤖 |

### Phase 6: Launch + after
| # | Task | Who |
|---|---|---|
| 6.1 | **Approve and press "Publish to production"** | 👤 |
| 6.2 | Staged rollout: 20% → 50% → 100% over a week | 🤝 |
| 6.3 | Weekly report: players, day-1/day-7 retention, revenue per user, hardest levels | 🤖 |
| 6.4 | Monthly content update (new season of levels) | 🤖 |
| 6.5 | At ~5,000 daily players: A/B test AppLovin MAX vs AdMob | 🤝 |
| 6.6 | Marketing: short videos for YouTube Shorts / Instagram Reels / TikTok | 🤖 makes, 👤 posts |

**Rough total to launch:** 7–10 weeks, including the 14-day tester period.

---

## 7. Costs you should expect

| Item | Cost |
|---|---|
| Google Play Developer account | $25 one-time |
| Domain | ~$10–15 per year |
| Hosting (Cloudflare/GitHub Pages) | Free |
| AdMob, mediation partners, Firebase | Free (they take a share of ad revenue) |
| Google's fee on in-app purchases | 15% of the first $1M per year (after enrolling in the 15% programme; otherwise 30%) |
| GitHub Actions builds | Free tier is enough |
| Fonts, sounds | Free (open licences) |

## 8. Honest risks

- **Ad revenue needs players.** Ads pay per thousand views, so income stays small
  until there are thousands of daily players. Marketing (Phase 6) matters as much as
  the game.
- **Tower defense balance takes tuning.** We'll use automated simulations, but your
  play-testing feedback is essential.
- **AdMob account review** can take days to weeks, and new accounts sometimes get
  limited ad serving at first.
- **The 14-day tester rule** (personal accounts) adds about 2 weeks before launch.

## Sources

- [AppLovin MAX vs Unity mediation, RevenueFlex](https://revenueflex.com/blog/unity-ads-vs-applovin-max-mediation-comparison/)
- [Nine facts about the mediation space in 2025, PocketGamer.biz](https://www.pocketgamer.biz/nine-facts-about-the-mediation-space-in-2025)
- [AppLovin publisher guide 2026, Segwise](https://segwise.ai/blog/applovin-publisher-monetization-guide)
- [AdMob alternatives 2026, MetaCTO](https://metacto.com/blogs/admob-competitors-and-alternatives-in-2024-comprehensive-guide)
- [AppLovin MAX vs AdMob mediation, Airframe](https://www.airframe.ai/product/applovin-com-max/compare)
- [Google Play testing requirements for new personal accounts, Google](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-GB)
- [Google Play 12 testers policy guide 2026, Testers Community](https://www.testerscommunity.com/guides/how-many-testers-do-you-need-google-play)
