const Redis = require('ioredis');

// Initialisation des clients Redis
// Un client pour lire/écrire les données, un autre pour le système de publication/souscription (Pub/Sub)
const pubClient = new Redis();
const subClient = pubClient.duplicate();

// Un client principal pour gérer notre "Store" de jeu
const redisClient = new Redis(); 

redisClient.on('error', (err) => console.log('Erreur Redis Client', err));
pubClient.on('error', (err) => console.log('Erreur Redis Pub Client', err));

class RedisGameStore {
    constructor(client) {
        this.client = client;
        // On préfixe nos clés Redis pour ne pas les mélanger avec d'autres apps
        this.PREFIX = 'game:'; 
    }

    // --- JOUEURS ---
    async addPlayer(socketId) {
        // Stocker l'état du joueur sous forme de Hash Redis (HSET)
        await this.client.hset(`${this.PREFIX}player:${socketId}`, 'id', socketId, 'inBattle', 'false');
        // Ajouter à un Set pour compter rapidement le nombre total de joueurs (SADD)
        await this.client.sadd(`${this.PREFIX}players`, socketId);
    }

    async removePlayer(socketId) {
        await this.client.del(`${this.PREFIX}player:${socketId}`);
        await this.client.srem(`${this.PREFIX}players`, socketId);
    }

    async getPlayer(socketId) {
        // Récupérer tout l'objet joueur (HGETALL)
        const player = await this.client.hgetall(`${this.PREFIX}player:${socketId}`);
        // Redis retourne un objet vide si la clé n'existe pas, on vérifie si la clé 'id' est bien présente
        if (!player || !player.id) return null;
        return player;
    }

    async updatePlayerBattle(socketId, roomId) {
        const value = roomId ? roomId : 'false';
        await this.client.hset(`${this.PREFIX}player:${socketId}`, 'inBattle', value);
    }

    async getPlayerCount() {
        // Compter les éléments dans le Set (SCARD)
        return await this.client.scard(`${this.PREFIX}players`);
    }

    // --- FILE D'ATTENTE (MATCHMAKING) ---
    async addToQueue(socketId) {
        // Ajouter à la fin d'une liste (RPUSH)
        await this.client.rpush(`${this.PREFIX}matchmakingQueue`, socketId);
    }

    async removeFromQueue(socketId) {
        // Retirer un élément spécifique de la liste (LREM)
        await this.client.lrem(`${this.PREFIX}matchmakingQueue`, 0, socketId);
    }

    async getQueueLength() {
        // Obtenir la taille de la liste (LLEN)
        return await this.client.llen(`${this.PREFIX}matchmakingQueue`);
    }

    async dequeue() {
        // Retirer et retourner le premier élément de la liste (LPOP)
        return await this.client.lpop(`${this.PREFIX}matchmakingQueue`);
    }

    // --- COMBATS (BATTLES) ---
    async createBattle(roomId, battleState) {
        // Redis ne stocke que des chaînes de caractères (Strings).
        // On doit transformer notre objet complexe en JSON (Stringify)
        await this.client.set(`${this.PREFIX}battle:${roomId}`, JSON.stringify(battleState));
    }

    async getBattle(roomId) {
        const battleStr = await this.client.get(`${this.PREFIX}battle:${roomId}`);
        if (!battleStr) return null;
        return JSON.parse(battleStr); // Re-transformer en objet JS (Parse)
    }
    
    // Fonction supplémentaire pour mettre à jour une bataille existante
    async updateBattle(roomId, battleState) {
         await this.createBattle(roomId, battleState);
    }

    async deleteBattle(roomId) {
        await this.client.del(`${this.PREFIX}battle:${roomId}`);
    }
}

const store = new RedisGameStore(redisClient);

module.exports = {
    store,
    pubClient,
    subClient,
    redisClient
};
