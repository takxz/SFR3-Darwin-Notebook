import { useRef } from 'react';
import { useCameraPermissions } from 'expo-camera';

export const useCamera = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const takePicture = async () => {
    if (!cameraRef.current) {
      return null;
    }

    try {
      return await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });
    } catch (error) {
      console.warn('Erreur de capture:', error);
      return null;
    }
  };

  return { permission, requestPermission, cameraRef, takePicture };
};