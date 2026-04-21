import { View, Text, Image, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Settings, Award, Camera } from 'lucide-react-native';
import { clearToken } from '@/utils/auth';
import { useUser } from '@/hooks/useUser';
import { SettingsModal } from './modals/SettingsModal';
import { DeleteConfirmModal } from './modals/DeleteConfirmModal';
import { DescriptionEditModal } from './modals/DescriptionEditModal';
import { styles } from './profile.styles';

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

  const saveDescription = async () => {
    if (!user?.id) return;
    setSavingDescription(true);
    await SecureStore.setItemAsync(`profileDescription_${user.id}`, description);
    setSavingDescription(false);
    setShowDescriptionModal(false);
    Alert.alert('Enregistré', 'Votre description a été mise à jour.');
  };

  const confirmDeleteAccount = () => {
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
          <Pressable
            style={styles.reconnectButton}
            onPress={() => router.replace('/login')}
          >
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
        </View>

        {/* Badges & Tags */}
        <View style={styles.badgesContainer}>
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

          <Text style={styles.bioText}>{description}</Text>
          <Pressable
            style={styles.changeDescButton}
            onPress={() => setShowDescriptionModal(true)}
          >
            <Text style={styles.changeDescButtonText}>Changer la description</Text>
          </Pressable>
        </View>

        {/* Best Captures */}
        <View style={styles.capturesContainer}>
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
        </View>
      </View>

      {/* Modals */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={handleLogout}
        onDeleteAccount={() => setShowDeleteConfirm(true)}
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
    </ScrollView>
  );
}