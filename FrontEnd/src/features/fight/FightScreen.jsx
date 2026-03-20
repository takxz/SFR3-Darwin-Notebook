import { View, Text, StyleSheet, Pressable } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Zap, Sword, Map } from "lucide-react-native";
import ButtonFightMode from "@/features/fight/components/ButtonFightMode";
import socket from "@/services/socket";
import fr from "@/assets/locales/fr.json";

export default function FightScreen() {
    const router = useRouter();
    const roomId = socket.currentRoomId;
    const [battleState, setBattleState] = useState(null);
    const [turn, setTurn] = useState(null);
    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState("En attente du combat...");
    const [isReady, setIsReady] = useState(false);
    const [actionPending, setActionPending] = useState(false);

    const playerId = useMemo(() => socket.id, [socket.id]);

    useEffect(() => {
        if (!roomId) return;

        setStatus("Match trouvé, attente du début...");

        const onBattleStart = ({ turn: initialTurn }) => {
            setStatus("Combat commencé !");
            setTurn(initialTurn);
            setIsReady(true);
        };

        const onGameUpdate = ({ players, turn: nextTurn, lastLog, result }) => {
            setBattleState(players);
            setTurn(nextTurn);
            setLogs((existing) => [...existing.slice(-4), lastLog]);

            if (result) {
                if (result.winner === playerId) setStatus("Victoire !");
                else setStatus("Défaite...");
            }
        };

        const onPlayerDisconnected = () => {
            setStatus("Adversaire déconnecté, victoire par forfait.");
        };

        const onError = (message) => {
            setStatus(`Erreur: ${message}`);
        };

        socket.on("battleStart", onBattleStart);
        socket.on("gameUpdate", onGameUpdate);
        socket.on("playerDisconnected", onPlayerDisconnected);
        socket.on("error", onError);

        return () => {
            socket.off("battleStart", onBattleStart);
            socket.off("gameUpdate", onGameUpdate);
            socket.off("playerDisconnected", onPlayerDisconnected);
            socket.off("error", onError);
        };
    }, [roomId, playerId]);

    const dispatchAction = (action) => {
        if (!roomId || actionPending || !isReady) return;
        setActionPending(true);
        socket.emit("playerAction", { action }, () => {
            setActionPending(false);
        });
    };

    if (roomId && isReady) {
        const currentPlayer = battleState?.[playerId] ?? { hp: 0, maxHp: 0 };
        const opponentId = Object.keys(battleState || {}).find((id) => id !== playerId);
        const opponent = opponentId ? battleState?.[opponentId] : null;

        return (
            <View style={styles.screenContainer}>
                <View style={styles.battleHeader}>
                    <Text style={styles.battleTitle}>Combat 1v1</Text>
                    <Text style={styles.battleStatus}>{status}</Text>
                </View>
                <View style={styles.healthRow}>
                    <View style={styles.playerBlock}>
                        <Text style={styles.playerName}>Vous</Text>
                        <Text style={styles.playerHp}>{currentPlayer.hp}/{currentPlayer.maxHp} PV</Text>
                    </View>
                    <View style={styles.playerBlock}>
                        <Text style={styles.playerName}>Adversaire</Text>
                        <Text style={styles.playerHp}>{opponent?.hp ?? 0}/{opponent?.maxHp ?? 0} PV</Text>
                    </View>
                </View>
                <Text style={styles.turnText}>{turn === playerId ? "Votre tour" : "Tour de l'adversaire"}</Text>

                <View style={styles.actionsRow}>
                    <Pressable
                        style={styles.actionBtn}
                        onPress={() => dispatchAction("ATTACK")}
                        disabled={actionPending || turn !== playerId}
                    >
                        <Text style={styles.actionBtnText}>Attaquer</Text>
                    </Pressable>
                    <Pressable
                        style={styles.actionBtn}
                        onPress={() => dispatchAction("DEFEND")}
                        disabled={actionPending || turn !== playerId}
                    >
                        <Text style={styles.actionBtnText}>Défendre</Text>
                    </Pressable>
                    <Pressable
                        style={styles.actionBtn}
                        onPress={() => dispatchAction("HEAL")}
                        disabled={actionPending || turn !== playerId || currentPlayer?.inventory?.potion <= 0}
                    >
                        <Text style={styles.actionBtnText}>Soigner</Text>
                    </Pressable>
                </View>

                <View style={styles.logBox}>
                    {logs.map((log, i) => (
                        <Text key={`${log}-${i}`} style={styles.logLine}>{log}</Text>
                    ))}
                </View>

                <Pressable style={styles.backBtn} onPress={() => router.push('/fight')}>
                    <Text style={styles.backText}>Retour aux modes</Text>
                </Pressable>
            </View>
        );
    }

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
                    onPress={() => router.push('/lobby')}
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