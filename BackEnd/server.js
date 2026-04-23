const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
require('dotenv').config();
const path = require('path');

// 0. Importation des routes et des modules utilitaires
const authRoutes = require('./src/main/routes/authRoutes');
const userRoutes = require('./src/main/routes/userRoutes');
const { createModelRegistry } = require('./src/main/utils/modelRegistry');

// 1. Importation du Redis-Adapter
const { createAdapter } = require('@socket.io/redis-adapter');

// 2. Import de notre nouveau RedisStore asynchrone
const { store, pubClient, subClient } = require('./src/main/store/redisStore');
const registerMatchmakingHandlers = require('./src/main/handlers/matchmakingHandler');
const registerBattleHandlers = require('./src/main/handlers/battleHandler');

const app = express();
app.use(cors());
app.use(express.json());

// ======== CONFIGURATION ET INITIALISATION ========

// ======== MONTAGE DES ROUTES HTTP ========

// Routes de l'API REST
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);


// ======== GESTION DES WEBSOCKETS (Socket.io) ========

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

// 4. 🎨 Initialisation du registre des modèles 3D au démarrage
const MODELS_DIR = path.join(__dirname, 'src', 'assets', 'fight', 'models');
const modelFilenameRegistry = createModelRegistry(MODELS_DIR);

// Route pour les images uploadées (avatars, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'src', 'uploads')));

// Route pour servir les modèles 3D avec cache HTTP natif
app.get('/models/:name', (req, res) => {
    const fileName = modelFilenameRegistry.get(req.params.name);

    if (!fileName) {
        return res.status(404).json({ error: "Modèle introuvable" });
    }

    res.sendFile(fileName, {
        root: MODELS_DIR,
        maxAge: '1y', // Cache client pour 1 an
        immutable: true,
        headers: {
            'Content-Type': fileName.endsWith('.glb') ? 'model/gltf-binary' : 'model/vnd.maya.binary',
            'Vary': 'Accept-Encoding'
        }
    });
});


// ======== DÉMARRAGE DU SERVEUR ========

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🚀  Game Server [Cluster PID: ${process.pid}] running on port ${PORT}
        - Redis Adapter: Connecté ! Prêt pour la multi-instanciation.
    `);
});
