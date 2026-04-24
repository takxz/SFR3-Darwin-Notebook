
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber/native';
import { useFBX } from '@react-three/drei/native';
import * as THREE from 'three';
import { FBX_ASSETS } from '../../constants/FightAssets';


const PlayerCharacter = ({ attackTrigger, damageTrigger, isSpecialAttack, isFinisher, modelSource, myAction }) => {
    const groupRef = useRef();
    const hitStop = useRef(0);

    const model = useMemo(() => {
        return useFBX(modelSource || require('@/assets/fight/models/Pig.fbx')).clone();
    }, [modelSource]);

    const matRefs = useRef([]);
    const lastHitRef = useRef(false);
    const targetPos = useRef(new THREE.Vector3(0, -1.8, 10));

    useEffect(() => {
        if (model) {
            const mats = [];
            model.traverse((child) => {
                child.frustumCulled = false;
                child.matrixAutoUpdate = true;
                if (child.isMesh) {
                    child.isSkinnedMesh = false;
                    child.geometry.computeBoundingSphere();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(m => m.clone());
                            child.material.forEach(m => mats.push(m));
                        } else {
                            child.material = child.material.clone();
                            mats.push(child.material);
                        }
                    }
                }
            });
            matRefs.current = mats;
        }
    }, [model]);

    useFrame(() => {
        if (!groupRef.current) return;

        // GESTION DU FLASH COLORÉ (Dégâts)
        matRefs.current.forEach(mat => {
            if (damageTrigger) {
                mat.emissive.set('#ff4400');
                mat.emissiveIntensity = 5.0;
            } else {
                mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0, 0.15);
            }
        });

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
            let rotZ = 0;

            // 1. IMPACT (Dash en avant)
            if (attackTrigger) {
                const isHeavy = myAction === 'HEAVY_ATTACK';
                idleZ = isHeavy ? -14 : -12;
                idleY = isHeavy ? 3.5 : 2.0;
                idleX = (Math.random() - 0.5) * 2;
                rotX = isHeavy ? -0.6 : -0.3;
            }
            // 2. PRÉPARATION ATTAQUE LOURDE (Buildup - l'adversaire nous voit nous lever)
            else if (myAction === 'HEAVY_ATTACK') {
                idleZ = 12; // Recule un peu
                idleY = 0.5; // Se lève légèrement
                rotX = -0.2; // Se penche un peu
            }
            // 3. ATTAQUE LÉGÈRE (Pas de préparation, juste attente de l'impact ou repos)
            else if (myAction === 'LIGHT_ATTACK') {
                idleZ = 10.5; // Légère tension vers l'avant
                idleY = -1.8;
                rotX = -0.1;
            }
            // 4. PARADE (Rotation de 15 degrés)
            else if (myAction === 'PARRYING') {
                rotX = 0.1;
                rotZ = 0.26; // ~15 degrés
            }
            // 5. RÉCEPTION DE DÉGÂTS
            else if (damageTrigger) {
                idleZ = 12; // Recul
                idleY = -1.5; // Petit saut en arrière
                idleX = (Math.random() - 0.5) * 2;
                rotX = 0.5; // Tête en arrière
            }

            const baseIdle = new THREE.Vector3(idleX, idleY, idleZ);

            // Si le perso revient de l'attaque spéciale (très loin), on le fait revenir plus vite (0.15)
            const dist = groupRef.current.position.distanceTo(baseIdle);
            const isActive = attackTrigger || damageTrigger || myAction === 'LIGHT_ATTACK' || myAction === 'HEAVY_ATTACK' || myAction === 'PARRYING';
            const lerpSpeed = isActive ? 0.4 : (dist > 5 ? 0.15 : 0.08);

            groupRef.current.position.lerp(baseIdle, lerpSpeed);

            // Rotation douce via Quaternion Slerp pour éviter les vrilles/spins étranges après un "lookAt"
            const targetEuler = new THREE.Euler(rotX, Math.PI, rotZ);
            const targetQuat = new THREE.Quaternion().setFromEuler(targetEuler);
            groupRef.current.quaternion.slerp(targetQuat, 0.15);
        }
    });

    return (
        <group ref={groupRef} position={[0, -1.8, 10]}>
            <primitive object={model} scale={0.015} />
        </group>
    );
};

export default PlayerCharacter;
