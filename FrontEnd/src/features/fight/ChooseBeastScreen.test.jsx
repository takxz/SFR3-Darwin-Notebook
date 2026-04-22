import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ChooseBeastScreen from './ChooseBeastScreen';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/assets/locales/fr.json', () => ({
    chooseBeastScreen: {
        back: 'Retour',
        title: 'CHOISIR VOTRE BÊTE',
        subtitle: 'Sélectionnez l\'animal qui vous représentera au combat',
        start_battle: 'COMMENCER LE DUEL',
    },
}));

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: jest.fn(() => ({ back: mockBack, push: mockPush })),
}));

jest.mock('lucide-react-native', () => ({
    ArrowLeft: () => null,
    Heart: () => null,
    Star: () => null,
    Swords: () => null,
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
});

describe('ChooseBeastScreen', () => {
    describe('Rendu de base', () => {
        it('doit se rendre sans erreur', () => {
            expect(() => render(<ChooseBeastScreen />)).not.toThrow();
        });

        it('doit afficher le titre', () => {
            render(<ChooseBeastScreen />);
            expect(screen.getByText('CHOISIR VOTRE BÊTE')).toBeTruthy();
        });

        it('doit afficher le sous-titre', () => {
            render(<ChooseBeastScreen />);
            expect(screen.getByText('Sélectionnez l\'animal qui vous représentera au combat')).toBeTruthy();
        });

        it('doit afficher le bouton retour', () => {
            render(<ChooseBeastScreen />);
            expect(screen.getByText('Retour')).toBeTruthy();
        });
    });

    describe('Liste des bêtes', () => {
        it('doit afficher les 5 bêtes', () => {
            render(<ChooseBeastScreen />);
            expect(screen.getByText('Lion')).toBeTruthy();
            expect(screen.getByText('Éléphant')).toBeTruthy();
            expect(screen.getByText('Aigle')).toBeTruthy();
            expect(screen.getByText('Serpent')).toBeTruthy();
            expect(screen.getByText('Loup')).toBeTruthy();
        });

        it('doit afficher les labels de rareté', () => {
            render(<ChooseBeastScreen />);
            expect(screen.getByText('Epic')).toBeTruthy();
            expect(screen.getAllByText('Rare').length).toBeGreaterThan(0);
            expect(screen.getByText('Uncommon')).toBeTruthy();
        });

        it('doit afficher les points de vie des bêtes', () => {
            render(<ChooseBeastScreen />);
            expect(screen.getByText('120/120')).toBeTruthy();
            expect(screen.getByText('150/150')).toBeTruthy();
            expect(screen.getByText('90/90')).toBeTruthy();
        });
    });

    describe('Sélection', () => {
        it('ne doit pas naviguer au premier clic sur une bête', () => {
            render(<ChooseBeastScreen />);
            fireEvent.press(screen.getByText('Lion'));
            expect(mockPush).not.toHaveBeenCalled();
        });

        it('doit naviguer vers l\'arène au second clic sur la même bête', () => {
            render(<ChooseBeastScreen />);
            fireEvent.press(screen.getByText('Lion'));
            fireEvent.press(screen.getByText('Lion'));
            expect(mockPush).toHaveBeenCalledWith({ pathname: '/fight/arena', params: { beastId: 1 } });
        });

        it('ne doit pas naviguer si on clique sur deux bêtes différentes', () => {
            render(<ChooseBeastScreen />);
            fireEvent.press(screen.getByText('Lion'));
            fireEvent.press(screen.getByText('Éléphant'));
            expect(mockPush).not.toHaveBeenCalled();
        });
    });

    describe('Navigation', () => {
        it('doit appeler router.back() au clic sur Retour', () => {
            render(<ChooseBeastScreen />);
            fireEvent.press(screen.getByText('Retour'));
            expect(mockBack).toHaveBeenCalled();
        });
    });
});
