import { View, StyleSheet, ScrollView } from "react-native";
import CardFeedComponent from "./CardFeedComponent";
import { use, useEffect } from "react";

export default function HomeFeedComponent() {
  const mock_data = [
    {
    pseudo: "Soremus",
    id: "fc12d64b-7061-425a-9d86-552bec8ff3d4",
    player_id: "74923ac5-d0f2-48cc-a57a-e1e1121a6bdd",
    gamification_name: "Fougère",
    scan_url:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS64ZLcASghP_cbIHTV5sqS85lpY7yqHF_-fzQun0ViJLy-JMFM730XQtv4RTA1vSc-Y6waruDDvrRWfwjEvkVBVbAkqepBMxPuo2RLnA&s=10",
    scan_quality: 1,
    gps_location: null,
    scan_date: "2026-04-20T16:34:46.423Z",
  },
    {
      pseudo: "Soremus",
      id: "ac160e56-a3de-4842-a15f-4a0b8f718378",
      player_id: "74923ac5-d0f2-48cc-a57a-e1e1121a6bdd",
      gamification_name: "Alpaga",
      scan_url: "https://www.fermeexotique.fr/public/img/medium/nos-animaux-amerique-centrale-et-du-sud53ec8e5e82cdb.jpg",
      scan_quality: 1,
      gps_location: null,
      scan_date: "2026-04-20T14:36:50.808Z",
    },
  ];

  useEffect(() => {
    // TODO : remplacer le mock_data par un fetch vers le backend pour récupérer les dernières créatures capturées
  }, []);

  const formatDate = (isoDate) =>
    new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    hour12: false,
    }).format(new Date(isoDate));

  return (
    <ScrollView
      style={styles.scrollview}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        {mock_data.map((item) => (
          <CardFeedComponent
            key={item.id}
            pseudo={item.pseudo}
            animal_name={item.gamification_name}
            scan_url={item.scan_url}
            gps_location={item.gps_location}
            scan_quality={item.scan_quality}
            scan_date={formatDate(item.scan_date)}
          />
        ))}
      </View>
    </ScrollView>
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
        gap: 20,
  },
  scrollview: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
});
