# Sandstone Kingdom: release setup (Founder's checklist)

The game is fully built and runs with **Google's test IDs**. That means ads show "Test Ad",
purchases are simulated in the browser, and Google Play Games stays switched off until you
add its project ID. Nothing breaks if a value is missing; that feature just waits.

Each step below says where the value goes. After changing a file, push to GitHub: the
**Android build** workflow makes a new APK and AAB on its own.

---

## 1. Try the game on your phone now (5 minutes)

1. Open GitHub > **sandstone-kingdom** > **Actions** > **Android build** > the latest green run.
2. Download **sandstone-kingdom-debug-apk** (a zip). Unzip it to get `app-debug.apk`.
3. Copy it to your Android phone and open it. Allow "install unknown apps" when asked.
4. The test build shows Google's test ads and uses test purchases.

## 2. App signing key (once, then never lose it)

Google Play needs every upload signed with your **upload key**.

1. On a computer with Java, run:
   `keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`
2. Keep `upload.jks` and the passwords somewhere safe: a password manager plus an offline backup.
3. In GitHub > repo **Settings** > **Secrets and variables** > **Actions**, add:
   - `SK_UPLOAD_KEYSTORE_B64`: the file as base64 (`base64 -w0 upload.jks` on Linux, `certutil -encode` on Windows)
   - `SK_KEYSTORE_PASSWORD`, `SK_KEY_ALIAS` (= `upload`), `SK_KEY_PASSWORD`
4. The next build's `app-release.aab` is signed and ready for Play Console.
5. In Play Console, keep **Play App Signing** on (the default). Google holds the final key.

## 3. Play Console: create the app

1. **Create app**: name *Sandstone Kingdom: Tower Defense*, type **Game**, **Free**.
2. Package name is fixed in the build: `com.samvardhanstudios.sandstonekingdom`.
3. **Store listing**: use `game/store/icon-512.png` and `game/store/feature-graphic-1024x500.png`.
   Take phone screenshots from the test build. `docs/screens/` has examples.
4. **Content rating**: answer the questionnaire. It has cartoon fantasy violence, no blood,
   in-app purchases and ads, which usually rates **PEGI 7 / ESRB Everyone 10+ / IARC 7+**.
5. **Target audience**: 13+ (not designed for children, so the stricter Families rules do not apply).
6. **Data safety**: the game collects device/ad identifiers (AdMob), purchase history (Google
   Play Billing) and app activity (Play Games, if signed in). The privacy policy is on the website.
7. **Privacy policy URL**: `https://samvardhanstudios.com/sandstone-kingdom/privacy`
   (from the `website` branch, see section 8).

## 4. In-app products (Play Console > Monetize > Products > In-app products)

Create these **exact** product IDs. Prices are the India price; set the others with Play's
"local prices" templates.

| Product ID | Name | Type | India | USA |
|---|---|---|---|---|
| `starter_pack` | Starter Pack | one-time | ₹49 | $1.99 |
| `remove_ads` | Remove Ads | one-time | ₹99 | $2.99 |
| `rubies_80` | Ruby Handful | consumable | ₹29 | $0.99 |
| `rubies_330` | Ruby Pouch | consumable | ₹99 | $2.99 |
| `rubies_800` | Ruby Chest | consumable | ₹199 | $5.99 |
| `rubies_1900` | Ruby Vault | consumable | ₹449 | $11.99 |
| `rubies_5000` | Ruby Treasury | consumable | ₹999 | $24.99 |

The shop reads the real local price from Google Play, so players always see their own currency.
Add your Gmail as a **License tester** (Play Console > Settings > License testing) to buy for free.

## 5. AdMob (ads)

1. In AdMob, **Add app** > Android > link it to the Play listing.
2. Create 3 ad units: **Rewarded**, **Interstitial**, **Banner**.
3. Put the IDs in two places:
   - `game/src/platform/config.js`: `ADMOB.appId`, `rewarded`, `interstitial`, `banner`, and set `testing: false`
   - `game/android/app/src/main/res/values/strings.xml`: `admob_app_id`
4. AdMob > **Privacy & messaging**: create a **GDPR** message and a **US states** message. The game
   already shows Google's consent form where the law needs it.
5. `app-ads.txt`: publish it at `https://samvardhanstudios.com/app-ads.txt` (the website branch has
   the file; swap in your publisher ID `pub-XXXXXXXXXXXXXXXX`).
6. Keep using test ads on your own phone. Never tap your own real ads.

## 6. Google Play Games Services (sign-in, achievements, leaderboards, cloud save)

1. Play Console > **Play Games Services** > **Setup and management** > **Configuration** > create a
   new Games project. It walks you through making the OAuth credential in Google Cloud.
   For the debug build, also add the debug SHA-1 that the build log prints.
2. Copy the **Project ID** (digits only) into
   `game/android/app/src/main/res/values/strings.xml` > `game_services_project_id`.
3. Turn on **Saved Games** in the configuration (used for cloud save).
4. **Achievements**: create the 32 listed in `game/src/meta/profile.js` (`ACHIEVEMENTS`; names and
   descriptions are there). Paste each generated ID into `game/src/platform/config.js` > `PLAY_GAMES.achievements`.
5. **Leaderboards**: create `Endless: Aravalli Hills` (and the other regions later) and
   `Total Diyas`. Paste the IDs into `PLAY_GAMES.leaderboards`.
6. Add yourself as a tester under Play Games Services > **Testers**, then **Publish** the
   Games configuration.

## 7. Guest rankings (optional, free)

Guests cannot see Google Play leaderboards, so the game can show a public top-100 from Firebase.

1. Create a Firebase project > **Realtime Database**, then set the rules to: anyone may read
   `boards`, and writes must be under `boards/$board/$playerId`, with `score` a number below 50,000,000.
2. Put the database URL in `game/src/platform/config.js` > `PUBLIC_LEADERBOARD_URL`.

## 8. Website (`website` branch)

Host the `website` branch on `samvardhanstudios.com`. GitHub Pages works: repo **Settings** >
**Pages** > branch `website`, then point the domain's DNS to GitHub Pages. It contains the game page,
privacy policy, terms, age rating, `ads.txt` and `app-ads.txt`.

## 9. Release plan

1. **Internal testing** track: upload the signed AAB. Add up to 100 testers by email.
2. **Closed testing** with at least 12 testers for 14 days. New personal developer accounts
   need this before production.
3. **Production**, staged rollout: 10%, then 50%, then 100% while watching the crash rate in Play Console.

Each push makes a new build with a higher version code (the GitHub run number), so uploads never clash.
