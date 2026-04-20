const { store } = require('../../main/store/redisStore');
const Redis = require('ioredis');

// On mock ioredis pour ne pas avoir besoin d'un vrai serveur Redis qui tourne pendant les tests
jest.mock('ioredis');

describe('RedisGameStore', () => {
    let mockClient;

    beforeEach(() => {
        // Récupérer l'instance mockée du client Redis
        mockClient = store.client;
        jest.clearAllMocks();
    });

    test('addPlayer should call hset and sadd with correct keys', async () => {
        const socketId = 'test-socket-id';
        await store.addPlayer(socketId);

        expect(mockClient.hset).toHaveBeenCalledWith(
            `game:player:${socketId}`,
            'id', socketId,
            'inBattle', 'false'
        );
        expect(mockClient.sadd).toHaveBeenCalledWith('game:players', socketId);
    });

    test('removePlayer should call del and srem', async () => {
        const socketId = 'test-socket-id';
        await store.removePlayer(socketId);

        expect(mockClient.del).toHaveBeenCalledWith(`game:player:${socketId}`);
        expect(mockClient.srem).toHaveBeenCalledWith('game:players', socketId);
    });

    test('getPlayer should return player object if exists', async () => {
        const socketId = 'test-socket-id';
        const mockPlayerData = { id: socketId, inBattle: 'false' };

        mockClient.hgetall.mockResolvedValue(mockPlayerData);

        const player = await store.getPlayer(socketId);

        expect(mockClient.hgetall).toHaveBeenCalledWith(`game:player:${socketId}`);
        expect(player).toEqual(mockPlayerData);
    });

    test('getPlayer should return null if player does not exist', async () => {
        const socketId = 'non-existent';
        mockClient.hgetall.mockResolvedValue({});

        const player = await store.getPlayer(socketId);

        expect(player).toBeNull();
    });

    test('addToQueue should call rpush', async () => {
        const socketId = 'test-socket-id';
        await store.addToQueue(socketId);

        expect(mockClient.rpush).toHaveBeenCalledWith('game:matchmakingQueue', socketId);
    });

    test('getQueueLength should return length from llen', async () => {
        mockClient.llen.mockResolvedValue(5);
        const length = await store.getQueueLength();

        expect(mockClient.llen).toHaveBeenCalledWith('game:matchmakingQueue');
        expect(length).toBe(5);
    });

    test('createBattle should stringify state and call set', async () => {
        const roomId = 'room1';
        const battleState = { turn: 'p1', players: {} };

        await store.createBattle(roomId, battleState);

        expect(mockClient.set).toHaveBeenCalledWith(
            `game:battle:${roomId}`,
            JSON.stringify(battleState)
        );
    });

    test('getBattle should parse state from get', async () => {
        const roomId = 'room1';
        const battleState = { turn: 'p1', players: {} };
        mockClient.get.mockResolvedValue(JSON.stringify(battleState));

        const result = await store.getBattle(roomId);

        expect(mockClient.get).toHaveBeenCalledWith(`game:battle:${roomId}`);
        expect(result).toEqual(battleState);
    });
});
