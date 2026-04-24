import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { Settings, LogOut, Trash2, User, Bell, Lock, HelpCircle, Shield, X, Info } from 'lucide-react-native';
import { styles } from './profilStyles';
import SettingsItem from '@/components/SettingsItem';
import fr from '@/assets/locales/fr.json';

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
              <Text style={styles.settingsTitle}>{fr.settingsModal.title}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#97572B" />
            </Pressable>
          </View>

          {/* Settings Content */}
          <ScrollView style={styles.settingsContent}>
            {/* Account Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>{fr.settingsModal.section_account}</Text>
              <View style={styles.settingsItems}>
                <SettingsItem
                  icon={User}
                  label={fr.settingsModal.item_edit_profile}
                  onPress={() => {}}
                />
                <SettingsItem
                  icon={Lock}
                  label={fr.settingsModal.item_privacy}
                  onPress={() => {}}
                />
                <SettingsItem
                  icon={Bell}
                  label={fr.settingsModal.item_notifications}
                  onPress={() => {}}
                />
              </View>
            </View>

            {/* General Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>{fr.settingsModal.section_general}</Text>
              <View style={styles.settingsItems}>
                <SettingsItem
                  icon={Shield}
                  label={fr.settingsModal.item_security}
                  onPress={() => {}}
                />
                <SettingsItem
                  icon={HelpCircle}
                  label={fr.settingsModal.item_help}
                  onPress={() => {}}
                />
              </View>
            </View>

            {/* Account Actions */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>{fr.settingsModal.section_actions}</Text>
              <View style={styles.settingsItems}>
                <SettingsItem
                  icon={LogOut}
                  label={fr.settingsModal.item_logout}
                  onPress={onLogout}
                  variant="primary"
                />
                <SettingsItem
                  icon={Trash2}
                  label={fr.settingsModal.item_delete_account}
                  onPress={onDeleteAccount}
                  variant="danger"
                />
              </View>
            </View>

            {/* Version Info */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>{fr.settingsModal.section_about}</Text>
              <View style={styles.versionContainer}>
                <Info size={16} color="#97572B60" />
                <Text style={styles.versionText}>Version {process.env.EXPO_PUBLIC_APP_VERSION}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

