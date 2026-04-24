import { render, screen, fireEvent } from '@testing-library/react-native';
import { SettingsModal } from './SettingsModal';

jest.mock('lucide-react-native', () =>
  new Proxy({}, { get: () => () => null })
);

jest.mock('@/components/SettingsItem', () => {
  const { View, Text } = require('react-native');
  return function MockSettingsItem({ label, onPress }) {
    return (
      <View onPress={onPress}>
        <Text>{label}</Text>
      </View>
    );
  };
});

describe('SettingsModal — section Compte & Général', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onLogout: jest.fn(),
    onDeleteAccount: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  // Affichage — section Compte (lignes 35-50)
  it('affiche "Modifier le profil"', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText('Modifier le profil')).toBeTruthy();
  });

  it('affiche "Confidentialité"', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText('Confidentialité')).toBeTruthy();
  });

  it('affiche "Notifications"', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText('Notifications')).toBeTruthy();
  });

  // Affichage — section Général (lignes 53-67)
  it('affiche "Sécurité"', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText('Sécurité')).toBeTruthy();
  });

  it('affiche "Aide & Support"', () => {
    render(<SettingsModal {...defaultProps} />);
    expect(screen.getByText('Aide & Support')).toBeTruthy();
  });

  // Interactions — section Compte
  it('appuyer sur "Modifier le profil" appelle console.log', () => {
    render(<SettingsModal {...defaultProps} />);
    fireEvent.press(screen.getByText('Modifier le profil'));
    expect(console.log).toHaveBeenCalledWith('Modifier le profil');
  });

  it('appuyer sur "Confidentialité" appelle console.log', () => {
    render(<SettingsModal {...defaultProps} />);
    fireEvent.press(screen.getByText('Confidentialité'));
    expect(console.log).toHaveBeenCalledWith('Confidentialité');
  });

  it('appuyer sur "Notifications" appelle console.log', () => {
    render(<SettingsModal {...defaultProps} />);
    fireEvent.press(screen.getByText('Notifications'));
    expect(console.log).toHaveBeenCalledWith('Notifications');
  });

  // Interactions — section Général
  it('appuyer sur "Sécurité" appelle console.log', () => {
    render(<SettingsModal {...defaultProps} />);
    fireEvent.press(screen.getByText('Sécurité'));
    expect(console.log).toHaveBeenCalledWith('Sécurité');
  });

  it('appuyer sur "Aide & Support" appelle console.log', () => {
    render(<SettingsModal {...defaultProps} />);
    fireEvent.press(screen.getByText('Aide & Support'));
    expect(console.log).toHaveBeenCalledWith('Aide & Support');
  });
});