const db = require('../config/db');
const { store } = require('../store/redisStore');

module.exports = function(io, socket) {
    // 1. Matchmaking
    socket.on('findMatch', async (data) => {
        console.log(`[Cluster ${process.pid}] User ${socket.id} looking for match...`);
        
        const playerId = data?.playerId;
        let creatureId = data?.creatureId;
        const nickname = data?.nickname || `Player_${socket.id.substr(0, 4)}`;

        // Si creatureId est '1' ou manquant, on essaie de trouver une vraie créature en base
        if ((!creatureId || creatureId === 1 || creatureId === '1') && playerId) {
            try {
                const res = await db.query('SELECT id FROM "CREATURE" WHERE player_id = $1 LIMIT 1', [playerId]);
                if (res.rows.length > 0) {
                    creatureId = res.rows[0].id;
                    console.log(`[Matchmaking] Utilisation de la créature ${creatureId} pour le joueur ${playerId}`);
                }
            } catch (err) {
                console.error('[Matchmaking] Erreur lors de la récupération d\'une créature:', err.message);
            }
        }
        
        // Récupérer le modelPath depuis la BDD
        let modelPath = 'Pig'; 
        let animalType = 'Mamifère';
        let latinName = '';
        try {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(creatureId);
            
            let query = '';
            let params = [];
            
            if (isUUID) {
                // Joueur normal: on cherche sa créature spécifique
                const query = `
                    SELECT s.model_path, s.type, s.latin_name 
                    FROM "CREATURE" c 
                    JOIN "SPECIES" s ON c.species_id = s.id 
                    WHERE c.id = $1
                `;
                const result = await db.query(query, [creatureId]);
                if (result.rows.length > 0) {
                    modelPath = result.rows[0].model_path || 'Pig';
                    animalType = result.rows[0].type || 'Inconnu';
                    latinName = result.rows[0].latin_name || '';
                }
            } else {
                // Bot d'entraînement : On simule directement un Requin
                modelPath = 'shark';
                animalType = 'Poisson';
                latinName = 'Selachimorpha';
            }
        } catch (err) {
            console.error('[Matchmaking] Erreur DB get model_path:', err.message);
        }

        await store.client.hset(`${store.PREFIX}player:${socket.id}`, 
            'playerId', playerId || '',
            'creatureId', creatureId || '',
            'nickname', nickname || '',
            'modelPath', modelPath || 'Pig',
            'animalType', animalType || 'Inconnu',
            'latinName', latinName || ''
        );

        const queueLength = await store.getQueueLength();

        if (queueLength > 0) {
            // Found opponent! (Pop from Redis List)
            const opponentId = await store.dequeue();

            // Prevent self-match (si le gars clique 2 fois très vite)
            if (opponentId === socket.id) {
                await store.addToQueue(socket.id);
                return;
            }

            // Get opponent data from their player session
            const opData = await store.getPlayer(opponentId);
            const opCreatureId = opData?.creatureId || 1;
            const opNickname = opData?.nickname || `Player_${opponentId.substr(0, 4)}`;
            const opModelPath = opData?.modelPath || 'Pig';
            const opAnimalType = opData?.animalType || 'Inconnu';
            const opLatinName = opData?.latinName || '';

            const roomId = `battle_${opponentId}_${socket.id}`;
            const battleState = {
                roomId,
                players: {
                    [opponentId]: { 
                        hp: 100, maxHp: 100, 
                        inventory: { potion: 3 }, 
                        action: 'IDLE', 
                        creatureId: opCreatureId,
                        playerId: opData?.playerId,
                        nickname: opNickname,
                        modelPath: opModelPath,
                        animalType: opAnimalType,
                        latinName: opLatinName,
                        specialCooldown: 5
                    },
                    [socket.id]: { 
                        hp: 100, maxHp: 100, 
                        inventory: { potion: 3 }, 
                        action: 'IDLE', 
                        creatureId: creatureId,
                        playerId: playerId,
                        nickname: nickname,
                        modelPath: modelPath,
                        animalType: animalType,
                        latinName: latinName,
                        specialCooldown: 5
                    }
                },
                turn: opponentId, // First to join starts
                logs: ["Le combat commence !"]
            };

            // Écrire les états sur Redis
            await store.createBattle(roomId, battleState);
            await store.updatePlayerBattle(opponentId, roomId);
            await store.updatePlayerBattle(socket.id, roomId);

            // Join socket rooms
            socket.join(roomId);
            io.in(opponentId).socketsJoin(roomId);

            // Notify both players explicitly (avoids Redis socketsJoin race conditions)
            const matchPayload = {
                roomId,
                players: battleState.players
            };
            io.to(socket.id).emit('matchFound', matchPayload);
            io.to(opponentId).emit('matchFound', matchPayload);

            console.log(`[Cluster ${process.pid}] Match found: ${roomId}`);

        } else {
            // Wait in queue
            await store.addToQueue(socket.id);
            socket.emit('waitingForMatch');
            console.log(`[Cluster ${process.pid}] User ${socket.id} added to queue.`);
        }
    });
};
