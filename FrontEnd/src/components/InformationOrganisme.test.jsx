import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import InformationOrganisme from './InformationOrganisme';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../assets/locales/fr.json', () => ({
    waitingScreen: {
        analyzing: 'Analyse en cours...',
        description: "Identification de l'organisme...",
    },
    informationAnimalScreen: {
        reject_button: 'Rejeter',
        accept_button: 'Ajouter à la Collection',
    },
}));

jest.mock('expo-constants', () => ({
    default: { expoConfig: { hostUri: 'localhost:8081' } },
}));

jest.mock('lucide-react-native', () => ({
    Activity: () => null,
    ScanLine: () => null,
    ChevronsUp: () => null,
    Heart: () => null,
    Shield: () => null,
    Sword: () => null,
}));

jest.mock('expo-linear-gradient', () => {
    const { View } = require('react-native');
    return { LinearGradient: ({ children, ...props }) => <View {...props}>{children}</View> };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockFetchSuccess(data) {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    });
}

function mockFetchError(message = 'Network request failed') {
    global.fetch = jest.fn().mockRejectedValue(new Error(message));
}

function mockFetchBadStatus(data = { message: 'Erreur API' }) {
    global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    });
}

const mockResult = {
    success: true,
    common_name: 'Lion',
    scientific_name: 'Panthera leo',
    image_url: 'https://example.com/lion.jpg',
    sharpness_rank: 'A',
    final_stats: { hp: 80, atk: 70, defense: 60, speed: 50 },
};

const mockPhoto = {
    uri: 'file:///photo.jpg',
    base64: 'abc123base64',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
});

afterEach(() => {
    jest.useRealTimers();
});

describe('InformationOrganisme', () => {
    describe('Sans photo', () => {
        it('ne doit rien rendre si photo est null', () => {
            const { toJSON } = render(
                <InformationOrganisme photo={null} onClose={jest.fn()} addToDex={jest.fn()} />
            );
            expect(toJSON()).toBeNull();
        });
    });

    describe('État de chargement', () => {
        it('doit afficher le WaitingComponent pendant le chargement', () => {
            mockFetchSuccess(mockResult);
            render(<InformationOrganisme photo={mockPhoto} onClose={jest.fn()} addToDex={jest.fn()} />);
            expect(screen.getByText('Analyse en cours...')).toBeTruthy();
        });

        it('ne doit pas afficher les boutons pendant le chargement', () => {
            mockFetchSuccess(mockResult);
            render(<InformationOrganisme photo={mockPhoto} onClose={jest.fn()} addToDex={jest.fn()} />);
            expect(screen.queryByText('Rejeter')).toBeNull();
            expect(screen.queryByText('Ajouter à la Collection')).toBeNull();
        });
    });

    describe('Chargement réussi', () => {
        it('doit afficher le nom commun après le chargement', async () => {
            mockFetchSuccess(mockResult);
            render(<InformationOrganisme photo={mockPhoto} onClose={jest.fn()} addToDex={jest.fn()} />);
            act(() => { jest.runAllTimers(); });
            await waitFor(() => expect(screen.getByText('Lion')).toBeTruthy(), { timeout: 5000 });
        });

        it('doit afficher le nom scientifique après le chargement', async () => {
            mockFetchSuccess(mockResult);
            render(<InformationOrganisme photo={mockPhoto} onClose={jest.fn()} addToDex={jest.fn()} />);
            act(() => { jest.runAllTimers(); });
            await waitFor(() => expect(screen.getByText('Panthera leo')).toBeTruthy(), { timeout: 5000 });
        });

        it('doit afficher le rang de netteté', async () => {
            mockFetchSuccess(mockResult);
            render(<InformationOrganisme photo={mockPhoto} onClose={jest.fn()} addToDex={jest.fn()} />);
            act(() => { jest.runAllTimers(); });
            await waitFor(() => expect(screen.getByText('A')).toBeTruthy(), { timeout: 5000 });
        });

        it('doit afficher les boutons Rejeter et Ajouter après le chargement', async () => {
            mockFetchSuccess(mockResult);
            render(<InformationOrganisme photo={mockPhoto} onClose={jest.fn()} addToDex={jest.fn()} />);
            act(() => { jest.runAllTimers(); });
            await waitFor(() => {
                expect(screen.getByText('Rejeter')).toBeTruthy();
                expect(screen.getByText('Ajouter à la Collection')).toBeTruthy();
            }, { timeout: 5000 });
        });
    });

    describe('Gestion des erreurs', () => {
        it('doit afficher un message d\'erreur réseau', async () => {
            mockFetchError('Network request failed');
            render(<InformationOrganisme photo={mockPhoto} onClose={jest.fn()} addToDex={jest.fn()} />);
            act(() => { jest.runAllTimers(); });
            await waitFor(() =>
                expect(screen.getByText(/Connexion API impossible/)).toBeTruthy(),
                { timeout: 5000 }
            );
        });

        it('doit afficher un message d\'erreur si base64 manquant', async () => {
            render(<InformationOrganisme photo={{ uri: 'file:///photo.jpg' }} onClose={jest.fn()} addToDex={jest.fn()} />);
            act(() => { jest.runAllTimers(); });
            await waitFor(() =>
                expect(screen.getByText('Image invalide')).toBeTruthy(),
                { timeout: 5000 }
            );
        });
    });

    describe('Boutons d\'action', () => {
        it('doit appeler onClose quand Rejeter est pressé', async () => {
            mockFetchSuccess(mockResult);
            const onClose = jest.fn();
            render(<InformationOrganisme photo={mockPhoto} onClose={onClose} addToDex={jest.fn()} />);
            act(() => { jest.runAllTimers(); });
            await waitFor(() => screen.getByText('Rejeter'), { timeout: 5000 });
            fireEvent.press(screen.getByText('Rejeter'));
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('doit appeler addToDex avec le résultat quand Ajouter est pressé', async () => {
            mockFetchSuccess(mockResult);
            const addToDex = jest.fn();
            render(<InformationOrganisme photo={mockPhoto} onClose={jest.fn()} addToDex={addToDex} />);
            act(() => { jest.runAllTimers(); });
            await waitFor(() => screen.getByText('Ajouter à la Collection'), { timeout: 5000 });
            fireEvent.press(screen.getByText('Ajouter à la Collection'));
            expect(addToDex).toHaveBeenCalledWith(expect.objectContaining({ common_name: 'Lion' }));
        });
    });
});
