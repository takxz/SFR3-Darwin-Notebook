import { useEffect, useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';

export const useCamera = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cameraRef.current = null;
    };
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) {
      return null;
    }

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync();
      if (isMountedRef.current) {
        console.log(photo?.uri);
      }
      return photo;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('Camera unmounted during taking photo process')) {
        throw error;
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsCapturing(false);
      }
    }
  };

  return { permission, requestPermission, cameraRef, takePicture, isCapturing };
};