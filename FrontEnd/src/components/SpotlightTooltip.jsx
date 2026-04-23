import { View, Text, Pressable, StyleSheet, Dimensions, Modal } from 'react-native';
import colors from '@/assets/constants/colors';
import fr from '@/assets/locales/fr.json';

const { width: W, height: H } = Dimensions.get('window');
const PAD = 10;

export default function SpotlightTooltip({ visible, targetLayout, description, onDismiss }) {
    if (!visible || !targetLayout) return null;

    const { x, y, width, height } = targetLayout;

    const spotLeft = x - PAD;
    const spotTop = y - PAD;
    const spotW = width + PAD * 2;
    const spotH = height + PAD * 2;

    const bubbleLeft = Math.max(12, Math.min(x + width / 2 - 120, W - 252));
    const isBelow = y < H * 0.5;
    const bubbleTop = isBelow ? spotTop + spotH + 14 : spotTop - 130;

    const arrowLeft = x + width / 2 - bubbleLeft - 10;

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
            <View style={StyleSheet.absoluteFill}>
                {/* Top */}
                <View style={[styles.dim, { top: 0, left: 0, right: 0, height: spotTop }]} />
                {/* Bottom */}
                <View style={[styles.dim, { top: spotTop + spotH, left: 0, right: 0, bottom: 0 }]} />
                {/* Left */}
                <View style={[styles.dim, { top: spotTop, left: 0, width: spotLeft, height: spotH }]} />
                {/* Right */}
                <View style={[styles.dim, { top: spotTop, left: spotLeft + spotW, right: 0, height: spotH }]} />

                {/* Spotlight ring */}
                <View style={[styles.spotlight, { top: spotTop, left: spotLeft, width: spotW, height: spotH }]} />

                {/* Bubble */}
                <View style={[styles.bubble, { top: bubbleTop, left: bubbleLeft }]}>
                    {isBelow && <View style={[styles.arrowUp, { left: arrowLeft }]} />}
                    <Text style={styles.text}>{description}</Text>
                    <Pressable style={styles.btn} onPress={onDismiss}>
                        <Text style={styles.btnText}>{fr.tutorial.dismiss}</Text>
                    </Pressable>
                    {!isBelow && <View style={[styles.arrowDown, { left: arrowLeft }]} />}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    dim: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.65)',
    },
    spotlight: {
        position: 'absolute',
        borderRadius: 14,
        borderWidth: 2.5,
        borderColor: colors.marronCuir,
    },
    bubble: {
        position: 'absolute',
        width: 240,
        backgroundColor: colors.marronCuir,
        borderRadius: 14,
        padding: 14,
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 10,
    },
    arrowUp: {
        position: 'absolute',
        top: -10,
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: colors.marronCuir,
    },
    arrowDown: {
        position: 'absolute',
        bottom: -10,
        width: 0,
        height: 0,
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: colors.marronCuir,
    },
    text: {
        color: colors.blanc,
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 10,
        marginTop: 4,
    },
    btn: {
        alignSelf: 'flex-end',
        backgroundColor: colors.blanc,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    btnText: {
        color: colors.marronCuir,
        fontWeight: 'bold',
        fontSize: 12,
    },
});
