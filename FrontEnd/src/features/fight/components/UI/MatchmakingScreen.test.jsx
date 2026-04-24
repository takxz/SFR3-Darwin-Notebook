import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { MatchmakingScreen } from './MatchmakingScreen';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('lucide-react-native', () => ({ X: 'MockX' }));

jest.mock('expo-linear-gradient', () => {
    const { View } = require('react-native');
    return { LinearGradient: ({ children, ...props }) => <View {...props}>{children}</View> };
});

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ back: mockBack }),
}));

const mockDisconnect = jest.fn();
jest.mock('@/services/SocketService', () => ({
    __esModule: true,
    default: { disconnect: (...args) => mockDisconnect(...args) },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MatchmakingScreen', () => {
    beforeEach(() => {
        mockBack.mockClear();
        mockDisconnect.mockClear();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Rendu de base', () => {
        it('se rend sans erreur', () => {
            expect(() => render(<MatchmakingScreen />)).not.toThrow();
        });

        it('affiche le titre de recherche', () => {
            render(<MatchmakingScreen />);
            expect(screen.getByText("Recherche d'adversaire.")).toBeTruthy();
        });

        it('affiche le sous-titre réseau', () => {
            render(<MatchmakingScreen />);
            expect(screen.getByText('Connexion au réseau de combat')).toBeTruthy();
        });

        it('affiche le bouton ANNULER', () => {
            render(<MatchmakingScreen />);
            expect(screen.getByText('ANNULER')).toBeTruthy();
        });

        it('affiche le texte d\'astuce', () => {
            render(<MatchmakingScreen />);
            expect(screen.getByText(/Assurez-vous d'avoir sélectionné/)).toBeTruthy();
        });
    });

    describe('Timer', () => {
        it('affiche 0s au départ', () => {
            render(<MatchmakingScreen />);
            expect(screen.getByText('0s')).toBeTruthy();
        });

        it('incrémente le timer toutes les secondes', () => {
            render(<MatchmakingScreen />);
            act(() => { jest.advanceTimersByTime(3000); });
            expect(screen.getByText('3s')).toBeTruthy();
        });

        it('continue à incrémenter après plusieurs secondes', () => {
            render(<MatchmakingScreen />);
            act(() => { jest.advanceTimersByTime(10000); });
            expect(screen.getByText('10s')).toBeTruthy();
        });
    });

    describe('Annulation', () => {
        it('appelle socketService.disconnect quand ANNULER est pressé', () => {
            render(<MatchmakingScreen />);
            fireEvent.press(screen.getByText('ANNULER'));
            expect(mockDisconnect).toHaveBeenCalledTimes(1);
        });

        it('appelle router.back() quand ANNULER est pressé', () => {
            render(<MatchmakingScreen />);
            fireEvent.press(screen.getByText('ANNULER'));
            expect(mockBack).toHaveBeenCalledTimes(1);
        });

        it('appelle onCancel si fourni quand ANNULER est pressé', () => {
            const onCancel = jest.fn();
            render(<MatchmakingScreen onCancel={onCancel} />);
            fireEvent.press(screen.getByText('ANNULER'));
            expect(onCancel).toHaveBeenCalledTimes(1);
        });

        it('ne plante pas si onCancel n\'est pas fourni', () => {
            render(<MatchmakingScreen />);
            expect(() => fireEvent.press(screen.getByText('ANNULER'))).not.toThrow();
        });
    });
});
