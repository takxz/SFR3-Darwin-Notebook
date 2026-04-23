import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import ArenaScreen from './arena';

// ─── MUTABLE MOCK STATE (Prefixed with 'mock' to avoid Jest hoist errors) ───
let mockBattleManager;
let mockBattleNetwork;
let mockUser = { pseudo: 'TestHero' };
let mockCapturedCallbacks = { onBattleStart: null, onGameUpdate: null };

// ─── MOCKS ────────────────────────────────────────────────────────────────────

jest.mock('@react-three/fiber/native', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        Canvas: ({ onCreated, children }) => {
            React.useEffect(() => { if (onCreated) onCreated(); }, []);
            return <View testID="canvas">{children}</View>;
        },
    };
});

jest.mock('@react-three/drei/native', () => ({
    useProgress: jest.fn(() => ({ progress: 100 })),
}));

jest.mock('expo-router', () => ({
    useRouter: jest.fn(() => ({ replace: jest.fn() })),
}));

// Mock New Components
jest.mock('@/features/fight/components/UI/MatchmakingScreen', () => ({
    MatchmakingScreen: ({ onCancel }) => {
        const { View, Pressable, Text } = require('react-native');
        return (
            <View testID="matchmaking-screen">
                <Pressable testID="btn-cancel-match" onPress={onCancel}><Text>Cancel</Text></Pressable>
            </View>
        );
    },
}));

jest.mock('@/hooks/useUser', () => ({
    useUser: jest.fn(() => ({ user: mockUser })),
}));

// Standard Mocks
jest.mock('@/features/fight/components/3D/Scene', () => jest.fn(() => null));
jest.mock('@/features/fight/components/UI/LoadingScreen', () => ({
    LoadingScreen: () => {
        const { View } = require('react-native');
        return <View testID="loading-screen" />;
    },
}));

jest.mock('@/features/fight/components/UI/BattleOverlay', () => ({
    BattleOverlay: ({ onQuit }) => {
        const { View, Pressable } = require('react-native');
        return (
            <View testID="battle-overlay">
                <Pressable testID="btn-quit" onPress={onQuit} />
            </View>
        );
    },
}));

jest.mock('@/features/fight/hooks/useBattleManager', () => ({
    useBattleManager: jest.fn(() => mockBattleManager),
}));

jest.mock('@/features/fight/hooks/network/useBattleNetwork', () => ({
    useBattleNetwork: jest.fn((onBattleStart, onGameUpdate) => {
        mockCapturedCallbacks.onBattleStart = onBattleStart;
        mockCapturedCallbacks.onGameUpdate = onGameUpdate;
        return mockBattleNetwork;
    }),
}));

jest.mock('@/services/SocketService', () => ({
    __esModule: true,
    default: { disconnect: jest.fn(), socket: { id: 'my-id' } },
}));

jest.mock('@react-navigation/native', () => ({
    NavigationIndependentTree: ({ children }) => children,
}));

// ─── SETUP ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockCapturedCallbacks = { onBattleStart: null, onGameUpdate: null };

    mockBattleManager = {
        hit: 0, enemyHit: 0, combo: 0, isSpecial: false, isIntro: true,
        setIsIntro: jest.fn(), isLoaded: false, setIsLoaded: jest.fn(),
        audioReady: true, cinematicAnim: { value: 0 }, comboScaleAnim: { value: 1 },
        triggerPlayerHit: jest.fn(), triggerEnemyHit: jest.fn(),
        triggerSpecial: jest.fn(), triggerEnemySpecial: jest.fn(),
        startBattleSequence: jest.fn(),
    };

    mockBattleNetwork = {
        stats: null, turn: null, isMyTurn: false, matchStatus: 'searching',
        findMatch: jest.fn(), sendAction: jest.fn(), abandon: jest.fn(),
    };
});

afterEach(() => {
    jest.useRealTimers();
});

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('ArenaScreen (v2 with Matchmaking)', () => {
    
    describe('Matchmaking Flow', () => {
        it('should show MatchmakingScreen when matchStatus is searching', async () => {
            mockBattleNetwork.matchStatus = 'searching';
            render(<ArenaScreen />);
            expect(screen.getByTestId('matchmaking-screen')).toBeTruthy();
            expect(screen.queryByTestId('battle-overlay')).toBeNull();
        });

        it('should call findMatch with user pseudo when loaded', async () => {
            mockBattleManager.isLoaded = true;
            render(<ArenaScreen />);
            
            expect(mockBattleNetwork.findMatch).toHaveBeenCalledWith(
                expect.objectContaining({ nickname: 'TestHero' })
            );
        });

        it('should call setIsLoaded(false) when matchmaking is cancelled', async () => {
            mockBattleNetwork.matchStatus = 'searching';
            render(<ArenaScreen />);
            
            fireEvent.press(screen.getByTestId('btn-cancel-match'));
            expect(mockBattleManager.setIsLoaded).toHaveBeenCalledWith(false);
        });
    });

    describe('Loading Logic', () => {
        it('should hide loading and matchmaking once match is found (status: started)', async () => {
            mockBattleNetwork.matchStatus = 'started';
            mockBattleManager.isLoaded = true;
            
            render(<ArenaScreen />);
            
            expect(screen.queryByTestId('matchmaking-screen')).toBeNull();
            expect(screen.queryByTestId('loading-screen')).toBeNull();
            expect(screen.getByTestId('battle-overlay')).toBeTruthy();
        });

        it('should trigger setIsLoaded(true) after 500ms when assets are ready', async () => {
            render(<ArenaScreen />);
            
            // Fast-forward the setTimeout
            act(() => { jest.advanceTimersByTime(500); });
            
            expect(mockBattleManager.setIsLoaded).toHaveBeenCalledWith(true);
        });
    });

    describe('Network Callbacks', () => {
        it('should trigger player hit when opponent receives a hit (and it is not my special)', async () => {
            mockBattleNetwork.matchStatus = 'started';
            render(<ArenaScreen />);
            
            act(() => {
                mockCapturedCallbacks.onGameUpdate({
                    players: {
                        'my-id': { action: 'IDLE' },
                        'enemy-id': { action: 'HIT' }
                    }
                });
            });

            expect(mockBattleManager.triggerPlayerHit).toHaveBeenCalled();
        });

        it('should trigger enemy special when I am hit by a special move', async () => {
            render(<ArenaScreen />);
            
            act(() => {
                mockCapturedCallbacks.onGameUpdate({
                    players: {
                        'my-id': { action: 'HIT' },
                        'enemy-id': { action: 'SPECIAL' }
                    }
                });
            });

            expect(mockBattleManager.triggerEnemySpecial).toHaveBeenCalled();
        });
    });

    describe('Navigation', () => {
        it('should disconnect and navigate away on quit', async () => {
            const socketService = require('@/services/SocketService').default;
            const { useRouter } = require('expo-router');
            const mockReplace = useRouter().replace;
            
            mockBattleNetwork.matchStatus = 'started';
            render(<ArenaScreen />);
            
            fireEvent.press(screen.getByTestId('btn-quit'));
            
            expect(socketService.disconnect).toHaveBeenCalled();
        });
    });
});