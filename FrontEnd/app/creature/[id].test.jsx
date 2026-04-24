import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import CreatureDetailsPage, { fetchPlants } from './[id]';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
    Stack: { Screen: () => null },
    useLocalSearchParams: jest.fn(),
    useRouter: jest.fn(() => ({ back: jest.fn() })),
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-constants', () => ({
    default: { expoConfig: { hostUri: 'localhost:8081' } },
}));

// X est rendu avec un testID pour pouvoir le presser (remonte au Pressable parent).
jest.mock('lucide-react-native', () => {
    const { View } = require('react-native');
    return {
        ArrowLeft: () => null,
        Heart: () => null,
        Leaf: () => null,
        Scale: () => null,
        Shield: () => null,
        Star: () => null,
        Timer: () => null,
        Zap: () => null,
        X: () => <View testID="icon-x" />,
    };
});

jest.mock('../../src/utils/auth', () => ({
    getToken: jest.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockFaunaAnimal = {
    id: '1',
    name: 'Lion',
    scientificName: 'Panthera leo',
    image: 'http://img.jpg',
    type: 'mammifère',
    category: 'fauna',
    rarity: 3,
    hp: 80,
    maxHp: 80,
    atk: 70,
    def: 60,
    spd: 50,
    weight: '190',
    lifespan: '15',
    plantLinkId: null,
};

const mockFloraAnimal = {
    id: '2',
    name: 'Fougère',
    scientificName: 'Dryopteris filix-mas',
    image: 'http://fougere.jpg',
    type: 'plante',
    category: 'flora',
    rarity: 2,
    hp: 10,
    maxHp: 10,
    atk: 5,
    def: 8,
    spd: 2,
    plantLinkId: null,
};

const mockPlant = {
    id: 'p1',
    name: 'Ortie',
    scientificName: 'Urtica dioica',
    hp: 10,
    atk: 5,
    def: 3,
    spd: 2,
    effects: [],
};

const mockPlant2 = {
    id: 'p2',
    name: 'Menthe',
    scientificName: 'Mentha spicata',
    hp: 5,
    atk: 3,
    def: 2,
    spd: 4,
    effects: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setupAnimal(animal) {
    const { useLocalSearchParams } = require('expo-router');
    useLocalSearchParams.mockReturnValue({
        id: String(animal.id),
        animal: encodeURIComponent(JSON.stringify(animal)),
    });
}

function makeOkResponse(data) {
    return Promise.resolve({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    });
}

function setupFetch({ plants = [], creatureDetails = null, profileId = '42' } = {}) {
    const details = creatureDetails ?? {
        stat_pv: mockFaunaAnimal.hp,
        stat_atq: mockFaunaAnimal.atk,
        stat_def: mockFaunaAnimal.def,
        stat_speed: mockFaunaAnimal.spd,
        weight: mockFaunaAnimal.weight,
        lifespan: mockFaunaAnimal.lifespan,
        plantLinkId: null,
        plant_link_id: null,
    };

    global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('/unlink_plant') || url.includes('/link_plant')) {
            return makeOkResponse({ success: true });
        }
        if (url.includes('/plants')) return makeOkResponse(plants);
        if (url.includes('/creatures/')) return makeOkResponse(details);
        if (url.includes('/profile')) return makeOkResponse({ id: profileId });
        return makeOkResponse({});
    });
}

// Rend le composant et draine immédiatement toutes les Promises pendantes
// (setPlants, setRemoteMeasures) pour que les mises à jour d'état se produisent
// dans le scope act — évitant les avertissements "not wrapped in act".
async function renderAndFlush(ui) {
    const result = render(ui);
    await act(async () => {});
    return result;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
    const { getToken } = require('../../src/utils/auth');
    getToken.mockResolvedValue('valid-token');
});

// ─── CreatureDetailsPage ──────────────────────────────────────────────────────

describe('CreatureDetailsPage', () => {
    describe('Rendu de base', () => {
        beforeEach(() => {
            setupAnimal(mockFaunaAnimal);
            setupFetch();
        });

        it('doit se rendre sans erreur', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
        });

        it('doit afficher le nom de la créature', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.getByText('Lion')).toBeTruthy();
        });

        it('doit afficher le bouton "Retour à la Collection"', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.getByText('Retour à la Collection')).toBeTruthy();
        });

        it('doit afficher la section rareté', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.getByText('Niveau de rarete')).toBeTruthy();
        });

        it('doit afficher la valeur de rareté', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.getByText('3')).toBeTruthy();
        });

        it('doit afficher "/ 5"', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.getByText('/ 5')).toBeTruthy();
        });
    });

    describe('Navigation', () => {
        it('doit appeler router.back() quand on presse "Retour à la Collection"', async () => {
            const { useRouter } = require('expo-router');
            const mockBack = jest.fn();
            useRouter.mockReturnValue({ back: mockBack });
            setupAnimal(mockFaunaAnimal);
            setupFetch();

            await renderAndFlush(<CreatureDetailsPage />);
            fireEvent.press(screen.getByText('Retour à la Collection'));

            expect(mockBack).toHaveBeenCalledTimes(1);
        });
    });

    describe('Animal (fauna)', () => {
        beforeEach(() => {
            setupAnimal(mockFaunaAnimal);
            setupFetch();
        });

        it('doit afficher le label "Poids"', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.getByText('Poids')).toBeTruthy();
        });

        it('doit afficher le label "Esperance de vie"', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.getByText('Esperance de vie')).toBeTruthy();
        });

        it('doit afficher la section "Statistiques de combat"', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.getByText('Statistiques de combat')).toBeTruthy();
        });

        it('ne doit pas afficher "Statistiques octroyées"', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.queryByText('Statistiques octroyées')).toBeNull();
        });

        it('doit afficher les 4 labels de stats (PV, ATQ, DEF, VIT)', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.getByText('PV')).toBeTruthy();
            expect(screen.getByText('ATQ')).toBeTruthy();
            expect(screen.getByText('DEF')).toBeTruthy();
            expect(screen.getByText('VIT')).toBeTruthy();
        });

        it('doit afficher les valeurs de stats', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.getByText('80')).toBeTruthy(); // hp
            expect(screen.getByText('70')).toBeTruthy(); // atk
            expect(screen.getByText('60')).toBeTruthy(); // def
            expect(screen.getByText('50')).toBeTruthy(); // spd
        });
    });

    describe('Plante (flora)', () => {
        beforeEach(() => {
            setupAnimal(mockFloraAnimal);
            setupFetch({
                creatureDetails: {
                    stat_pv: mockFloraAnimal.hp,
                    stat_atq: mockFloraAnimal.atk,
                    stat_def: mockFloraAnimal.def,
                    stat_speed: mockFloraAnimal.spd,
                    plantLinkId: null,
                    plant_link_id: null,
                },
            });
        });

        it('doit se rendre sans erreur', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
        });

        it('doit afficher le nom de la plante', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.getByText('Fougère')).toBeTruthy();
        });

        it('ne doit pas afficher "Poids"', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.queryByText('Poids')).toBeNull();
        });

        it('ne doit pas afficher "Esperance de vie"', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.queryByText('Esperance de vie')).toBeNull();
        });

        it('doit afficher "Statistiques octroyées"', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.getByText('Statistiques octroyées')).toBeTruthy();
        });

        it('ne doit pas afficher "Statistiques de combat"', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.queryByText('Statistiques de combat')).toBeNull();
        });

        it('doit afficher les stats avec le préfixe "+"', async () => {
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.getByText('+10')).toBeTruthy(); // hp
            expect(screen.getByText('+5')).toBeTruthy();  // atk
        });
    });

    describe('Sélecteur de plante (fauna)', () => {
        it('ne doit pas afficher de lien végétal si aucune plante disponible', async () => {
            setupAnimal(mockFaunaAnimal);
            setupFetch({ plants: [] });
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.queryByText('Lien vegetal')).toBeNull();
        });

        it('doit afficher "Choisir un vegetal" quand des plantes sont disponibles', async () => {
            setupAnimal(mockFaunaAnimal);
            setupFetch({ plants: [mockPlant] });
            render(<CreatureDetailsPage />);

            await waitFor(() => {
                expect(screen.getByText('Choisir un vegetal')).toBeTruthy();
            }, { timeout: 5000 });
        });

        it('doit afficher "Lien vegetal" dans le label du sélecteur', async () => {
            setupAnimal(mockFaunaAnimal);
            setupFetch({ plants: [mockPlant] });
            render(<CreatureDetailsPage />);

            await waitFor(() => {
                expect(screen.getByText('Lien vegetal')).toBeTruthy();
            }, { timeout: 5000 });
        });

        it('doit ouvrir le picker quand on presse sur le card', async () => {
            setupAnimal(mockFaunaAnimal);
            setupFetch({ plants: [mockPlant] });
            render(<CreatureDetailsPage />);

            await waitFor(() => screen.getByText('Choisir un vegetal'), { timeout: 5000 });
            fireEvent.press(screen.getByText('Choisir un vegetal'));

            await waitFor(() => {
                expect(screen.getByText('Ortie')).toBeTruthy();
            }, { timeout: 5000 });
        });

        it('doit afficher toutes les plantes disponibles dans le picker', async () => {
            setupAnimal(mockFaunaAnimal);
            setupFetch({ plants: [mockPlant, mockPlant2] });
            render(<CreatureDetailsPage />);

            await waitFor(() => screen.getByText('Choisir un vegetal'), { timeout: 5000 });
            fireEvent.press(screen.getByText('Choisir un vegetal'));

            await waitFor(() => {
                expect(screen.getByText('Ortie')).toBeTruthy();
                expect(screen.getByText('Menthe')).toBeTruthy();
            }, { timeout: 5000 });
        });

        it('doit appeler l\'API link_plant quand on sélectionne une plante', async () => {
            setupAnimal(mockFaunaAnimal);
            setupFetch({ plants: [mockPlant] });
            render(<CreatureDetailsPage />);

            await waitFor(() => screen.getByText('Choisir un vegetal'), { timeout: 5000 });
            fireEvent.press(screen.getByText('Choisir un vegetal'));
            await waitFor(() => screen.getByText('Ortie'), { timeout: 5000 });

            await act(async () => {
                fireEvent.press(screen.getByText('Ortie'));
            });

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/link_plant'),
                    expect.any(Object)
                );
            }, { timeout: 5000 });
        });

        it('ne doit pas afficher le sélecteur pour une plante (flora)', async () => {
            setupAnimal(mockFloraAnimal);
            setupFetch({ plants: [mockPlant] });
            await renderAndFlush(<CreatureDetailsPage />);
            expect(screen.queryByText('Choisir un vegetal')).toBeNull();
        });
    });

    describe('Plante liée', () => {
        const animalWithPlant = { ...mockFaunaAnimal, id: '1', plantLinkId: 'p1' };

        it('doit afficher le nom de la plante liée', async () => {
            setupAnimal(animalWithPlant);
            setupFetch({ plants: [mockPlant] });
            render(<CreatureDetailsPage />);

            await waitFor(() => {
                expect(screen.getByText('Ortie')).toBeTruthy();
            }, { timeout: 5000 });
        });

        it('doit afficher le bouton de suppression de la plante', async () => {
            setupAnimal(animalWithPlant);
            setupFetch({ plants: [mockPlant] });
            render(<CreatureDetailsPage />);

            await waitFor(() => screen.getByTestId('icon-x'), { timeout: 5000 });
            expect(screen.getByTestId('icon-x')).toBeTruthy();
        });

        it('doit appeler l\'API unlink_plant quand on retire la plante', async () => {
            setupAnimal(animalWithPlant);
            setupFetch({ plants: [mockPlant] });
            render(<CreatureDetailsPage />);

            await waitFor(() => screen.getByTestId('icon-x'), { timeout: 5000 });

            // Le bouton remove appelle e.stopPropagation() — on doit le fournir dans l'event.
            await act(async () => {
                fireEvent.press(screen.getByTestId('icon-x'), { stopPropagation: jest.fn() });
            });

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/unlink_plant'),
                    expect.any(Object)
                );
            }, { timeout: 5000 });
        });
    });
});

// ─── fetchPlants (export nommé) ───────────────────────────────────────────────

describe('fetchPlants', () => {
    beforeEach(() => jest.clearAllMocks());

    it('doit lancer une erreur si le token est manquant', async () => {
        const { getToken } = require('../../src/utils/auth');
        getToken.mockResolvedValue(null);

        await expect(fetchPlants()).rejects.toThrow('Token utilisateur manquant.');
    });

    it('doit retourner les plantes normalisées', async () => {
        const { getToken } = require('../../src/utils/auth');
        getToken.mockResolvedValue('valid-token');

        const rawPlant = {
            id: 'p1',
            gamification_name: 'Ortie',
            species_name: 'Urtica dioica',
            stat_pv: 10,
            stat_atq: 5,
            stat_def: 3,
            stat_speed: 2,
            species_rarity: 2,
        };

        global.fetch = jest.fn().mockImplementation((url) => {
            if (url.includes('/profile')) {
                return Promise.resolve({
                    ok: true,
                    text: jest.fn().mockResolvedValue(JSON.stringify({ id: '42' })),
                });
            }
            return Promise.resolve({
                ok: true,
                text: jest.fn().mockResolvedValue(JSON.stringify([rawPlant])),
            });
        });

        const result = await fetchPlants();
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Ortie');
        expect(result[0].hp).toBe(10);
        expect(result[0].atk).toBe(5);
        expect(result[0].type).toBe('flora');
        expect(result[0].category).toBe('flora');
    });

    it('doit retourner undefined si une erreur réseau se produit', async () => {
        const { getToken } = require('../../src/utils/auth');
        getToken.mockResolvedValue('valid-token');
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

        const result = await fetchPlants();
        expect(result).toBeUndefined();
    });

    it('doit retourner undefined si l\'API profil échoue', async () => {
        const { getToken } = require('../../src/utils/auth');
        getToken.mockResolvedValue('valid-token');

        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 500,
            text: jest.fn().mockResolvedValue(JSON.stringify({ message: 'Erreur serveur' })),
        });

        const result = await fetchPlants();
        expect(result).toBeUndefined();
    });

    it('doit retourner un tableau vide si l\'API plantes renvoie une liste vide', async () => {
        const { getToken } = require('../../src/utils/auth');
        getToken.mockResolvedValue('valid-token');

        global.fetch = jest.fn().mockImplementation((url) => {
            if (url.includes('/profile')) {
                return Promise.resolve({
                    ok: true,
                    text: jest.fn().mockResolvedValue(JSON.stringify({ id: '42' })),
                });
            }
            return Promise.resolve({
                ok: true,
                text: jest.fn().mockResolvedValue(JSON.stringify([])),
            });
        });

        const result = await fetchPlants();
        expect(result).toEqual([]);
    });
});
