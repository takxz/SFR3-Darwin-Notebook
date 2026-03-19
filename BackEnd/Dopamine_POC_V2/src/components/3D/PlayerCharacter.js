
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber/native';
import { useFBX } from '@react-three/drei/native';
import * as THREE from 'three';
import { FBX_ASSETS } from '../../constants/Assets';

const PlayerCharacter = ({ hitTrigger, isSpecialAttack }) => {
    const groupRef = useRef();
    const hitStop = useRef(0);

    const model = useMemo(() => {
        return useFBX(FBX_ASSETS.HERO).clone();
    }, []);

    useEffect(() => {
        if (model) {
            model.traverse((child) => {
                child.frustumCulled = false; 
                child.matrixAutoUpdate = true;
                if (child.isMesh) {
                    child.isSkinnedMesh = false;
                    child.geometry.computeBoundingSphere();
                }
            });
        }
    }, [model]);

    const lastHitRef = useRef(false);
    const targetPos = useRef(new THREE.Vector3(0, -1.8, 10));

    useFrame(() => {
        if (!groupRef.current) return;

        // Dépendance sur le mode Spécial
        if (isSpecialAttack) {
            // DÉTECTION DU NOUVEL IMPACT (Rising Edge)
            if (hitTrigger && !lastHitRef.current) {
                // On calcule une position sur un ARC devant l'ennemi (z = -15)
                const radius = 12 + Math.random() * 4; // Distance de sécurité élevée
                const theta = (Math.random() - 0.5) * Math.PI * 0.8; // Arc frontal de 140 degrés devant lui
                const baseY = -1.8; // ON RESTE AU SOL !

                targetPos.current.set(
                    Math.sin(theta) * radius,       // X
                    baseY,                          // Y
                    -15 + Math.cos(theta) * radius  // Z (pivoté autour du vrai centre Golem à -15)
                );
            }
            lastHitRef.current = hitTrigger;

            // Suivi fluide
            groupRef.current.position.lerp(targetPos.current, 0.75);
            
            // Regard fixe et propre vers le centre du Golem (z = -15)
            groupRef.current.lookAt(0, 1.5, -15);
            
        } else {
            // MODE NORMAL (Repos ou simple coup)
            lastHitRef.current = false;
            
            const idleZ = hitTrigger ? -12 : 10;
            const idleY = hitTrigger ? 2.5 : -1.8;
            const idleX = hitTrigger ? (Math.random() - 0.5) * 2 : 0;
            
            const baseIdle = new THREE.Vector3(idleX, idleY, idleZ);
            groupRef.current.position.lerp(baseIdle, hitTrigger ? 0.4 : 0.08);

            // Rotation douce de repos
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, hitTrigger ? -0.4 : 0, 0.1);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, Math.PI, 0.1);
            groupRef.current.rotation.z = 0;
        }
    });

    return (
        <group ref={groupRef} position={[0, -1.8, 10]}>
            <primitive object={model} scale={0.015} />
        </group>
    );
};

export default PlayerCharacter;
