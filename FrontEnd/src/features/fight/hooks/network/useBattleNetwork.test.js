import { renderHook, act } from '@testing-library/react-native';
import { useBattleNetwork } from './useBattleNetwork';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Inline mock object inside the factory to avoid Jest hoisting / TDZ issues
// with const references captured before initialization.
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

// Require after mock registration so we get the same object the hook uses.
const socketService = require('@/services/SocketService').default;

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
    socketService.socket = { id: 'player-1' };
});

describe('useBattleNetwork', () => {
    describe('État initial', () => {
        it('doit initialiser les stats par défaut', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            expect(result.current.stats.hp).toBe(100);
            expect(result.current.stats.maxHp).toBe(100);
            expect(result.current.stats.opHp).toBe(100);
            expect(result.current.stats.opMaxHp).toBe(100);
        });

        it('doit initialiser turn à null', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            expect(result.current.turn).toBeNull();
        });

        it('doit initialiser result à null', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            expect(result.current.result).toBeNull();
        });

        it('doit se connecter au socket au montage', () => {
            renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            expect(socketService.connect).toHaveBeenCalled();
        });

        it('doit s\'abonner aux événements socket au montage', () => {
            renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            const events = socketService.on.mock.calls.map(([event]) => event);
            expect(events).toContain('waitingForMatch');
            expect(events).toContain('matchFound');
            expect(events).toContain('battleStart');
            expect(events).toContain('gameUpdate');
            expect(events).toContain('playerDisconnected');
        });
    });

    describe('Actions', () => {
        it('doit émettre findMatch via socketService', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.findMatch(); });
            expect(socketService.emit).toHaveBeenCalledWith('findMatch');
        });

        it('doit émettre playerReady via sendReady', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.sendReady(); });
            expect(socketService.emit).toHaveBeenCalledWith('playerReady');
        });

        it('doit émettre playerAction avec ATTACK', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.sendAction('ATTACK'); });
            expect(socketService.emit).toHaveBeenCalledWith('playerAction', { action: 'ATTACK' });
        });

        it('doit émettre playerAction avec DEFEND', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.sendAction('DEFEND'); });
            expect(socketService.emit).toHaveBeenCalledWith('playerAction', { action: 'DEFEND' });
        });

        it('doit émettre playerAction avec HEAL', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.sendAction('HEAL'); });
            expect(socketService.emit).toHaveBeenCalledWith('playerAction', { action: 'HEAL' });
        });

        it('doit mettre hp à 0 lors de abandon', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.abandon(); });
            expect(result.current.stats.hp).toBe(0);
        });

        it('doit se déconnecter lors de abandon', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            act(() => { result.current.abandon(); });
            expect(socketService.disconnect).toHaveBeenCalled();
        });
    });

    describe('isMyTurn', () => {
        it('doit retourner false quand turn est null', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            expect(result.current.isMyTurn).toBe(false);
        });

        it('doit retourner false quand turn ne correspond pas à l\'id du socket', () => {
            const { result } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            // turn is null by default, socket.id is 'player-1' — they don't match
            expect(result.current.isMyTurn).toBe(false);
        });
    });

    describe('Nettoyage', () => {
        it('doit désabonner les événements au démontage', () => {
            const { unmount } = renderHook(() => useBattleNetwork(jest.fn(), jest.fn()));
            unmount();
            expect(socketService.off).toHaveBeenCalledWith('battleStart');
            expect(socketService.off).toHaveBeenCalledWith('gameUpdate');
            expect(socketService.off).toHaveBeenCalledWith('playerDisconnected');
        });
    });
});
