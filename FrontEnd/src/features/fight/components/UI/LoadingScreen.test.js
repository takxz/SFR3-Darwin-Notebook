import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LoadingScreen } from './LoadingScreen';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoadingScreen', () => {
    describe('Rendu de base', () => {
        it('doit se rendre sans erreur', () => {
            expect(() => render(<LoadingScreen progress={0} />)).not.toThrow();
        });

        it('doit afficher le titre de chargement', () => {
            render(<LoadingScreen progress={0} />);
            expect(screen.getByText('CHARGEMENT DE L\'ARÈNE...')).toBeTruthy();
        });

        it('doit afficher le sous-texte', () => {
            render(<LoadingScreen progress={0} />);
            expect(screen.getByText('PATIENCE...')).toBeTruthy();
        });
    });

    describe('Progression', () => {
        it('doit afficher 0% au départ', () => {
            render(<LoadingScreen progress={0} />);
            expect(screen.getByText('0%')).toBeTruthy();
        });

        it('doit afficher 50% à mi-chemin', () => {
            render(<LoadingScreen progress={50} />);
            expect(screen.getByText('50%')).toBeTruthy();
        });

        it('doit afficher 100% en fin de chargement', () => {
            render(<LoadingScreen progress={100} />);
            expect(screen.getByText('100%')).toBeTruthy();
        });
    });
});
