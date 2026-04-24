const getXpThreshold = (lvl) => 100 + (lvl - 1) * 10;

function simulateProgress(initialXp, initialLevel, xpGained) {
    let xp = initialXp + xpGained;
    let level = initialLevel;
    let levelUps = 0;

    while (xp >= getXpThreshold(level)) {
        xp -= getXpThreshold(level);
        level++;
        levelUps++;
    }

    return { xp, level, levelUps };
}

// Test cases
const tests = [
    { name: "Gain 50 XP at Level 1, 0 XP", initialXp: 0, initialLevel: 1, gain: 50, expectedLevel: 1, expectedXp: 50 },
    { name: "Gain 110 XP at Level 1, 0 XP (Level Up)", initialXp: 0, initialLevel: 1, gain: 110, expectedLevel: 2, expectedXp: 10 },
    { name: "Gain 300 XP at Level 1, 0 XP (Double Level Up)", initialXp: 0, initialLevel: 1, gain: 300, expectedLevel: 3, expectedXp: 90 },
    { name: "Gain 50 XP at Level 2, 90 XP (Level Up to 3)", initialXp: 90, initialLevel: 2, gain: 50, expectedLevel: 3, expectedXp: 30 },
];

console.log("--- START GAMIFICATION MOCK TESTS ---");
tests.forEach(t => {
    const result = simulateProgress(t.initialXp, t.initialLevel, t.gain);
    const success = result.level === t.expectedLevel && result.xp === t.expectedXp;
    console.log(`[${success ? 'SUCCESS' : 'FAILED'}] ${t.name}`);
    if (!success) {
        console.log(`   Expected: Level ${t.expectedLevel}, XP ${t.expectedXp}`);
        console.log(`   Got: Level ${result.level}, XP ${result.xp}`);
    }
});
console.log("--- END GAMIFICATION MOCK TESTS ---");

// Stats growth simulation (for creature)
function simulateStatsGrowth(levelUps) {
    let stats = { pv: 10, atq: 10, def: 10, spd: 10 };
    for (let i = 0; i < levelUps; i++) {
        stats.pv += 3; // Average of random(2, 5)
        stats.atq += 3;
        stats.def += 3;
        stats.spd += 3;
    }
    return stats;
}

const level3Stats = simulateStatsGrowth(2);
console.log("\n--- CREATURE STATS GROWTH MOCK (Level 1 -> 3) ---");
console.log(`Final Stats: PV:${level3Stats.pv}, ATQ:${level3Stats.atq}, DEF:${level3Stats.def}, SPD:${level3Stats.spd}`);
