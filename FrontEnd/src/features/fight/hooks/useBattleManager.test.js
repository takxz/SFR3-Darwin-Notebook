import { renderHook, act } from '@testing-library/react-native';
import { useBattleManager } from './useBattleManager';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('expo-av', () => ({
    Audio: {
        Sound: {
            createAsync: jest.fn().mockResolvedValue({
                sound: { replayAsync: jest.fn(), unloadAsync: jest.fn() },
            }),
        },
    },
}));

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    ImpactFeedbackStyle: { Heavy: 'Heavy', Medium: 'Medium' },
    NotificationFeedbackType: { Warning: 'Warning', Success: 'Success', Error: 'Error' },
}));

jest.mock('../constants/FightAssets', () => ({
    AUDIO_ASSETS: {
        HITS: ['hit_1', 'hit_2', 'hit_3', 'hit_4'],
    },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
});

afterEach(() => {
    jest.useRealTimers();
});

describe('useBattleManager', () => {
    describe('État initial', () => {
        it('doit initialiser hit à 0', () => {
            const { result } = renderHook(() => useBattleManager(jest.fn()));
            expect(result.current.hit).toBe(0);
        });

        it('doit initialiser combo à 0', () => {
            const { result } = renderHook(() => useBattleManager(jest.fn()));
            expect(result.current.combo).toBe(0);
        });

        it('doit initialiser enemyHit à 0', () => {
            const { result } = renderHook(() => useBattleManager(jest.fn()));
            expect(result.current.enemyHit).toBe(0);
        });

        it('doit initialiser isSpecial à false', () => {
            const { result } = renderHook(() => useBattleManager(jest.fn()));
            expect(result.current.isSpecial).toBe(false);
        });

        it('doit initialiser isIntro à true', () => {
            const { result } = renderHook(() => useBattleManager(jest.fn()));
            expect(result.current.isIntro).toBe(true);
        });

        it('doit initialiser isLoaded à false', () => {
            const { result } = renderHook(() => useBattleManager(jest.fn()));
            expect(result.current.isLoaded).toBe(false);
        });

        it('doit exposer toutes les fonctions d\'action', () => {
            const { result } = renderHook(() => useBattleManager(jest.fn()));
            expect(typeof result.current.triggerPlayerHit).toBe('function');
            expect(typeof result.current.triggerEnemyHit).toBe('function');
            expect(typeof result.current.triggerSpecial).toBe('function');
            expect(typeof result.current.triggerEnemySpecial).toBe('function');
            expect(typeof result.current.startBattleSequence).toBe('function');
            expect(typeof result.current.setIsLoaded).toBe('function');
            expect(typeof result.current.setIsIntro).toBe('function');
        });

        it('doit exposer les animations', () => {
            const { result } = renderHook(() => useBattleManager(jest.fn()));
            expect(result.current.cinematicAnim).toBeDefined();
            expect(result.current.comboScaleAnim).toBeDefined();
            expect(result.current.btnScaleAnim).toBeDefined();
        });
    });

    describe('triggerPlayerHit', () => {
        it('doit incrémenter hit et combo', () => {
            const { result } = renderHook(() => useBattleManager(jest.fn()));
            act(() => {
                result.current.triggerPlayerHit();
            });
            expect(result.current.hit).toBe(1);
            expect(result.current.combo).toBe(1);
        });

        it('doit remettre hit à 0 après 40ms', () => {
            const { result } = renderHook(() => useBattleManager(jest.fn()));
            act(() => {
                result.current.triggerPlayerHit();
            });
            expect(result.current.hit).toBe(1);
            act(() => { jest.advanceTimersByTime(40); });
            expect(result.current.hit).toBe(0);
        });

        it('doit remettre combo à 0 après 1500ms sans nouveau hit', () => {
            const { result } = renderHook(() => useBattleManager(jest.fn()));
            act(() => {
                result.current.triggerPlayerHit();
            });
            expect(result.current.combo).toBe(1);
            act(() => { jest.advanceTimersByTime(1500); });
            expect(result.current.combo).toBe(0);
        });

        it('doit accumuler le combo sur plusieurs hits', () => {
            const { result } = renderHook(() => useBattleManager(jest.fn()));
            act(() => {
                result.current.triggerPlayerHit();
                result.current.triggerPlayerHit();
                result.current.triggerPlayerHit();
            });
            expect(result.current.combo).toBe(3);
        });
    });

    describe('triggerEnemyHit', () => {
        it('doit incrémenter enemyHit', () => {
            const { result } = renderHook(() => useBattleManager(jest.fn()));
            act(() => {
                result.current.triggerEnemyHit();
            });
            expect(result.current.enemyHit).toBe(1);
        });

        it('doit remettre enemyHit à 0 après 40ms', () => {
            const { result } = renderHook(() => useBattleManager(jest.fn()));
            act(() => {
                result.current.triggerEnemyHit();
            });
            act(() => { jest.advanceTimersByTime(40); });
            expect(result.current.enemyHit).toBe(0);
        });
    });

    describe('startBattleSequence', () => {
        it('doit définir isIntro à false après l\'animation', () => {
            const { result } = renderHook(() => useBattleManager(jest.fn()));
            act(() => {
                result.current.startBattleSequence();
                jest.runAllTimers();
            });
            expect(result.current.isIntro).toBe(false);
        });
    });
});
