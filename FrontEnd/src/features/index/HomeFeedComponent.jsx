import { View, Text, StyleSheet, ScrollView } from "react-native";
import CardFeedComponent from "./CardFeedComponent";
import { useState, useEffect } from "react";
import fr from "@/assets/locales/fr.json";
import colors from "@/assets/constants/colors.json";
import { getToken } from "@/utils/auth";

export default function HomeFeedComponent() {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDetails = async () => {
      try {
        const token = await getToken();

        if (!token) {
          throw new Error("Token manquant. Veuillez vous reconnecter.");
        }

        const response = await fetch("http://ikdeksmp.fr:3001/api/user/creatures/last-captured", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Impossible de charger les dernières captures.");
        }

        if (isMounted) {
          setDetails(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Impossible de charger les dernières captures.");
          setDetails([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      isMounted = false;
    };
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
        {loading ? (
          <Text>{fr.indexScreen.dataLoading}</Text>
        ) : error ? (
          <Text>{error}</Text>
        ) : details.length > 0 ? (
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
