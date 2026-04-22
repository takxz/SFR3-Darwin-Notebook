import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import MapButton from './MapButton';
 
// ─── Mocks ────────────────────────────────────────────────────────────────────
 
jest.mock('@/assets/locales/fr.json', () => ({
  indexScreen: {
    mapTitle: 'Carte des captures',
    mapPermissionDenied: 'Permission de localisation refusée',
    mapLocating: 'Localisation en cours…',
    mapRetry: 'Réessayer',
    mapCreaturesFound: 'créatures trouvées',
    unknown: 'Inconnu',
  },
}));
 
jest.mock('@/assets/constants/colors', () => ({
  default: {
    blancJauni: '#FFFFF0',
    marronCuir: '#8B4513',
    blanc: '#FFFFFF',
    noir: '#000000',
    rouge: '#FF0000',
  },
}));
 
jest.mock('lucide-react-native', () => ({
  Map: () => null,
  MapPin: () => null,
  X: () => null,
  RefreshCw: () => null,
}));
 
jest.mock('@/utils/auth', () => ({
  getToken: jest.fn().mockResolvedValue('mock-token'),
}));
 
jest.mock('./MapButton.styles', () => ({
  styles: {
    container: {},
    mapButton: {},
    mapIcon: {},
    modalBackGround: {},
    modalContainer: {},
    modalHeader: {},
    mapPinContainer: {},
    mapPin: {},
    closeButton: {},
    modalTitle: {},
    refreshButton: {},
    mapContainer: {},
    map: {},
    overlay: {},
    statusText: {},
    errorText: {},
    retryButton: {},
    retryText: {},
    coordBar: {},
    coordText: {},
    creaturesCount: {},
  },
}));
 
// expo-location mock must be defined INSIDE the factory — jest.mock() is hoisted
// to the top of the file by Babel, so any variable defined outside the factory
// (like a const mockLocationModule = {...} above) is undefined when the factory runs.
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 48.8566, longitude: 2.3522 },
  }),
  Accuracy: { Balanced: 3 },
}));
 
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const MockMapView = ({ children }) => <View testID="map-view">{children}</View>;
  const MockMarker = ({ title }) => <View testID={`marker-${title}`} />;
  return { __esModule: true, default: MockMapView, Marker: MockMarker };
});
 
// ─── Fixtures ─────────────────────────────────────────────────────────────────
 
const mockLocation = { coords: { latitude: 48.8566, longitude: 2.3522 } };
 
const mockCreatures = [
  { id: 1, gamification_name: 'Renard roux', species_name: 'Vulpes vulpes', gps_location: '48.8566, 2.3522' },
  { id: 2, gamification_name: 'Loup gris',   species_name: 'Canis lupus',   gps_location: '45.7640, 4.8357' },
];
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
 
// Re-require Location after mocks are set up so we get the mocked version
function getLocationMock() {
  return require('expo-location');
}
 
function mockFetchSuccess() {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue({ id: 42 }) })
    .mockResolvedValueOnce({ ok: true, json: jest.fn().mockResolvedValue(mockCreatures) });
}
 
async function openModal() {
  render(<MapButton />);
  fireEvent.press(screen.getByTestId('map-open-button'));
  await waitFor(() => expect(screen.getByText('Carte des captures')).toBeTruthy());
}
 
// ─── Tests ────────────────────────────────────────────────────────────────────
 
describe('MapButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-apply default mock implementations after clearAllMocks resets them
    getLocationMock().requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
    getLocationMock().getCurrentPositionAsync.mockResolvedValue(mockLocation);
    mockFetchSuccess();
  });
 
  describe('Rendu initial', () => {
    it('doit se rendre sans erreur', () => {
      expect(() => render(<MapButton />)).not.toThrow();
    });
 
    it('doit afficher le bouton d\'ouverture', () => {
      render(<MapButton />);
      expect(screen.getByTestId('map-open-button')).toBeTruthy();
    });
 
    it('ne doit pas afficher la modale initialement', () => {
      render(<MapButton />);
      expect(screen.queryByText('Carte des captures')).toBeNull();
    });
  });
 
  describe('Ouverture de la modale', () => {
    it('doit afficher le titre de la modale après ouverture', async () => {
      await openModal();
      expect(screen.getByText('Carte des captures')).toBeTruthy();
    });
 
    it('doit afficher l\'indicateur de chargement au moment de l\'ouverture', async () => {
      // Delay location so the loading state is visible synchronously after press
      getLocationMock().getCurrentPositionAsync.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve(mockLocation), 500))
      );
 
      render(<MapButton />);
      fireEvent.press(screen.getByTestId('map-open-button'));
 
      // Synchronous check — fetch hasn't resolved yet
      expect(screen.getByText('Localisation en cours…')).toBeTruthy();
 
      // Let the delayed promise settle so it doesn't leak into the next test
      await waitFor(() =>
        expect(screen.queryByText('Localisation en cours…')).toBeNull(),
        { timeout: 2000 }
      );
    });
  });
 
  describe('Fermeture de la modale', () => {
    it('doit fermer la modale au clic sur le bouton de fermeture', async () => {
      await openModal();
      fireEvent.press(screen.getByTestId('map-close-button'));
      await waitFor(() => expect(screen.queryByText('Carte des captures')).toBeNull());
    });
  });
 
  describe('Permission refusée', () => {
    it('doit afficher un message d\'erreur si la permission est refusée', async () => {
      getLocationMock().requestForegroundPermissionsAsync.mockResolvedValueOnce({
        status: 'denied',
      });
 
      render(<MapButton />);
      fireEvent.press(screen.getByTestId('map-open-button'));
 
      await waitFor(() =>
        expect(screen.getByText('Permission de localisation refusée')).toBeTruthy()
      );
    });
  });
 
  describe('Données de localisation', () => {
    it('doit afficher les coordonnées après localisation', async () => {
      await openModal();
      await waitFor(() =>
        expect(screen.getByText(/48\.85660°, 2\.35220°/)).toBeTruthy()
      );
    });
 
    it('doit appeler getCurrentPositionAsync à l\'ouverture', async () => {
      await openModal();
      expect(getLocationMock().getCurrentPositionAsync).toHaveBeenCalledTimes(1);
    });
  });
 
  describe('Créatures sur la carte', () => {
    it('doit afficher le nombre de créatures trouvées', async () => {
      await openModal();
      await waitFor(() =>
        expect(screen.getByText('2 créatures trouvées')).toBeTruthy()
      );
    });
 
    it('doit appeler l\'API des créatures avec le bon userId', async () => {
      await openModal();
      await waitFor(() =>
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user/42/creatures'),
          expect.any(Object)
        )
      );
    });
  });
 
  describe('Sans token', () => {
    it('ne doit pas appeler l\'API si le token est absent', async () => {
      const { getToken } = require('@/utils/auth');
      getToken.mockResolvedValueOnce(null);
 
      render(<MapButton />);
      fireEvent.press(screen.getByTestId('map-open-button'));
 
      await waitFor(() =>
        expect(screen.getByText(/48\.85660°/)).toBeTruthy()
      );
 
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/user/profile'),
        expect.any(Object)
      );
    });
  });
});