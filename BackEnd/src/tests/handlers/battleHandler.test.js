const battleHandler = require('../../main/handlers/battleHandler');
const { store } = require('../../main/store/redisStore');

// Mocks
jest.mock('../../main/store/redisStore', () => ({
    store: {
        getPlayer: jest.fn(),
        getBattle: jest.fn(),
        updateBattle: jest.fn(),
        deleteBattle: jest.fn(),
        updatePlayerBattle: jest.fn(),
        client: {
            hset: jest.fn()
        }
    }
}));

jest.mock('../../main/config/db', () => ({
    query: jest.fn()
}));

describe('BattleHandler', () => {
    let io, socket;
    let playerReadyHandler, playerActionHandler;

    beforeEach(() => {
        io = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn()
        };
        socket = {
            id: 'p1',
            on: jest.fn(),
            emit: jest.fn()
        };

        battleHandler(io, socket);
        playerReadyHandler = socket.on.mock.calls.find(call => call[0] === 'playerReady')[1];
        playerActionHandler = socket.on.mock.calls.find(call => call[0] === 'playerAction')[1];

        jest.clearAllMocks();
    });

    describe('playerReady', () => {
        test('should start battle when both players are ready', async () => {
            const roomId = 'room1';
            store.getPlayer.mockResolvedValue({ inBattle: roomId });
            store.getBattle.mockResolvedValue({ readyCount: 1, turn: 'p1', logs: [], players: {} });

            await playerReadyHandler();

            expect(io.to).toHaveBeenCalledWith(roomId);
            expect(io.emit).toHaveBeenCalledWith('battleStart', { turn: 'p1', players: {} });
            expect(store.updateBattle).toHaveBeenCalled();
        });
    });

    describe('playerAction', () => {
        test('should not allow action if it is not players turn', async () => {
            const roomId = 'room1';
            store.getPlayer.mockResolvedValue({ inBattle: roomId });
            store.getBattle.mockResolvedValue({
                turn: 'p2',
                players: { p1: { hp: 100 }, p2: { hp: 100 } }
            });

            await playerActionHandler({ action: 'ATTACK' });

            expect(socket.emit).toHaveBeenCalledWith('error', 'Pas votre tour !');
            expect(store.updateBattle).not.toHaveBeenCalled();
        });

        test('should process attack and switch turn', async () => {
            const roomId = 'room1';
            const battle = {
                turn: 'p1',
                players: {
                    p1: { hp: 100, attack: 20, defense: 10, speed: 10, action: 'IDLE', nickname: 'Joueur p1' },
                    p2: { hp: 100, attack: 20, defense: 10, speed: 10, action: 'IDLE', nickname: 'Joueur p2' }
                },
                logs: []
            };
            store.getPlayer.mockResolvedValue({ inBattle: roomId });
            store.getBattle.mockResolvedValue(battle);

            // Mock Math.random to ensure hit and predictable damage
            jest.spyOn(Math, 'random').mockReturnValue(0.5);

            await playerActionHandler({ action: 'ATTACK' });

            expect(battle.turn).toBe('p2');
            expect(io.to).toHaveBeenCalledWith(roomId);
            expect(io.emit).toHaveBeenCalledWith('gameUpdate', expect.objectContaining({
                turn: 'p2',
                lastLog: expect.stringContaining('Joueur p1 attaque'),
                players: expect.objectContaining({
                    p1: expect.objectContaining({ nickname: 'Joueur p1', action: 'ATTACK' }),
                    p2: expect.objectContaining({ nickname: 'Joueur p2', action: 'HIT' })
                })
            }));
            expect(store.updateBattle).toHaveBeenCalled();

            jest.spyOn(Math, 'random').mockRestore();
        });
    });
});
