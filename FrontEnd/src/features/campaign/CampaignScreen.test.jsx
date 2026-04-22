import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import CampaignScreen from './CampaignScreen';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/assets/locales/fr.json', () => ({}));

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: jest.fn(() => ({ back: mockBack, push: mockPush })),
}));

jest.mock('lucide-react-native', () => ({
    ArrowLeft: () => null,
    Map: () => null,
    Star: () => null,
    ChevronRight: () => null,
    Coins: () => null,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderScreen() {
    const result = render(<CampaignScreen />);
    act(() => { jest.runAllTimers(); });
    return result;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
});

afterEach(() => {
    jest.useRealTimers();
});

describe('CampaignScreen', () => {
    describe('Rendu de base', () => {
        it('doit se rendre sans erreur', () => {
            expect(() => renderScreen()).not.toThrow();
        });

        it('doit afficher le titre CAMPAGNE', () => {
            renderScreen();
            expect(screen.getByText('CAMPAGNE')).toBeTruthy();
        });

        it('doit afficher le label de progression', () => {
            renderScreen();
            expect(screen.getByText('PROGRESSION')).toBeTruthy();
        });

        it('doit afficher le total de pièces', () => {
            renderScreen();
            expect(screen.getByText('700')).toBeTruthy();
        });
    });

    describe('Progression', () => {
        it('doit afficher 0/6 niveaux complétés au départ', () => {
            renderScreen();
            expect(screen.getByText('0/6')).toBeTruthy();
        });

        it('doit afficher 0 étoiles au départ', () => {
            renderScreen();
            expect(screen.getByText('0')).toBeTruthy();
        });
    });

    describe('Niveaux', () => {
        it('doit afficher les 6 noms de niveaux', () => {
            renderScreen();
            expect(screen.getByText('Forêt')).toBeTruthy();
            expect(screen.getByText('Rivière')).toBeTruthy();
            expect(screen.getByText('Col de montagne')).toBeTruthy();
            expect(screen.getByText('Oasis du désert')).toBeTruthy();
            expect(screen.getByText('Récif corallien')).toBeTruthy();
            expect(screen.getByText('Toundra arctique')).toBeTruthy();
        });

        it('doit afficher les descriptions de niveaux', () => {
            renderScreen();
            expect(screen.getByText('Combattez les vides dans la fôret')).toBeTruthy();
            expect(screen.getByText('Explorez les écosystèmes aquatiques')).toBeTruthy();
        });

        it('doit afficher les numéros de niveaux', () => {
            renderScreen();
            expect(screen.getByText('1')).toBeTruthy();
            expect(screen.getByText('6')).toBeTruthy();
        });

        it('doit afficher les récompenses de pièces', () => {
            renderScreen();
            expect(screen.getByText('+100')).toBeTruthy();
            expect(screen.getByText('+150')).toBeTruthy();
            expect(screen.getByText('+350')).toBeTruthy();
        });

        it('doit afficher LOCKED pour les 5 niveaux verrouillés', () => {
            renderScreen();
            expect(screen.getAllByText('LOCKED').length).toBe(5);
        });

        it('doit ne pas afficher LOCKED pour le premier niveau déverrouillé', () => {
            renderScreen();
            // Only 5 LOCKED badges means level 1 (Forêt) has none
            expect(screen.getAllByText('LOCKED').length).toBeLessThan(6);
        });
    });

    describe('Navigation', () => {
        it('doit naviguer vers /campaign/level/1 quand le niveau Forêt est pressé', () => {
            renderScreen();
            fireEvent.press(screen.getByText('Forêt'));
            expect(mockPush).toHaveBeenCalledWith('/campaign/level/1');
        });

        it('ne doit pas naviguer quand un niveau verrouillé est pressé', () => {
            renderScreen();
            fireEvent.press(screen.getByText('Rivière'));
            expect(mockPush).not.toHaveBeenCalled();
        });
    });

    describe('Structure', () => {
        it('doit avoir un en-tête avec le titre et le compteur d\'étoiles', () => {
            renderScreen();
            expect(screen.getByText('CAMPAGNE')).toBeTruthy();
            expect(screen.getByText('0')).toBeTruthy();
        });

        it('doit avoir une section progression avec barre et info', () => {
            renderScreen();
            expect(screen.getByText('PROGRESSION')).toBeTruthy();
            expect(screen.getByText('0/6')).toBeTruthy();
        });
    });
});
