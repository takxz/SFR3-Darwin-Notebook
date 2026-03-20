
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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
const BattleButton = ({ children, onPress, disabled, style, colors }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

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
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

export const BattleOverlay = ({ 
    hit, combo, isSpecial, isIntro, 
    cinematicAnim, comboScaleAnim, 
    stats, turn, isMyTurn, // NOUVEAUX PROPS NETWORK
    sendAction, triggerHit, triggerSpecial, onQuit 
}) => {
    return (
        <View style={styles.overlay} pointerEvents="box-none">
            {/* CINEMATIC BARS */}
            <Animated.View style={[styles.blackBar, { top: 0, transform: [{ translateY: cinematicAnim.interpolate({ inputRange: [0, 1], outputRange: [-120, 0] }) }] }]} />
            <Animated.View style={[styles.blackBar, { bottom: 0, transform: [{ translateY: cinematicAnim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) }] }]} />
            
            {/* LOBBY / WAITING STATE */}
            {isIntro && (
                <View style={styles.lobbyContainer}>
                    <Text style={styles.lobbyTitle}>MATCHMAKING IN PROGRESS...</Text>
                    <Text style={styles.lobbySubtext}>CONNECTING TO VPS @ ikdeksmp.fr:12000</Text>
                    
                    <View style={styles.statusBox}>
                        <Text style={styles.statusText}>{hit > 10 ? "⚠️ SERVER STalled?" : "⌛ SEARCHING FOR OPPONENT..."}</Text>
                    </View>

                    <TouchableOpacity 
                        style={styles.debugButton} 
                        onPress={triggerSpecial} // On utilise le callback spécial pour forcer le start dans App.js
                    >
                        <Text style={styles.debugText}>[ FORCE ARENA OPEN ]</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* HUD: HEALTH BARS & STATS (NETWORK DRIVEN) */}
            {!isIntro && (
                <View style={[styles.hudContainer, { top: 60 }]}>
                    {/* BASE STATS TACTICAL READOUT */}
                    <View style={styles.statsReadout}>
                        <Text style={styles.statText}>ATK <Text style={styles.statValue}>55</Text></Text>
                        <Text style={styles.statDivider}>|</Text>
                        <Text style={styles.statText}>DEF <Text style={styles.statValue}>75</Text></Text>
                        <Text style={styles.statDivider}>|</Text>
                        <Text style={styles.statText}>SPD <Text style={styles.statValue}>40</Text></Text>
                        <Text style={styles.statDivider}>|</Text>
                        <Text style={styles.statText}>SPC <Text style={styles.statValue}>60</Text></Text>
                    </View>

                    <View style={styles.healthRow}>
                        <View style={styles.healthBarWrapper}>
                            <View style={[styles.healthBar, { width: `${(stats.hp / stats.maxHp) * 100}%`, backgroundColor: '#44ff00' }]} />
                            <Text style={styles.hpLabel}>HERO: {stats.hp} HP</Text>
                        </View>
                        <View style={styles.healthBarWrapper}>
                            <View style={[styles.healthBar, { width: `${(stats.opHp / stats.opMaxHp) * 100}%`, backgroundColor: '#ff4400', alignSelf: 'flex-end' }]} />
                            <Text style={[styles.hpLabel, { textAlign: 'right' }]}>GOLEM: {stats.opHp} HP</Text>
                        </View>
                    </View>
                    <Text style={styles.turnIndicator}>{isMyTurn ? "VOTRE TOUR" : "ATTENTE ADVERSAIRE..."}</Text>
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

            {/* ENEMY BADGE */}
            {isIntro && (
                <Animated.View style={[styles.enemyBadge, { opacity: cinematicAnim }]}>
                    <Text style={styles.enemyLevel}>LVL 99</Text>
                    <Text style={styles.enemyName}>ABYSSAL GOLEM</Text>
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

            {/* ACTION BUTTONS */}
            {!isIntro && (
                <View style={styles.actionMenuContainer}>
                    <View style={styles.actionRow}>
                        <BattleButton 
                            onPress={() => isMyTurn && sendAction('ATTACK')} 
                            disabled={!isMyTurn || isSpecial || stats.hp <= 0 || stats.opHp <= 0} 
                            style={styles.actionBtnTop}
                            colors={['#d14d53', '#8e1b1b']}
                        >
                            <Ionicons name="flash-outline" size={24} color="white" />
                            <Text style={styles.actionText}>Attaque</Text>
                        </BattleButton>

                        <BattleButton 
                            onPress={() => isMyTurn && sendAction('DEFEND')} 
                            disabled={!isMyTurn || isSpecial || stats.hp <= 0 || stats.opHp <= 0} 
                            style={styles.actionBtnTop}
                            colors={['#6bb57c', '#2c693b']}
                        >
                            <Ionicons name="shield-outline" size={24} color="white" />
                            <Text style={styles.actionText}>Défense</Text>
                        </BattleButton>

                        <BattleButton 
                            onPress={() => {
                                if (isMyTurn && !isSpecial) {
                                    triggerSpecial();
                                    sendAction('ATTACK'); 
                                }
                            }} 
                            disabled={isSpecial || !isMyTurn || stats.hp <= 0 || stats.opHp <= 0} 
                            style={styles.actionBtnTop}
                            colors={['#71b5d6', '#327094']}
                        >
                            <MaterialCommunityIcons name="weather-windy" size={24} color="white" />
                            <Text style={styles.actionText}>
                                {stats.specialCooldown > 0 ? `CD: ${stats.specialCooldown}` : "Spécial"}
                            </Text>
                        </BattleButton>
                    </View>

                    <View style={styles.actionRow}>
                        <BattleButton 
                            activeOpacity={0.7} 
                            style={styles.actionBtnBottom}
                            colors={['#b87c53', '#69381b']}
                        >
                            <Ionicons name="arrow-back-outline" size={24} color="white" />
                            <Text style={styles.actionText}>Fuir</Text>
                        </BattleButton>

                        <BattleButton 
                            onPress={() => isMyTurn && sendAction('HEAL')} 
                            disabled={!isMyTurn || isSpecial || stats.hp <= 0 || stats.opHp <= 0} 
                            style={styles.actionBtnBottom}
                            colors={['#b87c53', '#69381b']}
                        >
                            <Ionicons name="play-skip-forward-outline" size={24} color="white" />
                            <Text style={styles.actionText}>Passer</Text>
                        </BattleButton>
                    </View>
                </View>
            )}

            {/* RESULTS OVERLAY */}
            {(stats.hp <= 0 || stats.opHp <= 0) && (
                <View style={styles.resultsOverlay}>
                    <Text style={styles.resultTitle}>{stats.hp <= 0 ? "GAME OVER" : "VICTORY"}</Text>
                    <Text style={styles.resultSubtext}>{stats.hp <= 0 ? "YOU HAVE FALLEN..." : "THE ABYSS HAS BEEN CONQUERED"}</Text>
                    
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
    actionMenuContainer: { width: '100%', paddingHorizontal: 15, gap: 10, paddingBottom: 30 },
    actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
    actionBtnTop: { flex: 1, height: 75, position: 'relative' },
    actionBtnBottom: { width: '45%', height: 75, position: 'relative' },
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
    quitBtn: { marginTop: 40, width: '70%', height: 60 }
});

