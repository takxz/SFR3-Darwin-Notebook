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

        battle.readyCount = (battle.readyCount || 0) + 1;

        if (battle.readyCount === 2) {
            io.to(roomId).emit('battleStart', { turn: battle.turn });
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
            message = `Joueur ${socket.id.substr(0, 4)} attaque (-${dmg} PV)`;

        } else if (data.action === 'DEFEND') {
            myState.action = 'IDLE';
            message = `Joueur ${socket.id.substr(0, 4)} se défend.`;

        } else if (data.action === 'HEAL') {
            if (myState.inventory.potion > 0) {
                myState.inventory.potion--;
                const heal = 30;
                myState.hp = Math.min(myState.maxHp, myState.hp + heal);
                myState.action = 'HEAL';
                message = `Joueur ${socket.id.substr(0, 4)} se soigne (+${heal} PV)`;
            } else {
                message = "Plus de potions !";
            }
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
            const winnerCreatureId = battle.players[result.winner]?.creatureId;
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(winnerCreatureId);

            if (winnerCreatureId && isUUID) {
                try {
                    const xpGain = 50;
                    const bioTokenGain = 10;

                    // 1. Mettre à jour l'XP de la CREATURE
                    const creatureResult = await db.query(
                        `UPDATE "CREATURE" SET experience = experience + $1 WHERE id = $2 RETURNING player_id`,
                        [xpGain, winnerCreatureId]
                    );

                    if (creatureResult.rows.length > 0) {
                        const playerId = creatureResult.rows[0].player_id;

                        // 2. Mettre à jour l'XP et les BioTokens du PLAYER
                        await db.query(
                            `UPDATE "PLAYER" 
                             SET xp = xp + $1,
                                 bio_token = CAST(COALESCE(NULLIF(bio_token, ''), '0')::int + $2 AS varchar)
                             WHERE id = $3`,
                            [xpGain, bioTokenGain, playerId]
                        );

                        console.log(`[BattleHandler] ✅ Récompenses accordées à ${playerId}`);
                    }

                    io.to(result.winner).emit('REWARD_GRANTED', { xp: xpGain, bioTokens: bioTokenGain });

                } catch (err) {
                    console.error("[BattleHandler] ❌ Erreur SQL récompenses:", err.message);
                }
            } else if (winnerCreatureId) {
                console.warn(`[BattleHandler] ⚠️ ID créature invalide (pas un UUID): ${winnerCreatureId}. Récompenses créature ignorées.`);
            }

            await store.deleteBattle(roomId);
            await store.updatePlayerBattle(socket.id, 'false');
            await store.updatePlayerBattle(opponentId, 'false');
        } else {
            await store.updateBattle(roomId, battle);
        }
    });
};

