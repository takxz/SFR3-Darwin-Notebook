import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from 'react-native';
import { AnimalCard } from '../../src/components/AnimalCard';
import { fetchCollectionAnimals } from '../../src/utils/tempCollectionApi';

export default function CollectionPage() {
    const [animalData, setAnimalData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const loadAnimals = async () => {
            try {
                const data = await fetchCollectionAnimals();

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
        <View style={styles.container}>
            <FlatList
                data={animalData}
                numColumns={2}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.column}
                renderItem={({ item, index }) => (
                    <AnimalCard animal={item} index={index} />
                )}
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
      paddingTop: 16,
      paddingBottom: 24,
    },
    column: {
      justifyContent: 'space-between',
        },
        centeredState: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        errorText: {
            color: '#8b3a3a',
            fontSize: 16,
            fontWeight: '600',
    }
});