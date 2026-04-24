import { renderHook, act } from '@testing-library/react-native';
import { useCamera } from './useCamera';
import * as expoCamera from 'expo-camera';

// Mock expo-camera
jest.mock('expo-camera', () => ({
  useCameraPermissions: jest.fn(),
}));

describe('useCamera Hook', () => {
  const mockRequestPermission = jest.fn();
  const mockPermission = { granted: true };

  beforeEach(() => {
    jest.clearAllMocks();
    expoCamera.useCameraPermissions.mockReturnValue([mockPermission, mockRequestPermission]);
  });

  it('dois retourner permission, requestPermission, cameraRef, et takePicture', () => {
    const { result } = renderHook(() => useCamera());

    expect(result.current.permission).toEqual(mockPermission);
    expect(result.current.requestPermission).toBeDefined();
    expect(result.current.cameraRef).toBeDefined();
    expect(result.current.takePicture).toBeDefined();
  });

  it('doit appeler useCameraPermissions depuis expo-camera', () => {
    renderHook(() => useCamera());

    expect(expoCamera.useCameraPermissions).toHaveBeenCalled();
  });

  it('doit retourner null lorsque takePicture est appelée sans référence à la caméra', async () => {
    const { result } = renderHook(() => useCamera());

    let pictureResult;
    await act(async () => {
      pictureResult = await result.current.takePicture();
    });

    expect(pictureResult).toBeNull();
  });

  it('doit prendre une photo lorsque la référence à la caméra est disponible', async () => {
    const mockPhotoData = {
      uri: 'file:///path/to/photo.jpg',
      base64: 'base64data...',
      width: 1920,
      height: 1080,
    };

    const { result } = renderHook(() => useCamera());

    // Set up mock camera ref
    await act(async () => {
      result.current.cameraRef.current = {
        takePictureAsync: jest.fn().mockResolvedValue(mockPhotoData),
      };
    });

    let pictureResult;
    await act(async () => {
      pictureResult = await result.current.takePicture();
    });

    expect(pictureResult).toEqual(mockPhotoData);
    expect(result.current.cameraRef.current.takePictureAsync).toHaveBeenCalledWith({
      base64: true,
      quality: 0.8,
    });
  });

  it('doit gérer l\'erreur camera.takePictureAsync et retourner null', async () => {
    const { result } = renderHook(() => useCamera());
    const mockError = new Error('Camera failed');

    // Set up mock camera ref that throws an error
    await act(async () => {
      result.current.cameraRef.current = {
        takePictureAsync: jest.fn().mockRejectedValue(mockError),
      };
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    let pictureResult;
    await act(async () => {
      pictureResult = await result.current.takePicture();
    });

    expect(pictureResult).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Erreur de capture:', mockError);
    consoleSpy.mockRestore();
  });

  it('doit demander la permission de la caméra lorsque la permission est refusée', () => {
    expoCamera.useCameraPermissions.mockReturnValue([
      { granted: false },
      mockRequestPermission,
    ]);

    const { result } = renderHook(() => useCamera());

    expect(result.current.permission.granted).toBe(false);
    expect(result.current.requestPermission).toBeDefined();
  });

  it('doit utiliser les paramètres corrects pour la qualité de l\'image et base64', async () => {
    const mockPhotoData = { uri: 'file://photo.jpg', base64: 'data' };
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      result.current.cameraRef.current = {
        takePictureAsync: jest.fn().mockResolvedValue(mockPhotoData),
      };
    });

    await act(async () => {
      await result.current.takePicture();
    });

    // Verify that quality and base64 options are passed correctly
    expect(result.current.cameraRef.current.takePictureAsync).toHaveBeenCalledWith({
      base64: true,
      quality: 0.8,
    });
  });
});
