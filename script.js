// Neon Loop Clicker
// Lightweight dopamine-driven clicker with progression, randomness, missions, and prestige.

const TUNING = {
  baseSparkMin: 4,
  baseSparkMax: 8,
  critChance: 0.15,
  critMultiplier: 2,
  bonusChance: 0.08,
  bonusSpark: 30,
  prestigeBaseCost: 600,
  levelXPBase: 20,
  levelXPExponent: 1.28,
  levelRewardBase: 20,
  prestigePermanentBoost: 0.12 // +12% permanent gain per prestige level
};

const state = {
  spark: 0,
  level: 1,
  xp: 0,
  shards: 0,
  prestige: 0,
  totalActions: 0,
  lifetimeSpark: 0,
  upgrades: [
    {
      id: 'efficiency',
      name: 'Efficiency Core',
      desc: '+2 base spark per level',
      level: 0,
      baseCost: 50,
      scale: 1.45
    },
    {
      id: 'critBoost',
      name: 'Critical Matrix',
      desc: '+6% crit chance per level',
      level: 0,
      baseCost: 90,
      scale: 1.6
    },
    {
      id: 'xpFlow',
      name: 'XP Injector',
      desc: '+20% XP gain per level',
      level: 0,
      baseCost: 75,
      scale: 1.5
    },
    {
      id: 'lootPulse',
      name: 'Loot Pulse',
      desc: '+4% bonus drop chance per level',
      level: 0,
      baseCost: 130,
      scale: 1.65
    }
  ],
  missions: [
    {
      id: 'firstHundred',
      title: 'Spark Starter',
      desc: 'Reach 100 Spark',
      done: false,
      check: s => s.spark >= 100,
      reward: s => {
        s.spark += 40;
      },
      rewardText: '+40 Spark'
    },
    {
      id: 'clickRush',
      title: 'Action Rush',
      desc: 'Perform 50 actions',
      done: false,
      check: s => s.totalActions >= 50,
      reward: s => {
        s.xp += 35;
      },
      rewardText: '+35 XP'
    },
    {
      id: 'levelBurst',
      title: 'Power Climb',
      desc: 'Reach level 8',
      done: false,
      check: s => s.level >= 8,
      reward: s => {
        s.shards += 2;
      },
      rewardText: '+2 Shards'
    }
  ]
};

const el = {
  actionBtn: document.getElementById('actionBtn'),
  prestigeBtn: document.getElementById('prestigeBtn'),
  actionLog: document.getElementById('actionLog'),
  sparkValue: document.getElementById('sparkValue'),
  levelValue: document.getElementById('levelValue'),
  xpValue: document.getElementById('xpValue'),
  shardValue: document.getElementById('shardValue'),
  prestigeValue: document.getElementById('prestigeValue'),
  xpLabel: document.getElementById('xpLabel'),
  xpFill: document.getElementById('xpFill'),
  upgrades: document.getElementById('upgrades'),
  missions: document.getElementById('missions')
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getUpgrade(id) {
  return state.upgrades.find(u => u.id === id);
}

function getXPToNext(level = state.level) {
  return Math.floor(TUNING.levelXPBase * Math.pow(level, TUNING.levelXPExponent));
}

function getUpgradeCost(upgrade) {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.scale, upgrade.level));
}

function getPermanentMultiplier() {
  return 1 + state.prestige * TUNING.prestigePermanentBoost;
}

function getActionProfile() {
  const efficiency = getUpgrade('efficiency').level;
  const critBoost = getUpgrade('critBoost').level;
  const xpFlow = getUpgrade('xpFlow').level;
  const lootPulse = getUpgrade('lootPulse').level;

  return {
    sparkMin: TUNING.baseSparkMin + efficiency * 2,
    sparkMax: TUNING.baseSparkMax + efficiency * 2,
    critChance: Math.min(0.8, TUNING.critChance + critBoost * 0.06),
    bonusChance: Math.min(0.7, TUNING.bonusChance + lootPulse * 0.04),
    xpMult: 1 + xpFlow * 0.2,
    permMult: getPermanentMultiplier()
  };
}

function gainXP(amount) {
  state.xp += amount;
  while (state.xp >= getXPToNext()) {
    state.xp -= getXPToNext();
    state.level += 1;
    const levelReward = Math.floor(TUNING.levelRewardBase * Math.pow(1.18, state.level - 1));
    state.spark += levelReward;
    state.shards += 1;
    log(`🎉 Level ${state.level}! Bonus +${levelReward} Spark, +1 Shard.`);
  }
}

function doAction() {
  const p = getActionProfile();
  state.totalActions += 1;

  let sparkGain = randInt(p.sparkMin, p.sparkMax);
  const tags = [];

  if (Math.random() < p.critChance) {
    sparkGain = Math.floor(sparkGain * TUNING.critMultiplier);
    tags.push('CRIT x2');
  }

  if (Math.random() < p.bonusChance) {
    sparkGain += TUNING.bonusSpark;
    tags.push('BONUS LOOT');
  }

  sparkGain = Math.floor(sparkGain * p.permMult);
  const xpGain = Math.max(1, Math.floor((3 + sparkGain * 0.14) * p.xpMult));

  state.spark += sparkGain;
  state.lifetimeSpark += sparkGain;
  gainXP(xpGain);

  if (tags.length === 0) {
    log(`+${sparkGain} Spark, +${xpGain} XP`);
  } else {
    log(`+${sparkGain} Spark, +${xpGain} XP [${tags.join(' | ')}]`);
  }

  evaluateMissions();
  render();
}

function buyUpgrade(id) {
  const upgrade = getUpgrade(id);
  const cost = getUpgradeCost(upgrade);

  if (state.spark < cost) {
    // Failure still gives partial reward to avoid hard punishment.
    const pityXp = 2;
    gainXP(pityXp);
    log(`Not enough Spark. Pity +${pityXp} XP granted.`);
    render();
    return;
  }

  state.spark -= cost;
  upgrade.level += 1;
  log(`${upgrade.name} upgraded to Lv.${upgrade.level}!`);
  render();
}

function getPrestigeCost() {
  return Math.floor(TUNING.prestigeBaseCost * Math.pow(1.7, state.prestige));
}

function prestigeReset() {
  const cost = getPrestigeCost();
  if (state.spark < cost) {
    log(`Need ${cost} Spark to prestige.`);
    return;
  }

  state.prestige += 1;
  state.spark = 0;
  state.level = 1;
  state.xp = 0;
  state.shards = 0;
  state.totalActions = 0;
  state.upgrades.forEach(u => {
    u.level = 0;
  });
  state.missions.forEach(m => {
    m.done = false;
  });

  log(`🌌 Prestige achieved! Permanent +${Math.floor(getPermanentMultiplier() * 100 - 100)}% Spark gains.`);
  render();
}

function evaluateMissions() {
  state.missions.forEach(m => {
    if (!m.done && m.check(state)) {
      m.done = true;
      m.reward(state);
      log(`✅ Mission complete: ${m.title} (${m.rewardText})`);
    }
  });
}

function log(text) {
  el.actionLog.textContent = text;
}

function renderUpgrades() {
  el.upgrades.innerHTML = '';

  state.upgrades.forEach(upgrade => {
    const cost = getUpgradeCost(upgrade);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${upgrade.name} (Lv.${upgrade.level})</h3>
      <p class="muted">${upgrade.desc}</p>
      <p>Cost: <strong>${cost}</strong> Spark</p>
      <button data-upgrade-id="${upgrade.id}">Buy Upgrade</button>
    `;

    const btn = card.querySelector('button');
    btn.disabled = state.spark < cost;
    btn.addEventListener('click', () => buyUpgrade(upgrade.id));
    el.upgrades.appendChild(card);
  });
}

function renderMissions() {
  el.missions.innerHTML = '';
  state.missions.forEach(m => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${m.done ? '✅' : '🎯'} ${m.title}</h3>
      <p class="muted">${m.desc}</p>
      <p>${m.done ? `Reward claimed: ${m.rewardText}` : `Reward: ${m.rewardText}`}</p>
    `;
    el.missions.appendChild(card);
  });
}

function render() {
  const xpToNext = getXPToNext();
  const xpPercent = Math.min(100, (state.xp / xpToNext) * 100);

  el.sparkValue.textContent = state.spark;
  el.levelValue.textContent = state.level;
  el.xpValue.textContent = state.xp;
  el.shardValue.textContent = state.shards;
  el.prestigeValue.textContent = state.prestige;
  el.xpLabel.textContent = `XP to next level: ${xpToNext - state.xp}`;
  el.xpFill.style.width = `${xpPercent}%`;

  const prestigeCost = getPrestigeCost();
  el.prestigeBtn.textContent = `Prestige Reset (${prestigeCost} Spark)`;

  renderUpgrades();
  renderMissions();
}

el.actionBtn.addEventListener('click', doAction);
el.prestigeBtn.addEventListener('click', prestigeReset);

render();
