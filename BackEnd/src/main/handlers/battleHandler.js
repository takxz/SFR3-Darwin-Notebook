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
            // Attribution des récompenses (XP / BioTokens)
            const winnerCreatureId = battle.players[result.winner]?.creatureId;
            if (winnerCreatureId) {
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
            }

            await store.deleteBattle(roomId);
            await store.updatePlayerBattle(socket.id, 'false');
            await store.updatePlayerBattle(opponentId, 'false');
        } else {
            await store.updateBattle(roomId, battle);
        }
    });
};
