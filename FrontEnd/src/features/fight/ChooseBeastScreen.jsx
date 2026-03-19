import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ArrowLeft, Heart, Star, Swords } from "lucide-react-native";

// Mock beasts data
const mockBeasts = [
    { id: 1, name: "Lion", type: "Prédateur", image: "🦁", hp: 120, maxHp: 120, rarity: 4 },
    { id: 2, name: "Éléphant", type: "Herbivore", image: "🐘", hp: 150, maxHp: 150, rarity: 3 },
    { id: 3, name: "Aigle", type: "Rapace", image: "🦅", hp: 90, maxHp: 90, rarity: 3 },
    { id: 4, name: "Serpent", type: "Reptile", image: "🐍", hp: 80, maxHp: 80, rarity: 2 },
    { id: 5, name: "Loup", type: "Prédateur", image: "🐺", hp: 110, maxHp: 110, rarity: 3 },
];

const RARITY_COLORS = {
    1: '#97572B',
    2: '#2E6F40',
    3: '#ABDDF1',
    4: '#B01E28',
    5: '#FFD700',
};

const RARITY_LABELS = {
    1: 'Common',
    2: 'Uncommon',
    3: 'Rare',
    4: 'Epic',
    5: 'Legendary',
};

export default function ChooseBeastScreen() {
    const [selectedBeast, setSelectedBeast] = useState(null);
    const router = useRouter();

    const handleSelectBeast = (beast) => {
        if (selectedBeast?.id === beast.id) {
            // Ici, naviguer vers le matchmaking avec la bête sélectionnée
            alert(`Bête sélectionnée : ${beast.name} - Commencer le duel !`);
            // router.push({ pathname: "/fight/matchmaking", params: { beastId: beast.id } });
        } else {
            setSelectedBeast(beast);
        }
    };

    const handleStartBattle = () => {
        if (selectedBeast) {
            alert(`Commencer le duel avec ${selectedBeast.name} !`);
            // router.push({ pathname: "/fight/matchmaking", params: { beastId: selectedBeast.id } });
        }
    };

    const renderBeastItem = ({ item }) => (
        <View style={styles.beastCardContainer}>
            <Pressable
                style={[
                    styles.beastCard,
                    selectedBeast?.id === item.id && styles.selectedCard
                ]}
                onPress={() => handleSelectBeast(item)}
            >
                <View style={styles.glassBackground} />

                <View style={styles.imageContainer}> 
                    <Text style={styles.beastEmoji}>{item.image}</Text>
                    <View style={styles.imageOverlay} />

                    <View style={[styles.rarityBadge, { backgroundColor: `${RARITY_COLORS[item.rarity]}40`, borderColor: `${RARITY_COLORS[item.rarity]}80` }]}>
                        {[...Array(item.rarity)].map((_, i) => (
                            <Star key={i} size={10} color={RARITY_COLORS[item.rarity]} fill={RARITY_COLORS[item.rarity]} />
                        ))}
                    </View>

                    {selectedBeast?.id === item.id && (
                        <View style={styles.selectedOverlay}>
                            <Pressable
                                style={styles.startButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleStartBattle();
                                }}
                            >
                                <Swords size={28} color="#97572B" />
                            </Pressable>
                        </View>
                    )}
                </View>

                <View style={styles.infoSection}> 
                    <Text style={styles.beastName}>{item.name}</Text>

                    <View style={styles.hpContainer}> 
                        <Heart size={14} color="#B01E28" fill="#B01E28" />
                        <View style={styles.hpBar}>
                            <View
                                style={[
                                    styles.hpFill,
                                    { width: `${(item.hp / item.maxHp) * 100}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.hpText}>
                            {item.hp}/{item.maxHp}
                        </Text>
                    </View>

                    <Text
                        style={[styles.rarityLabel, { color: RARITY_COLORS[item.rarity] }]}
                    >
                        {RARITY_LABELS[item.rarity]}
                    </Text>
                </View>
            </Pressable>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.glowTop} />
            <View style={styles.glowBottom} />

            <View style={styles.header}> 
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#97572B" />
                    <Text style={styles.backText}>Retour</Text>
                </Pressable>
                <Text style={styles.title}>CHOISIR VOTRE BÊTE</Text>
                <Text style={styles.subtitle}>
                    Sélectionnez l'animal qui vous représentera au combat
                </Text>
            </View>

            <FlatList
                data={mockBeasts}
                renderItem={renderBeastItem}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAEBD7",
        position: "relative",
        overflow: "hidden",
    },
    glowTop: {
        position: "absolute",
        top: 0,
        right: 0,
        width: 384,
        height: 384,
        borderRadius: 192,
        backgroundColor: "rgba(151,87,43,0.1)",
    },
    glowBottom: {
        position: "absolute",
        bottom: 0,
        left: 0,
        width: 384,
        height: 384,
        borderRadius: 192,
        backgroundColor: "rgba(171,221,241,0.2)",
    },
    header: {
        paddingTop: 72,
        paddingBottom: 16,
        alignItems: "center",
        paddingHorizontal: 20,
    },
    backButton: {
        position: "absolute",
        top: 50,
        left: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    backText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#97572B",
    },
    title: {
        fontSize: 28,
        fontWeight: "900",
        color: "#000",
        textAlign: "center",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: "500",
        color: "#97572B",
        textAlign: "center",
        marginTop: 8,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    beastCardContainer: {
        flex: 1,
        margin: 8,
    },
    beastCard: {
        flex: 1,
        borderRadius: 24,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 6,
    },
    selectedCard: {
        shadowColor: "#97572B",
        shadowOpacity: 0.4,
        shadowRadius: 32,
        elevation: 12,
    },
    glassBackground: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(16px)",
    },
    imageContainer: {
        aspectRatio: 1,
        position: "relative",
        overflow: "hidden",
    },
    beastEmoji: {
        fontSize: 60,
        textAlign: "center",
        lineHeight: 120,
    },
    imageOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
    },
    rarityBadge: {
        position: "absolute",
        top: 12,
        right: 12,
        flexDirection: "row",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
        gap: 2,
    },
    selectedOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(151,87,43,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    startButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    infoSection: {
        padding: 16,
        backgroundColor: "rgba(255,255,255,0.8)",
        backdropFilter: "blur(16px)",
    },
    beastName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#000",
        textAlign: "center",
        marginBottom: 8,
    },
    hpContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    hpBar: {
        flex: 1,
        height: 8,
        backgroundColor: "rgba(0,0,0,0.1)",
        borderRadius: 4,
        overflow: "hidden",
    },
    hpFill: {
        height: "100%",
        backgroundColor: "#B01E28",
        borderRadius: 4,
    },
    hpText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#000",
    },
    rarityLabel: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1,
        textAlign: "center",
    },
    bottomButtonContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    combatButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 24,
        backgroundColor: "linear-gradient(135deg, #97572B 0%, #7a4522 100%)",
        shadowColor: "#97572B",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    combatButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "900",
        textTransform: "uppercase",
        letterSpacing: 2,
    },
});