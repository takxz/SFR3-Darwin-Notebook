const { store } = require('../store/redisStore');

module.exports = function(io, socket) {
    // 1. Matchmaking
    socket.on('findMatch', async () => {
        console.log(`[Cluster ${process.pid}] User ${socket.id} looking for match...`);

        const queueLength = await store.getQueueLength();

        if (queueLength > 0) {
            // Found opponent! (Pop from Redis List)
            const opponentId = await store.dequeue();

            // Prevent self-match (si le gars clique 2 fois très vite)
            if (opponentId === socket.id) {
                await store.addToQueue(socket.id);
                return;
            }

            const roomId = `battle_${opponentId}_${socket.id}`;
            const battleState = {
                roomId,
                players: {
                    [opponentId]: { hp: 100, maxHp: 100, inventory: { potion: 3 }, action: 'IDLE' },
                    [socket.id]: { hp: 100, maxHp: 100, inventory: { potion: 3 }, action: 'IDLE' }
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
            
            // L'autre joueur peut être connecté à un AUTRE cluster qui fait tourner Node.js
            // C'est là toute la magie : on utilise 'io.sockets.sockets.get' (qui ne marche que sur le PC local)
            // Mais grace à l'adapter Redis, si on fait "io.to(roomId).emit" après, Socket.io va se débrouiller !
            
            // Pour forcer un joueur d'un autre cluster à rejoindre la room (fonction magique de Redis Adapter) :
            // io.in(opponentId).socketsJoin(roomId); 
            // C'est la nouvelle méthode requise par le cluster
            io.in(opponentId).socketsJoin(roomId);

            // Notify both players that match is found
            io.to(roomId).emit('matchFound', {
                roomId,
                players: battleState.players
            });

            console.log(`[Cluster ${process.pid}] Match found: ${roomId}`);

        } else {
            // Wait in queue
            await store.addToQueue(socket.id);
            socket.emit('waitingForMatch');
            console.log(`[Cluster ${process.pid}] User ${socket.id} added to queue.`);
        }
    });

    socket.on('leaveMatchmaking', async () => {
        await store.removeFromQueue(socket.id);
        socket.emit('leftMatchmaking');
        console.log(`[Cluster ${process.pid}] User ${socket.id} left matchmaking queue.`);
    });
};
