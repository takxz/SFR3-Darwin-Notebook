
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

    useFrame(() => {
        if (!groupRef.current) return;

        if (isNaN(groupRef.current.position.z)) {
            groupRef.current.position.set(0, -1.8, 10);
            return;
        }

        if (isSpecialAttack) {
            groupRef.current.visible = true;
            const targetZ = hitTrigger ? -25 : 10;
            const targetX = hitTrigger ? (Math.random() - 0.5) * 6 : 0;
            
            groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.85);
            groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.85);
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, (Math.random() * 4), 0.85);

            groupRef.current.rotation.y = groupRef.current.position.z < -15 ? 0 : Math.PI;
            groupRef.current.rotation.x = -0.4;
            model.traverse(c => c.visible = true);
        } else {
            groupRef.current.visible = true;
            model.traverse(c => c.visible = true);
            groupRef.current.rotation.y = Math.PI; 
            groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.1);

            const targetZ = hitTrigger ? -12 : 10;
            groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, hitTrigger ? 0.35 : 0.08);

            const targetY = hitTrigger ? 2.5 : -1.8;
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, hitTrigger ? 0.45 : 0.05);

            const targetRotX = hitTrigger ? -0.25 : 0;
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, hitTrigger ? 0.4 : 0.1);
        }
    });

    return (
        <group ref={groupRef} position={[0, -1.8, 10]}>
            <primitive object={model} scale={0.015} />
        </group>
    );
};

export default PlayerCharacter;
