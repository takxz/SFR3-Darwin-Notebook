import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScanLine } from 'lucide-react-native';
import fr from '../assets/locales/fr.json';

export default function WaitingComponent() {
    return (
        <View style={styles.container}>
            <View
                style={styles.content}
            >
                <LinearGradient
                    colors={['#2E6F40', '#14b8a6']}
                    style={styles.gradient}
                >
                    <ScanLine style={styles.scanLine} />
                </LinearGradient>

                <Text style={styles.title}>{fr.waitingScreen.analyzing}</Text>
                <Text style={styles.subtitle}>{fr.waitingScreen.description}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    content: {
        alignItems: 'center',
    },
    gradient: {
        width: 128,
        height: 128,
        borderRadius: 64,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#2E6F40',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 50,
            },
            android: {
                elevation: 10,
            }
        }),
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#000000',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        color: 'rgba(110,231,183,0.8)',
        fontSize: 16,
    },
    scanLine: {
        size: 48,
        color: "#000000",
    },
});