import { View, Text, StyleSheet } from 'react-native';

export default function HomePage() {
    return (
        <View style={styles.container}> // View est un conteneur de base pour expo // L'équivalent d'un div en HTML
            <Text>Écran Accueil</Text> // Text est un composant de base pour afficher du texte // L'équivalent d'un p ou h1 en HTML
        </View>
    );
}

// StyleSheet est une API de React Native pour créer des styles de manière optimisée. Pas de fichier CSS séparé, les styles sont définis en JavaScript.
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});