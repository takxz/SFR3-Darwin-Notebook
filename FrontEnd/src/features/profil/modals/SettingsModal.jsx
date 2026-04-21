import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { Settings, LogOut, Trash2, User, Bell, Lock, HelpCircle, Shield, X } from 'lucide-react-native';
import { styles } from './profilStyles';
import SettingsItem from '@/components/SettingsItem';

export function SettingsModal({ visible, onClose, onLogout, onDeleteAccount }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.settingsModal}>
          {/* Settings Header */}
          <View style={styles.settingsHeader}>
            <View style={styles.settingsTitleContainer}>
              <View style={styles.settingsIcon}>
                <Settings size={20} color="#97572B" />
              </View>
              <Text style={styles.settingsTitle}>Paramètres</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
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
                  onPress={onLogout}
                  variant="primary"
                />
                <SettingsItem
                  icon={Trash2}
                  label="Supprimer le compte"
                  onPress={onDeleteAccount}
                  variant="danger"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
