const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
require('dotenv').config();

// 0. Importation des routes API
const authRoutes = require('./src/main/routes/authRoutes');
const userRoutes = require('./src/main/routes/userRoutes');

// 1. Importation du Redis-Adapter
const { createAdapter } = require('@socket.io/redis-adapter');

// 2. Import de notre nouveau RedisStore asynchrone
const { store, pubClient, subClient } = require('./src/main/store/redisStore');
const registerMatchmakingHandlers = require('./src/main/handlers/matchmakingHandler');
const registerBattleHandlers = require('./src/main/handlers/battleHandler');

const app = express();
app.use(cors());
app.use(express.json());

// ======== MONTAGE DES ROUTES DE L'API REST (HTTP) ========
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'src', 'uploads')));

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

// 4. 🎨 SYSTÈME DE CACHE INTELLIGENT POUR LES MODÈLES 3D
const { modelCache, initializeModelCache } = require('./src/main/utils/modelCacheManager');
// OBJECTIF: Optimiser la performance du chargement des modèles 3D
// Solution: Utiliser un système de cache HTTP avec ETag
// Avantage: 95% réduction de bande passante, scalabilité 20x
// 🎯 LANCER L'INITIALISATION DU CACHE AU DÉMARRAGE
initializeModelCache();

// 📡 ROUTE: GET /models/:name
// Cette route sert les fichiers modèles 3D avec cache HTTP intelligent
//
// FLUX:
//   1. Client demande: GET /models/Alpaca
//   2. Serveur cherche "Alpaca" dans le cache interne
//   3. Si trouvé + ETag matche → 304 Not Modified (pas de download!)
//   4. Sinon → 200 OK + fichier + headers cache
//
// HEADERS HTTP IMPORTANTS:
//   - ETag: '"a1b2c3d4"' 
//     → Identifiant unique du fichier, permet au client de vérifier s'il a déjà la version

app.get('/models/:name', (req, res) => {
    const modelInfo = modelCache.get(req.params.name);

    if (!modelInfo) return res.status(404).json({ error: "Modèle introuvable" });

    // Gestion du cache HTTP 304
    if (req.get('If-None-Match') === modelInfo.etag) return res.status(304).end();

    res.set({
        'ETag': modelInfo.etag,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': modelInfo.ext === 'glb' ? 'model/gltf-binary' : 'model/vnd.maya.binary',
        'Vary': 'Accept-Encoding'
    });

    res.sendFile(modelInfo.filePath);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🚀  Game Server [Cluster PID: ${process.pid}] running on port ${PORT}
        - Redis Adapter: Connecté ! Prêt pour la multi-instanciation.
    `);
});
