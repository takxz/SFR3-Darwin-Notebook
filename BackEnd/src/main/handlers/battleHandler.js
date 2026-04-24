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
            for (const pId of Object.keys(battle.players)) {
                const p = battle.players[pId];
                
                // Récupération des vraies stats en base si possible
                let atk = 50;
                let def = 30;
                let speed = 50;
                let maxHp = 100;
                
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.creatureId);
                
                if (isUUID) {
                    try {
                        const res = await db.query('SELECT stat_atq, stat_def, stat_pv, stat_speed FROM "CREATURE" WHERE id = $1', [p.creatureId]);
                        if (res.rows.length > 0) {
                            atk = res.rows[0].stat_atq || 50;
                            def = res.rows[0].stat_def || 30;
                            maxHp = res.rows[0].stat_pv || 100;
                            speed = res.rows[0].stat_speed || 50;
                        }
                    } catch (e) {
                        console.error(`[Battle] Error fetching stats for ${pId}:`, e.message);
                    }
                }

                p.stats = { atk, def, speed };
                p.maxHp = maxHp;
                p.hp = maxHp; // Override initial 100
                p.speedFactor = 50 / speed; // Multiplicateur de durée (ex: speed 100 -> factor 0.5 -> 2x plus rapide)
                
                p.action = 'IDLE'; 
                p.actionTimer = 0;
                p.specialCharge = 0; 
                p.cooldowns = { light: 0, heavy: 0, parry: 0 };
            }
            
            battle.countdown = 4000; // 4 secondes (3, 2, 1, GO!)
            battle.logs = ["Le combat commence ! Préparez-vous..."];
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

        // On ne peut agir que si le countdown est fini
        if (battle.countdown > 0) return;

        // On ne peut agir que si on est IDLE
        if (myState.action !== 'IDLE') return;

        if (data.action === 'LIGHT_ATTACK') {
            if (myState.cooldowns.light <= 0) {
                myState.action = 'LIGHT_ATTACK';
                myState.actionTimer = 0;
                myState.attackDealt = false;
                myState.cooldowns.light = 1200 * myState.speedFactor; // Cooldown scalé
            }
        } else if (data.action === 'HEAVY_ATTACK') {
            if (myState.cooldowns.heavy <= 0) {
                myState.action = 'HEAVY_ATTACK';
                myState.actionTimer = 0;
                myState.attackDealt = false;
                myState.cooldowns.heavy = 2500 * myState.speedFactor; // Cooldown scalé
            }
        } else if (data.action === 'DEFEND') { // Bouton Paré
            if (myState.cooldowns.parry <= 0) {
                myState.action = 'PARRYING';
                myState.actionTimer = 0;
                myState.cooldowns.parry = 3000 * myState.speedFactor; // Cooldown scalé
                battle.logs.push(`${myState.nickname} se met en garde !`);
            }
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

    // Gestion de la déconnexion en plein combat
    socket.on('disconnect', async () => {
        const player = await store.getPlayer(socket.id);
        const roomId = player?.inBattle;
        if (!roomId || roomId === 'false') return;

        const battle = activeBattles[roomId];
        if (!battle || battle.ended) return;

        console.log(`[Battle] ⚠️ Déconnexion du joueur ${socket.id} pendant le combat ${roomId}`);
        
        // On déclare l'autre joueur vainqueur
        const pIds = Object.keys(battle.players);
        const winnerId = pIds.find(id => id !== socket.id);
        
        if (winnerId) {
            const result = {
                winner: winnerId,
                loser: socket.id,
                reason: 'DISCONNECT'
            };
            battle.ended = true;
            
            // On force les HP du déconnecté à 0 pour l'UI de l'autre
            battle.players[socket.id].hp = 0;
            
            io.to(roomId).emit('gameUpdate', {
                players: battle.players,
                logs: [...battle.logs, `${battle.players[socket.id].nickname} a quitté le combat !`],
                result: result
            });
            
            await handleBattleEnd(roomId, battle, result, io);
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

    // 0. Gérer le countdown de début de match
    if (battle.countdown > 0) {
        battle.countdown -= TICK_RATE;
        if (battle.countdown <= 0) {
            battle.countdown = 0;
            battle.logs.push("FIGHT !");
        }
    }

    // 1. Réduire les cooldowns
    [p1, p2].forEach(p => {
        if (p.cooldowns.light > 0) p.cooldowns.light -= TICK_RATE;
        if (p.cooldowns.heavy > 0) p.cooldowns.heavy -= TICK_RATE;
        if (p.cooldowns.parry > 0) p.cooldowns.parry -= TICK_RATE;
    });

    // 2. Gestion de l'Attaque Spéciale (Stoppe le temps)
    if (battle.specialActive) {
        battle.specialTimer -= TICK_RATE;
        if (battle.specialTimer <= 0) {
            battle.specialActive = false;
            const targetId = pIds.find(id => id !== battle.specialAttacker);
            const target = battle.players[targetId];
            const attacker = battle.players[battle.specialAttacker];
            
            // Nouvelle formule Spéciale
            const baseDmg = attacker.stats.atk * (attacker.stats.atk / (attacker.stats.atk + (target.stats.def * 0.5)));
            const rng = 0.95 + Math.random() * 0.1;
            const dmg = Math.floor(baseDmg * rng);
            
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
                const parryDuration = 600 * p.speedFactor; // Fenêtre de parade scalée
                if (p.actionTimer >= parryDuration) {
                    p.action = 'IDLE';
                    p.actionTimer = 0;
                }
            } else if (p.action === 'LIGHT_ATTACK' || p.action === 'HEAVY_ATTACK') {
                p.actionTimer += TICK_RATE;
                
                const isLight = p.action === 'LIGHT_ATTACK';
                const impactTime = (isLight ? 300 : 1000) * p.speedFactor;
                
                if (p.actionTimer >= impactTime && !p.attackDealt) {
                    p.attackDealt = true;
                    
                    const baseDegat = p.stats.atk * (p.stats.atk / (p.stats.atk + opponent.stats.def));
                    
                    if (opponent.action === 'PARRYING') {
                        p.action = 'STUNNED';
                        p.actionTimer = 0;
                        battle.logs.push(`${opponent.nickname} a paré ${isLight ? "l'attaque légère" : "l'attaque lourde"} de ${p.nickname} !`);
                        battle.lastEvent = { 
                            type: 'PARRY', 
                            attacker: opponent.nickname, 
                            target: p.nickname,
                            id: Date.now() + Math.random() 
                        };
                    } else {
                        // Coup réussi !
                        const multiplier = isLight ? 0.42 : 1.12;
                        const rng = 0.9 + Math.random() * 0.2;
                        const dmg = Math.floor(baseDegat * multiplier * rng);
                        
                        opponent.hp = Math.max(0, opponent.hp - dmg);
                        p.specialCharge = Math.min(50, (p.specialCharge || 0) + dmg); 
                        battle.logs.push(`${p.nickname} lance une attaque ${isLight ? 'légère' : 'lourde'} (-${dmg} PV)`);
                        
                        battle.lastEvent = { 
                            type: 'DAMAGE', 
                            value: dmg, 
                            attacker: p.nickname, 
                            target: opponent.nickname,
                            id: Date.now() + Math.random() 
                        };
                        
                        // Annulation de l'attaque lourde si frappé durant la phase de préparation (40% de son temps d'impact)
                        const opImpactTime = 1000 * (opponent.speedFactor || 1);
                        if (opponent.action === 'HEAVY_ATTACK' && opponent.actionTimer < (opImpactTime * 0.4)) {
                            opponent.action = 'IDLE';
                            opponent.actionTimer = 0;
                            battle.logs.push(`L'attaque lourde de ${opponent.nickname} a été interrompue !`);
                            battle.lastEvent = { 
                                type: 'INTERRUPT', 
                                attacker: p.nickname, 
                                target: opponent.nickname,
                                id: Date.now() + Math.random() 
                            };
                        }
                        
                        if (opponent.hp <= 0) {
                            opponent.action = 'DEAD';
                            opponent.hp = 0;
                        } else if (opponent.action === 'IDLE') {
                            opponent.action = 'HIT';
                            setTimeout(() => { if (opponent.action === 'HIT') opponent.action = 'IDLE'; }, 300);
                        }
                    }
                }
                
                const animDuration = isLight ? 500 : 1200;
                if (p.actionTimer >= animDuration) {
                    p.action = 'IDLE';
                    p.actionTimer = 0;
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
        countdown: battle.countdown,
        lastEvent: battle.lastEvent,
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
