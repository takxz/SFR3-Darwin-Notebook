import { useState } from 'react';
import { View, Text, Alert, StyleSheet, Pressable } from 'react-native';
import { CameraView } from 'expo-camera';
import { Aperture } from 'lucide-react-native';
import { useCamera } from '../../src/hooks/useCamera.jsx';
import InformationOrganisme from '../../src/components/InformationOrganisme.jsx';
import fr from '../../src/assets/locales/fr.json';
import { getToken } from '../../src/utils/auth.js';

const USER_API_URL = process.env.EXPO_PUBLIC_USER_API_URL || 'http://localhost:3001';

export default function CameraScreen() {
  const { permission, requestPermission, cameraRef, takePicture } = useCamera();
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

      const payload = {
        species_id: Number(result?.animal_id) || 1,
        gamification_name: result?.common_name || result?.scientific_name || 'Créature inconnue',
        scan_url: result?.image_url || photo?.uri || '',
        scan_quality: 95,
        gps_location: '48.8584, 2.2945',
      };

      console.log('[addToDex] Envoi requête add creature', {
        url: `${USER_API_URL}/api/user/creatures/add`,
        hasToken: Boolean(token),
        payload,
      });

      const response = await fetch(`${USER_API_URL}/api/user/creatures/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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
        <Pressable onPress={handleCapture} style={styles.captureButton}>
          <View style={styles.captureInner}>
            <Aperture size={32} style={styles.aperture} />
          </View>
        </Pressable>

        <InformationOrganisme photo={photo} onClose={() => setPhoto(null)} addToDex={addToDex} />
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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