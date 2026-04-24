import React from 'react';
import { render, screen } from '@testing-library/react-native';
import IndexScreen from './IndexScreen';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/assets/locales/fr.json', () => ({
  indexScreen: {
    lastCatch: 'Dernières captures',
    dataLoading: 'Chargement…',
    unknown: 'Inconnu',
    hasCatch: 'a capturé',
    unreachableImage: 'Image non disponible',
    mapTitle: 'Carte',
    mapPermissionDenied: 'Permission refusée',
    mapLocating: 'Localisation…',
    mapRetry: 'Réessayer',
    mapCreaturesFound: 'créatures trouvées',
  },
  tutorial: {
    map: 'Ce bouton ouvre la carte interactive.',
    dismiss: 'Compris !',
  },
}));

jest.mock('@/hooks/useSpotlight', () => ({
  useSpotlight: () => ({
    visible: false,
    targetLayout: null,
    ref: { current: null },
    onLayout: jest.fn(),
    dismiss: jest.fn(),
  }),
}));

jest.mock('@/hooks/useUserId', () => ({
  useUserId: () => 'test-user-id',
}));

jest.mock('@/components/SpotlightTooltip', () => {
  const { View } = require('react-native');
  return function MockSpotlightTooltip() {
    return <View testID="spotlight-tooltip" />;
  };
});

jest.mock('@/assets/constants/colors', () => ({
  default: {
    blancJauni: '#FFFFF0',
    marronCuir: '#8B4513',
    blanc: '#FFFFFF',
    noir: '#000000',
    fondGrisVert: '#E8E8E0',
    rouge: '#FF0000',
  },
}));

// Mock child components to isolate IndexScreen rendering
jest.mock('@/features/index/MapButton', () => {
  const { View, Text } = require('react-native');
  return function MockMapButton() {
    return <View testID="map-button"><Text>MapButton</Text></View>;
  };
});

jest.mock('@/features/index/HomeFeedComponent', () => {
  const { View, Text } = require('react-native');
  return function MockHomeFeedComponent() {
    return <View testID="home-feed"><Text>HomeFeed</Text></View>;
  };
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('IndexScreen', () => {
  describe('Rendu de base', () => {
    it('doit se rendre sans erreur', () => {
      expect(() => render(<IndexScreen />)).not.toThrow();
    });

    it('doit afficher le titre "Dernières captures"', () => {
      render(<IndexScreen />);
      expect(screen.getByText('Dernières captures')).toBeTruthy();
    });

    it('doit rendre le MapButton', () => {
      render(<IndexScreen />);
      expect(screen.getByTestId('map-button')).toBeTruthy();
    });

    it('doit rendre le HomeFeedComponent', () => {
      render(<IndexScreen />);
      expect(screen.getByTestId('home-feed')).toBeTruthy();
    });
  });

  describe('Structure', () => {
    it('doit avoir un conteneur principal', () => {
      const { UNSAFE_getAllByType } = render(<IndexScreen />);
      const { View } = require('react-native');
      const views = UNSAFE_getAllByType(View);
      expect(views.length).toBeGreaterThan(0);
    });

    it('doit afficher le header avec le titre et le bouton carte', () => {
      render(<IndexScreen />);
      expect(screen.getByText('Dernières captures')).toBeTruthy();
      expect(screen.getByTestId('map-button')).toBeTruthy();
    });

    it('doit afficher le feed sous le header', () => {
      render(<IndexScreen />);
      expect(screen.getByTestId('home-feed')).toBeTruthy();
    });
  });
});
