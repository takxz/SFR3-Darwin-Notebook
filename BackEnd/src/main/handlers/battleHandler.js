const { store } = require('../store/redisStore');
const db = require('../config/db');

// Stockage mémoire des combats actifs pour la boucle temps réel
const activeBattles = {};
const TICK_RATE = 100; // 10Hz

module.exports = function (io, socket) {
    // Check si les deux joueurs sont prêts
    socket.on('playerReady', async () => {
        const player = await store.getPlayer(socket.id);
        const roomId = player?.inBattle;
        if (!roomId || roomId === 'false') return;

        let battle = activeBattles[roomId];
        if (!battle) {
            // First time loading from Redis
            battle = await store.getBattle(roomId);
            if (!battle) return;
            activeBattles[roomId] = battle;
        }

        battle.readyPlayers = battle.readyPlayers || {};
        battle.readyPlayers[socket.id] = true;

        if (Object.keys(battle.readyPlayers).length === 2 && !battle.isStarted) {
            battle.isStarted = true;
            
            // Initialisation de l'état temps réel
            Object.keys(battle.players).forEach(pId => {
                const p = battle.players[pId];
                p.action = 'IDLE'; // IDLE, ATTACKING, PARRYING, STUNNED, DEAD
                p.actionTimer = 0;
                p.specialCharge = 0; // Se remplit en infligeant des dégâts (max 50)
                p.cooldowns = { attack: 0 };
            });
            
            battle.logs = ["Le combat commence en temps réel !"];
            io.to(roomId).emit('battleStart', { players: battle.players });
            
            // Démarrage de la boucle autoritaire Serveur
            startBattleLoop(io, roomId);
        }
    });

    // Actions de combat (Intentions envoyées par les clients)
    socket.on('playerAction', async (data) => {
        const player = await store.getPlayer(socket.id);
        const roomId = player?.inBattle;
        if (!roomId || roomId === 'false') return;

        const battle = activeBattles[roomId];
        if (!battle || battle.ended || battle.specialActive) return;

        const myState = battle.players[socket.id];
        if (!myState || myState.hp <= 0) return;

        // On ne peut agir que si on est IDLE
        if (myState.action !== 'IDLE') return;

        if (data.action === 'ATTACK') {
            if (myState.cooldowns.attack <= 0) {
                myState.action = 'ATTACKING';
                myState.actionTimer = 0;
                myState.attackDealt = false;
                myState.cooldowns.attack = 2000; // 2s de cooldown
            }
        } else if (data.action === 'DEFEND') { // Bouton Paré
            myState.action = 'PARRYING';
            myState.actionTimer = 0;
            battle.logs.push(`${myState.nickname} se met en garde !`);
        } else if (data.action === 'SPECIAL') {
            if (myState.specialCharge >= 50) {
                battle.specialActive = true;
                battle.specialTimer = 3000; // 3s pause d'animation spéciale
                battle.specialAttacker = socket.id;
                myState.action = 'SPECIAL';
                myState.actionTimer = 0;
                myState.specialCharge = 0; // Reset après utilisation
                battle.logs.push(`${myState.nickname} LANCE SON ATTAQUE SPÉCIALE !`);
            }
        }
    });
};

function startBattleLoop(io, roomId) {
    const loop = setInterval(() => {
        const battle = activeBattles[roomId];
        if (!battle || battle.ended) {
            clearInterval(loop);
            return;
        }

        updateBattleState(battle, io, roomId);
    }, TICK_RATE);
    activeBattles[roomId].interval = loop;
}

async function updateBattleState(battle, io, roomId) {
    const pIds = Object.keys(battle.players);
    const p1 = battle.players[pIds[0]];
    const p2 = battle.players[pIds[1]];

    // 1. Réduire les cooldowns
    [p1, p2].forEach(p => {
        if (p.cooldowns.attack > 0) p.cooldowns.attack -= TICK_RATE;
    });

    // 2. Gestion de l'Attaque Spéciale (Stoppe le temps)
    if (battle.specialActive) {
        battle.specialTimer -= TICK_RATE;
        if (battle.specialTimer <= 0) {
            battle.specialActive = false;
            const targetId = pIds.find(id => id !== battle.specialAttacker);
            const target = battle.players[targetId];
            const attacker = battle.players[battle.specialAttacker];
            
            const dmg = 30 + Math.floor(Math.random() * 10);
            target.hp = Math.max(0, target.hp - dmg);
            battle.logs.push(`L'attaque spéciale de ${attacker.nickname} inflige ${dmg} PV !`);
            
            if (target.hp <= 0) {
                target.action = 'DEAD';
                target.hp = 0;
            }
            
            p1.action = 'IDLE';
            p2.action = 'IDLE';
        }
    } else {
        // 3. Gestion des états normaux
        [p1, p2].forEach((p, idx) => {
            const opponentId = pIds[idx === 0 ? 1 : 0];
            const opponent = battle.players[opponentId];

            if (p.action === 'STUNNED') {
                p.actionTimer += TICK_RATE;
                if (p.actionTimer >= 2000) { // Stun de 2s
                    p.action = 'IDLE';
                    p.actionTimer = 0;
                }
            } else if (p.action === 'PARRYING') {
                p.actionTimer += TICK_RATE;
                if (p.actionTimer >= 300) { // Durée de parade réduite à 0.3s pour plus de challenge
                    p.action = 'IDLE';
                    p.actionTimer = 0;
                }
            } else if (p.action === 'ATTACKING') {
                p.actionTimer += TICK_RATE;
                
                // Phase 1 : 0-400ms (vulnérable, recul)
                // Phase 2 : 400-1000ms (invulnérable, coup en avant)
                // Dégâts à 1000ms
                if (p.actionTimer >= 1000 && !p.attackDealt) {
                    p.attackDealt = true;
                    
                    if (opponent.action === 'PARRYING') {
                        // Parade réussie !
                        p.action = 'STUNNED';
                        p.actionTimer = 0;
                        battle.logs.push(`${opponent.nickname} a paré l'attaque de ${p.nickname} !`);
                    } else {
                        // Coup réussi !
                        const dmg = 15;
                        opponent.hp = Math.max(0, opponent.hp - dmg);
                        p.specialCharge = Math.min(50, (p.specialCharge || 0) + dmg); // Charge du spécial
                        battle.logs.push(`${p.nickname} attaque (-${dmg} PV)`);
                        
                        // Si l'adversaire préparait une attaque (Phase 1 vulnérable < 400ms), elle est annulée
                        if (opponent.action === 'ATTACKING' && opponent.actionTimer < 400) {
                            opponent.action = 'IDLE';
                            opponent.actionTimer = 0;
                            battle.logs.push(`L'attaque de ${opponent.nickname} a été annulée !`);
                        }
                        
                        if (opponent.hp <= 0) {
                            opponent.action = 'DEAD';
                            opponent.hp = 0;
                        } else if (opponent.action === 'IDLE') {
                            opponent.action = 'HIT'; // Optionnel pour UI
                            setTimeout(() => { if (opponent.action === 'HIT') opponent.action = 'IDLE'; }, 300);
                        }
                    }
                }
                
                if (p.actionTimer >= 1200) { // Fin de l'animation d'attaque complète
                    if (p.action === 'ATTACKING') {
                        p.action = 'IDLE';
                        p.actionTimer = 0;
                    }
                }
            }
        });
    }

    if (battle.logs.length > 5) battle.logs.shift();

    let result = null;
    if (p1.hp <= 0 || p2.hp <= 0) {
        battle.ended = true;
        result = { 
            winner: p1.hp > 0 ? pIds[0] : p2.hp > 0 ? pIds[1] : null,
            loser: p1.hp <= 0 ? pIds[0] : p2.hp <= 0 ? pIds[1] : null
        };
    }

    // Broadcast state
    io.to(roomId).emit('gameUpdate', {
        players: battle.players,
        logs: battle.logs,
        result: result
    });

    if (battle.ended) {
        await handleBattleEnd(roomId, battle, result, io);
    }
}

async function handleBattleEnd(roomId, battle, result, io) {
    if (battle.interval) clearInterval(battle.interval);
    delete activeBattles[roomId];

    try {
        const p1 = battle.players[result.loser] || battle.players[Object.keys(battle.players)[0]]; 
        const p2 = battle.players[result.winner] || battle.players[Object.keys(battle.players)[1]];
        
        await db.query(
            `INSERT INTO "FIGHT" (played_at, player1_id, player2_id, creature1_id, creature2_id, winner_id)
             VALUES (NOW(), $1, $2, $3, $4, $5)`,
            [
                p1.playerId, 
                p2.playerId, 
                p1.creatureId, 
                p2.creatureId, 
                battle.players[result.winner]?.playerId
            ]
        );
        console.log(`[BattleEngine] 📜 Combat enregistré dans FIGHT`);
    } catch (err) {
        console.error("[BattleEngine] ⚠️ Impossible d'enregistrer l'historique:", err.message);
    }

    const winnerCreatureId = battle.players[result.winner]?.creatureId;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(winnerCreatureId);

    if (winnerCreatureId && isUUID) {
        try {
            const xpGain = 50;
            const bioTokenGain = 10;

            const creatureResult = await db.query(
                `UPDATE "CREATURE" SET experience = experience + $1 WHERE id = $2 RETURNING player_id`,
                [xpGain, winnerCreatureId]
            );

            if (creatureResult.rows.length > 0) {
                const playerId = creatureResult.rows[0].player_id;
                await db.query(
                    `UPDATE "PLAYER" 
                     SET xp = xp + $1,
                         bio_token = CAST(COALESCE(NULLIF(bio_token, ''), '0')::int + $2 AS varchar)
                     WHERE id = $3`,
                    [xpGain, bioTokenGain, playerId]
                );
            }
            io.to(result.winner).emit('REWARD_GRANTED', { xp: xpGain, bioTokens: bioTokenGain });

        } catch (err) {
            console.error("[BattleEngine] ❌ Erreur SQL récompenses:", err.message);
        }
    }

    await store.deleteBattle(roomId);
    await store.updatePlayerBattle(result.winner, 'false');
    await store.updatePlayerBattle(result.loser, 'false');
}
