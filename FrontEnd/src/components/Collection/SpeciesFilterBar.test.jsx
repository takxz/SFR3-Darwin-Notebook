import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SpeciesFilterBar } from './SpeciesFilterBar';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const options = [
    { key: 'all', label: 'Tous' },
    { key: 'fauna', label: 'Faune' },
    { key: 'flora', label: 'Flore' },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SpeciesFilterBar', () => {
    describe('Rendu de base', () => {
        it('doit se rendre sans erreur', () => {
            expect(() =>
                render(<SpeciesFilterBar options={options} selectedKey="all" onSelect={jest.fn()} />)
            ).not.toThrow();
        });

        it('doit afficher tous les labels d\'options', () => {
            render(<SpeciesFilterBar options={options} selectedKey="all" onSelect={jest.fn()} />);
            expect(screen.getByText('Tous')).toBeTruthy();
            expect(screen.getByText('Faune')).toBeTruthy();
            expect(screen.getByText('Flore')).toBeTruthy();
        });

        it('doit afficher le bon nombre d\'onglets', () => {
            render(<SpeciesFilterBar options={options} selectedKey="all" onSelect={jest.fn()} />);
            expect(screen.getAllByText(/Tous|Faune|Flore/).length).toBe(3);
        });

        it('doit se rendre avec une liste d\'options vide', () => {
            expect(() =>
                render(<SpeciesFilterBar options={[]} selectedKey="" onSelect={jest.fn()} />)
            ).not.toThrow();
        });
    });

    describe('Sélection', () => {
        it('doit appeler onSelect avec la bonne clé quand un onglet est pressé', () => {
            const onSelect = jest.fn();
            render(<SpeciesFilterBar options={options} selectedKey="all" onSelect={onSelect} />);
            fireEvent.press(screen.getByText('Faune'));
            expect(onSelect).toHaveBeenCalledWith('fauna');
        });

        it('doit appeler onSelect avec la clé correcte pour chaque onglet', () => {
            const onSelect = jest.fn();
            render(<SpeciesFilterBar options={options} selectedKey="all" onSelect={onSelect} />);

            fireEvent.press(screen.getByText('Tous'));
            expect(onSelect).toHaveBeenCalledWith('all');

            fireEvent.press(screen.getByText('Flore'));
            expect(onSelect).toHaveBeenCalledWith('flora');
        });

        it('doit appeler onSelect une seule fois par pression', () => {
            const onSelect = jest.fn();
            render(<SpeciesFilterBar options={options} selectedKey="all" onSelect={onSelect} />);
            fireEvent.press(screen.getByText('Faune'));
            expect(onSelect).toHaveBeenCalledTimes(1);
        });
    });

    describe('Onglet sélectionné', () => {
        it('doit appliquer la couleur sélectionnée au label de l\'onglet actif', () => {
            const { UNSAFE_getAllByType } = render(
                <SpeciesFilterBar options={options} selectedKey="fauna" onSelect={jest.fn()} />
            );
            const { Text } = require('react-native');
            const labels = UNSAFE_getAllByType(Text);
            const faunaLabel = labels.find(l => l.props.children === 'Faune');
            const labelStyle = Array.isArray(faunaLabel.props.style)
                ? faunaLabel.props.style
                : [faunaLabel.props.style];
            const hasSelectedColor = labelStyle.some(s => s && s.color === '#fff8ec');
            expect(hasSelectedColor).toBe(true);
        });

        it('ne doit pas appliquer la couleur sélectionnée aux onglets non actifs', () => {
            const { UNSAFE_getAllByType } = render(
                <SpeciesFilterBar options={options} selectedKey="fauna" onSelect={jest.fn()} />
            );
            const { Text } = require('react-native');
            const labels = UNSAFE_getAllByType(Text);
            const allLabel = labels.find(l => l.props.children === 'Tous');
            const labelStyle = Array.isArray(allLabel.props.style)
                ? allLabel.props.style
                : [allLabel.props.style];
            const hasSelectedColor = labelStyle.some(s => s && s.color === '#fff8ec');
            expect(hasSelectedColor).toBe(false);
        });
    });
});
