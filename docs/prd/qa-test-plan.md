# QA test plan (on a real phone)

Install `app-debug.apk` from the latest **Android build** run (GitHub > Actions). Test ads and
simulated test purchases are on. Tick each line, and note the phone model and Android version.

## First launch
- [ ] The app opens in landscape, full screen, with no status bar; the tutorial starts by itself
- [ ] The Royal Sage tips guide you through building, starting a wave, upgrading, clearing rubble and Barracks
- [ ] After the tutorial win, the map opens and Level 1 is unlocked

## Battle
- [ ] Build each tower type; upgrade to tier 3 (the building changes); sell (60% back)
- [ ] Rubble spot: pay to clear. Sundial spot: opens at its wave
- [ ] Special spot (gold lotus): the chosen royal tower appears in its build menu, and only there
- [ ] Sun Knight: tap, then tap the road, and he walks there; Sun Strike stuns
- [ ] Spells: Arrow Rain, Reinforcements, Holy Fire work and show cooldowns
- [ ] Power-ups: Freeze, Gold, Lives each work once per level
- [ ] Call a wave early and see the bonus gold; ×2 speed; pause, resume, restart, quit
- [ ] New-enemy card appears once per enemy type
- [ ] Victory: diyas, coins, *Double coins (ad)* plays a test ad and doubles them
- [ ] Defeat: *Revive (ad)* gives +5 lives once; Retry works

## Modes
- [ ] Challenges: locked until the level is won; each challenge rule works (for example Bowmen Only shows only archers)
- [ ] Challenge reward is rubies, paid only once
- [ ] Endless: locked until the Bandit King is beaten; waves keep coming; the results show wave, score and best

## Meta
- [ ] Daily reward claims once a day; next day continues; skipping a day restarts
- [ ] Quests progress from battles and pay rubies; bonus chest after all 3
- [ ] Workshop: rank needs diyas and costs coins; reset refunds
- [ ] Achievements unlock with a message and rubies

## Store, ads, Play Games (after the Founder's setup)
- [ ] Shop shows real local prices; a license-tester purchase grants rubies; Remove Ads hides interstitials and the banner
- [ ] Reinstall, then Restore purchases brings back Remove Ads
- [ ] Interstitial: never before level 4, never after a loss, at most once every 3 minutes
- [ ] Consent form appears for an EU test device (AdMob test device settings)
- [ ] Google Play Games sign-in; achievements and leaderboards open; progress returns after reinstall (cloud save)

## Device behaviour
- [ ] Notch phones: no button under the camera cut-out
- [ ] Small (5") and large (6.7") phones and a tablet: nothing cut off or zoomed
- [ ] Home, then return: the game pauses and the music resumes; back button behaves (pause in battle, back in menus, exit asks)
- [ ] 20 minutes of play: no slowdown, phone not hot; battery saver setting works
- [ ] Sound and music sliders, vibration toggle
