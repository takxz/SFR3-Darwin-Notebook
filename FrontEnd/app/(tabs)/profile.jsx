import { View, Text, TextInput, StyleSheet, Pressable, Image, ScrollView, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { MotiView } from 'moti';
import { Settings, Award, Camera, LogOut, Trash2, User, Bell, Lock, HelpCircle, Shield, ChevronRight, X } from 'lucide-react-native';
import { clearToken } from '@/utils/auth';
import { useUser } from '@/hooks/useUser';
import colors from '@/assets/constants/colors';
import fr from '@/assets/locales/fr.json';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, error } = useUser();
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [description, setDescription] = useState('Chasseur de la nature | Photographe animalier');
  const [savingDescription, setSavingDescription] = useState(false);

  const avatarUri = user?.bio_token?.startsWith('http')
    ? user.bio_token
    : 'https://via.placeholder.com/100';
  const playerLevel = user?.player_level ?? user?.playerLevel ?? 1;
  const displayName = user?.pseudo || user?.email || 'Profil';

  useEffect(() => {
    const loadDescription = async () => {
      if (!user?.id) return;
      const stored = await SecureStore.getItemAsync(`profileDescription_${user.id}`);
      if (stored) {
        setDescription(stored);
      }
    };

    loadDescription();
  }, [user]);

  const handleLogout = async () => {
    await clearToken();
    setShowSettings(false);
    router.replace('/login');
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const saveDescription = async () => {
    if (!user?.id) return;
    setSavingDescription(true);
    await SecureStore.setItemAsync(`profileDescription_${user.id}`, description);
    setSavingDescription(false);
    setShowDescriptionModal(false);
    Alert.alert('Enregistré', 'Votre description a été mise à jour.');
  };

  const confirmDeleteAccount = () => {
    console.log('Suppression du compte en cours...');
    setShowDeleteConfirm(false);
    setShowSettings(false);
    router.replace('/login');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error ?? 'Erreur lors du chargement du profil.'}</Text>
        {error?.toLowerCase().includes('token') && (
          <Pressable style={styles.reconnectButton} onPress={() => router.replace('/login')}>
            <Text style={styles.reconnectButtonText}>Se reconnecter</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <Pressable 
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Settings size={20} color="#97572B" />
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* User Stats Card */}
        <MotiView 
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.userCard}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGradient}>
              <View style={styles.avatarInner}>
                <Image 
                  source={{ uri: avatarUri }} 
                  style={styles.avatarImage} 
                />
              </View>
            </View>
            {/* Level Badge */}
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{playerLevel}</Text>
            </View>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Capturés</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Abonnés</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Abonnements</Text>
              </View>
            </View>
          </View>
        </MotiView>

        {/* Badges & Tags */}
        <MotiView 
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 }}
          style={styles.badgesContainer}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
            <View style={styles.badge}>
              <View style={styles.badgeIcon}>
                <Award size={24} color="#97572B" />
              </View>
              <Text style={styles.badgeText}>Expert{'\n'}Chasseur</Text>
            </View>
            
            <View style={styles.badge}>
              <View style={styles.badgeIcon}>
                <Camera size={24} color="#97572B" />
              </View>
              <Text style={styles.badgeText}>Tireur{'\n'}d'élite</Text>
            </View>
          </ScrollView>
          
          <Text style={styles.bioText}>
            {description}
          </Text>
          <Pressable style={styles.changeDescButton} onPress={() => setShowDescriptionModal(true)}>
            <Text style={styles.changeDescButtonText}>Changer la description</Text>
          </Pressable>
        </MotiView>

        {/* Best Captures */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200 }}
          style={styles.capturesContainer}
        >
          <View style={styles.capturesHeader}>
            <Text style={styles.capturesTitle}>Mes meilleures captures</Text>
            <Text style={styles.capturesCount}>0 publications</Text>
          </View>

          <View style={styles.captureCard}>
            <View style={styles.captureHeader}>
              <Image 
                source={{ uri: avatarUri }} 
                style={styles.captureAvatar} 
              />
              <Text style={styles.captureText}>
                Vous n'avez encore aucune capture.
              </Text>
            </View>
          </View>
        </MotiView>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ translateY: '100%' }}
            animate={{ translateY: 0 }}
            style={styles.settingsModal}
          >
            {/* Settings Header */}
            <View style={styles.settingsHeader}>
              <View style={styles.settingsTitleContainer}>
                <View style={styles.settingsIcon}>
                  <Settings size={20} color="#97572B" />
                </View>
                <Text style={styles.settingsTitle}>Paramètres</Text>
              </View>
              <Pressable
                onPress={() => setShowSettings(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#97572B" />
              </Pressable>
            </View>

            {/* Settings Content */}
            <ScrollView style={styles.settingsContent}>
              {/* Account Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Compte</Text>
                <View style={styles.settingsItems}>
                  <SettingsItem
                    icon={User}
                    label="Modifier le profil"
                    onPress={() => console.log('Modifier le profil')}
                  />
                  <SettingsItem
                    icon={Lock}
                    label="Confidentialité"
                    onPress={() => console.log('Confidentialité')}
                  />
                  <SettingsItem
                    icon={Bell}
                    label="Notifications"
                    onPress={() => console.log('Notifications')}
                  />
                </View>
              </View>

              {/* General Section */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Général</Text>
                <View style={styles.settingsItems}>
                  <SettingsItem
                    icon={Shield}
                    label="Sécurité"
                    onPress={() => console.log('Sécurité')}
                  />
                  <SettingsItem
                    icon={HelpCircle}
                    label="Aide & Support"
                    onPress={() => console.log('Aide & Support')}
                  />
                </View>
              </View>

              {/* Account Actions */}
              <View style={styles.settingsSection}>
                <Text style={styles.sectionTitle}>Actions</Text>
                <View style={styles.settingsItems}>
                  <SettingsItem
                    icon={LogOut}
                    label="Se déconnecter"
                    onPress={handleLogout}
                    variant="primary"
                  />
                  <SettingsItem
                    icon={Trash2}
                    label="Supprimer le compte"
                    onPress={handleDeleteAccount}
                    variant="danger"
                  />
                </View>
              </View>
            </ScrollView>
          </MotiView>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={styles.deleteModal}
          >
            <View style={styles.deleteContent}>
              <View style={styles.deleteIcon}>
                <Trash2 size={32} color="#B01E28" />
              </View>
              <Text style={styles.deleteTitle}>Supprimer le compte ?</Text>
              <Text style={styles.deleteText}>
                Cette action est irréversible. Toutes vos données, captures et progrès seront définitivement supprimés.
              </Text>
              <View style={styles.deleteButtons}>
                <Pressable
                  onPress={() => setShowDeleteConfirm(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>Annuler</Text>
                </Pressable>
                <Pressable
                  onPress={confirmDeleteAccount}
                  style={styles.confirmButton}
                >
                  <Text style={styles.confirmText}>Supprimer</Text>
                </Pressable>
              </View>
            </View>
          </MotiView>
        </View>
      </Modal>

      {/* Description Edit Modal */}
      <Modal
        visible={showDescriptionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDescriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ translateY: '100%' }}
            animate={{ translateY: 0 }}
            style={styles.descriptionModal}
          >
            {/* Modal Header */}
            <View style={styles.descriptionModalHeader}>
              <Text style={styles.descriptionModalTitle}>Modifier la description</Text>
              <Pressable
                onPress={() => setShowDescriptionModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#97572B" />
              </Pressable>
            </View>

            {/* Modal Content */}
            <View style={styles.descriptionModalContent}>
              <Text style={styles.descriptionLabel}>Votre description</Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Écris ta description ici..."
                placeholderTextColor="#8B5E3C"
                multiline
                maxLength={150}
              />
              <Text style={styles.charCount}>{description.length}/150</Text>
              
              <Pressable 
                style={styles.saveButton} 
                onPress={saveDescription} 
                disabled={savingDescription}
              >
                <Text style={styles.saveButtonText}>
                  {savingDescription ? 'Enregistrement...' : 'Enregistrer'}
                </Text>
              </Pressable>
            </View>
          </MotiView>
        </View>
      </Modal>
    </ScrollView>
  );
}

function SettingsItem({ 
  icon: Icon, 
  label, 
  onPress, 
  variant = 'default' 
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: '#97572B', textColor: '#FFFFFF' };
      case 'danger':
        return { backgroundColor: '#B01E28', textColor: '#FFFFFF' };
      default:
        return { backgroundColor: '#FFFFFF', textColor: '#97572B' };
    }
  };

  const { backgroundColor, textColor } = getVariantStyles();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingsItem, { backgroundColor }]}
    >
      <View style={styles.settingsItemContent}>
        <Icon size={20} color={textColor} />
        <Text style={[styles.settingsItemLabel, { color: textColor }]}>{label}</Text>
      </View>
      <ChevronRight size={18} color={textColor} style={{ opacity: 0.4 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAEBD7',
  },
  errorText: {
    color: '#B01E28',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
  },
  reconnectButton: {
    marginTop: 24,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#97572B',
    borderRadius: 16,
  },
  reconnectButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#FAEBD7',
    borderBottomWidth: 1,
    borderBottomColor: '#97572B20',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
  },
  settingsButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#97572B10',
    borderWidth: 1,
    borderColor: '#97572B30',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 32,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 2,
    backgroundColor: '#97572B',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 46,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#97572B',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  levelText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#97572B70',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  badgesContainer: {
    gap: 16,
  },
  badgesScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  badge: {
    width: 112,
    height: 112,
    borderRadius: 28,
    backgroundColor: '#FAEBD7',
    borderWidth: 1,
    borderColor: '#97572B20',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginRight: 12,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FAEBD7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#97572B80',
    textAlign: 'center',
    lineHeight: 14,
  },
  bioText: {
    backgroundColor: '#FAEBD7',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#00000080',
    textAlign: 'center',
  },
  changeDescButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#97572B',
    alignItems: 'center',
  },
  changeDescButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  capturesContainer: {},
  capturesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  capturesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  capturesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#97572B60',
  },
  captureCard: {
    backgroundColor: '#FAEBD7',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#97572B20',
  },
  captureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  captureAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  captureText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00000080',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000050',
    justifyContent: 'flex-end',
  },
  settingsModal: {
    backgroundColor: '#FAEBD7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#97572B20',
    backgroundColor: '#FFFFFF40',
  },
  settingsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#97572B10',
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#97572B',
  },
  closeButton: {
    padding: 8,
  },
  settingsContent: {
    paddingBottom: 120,
  },
  settingsSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#97572B50',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  settingsItems: {
    gap: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#97572B10',
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsItemLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    margin: 24,
    maxHeight: 300,
  },
  deleteContent: {
    padding: 24,
    alignItems: 'center',
  },
  deleteIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#B01E2810',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 8,
  },
  deleteText: {
    fontSize: 14,
    color: '#00000060',
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#FAEBD7',
  },
  cancelText: {
    color: '#97572B',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#B01E28',
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  descriptionModal: {
    backgroundColor: '#FAEBD7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  descriptionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#97572B20',
    backgroundColor: '#FFFFFF40',
  },
  descriptionModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#97572B',
  },
  descriptionModalContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#97572B60',
    textTransform: 'uppercase',
  },
  descriptionInput: {
    minHeight: 100,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    fontSize: 14,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#97572B20',
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#97572B60',
    textAlign: 'right',
  },
  saveButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#97572B',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});