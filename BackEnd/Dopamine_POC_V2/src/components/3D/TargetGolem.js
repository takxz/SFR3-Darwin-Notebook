
import React, { forwardRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber/native';
import { useFBX } from '@react-three/drei/native';
import * as THREE from 'three';
import { FBX_ASSETS } from '../../constants/Assets';

const TargetGolem = forwardRef(({ hitTrigger, color, isSpecialAttack }, ref) => {
    const model = useFBX(FBX_ASSETS.ENEMY);

    useFrame(() => {
        if (!ref.current) return;
        
        const targetRotZ = hitTrigger ? (Math.random() - 0.5) * 1.5 : 0;
        const targetX = hitTrigger ? (Math.random() - 0.5) * 3 : 0;
        const targetY = hitTrigger ? 1.5 : 0; 
        
        ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, targetRotZ, 0.3);
        ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, targetX, 0.3);
        ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, -1.8 + targetY, 0.3);
    });

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

    return (
        <group ref={ref} position={[0, -1.8, -15]} rotation={[0, 0, 0]}>
            <primitive object={model} scale={0.015} position={[0, 0, 0]} />
        </group>
    );
});

export default TargetGolem;
