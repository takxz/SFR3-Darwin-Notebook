import { renderHook, act } from '@testing-library/react-native';
import { useBattleNetwork } from './useBattleNetwork';
import socketService from '@/services/SocketService';

jest.mock('@/services/SocketService', () => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    socket: { id: 'test-socket-id' }
}));

describe('useBattleNetwork', () => {
    let handlers = {};

    beforeEach(() => {
        handlers = {};
        socketService.on.mockImplementation((event, handler) => {
            handlers[event] = handler;
        });
        jest.clearAllMocks();
    });

    it('doit s\'initialiser avec les stats par défaut', () => {
        const { result } = renderHook(() => useBattleNetwork());
        expect(result.current.stats.hp).toBe(100);
        expect(result.current.matchStatus).toBe('idle');
    });

    it('doit passer en état searching quand findMatch est appelé', () => {
        const { result } = renderHook(() => useBattleNetwork());
        act(() => {
            result.current.findMatch({ playerId: 'u1' });
        });
        expect(result.current.matchStatus).toBe('searching');
        expect(socketService.emit).toHaveBeenCalledWith('findMatch', { playerId: 'u1' });
    });

    it('doit mettre à jour le statut quand matchFound est reçu', () => {
        const { result } = renderHook(() => useBattleNetwork());
        act(() => {
            handlers['matchFound']({ roomId: 'r1', players: { 'test-socket-id': { nickname: 'Hero' } } });
        });
        expect(result.current.matchStatus).toBe('found');
        expect(result.current.stats.nickname).toBe('Hero');
    });

    it('doit mettre à jour le statut quand battleStart est reçu', () => {
        const onBattleStart = jest.fn();
        const { result } = renderHook(() => useBattleNetwork(onBattleStart));
        act(() => {
            handlers['battleStart']({ turn: 'test-socket-id', players: {} });
        });
        expect(result.current.matchStatus).toBe('started');
        expect(result.current.turn).toBe('test-socket-id');
        expect(onBattleStart).toHaveBeenCalled();
    });

    it('doit gérer les récompenses via REWARD_GRANTED', () => {
        const { result } = renderHook(() => useBattleNetwork());
        const mockRewards = { xp: 100 };
        act(() => {
            handlers['REWARD_GRANTED'](mockRewards);
        });
        expect(result.current.rewards).toEqual(mockRewards);
    });

    it('doit gérer la déconnexion de l\'adversaire', () => {
        const { result } = renderHook(() => useBattleNetwork());
        act(() => {
            handlers['playerDisconnected']();
        });
        expect(result.current.stats.opHp).toBe(0);
    });
});
