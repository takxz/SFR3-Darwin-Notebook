import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import CardFeedComponent from "./CardFeedComponent";
import { useState, useEffect, useCallback } from "react";
import fr from "@/assets/locales/fr.json";
import colors from "@/assets/constants/colors.json";
import { getToken } from "@/utils/auth";
import Constants from "expo-constants";
import * as Location from 'expo-location';


const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const USER_API_URL = process.env.EXPO_PUBLIC_USER_API_URL || (expoHost ? `http://${expoHost}:3001` : 'http://localhost:3001');



export default function HomeFeedComponent() {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const reverseGeocode = async (gpsLocation) => {
    if (!gpsLocation) return null;
    const [latitude, longitude] = gpsLocation.split(',').map((v) => Number(v.trim()));

    try {
      const address = (await Location.reverseGeocodeAsync({ latitude, longitude }))?.[0];
      return [address?.city, address?.country].filter(Boolean).join(', ') || null;
    } catch (e) {
      console.warn('Reverse geocode failed:', e);
      return null;
    }
  };
  
  const loadDetails = useCallback(async ({ showLoading = false } = {}) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const token = await getToken();

      if (!token) {
        throw new Error("Token manquant. Veuillez vous reconnecter.");
      }

      const response = await fetch(`${USER_API_URL}/api/user/creatures/last-captured`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Impossible de charger les dernières captures.");
      }

      const rows = Array.isArray(data) ? data : [];
      setDetails(await Promise.all(rows.map(async (item) => ({
        ...item,
        display_location: await reverseGeocode(item.gps_location),
      }))));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les dernières captures.");
      setDetails([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDetails({ showLoading: true });
  }, [loadDetails]);

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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadDetails()}
        />

      }
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
              gps_location={item.display_location || fr.indexScreen.unknown}
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
