import { View, Text, StyleSheet, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Loader2, X } from "lucide-react-native";
import io from "socket.io-client";

const socket = io("http://10.0.2.2:3000", { transports: ["websocket"] });

export default function LobbyScreen() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isWaiting, setIsWaiting] = useState(true);
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState("Recherche de match...");
  const [roomId, setRoomId] = useState(null);

  useEffect(() => {
    socket.emit("findMatch");
    setStatus("Recherche de match...");

    socket.on("waitingForMatch", () => {
      setIsWaiting(true);
      setStatus("En file d'attente...");
    });

    socket.on("matchFound", (payload) => {
      const opponentIds = Object.keys(payload.players).filter(id => id !== socket.id);
      setPlayers(opponentIds);
      setIsWaiting(false);
      setStatus("Match trouvé !");
      setRoomId(payload.roomId);
      socket.currentRoomId = payload.roomId;

      // progresser visuel
      setProgress(100);

      // Envoyer ready => active le handler battleHandler
      socket.emit("playerReady");

      setTimeout(() => {
        router.replace('/fight');
      }, 800);
    });

    socket.on("playerCount", (count) => {
      setStatus(`En ligne : ${count} joueurs`);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connect error", err);
      setStatus("Erreur de connexion socket");
      setIsWaiting(false);
    });

    return () => {
      socket.off("waitingForMatch");
      socket.off("matchFound");
      socket.off("playerCount");
      socket.off("connect_error");
      socket.emit("leaveMatchmaking"); // côté serveur : implementer si besoin
    };
  }, [router]);

  useEffect(() => {
    if (!isWaiting || progress >= 100) return;
    const timer = setInterval(() => {
      setSeconds(s => s + 1);
      setProgress(prev => Math.min(100, prev + 4));
    }, 700);
    return () => clearInterval(timer);
  }, [isWaiting, progress]);

  const handleCancel = () => {
    socket.emit("leaveMatchmaking");
    setIsWaiting(false);
    setStatus("Recherche annulée");
    router.back();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />

      <View style={styles.content}>
        <Text style={styles.title}>Recherche d'adversaire</Text>
        <Text style={styles.sub}>{status}</Text>

        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <Text style={styles.percentage}>{progress}%</Text>

        <View style={styles.timerBox}>
          <Text style={styles.timerText}>{seconds}s</Text>
        </View>

        <Text style={styles.playersTitle}>Opposants détectés</Text>
        <View style={styles.playersList}>
          {players.length === 0 && <Text style={styles.playerItem}>Aucun adversaire encore</Text>}
          {players.map((p) => (
            <Text key={p} style={styles.playerItem}>• {p}</Text>
          ))}
        </View>

        <Pressable onPress={handleCancel} style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnActive]}>
          <X size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.cancelText}>ANNULER</Text>
        </Pressable>

        {!isWaiting && roomId && (
          <Text style={styles.readyText}>Match prêt ({roomId})</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#87c5d9",
    alignItems: "center",
    justifyContent: "center",
  },
  circleTop: {
    position: "absolute",
    top: -120,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(9, 54, 75, 0.14)",
  },
  circleBottom: {
    position: "absolute",
    bottom: -110,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255, 255, 255, 0.36)",
  },
  content: {
    width: "92%",
    maxWidth: 420,
    minHeight: 520,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  sub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    marginBottom: 18,
    textAlign: "center",
  },
  progressBackground: {
    width: "100%",
    height: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.4)",
    overflow: "hidden",
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#a14f1b",
  },
  percentage: {
    color: "#fff",
    fontWeight: "700",
    marginTop: 10,
    alignSelf: "flex-end",
  },
  timerBox: {
    marginTop: 14,
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },

  playersTitle: {
    color: "#fff",
    fontWeight: "700",
    marginTop: 14,
    alignSelf: "flex-start",
  },
  playersList: {
    width: "100%",
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    borderRadius: 14,
    padding: 10,
  },
  playerItem: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 4,
  },
  cancelBtn: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 48,
    backgroundColor: "rgba(255,255,255,0.24)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  cancelBtnActive: {
    backgroundColor: "rgba(255,255,255,0.42)",
  },
  cancelText: {
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  readyText: {
    marginTop: 12,
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});
