import { View, StyleSheet } from "react-native";
import MapButton from "@/features/index/MapButton";
import HomeFeedComponent from "@/features/index/HomeFeedComponent";

export default function IndexScreen() {
    return (
        <View style={styles.container}>
            <MapButton />
            <HomeFeedComponent />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});