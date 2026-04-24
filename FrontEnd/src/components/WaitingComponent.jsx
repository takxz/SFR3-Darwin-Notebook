import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScanLine, Hourglass } from 'lucide-react-native';
import fr from '../assets/locales/fr.json';

function format(template, vars) {
    if (!template) return '';
    return Object.keys(vars).reduce(
        (acc, key) => acc.replace(new RegExp(`{${key}}`, 'g'), String(vars[key])),
        template
    );
}

/**
 * status:    'submitting' | 'queued' | 'processing'
 * queueInfo: { position, queued_total, processing_total, max_workers } | null
 */
export default function WaitingComponent({ status = 'processing', queueInfo = null }) {
    const pulse = useRef(new Animated.Value(0)).current;
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 1,
                    duration: 1100,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0,
                    duration: 1100,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    useEffect(() => {
        const stagger = (anim, delay) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 380,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 380,
                        easing: Easing.in(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.delay(900 - delay),
                ])
            );
        const a = stagger(dot1, 0);
        const b = stagger(dot2, 180);
        const c = stagger(dot3, 360);
        a.start();
        b.start();
        c.start();
        return () => {
            a.stop();
            b.stop();
            c.stop();
        };
    }, [dot1, dot2, dot3]);

    const isQueued = status === 'queued';
    const isSubmitting = status === 'submitting';

    const gradientColors = isQueued
        ? ['#97572B', '#e3902b']
        : ['#2E6F40', '#14b8a6'];

    const Icon = isQueued ? Hourglass : ScanLine;

    let title = fr.waitingScreen.analyzing;
    let description = fr.waitingScreen.description;

    if (isSubmitting) {
        title = fr.waitingScreen.submitting_title;
        description = fr.waitingScreen.submitting_description;
    } else if (isQueued && queueInfo) {
        title = fr.waitingScreen.queued_title;
        const pos = queueInfo.position || 0;
        const total = queueInfo.queued_total || pos;
        description =
            pos <= 1
                ? fr.waitingScreen.queued_only_yours
                : format(fr.waitingScreen.queued_position, { position: pos, total });
    }

    const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
    const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
    const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

    const dotStyle = (anim) => ({
        opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
    });

    const showQueueMeter = isQueued && queueInfo && queueInfo.max_workers > 0;
    const slots = showQueueMeter
        ? Array.from({ length: queueInfo.max_workers }, (_, i) => i < (queueInfo.processing_total || 0))
        : [];

    return (
        <View style={styles.container} testID="waiting-component">
            <View style={styles.content}>
                <View style={styles.iconWrap}>
                    <Animated.View
                        style={[
                            styles.ring,
                            { transform: [{ scale: ringScale }], opacity: ringOpacity },
                            isQueued ? styles.ringQueued : styles.ringProcessing,
                        ]}
                    />
                    <Animated.View style={{ transform: [{ scale }] }}>
                        <LinearGradient colors={gradientColors} style={styles.gradient}>
                            <Icon size={48} color="#000000" strokeWidth={2} />
                        </LinearGradient>
                    </Animated.View>
                </View>

                <Text style={styles.title}>{title}</Text>
                <Text
                    style={[styles.subtitle, isQueued && styles.subtitleQueued]}
                    testID="waiting-description"
                >
                    {description}
                </Text>

                <View style={styles.dotsRow}>
                    <Animated.View style={[styles.dot, dotStyle(dot1)]} />
                    <Animated.View style={[styles.dot, dotStyle(dot2)]} />
                    <Animated.View style={[styles.dot, dotStyle(dot3)]} />
                </View>

                {showQueueMeter ? (
                    <View style={styles.meterWrap} testID="queue-meter">
                        <View style={styles.meterRow}>
                            {slots.map((busy, idx) => (
                                <View
                                    key={idx}
                                    style={[styles.slot, busy ? styles.slotBusy : styles.slotFree]}
                                />
                            ))}
                        </View>
                        <Text style={styles.meterLabel}>
                            {format(fr.waitingScreen.agents_busy, {
                                processing: queueInfo.processing_total || 0,
                                max: queueInfo.max_workers,
                            })}
                        </Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    content: {
        alignItems: 'center',
    },
    iconWrap: {
        width: 128,
        height: 128,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    ring: {
        position: 'absolute',
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 2,
    },
    ringProcessing: {
        borderColor: '#2E6F40',
    },
    ringQueued: {
        borderColor: '#97572B',
    },
    gradient: {
        width: 128,
        height: 128,
        borderRadius: 64,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
        elevation: 6,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#000000',
        letterSpacing: -0.4,
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitle: {
        color: '#3a6b50',
        fontSize: 15,
        textAlign: 'center',
        paddingHorizontal: 12,
    },
    subtitleQueued: {
        color: '#97572B',
        fontWeight: '600',
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 14,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#97572B',
    },
    meterWrap: {
        marginTop: 18,
        alignItems: 'center',
    },
    meterRow: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 6,
    },
    slot: {
        width: 18,
        height: 6,
        borderRadius: 3,
    },
    slotBusy: {
        backgroundColor: '#97572B',
    },
    slotFree: {
        backgroundColor: 'rgba(151,87,43,0.18)',
    },
    meterLabel: {
        fontSize: 11,
        color: '#97572B',
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
