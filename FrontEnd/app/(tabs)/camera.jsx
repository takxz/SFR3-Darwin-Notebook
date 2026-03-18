import { useState } from 'react';
import { View, Text, Button, StyleSheet, Pressable } from 'react-native';
import { CameraView } from 'expo-camera';
import { Aperture } from 'lucide-react-native';
import { useCamera } from '../../src/hooks/useCamera.jsx';
import InformationOrganisme from '../../src/components/InformationOrganisme.jsx';

export default function CameraScreen() {
  const { permission, requestPermission, cameraRef, takePicture } = useCamera();
  const [photo, setPhoto] = useState(null);

  const handleCapture = async () => {
    const captured = await takePicture();
    if (captured) setPhoto(captured);
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>Nous avons besoin de votre permission pour utiliser la caméra</Text>
        <Button title="Accorder la permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <Pressable onPress={handleCapture} style={styles.captureButton}>
          <View style={styles.captureInner}>
            <Aperture size={32} color="rgba(255,255,255,0.8)" />
          </View>
        </Pressable>

        <InformationOrganisme photo={photo} onClose={() => setPhoto(null)} />
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
});