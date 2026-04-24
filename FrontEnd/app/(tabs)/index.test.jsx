import React from 'react';
import { render } from '@testing-library/react-native';
import HomePage from './index';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/features/index/IndexScreen', () => {
    const { View } = require('react-native');
    return function MockIndexScreen() {
        return <View testID="index-screen" />;
    };
});

jest.mock('@/assets/locales/fr.json', () => ({}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HomePage (index tab)', () => {
    it('doit se rendre sans erreur', () => {
        expect(() => render(<HomePage />)).not.toThrow();
    });

    it('doit afficher IndexScreen', () => {
        const { getByTestId } = render(<HomePage />);
        expect(getByTestId('index-screen')).toBeTruthy();
    });
});
