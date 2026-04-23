import { View, Text, StyleSheet } from "react-native";
import MapButton from "@/features/index/MapButton";
import HomeFeedComponent from "@/features/index/HomeFeedComponent";
import SpotlightTooltip from "@/components/SpotlightTooltip";
import { useSpotlight } from "@/hooks/useSpotlight";
import { useUserId } from "@/hooks/useUserId";
import colors from "@/assets/constants/colors";
import fr from "@/assets/locales/fr.json";

export default function IndexScreen() {
    const userId = useUserId();
    const { visible, targetLayout, ref, onLayout, dismiss } = useSpotlight('map_button', userId);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.displayLatestCaptures}>
                    <Text style={styles.latestCapturesText}>{fr.indexScreen.lastCatch}</Text>
                </View>
                <View ref={ref} onLayout={onLayout} collapsable={false}>
                    <MapButton />
                </View>
            </View>
            <View style={styles.feedContainer}>
                <HomeFeedComponent />
            </View>
            <SpotlightTooltip
                visible={visible}
                targetLayout={targetLayout}
                description={fr.tutorial.map}
                onDismiss={dismiss}
            />
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
        borderColor: colors.noir + '80',
    },
    latestCapturesText: {
        color: colors.marronCuir,
        fontSize: 16,
        fontWeight: 'bold',
    },
    feedContainer: {
        flex: 1,
    },
})