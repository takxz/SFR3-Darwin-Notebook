import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import TabLayout from './_layout';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => {
    const { View } = require('react-native');
    const MockTabs = ({ children }) => <View testID="tabs-root">{children}</View>;
    MockTabs.Screen = () => null;
    return {
        Tabs: MockTabs,
        useRouter: jest.fn(),
    };
});

jest.mock('lucide-react-native', () => ({
    Home: () => null,
    Sword: () => null,
    User: () => null,
    Library: () => null,
    Camera: () => null,
}));

jest.mock('@/assets/locales/fr.json', () => ({
    navigationBar: {
        home: 'Accueil',
        collection: 'Collection',
        camera: 'Caméra',
        fight: 'Combat',
        profile: 'Profil',
    },
}));

jest.mock('@/utils/auth', () => ({
    getToken: jest.fn(),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
});

describe('TabLayout (_layout)', () => {
    describe('Authentification', () => {
        it('doit rediriger vers /login si pas de token', async () => {
            const { getToken } = require('@/utils/auth');
            const { useRouter } = require('expo-router');
            const mockReplace = jest.fn();
            getToken.mockResolvedValue(null);
            useRouter.mockReturnValue({ replace: mockReplace });

            render(<TabLayout />);

            await waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith('/login');
            });
        });

        it('doit afficher null pendant la vérification du token', () => {
            const { getToken } = require('@/utils/auth');
            const { useRouter } = require('expo-router');
            getToken.mockReturnValue(new Promise(() => {}));
            useRouter.mockReturnValue({ replace: jest.fn() });

            const { toJSON } = render(<TabLayout />);
            expect(toJSON()).toBeNull();
        });

        it('doit afficher les onglets quand le token est valide', async () => {
            const { getToken } = require('@/utils/auth');
            const { useRouter } = require('expo-router');
            getToken.mockResolvedValue('valid-token');
            useRouter.mockReturnValue({ replace: jest.fn() });

            const { getByTestId } = render(<TabLayout />);

            await waitFor(() => {
                expect(getByTestId('tabs-root')).toBeTruthy();
            });
        });

        it('ne doit pas appeler router.replace si le token existe', async () => {
            const { getToken } = require('@/utils/auth');
            const { useRouter } = require('expo-router');
            const mockReplace = jest.fn();
            getToken.mockResolvedValue('valid-token');
            useRouter.mockReturnValue({ replace: mockReplace });

            render(<TabLayout />);

            await waitFor(() => {
                expect(mockReplace).not.toHaveBeenCalled();
            });
        });
    });
});
