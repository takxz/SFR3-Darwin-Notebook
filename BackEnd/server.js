const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
require('dotenv').config();

// 0. Importation des routes API
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');

// 1. Importation du Redis-Adapter
const { createAdapter } = require('@socket.io/redis-adapter');

// 2. Import de notre nouveau RedisStore asynchrone
const { store, pubClient, subClient } = require('./src/store/redisStore');
const registerMatchmakingHandlers = require('./src/handlers/matchmakingHandler');
const registerBattleHandlers = require('./src/handlers/battleHandler');

const app = express();
app.use(cors());
app.use(express.json()); // TRÈS IMPORTANT: permet à Express de lire le JSON envoyé par l'app mobile

// ======== MONTAGE DES ROUTES DE L'API REST (HTTP) ========
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 3. On attache l'Adapter Redis à Socket.io
// Cela permet à TOUS les clusters Node.js de discuter entre eux via Redis automatiquement
io.adapter(createAdapter(pubClient, subClient));

io.on('connection', async (socket) => {
    console.log(`[Cluster ${process.pid}] User connected:`, socket.id);

    // Ajout en base (await car c'est Redis maintenant)
    await store.addPlayer(socket.id);

    // Broadcast le compteur de joueurs à tout le réseau (peu importe le cluster)
    const count = await store.getPlayerCount();
    io.emit('playerCount', count);

    // Attacher les Handlers
    registerMatchmakingHandlers(io, socket);
    registerBattleHandlers(io, socket);

    socket.on('getPlayerCount', async () => {
        socket.emit('playerCount', await store.getPlayerCount());
    });

    socket.on('disconnect', async () => {
        console.log(`[Cluster ${process.pid}] User disconnected:`, socket.id);

        // Retirer de la file d'attente Redis
        await store.removeFromQueue(socket.id);

        // Gérer le combat en cours s'il y en a un
        const player = await store.getPlayer(socket.id);
        const roomId = player?.inBattle;

        // Si le joueur était dans un combat
        if (roomId && roomId !== 'false') {
            const battle = await store.getBattle(roomId);
            if (battle) {
                // Informer l'autre joueur que le combat est terminé à cause d'une déconnexion
                io.to(roomId).emit('playerDisconnected');
                // Supprimer le combat de Redis
                await store.deleteBattle(roomId);
            }
        }

        // Supprimer le joueur de Redis
        await store.removePlayer(socket.id);

        // Mettre à jour le compteur pour tout le monde
        const newCount = await store.getPlayerCount();
        io.emit('playerCount', newCount);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🚀  Game Server [Cluster PID: ${process.pid}] running on port ${PORT}
        - Redis Adapter: Connecté ! Prêt pour la multi-instanciation.
    `);
});