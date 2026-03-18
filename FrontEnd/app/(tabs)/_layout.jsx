import { Tabs, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Home, Sword, User, Library, Camera } from 'lucide-react-native';
import fr from '@/assets/locales/fr.json';
import { StyleSheet } from 'react-native';
import { getToken } from '@/utils/auth';

export default function TabLayout() {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = await getToken();
            if (!token) {
                router.replace('/login');
                return;
            }
            setIsReady(true);
        };

        checkAuth();
    }, [router]);

    if (!isReady) return null;

    const TABS_CONFIG = [
        {
            name: 'index',
            title: fr.navigationBar.home,
            icon: Home

        },
        {
            name: 'collection',
            title: fr.navigationBar.collection,
            icon: Library,
            headerShown: false
        },
        {
            name: 'camera',
            title: fr.navigationBar.camera,
            icon: Camera,
            headerShown: false
        },
        {
            name: 'fight',
            title: fr.navigationBar.fight,
            icon: Sword,
            headerShown: false
        },
        {
            name: 'profile',
            title: fr.navigationBar.profile,
            icon: User,
            headerShown: false
        }
    ];

    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: styles.activeTabs.color }}>
            {TABS_CONFIG.map((tab) => (
                <Tabs.Screen
                    key={tab.name}
                    name={tab.name}
                    options={{
                        title: tab.title,
                        tabBarIcon: ({ color }) => <tab.icon size={styles.tabs.size} color={color} />,
                    }}
                />
            ))}
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabs: {
        size: 24
    },
    activeTabs: {
        color: '#D2B48C'
    }
});