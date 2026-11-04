# Art bible: Sandstone Kingdom

Every image here is rendered straight from the game's drawing code (`game/src/art/`) by
`node game/tools/catalog.mjs`. Nothing is hand-painted or licensed, so there are no copyright
worries, and art changes show up here automatically when the catalog is re-run.

**Style:** cartoon tower defense with a medieval Indian theme. It uses bold dark-brown outlines,
warm sandstone and saffron colours, soft light from the top left, and gold trim for anything royal.
Names are in plain English (Archers, Knights, Holy Knights, Magic Caster).

## Hero and your army

<table>
<tr><td align="center" valign="bottom"><img src="img/hero-sun-knight.png" width="130" alt="The Sun Knight"><br><b>The Sun Knight</b><br><sub>Hero · moves on tap · Sun Strike stuns</sub></td><td align="center" valign="bottom"><img src="img/ally-spearman.png" width="130" alt="Spearmen"><br><b>Spearmen</b><br><sub>Barracks tier 1</sub></td><td align="center" valign="bottom"><img src="img/ally-knight.png" width="130" alt="Knights"><br><b>Knights</b><br><sub>Barracks tier 2</sub></td><td align="center" valign="bottom"><img src="img/ally-holy-knight.png" width="130" alt="Holy Knights"><br><b>Holy Knights</b><br><sub>Barracks tier 3</sub></td><td align="center" valign="bottom"><img src="img/ally-archer.png" width="130" alt="Archers"><br><b>Archers</b><br><sub>on the Archer Tower</sub></td><td align="center" valign="bottom"><img src="img/ally-magic-caster.png" width="130" alt="Magic Caster"><br><b>Magic Caster</b><br><sub>on the Mage Tower</sub></td></tr>
</table>

## Enemies in the game now: Region 1, Aravalli Hills (8 + boss)

<table>
<tr><td align="center" valign="bottom"><img src="img/enemy-bandit.png" width="120" alt="Bandit"><br><b>Bandit</b><br><sub>fast, comes in groups</sub></td><td align="center" valign="bottom"><img src="img/enemy-wolf-rider.png" width="120" alt="Wolf Rider"><br><b>Wolf Rider</b><br><sub>very fast</sub></td><td align="center" valign="bottom"><img src="img/enemy-bandit-archer.png" width="120" alt="Bandit Archer"><br><b>Bandit Archer</b><br><sub>shoots soldiers from range</sub></td><td align="center" valign="bottom"><img src="img/enemy-saboteur.png" width="120" alt="Saboteur"><br><b>Saboteur</b><br><sub>slips past soldiers, jams towers</sub></td><td align="center" valign="bottom"><img src="img/enemy-barbarian.png" width="120" alt="Barbarian"><br><b>Barbarian</b><br><sub>tough, hits soldiers hard</sub></td></tr>
<tr><td align="center" valign="bottom"><img src="img/enemy-war-drummer.png" width="120" alt="War Drummer"><br><b>War Drummer</b><br><sub>enhancer: speeds up and strengthens allies</sub></td><td align="center" valign="bottom"><img src="img/enemy-armored-brute.png" width="120" alt="Armored Brute"><br><b>Armored Brute</b><br><sub>heavy armour, weak to magic</sub></td><td align="center" valign="bottom"><img src="img/enemy-shield-bearer.png" width="120" alt="Shield Bearer"><br><b>Shield Bearer</b><br><sub>shields comrades, strongest first</sub></td><td align="center" valign="bottom"><img src="img/boss-bandit-king.png" width="120" alt="The Bandit King"><br><b>The Bandit King</b><br><sub>boss · calls bandits</sub></td></tr>
</table>

## Animation

Every soldier, hero and enemy has five frames: idle, two walking steps (legs swing from the hip,
the body bobs) and two attack poses (wind-up and strike). Archers on the towers loose their arrows.

<table>
<tr><td align="center" valign="bottom"><img src="img/anim-bandit-walk-1.png" width="120" alt="Walk, step 1"><br><b>Walk, step 1</b></td><td align="center" valign="bottom"><img src="img/anim-bandit-walk-2.png" width="120" alt="Walk, step 2"><br><b>Walk, step 2</b></td><td align="center" valign="bottom"><img src="img/anim-bandit-attack.png" width="120" alt="Attack"><br><b>Attack</b></td><td align="center" valign="bottom"><img src="img/anim-knight-attack.png" width="120" alt="Knight strike"><br><b>Knight strike</b></td><td align="center" valign="bottom"><img src="img/anim-archer-loose.png" width="120" alt="Archer looses"><br><b>Archer looses</b></td></tr>
</table>

## Enemies ready for the next regions (free updates)

Each region brings new enemies and a boss on every 5th level.

| Region · season | Enemies |
|---|---|
| **Thar Desert** · summer | <img src="img/r2-scorpion.png" height="90" alt="Scorpion Swarm" title="Scorpion Swarm"> <img src="img/r2-camel-raider.png" height="90" alt="Camel Raider" title="Camel Raider"> <img src="img/r2-sand-burrower.png" height="90" alt="Sand Burrower" title="Sand Burrower"> <img src="img/r2-boss-dune-colossus.png" height="90" alt="Boss: Dune Colossus" title="Boss: Dune Colossus"><br>Scorpion Swarm · Camel Raider · Sand Burrower · **Boss: Dune Colossus** |
| **Western Ghats** · monsoon | <img src="img/r3-river-raider.png" height="90" alt="River Raider" title="River Raider"> <img src="img/r3-mud-brute.png" height="90" alt="Mud Brute" title="Mud Brute"> <img src="img/r3-storm-bat.png" height="90" alt="Storm Bat" title="Storm Bat"> <img src="img/r3-boss-storm-serpent.png" height="90" alt="Boss: Storm Serpent" title="Boss: Storm Serpent"><br>River Raider · Mud Brute · Storm Bat · **Boss: Storm Serpent** |
| **Deccan Ruins** · autumn | <img src="img/r4-stone-golem.png" height="90" alt="Stone Golem" title="Stone Golem"> <img src="img/r4-night-stalker.png" height="90" alt="Night Stalker" title="Night Stalker"> <img src="img/r4-shaman.png" height="90" alt="Shaman" title="Shaman"> <img src="img/r4-boss-stone-titan.png" height="90" alt="Boss: Stone Titan" title="Boss: Stone Titan"><br>Stone Golem · Night Stalker · Shaman · **Boss: Stone Titan** |
| **Sundarbans** · pre-winter | <img src="img/r5-crocodile.png" height="90" alt="Crocodile" title="Crocodile"> <img src="img/r5-river-pirate.png" height="90" alt="River Pirate" title="River Pirate"> <img src="img/r5-swamp-witch.png" height="90" alt="Swamp Witch" title="Swamp Witch"> <img src="img/r5-boss-crocodile-warlord.png" height="90" alt="Boss: Crocodile Warlord" title="Boss: Crocodile Warlord"><br>Crocodile · River Pirate · Swamp Witch · **Boss: Crocodile Warlord** |
| **Himalayas** · winter | <img src="img/r6-ice-wolf.png" height="90" alt="Ice Wolf" title="Ice Wolf"> <img src="img/r6-frost-mage.png" height="90" alt="Frost Mage" title="Frost Mage"> <img src="img/r6-yeti-brute.png" height="90" alt="Yeti Brute" title="Yeti Brute"> <img src="img/r6-boss-shadow-emperor.png" height="90" alt="Final boss: Shadow Emperor" title="Final boss: Shadow Emperor"><br>Ice Wolf · Frost Mage · Yeti Brute · **Final boss: Shadow Emperor** |

## Towers: three tiers, each clearly different

Tier 1 is a small outpost behind a wooden palisade; tier 2 a taller tower with gold studs and
pennants; tier 3 a grand tower on a marble plinth with domed pavilions, banners and a crest.
Upgrading plays a pillar of golden light and "UPGRADED!".

<table>
<tr><td align="center" valign="bottom"><img src="img/tower-archer-tier1.png" width="140" alt="Archer Tower · tier 1"><br><b>Archer Tower · tier 1</b><br><sub>Archers</sub></td><td align="center" valign="bottom"><img src="img/tower-archer-tier2.png" width="140" alt="Archer Tower · tier 2"><br><b>Archer Tower · tier 2</b><br><sub>Marksmen</sub></td><td align="center" valign="bottom"><img src="img/tower-archer-tier3.png" width="140" alt="Archer Tower · tier 3"><br><b>Archer Tower · tier 3</b><br><sub>Royal Longbows</sub></td></tr>
<tr><td align="center" valign="bottom"><img src="img/tower-barracks-tier1.png" width="140" alt="Barracks · tier 1"><br><b>Barracks · tier 1</b><br><sub>Spearmen</sub></td><td align="center" valign="bottom"><img src="img/tower-barracks-tier2.png" width="140" alt="Barracks · tier 2"><br><b>Barracks · tier 2</b><br><sub>Knights</sub></td><td align="center" valign="bottom"><img src="img/tower-barracks-tier3.png" width="140" alt="Barracks · tier 3"><br><b>Barracks · tier 3</b><br><sub>Holy Knights</sub></td></tr>
<tr><td align="center" valign="bottom"><img src="img/tower-mage-tier1.png" width="140" alt="Mage Tower · tier 1"><br><b>Mage Tower · tier 1</b><br><sub>Magic Caster</sub></td><td align="center" valign="bottom"><img src="img/tower-mage-tier2.png" width="140" alt="Mage Tower · tier 2"><br><b>Mage Tower · tier 2</b><br><sub>Arcane Sage</sub></td><td align="center" valign="bottom"><img src="img/tower-mage-tier3.png" width="140" alt="Mage Tower · tier 3"><br><b>Mage Tower · tier 3</b><br><sub>Sun Mage</sub></td></tr>
<tr><td align="center" valign="bottom"><img src="img/tower-cannon-tier1.png" width="140" alt="Cannon Tower · tier 1"><br><b>Cannon Tower · tier 1</b><br><sub>Cannon</sub></td><td align="center" valign="bottom"><img src="img/tower-cannon-tier2.png" width="140" alt="Cannon Tower · tier 2"><br><b>Cannon Tower · tier 2</b><br><sub>Bombard</sub></td><td align="center" valign="bottom"><img src="img/tower-cannon-tier3.png" width="140" alt="Cannon Tower · tier 3"><br><b>Cannon Tower · tier 3</b><br><sub>Thunder Cannon</sub></td></tr>
</table>

## Special towers: 8 levels, up to 3 per battle, only on special spots

Unlocked with rubies or a big pile of coins (the Royal Falconer is a free story reward). Their look
changes every two levels; gold pips under the tower show its level.

<table>
<tr><td align="center" valign="bottom"><img src="img/royal-falconer-stage1.png" width="150" alt="Royal Falconer"><br><b>Royal Falconer</b><br><sub>levels 1–2</sub></td><td align="center" valign="bottom"><img src="img/royal-falconer-stage4.png" width="150" alt="Royal Falconer"><br><b>Royal Falconer</b><br><sub>levels 7–8</sub></td><td align="center" valign="bottom"><img src="img/royal-fountain-stage1.png" width="150" alt="Stepwell Fountain"><br><b>Stepwell Fountain</b><br><sub>levels 1–2</sub></td><td align="center" valign="bottom"><img src="img/royal-fountain-stage4.png" width="150" alt="Stepwell Fountain"><br><b>Stepwell Fountain</b><br><sub>levels 7–8</sub></td></tr>
</table>
<table>
<tr><td align="center" valign="bottom"><img src="img/royal-alchemist-stage1.png" width="150" alt="Alchemist's Workshop"><br><b>Alchemist's Workshop</b><br><sub>poison flasks, strips armour</sub></td><td align="center" valign="bottom"><img src="img/royal-alchemist-stage4.png" width="150" alt="Alchemist's Workshop"><br><b>Alchemist's Workshop</b><br><sub>levels 7–8</sub></td><td align="center" valign="bottom"><img src="img/royal-elephant-stage1.png" width="150" alt="War Elephant Stable"><br><b>War Elephant Stable</b><br><sub>an elephant charges</sub></td><td align="center" valign="bottom"><img src="img/unit-war-elephant.png" width="150" alt="The War Elephant"><br><b>The War Elephant</b><br><sub>tramples and knocks back</sub></td></tr>
</table>

<table>
<tr><td align="center" valign="bottom"><img src="img/building-fort-gate.png" width="190" alt="The Fort"><br><b>The Fort</b><br><sub>what you defend; also the menu and icon art</sub></td></tr>
</table>

## Build spots

**Standard** spots take the four basic towers. **Rubble** costs battle gold to clear. **Special** spots (1 to 3 per level)
open one by one during the battle, or earlier for gold, and take only special towers.

<table>
<tr><td align="center" valign="bottom"><img src="img/spot-open.png" width="120" alt="Open spot"><br><b>Open spot</b></td><td align="center" valign="bottom"><img src="img/spot-special.png" width="120" alt="Special spot"><br><b>Special spot</b><br><sub>max 3 per level</sub></td><td align="center" valign="bottom"><img src="img/spot-rubble.png" width="120" alt="Rubble"><br><b>Rubble</b><br><sub>clear with gold</sub></td><td align="center" valign="bottom"><img src="img/spot-timed.png" width="120" alt="Sundial"><br><b>Sundial</b><br><sub>opens at wave N</sub></td></tr>
</table>

## Scenery (Aravalli Hills)

<table>
<tr><td align="center" valign="bottom"><img src="img/scenery-banyan.png" width="120" alt="Banyan"><br><b>Banyan</b></td><td align="center" valign="bottom"><img src="img/scenery-palm.png" width="120" alt="Palm"><br><b>Palm</b></td><td align="center" valign="bottom"><img src="img/scenery-rock.png" width="120" alt="Rock"><br><b>Rock</b></td><td align="center" valign="bottom"><img src="img/scenery-stepwell.png" width="120" alt="Stepwell"><br><b>Stepwell</b></td><td align="center" valign="bottom"><img src="img/scenery-shrine.png" width="120" alt="Shrine"><br><b>Shrine</b></td><td align="center" valign="bottom"><img src="img/scenery-peacock.png" width="120" alt="Peacock"><br><b>Peacock</b></td></tr>
<tr><td align="center" valign="bottom"><img src="img/scenery-tents.png" width="120" alt="Tents"><br><b>Tents</b></td><td align="center" valign="bottom"><img src="img/scenery-campfire.png" width="120" alt="Campfire"><br><b>Campfire</b></td><td align="center" valign="bottom"><img src="img/scenery-cart.png" width="120" alt="Cart"><br><b>Cart</b></td><td align="center" valign="bottom"><img src="img/scenery-pond.png" width="120" alt="Pond"><br><b>Pond</b></td><td align="center" valign="bottom"><img src="img/scenery-haystack.png" width="120" alt="Haystack"><br><b>Haystack</b></td><td align="center" valign="bottom"><img src="img/scenery-pots.png" width="120" alt="Pots"><br><b>Pots</b></td></tr>
</table>

The peacock has a secret: tap it 10 times in battle for the *Peacock Whisperer* achievement.

## World environments

**World map:** a side-scrolling journey through six regions and seasons, with level nodes,
a boss shield on every 5th level, and diyas (lamps) earned on each node.

![World map, story mode](img/screen-map-story.png)

**Battlefields.** Each level has its own road layout, scenery and enemy camp (more in [levels.md](levels.md)):

| | |
|---|---|
| ![Training Grounds](img/level-0.png) Tutorial: Training Grounds | ![Village at the Pass](img/level-1.png) 1: Village at the Pass |
| ![The Stepwell Road](img/level-2.png) 2: The Stepwell Road | ![Banyan Crossing](img/level-3.png) 3: Banyan Crossing |
| ![The Old Watchtower](img/level-4.png) 4: The Old Watchtower | ![The Bandit King's Camp](img/level-5.png) 5: The Bandit King's Camp (boss) |

## UI art

<table>
<tr><td align="center" valign="bottom"><img src="img/ui-logo.png" width="140" alt="Logo"><br><b>Logo</b></td><td align="center" valign="bottom"><img src="img/ui-royal-chest.png" width="140" alt="Royal chest"><br><b>Royal chest</b><br><sub>day-7 reward, starter pack</sub></td><td align="center" valign="bottom"><img src="img/ui-coin.png" width="140" alt="Coin"><br><b>Coin</b></td><td align="center" valign="bottom"><img src="img/ui-ruby.png" width="140" alt="Ruby"><br><b>Ruby</b></td><td align="center" valign="bottom"><img src="img/ui-diya.png" width="140" alt="Diya"><br><b>Diya</b><br><sub>level rating, 1 to 3</sub></td></tr>
</table>

**Palette:** sandstone `#e8b47a` · saffron `#f0912a` · royal red `#c8361d` · gold `#e0a224` · outline `#3a2414` · parchment `#fdf2d8` · grass `#7fb145`.
**Fonts:** Rozha One (titles), Martel (text). Both are under the SIL Open Font Licence and bundled in the game.
