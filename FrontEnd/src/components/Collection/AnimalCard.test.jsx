import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AnimalCard } from './AnimalCard';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('lucide-react-native', () => ({
    Star: () => null,
    Wind: () => null,
    Droplets: () => null,
    Bug: () => null,
    PawPrint: () => null,
    Leaf: () => null,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockAnimal = {
    id: 1,
    name: 'Lion',
    type: 'mammifère',
    image: 'https://example.com/lion.jpg',
    rarity: 3,
    hp: 100,
    maxHp: 120,
    atk: 50,
    def: 40,
    spd: 60,
    category: 'fauna',
    plantLinkId: null,
};

const mockPlantAnimal = {
    id: 2,
    name: 'Fougère',
    type: 'plante',
    image: 'https://example.com/plant.jpg',
    rarity: 1,
    hp: 50,
    maxHp: 50,
    atk: 10,
    def: 20,
    spd: 5,
    category: 'flora',
    plantLinkId: null,
};

const mockFloraAnimal = {
    ...mockAnimal,
    id: 3,
    name: 'Cactus',
    type: 'fauna',
    category: 'flora',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AnimalCard', () => {
    describe('Rendu de base', () => {
        it('doit se rendre sans erreur', () => {
            expect(() =>
                render(<AnimalCard animal={mockAnimal} onPress={jest.fn()} />)
            ).not.toThrow();
        });

        it('doit afficher le nom de l\'animal', () => {
            render(<AnimalCard animal={mockAnimal} onPress={jest.fn()} />);
            expect(screen.getByText('Lion')).toBeTruthy();
        });

        it('doit afficher l\'image de l\'animal', () => {
            const { UNSAFE_getByType } = render(<AnimalCard animal={mockAnimal} onPress={jest.fn()} />);
            const { Image } = require('react-native');
            const image = UNSAFE_getByType(Image);
            expect(image.props.source.uri).toBe('https://example.com/lion.jpg');
        });
    });

    describe('Max HP', () => {
        it('doit afficher le label Max HP pour un animal non-plante', () => {
            render(<AnimalCard animal={mockAnimal} onPress={jest.fn()} />);
            expect(screen.getByText('Max HP')).toBeTruthy();
        });

        it('doit afficher la valeur de maxHp correcte', () => {
            render(<AnimalCard animal={mockAnimal} onPress={jest.fn()} />);
            expect(screen.getByText('120')).toBeTruthy();
        });

        it('ne doit pas afficher Max HP pour un animal de type plante', () => {
            render(<AnimalCard animal={mockPlantAnimal} onPress={jest.fn()} />);
            expect(screen.queryByText('Max HP')).toBeNull();
        });

        it('ne doit pas afficher Max HP pour un animal de catégorie flora', () => {
            render(<AnimalCard animal={mockFloraAnimal} onPress={jest.fn()} />);
            expect(screen.queryByText('Max HP')).toBeNull();
        });
    });

    describe('Types d\'animaux', () => {
        it('doit se rendre pour le type reptile', () => {
            expect(() =>
                render(<AnimalCard animal={{ ...mockAnimal, type: 'reptile' }} onPress={jest.fn()} />)
            ).not.toThrow();
        });

        it('doit se rendre pour le type poisson', () => {
            expect(() =>
                render(<AnimalCard animal={{ ...mockAnimal, type: 'poisson' }} onPress={jest.fn()} />)
            ).not.toThrow();
        });

        it('doit se rendre pour le type insecte', () => {
            expect(() =>
                render(<AnimalCard animal={{ ...mockAnimal, type: 'insecte' }} onPress={jest.fn()} />)
            ).not.toThrow();
        });

        it('doit se rendre pour le type oiseau', () => {
            expect(() =>
                render(<AnimalCard animal={{ ...mockAnimal, type: 'oiseau' }} onPress={jest.fn()} />)
            ).not.toThrow();
        });

        it('doit se rendre pour un type inconnu (fallback)', () => {
            expect(() =>
                render(<AnimalCard animal={{ ...mockAnimal, type: 'inconnu' }} onPress={jest.fn()} />)
            ).not.toThrow();
        });
    });

    describe('Navigation', () => {
        it('doit appeler onPress au clic sur la carte', () => {
            const onPress = jest.fn();
            render(<AnimalCard animal={mockAnimal} onPress={onPress} />);
            fireEvent.press(screen.getByText('Lion'));
            expect(onPress).toHaveBeenCalledTimes(1);
        });

        it('ne doit pas appeler onPress si non fourni', () => {
            expect(() => {
                render(<AnimalCard animal={mockAnimal} />);
                fireEvent.press(screen.getByText('Lion'));
            }).not.toThrow();
        });
    });

    describe('Largeur personnalisée', () => {
        it('doit accepter une cardWidth personnalisée', () => {
            expect(() =>
                render(<AnimalCard animal={mockAnimal} cardWidth={150} onPress={jest.fn()} />)
            ).not.toThrow();
        });
    });
});
