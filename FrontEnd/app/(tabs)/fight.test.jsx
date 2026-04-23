import React from 'react';
import { render } from '@testing-library/react-native';
import FightRoute from './fight';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/features/fight/FightScreen', () => {
    const { View } = require('react-native');
    return function MockFightScreen() {
        return <View testID="fight-screen" />;
    };
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FightRoute (fight tab)', () => {
    it('doit se rendre sans erreur', () => {
        expect(() => render(<FightRoute />)).not.toThrow();
    });

    it('doit afficher FightScreen', () => {
        const { getByTestId } = render(<FightRoute />);
        expect(getByTestId('fight-screen')).toBeTruthy();
    });
});
