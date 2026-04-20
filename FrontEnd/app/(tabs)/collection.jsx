import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { AnimalCard } from '../../src/components/Collection/AnimalCard';
import { SpeciesFilterBar } from '../../src/components/Collection/SpeciesFilterBar';
import { getToken } from '../../src/utils/auth.js';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const USER_API_URL = process.env.EXPO_PUBLIC_USER_API_URL || (expoHost ? `http://${expoHost}:3001` : 'http://localhost:3001');

const SPECIES_OPTIONS = [
    { key: 'all', label: 'Tous' },
    { key: 'fauna', label: 'Faune' },
    { key: 'flora', label: 'Flore' },
];

async function parseResponseBody(response) {
    const raw = await response.text();

    try {
        return {
            parsed: raw ? JSON.parse(raw) : null,
            raw,
        };
    } catch {
        return {
            parsed: null,
            raw,
        };
    }
}

function normalizeCreature(creature) {
    const rawType = String(creature?.species_type || '').toLowerCase();
    const type = ['flora', 'fauna'].includes(rawType)
        ? rawType
        : 'fauna';
    const hp = Number(creature?.stat_pv ?? creature?.hp ?? 1);

    return {
        id: String(creature?.id ?? `${creature?.player_id || 'player'}-${creature?.species_id || Date.now()}`),
        name: creature?.gamification_name || creature?.species_name || creature?.name || 'Creature inconnue',
        scientificName: creature?.species_name || creature?.scientific_name || '',
        image: creature?.scan_url || creature?.image_url || creature?.image || FALLBACK_IMAGE,
        type,
        category: type === 'flora' ? 'flora' : 'fauna',
        rarity: Number(creature?.species_rarity ?? creature?.rarity ?? 1),
        hp,
        maxHp: Number(creature?.maxHp ?? creature?.stat_pv ?? hp),
        atk: Number(creature?.stat_atq ?? creature?.atk ?? 0),
        def: Number(creature?.stat_def ?? creature?.def ?? 0),
        spd: Number(creature?.stat_speed ?? creature?.spd ?? 0),
    };
}

export default function CollectionPage() {
    const router = useRouter();
    const [animalData, setAnimalData] = useState([]);
    const [selectedSpecies, setSelectedSpecies] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const filteredAnimals = selectedSpecies === 'all'
        ? animalData
        : animalData.filter((animal) => animal.category === selectedSpecies);

    const fetchProfile = async (token) => {
        const url = `${USER_API_URL}/api/user/profile`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const { parsed: payload, raw } = await parseResponseBody(response);

        if (!response.ok) {
            const error = new Error(payload?.message || payload?.error || 'Impossible de recuperer le profil utilisateur.');
            error.name = 'ApiError';
            error.details = {
                route: 'GET /api/user/profile',
                url,
                status: response.status,
                statusText: response.statusText,
                payload,
                raw,
            };
            throw error;
        }

        return payload;
    };

    const getCollection = async () => {
        const token = await getToken();
        if (!token) {
            throw new Error('Token utilisateur manquant.');
        }

        try {
            const profile = await fetchProfile(token);
            const userId = profile?.id;

            if (!userId) {
                throw new Error('ID utilisateur introuvable dans le profil.');
            }

            const url = `${USER_API_URL}/api/user/${userId}/creatures`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const { parsed: data, raw } = await parseResponseBody(response);

            if (!response.ok) {
                const error = new Error(data?.message || data?.error || 'Impossible de recuperer la collection.');
                error.name = 'ApiError';
                error.details = {
                    route: 'GET /api/user/:id/creatures',
                    url,
                    status: response.status,
                    statusText: response.statusText,
                    payload: data,
                    raw,
                    tokenPreview: `${String(token).slice(0, 12)}...`,
                    resolvedUserId: userId,
                };
                throw error;
            }

            const list = Array.isArray(data) ? data : [];
            return list.map(normalizeCreature);
        } catch (apiError) {
            console.error('Collection API error (full object):', apiError);
            console.error('Collection API error details:', {
                name: apiError?.name,
                message: apiError?.message,
                stack: apiError?.stack,
                details: apiError?.details,
            });
            throw apiError;
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadAnimals = async () => {
            try {
                const data = await getCollection();

                if (isMounted) {
                    setAnimalData(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (isMounted) {
                    setAnimalData([]);
                    setError(err?.message || 'Unable to load animals.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadAnimals();

        return () => {
            isMounted = false;
        };
    }, []);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centeredState]}>
                <ActivityIndicator size="large" color="#90AAA1" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.centeredState]}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.filterOverlay}>
                <SpeciesFilterBar
                    options={SPECIES_OPTIONS}
                    selectedKey={selectedSpecies}
                    onSelect={setSelectedSpecies}
                />
            </View>
            <FlatList
                data={filteredAnimals}
                numColumns={2}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.column}
                renderItem={({ item, index }) => (
                    <AnimalCard
                        animal={item}
                        index={index}
                        // onPress={() => router.push(`/creature/${item.id}`)}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Aucune créature disponible dans cette catégorie pour le moment.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f6f3',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 82,
        paddingBottom: 24,
    },
    column: {
        justifyContent: 'space-between',
    },
    filterOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        elevation: 20,
    },
    centeredState: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#8b3a3a',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 24,
    },
    emptyText: {
        color: '#8a7558',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
        width: '100%',
    },
});