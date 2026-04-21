import { StyleSheet } from "react-native";
import colors from "@/assets/constants/colors";

export const styles = StyleSheet.create({
    mapButton: {
        padding: 10,
        width: 50,
        height: 50,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.noir + '20',
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
        backgroundColor: colors.noir + '80',
    },
    modalContainer: {
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
    modalTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.marronCuir,
        marginLeft: 10,
    },
    refreshButton: {
        backgroundColor: colors.blancJauni,
        padding: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.marronCuir + '40',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    mapContainer: {
        width: 300,
        height: 300,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 12,
        backgroundColor: colors.blancJauni,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    statusText: {
        color: colors.marronCuir,
        fontSize: 14,
    },
    errorText: {
        color: colors.rouge,
        fontSize: 14,
        textAlign: 'center',
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.marronCuir,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    retryText: {
        color: colors.blanc,
        fontWeight: 'bold',
    },
    coordBar: {
        marginTop: 8,
        alignItems: 'center',
    },
    coordText: {
        fontSize: 12,
        color: colors.noir + '80',
    },
    creaturesCount: {
        fontSize: 12,
        color: colors.marronCuir,
        fontWeight: 'bold',
        marginTop: 2,
    },
});
