import { View, Text, StyleSheet, Pressable, FlatList, Animated } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { ArrowLeft, Map, Star, ChevronRight, Coins } from "lucide-react-native";
import fr from "@/assets/locales/fr.json";

const getMockLevels = () => [
    { id: 1, name: fr.campaignScreen.level_forest_name, description: fr.campaignScreen.level_forest_desc, stars: 0, maxStars: 3, unlocked: true, reward: 100 },
    { id: 2, name: fr.campaignScreen.level_river_name, description: fr.campaignScreen.level_river_desc, stars: 0, maxStars: 3, unlocked: false, reward: 150 },
    { id: 3, name: fr.campaignScreen.level_mountain_name, description: fr.campaignScreen.level_mountain_desc, stars: 0, maxStars: 3, unlocked: false, reward: 200 },
    { id: 4, name: fr.campaignScreen.level_desert_name, description: fr.campaignScreen.level_desert_desc, stars: 0, maxStars: 3, unlocked: false, reward: 250 },
    { id: 5, name: fr.campaignScreen.level_reef_name, description: fr.campaignScreen.level_reef_desc, stars: 0, maxStars: 3, unlocked: false, reward: 300 },
    { id: 6, name: fr.campaignScreen.level_tundra_name, description: fr.campaignScreen.level_tundra_desc, stars: 0, maxStars: 3, unlocked: false, reward: 350 },
];

export default function CampaignScreen() {
    const router = useRouter();
    const progressAnim = useRef(new Animated.Value(0)).current;
    const [levels, setLevels] = useState(getMockLevels());

    const totalStars = levels.reduce((sum, level) => sum + level.stars, 0);
    const completedLevels = levels.filter(level => level.stars > 0).length;
    const totalCoins = 700;
    const progressPercent = (completedLevels / levels.length) * 100;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progressPercent,
            duration: 1000,
            useNativeDriver: false,
        }).start();
    }, [completedLevels, progressAnim]);

    const renderLevelCard = ({ item, index }) => (
        <Pressable 
            style={[styles.levelCard, !item.unlocked && styles.levelCardLocked]}
            onPress={() => item.unlocked && router.push(`/campaign/level/${item.id}`)}
            disabled={!item.unlocked}
        >
            <View style={styles.levelContent}>
                <View style={styles.levelBadge}>
                    <Text style={styles.levelNumber}>{item.id}</Text>
                </View>

                <View style={styles.levelInfo}>
                    <Text style={styles.levelName}>{item.name}</Text>
                    <Text style={styles.levelDescription}>{item.description}</Text>

                    <View style={styles.levelFooter}>
                        <View style={styles.starsContainer}>
                            {Array.from({ length: item.maxStars }).map((_, i) => (
                                <Star
                                    key={i}
                                    size={16}
                                    color={i < item.stars ? "#FFC107" : "#D4A574"}
                                    fill={i < item.stars ? "#FFC107" : "none"}
                                />
                            ))}
                        </View>

                        <View style={styles.rewardBadge}>
                            <Coins size={12} color="#D4A574" />
                            <Text style={styles.rewardText}>+{item.reward}</Text>
                        </View>
                    </View>
                </View>

                <ChevronRight size={20} color={item.unlocked ? "#97572B" : "#97572B30"} />
            </View>

            {!item.unlocked && (
                <View style={styles.lockedOverlay}>
                    <View style={styles.lockedBadge}>
                        <Text style={styles.lockedText}>{fr.campaignScreen.locked}</Text>
                    </View>
                </View>
            )}
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={20} color="#97572B" />
                </Pressable>

                <View style={styles.titleContainer}>
                    <Map size={16} color="#97572B" />
                    <Text style={styles.title}>{fr.campaignScreen.title}</Text>
                </View>

                <View style={styles.starsCount}>
                    <Star size={14} color="#fff" fill="#fff" />
                    <Text style={styles.starsText}>{totalStars}</Text>
                </View>
            </View>

            <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>{fr.campaignScreen.progress_label}</Text>
                    <View style={styles.progressInfo}>
                        <Text style={styles.progressPercent}>{completedLevels}/{levels.length}</Text>
                        <View style={styles.coinsBadge}>
                            <Coins size={12} color="#fff" />
                            <Text style={styles.coinsText}>{totalCoins}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.progressBar}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            {
                                width: progressAnim.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ["0%", "100%"],
                                }),
                            },
                        ]}
                    />
                </View>
            </View>

            <FlatList
                data={levels}
                renderItem={renderLevelCard}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.levelsList}
                scrollEnabled={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FAEBD7",
        paddingTop: 50,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 12,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.7)",
        borderWidth: 2,
        borderColor: "rgba(212,165,116,0.3)",
        alignItems: "center",
        justifyContent: "center",
    },
    titleContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "rgba(255,255,255,0.7)",
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "rgba(212,165,116,0.3)",
    },
    title: {
        fontSize: 13,
        fontWeight: "900",
        color: "#97572B",
        letterSpacing: 1,
    },
    starsCount: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#FFC107",
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.5)",
    },
    starsText: {
        fontSize: 12,
        fontWeight: "900",
        color: "#fff",
    },
    progressSection: {
        marginHorizontal: 20,
        marginBottom: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: "rgba(255,255,255,0.6)",
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "rgba(212,165,116,0.3)",
    },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    progressLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#97572B",
        letterSpacing: 0.5,
    },
    progressInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    progressPercent: {
        fontSize: 12,
        fontWeight: "700",
        color: "#97572B",
    },
    coinsBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: "rgba(255,193,7,0.7)",
        borderRadius: 12,
    },
    coinsText: {
        fontSize: 10,
        fontWeight: "900",
        color: "#fff",
    },
    progressBar: {
        height: 8,
        backgroundColor: "rgba(151,87,43,0.15)",
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "rgba(151,87,43,0.1)",
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#97572B",
        borderRadius: 3,
    },
    levelsList: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 12,
    },
    levelCard: {
        backgroundColor: "rgba(255,255,255,0.7)",
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "rgba(212,165,116,0.3)",
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    levelCardLocked: {
        opacity: 0.6,
    },
    levelContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    levelBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#97572B",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.3)",
    },
    levelNumber: {
        fontSize: 20,
        fontWeight: "900",
        color: "#fff",
    },
    levelInfo: {
        flex: 1,
    },
    levelName: {
        fontSize: 15,
        fontWeight: "900",
        color: "#97572B",
        marginBottom: 2,
    },
    levelDescription: {
        fontSize: 12,
        color: "rgba(151,87,43,0.6)",
        marginBottom: 8,
    },
    levelFooter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    starsContainer: {
        flexDirection: "row",
        gap: 2,
    },
    rewardBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 3,
        backgroundColor: "rgba(255,193,7,0.15)",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(212,165,116,0.3)",
    },
    rewardText: {
        fontSize: 10,
        fontWeight: "900",
        color: "#D4A574",
    },
    lockedOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.5)",
        alignItems: "center",
        justifyContent: "center",
    },
    lockedBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "rgba(151,87,43,0.95)",
        borderRadius: 12,
    },
    lockedText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#fff",
        letterSpacing: 0.5,
    },
});
