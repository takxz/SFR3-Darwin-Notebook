
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { useProgress } from '@react-three/drei/native';
import { DeviceMotion } from 'expo-sensors';


import PlayerCharacter from './PlayerCharacter';
import TargetGolem from './TargetGolem';

import { ImpactParticles, SlashEffect, StunStars } from './Impacts';
import { CombatEnvironment, CombatSkybox } from '../Environment/Level';
import { getModelForCreature } from '../../constants/FightAssets';

// --- RÉGLAGES CAMÉRA ORBITALE ---
const CAMERA_DISTANCE = 50;  // Recul (Rayon)
const CAMERA_ROTATION_H = 20;  // Rotation Horizontale (en degrés : 0 = face, 90 = côté)
const CAMERA_ROTATION_V = 0.2; // Angle Vertical (en radians : 0.3 = légère plongée)

const LOOK_AT_X = -4;
const LOOK_AT_Y = 1;
const LOOK_AT_Z = -10;
// --------------------------------

export default function Scene({
    hitTrigger, enemyHitTrigger, triggerHit, isSpecialAttack, isBerserkStrike, isFinisher,
    combo, isIntro, zawarudoProgress, themeColor, opAction, myAction, stats, opActionTimer, speedFactor, opSpeedFactor
}) {
    const meshRef = useRef();
    const impactAnchor = useRef(new THREE.Vector3(0, 0.5, -13));
    const shake = useRef(0);
    const { progress } = useProgress();
    const parallax = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const sub = DeviceMotion.addListener(({ rotation }) => {
            if (!rotation) return;
            // On lerp doucement pour une sensation organique
            parallax.current.x = THREE.MathUtils.lerp(parallax.current.x, rotation.beta * 0.8, 0.1);
            parallax.current.y = THREE.MathUtils.lerp(parallax.current.y, rotation.gamma * 0.8, 0.1);
        });
        DeviceMotion.setUpdateInterval(10); // Faster updates for 60fps feel
        return () => sub.remove();
    }, []);


    useFrame((state) => {
        // 1. HIT LOGIC (Vibrations de caméra)
        if (hitTrigger || enemyHitTrigger) {
            const isHeavy = myAction === 'HEAVY_ATTACK' || opAction === 'HEAVY_ATTACK';
            shake.current = isSpecialAttack ? 18.0 : (isHeavy ? 15.0 : 6.0);
        }

        // Lerp du FOV pour éviter le cumul infini
        state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, hitTrigger ? 68 : (isSpecialAttack ? 65 : 55), 0.2);

        // 2. CAMERA OSCILLATION & PARALLAX
        const clock = state.clock.elapsedTime;
        const floatX = Math.sin(clock * 0.6) * 0.4;
        const floatY = Math.cos(clock * 0.4) * 0.3;

        // CALCUL ORBITAL (Position de base propre avec Rotation Spéciale)
        // On rajoute une rotation automatique pendant le Berserk
        const berserkRotation = isSpecialAttack ? clock * 2.0 : 0;
        const radH = ((CAMERA_ROTATION_H) * Math.PI) / 180 + berserkRotation;

        const baseX = Math.sin(radH) * CAMERA_DISTANCE;
        const baseZ = Math.cos(radH) * CAMERA_DISTANCE;
        const baseY = Math.sin(CAMERA_ROTATION_V) * CAMERA_DISTANCE;

        // MIX PARALLAX (Hardware) + FLOAT (Respiration auto) + ORBIT (Réglages)
        // Accentuation : Multiplicateurs passés de 4.0 à 8.0 pour un effet plus "profond"
        const targetX = baseX + floatX + parallax.current.y * 8.0;
        const targetY = baseY + floatY - (parallax.current.x - 0.8) * 8.0;
        const targetZ = baseZ + Math.abs(parallax.current.y) * 4.0; // Zoom dynamique léger sur les côtés

        // ON LERP TOUJOURS VERS LA CIBLE (Assure la fluidité)
        state.camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), isSpecialAttack ? 0.05 : 0.1);

        // ON AJOUTE LE SHAKE COMME UN DÉCALAGE ADDITIF
        if (shake.current > 0.05) {
            state.camera.position.x += (Math.random() - 0.5) * shake.current;
            state.camera.position.y += (Math.random() - 0.5) * shake.current;
            shake.current *= 0.85;
        }

        // LOOK AT : On décale aussi le point de focus pour accentuer l'immersion
        state.camera.lookAt(
            LOOK_AT_X + parallax.current.y * 3,
            LOOK_AT_Y - (parallax.current.x - 0.8) * 3,
            LOOK_AT_Z
        );
    });

    const playerModel = getModelForCreature(stats?.modelPath, stats?.animalType, stats?.latinName);
    const enemyModel = getModelForCreature(stats?.opModelPath, stats?.opAnimalType, stats?.opLatinName);

    return (
        <>
            {/* Pushed the fog way back so it doesn't swallow the edges of the map in darkness */}
            <fog attach="fog" args={['#000000', isSpecialAttack ? 5 : 150, 1500]} />
            <ambientLight intensity={isSpecialAttack ? 0.4 : 0.8} color="#ffffff" />
            {/* Added a hemisphere light to naturally brighten the dark map */}
            <hemisphereLight skyColor="#ffffff" groundColor="#444444" intensity={1.0} />
            {/* Moved the main sun to be high up and behind the camera (positive Z) */}
            <directionalLight position={[0, 60, 60]} intensity={3.5} color="#fff5b6" />

            <CombatEnvironment isVisible={!isSpecialAttack} />
            <CombatSkybox isVisible={!isSpecialAttack} />

            <PlayerCharacter
                attackTrigger={hitTrigger}
                damageTrigger={enemyHitTrigger}
                isSpecialAttack={isBerserkStrike}
                isFinisher={isFinisher}
                modelSource={playerModel}
                myAction={myAction}
            />

            <TargetGolem
                ref={meshRef}
                damageTrigger={hitTrigger}
                attackTrigger={enemyHitTrigger}
                isSpecialAttack={isSpecialAttack}
                color={themeColor}
                modelSource={enemyModel}
                opAction={opAction}
            />

            <StunStars active={myAction === 'STUNNED'} position={[0, 4, 10]} />
            <StunStars active={opAction === 'STUNNED'} position={[0, 6, -15]} />

            <ImpactParticles
                position={impactAnchor.current}
                trigger={hitTrigger}
                color={myAction === 'HEAVY_ATTACK' ? '#ff0000' : '#ffffff'}
            />
            <SlashEffect active={hitTrigger} position={[0, 0.5, -13]} />

            {/* Effets quand le JOUEUR est frappé */}
            <ImpactParticles
                position={[0, 0.5, 8]}
                trigger={enemyHitTrigger}
                color={opAction === 'HEAVY_ATTACK' ? '#ff0000' : '#ffffff'}
            />
            <SlashEffect active={enemyHitTrigger} position={[0, 0.5, 8]} />

            {/* CERCLE DE PARADE (Attaque Lourde Ennemie) */}
            <ParryRing action={opAction} timer={opActionTimer} speedFactor={opSpeedFactor} />
        </>
    );
}

/**
 * 🎯 PARRY RING (Indicateur de timing pour l'attaque lourde)
 */
function ParryRing({ action, timer, speedFactor = 1, position = [0, 2.5, -13] }) {
    const meshRef = useRef();

    // Impact scalé par la vitesse (1000ms de base)
    const impactTime = 1000 * speedFactor;
    const isActive = action === 'HEAVY_ATTACK' && timer < impactTime;

    useFrame(() => {
        if (!meshRef.current) return;

        if (isActive) {
            // Le cercle rétrécit de 0 à impactTime
            const progress = timer / impactTime;
            const scale = 5 * (1 - progress);
            meshRef.current.scale.set(scale, scale, scale);
            meshRef.current.visible = true;
            meshRef.current.material.opacity = 0.3 + (0.5 * progress);
        } else {
            meshRef.current.visible = false;
        }
    });

    return (
        <mesh ref={meshRef} position={position} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.85, 1, 64]} />
            <meshBasicMaterial color="white" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
    );
}
