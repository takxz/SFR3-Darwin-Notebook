import { useState } from 'react';
import SpotlightTooltip from '@/components/SpotlightTooltip';
import { useSpotlight } from '@/hooks/useSpotlight';
import { useUserId } from '@/hooks/useUserId';
import { View, Text, Alert, StyleSheet, Pressable } from 'react-native';
import { CameraView } from 'expo-camera';
import { Aperture } from 'lucide-react-native';
import { useCamera } from '../../src/hooks/useCamera.jsx';
import * as Location from 'expo-location';
import InformationOrganisme from '../../src/components/InformationOrganisme.jsx';
import fr from '../../src/assets/locales/fr.json';
import { getToken } from '../../src/utils/auth.js';
import Constants from 'expo-constants';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const USER_API_URL = process.env.EXPO_PUBLIC_USER_API_URL || (expoHost ? `http://${expoHost}:3001` : 'http://localhost:3001');

export default function CameraScreen() {
  const { permission, requestPermission, cameraRef, takePicture } = useCamera();
  const userId = useUserId();
  const { visible, targetLayout, ref, onLayout, dismiss } = useSpotlight('capture_button', userId);
  const [photo, setPhoto] = useState(null);

  const handleCapture = async () => {
    const captured = await takePicture();
    if (captured) setPhoto(captured);
  };

  const addToDex = async (result) => {
    try {
      const token = await getToken();

      if (!token) {
        Alert.alert('Erreur', 'Token manquant. Connecte-toi avant d\'ajouter une créature.');
        return;
      }

      const formData = new FormData();
      // Utilisation de l'animal_id recupéré de la classification ou 1 par défaut
      formData.append('species_id', result?.animal_id ? String(result.animal_id) : '1');
      formData.append('gamification_name', result?.common_name || result?.scientific_name || 'Créature inconnue');
      if (result?.scientific_name) {
        formData.append('scientific_name', result.scientific_name);
      }

      // On s'assure que la qualité du scan est aussi un entier
      const rawQuality = result?.sharpness_score ?? 95;
      const safeQuality = !isNaN(Number(rawQuality)) ? String(Math.round(Number(rawQuality))) : '95';
      formData.append('scan_quality', safeQuality);

      // Récupération dynamique de la position GPS
      let currentGpsLocation = 'Position inconnue';
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          currentGpsLocation = `${loc.coords.latitude}, ${loc.coords.longitude}`;
        }
      } catch (locErr) {
        console.warn('Erreur GPS:', locErr);
      }
      formData.append('gps_location', currentGpsLocation);

      // Envoi des stats dynamiques générées par le Python API en évitant le mot "undefined" et en Forçant un entier pour Postgres
      if (result?.final_stats) {
        if (result.final_stats.atk != null) formData.append('stat_atq', String(Math.round(result.final_stats.atk)));
        if (result.final_stats.defense != null) formData.append('stat_def', String(Math.round(result.final_stats.defense)));
        if (result.final_stats.hp != null) formData.append('stat_pv', String(Math.round(result.final_stats.hp)));
        if (result.final_stats.speed != null) formData.append('stat_speed', String(Math.round(result.final_stats.speed)));
      }

      // Fallback : toujours envoyer l'image_url du Python en cas d'échec de l'upload
      if (result?.image_url) {
        formData.append('scan_url', result.image_url);
      }

      // Ajout du fichier photo si présent (prioritaire sur scan_url côté backend)
      if (photo?.uri) {
        const filename = photo.uri.split('/').pop() || 'scan.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('image', {
          uri: photo.uri,
          name: filename,
          type: type,
        });
      }

      const debugPayload = {
        species_id: '1',
        gamification_name: result?.common_name || result?.scientific_name || 'Créature inconnue',
        scan_quality: safeQuality,
        gps_location: currentGpsLocation,
        hasPhoto: !!photo?.uri
      };

      if (result?.final_stats) {
        if (result.final_stats.atk != null) debugPayload.stat_atq = String(Math.round(result.final_stats.atk));
        if (result.final_stats.defense != null) debugPayload.stat_def = String(Math.round(result.final_stats.defense));
        if (result.final_stats.hp != null) debugPayload.stat_pv = String(Math.round(result.final_stats.hp));
        if (result.final_stats.speed != null) debugPayload.stat_speed = String(Math.round(result.final_stats.speed));
      }

      console.log('[addToDex] ---- RÉSUMÉ DES DONNÉES ENVOYÉES ----', JSON.stringify(debugPayload, null, 2));

      console.log('[addToDex] Envoi requête add creature avec FormData', {
        url: `${USER_API_URL}/api/user/creatures/add`,
        hasImage: !!photo?.uri,
      });

      const response = await fetch(`${USER_API_URL}/api/user/creatures/add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Surtout PAS de Content-Type ici, fetch va rajouter le boundary form-data tout seul
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      console.log('[addToDex] Réponse API add creature', {
        status: response.status,
        ok: response.ok,
        data,
      });

      if (!response.ok) {
        Alert.alert('Erreur', data?.message || data?.error || 'Impossible d\'ajouter la créature.');
        return;
      }

      Alert.alert('Succès', 'Créature ajoutée avec succès.');
      setPhoto(null);
    } catch (error) {
      console.error('[addToDex] Erreur réseau add creature', error);
      Alert.alert('Erreur', 'Erreur réseau lors de l\'ajout de la créature.');
    }
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>{fr.cameraScreen.ask_permission_desc}</Text>
        <Pressable onPress={requestPermission}>
          <Text>{fr.cameraScreen.button_permission_desc}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <View ref={ref} onLayout={onLayout} collapsable={false} style={styles.captureButton}>
          <Pressable onPress={handleCapture} style={styles.captureInner}>
            <Aperture size={32} style={styles.aperture} />
          </Pressable>
        </View>

        <InformationOrganisme photo={photo} onClose={() => setPhoto(null)} addToDex={addToDex} />
      </CameraView>
      <SpotlightTooltip
        visible={visible}
        targetLayout={targetLayout}
        description="Appuyez sur ce bouton pour photographier un animal ou une plante. L'IA l'identifie et vous pouvez l'ajouter à votre collection !"
        onDismiss={dismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 50 },
  camera: { flex: 1 },
  captureButton: {
    position: 'absolute',
    bottom: 64,
    left: '50%',
    marginLeft: -44,
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aperture: {
    width: 32,
    height: 32,
    color: "#ffffffbb",
  },
});