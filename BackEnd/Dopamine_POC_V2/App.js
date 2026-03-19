
import React, { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Animated } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { useProgress } from '@react-three/drei/native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Audio } from 'expo-av';

// LOCAL SRC IMPORTS
import { AUDIO_ASSETS } from './src/constants/Assets';
import Scene from './src/components/3D/Scene';
import { LoadingScreen } from './src/components/UI/LoadingScreen';

const { width, height } = Dimensions.get('window');

/**
 * MAIN ENTRANCE: DOPAMINE 2.0 (REFACTORED)
 */
export default function App() {
    // 💀 CORE BATTLE STATES
    const [hit, setHit] = useState(0);
    const [combo, setCombo] = useState(0);
    const [isSpecial, setIsSpecial] = useState(false);
    const [isIntro, setIsIntro] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [themeColor, setThemeColor] = useState("#ff4400");

    // 💀 SYNC & IO REFS
    const bgmRef = useRef(null);
    const specialBgmRef = useRef(null);
    const hitPoolRef = useRef([]);
    const nextHitIndex = useRef(0);
    const comboTimeout = useRef(null);

    // 💀 ASSET MONITORING (REAL-TIME PROGRESS)
    const { progress: progressPercent } = useProgress();
    const [sceneReady, setSceneReady] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    const [loadTasks, setLoadTasks] = useState(0);

    // 💀 ANIMATIONS
    const btnScaleAnim = useRef(new Animated.Value(1)).current;
    const comboScaleAnim = useRef(new Animated.Value(0)).current;
    const cinematicAnim = useRef(new Animated.Value(0)).current;
    const zawarudoAnim = useRef(new Animated.Value(0)).current;
    const [zawarudoProgress, setZawarudoProgress] = useState(0);

    useEffect(() => {
        const id = zawarudoAnim.addListener(({ value }) => setZawarudoProgress(value));
        return () => zawarudoAnim.removeListener(id);
    }, []);

    // 1. SOUND MANAGER INITIALIZATION
    useEffect(() => {
        async function loadAudio() {
            try {
                // Initialize Global BGM
                const { sound: bgm } = await Audio.Sound.createAsync(AUDIO_ASSETS.BGM, { isLooping: true, volume: 0.3 });
                bgmRef.current = bgm;
                setLoadTasks(n => n + 1); // TASK 1 DONE (BGM)

                // Initialize Special BGM (Pre-cached)
                const { sound: specialBgm } = await Audio.Sound.createAsync(AUDIO_ASSETS.SPECIAL_BGM, { isLooping: false, volume: 1.0 });
                specialBgmRef.current = specialBgm;

                // Pre-load Hit SFX Pool
                for (let i = 0; i < 5; i++) {
                    const soundAsset = AUDIO_ASSETS.HITS[i % AUDIO_ASSETS.HITS.length];
                    const { sound } = await Audio.Sound.createAsync(soundAsset);
                    hitPoolRef.current.push(sound);
                }

                setAudioReady(true);
            } catch (e) {
                console.log("Audio files missing in assets/", e);
                setAudioReady(true);
                setLoadTasks(6);
            }
        }
        loadAudio();
        return () => {
            bgmRef.current?.unloadAsync();
            specialBgmRef.current?.unloadAsync();
            hitPoolRef.current.forEach(s => s.unloadAsync());
        };
    }, []);

    useEffect(() => {
        if (sceneReady && audioReady) setIsLoaded(true);
    }, [sceneReady, audioReady]);

    useEffect(() => {
        if (isLoaded) {
            setTimeout(() => { bgmRef.current?.playAsync().catch(() => { }); }, 500);

            Animated.sequence([
                Animated.delay(500),
                Animated.timing(cinematicAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.delay(1200),
                Animated.timing(cinematicAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
            ]).start(() => setIsIntro(false));

            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 600);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 1000);
            setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning), 1400);
        }
    }, [isLoaded]);

    const triggerHit = () => {
        setHit(h => h + 1);
        setCombo(c => c + 1);

        if (!isMuted && hitPoolRef.current.length > 0) {
            const sound = hitPoolRef.current[nextHitIndex.current];
            sound?.replayAsync().catch(() => { });
            nextHitIndex.current = (nextHitIndex.current + 1) % hitPoolRef.current.length;
        }

        if (comboTimeout.current) clearTimeout(comboTimeout.current);
        comboTimeout.current = setTimeout(() => {
            setCombo(0);
            Animated.spring(comboScaleAnim, { toValue: 0, useNativeDriver: true }).start();
        }, 1500);

        btnScaleAnim.setValue(0.8);
        Animated.spring(btnScaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();

        comboScaleAnim.setValue(1.5);
        Animated.spring(comboScaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => setHit(0), 40);
    };

    const triggerSpecial = async () => {
        if (isSpecial) return;
        setIsSpecial(true);

        if (!isMuted) {
            if (bgmRef?.current) bgmRef.current.setVolumeAsync(0.1).catch(() => { });
            if (specialBgmRef?.current) specialBgmRef.current.replayAsync().catch(() => { });
        }

        Animated.timing(zawarudoAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        Animated.spring(cinematicAnim, { toValue: 1, useNativeDriver: true }).start();

        setTimeout(() => {
            let count = 0;
            const interval = setInterval(() => {
                triggerHit();
                count++;
                if (count >= 35) {
                    clearInterval(interval);
                    setTimeout(() => {
                        triggerHit();
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setTimeout(() => {
                            Animated.timing(zawarudoAnim, { toValue: 0, duration: 800, useNativeDriver: true }).start();
                            Animated.timing(cinematicAnim, { toValue: 0, duration: 800, useNativeDriver: true }).start();
                            setTimeout(() => {
                                setIsSpecial(false);
                                bgmRef.current?.setVolumeAsync(0.3);
                                specialBgmRef.current?.stopAsync();
                            }, 800);
                        }, 500);
                    }, 600);
                }
            }, 85);
        }, 800);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {!isLoaded && <LoadingScreen progress={Math.round(progressPercent)} />}

            <Canvas
                camera={{ position: [0, 0, 22], fov: 55, far: 500 }}
                dpr={0.5}
                gl={{ antialias: false, alpha: false, stencil: false, depth: true, powerPreference: 'high-performance' }}
                onCreated={() => setSceneReady(true)}
            >
                <color attach="background" args={['#000000']} />
                <Suspense fallback={null}>
                    <Scene
                        hitTrigger={hit > 0}
                        triggerHit={triggerHit}
                        isSpecialAttack={isSpecial}
                        zawarudoProgress={zawarudoProgress}
                        combo={combo}
                        isIntro={isIntro}
                        themeColor={themeColor}
                    />
                </Suspense>
            </Canvas>

            {hit > 0 && (
                <LinearGradient
                    colors={[isSpecial ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.5)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                />
            )}

            <Animated.View style={[styles.blackBar, { top: 0, transform: [{ translateY: cinematicAnim.interpolate({ inputRange: [0, 1], outputRange: [-120, 0] }) }] }]} />
            <Animated.View style={[styles.blackBar, { bottom: 0, transform: [{ translateY: cinematicAnim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) }] }]} />

            <View style={styles.overlay} pointerEvents="box-none">
                {isSpecial && (
                    <View style={styles.cinematicHeader}>
                        <Text style={styles.cinematicText}>BERSERK RAGE</Text>
                    </View>
                )}

                {isIntro && (
                    <Animated.View style={[styles.enemyBadge, { opacity: cinematicAnim }]}>
                        <Text style={styles.enemyLevel}>LVL 99</Text>
                        <Text style={styles.enemyName}>ABYSSAL GOLEM</Text>
                    </Animated.View>
                )}

                <View style={styles.topInfo}>
                    {combo > 1 && (
                        <Animated.View style={[styles.comboContainer, { transform: [{ scale: comboScaleAnim }] }]}>
                            <Text style={styles.comboNumber}>{combo}</Text>
                            <Text style={styles.comboText}>ULTRA COMBO!</Text>
                        </Animated.View>
                    )}
                </View>

                {!isIntro && (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={triggerHit}
                            style={[styles.mainButton, hit > 0 && { backgroundColor: '#fff' }]}
                        >
                            <Text style={styles.buttonLabel}>ATTACK</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={triggerSpecial}
                            style={[styles.specialButton, isSpecial && { opacity: 0.5 }]}
                            disabled={isSpecial}
                        >
                            <LinearGradient colors={['#ff00ff', '#800080']} style={styles.specialGradient}>
                                <Text style={styles.buttonLabel}>SPECIAL</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#152a22' },
    overlay: { position: 'absolute', bottom: 0, top: 50, width: '100%', justifyContent: 'space-between', paddingVertical: 40 },
    topInfo: { alignItems: 'center', height: 120 },
    buttonContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15, paddingBottom: 40 },
    mainButton: { backgroundColor: 'rgba(180, 20, 20, 0.3)', borderWidth: 2, borderColor: '#ffaa00', borderRadius: 25, paddingVertical: 18, paddingHorizontal: 30, minWidth: 150, alignItems: 'center' },
    specialButton: { borderRadius: 25, overflow: 'hidden', minWidth: 120, borderWidth: 2, borderColor: '#ffffff' },
    specialGradient: { paddingVertical: 18, paddingHorizontal: 25, alignItems: 'center' },
    buttonLabel: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase' },
    comboContainer: { alignItems: 'center' },
    comboNumber: { color: '#ffaa00', fontSize: 90, fontWeight: '900' },
    comboText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', letterSpacing: 4, textTransform: 'uppercase' },
    blackBar: { position: 'absolute', height: 120, width: '100%', backgroundColor: '#000', zIndex: 1000 },
    cinematicHeader: { position: 'absolute', top: 80, alignSelf: 'center', zIndex: 1001 },
    cinematicText: { color: '#ff3300', fontSize: 28, fontWeight: '900', letterSpacing: 8 },
    enemyBadge: { position: 'absolute', top: 100, alignSelf: 'center', backgroundColor: 'rgba(0, 0, 0, 0.75)', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 4, borderLeftWidth: 4, borderLeftColor: '#ff4400', alignItems: 'center', zIndex: 1002 },
    enemyLevel: { color: '#ffaa00', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
    enemyName: { color: '#ffffff', fontSize: 24, fontWeight: '900', letterSpacing: 4, marginTop: 4 }
});
