import { View, Text, StyleSheet, ScrollView } from "react-native";
import CardFeedComponent from "./CardFeedComponent";
import { useState, useEffect } from "react";
import fr from "@/assets/locales/fr.json";
import colors from "@/assets/constants/colors.json";

export default function HomeFeedComponent() {
    const [details, setDetails] = useState(null);

  useEffect(() => {
    fetch("http://ikdeksmp.fr:3001/api/user/creatures/last-captured")
      .then((response) => response.json())
      .then((data) => {
        console.log("Données reçues du backend :", data);
        setDetails(data);
      });
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
        {details ? (
          details.map((item) => (
            <CardFeedComponent
              key={item.id}
              pseudo={item.pseudo}
              animal_name={item.gamification_name}
              scan_url={item.scan_url}
            gps_location={item.gps_location}
            scan_quality={item.scan_quality}
            scan_date={formatDate(item.scan_date)}
          />
        ))
      ) : (
        <Text>{fr.indexScreen.dataLoading}</Text>
      )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.blancJauni,
        borderColor: colors.marronCuir + '80',
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
