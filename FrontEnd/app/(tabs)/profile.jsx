import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Image,
    Modal,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    Settings,
    Camera as CameraIcon,
    LogOut,
    Trash2,
    User,
    Bell,
    Lock,
    HelpCircle,
    Shield,
    ChevronRight,
    X
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { clearToken } from '@/utils/auth';

const { width } = Dimensions.get('window');

const USER_PROFILE = {
    name: 'Alex Rivers',
    level: 5,
    captured: 10,
    followers: '0',
    following: 0,
};

export default function ProfilePage() {
    const router = useRouter();
    const [showSettings, setShowSettings] = useState(false);
    const [profileData, setProfileData] = useState(USER_PROFILE);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (showSettings) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [showSettings]);

    useEffect(() => {
        if (process.env.EXPO_PUBLIC_SKIP_AUTH === 'true') {
            try {
                const db = require('../../src/assets/fakeServerDb.json');
                setProfileData({
                    name: db.user_name || USER_PROFILE.name,
                    level: 5,
                });
            } catch (error) {
            }
        }
    }, []);

    const handleLogout = async () => {
        console.log('Logging out...');
        setShowSettings(false);
        await clearToken();
        router.replace('/login');
    };

    const SettingsItem = ({ icon: Icon, label, onClick, variant = 'default' }) => {
        const variantStyles = {
            default: { bg: 'rgba(255, 255, 255, 0.6)', text: '#97572B', border: 'rgba(151, 87, 43, 0.1)' },
            primary: { bg: 'rgba(151, 87, 43, 0.1)', text: '#97572B', border: 'rgba(151, 87, 43, 0.1)' },
            danger: { bg: 'rgba(176, 30, 40, 0.1)', text: '#B01E28', border: 'rgba(176, 30, 40, 0.1)' }
        };

        const currentStyle = variantStyles[variant];

        return (
            <TouchableOpacity
                onPress={onClick}
                style={[styles.settingsItem, { backgroundColor: currentStyle.bg, borderColor: currentStyle.border }]}
                activeOpacity={0.7}
            >
                <View style={styles.settingsItemLeft}>
                    <Icon size={20} color={currentStyle.text} strokeWidth={2.5} />
                    <Text style={[styles.settingsItemText, { color: currentStyle.text }]}>{label}</Text>
                </View>
                <ChevronRight size={18} color={currentStyle.text} opacity={0.4} />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profil</Text>
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => setShowSettings(true)}
                >
                    <Settings size={20} color="#97572B" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* User Stats Card */}
                <View style={styles.statsCardContainer}>
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={['#97572B', '#ABDDF1']}
                            style={styles.avatarGradient}
                            start={{ x: 0, y: 1 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <View style={styles.avatarInnerBorder}>
                                <Image source={{ uri: profileData.avatar }} style={styles.avatarImage} />
                            </View>
                        </LinearGradient>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelBadgeText}>{profileData.bestCaptures?.[0]?.level || profileData.level}</Text>
                        </View>
                    </View>

                    <View style={styles.statsRightContainer}>
                        <Text style={styles.userName}>{profileData.name}</Text>
                        <View style={styles.statsNumbersRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{profileData.captured}</Text>
                                <Text style={styles.statLabel}>CAPTURED</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{profileData.followers}</Text>
                                <Text style={styles.statLabel}>FOLLOWERS</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{profileData.following}</Text>
                                <Text style={styles.statLabel}>FOLLOWING</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Settings Modal */}
            <Modal
                visible={showSettings}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowSettings(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.modalBackdrop,
                            {
                                backgroundColor: 'black',
                                opacity: fadeAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 0.15]
                                })
                            }
                        ]}
                    >
                        <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => setShowSettings(false)}
                            activeOpacity={1}
                        />
                    </Animated.View>
                    <View style={styles.settingsModalContent}>
                        <View style={styles.settingsModalHeader}>
                            <View style={styles.settingsModalHeaderLeft}>
                                <View style={styles.settingsModalHeaderIcon}>
                                    <Settings size={20} color="#97572B" />
                                </View>
                                <Text style={styles.settingsModalTitle}>Paramètres</Text>
                            </View>
                            <TouchableOpacity style={styles.settingsModalCloseBtn} onPress={() => setShowSettings(false)}>
                                <X size={24} color="#97572B" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.settingsScrollContent}>
                            <View style={styles.settingsSection}>
                                <Text style={styles.settingsSectionTitle}>COMPTE</Text>
                                <SettingsItem icon={User} label="Modifier le profil" onClick={() => console.log('Edit profile')} />
                                <SettingsItem icon={Lock} label="Confidentialité" onClick={() => console.log('Privacy')} />
                                <SettingsItem icon={Bell} label="Notifications" onClick={() => console.log('Notifications')} />
                            </View>

                            <View style={styles.settingsSection}>
                                <Text style={styles.settingsSectionTitle}>GÉNÉRAL</Text>
                                <SettingsItem icon={Shield} label="Sécurité" onClick={() => console.log('Security')} />
                                <SettingsItem icon={HelpCircle} label="Aide & Support" onClick={() => console.log('Help')} />
                            </View>

                            <View style={styles.settingsSection}>
                                <Text style={styles.settingsSectionTitle}>ACTIONS</Text>
                                <SettingsItem icon={LogOut} label="Se déconnecter" onClick={handleLogout} variant="primary" />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFF8F0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: 'rgba(250, 235, 215, 0.6)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(151, 87, 43, 0.1)',
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#000',
        letterSpacing: -0.5,
    },
    settingsButton: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(151, 87, 43, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(151, 87, 43, 0.3)',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 100,
    },
    statsCardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 24,
    },
    avatarGradient: {
        width: 96,
        height: 96,
        borderRadius: 48,
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInnerBorder: {
        flex: 1,
        width: '100%',
        height: '100%',
        borderRadius: 48,
        borderWidth: 4,
        borderColor: '#FFF',
        overflow: 'hidden',
        backgroundColor: '#FFF',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    levelBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: '#97572B',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    levelBadgeText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    statsRightContainer: {
        flex: 1,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 12,
    },
    statsNumbersRow: {
        flexDirection: 'row',
        gap: 24,
    },
    statItem: {
        flexDirection: 'column',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        lineHeight: 24,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(151, 87, 43, 0.7)',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    settingsModalContent: {
        backgroundColor: '#FAEBD7',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    settingsModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(151, 87, 43, 0.2)',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    settingsModalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingsModalHeaderIcon: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(151, 87, 43, 0.1)',
    },
    settingsModalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#97572B',
    },
    settingsModalCloseBtn: {
        padding: 8,
        borderRadius: 20,
    },
    settingsScrollContent: {
        paddingBottom: 60,
    },
    settingsSection: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    settingsSectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: 'rgba(151, 87, 43, 0.5)',
        letterSpacing: 1,
        marginBottom: 12,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 8,
    },
    settingsItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingsItemText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#FAEBD7',
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#97572B',
        fontWeight: 'bold',
        fontSize: 16,
    },
});