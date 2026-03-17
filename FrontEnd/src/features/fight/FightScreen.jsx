import { View, Text, StyleSheet } from "react-native";
import { Zap, Sword, Map } from "lucide-react-native";
import ButtonFightMode from "./components/ButtonFightMode";

export default function FightScreen() {
    return (
        <View style={styles.screenContainer}>

            {/* Header*/}
            <View style={styles.headerContainer}>
                <View style={styles.titleRow}>
                    <Zap size={24} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.mainTitle}>ARENA</Text>
                </View>
                <Text style={styles.mainSubtitle}>
                    Challenge others or explore the wild
                </Text>
            </View>

            {/* Main Content */}
            <View style={styles.mainContainer}>
                {/* Duel Button */}
                <ButtonFightMode
                    title="DUEL"
                    subtitle="1v1 Online Battle"
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
                    title="CARRIÈRE"
                    subtitle="Progress through the world and fight the Erosion"
                    Icon={Map}
                    gradientColors={["rgba(236,253,245,0.9)", "rgba(204,251,241,0.8)"]}
                    themeColor="#059669"
                    cornerColor="rgba(6,78,59,0.1)"
                    isTopCorners={false}
                    delay={200}
                />

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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