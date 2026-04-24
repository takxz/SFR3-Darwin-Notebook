const { store } = require('../store/redisStore');
const db = require('../config/db');

module.exports = function (io, socket) {
    // Check si les deux joueurs sont prêts
    socket.on('playerReady', async () => {
        const player = await store.getPlayer(socket.id);
        const roomId = player?.inBattle;
        if (!roomId || roomId === 'false') return;

        const battle = await store.getBattle(roomId);
        if (!battle) return;

        battle.readyPlayers = battle.readyPlayers || {};
        battle.readyPlayers[socket.id] = true;

        if (Object.keys(battle.readyPlayers).length === 2 && !battle.isStarted) {
            battle.isStarted = true;
            io.to(roomId).emit('battleStart', { turn: battle.turn, players: battle.players });
            battle.logs.push("Le combat commence !");
        }

        await store.updateBattle(roomId, battle);
    });

    // Actions de combat
    socket.on('playerAction', async (data) => {
        const player = await store.getPlayer(socket.id);
        const roomId = player?.inBattle;
        if (!roomId || roomId === 'false') return;

        const battle = await store.getBattle(roomId);
        if (!battle) return;

        if (battle.turn !== socket.id) {
            socket.emit('error', 'Pas votre tour !');
            return;
        }

        const opponentId = Object.keys(battle.players).find(id => id !== socket.id);
        const myState = battle.players[socket.id];
        const opState = battle.players[opponentId];
        let message = "";

        myState.action = 'IDLE';
        opState.action = 'IDLE';

        if (data.action === 'ATTACK') {
            const dmg = 10 + Math.floor(Math.random() * 10);
            opState.hp = Math.max(0, opState.hp - dmg);
            myState.action = 'ATTACK';
            opState.action = 'HIT';
            message = `${myState.nickname} attaque (-${dmg} PV)`;

        } else if (data.action === 'SPECIAL') {
            if (myState.specialCooldown === 0) {
                const dmg = 25 + Math.floor(Math.random() * 15);
                opState.hp = Math.max(0, opState.hp - dmg);
                myState.action = 'SPECIAL';
                opState.action = 'HIT';
                myState.specialCooldown = 5;
                message = `${myState.nickname} lance son ATTAQUE SPÉCIALE ! (-${dmg} PV)`;
            } else {
                socket.emit('error', 'Attaque spéciale en recharge !');
                return;
            }

        } else if (data.action === 'DEFEND') {
            myState.action = 'IDLE';
            message = `${myState.nickname} se défend.`;

        } else if (data.action === 'HEAL') {
            if (myState.inventory.potion > 0) {
                myState.inventory.potion--;
                const heal = 30;
                myState.hp = Math.min(myState.maxHp, myState.hp + heal);
                myState.action = 'HEAL';
                message = `${myState.nickname} se soigne (+${heal} PV)`;
            } else {
                message = "Plus de potions !";
            }
        }

        // Gestion du cooldown : on décrémente à la fin de son tour si on n'a pas utilisé le spécial ce tour-ci
        // Ou plus simple : si on a utilisé le spécial, il est à 5. Si on ne l'a pas utilisé et qu'il est > 0, on baisse.
        if (data.action !== 'SPECIAL' && myState.specialCooldown > 0) {
            myState.specialCooldown--;
        }

        let result = null;
        if (opState.hp <= 0) {
            result = { winner: socket.id, loser: opponentId };
            opState.action = 'DEATH';
        }

        battle.turn = opponentId;
        battle.logs.push(message);
        if (battle.logs.length > 5) battle.logs.shift();

        io.to(roomId).emit('gameUpdate', {
            players: battle.players,
            turn: battle.turn,
            lastLog: message,
            result: result
        });

        if (result) {
            // 1. Enregistrement du combat dans l'historique (Table FIGHT)
            try {
                const p1 = battle.players[socket.id]; // Le perdant ou gagnant actuel
                const p2 = battle.players[opponentId];
                
                // On détermine qui est player1 et player2 pour la table FIGHT
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
                console.log(`[BattleHandler] 📜 Combat enregistré dans la table FIGHT`);
            } catch (fightErr) {
                console.error("[BattleHandler] ⚠️ Impossible d'enregistrer l'historique FIGHT:", fightErr.message);
            }

            // 2. Attribution des récompenses (XP / BioTokens)
            const getXpThreshold = (lvl) => 100 + (lvl - 1) * 10;

            const processReward = async (pid, cid, isWinner, sid) => {
                console.log(`[BattleHandler] Starting rewards for Player:${pid}, Creature:${cid}, Winner:${isWinner}`);
                try {
                    const xpGain = isWinner ? 50 : 10;
                    const bioTokenGain = isWinner ? 10 : 0;
                    let creatureLeveledUp = false;
                    let playerLeveledUp = false;
                    let newCLevel = 0;
                    let newPLevel = 0;

                    if (!pid || !cid) {
                        console.error(`[BattleHandler] Missing ID for rewards! PID:${pid}, CID:${cid}`);
                        return;
                    }

                    // A. Récompense CRÉATURE
                    const creatureData = await db.query(
                        'SELECT experience, creature_level, stat_pv, stat_atq, stat_def, stat_speed FROM "CREATURE" WHERE id = $1',
                        [cid]
                    );

                    if (creatureData.rows.length > 0) {
                        const c = creatureData.rows[0];
                        let newXp = (c.experience || 0) + xpGain;
                        let newLevel = c.creature_level || 1;
                        console.log(`[BattleHandler] Creature ${cid} current XP: ${c.experience}, adding ${xpGain}`);
                        let newPv = c.stat_pv, newAtq = c.stat_atq, newDef = c.stat_def, newSpd = c.stat_speed;

                        while (newXp >= getXpThreshold(newLevel)) {
                            newXp -= getXpThreshold(newLevel);
                            newLevel++;
                            creatureLeveledUp = true;
                            if (isWinner) {
                                newPv += Math.floor(Math.random() * 4) + 2;
                                newAtq += Math.floor(Math.random() * 4) + 2;
                                newDef += Math.floor(Math.random() * 4) + 2;
                                newSpd += Math.floor(Math.random() * 4) + 2;
                            }
                            console.log(`[BattleHandler] Creature ${cid} leveled up to ${newLevel}!`);
                        }
                        newCLevel = newLevel;

                        const updateRes = await db.query(
                            `UPDATE "CREATURE" 
                             SET experience = $1, creature_level = $2, 
                                  victories = victories + $3, defeats = defeats + $4,
                                  stat_pv = $5, stat_atq = $6, stat_def = $7, stat_speed = $8
                             WHERE id = $9`,
                            [newXp, newLevel, isWinner ? 1 : 0, isWinner ? 0 : 1, newPv, newAtq, newDef, newSpd, cid]
                        );
                        console.log(`[BattleHandler] Creature ${cid} updated: ${updateRes.rowCount} row(s)`);
                    } else {
                        console.error(`[BattleHandler] Creature ${cid} not found in DB!`);
                    }

                    // B. Récompense JOUEUR
                    const playerData = await db.query('SELECT xp, player_level FROM "PLAYER" WHERE id = $1', [pid]);
                    if (playerData.rows.length > 0) {
                        let pXp = (playerData.rows[0].xp || 0) + xpGain;
                        let pLevel = playerData.rows[0].player_level || 1;
                        console.log(`[BattleHandler] Player ${pid} current XP: ${playerData.rows[0].xp}, adding ${xpGain}`);

                        while (pXp >= getXpThreshold(pLevel)) {
                            pXp -= getXpThreshold(pLevel);
                            pLevel++;
                            playerLeveledUp = true;
                            console.log(`[BattleHandler] Player ${pid} leveled up to ${pLevel}!`);
                        }
                        newPLevel = pLevel;

                        await db.query(
                            `UPDATE "PLAYER" 
                             SET xp = $1, player_level = $2,
                                 bio_token = CAST(COALESCE(NULLIF(bio_token, ''), '0')::int + $3 AS varchar)
                             WHERE id = $4`,
                            [pXp, pLevel, bioTokenGain, pid]
                        );
                        console.log(`[BattleHandler] Player ${pid} stats updated.`);
                    }

                    if (sid) {
                        io.to(sid).emit('REWARD_GRANTED', { 
                            xp: xpGain, 
                            bioTokens: bioTokenGain,
                            creatureId: cid,
                            isWinner: isWinner,
                            creatureLeveledUp,
                            playerLeveledUp,
                            newCLevel,
                            newPLevel
                        });
                    }
                } catch (err) {
                    console.error(`[BattleHandler] ❌ Erreur récompenses pour ${pid}:`, err.message);
                }
            };

            if (result.winner) {
                const winner = battle.players[result.winner];
                if (winner) await processReward(winner.playerId, winner.creatureId, true, result.winner);
            }
            if (result.loser) {
                const loser = battle.players[result.loser];
                if (loser) await processReward(loser.playerId, loser.creatureId, false, result.loser);
            }

            await store.deleteBattle(roomId);
            await store.updatePlayerBattle(socket.id, 'false');
            await store.updatePlayerBattle(opponentId, 'false');
        } else {
            await store.updateBattle(roomId, battle);
        }
    });
};
