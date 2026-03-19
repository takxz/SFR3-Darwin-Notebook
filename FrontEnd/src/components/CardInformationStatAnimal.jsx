import { StyleSheet, Text, View } from "react-native";
import { Activity } from "lucide-react-native";

export default function CardInformationStatAnimal({
  title,
  stat,
  value = stat,
  max = 100,
  progress,
  icon,
  color = "#B61E34",
}) {
  const numericValue = Number(value) || 0;
  const boundedValue = Math.min(100, Math.max(0, numericValue));
  const ratio =
    typeof progress === "number"
      ? Math.min(100, Math.max(0, progress))
      : max > 0
      ? Math.min(100, Math.max(0, (numericValue / max) * 100))
      : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{String(title).toUpperCase()}</Text>

        <View style={styles.iconWrap}>
          {icon ? icon : <Activity style={[styles.iconDesign, { color }]} />}
        </View>
      </View>

      <Text style={[styles.value, { color }]}>{boundedValue}</Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${ratio}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8F3EA",
    borderColor: "#E6DDCF",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#8A837A",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F4E9E0",
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 34,
  },
  progressTrack: {
    marginTop: 6,
    width: "100%",
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E8E1D7",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#B61E34",
  },
  iconDesign:{
    size: 14,
    strokeWidth: 2.2,
  }
});
