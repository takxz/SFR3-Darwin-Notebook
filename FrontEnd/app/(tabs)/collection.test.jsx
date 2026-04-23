import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react-native';
import CollectionPage from './collection';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => {
    const React = require('react');
    return {
        useRouter: jest.fn(() => ({ push: jest.fn() })),
        // useFocusEffect via useEffect pour ne s'exécuter qu'une seule fois (au montage),
        // évitant la boucle infinie causée par une invocation à chaque re-render.
        useFocusEffect: (cb) => React.useEffect(() => { cb(); }, []),
    };
});

jest.mock('expo-constants', () => ({
    default: { expoConfig: { hostUri: 'localhost:8081' } },
}));

jest.mock('@/assets/locales/fr.json', () => ({
    emptyCollectionScreen: { text: 'Votre collection est vide.' },
}));

jest.mock('../../src/utils/auth.js', () => ({
    getToken: jest.fn(),
}));

jest.mock('../../src/components/Collection/AnimalCard', () => {
    const { Pressable, Text } = require('react-native');
    return {
        AnimalCard: ({ animal, onPress }) => (
            <Pressable testID={`card-${animal.id}`} onPress={onPress}>
                <Text>{animal.name}</Text>
            </Pressable>
        ),
    };
});

jest.mock('../../src/components/Collection/SpeciesFilterBar', () => {
    const { View, Pressable, Text } = require('react-native');
    return {
        SpeciesFilterBar: ({ options, onSelect }) => (
            <View>
                {options.map((opt) => (
                    <Pressable key={opt.key} testID={`filter-${opt.key}`} onPress={() => onSelect(opt.key)}>
                        <Text>{opt.label}</Text>
                    </Pressable>
                ))}
            </View>
        ),
    };
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockProfileResponse = { id: '42', pseudo: 'Remie' };

const mockCreatureRaw = {
    id: '1',
    gamification_name: 'Lion',
    species_type: 'mammifère',
    stat_pv: 80,
    stat_atq: 70,
    stat_def: 60,
    stat_speed: 50,
    scan_url: 'http://img.jpg',
    species_rarity: 'rare',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeOkResponse(data) {
    return {
        ok: true,
        status: 200,
        statusText: 'OK',
        text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    };
}

function makeErrorResponse(data = { message: 'Erreur' }) {
    return {
        ok: false,
        status: 500,
        statusText: 'Server Error',
        text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    };
}

function mockFetchSequence(...responses) {
    let callIndex = 0;
    global.fetch = jest.fn().mockImplementation(() => {
        const resp = responses[Math.min(callIndex, responses.length - 1)];
        callIndex++;
        return Promise.resolve(resp);
    });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
    const { getToken } = require('../../src/utils/auth.js');
    getToken.mockResolvedValue('valid-token');
});

describe('CollectionPage', () => {
    describe('État de chargement', () => {
        it('doit afficher un indicateur de chargement initialement', () => {
            global.fetch = jest.fn().mockReturnValue(new Promise(() => {}));
            render(<CollectionPage />);
            const { ActivityIndicator } = require('react-native');
            expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
        });
    });

    describe('Erreurs', () => {
        it('doit afficher un message d\'erreur si le token est manquant', async () => {
            const { getToken } = require('../../src/utils/auth.js');
            getToken.mockResolvedValue(null);
            global.fetch = jest.fn();

            render(<CollectionPage />);

            await waitFor(() => {
                expect(screen.getByText(/Token utilisateur manquant/)).toBeTruthy();
            }, { timeout: 5000 });
        });

        it('doit afficher un message d\'erreur si l\'API profil échoue', async () => {
            mockFetchSequence(makeErrorResponse({ message: 'Profil introuvable' }));

            render(<CollectionPage />);

            await waitFor(() => {
                expect(screen.getByText('Profil introuvable')).toBeTruthy();
            }, { timeout: 5000 });
        });

        it('doit afficher un message d\'erreur si l\'API créatures échoue', async () => {
            mockFetchSequence(
                makeOkResponse(mockProfileResponse),
                makeErrorResponse({ message: 'Erreur creatures' })
            );

            render(<CollectionPage />);

            await waitFor(() => {
                expect(screen.getByText('Erreur creatures')).toBeTruthy();
            }, { timeout: 5000 });
        });
    });

    describe('Collection vide', () => {
        it('doit afficher le filtre après chargement d\'une collection vide', async () => {
            mockFetchSequence(
                makeOkResponse(mockProfileResponse),
                makeOkResponse([])
            );

            render(<CollectionPage />);

            // Le SpeciesFilterBar n'est rendu que quand isLoading=false et pas d'erreur,
            // ce qui confirme que le chargement est terminé sans erreur.
            await waitFor(() => {
                expect(screen.getByText('Tous')).toBeTruthy();
            }, { timeout: 5000 });

            // Aucune carte créature ne doit être présente
            expect(screen.queryByTestId('card-1')).toBeNull();
        });
    });

    describe('Affichage des créatures', () => {
        it('doit afficher le nom d\'une créature après chargement', async () => {
            mockFetchSequence(
                makeOkResponse(mockProfileResponse),
                makeOkResponse([mockCreatureRaw])
            );

            render(<CollectionPage />);

            await waitFor(() => {
                expect(screen.getByText('Lion')).toBeTruthy();
            }, { timeout: 5000 });
        });

        it('doit afficher plusieurs créatures', async () => {
            const creatures = [
                { ...mockCreatureRaw, id: '1', gamification_name: 'Lion' },
                { ...mockCreatureRaw, id: '2', gamification_name: 'Tigre' },
            ];
            mockFetchSequence(
                makeOkResponse(mockProfileResponse),
                makeOkResponse(creatures)
            );

            render(<CollectionPage />);

            await waitFor(() => {
                expect(screen.getByText('Lion')).toBeTruthy();
                expect(screen.getByText('Tigre')).toBeTruthy();
            }, { timeout: 5000 });
        });
    });

    describe('Filtres', () => {
        it('doit afficher les options de filtre', async () => {
            mockFetchSequence(
                makeOkResponse(mockProfileResponse),
                makeOkResponse([])
            );

            render(<CollectionPage />);

            await waitFor(() => {
                expect(screen.getByText('Tous')).toBeTruthy();
                expect(screen.getByText('Faune')).toBeTruthy();
                expect(screen.getByText('Flore')).toBeTruthy();
            }, { timeout: 5000 });
        });

        it('doit filtrer pour n\'afficher que les créatures fauna', async () => {
            const creatures = [
                { ...mockCreatureRaw, id: '1', gamification_name: 'Lion', species_type: 'mammifère' },
                { id: '2', gamification_name: 'Fougère', species_type: 'plante', stat_pv: 30 },
            ];
            mockFetchSequence(
                makeOkResponse(mockProfileResponse),
                makeOkResponse(creatures)
            );

            render(<CollectionPage />);

            await waitFor(() => {
                expect(screen.getByText('Lion')).toBeTruthy();
                expect(screen.getByText('Fougère')).toBeTruthy();
            }, { timeout: 5000 });

            act(() => { fireEvent.press(screen.getByTestId('filter-fauna')); });

            await waitFor(() => {
                expect(screen.getByText('Lion')).toBeTruthy();
                expect(screen.queryByText('Fougère')).toBeNull();
            }, { timeout: 5000 });
        });

        it('doit filtrer pour n\'afficher que les créatures flora', async () => {
            const creatures = [
                { ...mockCreatureRaw, id: '1', gamification_name: 'Lion', species_type: 'mammifère' },
                { id: '2', gamification_name: 'Fougère', species_type: 'plante', stat_pv: 30 },
            ];
            mockFetchSequence(
                makeOkResponse(mockProfileResponse),
                makeOkResponse(creatures)
            );

            render(<CollectionPage />);

            await waitFor(() => screen.getByText('Lion'), { timeout: 5000 });

            act(() => { fireEvent.press(screen.getByTestId('filter-flora')); });

            await waitFor(() => {
                expect(screen.queryByText('Lion')).toBeNull();
                expect(screen.getByText('Fougère')).toBeTruthy();
            }, { timeout: 5000 });
        });
    });

    describe('Navigation', () => {
        it('doit naviguer vers le détail d\'une créature au clic', async () => {
            const { useRouter } = require('expo-router');
            const mockPush = jest.fn();
            useRouter.mockReturnValue({ push: mockPush });

            mockFetchSequence(
                makeOkResponse(mockProfileResponse),
                makeOkResponse([mockCreatureRaw])
            );

            render(<CollectionPage />);

            await waitFor(() => screen.getByTestId('card-1'), { timeout: 5000 });
            fireEvent.press(screen.getByTestId('card-1'));

            expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({
                pathname: '/creature/[id]',
                params: expect.objectContaining({ id: '1' }),
            }));
        });
    });
});
