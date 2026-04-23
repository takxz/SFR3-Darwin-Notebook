const { store } = require('../store/redisStore');

module.exports = function(io, socket) {
    // 1. Matchmaking
    socket.on('findMatch', async (data) => {
        console.log(`[Cluster ${process.pid}] User ${socket.id} looking for match...`);
        
        // Sauvegarder la creature et le pseudo utilisés pour ce combat
        const creatureId = data?.creatureId || 1;
        const nickname = data?.nickname || `Player_${socket.id.substr(0, 4)}`;
        
        await store.client.hset(`${store.PREFIX}player:${socket.id}`, 
            'creatureId', creatureId,
            'nickname', nickname
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

            const roomId = `battle_${opponentId}_${socket.id}`;
            const battleState = {
                roomId,
                players: {
                    [opponentId]: { 
                        hp: 100, maxHp: 100, 
                        inventory: { potion: 3 }, 
                        action: 'IDLE', 
                        creatureId: opCreatureId,
                        nickname: opNickname,
                        specialCooldown: 5
                    },
                    [socket.id]: { 
                        hp: 100, maxHp: 100, 
                        inventory: { potion: 3 }, 
                        action: 'IDLE', 
                        creatureId: creatureId,
                        nickname: nickname,
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
