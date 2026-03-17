import { View, Text, Button, StyleSheet, Pressable } from 'react-native';
import { CameraView } from 'expo-camera';
import { Aperture } from 'lucide-react-native';
import { useCamera } from '../../src/hooks/useCamera';

export default function CameraScreen() {
  const { permission, requestPermission, cameraRef, takePicture, isCapturing } = useCamera();

  const handleCapture = async () => {
    try {
      await takePicture();
    } catch (error) {
      console.warn('Erreur de capture:', error);
    }
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
        <Pressable
          onPress={handleCapture}
          disabled={isCapturing}
          style={{
            position: 'absolute',
            bottom: 128,
            left: '50%',
            marginLeft: -48,
            width: 96,
            height: 96,
            borderRadius: 48,
            borderWidth: 4,
            borderColor: 'rgba(168,220,171,0.3)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
            opacity: isCapturing ? 0.6 : 1,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.5)',
              shadowColor: '#2E6F40',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.2,
              shadowRadius: 30,
            }}
          >
            <Aperture size={32} color="rgba(255,255,255,0.8)" />
          </View>
        </Pressable>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
});