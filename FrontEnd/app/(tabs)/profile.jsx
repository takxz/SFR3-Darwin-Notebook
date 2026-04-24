import { View, Text, Image, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import SpotlightTooltip from '@/components/SpotlightTooltip';
import { useSpotlight } from '@/hooks/useSpotlight';
import * as SecureStore from 'expo-secure-store';
import { Settings, Award, Camera } from 'lucide-react-native';
import { clearToken, getToken } from '@/utils/auth';
import { useUser } from '@/hooks/useUser';
import { SettingsModal } from '../../src/features/profil/modals/SettingsModal';
import { DeleteConfirmModal } from '../../src/features/profil/modals/DeleteConfirmModal';
import { DescriptionEditModal } from '../../src/features/profil/modals/DescriptionEditModal';
import { styles } from '../../src/features/profil/modals/profilStyles';
import fr from '@/assets/locales/fr.json';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, error } = useUser();
  const { visible, targetLayout, ref, onLayout, dismiss } = useSpotlight('profile_settings', user?.id);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [description, setDescription] = useState(fr.profileScreen2.default_description);
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

  const saveDescription = async () => {
    if (!user?.id) return;
    setSavingDescription(true);
    await SecureStore.setItemAsync(`profileDescription_${user.id}`, description);
    setSavingDescription(false);
    setShowDescriptionModal(false);
    Alert.alert(fr.profileScreen2.saved_title, fr.profileScreen2.saved_message);
  };

  const confirmDeleteAccount = async () => {
    try {
      const token = await getToken();
      const response = await fetch('http://ikdeksmp.fr:3001/api/user/profile', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json();
      if (!response.ok) {
        Alert.alert(fr.profileScreen2.error_title, body?.error || fr.profileScreen2.error_delete);
        return;
      }
      setShowDeleteConfirm(false);
      setShowSettings(false);
      Alert.alert(
        fr.profileScreen2.delete_scheduled_title,
        fr.profileScreen2.delete_scheduled_message,
        [{ text: fr.profileScreen2.delete_scheduled_ok, onPress: async () => { await clearToken(); router.replace('/login'); } }]
      );
    } catch (e) {
      console.error('[DELETE] erreur:', e.message);
      Alert.alert(fr.profileScreen2.error_title, fr.profileScreen2.error_generic);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>{fr.profileScreen2.loading}</Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error ?? fr.profileScreen2.error_loading}</Text>
        {error?.toLowerCase().includes('token') && (
          <Pressable
            style={styles.reconnectButton}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.reconnectButtonText}>{fr.profileScreen2.reconnect}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{fr.profileScreen2.title}</Text>
        <View ref={ref} onLayout={onLayout} collapsable={false}>
          <Pressable
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Settings size={20} color="#97572B" />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        {/* User Stats Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGradient}>
              <View style={styles.avatarInner}>
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImage}
                />
              </View>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{playerLevel}</Text>
            </View>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>{fr.profileScreen2.stat_captures}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>{fr.profileScreen2.stat_followers}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>{fr.profileScreen2.stat_following}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Badges & Tags */}
        <View style={styles.badgesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
            <View style={styles.badge}>
              <View style={styles.badgeIcon}>
                <Award size={24} color="#97572B" />
              </View>
              <Text style={styles.badgeText}>{fr.profileScreen2.badge_hunter}</Text>
            </View>

            <View style={styles.badge}>
              <View style={styles.badgeIcon}>
                <Camera size={24} color="#97572B" />
              </View>
              <Text style={styles.badgeText}>{fr.profileScreen2.badge_shooter}</Text>
            </View>
          </ScrollView>

          <Text style={styles.bioText}>{description}</Text>
          <Pressable
            style={styles.changeDescButton}
            onPress={() => setShowDescriptionModal(true)}
          >
            <Text style={styles.changeDescButtonText}>{fr.profileScreen2.change_description}</Text>
          </Pressable>
        </View>

        {/* Best Captures */}
        <View style={styles.capturesContainer}>
          <View style={styles.capturesHeader}>
            <Text style={styles.capturesTitle}>{fr.profileScreen2.best_captures_title}</Text>
            <Text style={styles.capturesCount}>{fr.profileScreen2.best_captures_count}</Text>
          </View>

          <View style={styles.captureCard}>
            <View style={styles.captureHeader}>
              <Image
                source={{ uri: avatarUri }}
                style={styles.captureAvatar}
              />
              <Text style={styles.captureText}>
                {fr.profileScreen2.no_capture}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Modals */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={handleLogout}
        onDeleteAccount={() => { setShowSettings(false); setTimeout(() => setShowDeleteConfirm(true), 300); }}
      />

      <DeleteConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteAccount}
      />

      <DescriptionEditModal
        visible={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        description={description}
        onDescriptionChange={setDescription}
        onSave={saveDescription}
        isSaving={savingDescription}
      />
      <SpotlightTooltip
        visible={visible}
        targetLayout={targetLayout}
        description={fr.tutorial.profile_settings}
        onDismiss={dismiss}
      />
    </ScrollView>
  );
}
