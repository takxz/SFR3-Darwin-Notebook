const matchmakingHandler = require('../../main/handlers/matchmakingHandler');
const { store } = require('../../main/store/redisStore');

// Mocks
jest.mock('../../main/config/db', () => ({
    query: jest.fn()
}));

const db = require('../../main/config/db');

jest.mock('../../main/store/redisStore', () => ({
    store: {
        getQueueLength: jest.fn(),
        dequeue: jest.fn(),
        addToQueue: jest.fn(),
        createBattle: jest.fn(),
        updatePlayerBattle: jest.fn(),
        getPlayer: jest.fn(),
        PREFIX: 'game:',
        client: {
            hset: jest.fn()
        }
    }
}));

describe('MatchmakingHandler', () => {
    let io, socket;
    let findMatchHandler;

    beforeEach(() => {
        io = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            in: jest.fn().mockReturnThis(),
            socketsJoin: jest.fn()
        };
        socket = {
            id: 'socket-id-1',
            on: jest.fn(),
            emit: jest.fn(),
            join: jest.fn()
        };

        // Extraire le handler 'findMatch' pour l'appeler facilement
        matchmakingHandler(io, socket);
        findMatchHandler = socket.on.mock.calls.find(call => call[0] === 'findMatch')[1];

        jest.clearAllMocks();
        db.query.mockResolvedValue({ rows: [] }); // Par défaut, pas de données DB
    });

    test('should add player to queue if queue is empty', async () => {
        store.getQueueLength.mockResolvedValue(0);

        await findMatchHandler();

        expect(store.addToQueue).toHaveBeenCalledWith(socket.id);
        expect(socket.emit).toHaveBeenCalledWith('waitingForMatch');
    });

    test('should match player if opponent available', async () => {
        const opponentId = 'socket-id-2';
        store.getQueueLength.mockResolvedValue(1);
        store.dequeue.mockResolvedValue(opponentId);

        await findMatchHandler();

        expect(store.createBattle).toHaveBeenCalled();
        expect(store.updatePlayerBattle).toHaveBeenCalledTimes(2);
        expect(socket.join).toHaveBeenCalledWith(expect.stringContaining(`battle_${opponentId}`));
        expect(io.in).toHaveBeenCalledWith(opponentId);
        expect(io.socketsJoin).toHaveBeenCalledWith(expect.stringContaining(`battle_${opponentId}`));
        expect(io.to).toHaveBeenCalledWith(socket.id);
        expect(io.to).toHaveBeenCalledWith(opponentId);
        expect(io.emit).toHaveBeenCalledWith('matchFound', expect.any(Object));
    });

    test('should not match with self if somehow popped from queue', async () => {
        store.getQueueLength.mockResolvedValue(1);
        store.dequeue.mockResolvedValue(socket.id); // Oops, self!

        await findMatchHandler();

        expect(store.addToQueue).toHaveBeenCalledWith(socket.id);
        expect(store.createBattle).not.toHaveBeenCalled();
    });

    test('should query CREATURE table if creatureId is a UUID', async () => {
        store.getQueueLength.mockResolvedValue(0); // Rest in queue
        const validUUID = '550e8400-e29b-41d4-a716-446655440000';
        
        db.query.mockResolvedValue({
            rows: [{ model_path: 'Bull', type: 'Mamifère', latin_name: 'Bovidae' }]
        });

        await findMatchHandler({ creatureId: validUUID });

        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM "CREATURE"'), [validUUID]);
        expect(store.client.hset).toHaveBeenCalledWith(
            expect.any(String),
            'playerId', expect.any(String),
            'creatureId', validUUID,
            'nickname', expect.any(String),
            'modelPath', 'Bull',
            'animalType', 'Mamifère',
            'latinName', 'Bovidae'
        );
    });

    test('should NOT query DB if creatureId is NOT a UUID (e.g. test bot)', async () => {
        store.getQueueLength.mockResolvedValue(0); 
        const nonUUID = 51;
        
        await findMatchHandler({ creatureId: nonUUID });

        expect(db.query).not.toHaveBeenCalled();
        expect(store.client.hset).toHaveBeenCalledWith(
            expect.any(String),
            'playerId', expect.any(String),
            'creatureId', 51,
            'nickname', expect.any(String),
            'modelPath', 'shark',
            'animalType', 'Poisson',
            'latinName', 'Selachimorpha'
        );
    });

    test('should fallback to Pig if DB query fails', async () => {
        store.getQueueLength.mockResolvedValue(0);
        const validUUID = '550e8400-e29b-41d4-a716-446655440000';
        
        db.query.mockRejectedValue(new Error('DB connection lost'));

        await findMatchHandler({ creatureId: validUUID });

        expect(store.client.hset).toHaveBeenCalledWith(
            expect.any(String),
            'playerId', expect.any(String),
            'creatureId', validUUID,
            'nickname', expect.any(String),
            'modelPath', 'Pig',
            'animalType', 'Mamifère',
            'latinName', ''
        );
    });

    test('should fetch a creature from DB if creatureId is missing but playerId is present', async () => {
        store.getQueueLength.mockResolvedValue(0);
        db.query.mockResolvedValueOnce({ rows: [{ id: 'found-creature-uuid' }] }); // First call for finding creature
        db.query.mockResolvedValueOnce({ rows: [{ model_path: 'Wolf', type: 'Mamifère', latin_name: 'Canis lupus' }] }); // Second call for model_path

        await findMatchHandler({ playerId: 123, creatureId: '1' });

        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT id FROM "CREATURE"'), [123]);
        expect(store.client.hset).toHaveBeenCalledWith(
            expect.any(String),
            'playerId', 123,
            'creatureId', 'found-creature-uuid',
            expect.any(String), expect.any(String),
            expect.any(String), expect.any(String),
            expect.any(String), expect.any(String),
            expect.any(String), expect.any(String)
        );
    });

    test('should handle DB error when fetching creature from DB', async () => {
        store.getQueueLength.mockResolvedValue(0);
        db.query.mockRejectedValueOnce(new Error('DB error finding creature'));

        await findMatchHandler({ playerId: 123, creatureId: null });

        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT id FROM "CREATURE"'), [123]);
        // Should continue with default creatureId (null/empty)
    });
});
