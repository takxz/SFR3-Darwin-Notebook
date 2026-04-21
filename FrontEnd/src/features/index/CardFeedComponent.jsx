import { MapPin, Sparkles } from "lucide-react-native";
import { View, Text, StyleSheet, Image } from "react-native";

export default function CardFeedComponent({
    pseudo,
    animal_name,
    scan_url,
    gps_location,
    scan_quality,
    scan_date
}) {
    
    return (
        <View style={styles.card}>
            <View style={styles.title_container}>
                <Text style={styles.pseudo_text}>{pseudo}</Text>
                <Text style={styles.capture_text}> a capturé </Text>
                <Text style={styles.creature_name_text}>{animal_name}</Text>
            </View>

            <View style={styles.image_container}>
            {scan_url ? (
                <Image source={{ uri: scan_url }} style={styles.image} resizeMode="cover" />
            ) : (
                <Text>Image indisponible</Text>
            )}
            <View style={styles.top_right}>
                <Sparkles size={12} color="#FFFFFF" />
                <Text style={styles.top_right_text}>{scan_quality ?? "Inconnue"}</Text>
            </View>
            </View>
            <View style={styles.bottom_container}>
                <Text style={styles.date_text}> {scan_date}</Text>
                <Text style={styles.gps_text}><MapPin /> {gps_location ? gps_location : "Inconnue"}</Text>
            </View>
        </View>
    )


}

const styles = StyleSheet.create({
    card: {
    backgroundColor: "#FAEBD7",
    borderColor: "#E6DDCF",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    width: "100%",
    },
    image: {
        width: "100%",
        height: 180,
        borderRadius: 12,
        marginVertical: 10,
  },
  title_container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  pseudo_text: {
    fontSize: 16,
    fontWeight: "bold",
  },
  creature_name_text: {
    fontSize: 16,
    color: "#97572B",
  },
  capture_text: {
    fontSize: 16,
    color: "#000000",
  },
  image_container: {
    position: "relative",
  },
  top_right: {
    position: "absolute",
    top: 20,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#97572B",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  top_right_text: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
    bottom_container: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    gps_text: {
        fontSize: 12,
        color: "#555555",
        backgroundColor: "#f2f0f0",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 4,
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
    },
    date_text: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#555555",
        marginTop: 10,
    }
});