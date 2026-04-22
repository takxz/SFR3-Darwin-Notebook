import { Map, MapPin, X, RefreshCw } from "lucide-react-native";
import { Pressable, Modal, View, Text, ActivityIndicator } from "react-native";
import { useState } from "react";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { getToken } from "@/utils/auth";
import colors from "@/assets/constants/colors";
import fr from "@/assets/locales/fr.json";
import { styles } from "./MapButton.styles";

const USER_API_URL = 'http://ikdeksmp.fr:3001';

function parseGpsLocation(gpsString) {
    if (!gpsString || typeof gpsString !== 'string') return null;
    const parts = gpsString.split(',').map(s => parseFloat(s.trim()));
    if (parts.length !== 2 || parts.some(isNaN)) return null;
    return { latitude: parts[0], longitude: parts[1] };
}

export default function MapButton() {
    const [modalVisible, setModalVisible] = useState(false);
    const [location, setLocation] = useState(null);
    const [creatures, setCreatures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setError(fr.indexScreen.mapPermissionDenied);
            setLoading(false);
            return;
        }

        const [locResult] = await Promise.all([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        ]);
        setLocation(locResult.coords);

        try {
            const token = await getToken();
            if (token) {
                const profileRes = await fetch(`${USER_API_URL}/api/user/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const profile = await profileRes.json();
                const userId = profile?.id;

                if (userId) {
                    const creaturesRes = await fetch(`${USER_API_URL}/api/user/${userId}/creatures`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await creaturesRes.json();
                    const withCoords = (Array.isArray(data) ? data : [])
                        .map(c => ({ ...c, coords: parseGpsLocation(c.gps_location) }))
                        .filter(c => c.coords !== null);
                    setCreatures(withCoords);
                }
            }
        } catch {
        }

        setLoading(false);
    };

    const handleOpen = () => {
        setModalVisible(true);
        fetchData();
    };

    return (
        <View style={styles.container}>
            <Pressable onPress={handleOpen}>
                <View style={styles.mapButton}>
                    <Map style={styles.mapIcon} />
                </View>
            </Pressable>
            <Modal
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalBackGround}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <View style={styles.mapPinContainer}>
                                <MapPin style={styles.mapPin} />
                            </View>
                            <Text style={styles.modalTitle}>{fr.indexScreen.mapTitle}</Text>
                            <Pressable onPress={fetchData} style={styles.refreshButton}>
                                <RefreshCw size={16} color={colors.marronCuir} />
                            </Pressable>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <View style={styles.closeButton}>
                                    <X />
                                </View>
                            </Pressable>
                        </View>

                        <View style={styles.mapContainer}>
                            {loading && (
                                <View style={styles.overlay}>
                                    <ActivityIndicator size="large" color={colors.marronCuir} />
                                    <Text style={styles.statusText}>{fr.indexScreen.mapLocating}</Text>
                                </View>
                            )}
                            {error && !loading && (
                                <View style={styles.overlay}>
                                    <Text style={styles.errorText}>{error}</Text>
                                    <Pressable onPress={fetchData} style={styles.retryButton}>
                                        <RefreshCw size={16} color={colors.blanc} />
                                        <Text style={styles.retryText}>{fr.indexScreen.mapRetry}</Text>
                                    </Pressable>
                                </View>
                            )}
                            {location && !loading && (
                                <MapView
                                    style={styles.map}
                                    initialRegion={{
                                        latitude: location.latitude,
                                        longitude: location.longitude,
                                        latitudeDelta: 0.05,
                                        longitudeDelta: 0.05,
                                    }}
                                    showsUserLocation={true}
                                    showsMyLocationButton={false}
                                >
                                    {creatures.map(creature => (
                                        <Marker
                                            key={String(creature.id)}
                                            coordinate={creature.coords}
                                            title={creature.gamification_name || creature.species_name || fr.indexScreen.unknown}
                                            description={creature.species_name || ''}
                                            pinColor={colors.marronCuir}
                                        />
                                    ))}
                                </MapView>
                            )}
                        </View>

                        {location && !loading && (
                            <View style={styles.coordBar}>
                                <Text style={styles.coordText}>
                                    {location.latitude.toFixed(5)}°, {location.longitude.toFixed(5)}°
                                </Text>
                                {creatures.length > 0 && (
                                    <Text style={styles.creaturesCount}>
                                        {creatures.length} {fr.indexScreen.mapCreaturesFound}
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}
