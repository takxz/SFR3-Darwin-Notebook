import { View, Text, StyleSheet } from "react-native";
import MapButton from "@/features/index/MapButton";
import HomeFeedComponent from "@/features/index/HomeFeedComponent";
import colors from "@/assets/constants/colors";

export default function IndexScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.displayLatestCaptures}>
                    <Text style={styles.latestCapturesText}>Dernières captures</Text>
                </View>
                <MapButton />
            </View>
            <View style={styles.body}>
                <HomeFeedComponent />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
    },
    displayLatestCaptures: {
        backgroundColor: colors.blancJauni,
        padding: 10,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    latestCapturesText: {
        color: colors.marronCuir,
        fontSize: 16,
        fontWeight: 'bold',
    },
    body: {
        
    },
})