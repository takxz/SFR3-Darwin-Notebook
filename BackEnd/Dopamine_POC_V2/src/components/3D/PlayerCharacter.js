
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber/native';
import { useFBX } from '@react-three/drei/native';
import * as THREE from 'three';
import { FBX_ASSETS } from '../../constants/Assets';

const PlayerCharacter = ({ attackTrigger, damageTrigger, isSpecialAttack, isFinisher }) => {
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

        // PRIORITÉ AU FINISHER SI ACTIF
        if (isFinisher) {
            if (attackTrigger && !lastHitRef.current) {
                // POSITION DE COUP DE GRÂCE (Depuis le ciel devant l'ennemi)
                targetPos.current.set(0, 8, -5); 
            }
            lastHitRef.current = attackTrigger;
            groupRef.current.position.lerp(targetPos.current, 0.9);
            groupRef.current.lookAt(0, 0, -15);
            return;
        }

        // Dépendance sur le mode Spécial
        if (isSpecialAttack) {
            // DÉTECTION DU NOUVEL IMPACT (Rising Edge)
            if (attackTrigger && !lastHitRef.current) {
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
            lastHitRef.current = attackTrigger;

            // Suivi fluide
            groupRef.current.position.lerp(targetPos.current, 0.75);
            
            // Regard fixe et propre vers le centre du Golem (z = -15)
            groupRef.current.lookAt(0, 1.5, -15);
            
        } else {
            // MODE NORMAL (Repos, attaque simple ou recul)
            lastHitRef.current = false;
            
            // Si on attaque, on saute vers l'avant (-12Z). Si on prend un dégât, recule un peu (12Z).
            let idleZ = 10;
            let idleY = -1.8;
            let idleX = 0;
            let rotX = 0;
            
            if (attackTrigger) {
                idleZ = -12;
                idleY = 2.5;
                idleX = (Math.random() - 0.5) * 2;
                rotX = -0.4;
            } else if (damageTrigger) {
                idleZ = 12; // Recul
                idleY = -1.5; // Petit saut en arrière
                idleX = (Math.random() - 0.5) * 2;
                rotX = 0.5; // Tête en arrière
            }
            
            const baseIdle = new THREE.Vector3(idleX, idleY, idleZ);
            groupRef.current.position.lerp(baseIdle, attackTrigger || damageTrigger ? 0.4 : 0.08);

            // Rotation douce
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, rotX, 0.1);
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
