import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { ScanLine } from 'lucide-react-native';

export default function WaitingComponent() {
    return (
        <View style={styles.container}>
            <MotiView
                from={{ scale: 0.8, translateY: 50 }}
                animate={{ scale: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                style={styles.content}
            >
                <LinearGradient
                    colors={['#2E6F40', '#14b8a6']}
                    style={styles.gradient}
                >
                    <ScanLine style={styles.scanLine} />
                </LinearGradient>

                <Text style={styles.title}>Analyzing...</Text>
                <Text style={styles.subtitle}>Identifying species data</Text>
            </MotiView>
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
        shadowColor: '#2E6F40',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 50,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        color: 'rgba(110,231,183,0.8)',
        fontSize: 16,
    },
    scanLine: {
        size: 48,
        color: "white",
    },
});