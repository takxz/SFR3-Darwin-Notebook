import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Zap, Sword, Map } from "lucide-react-native";
import SpotlightTooltip from "@/components/SpotlightTooltip";
import { useSpotlight } from "@/hooks/useSpotlight";
import { useUserId } from "@/hooks/useUserId";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ButtonFightMode from "@/features/fight/components/ButtonFightMode";
import fr from "@/assets/locales/fr.json";
import globalColors from "@/assets/constants/colors.json";

const COLORS = {
    background: globalColors.blancJauni,
    textMain: globalColors.noir,
    textSub: globalColors.marronCuir,
    zap: globalColors.rouge,
    duel: {
        theme: globalColors.rouge,
        corner: "rgba(176, 30, 40, 0.1)",
        gradient: [globalColors.blanc, globalColors.blancJauni],
    },
    career: {
        theme: globalColors.vertSombre,
        corner: "rgba(46, 111, 64, 0.1)",
        gradient: [globalColors.vertClair, globalColors.blanc]
    }
};

const FIGHT_MODES = [
    {
        id: "duel",
        title: fr.fightScreen.mode_duel,
        subtitle: fr.fightScreen.duel_desc,
        Icon: Sword,
        gradientColors: COLORS.duel.gradient,
        themeColor: COLORS.duel.theme,
        cornerColor: COLORS.duel.corner,
        isTopCorners: true,
        extraText: "MMR: 500",
        route: "/choose-beast"
    },
    {
        id: "career",
        title: fr.fightScreen.mode_career,
        subtitle: fr.fightScreen.career_desc,
        Icon: Map,
        gradientColors: COLORS.career.gradient,
        themeColor: COLORS.career.theme,
        cornerColor: COLORS.career.corner,
        isTopCorners: false,
        extraText: null,
        route: "/campaign"
    }
];

export default function FightScreen() 
{
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const userId = useUserId();
    const { visible, targetLayout, ref, onLayout, dismiss } = useSpotlight('duel_button', userId);
    return (
        <ScrollView
            contentContainerStyle={styles.mainContainer}
            showsVerticalScrollIndicator={true}
        >
            {/* Header */}
            <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 20, 40) }]}>
                <View style={styles.titleRow}>
                    <Zap size={styles.iconConstants.size} color={COLORS.zap} fill={COLORS.zap} />
                    <Text style={styles.mainTitle}>{fr.fightScreen.header_title}</Text>
                </View>
                <Text style={styles.mainSubtitle}>
                    {fr.fightScreen.header_subtitle}
                </Text>
            </View>

            {/* Main Content */}
            <View style={styles.mainContainer}>
                {FIGHT_MODES.map((mode, index) => (
                    <View
                        key={mode.id}
                        ref={index === 0 ? ref : null}
                        onLayout={index === 0 ? onLayout : null}
                        collapsable={false}
                    >
                        <ButtonFightMode
                            {...mode}
                            onPress={() => router.push(mode.route)}
                        />
                    </View>
                ))}
            </View>
        <SpotlightTooltip
                visible={visible}
                targetLayout={targetLayout}
                description={fr.tutorial.duel}
                onDismiss={dismiss}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    iconConstants: {
        size: 32
    },
    screenContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    mainContainer: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: "5%",
        gap: 24,
        paddingBottom: "15%",
    },
    headerContainer: {
        paddingBottom: 16,
        alignItems: "center",
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: "900",
        color: COLORS.textMain,
        letterSpacing: -0.5,
    },
    mainSubtitle: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textSub,
        marginTop: 4,
    }
});
