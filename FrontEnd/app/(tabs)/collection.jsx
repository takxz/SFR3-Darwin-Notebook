import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { AnimalCard } from '../../src/components/Collection/AnimalCard';
import { SpeciesFilterBar } from '../../src/components/Collection/SpeciesFilterBar';
import { fetchCollection } from '../../src/utils/tempCollectionApi';
import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import { getToken } from '../../src/utils/auth.js';

const USER_API_URL = process.env.EXPO_PUBLIC_USER_API_URL || 'http://localhost:3001';

const SPECIES_OPTIONS = [
    { key: 'all', label: 'Tous' },
    { key: 'fauna', label: 'Faune' },
    { key: 'flora', label: 'Flore' },
];


export default function CollectionPage() {
    const router = useRouter();
    const [animalData, setAnimalData] = useState([]);
    const [selectedSpecies, setSelectedSpecies] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const filteredAnimals = selectedSpecies === 'all'
    ? animalData
    : animalData.filter((animal) => animal.category === selectedSpecies);
    
    const getCollection = async () => {
        try {
            const token = await getToken();

            const response = await fetch(
                `${USER_API_URL}/api/user/creatures/add`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );
            
            if (!response.ok) {
                Alert.alert('Erreur', data?.message || data?.error || 'Impossible de récupérer la collection.');
                return;
            }

            const data = await response.json();
            console.log('Collection API response', { status: response.status, data });

            Alert.alert('Succès', 'Collection récupérée avec succès.');
        } catch (error) {
            console.error('Error fetching collection:', error);
        }
    };


    useEffect(() => {
        let isMounted = true;

        const loadAnimals = async () => {
            try {
                const data = await fetchCollection();

                if (isMounted) {
                    setAnimalData(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError('Unable to load animals.');
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
        getCollection(),
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
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.column}
                renderItem={({ item, index }) => (
                    <AnimalCard
                        animal={item}
                        index={index}
                        onPress={() => router.push(`/creature/${item.id}`)}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No species available in this category yet.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f6f3'
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
        },
        emptyState: {
            alignItems: 'center',
            paddingTop: 24,
        },
        emptyText: {
            color: '#8a7558',
            fontSize: 14,
            fontWeight: '500',
    }
});