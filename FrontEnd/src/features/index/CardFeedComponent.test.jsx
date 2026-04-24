import React from 'react';
import { render, screen } from '@testing-library/react-native';
import CardFeedComponent from './CardFeedComponent';

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  MapPin: () => null,
  Sparkles: () => null,
}));

// Mock assets
jest.mock('@/assets/locales/fr.json', () => ({
  indexScreen: {
    hasCatch: 'a capturé',
    unreachableImage: 'Image non disponible',
    unknown: 'Inconnu',
  },
}));

jest.mock('@/assets/constants/colors.json', () => ({
  blancJauni: '#FFFFF0',
  marronCuir: '#8B4513',
  blanc: '#FFFFFF',
  noir: '#000000',
  fondGrisVert: '#E8E8E0',
}));

const defaultProps = {
  pseudo: 'HunterX',
  animal_name: 'Renard roux',
  scan_url: 'https://example.com/scan.jpg',
  gps_location: 'Paris, France',
  scan_quality: 'Excellent',
  scan_date: '01/01/2024 14:30',
};

describe('CardFeedComponent', () => {
  describe('Rendu de base', () => {
    it('doit se rendre sans erreur', () => {
      expect(() => render(<CardFeedComponent {...defaultProps} />)).not.toThrow();
    });

    it('doit afficher le pseudo', () => {
      render(<CardFeedComponent {...defaultProps} />);
      expect(screen.getByText('HunterX')).toBeTruthy();
    });

    it('doit afficher le texte "a capturé"', () => {
      render(<CardFeedComponent {...defaultProps} />);
      expect(screen.getByText('a capturé')).toBeTruthy();
    });

    it('doit afficher le nom de l\'animal', () => {
      render(<CardFeedComponent {...defaultProps} />);
      expect(screen.getByText('Renard roux')).toBeTruthy();
    });

    it('doit afficher la date', () => {
      render(<CardFeedComponent {...defaultProps} />);
      expect(screen.getByText(/01\/01\/2024 14:30/)).toBeTruthy();
    });

    it('doit afficher la localisation GPS', () => {
      render(<CardFeedComponent {...defaultProps} />);
      expect(screen.getByText(/Paris, France/)).toBeTruthy();
    });

    it('doit afficher la qualité du scan', () => {
      render(<CardFeedComponent {...defaultProps} />);
      expect(screen.getByText('Excellent')).toBeTruthy();
    });
  });

  describe('Image', () => {
    it('doit afficher une Image si scan_url est fourni', () => {
      render(<CardFeedComponent {...defaultProps} />);
      const image = screen.queryByRole('image') ?? screen.UNSAFE_queryByType(require('react-native').Image);
      expect(image).toBeTruthy();
    });

    it('doit afficher le message d\'erreur si scan_url est absent', () => {
      render(<CardFeedComponent {...defaultProps} scan_url={null} />);
      expect(screen.getByText('Image non disponible')).toBeTruthy();
    });

    it('doit afficher le message d\'erreur si scan_url est undefined', () => {
      render(<CardFeedComponent {...defaultProps} scan_url={undefined} />);
      expect(screen.getByText('Image non disponible')).toBeTruthy();
    });
  });

  describe('Valeurs manquantes', () => {
    it('doit afficher "Inconnu" si scan_quality est null', () => {
      render(<CardFeedComponent {...defaultProps} scan_quality={null} />);
      expect(screen.getByText('Inconnu')).toBeTruthy();
    });

    it('doit afficher "Inconnu" si scan_quality est undefined', () => {
      render(<CardFeedComponent {...defaultProps} scan_quality={undefined} />);
      expect(screen.getByText('Inconnu')).toBeTruthy();
    });

    it('doit afficher la localisation si gps_location est fourni', () => {
      render(<CardFeedComponent {...defaultProps} gps_location="Lyon, France" />);
      expect(screen.getByText(/Lyon, France/)).toBeTruthy();
    });
  });
});
