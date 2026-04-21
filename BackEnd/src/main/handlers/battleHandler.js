const { store } = require('../store/redisStore');
const db = require('../config/db');

module.exports = function(io, socket) {
    // 2. Ready Check
    socket.on('playerReady', async () => {
        const player = await store.getPlayer(socket.id);
        const roomId = player?.inBattle;
        if (!roomId || roomId === 'false') return;

        const battle = await store.getBattle(roomId);
        if (!battle) return;

        battle.readyCount = (battle.readyCount || 0) + 1;

        if (battle.readyCount === 2) {
            io.to(roomId).emit('battleStart', {
                turn: battle.turn
            });
            battle.logs.push("Le combat commence !");
        }
        
        // Penser à sauvegarder la stat dans Redis !
        await store.updateBattle(roomId, battle);
    });

    // 3. Battle Actions
    socket.on('playerAction', async (data) => {
        // data: { action: 'ATTACK' | 'DEFEND' | 'HEAL' }
        const player = await store.getPlayer(socket.id);
        const roomId = player?.inBattle;
        if (!roomId || roomId === 'false') return;

        const battle = await store.getBattle(roomId);
        if (!battle) return;

        const opponentId = Object.keys(battle.players).find(id => id !== socket.id);

        if (battle.turn !== socket.id) {
            socket.emit('error', 'Pas votre tour !');
            return;
        }

        // Process Action
        const myState = battle.players[socket.id];
        const opState = battle.players[opponentId];
        let message = "";

        // Reset previous actions visualization
        myState.action = 'IDLE';
        opState.action = 'IDLE';

        if (data.action === 'ATTACK') {
            const dmg = 10 + Math.floor(Math.random() * 10); // 10-20 dmg
            let finalDmg = dmg;

            opState.hp = Math.max(0, opState.hp - finalDmg);
            myState.action = 'ATTACK';
            opState.action = 'HIT'; // Visual reaction
            message = `Joueur ${socket.id.substr(0, 4)} attaque (-${finalDmg} PV)`;

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

        // Check Win/Loss
        let result = null;
        if (opState.hp <= 0) {
            result = { winner: socket.id, loser: opponentId };
            opState.action = 'DEATH';
        }

        // Switch Turn
        battle.turn = opponentId;
        battle.logs.push(message);
        if (battle.logs.length > 5) battle.logs.shift(); // Keep last 5

        // Broadcast Update à tout le monde
        io.to(roomId).emit('gameUpdate', {
            players: battle.players,
            turn: battle.turn,
            lastLog: message,
            result: result
        });

        if (result) {
            // ==========================================
            // RÉCOMPENSES POST-COMBAT (Ticket XP/Gold)
            // ==========================================
            const winnerCreatureId = battle.players[result.winner]?.creatureId;
            
            if (winnerCreatureId) {
                try {
                    const xpGain = 50;       // XP ajoutée à la créature ET au joueur
                    const bioTokenGain = 10;  // BioTokens ajoutés au joueur
                    
                    // 1. Mettre à jour l'XP de la CREATURE et récupérer le player_id
                    const creatureResult = await db.query(
                        `UPDATE "CREATURE" 
                         SET experience = experience + $1 
                         WHERE id = $2 
                         RETURNING player_id`,
                        [xpGain, winnerCreatureId]
                    );
                    
                    if (creatureResult.rows.length > 0) {
                        const playerId = creatureResult.rows[0].player_id;
                        
                        // 2. Mettre à jour le XP et les BioTokens du PLAYER
                        //    bio_token est un VARCHAR → on le caste en int, on ajoute, on reconvertit
                        await db.query(
                            `UPDATE "PLAYER" 
                             SET xp = xp + $1,
                                 bio_token = CAST(
                                     COALESCE(NULLIF(bio_token, ''), '0')::int + $2 
                                     AS varchar
                                 )
                             WHERE id = $3`,
                            [xpGain, bioTokenGain, playerId]
                        );
                        
                        console.log(`[BattleHandler] ✅ Récompenses accordées : Creature ${winnerCreatureId} (+${xpGain} XP), Player ${playerId} (+${xpGain} XP, +${bioTokenGain} BioTokens)`);
                    } else {
                        console.warn(`[BattleHandler] ⚠️ Creature ${winnerCreatureId} introuvable en BDD`);
                    }
                    
                    // 3. Informer le FrontEnd des gains
                    io.to(result.winner).emit('REWARD_GRANTED', { 
                        xp: xpGain, 
                        bioTokens: bioTokenGain
                    });
                    
                } catch (err) {
                    console.error("[BattleHandler] ❌ Erreur SQL lors de l'attribution des récompenses:", err.message);
                }
            } else {
                console.warn(`[BattleHandler] ⚠️ Pas de creatureId pour le vainqueur, pas de récompenses`);
            }

            await store.deleteBattle(roomId); // End game
            await store.updatePlayerBattle(socket.id, 'false');
            await store.updatePlayerBattle(opponentId, 'false');
        } else {
            // Sauvegarder le nouvel état si le match continue
            await store.updateBattle(roomId, battle);
        }
    });
};
