import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function ButtonFightMode({
    title,
    subtitle,
    Icon,
    gradientColors,
    themeColor,
    cornerColor,
    isTopCorners = true,
    delay = 100,
    extraText = null
}) {
    return (
        <View
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 20, delay }}
        >
            <Pressable>
                <LinearGradient
                    colors={gradientColors}
                    style={[styles.cardBase, { shadowColor: themeColor }]}
                >
                    {/* Corners */}
                    <View style={[
                        styles.cornerBase,
                        isTopCorners ? styles.cornerTopLeft : styles.cornerBottomLeft,
                        { borderColor: cornerColor }
                    ]} />
                    <View style={[
                        styles.cornerBase,
                        isTopCorners ? styles.cornerTopRight : styles.cornerBottomRight,
                        { borderColor: cornerColor }
                    ]} />

                    {/* Dynamic Icon */}
                    <View style={styles.iconCircle}>
                        <Icon size={40} color={themeColor} strokeWidth={2.5} />
                    </View>

                    <Text style={[styles.title, { color: themeColor }]}>
                        {title}
                    </Text>

                    <Text style={[styles.subtitle, { textAlign: isTopCorners ? "left" : "center" }]}>
                        {subtitle}
                    </Text>

                    {/* Conditional display (ex: MMR) */}
                    {extraText && <Text style={styles.extraText}>{extraText}</Text>}
                </LinearGradient>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    cardBase: {
        width: "100%", aspectRatio: 4 / 3, borderRadius: 40,
        borderWidth: 1, borderColor: "rgba(255,255,255,0.8)",
        alignItems: "center", justifyContent: "center",
        shadowOffset: { width: 0, height: 8 },
        // shadowOpacity: 0.15, shadowRadius: 32, elevation: 6,
    },
    iconCircle: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: "rgba(255,255,255,0.6)",
        borderWidth: 1, borderColor: "rgba(255,255,255,0.8)",
        alignItems: "center", justifyContent: "center", marginBottom: 16,
    },
    title: {
        fontSize: 30, fontWeight: "900", letterSpacing: 3,
    },
    subtitle: {
        color: "rgba(2, 44, 34, 0.7)", fontWeight: "600",
        marginTop: 8, fontSize: 14, paddingHorizontal: 20, lineHeight: 22,
    },
    extraText: {
        color: "rgba(6,78,59,0.5)", fontSize: 14, fontWeight: "500",
        marginTop: 8, textTransform: "uppercase", letterSpacing: 3,
    },
    cornerBase: { position: "absolute", width: 16, height: 16 },
    cornerTopLeft: { top: 16, left: 16, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 12 },
    cornerTopRight: { top: 16, right: 16, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 12 },
    cornerBottomLeft: { bottom: 16, left: 16, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 12 },
    cornerBottomRight: { bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 12 }
});