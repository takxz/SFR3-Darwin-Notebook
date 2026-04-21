import { Map, MapPin, X } from "lucide-react-native";
import { Pressable, Modal, View, Text, StyleSheet } from "react-native";
import { useState } from "react";
import colors from "@/assets/constants/colors";

export default function MapButton() {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <View style={styles.container}>
            <Pressable onPress={() => setModalVisible(true)}>
                <View style={styles.mapButton}>
                    <Map style={styles.mapIcon} />
                </View>
            </Pressable>
            <Modal
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalBackGround}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <View style={styles.mapPinContainer}>
                                <MapPin style={styles.mapPin} />
                            </View>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <View style={styles.closeButton}>
                                    <X />
                                </View>
                            </Pressable>
                        </View>
                        <View style={styles.modalBody}>    
                            <View style={styles.mapPlaceholder}>
                                <Text style={styles.notImplementedText}>La fonction de carte n'est pas encore disponible dans cette version</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    mapButton: {
        padding: 10,
        width: 50,
        height: 50,
        borderRadius: 20,
        backgroundColor: 'primary',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        backgroundColor: colors.blancJauni,
    },
    mapIcon: {
        flex: 1,
        color: colors.marronCuir,
        size: 40,
    },
    modalBackGround: {
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer:{
        backgroundColor: colors.blancJauni, 
        padding: 20, 
        borderRadius: 10,
    },
    modalHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
    },
    modalBody: {
        textAlign: 'center',
    },
    mapPinContainer: {
        backgroundColor: colors.marronCuir,
        borderRadius: 10,
        padding: 5,
    },
    mapPin: {
        color: colors.blanc,
        size: 30,
    },
    closeButton: {
        padding: 5,
        backgroundColor: colors.blanc,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.blancJauni + '80',
    },
    mapPlaceholder: {
        backgroundColor: colors.blanc,
        padding: 5,
        borderRadius: 10,
        width: 300,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    notImplementedText: {
        color: colors.marronCuir,
        fontSize: 14,
        textAlign: 'center',
    },
});