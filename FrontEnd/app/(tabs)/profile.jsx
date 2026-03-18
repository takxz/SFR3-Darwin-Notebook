import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import fr from '@/assets/locales/fr.json';
import { clearToken } from '@/utils/auth';

export default function ProfilePage() {
    const router = useRouter();

    const handleLogout = async () => {
        await clearToken();
        router.replace('/login');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{fr.profileScreen.header_title}</Text>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Déconnexion</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f2f6f3',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    logoutButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#C0392B',
        borderRadius: 12,
    },
    logoutText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});