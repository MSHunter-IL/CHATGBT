# Neon Loop Clicker

A compact, dopamine-focused browser clicker game built with plain HTML/CSS/JavaScript.

## 1) Game concept (short)
You harvest **Spark** by repeatedly pressing a single action button. Every action gives instant visual and numeric feedback, can trigger random high-value outcomes (critical harvests and bonus loot), and grants XP. XP levels award extra Spark and Shards. Spark buys upgrades that accelerate gains and unlock stronger outcomes. Once you reach enough Spark, you can **Prestige Reset** to restart and gain permanent multipliers.

## 2) Core gameplay loop
**Primary loop:**
1. Perform action: `Harvest Spark`
2. Get reward: Spark + XP (+ random crit/bonus outcomes)
3. Buy upgrade(s): improve base gains, crit chance, XP gain, and bonus-drop chance
4. Progress faster due to upgrades
5. Repeat for compounding growth

**Secondary loop:**
- Complete missions (e.g., reach Spark/action/level thresholds)
- Claim mission rewards to speed progression

**Failure handling:**
- Trying to buy an upgrade without enough Spark still grants a small pity XP reward.

## 3) Full runnable code
- `index.html`
- `script.js`

Run by opening `index.html` in any modern browser.

## 4) Tunable variables for addiction/progression feel
In `script.js`, tune values inside `TUNING` and upgrade definitions:
- `baseSparkMin`, `baseSparkMax`: baseline action reward
- `critChance`, `critMultiplier`: frequency/impact of high dopamine spikes
- `bonusChance`, `bonusSpark`: random loot cadence
- `levelXPBase`, `levelXPExponent`: quick early levels vs slower late progression
- `levelRewardBase`: size of level-up bursts
- `prestigeBaseCost`, `prestigePermanentBoost`: reset timing and long-term power gain
- Upgrade values (`baseCost`, `scale`, effect per level): economy pacing and strategic depth

## 5) Future expansion ideas
- Timed combo streaks with decaying multipliers
- Multiple resource layers (Spark → Plasma → Quantum)
- Rare collectible cards that add passive buffs
- Limited-time events with rotating modifiers
- Offline progress and save/load system (localStorage)
- Boss actions requiring risk/reward choices

