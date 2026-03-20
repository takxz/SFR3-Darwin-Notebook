
import React, { forwardRef, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import { useFBX } from '@react-three/drei/native';
import * as THREE from 'three';
import { FBX_ASSETS } from '../../constants/FightAssets';


const TargetGolem = forwardRef(({ attackTrigger, damageTrigger, color, isSpecialAttack }, ref) => {
    const model = useFBX(FBX_ASSETS.ENEMY);

    const matRefs = useRef([]);

    useFrame((state) => {
        if (!ref.current) return;
        
        let targetRotZ = 0;
        let targetX = 0;
        let targetY = 0;
        let targetZ = -15;

        // ANIMATION DE DÉGÂT (Quand on le frappe)
        if (damageTrigger) {
            targetRotZ = (Math.random() - 0.5) * 1.5;
            targetX = (Math.random() - 0.5) * 3;
            targetY = 1.5; 
        } 
        // ANIMATION D'ATTAQUE (Quand il nous frappe)
        else if (attackTrigger) {
            targetZ = -5; // Dash plongeant vers la caméra/le joueur
            targetY = 2.5; // S'élève en attaquant
        }
        
        ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, targetRotZ, attackTrigger || damageTrigger ? 0.3 : 0.1);
        ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, targetX, attackTrigger || damageTrigger ? 0.3 : 0.1);
        ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, -1.8 + targetY, attackTrigger || damageTrigger ? 0.3 : 0.1);
        ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, targetZ, attackTrigger || damageTrigger ? 0.4 : 0.08);

        // GESTION DU FLASH COLORÉ (Orange/Rouge)
        matRefs.current.forEach(mat => {
            if (damageTrigger) {
                // Flash instantané vers Orange de feu
                mat.emissive.set(isSpecialAttack ? '#ff0000' : '#ff8800');
                mat.emissiveIntensity = 8.0; // Intensité boostée
            } else {
                // Retour au noir progressif (Dégagement de chaleur)
                mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0, 0.15);
            }
        });
    });

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
                        // CLONAGE UNIQUE DU MATÉRIAU POUR NE PAS AFFECTER LE HÉROS
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

    return (
        <group ref={ref} position={[0, -1.8, -15]} rotation={[0, 0, 0]}>
            <primitive object={model} scale={0.015} position={[0, 0, 0]} />
        </group>
    );
});

export default TargetGolem;
