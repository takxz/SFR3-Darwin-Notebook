import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Zap, Sword, Map } from "lucide-react-native";
import ButtonFightMode from "@/features/fight/components/ButtonFightMode";
import fr from "@/assets/locales/fr.json";

export default function FightScreen() {
    const router = useRouter();
    return (
        <View style={styles.screenContainer}>
            {/* Ambiant Glow */}
            {/* <View style={(styles.glowTop)} /> */}
            {/* <View style={(styles.glowBottom)} /> */}

            {/* Header*/}
            <View style={styles.headerContainer}>
                <View style={styles.titleRow}>
                    <Zap size={24} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.mainTitle}>{fr.fightScreen.header_title}</Text>
                </View>
                <Text style={styles.mainSubtitle}>
                    {fr.fightScreen.header_subtitle}
                </Text>
            </View>

            {/* Main Content */}
            <View style={styles.mainContainer}>
                {/* Duel Button */}
                <ButtonFightMode
                    title={fr.fightScreen.mode_duel}
                    subtitle={fr.fightScreen.duel_desc}
                    Icon={Sword}
                    gradientColors={["rgba(255,251,235,0.9)", "rgba(255,237,213,0.8)"]}
                    themeColor="#f59e0b"
                    cornerColor="rgba(120,53,15,0.1)"
                    isTopCorners={true}
                    delay={100}
                    extraText="MMR: 500"
                />

                {/* Carrière Button */}
                <ButtonFightMode
                    title={fr.fightScreen.mode_career}
                    subtitle={fr.fightScreen.career_desc}
                    Icon={Map}
                    gradientColors={["rgba(236,253,245,0.9)", "rgba(204,251,241,0.8)"]}
                    themeColor="#059669"
                    cornerColor="rgba(6,78,59,0.1)"
                    isTopCorners={false}
                    delay={200}
                    onPress={() => router.push("/campaign")}
                />

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // --- Background Glows ---
    glowTop: {
        position: "absolute", top: -100, right: -50,
        width: 384, height: 384, borderRadius: 192,
        backgroundColor: "rgba(251,191,36,0.1)",
    },
    glowBottom: {
        position: "absolute", bottom: -100, left: -100,
        width: 384, height: 384, borderRadius: 192,
        backgroundColor: "rgba(16,185,129,0.1)",
    },

    // --- Layout Global ---
    screenContainer: {
        flex: 1,
        backgroundColor: "#f2f6f3",
    },
    mainContainer: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 20,
        gap: 24,
        paddingBottom: 100,
    },

    // --- Header ---
    headerContainer: {
        paddingTop: 72,
        paddingBottom: 16,
        alignItems: "center",
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: "900",
        color: "#022c22",
        letterSpacing: -0.5,
    },
    mainSubtitle: {
        fontSize: 14,
        fontWeight: "500",
        color: "rgba(6, 95, 70, 0.6)",
        marginTop: 4,
    }
});