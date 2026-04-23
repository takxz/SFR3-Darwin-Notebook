import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfilePage from './profile';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
    useRouter: jest.fn(() => ({ replace: jest.fn() })),
}));

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn().mockResolvedValue(null),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Settings est rendu comme un Text cliquable : fireEvent.press sur lui
// remonte au Pressable parent et déclenche onPress={() => setShowSettings(true)}.
jest.mock('lucide-react-native', () => ({
    Settings: () => {
        const { Text } = require('react-native');
        return <Text testID="icon-settings">⚙</Text>;
    },
    Award: () => null,
    Camera: () => null,
}));

jest.mock('@/utils/auth', () => ({
    clearToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/hooks/useUser', () => ({
    useUser: jest.fn(),
}));

jest.mock('../../src/features/profil/modals/SettingsModal', () => ({
    SettingsModal: ({ visible, onClose, onLogout, onDeleteAccount }) => {
        const { View, Pressable, Text } = require('react-native');
        if (!visible) return null;
        return (
            <View testID="settings-modal">
                <Pressable testID="btn-logout" onPress={onLogout}>
                    <Text>Déconnexion</Text>
                </Pressable>
                <Pressable testID="btn-delete-account" onPress={onDeleteAccount}>
                    <Text>Supprimer le compte</Text>
                </Pressable>
                <Pressable testID="btn-close-settings" onPress={onClose}>
                    <Text>Fermer paramètres</Text>
                </Pressable>
            </View>
        );
    },
}));

jest.mock('../../src/features/profil/modals/DeleteConfirmModal', () => ({
    DeleteConfirmModal: ({ visible, onClose, onConfirm }) => {
        const { View, Pressable, Text } = require('react-native');
        if (!visible) return null;
        return (
            <View testID="delete-modal">
                <Pressable testID="btn-confirm-delete" onPress={onConfirm}>
                    <Text>Confirmer suppression</Text>
                </Pressable>
                <Pressable testID="btn-cancel-delete" onPress={onClose}>
                    <Text>Annuler suppression</Text>
                </Pressable>
            </View>
        );
    },
}));

jest.mock('../../src/features/profil/modals/DescriptionEditModal', () => ({
    DescriptionEditModal: ({ visible, onClose, onSave }) => {
        const { View, Pressable, Text } = require('react-native');
        if (!visible) return null;
        return (
            <View testID="description-modal">
                <Pressable testID="btn-save-desc" onPress={onSave}>
                    <Text>Enregistrer description</Text>
                </Pressable>
                <Pressable testID="btn-close-desc" onPress={onClose}>
                    <Text>Annuler description</Text>
                </Pressable>
            </View>
        );
    },
}));

jest.mock('../../src/features/profil/modals/profilStyles', () => ({
    styles: {},
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUser = {
    id: '1',
    pseudo: 'Remie',
    email: 'remie@test.com',
    player_level: 5,
    bio_token: 'https://via.placeholder.com/100',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setupUser(overrides = {}) {
    const { useUser } = require('@/hooks/useUser');
    useUser.mockReturnValue({ user: mockUser, loading: false, error: null, ...overrides });
}

async function openSettingsModal() {
    // fireEvent.press sur l'icône ⚙ remonte au Pressable parent qui ouvre le modal.
    fireEvent.press(screen.getByTestId('icon-settings'));
    await waitFor(() => screen.getByTestId('settings-modal'));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('ProfilePage', () => {
    describe('État de chargement', () => {
        it('doit afficher "Chargement..." pendant le chargement', () => {
            setupUser({ user: null, loading: true, error: null });
            render(<ProfilePage />);
            expect(screen.getByText('Chargement...')).toBeTruthy();
        });

        it('ne doit pas afficher le profil en cours de chargement', () => {
            setupUser({ user: null, loading: true, error: null });
            render(<ProfilePage />);
            expect(screen.queryByText('Remie')).toBeNull();
        });
    });

    describe('État d\'erreur', () => {
        it('doit afficher le message d\'erreur fourni', () => {
            setupUser({ user: null, loading: false, error: 'Erreur de connexion' });
            render(<ProfilePage />);
            expect(screen.getByText('Erreur de connexion')).toBeTruthy();
        });

        it('doit afficher le message par défaut si user est null sans erreur', () => {
            setupUser({ user: null, loading: false, error: null });
            render(<ProfilePage />);
            expect(screen.getByText('Erreur lors du chargement du profil.')).toBeTruthy();
        });

        it('doit afficher "Se reconnecter" si l\'erreur contient "token"', () => {
            setupUser({ user: null, loading: false, error: 'Token invalide' });
            render(<ProfilePage />);
            expect(screen.getByText('Se reconnecter')).toBeTruthy();
        });

        it('ne doit pas afficher "Se reconnecter" si l\'erreur ne contient pas "token"', () => {
            setupUser({ user: null, loading: false, error: 'Erreur réseau' });
            render(<ProfilePage />);
            expect(screen.queryByText('Se reconnecter')).toBeNull();
        });

        it('doit naviguer vers /login quand on presse "Se reconnecter"', () => {
            const { useRouter } = require('expo-router');
            const mockReplace = jest.fn();
            useRouter.mockReturnValue({ replace: mockReplace });
            setupUser({ user: null, loading: false, error: 'Token expiré' });

            render(<ProfilePage />);
            fireEvent.press(screen.getByText('Se reconnecter'));
            expect(mockReplace).toHaveBeenCalledWith('/login');
        });
    });

    describe('Profil chargé', () => {
        beforeEach(() => setupUser());

        it('doit se rendre sans erreur', () => {
            expect(() => render(<ProfilePage />)).not.toThrow();
        });

        it('doit afficher le pseudo', () => {
            render(<ProfilePage />);
            expect(screen.getByText('Remie')).toBeTruthy();
        });

        it('doit afficher l\'email si pseudo est absent', () => {
            const { useUser } = require('@/hooks/useUser');
            useUser.mockReturnValue({
                user: { ...mockUser, pseudo: null },
                loading: false,
                error: null,
            });
            render(<ProfilePage />);
            expect(screen.getByText('remie@test.com')).toBeTruthy();
        });

        it('doit afficher le niveau du joueur', () => {
            render(<ProfilePage />);
            expect(screen.getByText('5')).toBeTruthy();
        });

        it('doit afficher les labels de statistiques', () => {
            render(<ProfilePage />);
            expect(screen.getByText('Capturés')).toBeTruthy();
            expect(screen.getByText('Abonnés')).toBeTruthy();
            expect(screen.getByText('Abonnements')).toBeTruthy();
        });

        it('doit afficher les badges', () => {
            render(<ProfilePage />);
            expect(screen.getByText(/Expert/)).toBeTruthy();
            expect(screen.getByText(/Tireur/)).toBeTruthy();
        });

        it('doit afficher la description par défaut', () => {
            render(<ProfilePage />);
            expect(screen.getByText('Chasseur de la nature | Photographe animalier')).toBeTruthy();
        });

        it('doit afficher la description stockée dans SecureStore', async () => {
            const SecureStore = require('expo-secure-store');
            SecureStore.getItemAsync.mockResolvedValue('Ma description perso');
            render(<ProfilePage />);
            await waitFor(() => {
                expect(screen.getByText('Ma description perso')).toBeTruthy();
            });
        });

        it('doit afficher "Mes meilleures captures"', () => {
            render(<ProfilePage />);
            expect(screen.getByText('Mes meilleures captures')).toBeTruthy();
        });

        it('doit afficher le message "aucune capture"', () => {
            render(<ProfilePage />);
            expect(screen.getByText("Vous n'avez encore aucune capture.")).toBeTruthy();
        });

        it('doit afficher le bouton "Changer la description"', () => {
            render(<ProfilePage />);
            expect(screen.getByText('Changer la description')).toBeTruthy();
        });
    });

    describe('Modal paramètres', () => {
        beforeEach(() => setupUser());

        it('ne doit pas afficher le modal paramètres par défaut', () => {
            render(<ProfilePage />);
            expect(screen.queryByTestId('settings-modal')).toBeNull();
        });

        it('doit ouvrir le modal paramètres en pressant l\'icône ⚙', async () => {
            render(<ProfilePage />);
            await openSettingsModal();
            expect(screen.getByTestId('settings-modal')).toBeTruthy();
        });

        it('doit fermer le modal paramètres en pressant Fermer', async () => {
            render(<ProfilePage />);
            await openSettingsModal();
            fireEvent.press(screen.getByTestId('btn-close-settings'));
            await waitFor(() => {
                expect(screen.queryByTestId('settings-modal')).toBeNull();
            });
        });
    });

    describe('Déconnexion', () => {
        beforeEach(() => setupUser());

        it('doit appeler clearToken lors de la déconnexion', async () => {
            const { clearToken } = require('@/utils/auth');
            render(<ProfilePage />);
            await openSettingsModal();
            await act(async () => { fireEvent.press(screen.getByTestId('btn-logout')); });
            expect(clearToken).toHaveBeenCalledTimes(1);
        });

        it('doit rediriger vers /login après déconnexion', async () => {
            const { useRouter } = require('expo-router');
            const mockReplace = jest.fn();
            useRouter.mockReturnValue({ replace: mockReplace });

            render(<ProfilePage />);
            await openSettingsModal();
            await act(async () => { fireEvent.press(screen.getByTestId('btn-logout')); });

            await waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith('/login');
            });
        });
    });

    describe('Suppression du compte', () => {
        beforeEach(() => setupUser());

        it('doit ouvrir le modal de confirmation de suppression', async () => {
            render(<ProfilePage />);
            await openSettingsModal();
            fireEvent.press(screen.getByTestId('btn-delete-account'));
            await waitFor(() => {
                expect(screen.getByTestId('delete-modal')).toBeTruthy();
            });
        });

        it('doit fermer le modal de suppression quand on annule', async () => {
            render(<ProfilePage />);
            await openSettingsModal();
            fireEvent.press(screen.getByTestId('btn-delete-account'));
            await waitFor(() => screen.getByTestId('delete-modal'));
            fireEvent.press(screen.getByTestId('btn-cancel-delete'));
            await waitFor(() => {
                expect(screen.queryByTestId('delete-modal')).toBeNull();
            });
        });

        it('doit rediriger vers /login après confirmation de suppression', async () => {
            const { useRouter } = require('expo-router');
            const mockReplace = jest.fn();
            useRouter.mockReturnValue({ replace: mockReplace });

            render(<ProfilePage />);
            await openSettingsModal();
            fireEvent.press(screen.getByTestId('btn-delete-account'));
            await waitFor(() => screen.getByTestId('btn-confirm-delete'));
            fireEvent.press(screen.getByTestId('btn-confirm-delete'));

            await waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith('/login');
            });
        });
    });

    describe('Modal description', () => {
        beforeEach(() => setupUser());

        it('doit ouvrir le modal description en pressant "Changer la description"', () => {
            render(<ProfilePage />);
            fireEvent.press(screen.getByText('Changer la description'));
            expect(screen.getByTestId('description-modal')).toBeTruthy();
        });

        it('doit fermer le modal description en pressant Annuler', async () => {
            render(<ProfilePage />);
            fireEvent.press(screen.getByText('Changer la description'));
            await waitFor(() => screen.getByTestId('description-modal'));
            fireEvent.press(screen.getByTestId('btn-close-desc'));
            await waitFor(() => {
                expect(screen.queryByTestId('description-modal')).toBeNull();
            });
        });

        it('doit appeler SecureStore.setItemAsync lors de la sauvegarde', async () => {
            const SecureStore = require('expo-secure-store');
            render(<ProfilePage />);
            fireEvent.press(screen.getByText('Changer la description'));
            await waitFor(() => screen.getByTestId('description-modal'));
            await act(async () => { fireEvent.press(screen.getByTestId('btn-save-desc')); });

            await waitFor(() => {
                expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
                    `profileDescription_${mockUser.id}`,
                    expect.any(String)
                );
            });
        });

        it('doit afficher une alerte "Enregistré" après sauvegarde', async () => {
            render(<ProfilePage />);
            fireEvent.press(screen.getByText('Changer la description'));
            await waitFor(() => screen.getByTestId('description-modal'));
            await act(async () => { fireEvent.press(screen.getByTestId('btn-save-desc')); });

            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith(
                    'Enregistré',
                    'Votre description a été mise à jour.'
                );
            });
        });

        it('doit fermer le modal description après sauvegarde', async () => {
            render(<ProfilePage />);
            fireEvent.press(screen.getByText('Changer la description'));
            await waitFor(() => screen.getByTestId('description-modal'));
            await act(async () => { fireEvent.press(screen.getByTestId('btn-save-desc')); });

            await waitFor(() => {
                expect(screen.queryByTestId('description-modal')).toBeNull();
            });
        });
    });
});
