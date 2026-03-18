import { View, Text, StyleSheet } from 'react-native';
import fr from '@/assets/locales/fr.json';

export default function ProfilePage() {
    return (
        <View style={styles.container}>
            <Text>{fr.collectionScreen.header_title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f2f6f3'
    }
});