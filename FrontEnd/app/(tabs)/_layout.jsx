import { Tabs } from 'expo-router';
import { Home, Sword } from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#059669' }}>

            {/* Home Tab */}
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Accueil',
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />
                }}
            />

            {/* Fight Tab */}
            <Tabs.Screen
                name="fight"
                options={{
                    title: 'Arène',
                    tabBarIcon: ({ color }) => <Sword size={24} color={color} />,
                    headerShown: false
                }}
            />
        </Tabs>
    );
}