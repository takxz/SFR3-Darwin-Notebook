import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CameraScreen from '../camera';

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: { hostUri: 'localhost:8081' }
}));

// Mock useCamera hook
const mockTakePicture = jest.fn();
const mockRequestPermission = jest.fn();
jest.mock('../../../src/hooks/useCamera.jsx', () => ({
  useCamera: () => ({
    permission: { granted: true },
    requestPermission: mockRequestPermission,
    cameraRef: { current: {} },
    takePicture: mockTakePicture,
  }),
}));

// Mock expo-camera
jest.mock('expo-camera', () => {
  const { View } = require('react-native');
  return {
    CameraView: ({ children }) => <View testID="camera-view">{children}</View>,
  };
});

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: 0, longitude: 0 } }),
  Accuracy: { Balanced: 3 }
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Aperture: () => 'ApertureIcon',
}));

// Mock utils
jest.mock('../../../src/utils/auth.js', () => ({
  getToken: jest.fn().mockResolvedValue('fake-token'),
}));

// Mock InformationOrganisme
jest.mock('../../../src/components/InformationOrganisme', () => {
  const { View, Pressable, Text } = require('react-native');
  return ({ photo, onFinish, onClose }) => {
    if (!photo) return null;
    return (
      <View testID="mock-info-organisme">
        <Pressable testID="btn-finish" onPress={onFinish}>
          <Text>Finish</Text>
        </Pressable>
        <Pressable testID="btn-close" onPress={onClose}>
          <Text>Close</Text>
        </Pressable>
      </View>
    );
  };
});

describe('CameraScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with camera permission', () => {
    const { getByTestId } = render(<CameraScreen />);
    expect(getByTestId('camera-view')).toBeTruthy();
  });

  it('handles capture press, sets processing state, and blocks further presses', async () => {
    // Delay takePicture to check intermediate state
    mockTakePicture.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ base64: 'test', uri: 'test-uri' }), 100)));

    
    const { getByTestId } = render(<CameraScreen />);
    const captureButton = getByTestId('capture-button');
    
    // Initial state: not disabled
    expect(captureButton.props.disabled).toBeFalsy();

    // First press
    fireEvent.press(captureButton);

    // Wait for the async state update to set isProcessing to true
    await waitFor(() => {
      const style = captureButton.props.style;
      const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
      expect(flatStyle.opacity).toBe(0.3);
    });

    // Second press should not call takePicture again
    fireEvent.press(captureButton);
    expect(mockTakePicture).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      // After mockTakePicture resolves, photo is set, InformationOrganisme mounts
      expect(getByTestId('mock-info-organisme')).toBeTruthy();
    });

    // The button should remain disabled while InformationOrganisme is processing
    const styleAfterCapture = captureButton.props.style;
    const flatStyleAfter = Array.isArray(styleAfterCapture) ? Object.assign({}, ...styleAfterCapture) : styleAfterCapture;
    expect(flatStyleAfter.opacity).toBe(0.3);
  });

  it('unblocks the capture button when InformationOrganisme finishes', async () => {
    mockTakePicture.mockResolvedValueOnce({ base64: 'test', uri: 'test-uri' });
    
    const { getByTestId, queryByTestId } = render(<CameraScreen />);
    const captureButton = getByTestId('capture-button');
    
    fireEvent.press(captureButton);

    await waitFor(() => {
      expect(getByTestId('mock-info-organisme')).toBeTruthy();
    });

    // Simulate API finish inside InformationOrganisme
    fireEvent.press(getByTestId('btn-finish'));

    await waitFor(() => {
      // Button should be active again (opacity 1)
      const style = captureButton.props.style;
      const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
      expect(flatStyle.opacity).not.toBe(0.3);
    });

    // Modale is still visible until photo is set to null, but button is unblocked!
    expect(queryByTestId('mock-info-organisme')).toBeTruthy();
  });

  it('unblocks the capture button and hides modal when closed', async () => {
    mockTakePicture.mockResolvedValueOnce({ base64: 'test', uri: 'test-uri' });

    
    const { getByTestId, queryByTestId } = render(<CameraScreen />);
    const captureButton = getByTestId('capture-button');
    
    fireEvent.press(captureButton);

    await waitFor(() => {
      expect(getByTestId('mock-info-organisme')).toBeTruthy();
    });

    // Simulate user closing the modal (e.g. taking another photo or manual close)
    fireEvent.press(getByTestId('btn-close'));

    await waitFor(() => {
      const style = captureButton.props.style;
      const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
      expect(flatStyle.opacity).not.toBe(0.3);
      expect(queryByTestId('mock-info-organisme')).toBeNull();
    });
  });

  it('unblocks the capture button if takePicture fails', async () => {
    mockTakePicture.mockRejectedValueOnce(new Error('Camera failed'));
    
    const { getByTestId, queryByTestId } = render(<CameraScreen />);
    const captureButton = getByTestId('capture-button');
    
    fireEvent.press(captureButton);

    await waitFor(() => {
      // Should not mount the modal
      expect(queryByTestId('mock-info-organisme')).toBeNull();
      // Button should be active again
      const style = captureButton.props.style;
      const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
      expect(flatStyle.opacity).not.toBe(0.3);
    });
  });

});
