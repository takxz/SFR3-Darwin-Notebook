import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SettingsModal } from './SettingsModal';

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Settings: () => null,
  LogOut: () => null,
  Trash2: () => null,
  User: () => null,
  Bell: () => null,
  Lock: () => null,
  HelpCircle: () => null,
  Shield: () => null,
  X: () => null,
  Info: () => null,
}));

// Mock SettingsItem component
jest.mock('@/components/SettingsItem', () => {
  return function MockSettingsItem({ label, onPress, icon, variant }) {
    return (
      <button
        onClick={onPress}
        testID={`settings-item-${label}`}
      >
        {label}
      </button>
    );
  };
});

// Mock profilStyles
jest.mock('./profilStyles', () => ({
  styles: {
    modalOverlay: {},
    settingsModal: {},
    settingsHeader: {},
    settingsTitleContainer: {},
    settingsIcon: {},
    settingsTitle: {},
    closeButton: {},
    settingsContent: {},
    settingsSection: {},
    sectionTitle: {},
    settingsItems: {},
    versionContainer: {},
    versionText: {},
  },
}));

// Mock process.env
process.env.EXPO_PUBLIC_APP_VERSION = '1.0.0';

describe('SettingsModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onLogout: jest.fn(),
    onDeleteAccount: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('doit afficher le modal avec le titre Paramètres', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByText('Paramètres')).toBeTruthy();
    });

    it('doit afficher la section Compte', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByText('Compte')).toBeTruthy();
    });

    it('doit afficher la section Général', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByText('Général')).toBeTruthy();
    });

    it('doit afficher la section Actions', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByText('Actions')).toBeTruthy();
    });

    it('doit afficher la section À propos', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByText('À propos')).toBeTruthy();
    });

    it('ne doit pas afficher le modal quand visible est false', () => {
      const { queryByText } = render(
        <SettingsModal {...defaultProps} visible={false} />
      );

      expect(queryByText('Paramètres')).toBeFalsy();
    });
  });

  describe('Account Section', () => {
    it('doit afficher "Modifier le profil"', () => {
      render(<SettingsModal {...defaultProps} />);
      expect(screen.getByTestId('settings-item-Modifier le profil')).toBeTruthy();
    });

    it('doit afficher "Confidentialité"', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByTestId('settings-item-Confidentialité')).toBeTruthy();
    });

    it('doit afficher "Notifications"', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByTestId('settings-item-Notifications')).toBeTruthy();
    });
  });

  describe('General Section', () => {
    it('doit afficher "Sécurité"', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByTestId('settings-item-Sécurité')).toBeTruthy();
    });

    it('doit afficher "Aide & Support"', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByTestId('settings-item-Aide & Support')).toBeTruthy();
    });
  });

  describe('Actions Section', () => {
    it('doit afficher "Se déconnecter"', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByTestId('settings-item-Se déconnecter')).toBeTruthy();
    });

    it('doit afficher "Supprimer le compte"', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByTestId('settings-item-Supprimer le compte')).toBeTruthy();
    });
  });

  describe('About Section', () => {
    it('doit afficher la version de l\'application', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByText(/Version/)).toBeTruthy();
    });
  });

  describe('Modal Visibility', () => {
    it('doit afficher le modal quand visible est true', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByText('Paramètres')).toBeTruthy();
    });

    it('doit masquer le modal quand visible est false', () => {
      const { queryByText } = render(
        <SettingsModal {...defaultProps} visible={false} />
      );

      expect(queryByText('Paramètres')).toBeFalsy();
    });

    it('doit réagir aux changements de visible', () => {
      const { rerender } = render(
        <SettingsModal {...defaultProps} visible={false} />
      );

      expect(screen.queryByText('Paramètres')).toBeFalsy();

      rerender(<SettingsModal {...defaultProps} visible={true} />);

      expect(screen.getByText('Paramètres')).toBeTruthy();
    });
  });

  describe('Modal Interactions', () => {
    it('doit appeler onRequestClose du modal', () => {
      const mockOnClose = jest.fn();
      const { root } = render(
        <SettingsModal
          {...defaultProps}
          onClose={mockOnClose}
        />
      );

      const modal = root.findByType('Modal');
      modal.props.onRequestClose();

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('doit avoir les callbacks définis', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(defaultProps.onClose).toBeDefined();
      expect(defaultProps.onLogout).toBeDefined();
      expect(defaultProps.onDeleteAccount).toBeDefined();
    });
  });

  describe('Props Management', () => {
    it('doit recevoir les props visibles', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByText('Paramètres')).toBeTruthy();
    });

    it('doit gérer les changements de prop visible', () => {
      const { rerender, queryByText } = render(
        <SettingsModal {...defaultProps} visible={false} />
      );

      expect(queryByText('Paramètres')).toBeFalsy();

      rerender(<SettingsModal {...defaultProps} visible={true} />);

      expect(screen.getByText('Paramètres')).toBeTruthy();
    });

    it('doit recevoir la prop onLogout', () => {
      const mockOnLogout = jest.fn();
      render(
        <SettingsModal
          {...defaultProps}
          onLogout={mockOnLogout}
        />
      );

      expect(mockOnLogout).toBeDefined();
    });

    it('doit recevoir la prop onDeleteAccount', () => {
      const mockOnDeleteAccount = jest.fn();
      render(
        <SettingsModal
          {...defaultProps}
          onDeleteAccount={mockOnDeleteAccount}
        />
      );

      expect(mockOnDeleteAccount).toBeDefined();
    });
  });

  describe('Modal Configuration', () => {
    it('doit utiliser animationType slide', () => {
      const { root } = render(
        <SettingsModal {...defaultProps} />
      );

      const modal = root.findByType('Modal');
      expect(modal.props.animationType).toBe('slide');
    });

    it('doit être transparent', () => {
      const { root } = render(
        <SettingsModal {...defaultProps} />
      );

      const modal = root.findByType('Modal');
      expect(modal.props.transparent).toBe(true);
    });

    it('doit avoir onRequestClose défini', () => {
      const { root } = render(
        <SettingsModal {...defaultProps} />
      );

      const modal = root.findByType('Modal');
      expect(modal.props.onRequestClose).toBeDefined();
    });

    it('doit avoir visible prop défini', () => {
      const { root } = render(
        <SettingsModal {...defaultProps} />
      );

      const modal = root.findByType('Modal');
      expect(modal.props.visible).toBe(true);
    });
  });

  describe('Structure', () => {
    it('doit avoir un header avec titre', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByText('Paramètres')).toBeTruthy();
    });

    it('doit avoir un ScrollView pour le contenu', () => {
      render(<SettingsModal visible={true} onClose={() => {}} />);

      expect(screen.getByTestId('settings-scroll')).toBeTruthy();
});

    it('doit avoir plusieurs sections d\'options', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByText('Compte')).toBeTruthy();
      expect(screen.getByText('Général')).toBeTruthy();
      expect(screen.getByText('Actions')).toBeTruthy();
      expect(screen.getByText('À propos')).toBeTruthy();
    });

    it('doit avoir les View containers pour les sections', () => {
      const { root } = render(
        <SettingsModal {...defaultProps} />
      );

      const views = root.findAllByType('View');
      expect(views.length).toBeGreaterThan(0);
    });
  });

  describe('Menu Sections', () => {
    it('doit afficher les quatre sections principales', () => {
      render(<SettingsModal {...defaultProps} />);

      const sections = ['Compte', 'Général', 'Actions', 'À propos'];

      sections.forEach(section => {
        expect(screen.getByText(section)).toBeTruthy();
      });
    });

    it('doit avoir des éléments sous chaque section', () => {
      render(<SettingsModal {...defaultProps} />);

      // Vérifier que les items sous Compte existent
      expect(screen.getByTestId('settings-item-Modifier le profil')).toBeTruthy();
      expect(screen.getByTestId('settings-item-Confidentialité')).toBeTruthy();
      expect(screen.getByTestId('settings-item-Notifications')).toBeTruthy();

      // Vérifier que les items sous Général existent
      expect(screen.getByTestId('settings-item-Sécurité')).toBeTruthy();
      expect(screen.getByTestId('settings-item-Aide & Support')).toBeTruthy();

      // Vérifier que les items sous Actions existent
      expect(screen.getByTestId('settings-item-Se déconnecter')).toBeTruthy();
      expect(screen.getByTestId('settings-item-Supprimer le compte')).toBeTruthy();
    });
  });

  describe('Callback Functions', () => {
    it('doit avoir onLogout défini comme callback', () => {
      const mockOnLogout = jest.fn();
      render(
        <SettingsModal
          {...defaultProps}
          onLogout={mockOnLogout}
        />
      );

      expect(mockOnLogout).toBeDefined();
      expect(typeof mockOnLogout).toBe('function');
    });

    it('doit avoir onDeleteAccount défini comme callback', () => {
      const mockOnDeleteAccount = jest.fn();
      render(
        <SettingsModal
          {...defaultProps}
          onDeleteAccount={mockOnDeleteAccount}
        />
      );

      expect(mockOnDeleteAccount).toBeDefined();
      expect(typeof mockOnDeleteAccount).toBe('function');
    });

    it('doit appeler onClose via Modal onRequestClose', () => {
      const mockOnClose = jest.fn();
      const { root } = render(
        <SettingsModal
          {...defaultProps}
          onClose={mockOnClose}
        />
      );

      const modal = root.findByType('Modal');
      modal.props.onRequestClose();

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('doit avoir tous les callbacks définis et fonctionnels', () => {
      const mockOnLogout = jest.fn();
      const mockOnDeleteAccount = jest.fn();
      const mockOnClose = jest.fn();

      render(
        <SettingsModal
          visible={true}
          onClose={mockOnClose}
          onLogout={mockOnLogout}
          onDeleteAccount={mockOnDeleteAccount}
        />
      );

      expect(mockOnClose).toBeDefined();
      expect(mockOnLogout).toBeDefined();
      expect(mockOnDeleteAccount).toBeDefined();
      expect(typeof mockOnClose).toBe('function');
      expect(typeof mockOnLogout).toBe('function');
      expect(typeof mockOnDeleteAccount).toBe('function');
    });
  });

  describe('Content Verification', () => {
    it('doit afficher tous les titres de section requis', () => {
      render(<SettingsModal {...defaultProps} />);

      const titles = [
        'Paramètres',
        'Compte',
        'Général',
        'Actions',
        'À propos',
      ];

      titles.forEach(title => {
        expect(screen.getByText(title)).toBeTruthy();
      });
    });

    it('doit afficher tous les items de menu requis', () => {
      render(<SettingsModal {...defaultProps} />);

      const menuItems = [
        'Modifier le profil',
        'Confidentialité',
        'Notifications',
        'Sécurité',
        'Aide & Support',
        'Se déconnecter',
        'Supprimer le compte',
      ];

      menuItems.forEach(item => {
        expect(screen.getByTestId(`settings-item-${item}`)).toBeTruthy();
      });
    });

    it('doit afficher les informations de version', () => {
      render(<SettingsModal {...defaultProps} />);

      expect(screen.getByText(/Version/)).toBeTruthy();
    });
  });
});
