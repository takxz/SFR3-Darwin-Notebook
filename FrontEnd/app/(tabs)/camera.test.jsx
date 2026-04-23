import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CameraScreen from './camera';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('expo-camera', () => {
    const { View } = require('react-native');
    return { CameraView: ({ children, ...props }) => <View {...props}>{children}</View> };
});

jest.mock('lucide-react-native', () => ({ Aperture: () => null }));

jest.mock('expo-location', () => ({
    requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getCurrentPositionAsync: jest.fn().mockResolvedValue({
        coords: { latitude: 48.85, longitude: 2.35 },
    }),
    Accuracy: { Balanced: 3 },
}));

jest.mock('expo-constants', () => ({
    default: { expoConfig: { hostUri: 'localhost:8081' } },
}));

jest.mock('../../src/assets/locales/fr.json', () => ({
    cameraScreen: {
        ask_permission_desc: 'Autoriser la caméra',
        button_permission_desc: 'Accorder la permission',
    },
}));

jest.mock('../../src/utils/auth.js', () => ({
    getToken: jest.fn(),
}));

jest.mock('../../src/hooks/useCamera.jsx', () => ({
    useCamera: jest.fn(),
}));

// InformationOrganisme est mocké pour toujours exposer le bouton addToDex,
// afin de tester la logique de CameraScreen sans déclencher de capture photo.
jest.mock('../../src/components/InformationOrganisme.jsx', () => {
    const { View, Pressable, Text } = require('react-native');
    return function MockInformationOrganisme({ addToDex, onClose }) {
        return (
            <View>
                <Pressable
                    testID="btn-add-to-dex"
                    onPress={() => addToDex({
                        common_name: 'Lion',
                        sharpness_score: 90,
                        final_stats: { atk: 70, defense: 60, hp: 80, speed: 50 },
                        image_url: 'http://img.jpg',
                    })}
                >
                    <Text>Ajouter</Text>
                </Pressable>
                <Pressable testID="btn-close" onPress={onClose}>
                    <Text>Fermer</Text>
                </Pressable>
            </View>
        );
    };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockTakePicture = jest.fn();
const mockRequestPermission = jest.fn();

function setupPermission(granted) {
    const { useCamera } = require('../../src/hooks/useCamera.jsx');
    useCamera.mockReturnValue({
        permission: granted === null ? null : { granted },
        requestPermission: mockRequestPermission,
        cameraRef: { current: null },
        takePicture: mockTakePicture,
    });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('CameraScreen', () => {
    describe('Permission caméra', () => {
        it('doit se rendre sans erreur si permission est null', () => {
            setupPermission(null);
            expect(() => render(<CameraScreen />)).not.toThrow();
        });

        it('doit afficher la demande de permission si permission.granted est false', () => {
            setupPermission(false);
            render(<CameraScreen />);
            expect(screen.getByText('Autoriser la caméra')).toBeTruthy();
            expect(screen.getByText('Accorder la permission')).toBeTruthy();
        });

        it('doit appeler requestPermission quand on presse le bouton de permission', () => {
            setupPermission(false);
            render(<CameraScreen />);
            fireEvent.press(screen.getByText('Accorder la permission'));
            expect(mockRequestPermission).toHaveBeenCalledTimes(1);
        });

        it('ne doit pas afficher la vue de permission si permission.granted est true', () => {
            setupPermission(true);
            render(<CameraScreen />);
            expect(screen.queryByText('Autoriser la caméra')).toBeNull();
        });

        it('doit se rendre sans erreur avec permission accordée', () => {
            setupPermission(true);
            expect(() => render(<CameraScreen />)).not.toThrow();
        });
    });

    describe('addToDex — succès', () => {
        it('doit appeler l\'API avec le bon token', async () => {
            setupPermission(true);
            const { getToken } = require('../../src/utils/auth.js');
            getToken.mockResolvedValue('valid-token');
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({}),
            });

            render(<CameraScreen />);
            await act(async () => {
                fireEvent.press(screen.getByTestId('btn-add-to-dex'));
            });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/user/creatures/add'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({ Authorization: 'Bearer valid-token' }),
                })
            );
        });

        it('doit afficher une alerte de succès après ajout réussi', async () => {
            setupPermission(true);
            const { getToken } = require('../../src/utils/auth.js');
            getToken.mockResolvedValue('valid-token');
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({}),
            });

            render(<CameraScreen />);
            await act(async () => {
                fireEvent.press(screen.getByTestId('btn-add-to-dex'));
            });

            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Créature ajoutée avec succès.');
            });
        });
    });

    describe('addToDex — erreurs', () => {
        it('doit afficher une alerte si le token est manquant', async () => {
            setupPermission(true);
            const { getToken } = require('../../src/utils/auth.js');
            getToken.mockResolvedValue(null);

            render(<CameraScreen />);
            await act(async () => {
                fireEvent.press(screen.getByTestId('btn-add-to-dex'));
            });

            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith(
                    'Erreur',
                    expect.stringContaining('Token')
                );
            });
        });

        it('doit afficher une alerte d\'erreur si l\'API renvoie une erreur', async () => {
            setupPermission(true);
            const { getToken } = require('../../src/utils/auth.js');
            getToken.mockResolvedValue('valid-token');
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                json: jest.fn().mockResolvedValue({ message: 'Quota dépassé' }),
            });

            render(<CameraScreen />);
            await act(async () => {
                fireEvent.press(screen.getByTestId('btn-add-to-dex'));
            });

            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Quota dépassé');
            });
        });

        it('doit afficher une alerte d\'erreur réseau si fetch échoue', async () => {
            setupPermission(true);
            const { getToken } = require('../../src/utils/auth.js');
            getToken.mockResolvedValue('valid-token');
            global.fetch = jest.fn().mockRejectedValue(new Error('Network down'));

            render(<CameraScreen />);
            await act(async () => {
                fireEvent.press(screen.getByTestId('btn-add-to-dex'));
            });

            await waitFor(() => {
                expect(Alert.alert).toHaveBeenCalledWith(
                    'Erreur',
                    expect.stringContaining('réseau')
                );
            });
        });
    });

    describe('onClose (fermer InformationOrganisme)', () => {
        it('doit se rendre sans erreur quand on ferme l\'overlay', () => {
            setupPermission(true);
            render(<CameraScreen />);
            expect(() => fireEvent.press(screen.getByTestId('btn-close'))).not.toThrow();
        });
    });
});
