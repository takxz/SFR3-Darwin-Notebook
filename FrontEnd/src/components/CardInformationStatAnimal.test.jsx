import React from 'react';
import { render, screen } from '@testing-library/react-native';
import CardInformationStatAnimal from './CardInformationStatAnimal';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('lucide-react-native', () => ({
    Activity: () => null,
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CardInformationStatAnimal', () => {
    describe('Rendu de base', () => {
        it('doit se rendre sans erreur', () => {
            expect(() =>
                render(<CardInformationStatAnimal title="PV" stat={75} />)
            ).not.toThrow();
        });

        it('doit afficher le titre en majuscules', () => {
            render(<CardInformationStatAnimal title="pv" stat={50} />);
            expect(screen.getByText('PV')).toBeTruthy();
        });

        it('doit afficher la valeur de la stat', () => {
            render(<CardInformationStatAnimal title="ATT" stat={42} />);
            expect(screen.getByText('42')).toBeTruthy();
        });
    });

    describe('Valeur affichée (boundedValue)', () => {
        it('doit afficher la valeur normale entre 0 et 100', () => {
            render(<CardInformationStatAnimal title="DEF" stat={60} />);
            expect(screen.getByText('60')).toBeTruthy();
        });

        it('doit plafonner la valeur à 100 si stat > 100', () => {
            render(<CardInformationStatAnimal title="DEF" stat={150} />);
            expect(screen.getByText('100')).toBeTruthy();
        });

        it('doit afficher 0 si stat est négatif', () => {
            render(<CardInformationStatAnimal title="VIT" stat={-10} />);
            expect(screen.getByText('0')).toBeTruthy();
        });

        it('doit afficher 0 si stat est absent', () => {
            render(<CardInformationStatAnimal title="VIT" />);
            expect(screen.getByText('0')).toBeTruthy();
        });

        it('doit utiliser value si fourni à la place de stat', () => {
            render(<CardInformationStatAnimal title="PV" stat={10} value={55} />);
            expect(screen.getByText('55')).toBeTruthy();
        });
    });

    describe('Icône', () => {
        it('doit se rendre avec une icône personnalisée', () => {
            const CustomIcon = () => null;
            expect(() =>
                render(<CardInformationStatAnimal title="PV" stat={50} icon={<CustomIcon />} />)
            ).not.toThrow();
        });

        it('doit utiliser l\'icône Activity par défaut si aucune icône n\'est fournie', () => {
            expect(() =>
                render(<CardInformationStatAnimal title="PV" stat={50} />)
            ).not.toThrow();
        });
    });

    describe('Couleur', () => {
        it('doit utiliser la couleur par défaut #B61E34 si non fournie', () => {
            const { UNSAFE_getAllByType } = render(<CardInformationStatAnimal title="PV" stat={50} />);
            const { Text } = require('react-native');
            const texts = UNSAFE_getAllByType(Text);
            const valueText = texts.find(t => {
                const styleArray = Array.isArray(t.props.style) ? t.props.style : [t.props.style];
                return styleArray.some(s => s && s.color === '#B61E34');
            });
            expect(valueText).toBeTruthy();
        });

        it('doit accepter une couleur personnalisée sans erreur', () => {
            expect(() =>
                render(<CardInformationStatAnimal title="ATT" stat={50} color="#e3902b" />)
            ).not.toThrow();
        });
    });
});
