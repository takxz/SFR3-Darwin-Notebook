import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, Image } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { ArrowLeft, Heart, Star, Swords, AlertCircle } from "lucide-react-native";
import fr from "@/assets/locales/fr.json";
import { getToken } from "../../utils/auth.js";
import Constants from 'expo-constants';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const USER_API_URL = process.env.EXPO_PUBLIC_USER_API_URL || (expoHost ? `http://${expoHost}:3001` : 'http://localhost:3001');

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

const FALLBACK_IMAGE = "https://via.placeholder.com/150?text=No+Image";

function normalizeCreature(creature) {
    const rawRarity = Number(creature?.species_rarity || 1);
    const safeRarity = isNaN(rawRarity) ? 1 : Math.max(1, Math.min(5, Math.round(rawRarity)));
    const hp = Number(creature?.stat_pv ?? creature?.hp ?? 100);
    
    return {
        id: String(creature?.id),
        name: creature?.gamification_name || creature?.species_name || fr.chooseBeastScreen.unknown_creature,
        image: creature?.scan_url || creature?.image_url || null,
        hp: isNaN(hp) ? 100 : hp,
        maxHp: Number(creature?.stat_pv ?? 100) || 100,
        rarity: safeRarity,
    };
}

export default function ChooseBeastScreen() {
    const [creatures, setCreatures] = useState([]);
    const [selectedBeast, setSelectedBeast] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        loadCollection();
    }, []);

    const loadCollection = async () => {
        try {
            const token = await getToken();
            if (!token) throw new Error(fr.chooseBeastScreen.error_unauthenticated);

            // 1. Get Profile
            const profileRes = await fetch(`${USER_API_URL}/api/user/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const profile = await profileRes.json();
            const userId = profile?.id;

            if (!userId) throw new Error(fr.chooseBeastScreen.error_user_not_found);

            // 2. Get Creatures
            const res = await fetch(`${USER_API_URL}/api/user/${userId}/creatures`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!res.ok) throw new Error(fr.chooseBeastScreen.error_network);
            
            const data = await res.json();
            const normalized = (data || []).map(normalizeCreature);
            setCreatures(normalized);
            
            if (normalized.length > 0) {
                setSelectedBeast(normalized[0]);
            }
        } catch (err) {
            console.error("Failed to load collection for duel:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectBeast = (beast) => {
        if (selectedBeast?.id === beast.id) {
            handleStartBattle();
        } else {
            setSelectedBeast(beast);
        }
    };

    const handleStartBattle = () => {
        if (selectedBeast) {
            router.push({ pathname: "/fight/arena", params: { beastId: selectedBeast.id } });
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#97572B" />
            </View>
        );
    }

    if (creatures.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#97572B" />
                        <Text style={styles.backText}>{fr.chooseBeastScreen.back}</Text>
                    </Pressable>
                </View>
                <View style={styles.emptyContainer}>
                    <AlertCircle size={64} color="#97572B" />
                    <Text style={styles.emptyTitle}>{fr.chooseBeastScreen.empty_title}</Text>
                    <Text style={styles.emptyText}>{fr.chooseBeastScreen.empty_text}</Text>
                    <Pressable style={styles.captureButton} onPress={() => router.push("/(tabs)/camera")}>
                        <Text style={styles.captureButtonText}>{fr.chooseBeastScreen.empty_cta}</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

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
                    {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.beastImage} />
                    ) : (
                        <Text style={styles.beastEmoji}>🐾</Text>
                    )}
                    <View style={styles.imageOverlay} />

                    <View style={[styles.rarityBadge, { backgroundColor: `${RARITY_COLORS[item.rarity || 1]}40`, borderColor: `${RARITY_COLORS[item.rarity || 1]}80` }]}>
                        {[...Array(Math.floor(item.rarity || 1))].map((_, i) => (
                            <Star key={i} size={10} color={RARITY_COLORS[item.rarity || 1]} fill={RARITY_COLORS[item.rarity || 1]} />
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
                    <Text style={styles.beastName} numberOfLines={1}>{item.name}</Text>

                    <View style={styles.hpContainer}> 
                        <Heart size={14} color="#B01E28" fill="#B01E28" />
                        <View style={styles.hpBar}>
                            <View
                                style={[
                                    styles.hpFill,
                                    { width: `${Math.min(100, (item.hp / item.maxHp) * 100)}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.hpText}>
                            {Math.round(item.hp)}
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
                    <Text style={styles.backText}>{fr.chooseBeastScreen.back}</Text>
                </Pressable>
                <Text style={styles.title}>{fr.chooseBeastScreen.title}</Text>
                <Text style={styles.subtitle}>
                    {fr.chooseBeastScreen.subtitle}
                </Text>
            </View>

            <FlatList
                data={creatures}
                renderItem={renderBeastItem}
                keyExtractor={(item) => item.id}
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
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
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
        paddingBottom: 40,
    },
    beastCardContainer: {
        flex: 1,
        margin: 8,
    },
    beastCard: {
        flex: 1,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: '#fff',
        elevation: 6,
    },
    selectedCard: {
        borderWidth: 2,
        borderColor: '#97572B',
    },
    glassBackground: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255,255,255,0.7)",
    },
    imageContainer: {
        aspectRatio: 1,
        position: "relative",
        overflow: "hidden",
        backgroundColor: '#f0f0f0',
    },
    beastImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    beastEmoji: {
        fontSize: 60,
        textAlign: "center",
        lineHeight: 150,
    },
    imageOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.1)",
    },
    rarityBadge: {
        position: "absolute",
        top: 8,
        right: 8,
        flexDirection: "row",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: "center",
        gap: 1,
    },
    selectedOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(151,87,43,0.3)",
        alignItems: "center",
        justifyContent: "center",
    },
    startButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        elevation: 8,
    },
    infoSection: {
        padding: 12,
    },
    beastName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#000",
        textAlign: "center",
        marginBottom: 6,
    },
    hpContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 6,
    },
    hpBar: {
        flex: 1,
        height: 6,
        backgroundColor: "rgba(0,0,0,0.1)",
        borderRadius: 3,
        overflow: "hidden",
    },
    hpFill: {
        height: "100%",
        backgroundColor: "#B01E28",
    },
    hpText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#000",
    },
    rarityLabel: {
        fontSize: 10,
        fontWeight: "700",
        textTransform: "uppercase",
        textAlign: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#97572B',
        marginTop: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 22,
    },
    captureButton: {
        marginTop: 30,
        backgroundColor: '#97572B',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 20,
    },
    captureButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
