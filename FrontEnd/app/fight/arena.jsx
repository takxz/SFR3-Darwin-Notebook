import React, { useState, useEffect, Suspense, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { useProgress } from '@react-three/drei/native';
import { ExpoStatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';


// CUSTOM MODULES
import Scene from '@/features/fight/components/3D/Scene';
import { LoadingScreen } from '@/features/fight/components/UI/LoadingScreen';
import { BattleOverlay } from '@/features/fight/components/UI/BattleOverlay';
import { useBattleManager } from '@/features/fight/hooks/useBattleManager';
import { useBattleNetwork } from '@/features/fight/hooks/network/useBattleNetwork';
import socketService from '@/services/SocketService';
import { useUser } from '@/hooks/useUser';
import { NavigationIndependentTree } from '@react-navigation/native';

import { MatchmakingScreen } from '@/features/fight/components/UI/MatchmakingScreen';

export default function ArenaScreen() {
    const router = useRouter();

    // ⚔️ STATE & LOGIC ORCHESTRATION
    const [sceneReady, setSceneReady] = useState(false);
    const [isDebugMode, setIsDebugMode] = useState(false);

    const { progress: progressPercent } = useProgress();

    const {
        hit, enemyHit, combo, isSpecial, isBerserkStrike, isFinisher, isIntro, setIsIntro, isLoaded, setIsLoaded,
        zawarudoProgress, audioReady,
        cinematicAnim, comboScaleAnim,
        triggerPlayerHit, triggerEnemyHit, triggerSpecial, triggerEnemySpecial, startBattleSequence
    } = useBattleManager(setSceneReady);

    const prevMyActionRef = useRef('IDLE');
    const prevOpActionRef = useRef('IDLE');

    // ⚔️ NETWORK ORCHESTRATION (CONNEXION VPS)
    const { stats, findMatch, sendReady, sendAction, abandon, matchStatus } = useBattleNetwork(
        () => {
            console.log("[Arena] MATCH READY! OPENING ARENA...");
            startBattleSequence();
        },
        (update) => {
            if (!update.players) return;

            const myId = socketService.socket?.id;
            const myPlayer = update.players[myId];
            const opId = Object.keys(update.players).find(id => id !== myId);
            const opPlayer = update.players[opId];

            if (myPlayer && opPlayer) {
                // 1. SI L'ADVERSAIRE LANCE SON SPÉCIAL
                if (opPlayer.action === 'SPECIAL' && prevOpActionRef.current !== 'SPECIAL') {
                    triggerEnemySpecial();
                }

                // 2. SI JE ME PRENDS UN COUP (Je deviens 'HIT')
                if (myPlayer.action === 'HIT' && prevMyActionRef.current !== 'HIT') {
                    triggerEnemyHit(); // Les dégâts normaux
                }

                prevMyActionRef.current = myPlayer.action;
                prevOpActionRef.current = opPlayer.action;
            }
        }
    );

    // RATTRAPAGE RÉSEAU (Si le combat a déjà commencé mais qu'on est bloqués dans l'intro)
    useEffect(() => {
        if (matchStatus === 'started' && isIntro) {
            console.log("[Arena] Forced opening arena...");
            startBattleSequence();
        }
    }, [turn, matchStatus, isIntro]);

    const { beastId, creatureId } = useLocalSearchParams();
    const finalCreatureId = beastId || creatureId || 1;

    const { user } = useUser();

    // AUTO-JOIN MATCHMAKING (Dès que l'app est chargée)
    useEffect(() => {
        if (user && matchStatus === 'idle') {
            findMatch({
                nickname: user.pseudo || `Player_${socketService.socket?.id?.substr(0, 4)}`,
                creatureId: finalCreatureId
            });
        }
    }, [user, matchStatus, finalCreatureId]);

    // ENVOI DE PLAYER READY UNE FOIS CHARGÉ
    useEffect(() => {
        let readyInterval;
        if (isLoaded && matchStatus === 'found') {
            console.log("[Arena] 3D Loaded, sending playerReady to server...");
            sendReady();
            readyInterval = setInterval(() => {
                sendReady();
            }, 800);
        }
        return () => {
            if (readyInterval) clearInterval(readyInterval);
        };
    }, [isLoaded, matchStatus]);

    // Final readiness check (Attente des modèles 3D + Audio + Canvas)
    useEffect(() => {
        if (sceneReady && audioReady && progressPercent === 100) {
            // Petit délai pour laisser le GPU respirer après le chargement
            setTimeout(() => setIsLoaded(true), 500);
        }
    }, [sceneReady, audioReady, progressPercent]);

    // SHOW MATCHMAKING OVERLAY IF WE ARE SEARCHING FOR AN OPPONENT
    const showMatchmaking = matchStatus === 'searching' || matchStatus === 'idle';
    const show3D = matchStatus === 'found' || matchStatus === 'started';

    return (
        <NavigationIndependentTree>
            <View style={styles.container}>
                {showMatchmaking && <MatchmakingScreen onCancel={() => setIsLoaded(false)} />}

                {/* 🎲 3D RENDERING LAYER */}
                {show3D && (
                    <Canvas
                        camera={{ position: [0, 0, 22], fov: 55, far: 5000 }}
                        dpr={0.5}
                        gl={{ antialias: false, alpha: false, stencil: false, depth: true, powerPreference: 'high-performance' }}
                        onCreated={() => setSceneReady(true)}
                    >
                        {/* Background will be provided by the Skybox component */}
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
                                opAction={stats.opAction}
                                myAction={stats.action}
                                stats={stats} // Pass stats to resolve models
                            />
                        </Suspense>
                    </Canvas>
                )}

                {!isLoaded && show3D && <LoadingScreen progress={Math.round(progressPercent)} />}

                {/* 🕹️ HUD & UI LAYER */}
                {show3D && isLoaded && (
                    <BattleOverlay
                        hit={hit}
                        combo={combo}
                        isSpecial={isSpecial}
                        isIntro={isIntro}
                        cinematicAnim={cinematicAnim}
                        comboScaleAnim={comboScaleAnim}
                        triggerHit={triggerPlayerHit}
                        triggerSpecial={isIntro ? startBattleSequence : triggerSpecial}
                        stats={stats}
                        sendAction={sendAction}
                        onFlee={abandon}
                        onQuit={() => {
                            socketService.disconnect();
                            router.replace('/fight');
                        }}
                    />
                )}
            </View>
        </NavigationIndependentTree>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' }
});
