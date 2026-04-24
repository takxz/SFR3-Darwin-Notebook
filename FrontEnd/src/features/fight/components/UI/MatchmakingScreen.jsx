import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import socketService from '@/services/SocketService';
import fr from '@/assets/locales/fr.json';

export const MatchmakingScreen = ({ onCancel }) => {
    const router = useRouter();
    const spinAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        // Spinning circle animation
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Indeterminate progress bar animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(progressAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: false,
                }),
                Animated.timing(progressAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: false,
                })
            ])
        ).start();

        // Timer
        const interval = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    const handleCancel = () => {
        socketService.disconnect();
        if (onCancel) onCancel();
        router.back();
    };

    return (
        <LinearGradient
            colors={['#5E8E6A', '#8EBAC8']}
            style={styles.container}
        >
            <View style={styles.gridOverlay} />

            <View style={styles.content}>
                {/* Spinner */}
                <View style={styles.spinnerContainer}>
                    <Animated.View style={[styles.spinnerRing, { transform: [{ rotate: spin }] }]} />
                </View>

                {/* Texts */}
                <Text style={styles.title}>{fr.matchmakingScreen.title}</Text>
                <Text style={styles.subtitle}>{fr.matchmakingScreen.subtitle}</Text>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                    <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
                </View>

                {/* Timer Pill */}
                <View style={styles.timerPill}>
                    <Text style={styles.timerText}>{seconds}s</Text>
                </View>

                {/* Dots */}
                <View style={styles.dotsContainer}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                </View>

                {/* Cancel Button */}
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <X size={18} color="#ffffff" />
                    <Text style={styles.cancelButtonText}>{fr.matchmakingScreen.cancel}</Text>
                </TouchableOpacity>
            </View>

            {/* Tip */}
            <Text style={styles.tipText}>
                {fr.matchmakingScreen.tip}
            </Text>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.1,
        // Simulation of a grid with borders (simplified)
        borderWidth: 1,
        borderColor: '#ffffff',
        borderStyle: 'dashed',
    },
    content: {
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 40,
    },
    spinnerContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#8C4B27',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    spinnerRing: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 6,
        borderColor: '#ffffff',
        borderTopColor: 'transparent',
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#ffffff',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 30,
        fontWeight: '600',
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 40,
        borderWidth: 1,
        borderColor: '#8C4B27',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#D13B2E',
    },
    timerPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    timerText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 60,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.3)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        gap: 8,
    },
    cancelButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    tipText: {
        position: 'absolute',
        bottom: 50,
        textAlign: 'center',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '500',
        paddingHorizontal: 20,
    }
});
