const matchmakingHandler = require('../../main/handlers/matchmakingHandler');
const { store } = require('../../main/store/redisStore');

// Mocks
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
});
