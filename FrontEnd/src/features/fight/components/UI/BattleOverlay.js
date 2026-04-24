
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, Easing, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import socketService from '@/services/SocketService';

/**
 * 🌟 ROTATING HALO COMPONENT
 */
const RotatingHalo = ({ intensity = 0.3 }) => {
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 8000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.borderBeamContainer} pointerEvents="none">
            {/* BOLD WHITE BORDER THAT LIGHTS UP ON PRESS */}
            <Animated.View style={[
                StyleSheet.absoluteFill,
                {
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    borderRadius: 14,
                    opacity: intensity.interpolate({
                        inputRange: [0.3, 1.0],
                        outputRange: [0, 1.0]
                    })
                }
            ]} />

            {/* ROTATING TRACER BEAM */}
            <Animated.View style={[styles.haloLine, { transform: [{ rotate }], opacity: intensity }]}>
                <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.9)', 'transparent']}
                    locations={[0.3, 0.5, 0.7]}
                    style={{ flex: 1 }}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </Animated.View>
        </View>
    );
};

/**
 * 🕹️ ANIMATED BATTLE BUTTON COMPONENT
 */
const BattleButton = ({ children, onPress, disabled, style, colors, progress = 1 }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(progress)).current;

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 120, // Légèrement plus long que le tick rate (100ms) pour lisser
            easing: Easing.linear,
            useNativeDriver: true,
        }).start();
    }, [progress]);

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1.05, friction: 3, tension: 40, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: true })
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
            Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: true })
        ]).start();
    };

    const intensity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 1.0]
    });

    // Translation du voile vers le haut pour révéler le bouton de bas en haut
    const translateY = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -80] // -80 car les boutons font environ 75 de haut
    });

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={[style, disabled && { opacity: 0.5 }]}
        >
            <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
                <RotatingHalo intensity={intensity} />
                <View style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>
                    <LinearGradient colors={colors} style={styles.actionButton}>
                        {children}
                    </LinearGradient>

                    {/* COOLDOWN PROGRESS OVERLAY (Animé fluidement) */}
                    <Animated.View
                        pointerEvents="none"
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                backgroundColor: 'rgba(0,0,0,0.65)',
                                transform: [{ translateY }],
                                zIndex: 10
                            }
                        ]}
                    />
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

/**
 * 🎨 STROKED TEXT COMPONENT (HACK POUR OUTLINE SOLIDE)
 */
const StrokedText = ({ children, text, style, strokeColor = "#FFD700", strokeWidth = 3 }) => {
    const content = text || children;
    return (
        <View style={{ position: 'relative' }}>
            {/* LES 4 COUCHES DE STROKE */}
            <Text style={[style, { color: strokeColor, position: 'absolute', top: -strokeWidth, left: -strokeWidth }]}>{content}</Text>
            <Text style={[style, { color: strokeColor, position: 'absolute', top: -strokeWidth, left: strokeWidth }]}>{content}</Text>
            <Text style={[style, { color: strokeColor, position: 'absolute', top: strokeWidth, left: -strokeWidth }]}>{content}</Text>
            <Text style={[style, { color: strokeColor, position: 'absolute', top: strokeWidth, left: strokeWidth }]}>{content}</Text>

            {/* TEXTE PRINCIPAL PAR DESSUS */}
            <Text style={style}>{content}</Text>
        </View>
    );
};

/**
 * ⏳ COUNTDOWN OVERLAY
 */
const CountdownOverlay = ({ countdown }) => {
    const scaleAnim = useRef(new Animated.Value(3)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const text = countdown > 3000 ? "3" : countdown > 2000 ? "2" : countdown > 1000 ? "1" : "GO !";

    useEffect(() => {
        if (countdown > 0) {
            scaleAnim.setValue(4);
            opacityAnim.setValue(0);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 3,
                    tension: 60,
                    useNativeDriver: true
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true
                })
            ]).start();
        }
    }, [text]);

    if (countdown <= 0) return null;

    return (
        <View style={styles.countdownOverlay} pointerEvents="none">
            <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
                <StrokedText style={styles.countdownText}>{text}</StrokedText>
            </Animated.View>
        </View>
    );
};

/**
 * 💥 BATTLE EVENT OVERLAY
 */
const BattleEventOverlay = ({ event, myNickname }) => {
    const [displayEvent, setDisplayEvent] = useState(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (event && event.id) {
            setDisplayEvent(event);
            scaleAnim.setValue(1.5);
            opacityAnim.setValue(1);

            Animated.sequence([
                Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 50, useNativeDriver: true }),
                Animated.delay(1000),
                Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true })
            ]).start();
        }
    }, [event?.id]);

    if (!displayEvent) return null;

    let message = "";
    let color = "#fff";

    const isMeAttacker = displayEvent.attacker === myNickname;

    if (displayEvent.type === 'DAMAGE') {
        message = isMeAttacker ? `DÉGÂTS : ${displayEvent.value}` : `TOUCHÉ ! -${displayEvent.value}`;
        color = isMeAttacker ? "#6bb57c" : "#d14d53";
    } else if (displayEvent.type === 'PARRY') {
        message = isMeAttacker ? "PARADE RÉUSSIE !" : "ATTAQUE PARÉE !";
        color = "#71b5d6";
    } else if (displayEvent.type === 'INTERRUPT') {
        message = isMeAttacker ? "INTERRUPTION !" : "INTERROMPU !";
        color = "#ffaa00";
    }

    return (
        <View style={styles.eventOverlay} pointerEvents="none">
            <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
                <StrokedText style={[styles.eventText, { color }]}>{message}</StrokedText>
            </Animated.View>
        </View>
    );
};

export const BattleOverlay = ({
    hit, combo, isSpecial, isIntro,
    cinematicAnim, comboScaleAnim,
    stats, result, // NOUVEAUX PROPS NETWORK
    sendAction, triggerHit, triggerSpecial, onFlee, onQuit,
    isDebugMode
}) => {
    // Détermination de la victoire/défaite
    const isVictory = result ? result.winner === socketService.socket?.id : stats.opHp <= 0;
    const isGameOver = result || stats.hp <= 0 || stats.opHp <= 0;
    const isDisconnect = result?.reason === 'DISCONNECT';

    return (
        <View style={styles.overlay} pointerEvents="box-none">
            {/* CINEMATIC BARS */}
            <Animated.View style={[styles.blackBar, { top: 0, transform: [{ translateY: cinematicAnim.interpolate({ inputRange: [0, 1], outputRange: [-120, 0] }) }] }]} />
            <Animated.View style={[styles.blackBar, { bottom: 0, transform: [{ translateY: cinematicAnim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) }] }]} />

            {/* LOBBY / WAITING STATE */}
            {isIntro && (
                <View style={styles.lobbyContainer}>
                    <Text style={styles.lobbyTitle}>MATCHMAKING EN COURS...</Text>

                    <View style={styles.statusBox}>
                        <Text style={styles.statusText}>RECHERCHE D'UN ADVERSAIRE...</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.debugButton}
                        onPress={triggerSpecial} // On utilise le callback spécial pour forcer le start dans App.js
                    >
                        <Text style={styles.debugText}>[ forcer le début du combat ]</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* HUD: HEALTH BARS & STATS (NETWORK DRIVEN) */}
            {!isIntro && (
                <View style={[styles.hudContainer, { top: 30 }]}>
                    {/* BASE STATS TACTICAL READOUT */}
                    <View style={styles.statsReadout}>
                        <Text style={styles.statText}>ATK <Text style={styles.statValue}>{stats.atk}</Text></Text>
                        <Text style={styles.statDivider}>|</Text>
                        <Text style={styles.statText}>DEF <Text style={styles.statValue}>{stats.def}</Text></Text>
                        <Text style={styles.statDivider}>|</Text>
                        <Text style={styles.statText}>SPD <Text style={styles.statValue}>{stats.speed}</Text></Text>
                    </View>

                    <View style={styles.healthRow}>
                        <View style={styles.healthBarWrapper}>                        </View>
                        <View style={styles.healthBarWrapper}>
                            <View testID='hero-health-bar' style={[styles.healthBar, { width: `${(stats.hp / (stats.maxHp || 100)) * 100}%`, backgroundColor: '#6bb57c' }]} />
                            <Text style={styles.hpLabel}>{stats.nickname}: {Math.round(stats.hp)} / {stats.maxHp}</Text>
                        </View>
                        <View style={styles.healthBarWrapper}>
                            <View testID='enemy-health-bar' style={[styles.healthBar, { width: `${(stats.opHp / (stats.opMaxHp || 100)) * 100}%`, backgroundColor: '#a12b2b', alignSelf: 'flex-end' }]} />
                            <Text style={[styles.hpLabel, { textAlign: 'right' }]}>{stats.opNickname}: {Math.round(stats.opHp)} / {stats.opMaxHp}</Text>
                        </View>
                    </View>

                    {/* FLEE BUTTON (Top Left under health) */}
                    <TouchableOpacity
                        style={styles.fleeBtnTop}
                        onPress={() => {
                            if (isSpecial || stats.hp <= 0 || stats.opHp <= 0) return;
                            Alert.alert(
                                "Abandonner le combat ?",
                                "Si vous fuyez, vous serez déclaré vaincu. Voulez-vous continuer ?",
                                [
                                    { text: "Rester et me battre", style: "cancel" },
                                    { text: "Fuir", onPress: () => onFlee(), style: "destructive" }
                                ]
                            );
                        }}
                        disabled={isSpecial || stats.hp <= 0 || stats.opHp <= 0}
                    >
                        <Ionicons name="walk-outline" size={22} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                </View>
            )}

            {/* HIT FLASH OVERLAY */}
            {hit > 0 && (
                <LinearGradient
                    colors={[isSpecial ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.5)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                />
            )}

            {/* BERSERK RAGE TEXT */}
            {isSpecial && (
                <View style={styles.cinematicHeader}>
                    <Text style={styles.cinematicText}>BERSERK RAGE</Text>
                </View>
            )}

            {/* START COUNTDOWN */}
            {!isIntro && <CountdownOverlay countdown={stats.countdown} />}

            {/* BATTLE EVENTS */}
            {!isIntro && stats.countdown === 0 && <BattleEventOverlay event={stats.lastEvent} myNickname={stats.nickname} />}

            {/* ENEMY BADGE */}
            {isIntro && (
                <Animated.View style={[styles.enemyBadge, { opacity: cinematicAnim }]}>
                    <Text testID='enemy-badge' style={styles.enemyName}>{stats.opNickname}</Text>
                </Animated.View>
            )}

            {/* COMBO COUNTER */}
            <View style={styles.topInfo}>
                {combo > 1 && (
                    <Animated.View style={[styles.comboContainer, { transform: [{ scale: comboScaleAnim }] }]}>
                        <Text style={styles.comboNumber}>{combo}</Text>
                        <Text style={styles.comboText}>ULTRA COMBO!</Text>
                    </Animated.View>
                )}
            </View>

            {/* ACTION BUTTONS (2x2 GRID) */}
            {!isIntro && (
                <View style={styles.actionMenuContainer}>
                    {/* LIGNE 1 */}
                    <View style={styles.actionRow}>
                        <BattleButton
                            onPress={() => !isDebugMode && sendAction('LIGHT_ATTACK')}
                            disabled={isSpecial || stats.hp <= 0 || stats.opHp <= 0 || stats.action !== 'IDLE' || stats.lightCooldown > 0 || stats.countdown > 0}
                            style={styles.gridBtn}
                            colors={['#d14d53', '#a12b2b']}
                            progress={stats.lightCooldown > 0 ? 1 - (stats.lightCooldown / 1200) : 1}
                        >
                            <Ionicons name="flash-outline" size={24} color="white" />
                            <Text style={styles.actionText}>Légère</Text>
                        </BattleButton>

                        <BattleButton
                            onPress={() => !isDebugMode && sendAction('HEAVY_ATTACK')}
                            disabled={isSpecial || stats.hp <= 0 || stats.opHp <= 0 || stats.action !== 'IDLE' || stats.heavyCooldown > 0 || stats.countdown > 0}
                            style={styles.gridBtn}
                            colors={['#8e1b1b', '#5a0d0d']}
                            progress={stats.heavyCooldown > 0 ? 1 - (stats.heavyCooldown / 2500) : 1}
                        >
                            <MaterialCommunityIcons name="gavel" size={24} color="white" />
                            <Text style={styles.actionText}>Lourde</Text>
                        </BattleButton>
                    </View>

                    {/* LIGNE 2 */}
                    <View style={styles.actionRow}>
                        <BattleButton
                            onPress={() => {
                                if (!isSpecial && stats.specialReady) {
                                    triggerSpecial();
                                    sendAction('SPECIAL');
                                }
                            }}
                            disabled={isSpecial || stats.hp <= 0 || stats.opHp <= 0 || !stats.specialReady || stats.action !== 'IDLE' || stats.countdown > 0}
                            style={styles.gridBtn}
                            colors={['#71b5d6', '#327094']}
                        >
                            <MaterialCommunityIcons name="weather-windy" size={24} color="white" />
                            <Text style={styles.actionText}>
                                {stats.specialReady ? "Spécial" : `${stats.specialCharge}/50`}
                            </Text>
                        </BattleButton>

                        <BattleButton
                            onPress={() => !isDebugMode && sendAction('DEFEND')}
                            disabled={isSpecial || stats.hp <= 0 || stats.opHp <= 0 || stats.action !== 'IDLE' || stats.parryCooldown > 0 || stats.countdown > 0}
                            style={styles.gridBtn}
                            colors={['#6bb57c', '#2c693b']}
                            progress={stats.parryCooldown > 0 ? 1 - (stats.parryCooldown / 3000) : 1}
                        >
                            <Ionicons name="shield-outline" size={24} color="white" />
                            <Text style={styles.actionText}>
                                {stats.parryCooldown > 0 ? 'RECHARGE' : 'Parer'}
                            </Text>
                        </BattleButton>
                    </View>
                </View>
            )}

            {/* RESULTS OVERLAY */}
            {isGameOver && (
                <View style={styles.resultsOverlay}>
                    <Text style={styles.resultTitle}>{isVictory ? "VICTOIRE" : "DÉFAITE"}</Text>
                    <Text testID={stats.hp <= 0 ? "defeat-text" : "victory-text"} style={styles.resultSubtext}>
                        {isDisconnect
                            ? "L'ADVERSAIRE S'EST DÉCONNECTÉ"
                            : (isVictory ? `${stats.opNickname} A ÉTÉ TERRASSÉ !` : "VOUS AVEZ ÉTÉ VAINCU...")
                        }
                    </Text>

                    <BattleButton
                        onPress={onQuit}
                        style={styles.quitBtn}
                        colors={['#ffffff', '#aaaaaa']}
                    >
                        <Text style={[styles.actionText, { color: '#000', marginTop: 0 }]}>RETOURNER AU MENU</Text>
                    </BattleButton>
                </View>
            )}
        </View>
    );
};


const styles = StyleSheet.create({
    overlay: { position: 'absolute', bottom: 0, top: 0, width: '100%', justifyContent: 'space-between', paddingVertical: 40 },
    hudContainer: { width: '90%', alignSelf: 'center', top: 120 },
    healthRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 20 },
    statsReadout: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 4, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: '#555', marginBottom: 10, gap: 10 },
    statText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    statValue: { color: '#ffffff', fontSize: 12 },
    statDivider: { color: 'rgba(255,255,255,0.2)', fontSize: 10 },
    healthBarWrapper: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', height: 26, borderRadius: 13, padding: 3, borderWidth: 1, borderColor: '#333' },
    healthBar: { height: '100%', borderRadius: 10 },
    hpLabel: { color: '#fff', fontSize: 10, fontWeight: 'bold', position: 'absolute', width: '100%', textAlign: 'center', top: 6 },
    turnIndicator: { color: '#ffaa00', textAlign: 'center', marginTop: 10, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
    lobbyContainer: { position: 'absolute', top: '45%', width: '100%', alignItems: 'center', zIndex: 1001 },
    lobbyTitle: { color: '#ffaa00', fontSize: 18, fontWeight: '900', letterSpacing: 4 },
    lobbySubtext: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 10, letterSpacing: 2 },
    statusBox: { marginTop: 30, backgroundColor: 'rgba(255,170,0,0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ffaa00' },
    statusText: { color: '#ffaa00', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    debugButton: { position: 'absolute', bottom: -100, opacity: 0.3 },
    debugText: { color: '#ffffff', fontSize: 10, letterSpacing: 2 },
    resultsOverlay: { position: 'absolute', top: '35%', width: '100%', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingVertical: 40, zIndex: 2000 },
    resultTitle: { color: '#fff', fontSize: 52, fontWeight: '900', letterSpacing: 8, textShadowColor: '#ff0000', textShadowRadius: 20 },
    resultSubtext: { color: '#ffaa00', fontSize: 14, fontWeight: 'bold', marginTop: 10, letterSpacing: 4 },
    topInfo: { alignItems: 'center', height: 120, top: 80 },
    actionMenuContainer: { width: '100%', paddingHorizontal: 20, gap: 12, paddingBottom: 40 },
    actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
    gridBtn: { flex: 1, height: 70, position: 'relative' },
    fleeBtnTop: { marginTop: 10, padding: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    borderBeamContainer: { position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    haloLine: { position: 'absolute', width: 300, height: 300, top: '50%', left: '50%', marginTop: -150, marginLeft: -150, opacity: 0.3 },
    actionButton: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 5, gap: 4, borderRadius: 12, overflow: 'hidden' },
    actionText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
    comboContainer: { alignItems: 'center' },
    comboNumber: { color: '#ffaa00', fontSize: 90, fontWeight: '900' },
    comboText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', letterSpacing: 4, textTransform: 'uppercase' },
    blackBar: { position: 'absolute', height: 120, width: '100%', backgroundColor: '#000', zIndex: 1000 },
    cinematicHeader: { position: 'absolute', top: 80, alignSelf: 'center', zIndex: 1001 },
    cinematicText: { color: '#ff3300', fontSize: 28, fontWeight: '900', letterSpacing: 8 },
    enemyBadge: { position: 'absolute', top: 100, alignSelf: 'center', backgroundColor: 'rgba(0, 0, 0, 0.75)', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 4, borderLeftWidth: 4, borderLeftColor: '#ff4400', alignItems: 'center', zIndex: 1002 },
    enemyLevel: { color: '#ffaa00', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
    enemyName: { color: '#ffffff', fontSize: 24, fontWeight: '900', letterSpacing: 4, marginTop: 4 },
    quitBtn: { marginTop: 40, width: '70%', height: 60 },
    countdownOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
    countdownText: {
        color: '#fff',
        fontSize: 140,
        fontWeight: '900',
        fontStyle: 'italic',
        letterSpacing: -5,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    eventOverlay: { position: 'absolute', top: '40%', width: '100%', alignItems: 'center', zIndex: 2500 },
    eventText: {
        fontSize: 34,
        fontWeight: '900',
        fontStyle: 'italic',
        textTransform: 'uppercase',
        letterSpacing: 2,
        paddingHorizontal: 10
    }
});
