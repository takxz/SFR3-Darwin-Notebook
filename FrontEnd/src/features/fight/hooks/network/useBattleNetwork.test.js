import { renderHook, act } from '@testing-library/react-native';
import { useBattleNetwork } from './useBattleNetwork';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/services/SocketService', () => ({
    __esModule: true,
    default: {
        connect: jest.fn(),
        disconnect: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        socket: { id: 'player-1' },
    },
}));

const socketService = require('@/services/SocketService').default;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEventCallback(eventName) {
    const call = socketService.on.mock.calls.find(([ev]) => ev === eventName);
    return call ? call[1] : null;
}

const players2 = {
    'player-1': { nickname: 'Hero', specialCooldown: 3 },
    'player-2': { nickname: 'Villain', specialCooldown: 5 },
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    socketService.socket = { id: 'player-1' };
});

afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useBattleNetwork', () => {

    // ── État initial ──────────────────────────────────────────────────────────

    describe('État initial', () => {
        it('doit initialiser les stats par défaut', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            expect(result.current.stats.hp).toBe(100);
            expect(result.current.stats.maxHp).toBe(100);
            expect(result.current.stats.opHp).toBe(100);
            expect(result.current.stats.opMaxHp).toBe(100);
        });

        it('doit initialiser specialCooldown à 5', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            expect(result.current.stats.specialCooldown).toBe(5);
        });

        it('doit initialiser turn à null', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            expect(result.current.turn).toBeNull();
        });

        it('doit initialiser result à null', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            expect(result.current.result).toBeNull();
        });

        it('doit initialiser matchStatus à "idle"', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            expect(result.current.matchStatus).toBe('idle');
        });

        it('doit se connecter au socket au montage', () => {
            renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            expect(socketService.connect).toHaveBeenCalled();
        });

        it('doit s\'abonner aux 5 événements socket au montage', () => {
            renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const events = socketService.on.mock.calls.map(([ev]) => ev);
            expect(events).toContain('waitingForMatch');
            expect(events).toContain('matchFound');
            expect(events).toContain('battleStart');
            expect(events).toContain('gameUpdate');
            expect(events).toContain('playerDisconnected');
        });
    });

    // ── Actions ───────────────────────────────────────────────────────────────

    describe('Actions', () => {
        it('findMatch émet "findMatch" avec les données fournies', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.findMatch({ animalId: '42' }); });
            expect(socketService.emit).toHaveBeenCalledWith('findMatch', { animalId: '42' });
        });

        it('findMatch passe matchStatus à "searching"', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.findMatch(); });
            expect(result.current.matchStatus).toBe('searching');
        });

        it('findMatch sans données émet findMatch avec undefined', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.findMatch(); });
            expect(socketService.emit).toHaveBeenCalledWith('findMatch', undefined);
        });

        it('sendReady émet "playerReady"', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.sendReady(); });
            expect(socketService.emit).toHaveBeenCalledWith('playerReady');
        });

        it('sendAction émet "playerAction" avec ATTACK', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.sendAction('ATTACK'); });
            expect(socketService.emit).toHaveBeenCalledWith('playerAction', { action: 'ATTACK' });
        });

        it('sendAction émet "playerAction" avec DEFEND', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.sendAction('DEFEND'); });
            expect(socketService.emit).toHaveBeenCalledWith('playerAction', { action: 'DEFEND' });
        });

        it('sendAction émet "playerAction" avec HEAL', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.sendAction('HEAL'); });
            expect(socketService.emit).toHaveBeenCalledWith('playerAction', { action: 'HEAL' });
        });

        it('abandon met hp à 0', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.abandon(); });
            expect(result.current.stats.hp).toBe(0);
        });

        it('abandon appelle socketService.disconnect', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.abandon(); });
            expect(socketService.disconnect).toHaveBeenCalled();
        });
    });

    // ── isMyTurn ──────────────────────────────────────────────────────────────

    describe('isMyTurn', () => {
        it('est false quand turn est null', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            expect(result.current.isMyTurn).toBe(false);
        });

        it('est false quand turn ne correspond pas au socket.id', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('battleStart');
            act(() => { cb({ turn: 'player-2', players: players2 }); });
            expect(result.current.isMyTurn).toBe(false);
        });

        it('est true quand turn correspond au socket.id', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('battleStart');
            act(() => { cb({ turn: 'player-1', players: players2 }); });
            expect(result.current.isMyTurn).toBe(true);
        });

        it('est false quand socketService.socket est null', () => {
            socketService.socket = null;
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            expect(result.current.isMyTurn).toBe(false);
        });
    });

    // ── Nettoyage ─────────────────────────────────────────────────────────────

    describe('Nettoyage', () => {
        it('désabonne tous les événements au démontage', () => {
            const { unmount } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            unmount();
            const offEvents = socketService.off.mock.calls.map(([ev]) => ev);
            expect(offEvents).toContain('battleStart');
            expect(offEvents).toContain('gameUpdate');
            expect(offEvents).toContain('playerDisconnected');
            expect(offEvents).toContain('waitingForMatch');
            expect(offEvents).toContain('matchFound');
        });
    });

    // ── Événement: waitingForMatch ────────────────────────────────────────────

    describe('Événement: waitingForMatch', () => {
        it('passe matchStatus à "searching"', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('waitingForMatch');
            act(() => { cb(); });
            expect(result.current.matchStatus).toBe('searching');
        });
    });

    // ── Événement: matchFound ─────────────────────────────────────────────────

    describe('Événement: matchFound', () => {
        it('passe matchStatus à "found"', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('matchFound');
            act(() => { cb({ roomId: 'r1', players: players2 }); });
            expect(result.current.matchStatus).toBe('found');
        });

        it('émet playerReady immédiatement', () => {
            renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('matchFound');
            act(() => { cb({ roomId: 'r1', players: players2 }); });
            expect(socketService.emit).toHaveBeenCalledWith('playerReady');
        });

        it('met à jour nickname et opNickname via handlePlayersData', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('matchFound');
            act(() => { cb({ roomId: 'r1', players: players2 }); });
            expect(result.current.stats.nickname).toBe('Hero');
            expect(result.current.stats.opNickname).toBe('Villain');
        });

        it('utilise le specialCooldown fourni', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('matchFound');
            act(() => { cb({ roomId: 'r1', players: players2 }); });
            expect(result.current.stats.specialCooldown).toBe(3);
        });

        it('utilise le cooldown par défaut (5) si specialCooldown est absent', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('matchFound');
            const playersNoCooldown = {
                'player-1': { nickname: 'Hero' },
                'player-2': { nickname: 'Villain' },
            };
            act(() => { cb({ roomId: 'r1', players: playersNoCooldown }); });
            expect(result.current.stats.specialCooldown).toBe(5);
        });

        it('utilise "Opponent" quand l\'adversaire n\'a pas de nickname', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('matchFound');
            const playersNoOpNick = {
                'player-1': { nickname: 'Hero', specialCooldown: 3 },
                'player-2': {},
            };
            act(() => { cb({ roomId: 'r1', players: playersNoOpNick }); });
            expect(result.current.stats.opNickname).toBe('Opponent');
        });

        it('ne plante pas si players est null (handlePlayersData guard)', () => {
            renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('matchFound');
            expect(() => act(() => { cb({ roomId: 'r1', players: null }); })).not.toThrow();
        });

        it('ne met pas à jour les stats si myId absent de players', () => {
            socketService.socket = { id: 'player-99' };
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('matchFound');
            act(() => { cb({ roomId: 'r1', players: players2 }); });
            expect(result.current.stats.nickname).toBe('Hero'); // unchanged default
        });
    });

    // ── Événement: battleStart ────────────────────────────────────────────────

    describe('Événement: battleStart', () => {
        it('passe matchStatus à "started"', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('battleStart');
            act(() => { cb({ turn: 'player-2', players: players2 }); });
            expect(result.current.matchStatus).toBe('started');
        });

        it('met à jour turn', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('battleStart');
            act(() => { cb({ turn: 'player-2', players: players2 }); });
            expect(result.current.turn).toBe('player-2');
        });

        it('appelle onBattleStart avec les données', () => {
            const onBattleStart = jest.fn();
            renderHook(() => useBattleNetwork(onBattleStart, jest.fn()));
            const cb = getEventCallback('battleStart');
            const data = { turn: 'player-1', players: players2 };
            act(() => { cb(data); });
            expect(onBattleStart).toHaveBeenCalledWith(data);
        });

        it('ne plante pas si onBattleStart est null', () => {
            renderHook(() => useBattleNetwork(null, jest.fn()));
            const cb = getEventCallback('battleStart');
            expect(() => act(() => { cb({ turn: 'player-1', players: players2 }); })).not.toThrow();
        });

        it('met à jour les noms via handlePlayersData', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('battleStart');
            act(() => { cb({ turn: 'player-1', players: players2 }); });
            expect(result.current.stats.nickname).toBe('Hero');
            expect(result.current.stats.opNickname).toBe('Villain');
        });
    });

    // ── Événement: gameUpdate ─────────────────────────────────────────────────

    describe('Événement: gameUpdate', () => {
        function makeUpdate(overrides = {}) {
            return {
                turn: 'player-2',
                result: null,
                players: {
                    'player-1': { hp: 80, maxHp: 100, nickname: 'Hero', specialCooldown: 2 },
                    'player-2': { hp: 60, maxHp: 100, nickname: 'Villain' },
                },
                ...overrides,
            };
        }

        it('met à jour hp et opHp', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('gameUpdate');
            act(() => { cb(makeUpdate()); });
            expect(result.current.stats.hp).toBe(80);
            expect(result.current.stats.opHp).toBe(60);
        });

        it('met à jour maxHp et opMaxHp', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('gameUpdate');
            act(() => { cb(makeUpdate()); });
            expect(result.current.stats.maxHp).toBe(100);
            expect(result.current.stats.opMaxHp).toBe(100);
        });

        it('met à jour nickname et opNickname', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('gameUpdate');
            act(() => { cb(makeUpdate()); });
            expect(result.current.stats.nickname).toBe('Hero');
            expect(result.current.stats.opNickname).toBe('Villain');
        });

        it('met à jour specialCooldown', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('gameUpdate');
            act(() => { cb(makeUpdate()); });
            expect(result.current.stats.specialCooldown).toBe(2);
        });

        it('met à jour turn', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('gameUpdate');
            act(() => { cb(makeUpdate()); });
            expect(result.current.turn).toBe('player-2');
        });

        it('définit result quand update.result est truthy', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('gameUpdate');
            act(() => { cb(makeUpdate({ result: 'WIN' })); });
            expect(result.current.result).toBe('WIN');
        });

        it('ne modifie pas result quand update.result est null', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('gameUpdate');
            act(() => { cb(makeUpdate({ result: null })); });
            expect(result.current.result).toBeNull();
        });

        it('appelle onGameUpdate avec les données', () => {
            const onGameUpdate = jest.fn();
            renderHook(() => useBattleNetwork(jest.fn(), onGameUpdate));
            const cb = getEventCallback('gameUpdate');
            const update = makeUpdate();
            act(() => { cb(update); });
            expect(onGameUpdate).toHaveBeenCalledWith(update);
        });

        it('ne plante pas si onGameUpdate est null', () => {
            renderHook(() => useBattleNetwork(jest.fn(), null));
            const cb = getEventCallback('gameUpdate');
            expect(() => act(() => { cb(makeUpdate()); })).not.toThrow();
        });

        it('ne met pas à jour les stats si myId absent de players', () => {
            socketService.socket = { id: 'player-99' };
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('gameUpdate');
            act(() => { cb(makeUpdate()); });
            expect(result.current.stats.hp).toBe(100); // unchanged
        });

        it('utilise les valeurs par défaut quand op est absent', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('gameUpdate');
            const updateNoOp = {
                turn: 'player-1',
                result: null,
                players: {
                    'player-1': { hp: 70, maxHp: 100, nickname: 'Hero', specialCooldown: 1 },
                },
            };
            act(() => { cb(updateNoOp); });
            expect(result.current.stats.opHp).toBe(0);
            expect(result.current.stats.opMaxHp).toBe(100);
            expect(result.current.stats.opNickname).toBe('Opponent');
        });

        it('utilise maxHp=100 par défaut si me.maxHp est absent', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('gameUpdate');
            const updateNoMaxHp = {
                turn: 'player-1',
                result: null,
                players: {
                    'player-1': { hp: 70, nickname: 'Hero', specialCooldown: 1 },
                    'player-2': { hp: 50, nickname: 'Villain' },
                },
            };
            act(() => { cb(updateNoMaxHp); });
            expect(result.current.stats.maxHp).toBe(100);
        });
    });

    // ── Événement: playerDisconnected ─────────────────────────────────────────

    describe('Événement: playerDisconnected', () => {
        it('met opHp à 0', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('playerDisconnected');
            act(() => { cb(); });
            expect(result.current.stats.opHp).toBe(0);
        });

        it('conserve les autres stats inchangées', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('playerDisconnected');
            act(() => { cb(); });
            expect(result.current.stats.hp).toBe(100);
            expect(result.current.stats.maxHp).toBe(100);
        });
    });

    // ── Intervalle playerReady ────────────────────────────────────────────────

    describe('Intervalle playerReady (setInterval)', () => {
        it('émet playerReady toutes les 800ms après matchFound', () => {
            renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const cb = getEventCallback('matchFound');
            act(() => { cb({ roomId: 'r1', players: players2 }); });
            socketService.emit.mockClear();

            act(() => { jest.advanceTimersByTime(800); });
            expect(socketService.emit).toHaveBeenCalledWith('playerReady');
        });

        it('annule l\'intervalle lors de battleStart', () => {
            renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const matchFoundCb = getEventCallback('matchFound');
            const battleStartCb = getEventCallback('battleStart');

            act(() => { matchFoundCb({ roomId: 'r1', players: players2 }); });
            act(() => { battleStartCb({ turn: 'player-1', players: players2 }); });

            socketService.emit.mockClear();
            act(() => { jest.advanceTimersByTime(1600); });
            expect(socketService.emit).not.toHaveBeenCalledWith('playerReady');
        });

        it('battleStart sans interval préalable ne plante pas', () => {
            renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const battleStartCb = getEventCallback('battleStart');
            expect(() => act(() => { battleStartCb({ turn: 'player-1', players: players2 }); })).not.toThrow();
        });
    });
});
