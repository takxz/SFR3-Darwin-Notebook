const { store } = require('../store/redisStore');

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
            // ============================
            // LOGIQUE DE RETRIBUTION D'XP
            // ============================
            const winnerCreatureId = battle.players[result.winner].creatureId;
            if (winnerCreatureId) {
                try {
                    const db = require('../config/db');
                    const xpRawGain = 50; 
                    const goldGain = 10;
                    
                    // MàJ Base de données
                    await db.query('UPDATE "CREATURE" SET experience = experience + $1 WHERE id = $2', [xpRawGain, winnerCreatureId]);
                    
                    // Informer le FrontEnd
                    io.to(result.winner).emit('REWARD_GRANTED', { xp: xpRawGain, gold: goldGain });
                    
                    console.log(`[BattleHandler] Recompense XP accordee a la Creature ${winnerCreatureId}`);
                } catch (e) {
                    console.error("[BattleHandler] ERREUR LORS DE L'UPDATE XP DB:", e);
                }
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
