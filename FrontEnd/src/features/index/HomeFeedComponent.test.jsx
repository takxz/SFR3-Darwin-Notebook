import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import HomeFeedComponent from './HomeFeedComponent';
 
// ─── Mocks ────────────────────────────────────────────────────────────────────
 
jest.mock('@/assets/locales/fr.json', () => ({
  indexScreen: {
    dataLoading: 'Chargement…',
    unknown: 'Inconnu',
    hasCatch: 'a capturé',
    unreachableImage: 'Image non disponible',
  },
}));
 
jest.mock('@/assets/constants/colors.json', () => ({
  blancJauni: '#FFFFF0',
  marronCuir: '#8B4513',
  blanc: '#FFFFFF',
  noir: '#000000',
  fondGrisVert: '#E8E8E0',
}));
 
jest.mock('@/utils/auth', () => ({
  getToken: jest.fn().mockResolvedValue('mock-token'),
}));
 
jest.mock('expo-constants', () => ({
  expoConfig: { hostUri: 'localhost:8081' },
}));
 
jest.mock('expo-location', () => ({
  reverseGeocodeAsync: jest.fn().mockResolvedValue([{ city: 'Paris', country: 'France' }]),
}));
 
jest.mock('lucide-react-native', () => ({
  MapPin: () => null,
  Sparkles: () => null,
}));
 
// ─── Fixtures ─────────────────────────────────────────────────────────────────
 
const mockCreatures = [
  {
    id: 1,
    pseudo: 'HunterX',
    gamification_name: 'Renard roux',
    scan_url: 'https://example.com/scan1.jpg',
    gps_location: '48.8566, 2.3522',
    scan_quality: 'Excellent',
    scan_date: new Date().toISOString(),
  },
  {
    id: 2,
    pseudo: 'NatureWatcher',
    gamification_name: 'Loup gris',
    scan_url: 'https://example.com/scan2.jpg',
    gps_location: '45.7640, 4.8357',
    scan_quality: 'Bon',
    scan_date: new Date().toISOString(),
  },
];
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
 
function mockFetchSuccess(data = mockCreatures) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue(data),
  });
}
 
function mockFetchError(message = 'Erreur réseau') {
  global.fetch = jest.fn().mockRejectedValue(new Error(message));
}
 
function mockFetchBadStatus(body = {}) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    json: jest.fn().mockResolvedValue(body),
  });
}
 
// Renders and waits for the loading state to disappear, meaning all async
// effects (fetch + setState) have settled. Use this instead of wrapping
// render() in act() — RNTL unmounts the renderer inside act, causing
// "Can't access .root on unmounted test renderer".
async function renderAndSettle() {
  render(<HomeFeedComponent />);
  // Wait until the loading indicator is gone (fetch has resolved)
  await waitFor(() =>
    expect(screen.queryByText('Chargement…')).toBeNull(),
    { timeout: 3000 }
  );
}
 
// ─── Tests ────────────────────────────────────────────────────────────────────
 
describe('HomeFeedComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
 
  describe('État de chargement', () => {
    it('doit afficher le message de chargement avant la résolution du fetch', () => {
      // Delay fetch so loading state is visible synchronously right after render
      global.fetch = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockCreatures),
        }), 500))
      );
 
      render(<HomeFeedComponent />);
      // Checked synchronously — fetch hasn't resolved yet
      expect(screen.getByText('Chargement…')).toBeTruthy();
    });
  });
 
  describe('Chargement réussi', () => {
    it('doit afficher les créatures après chargement', async () => {
      mockFetchSuccess();
      render(<HomeFeedComponent />);
 
      await waitFor(() => expect(screen.getByText('HunterX')).toBeTruthy());
      expect(screen.getByText('Renard roux')).toBeTruthy();
      expect(screen.getByText('NatureWatcher')).toBeTruthy();
      expect(screen.getByText('Loup gris')).toBeTruthy();
    });
 
    it('doit afficher toutes les cards quand plusieurs créatures sont retournées', async () => {
      mockFetchSuccess();
      render(<HomeFeedComponent />);
 
      await waitFor(() => {
        expect(screen.getByText('HunterX')).toBeTruthy();
        expect(screen.getByText('NatureWatcher')).toBeTruthy();
      });
    });
 
    it('doit appeler fetch avec le bon endpoint et le token', async () => {
      mockFetchSuccess();
      render(<HomeFeedComponent />);
 
      await waitFor(() =>
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/user/creatures/last-captured'),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-token',
            }),
          })
        )
      );
    });
 
    it('doit afficher le message de chargement si la liste est vide', async () => {
      mockFetchSuccess([]);
      render(<HomeFeedComponent />);
 
      // Wait for fetch to settle, then check empty-list fallback
      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
      expect(screen.getByText('Chargement…')).toBeTruthy();
    });
  });
 
  describe('Gestion des erreurs', () => {
    it('doit afficher un message d\'erreur si fetch échoue', async () => {
      mockFetchError('Erreur réseau');
      render(<HomeFeedComponent />);
 
      await waitFor(() => expect(screen.getByText('Erreur réseau')).toBeTruthy());
    });
 
    it('doit afficher l\'erreur retournée par l\'API', async () => {
      mockFetchBadStatus({ error: 'Token invalide' });
      render(<HomeFeedComponent />);
 
      await waitFor(() => expect(screen.getByText('Token invalide')).toBeTruthy());
    });
 
    it('doit afficher le message par défaut si l\'API ne retourne pas d\'erreur précise', async () => {
      mockFetchBadStatus({});
      render(<HomeFeedComponent />);
 
      await waitFor(() =>
        expect(screen.getByText('Impossible de charger les dernières captures.')).toBeTruthy()
      );
    });
 
    it('doit afficher une erreur si le token est manquant', async () => {
      const { getToken } = require('@/utils/auth');
      getToken.mockResolvedValueOnce(null);
      render(<HomeFeedComponent />);
 
      await waitFor(() =>
        expect(screen.getByText('Token manquant. Veuillez vous reconnecter.')).toBeTruthy()
      );
    });
  });
 
  describe('ScrollView', () => {
    it('doit rendre un ScrollView', async () => {
      mockFetchSuccess();
      const { UNSAFE_getByType } = render(<HomeFeedComponent />);
      const { ScrollView } = require('react-native');
 
      // ScrollView is present immediately — no need to wait
      expect(UNSAFE_getByType(ScrollView)).toBeTruthy();
 
      // Settle async effects so they don't leak into the next test
      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    });
  });
 
  describe('Formatage de la date', () => {
    it('doit afficher une date formatée en français', async () => {
      mockFetchSuccess([{
        ...mockCreatures[0],
        scan_date: '2024-06-15T14:30:00.000Z',
      }]);
      render(<HomeFeedComponent />);
 
      await waitFor(() => expect(screen.getByText('HunterX')).toBeTruthy());
      expect(screen.getByText(/15\/06\/2024/)).toBeTruthy();
    });
  });
});