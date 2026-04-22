import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import SettingsItem from './SettingsItem';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('lucide-react-native', () => ({
    ChevronRight: () => null,
}));

jest.mock('../features/profil/modals/profilStyles', () => ({
    styles: {
        settingsItem: {},
        settingsItemContent: {},
        settingsItemLabel: {},
    },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MockIcon = () => null;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SettingsItem', () => {
    describe('Rendu de base', () => {
        it('doit se rendre sans erreur', () => {
            expect(() =>
                render(<SettingsItem icon={MockIcon} label="Profil" onPress={jest.fn()} />)
            ).not.toThrow();
        });

        it('doit afficher le label', () => {
            render(<SettingsItem icon={MockIcon} label="Modifier le profil" onPress={jest.fn()} />);
            expect(screen.getByText('Modifier le profil')).toBeTruthy();
        });
    });

    describe('Variantes', () => {
        it('doit utiliser la variante "default" par défaut (texte marron)', () => {
            const { UNSAFE_getAllByType } = render(
                <SettingsItem icon={MockIcon} label="Élément" onPress={jest.fn()} />
            );
            const { Text } = require('react-native');
            const texts = UNSAFE_getAllByType(Text);
            const label = texts.find(t => t.props.children === 'Élément');
            const styleArray = Array.isArray(label.props.style) ? label.props.style : [label.props.style];
            expect(styleArray.some(s => s && s.color === '#97572B')).toBe(true);
        });

        it('doit appliquer la couleur de texte blanche pour la variante "primary"', () => {
            const { UNSAFE_getAllByType } = render(
                <SettingsItem icon={MockIcon} label="Élément" onPress={jest.fn()} variant="primary" />
            );
            const { Text } = require('react-native');
            const texts = UNSAFE_getAllByType(Text);
            const label = texts.find(t => t.props.children === 'Élément');
            const styleArray = Array.isArray(label.props.style) ? label.props.style : [label.props.style];
            expect(styleArray.some(s => s && s.color === '#FFFFFF')).toBe(true);
        });

        it('doit appliquer la couleur de texte blanche pour la variante "danger"', () => {
            const { UNSAFE_getAllByType } = render(
                <SettingsItem icon={MockIcon} label="Supprimer" onPress={jest.fn()} variant="danger" />
            );
            const { Text } = require('react-native');
            const texts = UNSAFE_getAllByType(Text);
            const label = texts.find(t => t.props.children === 'Supprimer');
            const styleArray = Array.isArray(label.props.style) ? label.props.style : [label.props.style];
            expect(styleArray.some(s => s && s.color === '#FFFFFF')).toBe(true);
        });

        it('doit se rendre sans erreur pour la variante "primary"', () => {
            expect(() =>
                render(<SettingsItem icon={MockIcon} label="Élément" onPress={jest.fn()} variant="primary" />)
            ).not.toThrow();
        });

        it('doit se rendre sans erreur pour la variante "danger"', () => {
            expect(() =>
                render(<SettingsItem icon={MockIcon} label="Supprimer" onPress={jest.fn()} variant="danger" />)
            ).not.toThrow();
        });
    });

    describe('Interaction', () => {
        it('doit appeler onPress au clic', () => {
            const onPress = jest.fn();
            render(<SettingsItem icon={MockIcon} label="Profil" onPress={onPress} />);
            fireEvent.press(screen.getByText('Profil'));
            expect(onPress).toHaveBeenCalledTimes(1);
        });
    });
});
