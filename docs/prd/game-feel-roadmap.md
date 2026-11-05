# Sandstone Kingdom: what to fix, improve and add

A full review of the game as it stands on 5 November 2026: Region 1 with 6 levels, 4 heroes,
8 towers and the full meta game. It covers what is missing, what to improve, what to add, and
the small details that make a world feel lived in. [alive-ideas.md](alive-ideas.md) tracks the
realism work already done, which this list does not repeat.

**How to read it.** Every item has an ID (for example `C4`), so you can say "do C4, N2 and W7".

- **When:**
  - **P1** = before launch (biggest effect on how the game feels).
  - **P2** = the first update after launch.
  - **P3** = with Region 2 or later.
- **Effort:** **S** = under half a day, **M** = 1 to 2 days, **L** = 3 days or more.
- 🎮 marks an item that changes gameplay, so the bot's balance check must run again after it.

The order of the sections is not a priority order. The suggested build order is at the end.

---

## 0. Problems found during this review (fix first)

| ID | Problem | Fix | When | Effort |
|---|---|---|---|---|
| F1 | The briefing says "**Pick up to 3**. They stand only on special spots." The house rule is never to tell players "up to 3". | Change it to "Choose your special towers. They stand only on special spots." and give each card a count of free slots (three small lotus pips that fill up as towers are picked). | P1 | S |
| F2 | The "DOUBLE-TAP TO START" label in the tutorial sits on top of the second build spot. | Place the label on the side of the entrance marker that faces away from spots, or on a small parchment tag under the marker. | P1 | S |
| F3 | Every battlefield is the same flat green meadow. "The Old Watchtower" has no watchtower, and "The Stepwell Road" barely shows its stepwell. | Give every level one big **landmark** that matches its name (see N10–N15). Change the ground tint and props per level as well: dry grass, a market square, the bandit camp's trampled earth. | P1 | L |
| F4 | Bandit, Bandit Archer and Saboteur all wear the same dark purple and look alike in a crowd. | Give each enemy a silhouette or colour cue that reads at phone size: Archers with a red headband and a quiver, Saboteurs crouched with a green scarf and a smoke pouch, Wolf Riders with a tan wolf. The rule: no two enemies share both their main colour and their outline. | P1 | M |
| F5 | The briefing shows enemy pictures with no names, and the bottom-left third of the panel is empty. | Add each enemy's name under its picture and a short line on tap. Use the empty space for a **"Sage's advice"** card with one tip for this level ("Two roads. Build where they meet."). | P1 | S |
| F6 | Several "UPGRADED!" and "+6" floats pile up on top of each other when things happen close together. | Queue floating text per tower and stack it upward with a small gap. Merge gold floats that arrive within 0.3 s ("+18" instead of three "+6"). | P1 | S |
| F7 | On a 16:9 phone the fort is cut off at the right edge in Level 4. | Keep the fort fully inside the 844-wide world on every level. The device check could warn when the fort's bounding box leaves the safe area. | P1 | S |
| F8 | The locked regions on the world map (flat triangle mountains, blank desert) look unfinished, not like a teaser. | Draw them as a painted map hidden by fog and parchment: shapes you can just make out, with "Coming in a free update" on a wax-sealed scroll. | P2 | M |
| F9 | The menu cloud has a flat, box-like bottom. | Give clouds a rounded, puffy bottom and two or three sizes, and let them drift at different speeds for depth. | P1 | S |

---

## 1. Characters: heroes

Heroes are the player's companions, so they should have personalities that come out in small moments.

| ID | Detail | When | Effort |
|---|---|---|---|
| C1 | **Idle behaviours.** Heroes standing still for 4+ s pick a random idle: the Sun Knight polishes his sword, rolls his shoulders, or shades his eyes and looks down the road. Rani Meera tests her bowstring and blows a strand of hair from her face. Guru Agastya sits cross-legged and floats a hand's width off the ground. Maharaja Vikram strokes his moustache and plants his sword in the ground. | P1 | M |
| C2 | **Voice barks** made in code: short syllables with a pitch shape (a "hup!", a laugh, a battle shout), never real words, with a speech bubble showing the line. They play on being moved ("On my way!"), using a skill ("For the Sun!"), a kill streak, low health ("Need a moment…"), respawning ("Back on my feet.") and winning. At most one bark every 6 s. | P1 | M |
| C3 | **Low-health acting.** Under 30% health the hero breathes hard (shoulders rise and fall), the walk slows a little and a sweat drop appears. Under 10% the portrait in the HUD cracks and pulses red. | P1 | S |
| C4 | **Death and respawn as a moment.** The hero kneels and fades into a gold glow instead of tipping over like an enemy. On respawn the fort gate opens and the hero jogs out raising dust (this also explains where heroes come from). | P1 | M |
| C5 | **Victory pose** for each hero, played in the battle when the last enemy falls, before the victory panel. The Sun Knight raises his sword to the sun, Rani Meera spins an arrow, the Guru bows, Vikram roars. | P1 | S |
| C6 | **The hero reacts to the world:** he waves at the fort guards when he walks past, the peacock follows him for a few steps, and a cow he walks past moos. | P2 | S |
| C7 | **Hero levels and talents** (missing from the game today). The hero gains XP per battle, reaches level 10 per region, and picks one of two talents at levels 3, 6 and 9 (for example Sun Strike: wider, or stuns longer). This is a strong reason to keep playing and a common feature of the genre. | P2 🎮 | L |
| C8 | **Hero introductions.** Unlocking a hero plays a one-page comic (see S5) and a short theme on the shehnai or bansuri. | P2 | M |
| C9 | **Cosmetic hero outfits** (a monsoon Sun Knight, a Diwali Rani Meera): good for IAP, no gameplay effect, so it is fair. | P3 | M each |
| C10 | **Banter between heroes** when two meet on the road in later regions: one line each in speech bubbles. | P3 | S |

## 2. Characters: your soldiers and tower crews

| ID | Detail | When | Effort |
|---|---|---|---|
| C11 | **Soldiers at rest.** When no enemy is near, Barracks soldiers lean on their spears, stretch, chat (two bubbles with "…") or sit on a rock. They snap to attention and lower spears when the next wave's horn sounds. | P1 | M |
| C12 | **Soldiers come out of the door.** New and respawned soldiers walk out of the Barracks door instead of appearing. The door opens and closes. | P1 | S |
| C13 | **Running dust** when soldiers move to a new rally point (already on the "next" list). Add a small banner bearer at tier 3 who plants a flag at the rally point. | P1 | S |
| C14 | **Cheer after a wave:** soldiers raise their weapons, archers on towers wave their bows, the cannon crew high-fives. Short, and skipped if the next wave is close. | P1 | S |
| C15 | **Wounded soldiers** kneel and hold their side under 25% health. If the hero or a Stepwell Fountain heals them, they stand up with a small green sparkle. | P2 | S |
| C16 | **Tower crews at work.** Archers duck behind the battlements between shots and peek out. The Magic Caster turns a page in a floating book. The cannon crew swab the barrel, ram powder and wipe their brows (the reload is shown). The Alchemist stirs a bubbling pot. The falconer feeds the falcon a treat after a kill. | P1 | M |
| C17 | **Crews notice danger:** when a boss appears, every tower crew turns to look at it for half a second and one archer points. | P2 | S |
| C18 | **Crews show their tier:** tier-1 crews wear plain cotton, tier 2 wear turbans and sashes, tier 3 wear gold-trimmed uniforms. They are already different units; make the jump obvious. | P2 | M |
| C19 | **Jammed towers react:** when a Saboteur's smoke jams a tower, the crew coughs and waves the smoke away. When the smoke clears, they shake a fist down the road. | P1 | S |
| C20 | **Fort guards** walk the walls, lean over to look at the road when an enemy gets near, and ring a bell on the gate tower at the start of each wave. | P1 | S |

## 3. Characters: enemies

Enemies should feel like a gang of people with a plan, not a stream of targets.

| ID | Detail | When | Effort |
|---|---|---|---|
| C21 | **Wounded enemies limp** under 25% health (already on the "next" list). Add a stagger (a short knock-back and lean) on any single hit worth over 15% of their health. | P1 | S |
| C22 | **Different deaths per enemy,** all cartoon and bloodless for the 7+ rating. A Bandit's turban flies off and he drops a loot sack (which bursts into coins). A Barbarian falls flat with a thud and a dust ring. A wolf whose rider falls **runs off whimpering** (it does not leak). A Shield Bearer's shield rolls away like a wheel. The Brute's helmet clangs and spins. | P1 | M |
| C23 | **Personality on the road.** Bandits look over their shoulders. Saboteurs move crouched and roll past soldiers. Barbarians beat their chests when they spawn. The War Drummer's beat matches the music's tempo. Wolf riders' wolves howl when they appear. | P1 | M |
| C24 | **Enemies react to their friends falling.** When three or more die close together, the nearby Bandits flinch and slow for 0.5 s ("panic"). When the boss falls, **every enemy left on the map loses heart**: they drop their weapons and run back toward the entrance, still worth gold if caught. 🎮 (A small but deeply satisfying end to a boss level.) | P1 🎮 | M |
| C25 | **The story walks on the road.** In Level 1 some Bandits carry the stolen **festival lamps**, and one drops each time a carrier falls. A counter on the victory panel says "Lamps recovered: 7/7", and the village on the map lights up (see S9). In Level 2 Bandits carry stolen water pots. | P1 | M |
| C26 | **The enemy camp is alive** where enemies spawn: tents, a campfire with a pot, Bandits sharpening swords and arguing. Before each wave they stand up and march out. This shows the player where the next wave comes from without any UI. | P2 | M |
| C27 | **Hit reactions by damage type:** arrows make them flinch, magic makes them glow and shiver, cannon blasts knock them back and spin their hats, poison turns them green and makes them cough. | P2 | S |
| C28 | **Enemies talk too:** occasional bubbles ("Gold!", "The fort!", "Run!") and a Saboteur who giggles. Rare, at most one on screen. | P2 | S |
| C29 | **Elite versions** in later waves: same enemy with a gold trim and a little more health, worth more gold. This adds variety without new art. | P2 🎮 | S |

## 4. Characters: the boss

| ID | Detail | When | Effort |
|---|---|---|---|
| C30 | **Boss entrance cutscene** (3 to 5 s, can be skipped): the camera pans to the entrance, the war boar crashes through a palisade, the Bandit King's name card slides in with a title ("The Bandit King: Thief of the Sun Crown"), and he taunts in a speech bubble. Slow motion already exists; this frames it. | P1 | M |
| C31 | **Boss phases** (already on the "next" list). At 66% he blows a horn and calls a pack of Wolf Riders. At 33% he gets angry: red eyes and steam, the boar charges forward at double speed for 3 s, and any soldiers in the way are knocked aside. The music changes at each phase. 🎮 | P1 🎮 | M |
| C32 | **The boss taunts the player in the moment:** when a tower is sold ("Running out of money?"), when a life is lost ("Ha! Your walls are paper!"), and when the hero dies ("Sun goes down!"). | P2 | S |
| C33 | **Boss defeat sequence:** slow motion, the boar throws him, he spins like a top and falls. **The Sun Crown rolls out** and glows. The player taps it to pick it up, and that tap ends the level. This makes the win the player's action instead of a panel appearing. | P1 | M |
| C34 | **He escapes to come back.** He survives the defeat (cartoon dazed stars), crawls away and swears revenge. He returns as a mini-boss in Region 2's first level with his crown gone and a bandage on his head. A recurring villain keeps players coming back for the story. | P3 | M |

## 5. NPCs, villagers and animals

| ID | Detail | When | Effort |
|---|---|---|---|
| N1 | **Villagers going about their day** in levels that have a village: a farmer ploughing with a bullock, women carrying water pots on their heads, a potter at his wheel, children flying kites (the kites drift with the wind, see W1), a chai seller with a kettle. Each is a small loop on scenery spots, off the road. | P1 | L |
| N2 | **Villagers react to the battle.** The wave horn makes them grab their children and run into their houses (doors close, shutters drop). Between waves they peek out. When you win they come out, cheer and throw marigold petals. If the fort is badly hurt, they carry water buckets to the gate. | P1 | M |
| N3 | **Cows** wander on the grass, lie down, swish their tails, and stand in the shade of trees. When a cannon fires nearby they turn their heads. Tap one: it moos, and the 5th tap gives a hidden achievement. | P1 | S |
| N4 | **Monkeys** in the banyan trees scratch, swing and chatter. A monkey sometimes runs down and steals a coin flying to the counter (cosmetic only, the gold still counts) and scampers back up. Tap the monkey to make it drop a bonus 5 gold, once per level. | P2 | M |
| N5 | **Birds react:** parrots burst from trees when a cannon fires or an elephant trumpets. Crows land near a fallen enemy's dropped hat and hop away. Herons in the ponds. Pigeons settle on tower roofs between waves and leave when the shooting starts. | P1 | M |
| N6 | **The peacock** (already a secret) dances with its tail fanned when you win and when it rains (see W5). | P1 | S |
| N7 | **A stray dog** barks at passing enemies from a safe distance and runs away from Brutes. After a win it wags its tail by the fort. | P2 | S |
| N8 | **Fish jump** in ponds, **frogs** on lily pads hop when something walks past, **dragonflies** over the water. | P2 | S |
| N9 | **Tap the world:** every scenery piece answers a tap. A tree drops leaves and lets out a bird. A haystack shakes and a hen pops out. A pot falls over and rolls. The shrine's bell rings. A small "secrets found 3/8" counter per level gives completionists something to chase. | P2 | M |

**Level landmarks** (they fix F3 and give each level its own memory):

| ID | Level | Landmark and life | When | Effort |
|---|---|---|---|---|
| N10 | 0 · Training Grounds | Straw training dummies that wobble when hit by stray arrows, a drill sergeant shouting counts, an archery target. | P1 | M |
| N11 | 1 · Village at the Pass | The market square with empty stalls and bare lamp strings. Each lamp recovered (C25) lights a lamp on the strings. | P1 | M |
| N12 | 2 · The Stepwell Road | A large stepwell in the middle of the map with stairs going down, women drawing water, and water that sparkles. If the enemies get too close, the water level visibly drops. | P1 | M |
| N13 | 3 · Banyan Crossing | One giant banyan with hanging roots, a swing, a small shrine and red threads tied on it. Monkeys (N4) live here. | P1 | M |
| N14 | 4 · The Old Watchtower | A ruined watchtower taken over by Bandit Archers, who shoot at your soldiers from it. 🎮 Defeat them, and your own archers move in (it becomes a free special spot or a bonus tower). This is a story beat you can see and an objective. | P1 🎮 | L |
| N15 | 5 · The Bandit King's Camp | Tents, a cage holding captured villagers, stolen treasure piles, a throne made of crates. When you win, the cage opens and the villagers run home. | P1 | M |

## 6. Story told in comic style

The briefing lines are good and casual, but the story is told only in text. The game needs a
visual storytelling style of its own: **an Indian comic book**, with bold panel borders, a halftone
dot texture, sound words painted in big letters (**DHOOM!**, **THWACK!**, **KHATAAK!**) and
speech bubbles. It is all drawn from the game's existing art and posed in code.

| ID | Detail | When | Effort |
|---|---|---|---|
| S1 | **The comic system:** a strip of 3 to 4 panels that slide in one by one, with a little camera move inside each panel, speech bubbles that pop in, and sound words that bounce. Tap to advance, a Skip button, and the strip can be watched again from the map. A small text format describes each strip (characters, poses, background, bubbles) so new strips are cheap. | P1 | L |
| S2 | **Opening comic on first launch:** spring festival at Suryagarh fort → the Bandit King grabs the Sun Crown from the temple → the flowers wilt and the sky turns grey → the Royal Sage turns to the player: "You. New recruit. Ready?" It sets up why spring matters and leads into the tutorial. | P1 | M |
| S3 | **A comic before the boss** (already on the "next" list): the Bandit King on his crate throne, laughing, polishing the crown, sending the boar out. | P1 | M |
| S4 | **A comic for the end of the region:** the crown goes back to the temple, light bursts out, spring rolls across the map (see S9), and in the last panel a scorpion's tail rises in the desert. A teaser for Region 2. | P1 | M |
| S5 | **One-page comics when a hero is unlocked:** how Rani Meera joins (she was hunting the same bandits), the Guru (he guards the stepwell). | P2 | M |
| S6 | **Speech bubbles during battle** for the story beats: the Sage when a new enemy appears (already on the "next" list as hints), the Bandit King's taunts (C32), and villagers ("Thank you!") when you win. | P1 | S |
| S7 | **A cast with a running gag:** a comic sidekick for the Bandit King (for example a skinny, cowardly lieutenant called **Chhotu**, who always runs away first). He appears in every comic and on the battlefield as a harmless runner who is worth bonus gold. | P2 | M |
| S8 | **The Royal Sage as a guide with a personality:** dry humour, a pet parrot that repeats his last word, appears from the side of the screen with a puff of smoke. He gives the hints (already on the "next" list) and comments on how you did ("Three diyas. Not bad, recruit."). | P1 | M |
| S9 | **The map tells the story:** after each win something changes on the world map. Level 1 → lamps lit in the village. Level 2 → water shines in the stepwell. Level 3 → the banyan flowers. Boss → spring sweeps the whole region: flowers bloom, colours brighten, the season name glows. The player can see their progress as a living place. | P1 | M |
| S10 | **Lore scrolls** found as secrets (N9) or earned with 3 diyas: short illustrated pages about the fort, the Sun Crown and each enemy, collected in a **Royal Chronicle** book (see U16). | P2 | M |

## 7. Environment, light and weather

| ID | Detail | When | Effort |
|---|---|---|---|
| W1 | **One wind for the whole level:** a single wind direction and strength that moves grass, tree leaves, flags and banners on towers, smoke, petals, kite strings, cloud shadows and dust, all in the same direction. Gusts come every 20 to 40 s with a sound. This is the cheapest way to make the world feel like one place. | P1 | M |
| W2 | **Time of day per level** in Region 1: Level 0 morning, 1 late morning, 2 noon (short shadows, heat shimmer), 3 afternoon, 4 golden hour, 5 dusk into night (the camp lit by torches and fires, with tower lanterns). A colour grade and the shadow angle change with it. | P1 | M |
| W3 | **The light shifts during the level** (already "later" on the list): the last waves are a little warmer and darker than the first, so a long battle feels like an afternoon passing. | P2 | M |
| W4 | **Ground that remembers the battle:** footprints in the dust of the road that fade, trampled grass along the edges, fallen hats and broken arrows (cartoon, no blood), scorch marks (already done) and cart ruts. All fade over 20 to 40 s so the map never gets cluttered. | P1 | M |
| W5 | **Spring showers in Region 1:** in one or two levels a short rain shower passes mid-battle: streaks and splashes, the road darkens, puddles with rings, the peacock dances, birds shelter, and a **rainbow** appears after it. Cosmetic in Region 1. | P2 | M |
| W6 | **Weather per region,** with gameplay effects 🎮 (already planned):<br>• **Thar:** heat shimmer, dust devils that spin across the road, sandstorms that cut tower range by 15% for 10 s, a mirage lake.<br>• **Ghats:** monsoon rain, puddles that grow on the road and slow enemies, lightning flashes that light up the map, frogs, waterfalls.<br>• **Deccan:** falling autumn leaves, night levels where towers see only inside their lantern light, fireflies.<br>• **Sundarbans:** fog that hides enemies until they are close, tides that flood one road for a while, mangrove roots.<br>• **Himalayas:** snow that builds up on tower roofs and gets knocked off when they fire, footprints in snow, breath clouds, icicles, an avalanche event that blocks a road. | P3 🎮 | L each |
| W7 | **Water that lives:** ripples (done), reflections of towers and clouds in ponds, a shimmer line on the stepwell water, splash rings when someone walks through. | P2 | M |
| W8 | **Soft shadows and contact:** every unit gets a soft shadow ellipse that matches the time of day (W2), and units darken a little when standing under a tree's shadow. | P2 | S |
| W9 | **Wider screens see more world:** on wide phones and tablets the extra space is filled with parallax hills, the next village and birds at the edges, instead of plain grass. | P2 | M |
| W10 | **Festival seasons in the real calendar** (live events, P3): Diwali (lamps on the fort and the map, fireworks after each win), Holi (colour puffs instead of dust when enemies fall, for one week), Makar Sankranti (kites everywhere), monsoon (rain on the menu). Respectful, light and optional. | P3 | M each |

## 8. Sound (things not on the list yet)

| ID | Detail | When | Effort |
|---|---|---|---|
| A1 | **Stereo position:** sounds pan left and right with where they happen on the map, and get quieter far from the centre of the action. A big jump in feel for almost no work. | P1 | S |
| A2 | **Music ducks** under big moments (the boss roar, the victory cry, comic sound words) so they cut through. | P1 | S |
| A3 | **A theme for each character:** a short motif for the Sun Knight (brass), Rani Meera (bansuri), the Guru (singing bowl and tanpura), the Bandit King (a low, comic bassoon-like shehnai). It plays in their comics and when they act. | P2 | M |
| A4 | **Village ambience:** a temple bell far away, cowbells, children laughing, a rooster in morning levels, crickets at dusk. It stops dead when the wave horn sounds and comes back between waves. | P1 | S |
| A5 | **Footsteps by surface** (dirt, grass, stone, water) and by weight (light Bandits, heavy Brutes). | P2 | M |
| A6 | **Interface sounds in the music's key** (Bhupali), so taps and rewards sound like part of the soundtrack. Rewards play a rising run of notes, one per item. | P1 | S |
| A7 | **Region instruments** for the music: Thar (a bowed folk fiddle sound and a heavy drum), Ghats (rain percussion), Deccan (temple bells, a slower raga), Sundarbans (boatmen's rhythm), Himalayas (horn and bowls). | P3 | M each |

## 9. The interface's role

The interface should feel like part of the kingdom (carved wood, brass, parchment, wax seals),
react to everything the player does, and teach without walls of text.

**Battle**

| ID | Detail | When | Effort |
|---|---|---|---|
| U1 | **Preview before building:** when a tower is chosen in the build menu, show its range circle and a see-through ghost of the tower on the spot, and say what it is good against ("Good vs: groups"). Confirm with a second tap (already used for building). | P1 | S |
| U2 | **Undo a build** for 3 s (full refund) to fix a mis-tap, which is the most common annoyance in mobile tower defense. | P1 🎮 | S |
| U3 | **Upgrade comparison:** the upgrade button shows what improves ("Damage 7–11 → 11–17, Range +8"), with the new range drawn as a faint second circle. | P1 | S |
| U4 | **Tap an enemy** to see its card (health, armour, special ability, tip) in a small panel, without pausing. | P1 | S |
| U5 | **Gold counter that feels alive:** the digits roll, the counter pulses gold when you can now afford a tower you looked at, and the build-menu prices turn white from red the moment they become affordable. | P1 | S |
| U6 | **Lives as a living heart:** the heart cracks a little more at each quarter of lives lost and beats faster in time with the music's heartbeat (done) when lives are low. | P1 | S |
| U7 | **Wave preview with numbers:** the entrance marker shows "×12 Bandits, ×2 Brutes" when held down, not just icons. | P1 | S |
| U8 | **Boss warning banner** a wave before the boss: a red scroll unrolls with "The Bandit King approaches!" and a drum roll. | P1 | S |
| U9 | **Move the hero by dragging** (along with tap then tap), with a dotted path shown on the road. Same for Barracks rally points. | P2 | M |
| U10 | **×3 speed** for experienced players, unlocked after the region boss. | P2 | S |
| U11 | **Floating damage numbers** (already on the "next" list) with an option to turn them off, critical hits bigger and gold. | P2 | S |

**Between battles**

| ID | Detail | When | Effort |
|---|---|---|---|
| U12 | **Victory as a ceremony:** the diyas light one by one, each with a rising note and a flame. Coins pour into a purse with a count-up. Then a **battle report**: kills, gold earned, the **best tower** ("Archer Tower by the bend: 48 kills") and the hero's best moment. Players like seeing their own plan pay off. | P1 | M |
| U13 | **Defeat that helps:** a one-line reason ("8 of your 15 lost lives were Wolf Riders: try Barracks to block them") and a button that opens that enemy's card. Players who understand why they lost try again; players who don't, quit. | P1 | S |
| U14 | **Screen transitions in the world's style:** a parchment unrolls into the briefing, a wooden gate opens into the battle, a curtain falls on defeat. Short (0.3 to 0.5 s). | P1 | M |
| U15 | **The "what's next" line:** on the victory panel and the map, show the next reward on its way ("2 more diyas: Forge rank 2", "Next level: meet the Shield Bearer"). | P1 | S |
| U16 | **Royal Chronicle (an encyclopedia):** a book of every enemy, tower and hero, filled in as you meet them, with art, numbers, tips and the lore scrolls (S10). Missing today, and players expect it in the genre. | P2 | M |
| U17 | **Loading and waiting screens with life:** tips, lore lines and an animated character (a soldier sharpening a spear), not just a bar. | P2 | S |
| U18 | **A live main menu that reacts:** tap the guards and they salute, tap the fort flag and it waves harder, the hero you last used stands in front. Later in the game, the menu scene changes with the season of the newest region you've reached. | P2 | M |
| U19 | **Badge discipline:** red badges only for things that can be claimed right now. Never more than two badges on screen; the rest are shown in a single "news" note. | P1 | S |

**Teaching (tutorial)**

| ID | Detail | When | Effort |
|---|---|---|---|
| U20 | **Teach each new thing when it first appears**, not all in the tutorial: the first rubble spot (the Sage points at it), the first special spot opening, the first hero, the first enemy shield, the first portal. One short bubble and an arrow each, shown once. | P1 | M |
| U21 | **Struggle help:** after two losses on the same level the Sage offers one specific tip, and after three, an optional "easier start" (+60 gold). | P1 🎮 | S |

**Feel and accessibility**

| ID | Detail | When | Effort |
|---|---|---|---|
| U22 | **Buttons with weight:** they squash when pressed, spring back, and show a small dust or glint. A shared "press" animation for every button. | P1 | S |
| U23 | **Haptics with meaning:** a light tick when building, a double tick when upgrading, a heavy thud for the boss's footsteps and the elephant's charge, a "success" pattern on winning. All behind the existing vibration setting. | P1 | S |
| U24 | **Accessibility:** a colour-blind mode (each enemy type also has a symbol, health bars change pattern as well as colour), reduced motion (no screen shake, no flashes), subtitles for every bark and sound word, and a left-handed layout that mirrors the hero and spell buttons. | P2 | M |
| U25 | **Hindi translation first,** then other languages. The title font (Rozha One) already includes Devanagari, so the look stays the same. A strong advantage in the home market. | P2 | L |

## 10. Things you didn't mention that will make the game better

| ID | Detail | When | Effort |
|---|---|---|---|
| X1 | **A victory postcard to share:** after a boss win or 3 diyas, the game makes a picture (the battlefield, the player's towers, the hero posing, the score) to share on WhatsApp and Instagram. Free marketing, and very strong in India. | P1 | M |
| X2 | **Difficulty choice per level:** Casual, Normal, Veteran (Veteran gives an extra reward). It keeps both younger players and strategy fans. | P2 🎮 | M |
| X3 | **Tier-4 tower branches:** each basic tower has two final forms with different roles (for example Archers → Royal Longbowmen for long range, or Hill Hunters with poison arrows). This is the main source of long-term depth in the genre. | P3 🎮 | L |
| X4 | **Local notifications:** "Your Forge upgrade is ready", "Your daily chest is waiting". Opt-in and at most one a day. | P1 | S |
| X5 | **Analytics for tuning:** where players lose, which level they quit at, which towers they use. Without it the balance is guesswork after launch. Plus Remote Config to change numbers without an update (already planned under risks). | P1 | M |
| X6 | **A travelling merchant** who crosses the map between waves with a camel. Tap him for a choice: a rewarded ad for gold, or a cheap power-up deal. Ads feel like part of the world, not interruptions. | P2 🎮 | M |
| X7 | **Hidden secrets per level** (N9) tied to achievements: tap the cow 5 times, find the hidden bird nest, free the monkey. These are what players talk about and share. | P2 | M |
| X8 | **Weekly challenge map** with a special rule and a ranking. It brings players back after they finish the story. | P3 | M |
| X9 | **Performance budget for cheap phones:** test on a 2 GB phone, cap the number of particles, and drop the decorative life (villagers, birds, ground marks) in battery-saver mode first. All the life in this list must never cost frames. | P1 | M |
| X10 | **Store page and first 30 seconds:** a 20-second trailer recorded from the game (the boss entrance and the elephant charge), and making sure the first tap after install reaches a battle within 10 seconds. | P1 | M |

---

## Suggested build order

Each step ends in something the user can test on the phone.

1. **Fix the review problems:** F1, F2, F4, F5, F6, F7, F9.
2. **A battlefield that lives:**
   - W1 (one wind)
   - W2 (time of day)
   - W4 (ground memory)
   - N3 (cows)
   - N5 (birds)
   - C11–C14 (soldiers at rest, doors, dust, cheering)
   - C16 (crews at work)
   - C20 (fort guards)
   - A1, A4 (sound position, village ambience)
3. **Level identity:** the landmarks N10–N15 (fixes F3), the villagers N1–N2, and the story items C25.
4. **Heroes and enemies with character:**
   - C1–C5 (hero idles, barks, low health, death and respawn, victory pose)
   - C21–C24 (limping, deaths, personalities, panic)
5. **The boss as an event:** C30, C31, C33, U8.
6. **Comic storytelling:** S1 (the system), then S2, S3, S4, S6, S8, S9.
7. **Interface juice and teaching:** U1–U8, U12–U15, U19–U23.
8. **Launch extras:** X1, X4, X5, X9, X10.
9. **After launch (P2):** the rest of P2, most of all C7 (hero levels), U16 (Chronicle), U25 (Hindi), X2, X6.
10. **With each region (P3):** that region's weather (W6), instruments (A7) and comics.

Steps 1 to 8 are about 6 to 8 weeks of work. Each step can go to your phone on its own, so you can
change the order after playing any of them.
