import { View, StyleSheet, FlatList } from 'react-native';
import { AnimalCard } from '../../src/components/AnimalCard';

export default function CollectionPage() {
    const animalData = [
        { name: "Red Fox", type: "terrestrial", rarity: 2, hp: 68, maxHp: 100,
            image: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=400&fit=crop" },
        { name: "Great White Shark", type: "aquatic", rarity: 4, hp: 210, maxHp: 300,
            image: "https://images.unsplash.com/photo-1560275619-4cc5fa59d3ae?w=400&fit=crop" },
        { name: "Bald Eagle", type: "aerial", rarity: 3, hp: 90, maxHp: 120,
            image: "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=400&fit=crop" },
        { name: "Snow Leopard", type: "terrestrial", rarity: 5, hp: 145, maxHp: 180,
            image: "https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=400&fit=crop" },
        { name: "Barn Owl", type: "nocturnal", rarity: 3, hp: 55, maxHp: 80,
            image: "https://images.unsplash.com/photo-1543549049-9fbcc3cd9003?w=400&fit=crop" },
        { name: "Clownfish", type: "aquatic", rarity: 2, hp: 30, maxHp: 50,
            image: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&fit=crop" },
        { name: "Peregrine Falcon", type: "aerial", rarity: 4, hp: 75, maxHp: 100,
            image: "https://images.unsplash.com/photo-1570144820100-f5a6fa71f79e?w=400&fit=crop" },
        { name: "Giant Panda", type: "terrestrial", rarity: 5, hp: 200, maxHp: 200,
            image: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&fit=crop" }
    ];
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
    }
});