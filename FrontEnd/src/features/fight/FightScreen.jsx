import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Zap, Sword, Map } from "lucide-react-native";
import ButtonFightMode from "@/features/fight/components/ButtonFightMode";
import socket from "@/services/socket";
import fr from "@/assets/locales/fr.json";

export default function FightScreen() {
    const router = useRouter();
    return (
        <View style={styles.screenContainer}>
            <View style={styles.headerContainer}>
                <View style={styles.titleRow}>
                    <Zap size={24} color="#f59e0b" fill="#f59e0b" />
                    <Text style={styles.mainTitle}>{fr.fightScreen.header_title}</Text>
                </View>
                <Text style={styles.mainSubtitle}>{fr.fightScreen.header_subtitle}</Text>
            </View>
            <View style={styles.mainContainer}>
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
                    onPress={() => router.push("/choose-beast")}
                />
                <ButtonFightMode
                    title={fr.fightScreen.mode_career}
                    subtitle={fr.fightScreen.career_desc}
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
    screenContainer: { flex: 1, backgroundColor: "#f2f6f3" },
    headerContainer: { paddingTop: 72, paddingBottom: 16, alignItems: "center" },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    mainTitle: { fontSize: 24, fontWeight: "900", color: "#022c22", letterSpacing: -0.5 },
    mainSubtitle: { fontSize: 14, fontWeight: "500", color: "rgba(6, 95, 70, 0.6)", marginTop: 4 },
    mainContainer: { flex: 1, justifyContent: "center", paddingHorizontal: 20, gap: 24, paddingBottom: 100 },
    battleHeader: { paddingTop: 32, paddingBottom: 12, alignItems: 'center' },
    battleTitle: { fontSize: 26, color: '#1f3f4c', fontWeight: '900' },
    battleStatus: { marginTop: 6, fontSize: 14, color: '#065f4a' },
    healthRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 10, marginTop: 16 },
    playerBlock: { alignItems: 'center', width: '48%', backgroundColor: 'rgba(255,255,255,0.62)', borderRadius: 12, padding: 12 },
    playerName: { fontSize: 16, fontWeight: '800', color: '#1f3f4c' },
    playerHp: { marginTop: 4, fontSize: 16, color: '#284b4f', fontWeight: '700' },
    turnText: { marginTop: 14, fontSize: 15, fontWeight: '700', color: '#2c6f62', textAlign:'center'},
    actionsRow: { width:'100%', flexDirection: 'row', justifyContent:'space-between', marginTop: 16 },
    actionBtn: { width:'32%', backgroundColor: '#f59e0b', paddingVertical: 10, borderRadius: 12, alignItems:'center', justifyContent:'center' },
    actionBtnText: { color:'#fff', fontWeight:'800', fontSize: 13 },
    logBox: { marginTop: 18, width:'100%', minHeight: 120, backgroundColor:'rgba(237,249,249,0.9)', borderRadius: 12, padding: 10 },
    logLine: { color:'#0f4e4b', fontSize: 12, marginBottom: 3 },
    backBtn: { marginTop: 18, alignSelf:'center', backgroundColor:'rgba(255,255,255,0.62)', borderColor:'#7ca89d', borderWidth:1, borderRadius:18, paddingVertical: 8, paddingHorizontal: 16},
    backText: { color:'#065f4a', fontWeight:'800' },
});