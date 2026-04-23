
import { useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { AUDIO_ASSETS } from '../constants/FightAssets';


export const useBattleManager = (setSceneReady) => {
    // ⚔️ STATES
    const [hit, setHit] = useState(0);
    const [enemyHit, setEnemyHit] = useState(0);
    const [combo, setCombo] = useState(0);
    const [isSpecial, setIsSpecial] = useState(false);
    const [isBerserkStrike, setIsBerserkStrike] = useState(false);
    const [isFinisher, setIsFinisher] = useState(false);
    const [isIntro, setIsIntro] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    const [zawarudoProgress, setZawarudoProgress] = useState(0);

    // ⚔️ REFS & AUDIO
    const hitPoolRef = useRef([]);
    const nextHitIndex = useRef(0);
    const comboTimeout = useRef(null);

    // ⚔️ ANIMATIONS
    const comboScaleAnim = useRef(new Animated.Value(0)).current;
    const cinematicAnim = useRef(new Animated.Value(0)).current;
    const zawarudoAnim = useRef(new Animated.Value(0)).current;
    const btnScaleAnim = useRef(new Animated.Value(1)).current;

    // Sync Zawarudo progress for Shaders
    useEffect(() => {
        const id = zawarudoAnim.addListener(({ value }) => setZawarudoProgress(value));
        return () => zawarudoAnim.removeListener(id);
    }, []);

    // Load Audio Pool
    useEffect(() => {
        async function loadAudio() {
            try {
                for (let i = 0; i < 5; i++) {
                    const soundAsset = AUDIO_ASSETS.HITS[i % AUDIO_ASSETS.HITS.length];
                    const { sound } = await Audio.Sound.createAsync(soundAsset);
                    hitPoolRef.current.push(sound);
                }
                setAudioReady(true);
            } catch (e) {
                console.log("Audio load error:", e);
                setAudioReady(true);
            }
        }
        loadAudio();
        return () => hitPoolRef.current.forEach(s => s.unloadAsync());
    }, []);

    // Intro Sequence (Splash/Cinematic Bars IN)
    useEffect(() => {
        if (isLoaded) {
            Animated.timing(cinematicAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
            
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 600);
            setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 1000);
        }
    }, [isLoaded]);

    const startBattleSequence = () => {
        Animated.timing(cinematicAnim, { toValue: 0, duration: 800, useNativeDriver: true }).start(() => {
            setIsIntro(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        });
    };

    const triggerPlayerHit = () => {
        setHit(h => h + 1);
        setCombo(c => c + 1);

        if (hitPoolRef.current.length > 0) {
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
        setTimeout(() => setHit(0), 150); // Increased from 40ms for Android React Native Bridge sync
    };

    const triggerEnemyHit = () => {
        setEnemyHit(h => h + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => setEnemyHit(0), 150); // Increased from 40ms for Android
    };

    const triggerSpecial = async () => {
        if (isSpecial) return;
        setIsSpecial(true);

        Animated.timing(zawarudoAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        Animated.spring(cinematicAnim, { toValue: 1, useNativeDriver: true }).start();

        setTimeout(() => {
            setIsBerserkStrike(true);
            let count = 0;
            const interval = setInterval(() => {
                triggerPlayerHit();
                count++;
                if (count >= 35) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setIsFinisher(true);
                        triggerPlayerHit();
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setTimeout(() => {
                            Animated.timing(zawarudoAnim, { toValue: 0, duration: 800, useNativeDriver: true }).start();
                            Animated.timing(cinematicAnim, { toValue: 0, duration: 800, useNativeDriver: true }).start();
                            setTimeout(() => {
                                setIsSpecial(false);
                                setIsBerserkStrike(false);
                                setIsFinisher(false);
                            }, 800);
                        }, 500);
                    }, 600);
                }
            }, 85);
        }, 800);
    };

    const triggerEnemySpecial = async () => {
        if (isSpecial) return;
        setIsSpecial(true);

        Animated.timing(zawarudoAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        Animated.spring(cinematicAnim, { toValue: 1, useNativeDriver: true }).start();

        setTimeout(() => {
            setIsBerserkStrike(true);
            let count = 0;
            const interval = setInterval(() => {
                triggerEnemyHit();
                count++;
                if (count >= 35) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setIsFinisher(true);
                        triggerEnemyHit();
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        setTimeout(() => {
                            Animated.timing(zawarudoAnim, { toValue: 0, duration: 800, useNativeDriver: true }).start();
                            Animated.timing(cinematicAnim, { toValue: 0, duration: 800, useNativeDriver: true }).start();
                            setTimeout(() => {
                                setIsSpecial(false);
                                setIsBerserkStrike(false);
                                setIsFinisher(false);
                            }, 800);
                        }, 500);
                    }, 600);
                }
            }, 85);
        }, 800);
    };

    return {
        hit, enemyHit, combo, isSpecial, isBerserkStrike, isFinisher, isIntro, setIsIntro, isLoaded, setIsLoaded,
        zawarudoProgress, audioReady,
        cinematicAnim, comboScaleAnim, btnScaleAnim,
        triggerPlayerHit, triggerEnemyHit, triggerSpecial, triggerEnemySpecial, startBattleSequence
    };
};
