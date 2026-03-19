
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { useProgress } from '@react-three/drei/native';
import { DeviceMotion } from 'expo-sensors';


import PlayerCharacter from './PlayerCharacter';
import TargetGolem from './TargetGolem';
import { ZaWarudoOverlay, VoxelSpeedLines } from './Effects';
import { ImpactParticles, SlashEffect } from './Impacts';
import { MossyFloor, ForestBackground } from '../Environment/Level';

// --- RÉGLAGES CAMÉRA ---
const CAMERA_Z = 40;    // Distance (22 = Défaut, 40 = Large)
const LOOK_AT_X = 0;    // Direction regard Gauche/Droite
const LOOK_AT_Y = 1;    // Direction regard Haut/Bas (1 = Milieu)
const LOOK_AT_Z = -10;  // Direction regard Profondeur (-10 = Vers le Golem)
// ------------------------

export default function Scene({ hitTrigger, triggerHit, isSpecialAttack, combo, isIntro, zawarudoProgress, themeColor }) {
    const meshRef = useRef();
    const impactAnchor = useRef(new THREE.Vector3(0, 0.5, -13));
    const flashIntensity = useRef(0);
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
        DeviceMotion.setUpdateInterval(16);
        return () => sub.remove();
    }, []);


    useFrame((state) => {
        // 1. HIT LOGIC (Correction du cumul de FOV)
        if (hitTrigger) {
            shake.current = isSpecialAttack ? 12.0 : 4.0;
            flashIntensity.current = isSpecialAttack ? 150 : 60;
            sphereVel.current.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
        }

        // Lerp du FOV pour éviter le cumul infini
        state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, hitTrigger ? 68 : (isSpecialAttack ? 65 : 55), 0.2);

        if (flashIntensity.current > 0.1) flashIntensity.current *= 0.82;
        else flashIntensity.current = 0;

        // 2. CAMERA OSCILLATION & PARALLAX
        const clock = state.clock.elapsedTime;
        const floatX = Math.sin(clock * 0.6) * 0.4;
        const floatY = Math.cos(clock * 0.4) * 0.3;

        if (shake.current > 0.1) {
            state.camera.position.x += (Math.random() - 0.5) * shake.current;
            state.camera.position.y += (Math.random() - 0.5) * shake.current;
            shake.current *= 0.85;
        } else {
            // MIX PARALLAX (Hardware) + FLOAT (Respiration auto)
            const targetX = floatX + parallax.current.y * 4.0; // SENSITIVITÉ BOOSTÉE
            const targetY = floatY - (parallax.current.x - 0.8) * 4.0; // Correction angle naturel (0.8 rad)

            state.camera.position.lerp(new THREE.Vector3(targetX, targetY, CAMERA_Z), 0.1);
            state.camera.lookAt(LOOK_AT_X, LOOK_AT_Y, LOOK_AT_Z);
        }
    });

    return (
        <>
            <fog attach="fog" args={['#000000', isSpecialAttack ? 5 : 20, 150]} />
            <ambientLight
                intensity={isSpecialAttack ? 0.2 : 0.7}
                color={flashIntensity.current > 10 ? themeColor : "#ffffff"}
            />
            <directionalLight position={[10, 20, 5]} intensity={1.5} color="#ffeebb" />

            <MossyFloor />
            <ForestBackground />

            <VoxelSpeedLines active={isSpecialAttack} />

            {flashIntensity.current > 0 && (
                <pointLight
                    position={[0, 1.5, -13]}
                    intensity={flashIntensity.current * 8}
                    color={isSpecialAttack ? "#ff00ff" : "#ffaa00"}
                    distance={150}
                />
            )}

            <PlayerCharacter hitTrigger={hitTrigger} isSpecialAttack={isSpecialAttack} />

            <TargetGolem
                ref={meshRef}
                hitTrigger={hitTrigger}
                isSpecialAttack={isSpecialAttack}
                color={themeColor}
            />

            <ImpactParticles position={impactAnchor.current} trigger={hitTrigger} />
            <SlashEffect active={hitTrigger} position={[0, 0.5, -13]} />

            <ZaWarudoOverlay progress={zawarudoProgress} />
        </>
    );
}
