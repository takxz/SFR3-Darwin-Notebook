
import React, { useState, useEffect, Suspense } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { useProgress } from '@react-three/drei/native';
import { StatusBar } from 'expo-status-bar';

// CUSTOM MODULES
import Scene from './src/components/3D/Scene';
import { LoadingScreen } from './src/components/UI/LoadingScreen';
import { BattleOverlay } from './src/components/UI/BattleOverlay';
import { useBattleManager } from './src/hooks/useBattleManager';
import { useBattleNetwork } from './src/hooks/network/useBattleNetwork';
import socketService from './src/services/SocketService'; // Nouveau import

export default function App() {
    // ⚔️ STATE & LOGIC ORCHESTRATION
    const [sceneReady, setSceneReady] = useState(false);
    const { progress: progressPercent } = useProgress();
    
    const {
        hit, enemyHit, combo, isSpecial, isBerserkStrike, isFinisher, isIntro, setIsIntro, isLoaded, setIsLoaded,
        zawarudoProgress, audioReady,
        cinematicAnim, comboScaleAnim,
        triggerPlayerHit, triggerEnemyHit, triggerSpecial, triggerEnemySpecial, startBattleSequence
    } = useBattleManager(setSceneReady);

    // ⚔️ NETWORK ORCHESTRATION (CONNEXION VPS)
    const { stats, turn, isMyTurn, findMatch, sendAction } = useBattleNetwork(
        // On Battle Start (Le serveur dit que les 2 joueurs sont là !)
        () => {
            console.log("[App] MATCH READY! OPENING ARENA...");
            startBattleSequence(); 
        },
        // On Game Update (Chaque coup du serveur)
        (update) => {
            if (!update.players) return;

            const myId = socketService.socket?.id; 
            const myPlayer = update.players[myId];
            const opId = Object.keys(update.players).find(id => id !== myId);
            const opPlayer = update.players[opId];

            // 1. SI JE ME PRENDS UN COUP (Je suis 'HIT')
            if (myPlayer && myPlayer.action === 'HIT') {
                if (opPlayer && opPlayer.action === 'SPECIAL') {
                    triggerEnemySpecial(); // L'adversaire a fait son attaque Spéciale !
                } else {
                    triggerEnemyHit(); // L'adversaire a fait une attaque normale
                }
            }

            // 2. SI L'ADVERSAIRE SE PREND UN COUP (Il est 'HIT')
            if (opPlayer && opPlayer.action === 'HIT') {
                // Si ce n'est PAS mon attaque spéciale (car l'attaque spéciale est gérée localement via le bouton)
                if (myPlayer && myPlayer.action !== 'SPECIAL') {
                    triggerPlayerHit();
                }
            }
        }
    );

    // RATTRAPAGE RÉSEAU (Si le combat a déjà commencé mais qu'on est bloqués dans l'intro)
    useEffect(() => {
        if (turn && isIntro) {
            console.log("[App] Turn detected! Forced opening arena...");
            startBattleSequence();
        }
    }, [turn, isIntro]);

    // AUTO-JOIN MATCHMAKING (Dès que l'app est chargée)
    useEffect(() => {
        if (isLoaded) {
            findMatch();
        }
    }, [isLoaded]);

    // Final readiness check (Attente des modèles 3D + Audio + Canvas)
    useEffect(() => {
        if (sceneReady && audioReady && progressPercent === 100) {
            // Petit délai pour laisser le GPU respirer après le chargement
            setTimeout(() => setIsLoaded(true), 500);
        }
    }, [sceneReady, audioReady, progressPercent]);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {!isLoaded && <LoadingScreen progress={Math.round(progressPercent)} />}

            {/* 🎲 3D RENDERING LAYER */}
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
                        enemyHitTrigger={enemyHit > 0} // Nouveau flash pour NOTRE perso
                        triggerHit={triggerPlayerHit}
                        isSpecialAttack={isSpecial}
                        isBerserkStrike={isBerserkStrike}
                        isFinisher={isFinisher}
                        zawarudoProgress={zawarudoProgress}
                        combo={combo}
                        isIntro={isIntro}
                        themeColor="#ff4400"
                    />
                </Suspense>
            </Canvas>

            {/* 🕹️ HUD & UI LAYER */}
            <BattleOverlay 
                hit={hit}
                combo={combo}
                isSpecial={isSpecial}
                isIntro={isIntro}
                cinematicAnim={cinematicAnim}
                comboScaleAnim={comboScaleAnim}
                triggerHit={triggerPlayerHit} // Correction ici 
                triggerSpecial={isIntro ? startBattleSequence : triggerSpecial}
                stats={stats}
                turn={turn}
                isMyTurn={isMyTurn}
                sendAction={sendAction}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#152a22' }
});
