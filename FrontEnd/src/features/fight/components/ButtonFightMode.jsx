import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const UI_CONFIG = {
    iconSize: 36,
    iconStroke: 2.5,
    borderOpacity: "rgba(255,255,255,0.8)",
    circleOpacity: "rgba(255,255,255,0.6)",
    subtextColor: "rgba(2, 44, 34, 0.7)",
    extraTextColor: "rgba(6,78,59,0.5)"
};

export default function ButtonFightMode({
    title,
    subtitle,
    Icon,
    gradientColors,
    themeColor,
    cornerColor,
    isTopCorners = true,
    delay = 100,
    extraText = null,
    onPress
}) {

    const cornerTopOrBottom = isTopCorners
        ? [styles.cornerTopLeft, styles.cornerTopRight]
        : [styles.cornerBottomLeft, styles.cornerBottomRight];

    return (
        <View>
            <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]} onPress={onPress}>
                <LinearGradient
                    colors={gradientColors}
                    style={[styles.cardBase, { shadowColor: themeColor }]}
                >
                    {/* Corners */}
                    <View style={[styles.cornerBase, cornerTopOrBottom[0], { borderColor: cornerColor }]} />
                    <View style={[styles.cornerBase, cornerTopOrBottom[1], { borderColor: cornerColor }]} />

                    {/* Dynamic Icon */}
                    <View style={styles.iconCircle}>
                        <Icon size={UI_CONFIG.iconSize} color={themeColor} strokeWidth={UI_CONFIG.iconStroke} />
                    </View>

                    <Text style={[styles.title, { color: themeColor }]}>
                        {title}
                    </Text>

                    <Text style={[styles.subtitle, { textAlign: isTopCorners ? "left" : "center" }]}>
                        {subtitle}
                    </Text>

                    {extraText && <Text style={styles.extraText}>{extraText}</Text>}
                </LinearGradient>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    cardBase: {
        width: "100%",
        aspectRatio: 4 / 3,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: UI_CONFIG.borderOpacity,
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            ios: {
                shadowColor: UI_CONFIG.borderOpacity,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
            web: {
                shadowOffset: { width: 0, height: 8 },
            }
        }),
        padding: "5%",
    },
    iconCircle: {
        width: "22%",
        aspectRatio: 1,
        borderRadius: 100,
        backgroundColor: UI_CONFIG.circleOpacity,
        borderWidth: 1,
        borderColor: UI_CONFIG.borderOpacity,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "4%",
    },
    title: {
        fontSize: 30,
        fontWeight: "900",
        letterSpacing: 3,
    },
    subtitle: {
        color: UI_CONFIG.subtextColor,
        fontWeight: "600",
        marginTop: 8,
        fontSize: 14,
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    extraText: {
        color: UI_CONFIG.extraTextColor,
        fontSize: 14,
        fontWeight: "500",
        marginTop: 8,
        textTransform: "uppercase",
        letterSpacing: 3,
    },
    cornerBase: { position: "absolute", width: "10%", aspectRatio: 1, borderRadius: 12 },
    cornerTopLeft: { top: "5%", left: "5%", borderTopWidth: 2, borderLeftWidth: 2 },
    cornerTopRight: { top: "5%", right: "5%", borderTopWidth: 2, borderRightWidth: 2 },
    cornerBottomLeft: { bottom: "5%", left: "5%", borderBottomWidth: 2, borderLeftWidth: 2 },
    cornerBottomRight: { bottom: "5%", right: "5%", borderBottomWidth: 2, borderRightWidth: 2 }
});