import React from 'react';
import { render, screen } from '@testing-library/react-native';
import WaitingComponent from './WaitingComponent';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../assets/locales/fr.json', () => ({
    waitingScreen: {
        analyzing: 'Analyse en cours...',
        description: "Identification de l'organisme...",
    },
}));

jest.mock('expo-linear-gradient', () => {
    const { View } = require('react-native');
    return { LinearGradient: ({ children, ...props }) => <View {...props}>{children}</View> };
});

jest.mock('lucide-react-native', () => ({
    ScanLine: () => null,
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WaitingComponent', () => {
    describe('Rendu de base', () => {
        it('doit se rendre sans erreur', () => {
            expect(() => render(<WaitingComponent />)).not.toThrow();
        });

        it('doit afficher le titre d\'analyse', () => {
            render(<WaitingComponent />);
            expect(screen.getByText('Analyse en cours...')).toBeTruthy();
        });

        it('doit afficher le sous-titre de description', () => {
            render(<WaitingComponent />);
            expect(screen.getByText("Identification de l'organisme...")).toBeTruthy();
        });
    });
});
