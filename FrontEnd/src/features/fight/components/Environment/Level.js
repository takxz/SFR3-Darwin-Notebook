import React, { useLayoutEffect, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei/native';
import { useFrame } from '@react-three/fiber/native';
import { GLTF_ASSETS } from '../../constants/FightAssets';

export function CombatEnvironment({ isVisible = true }) {
    const { scene } = useGLTF(GLTF_ASSETS.ENVIRONMENT);
    return (
        // Map made another 10% bigger (scale 3.63)
        <group position={[55, -2, 40]} rotation={[0, -0.6, 0]} scale={3.63} visible={isVisible}>
            <primitive object={scene} />
        </group>
    );
}

export function CombatSkybox({ isVisible = true }) {
    const { scene } = useGLTF(GLTF_ASSETS.SKYBOX);
    const wrapperRef = useRef();

    useEffect(() => {
        if (!scene || !wrapperRef.current) return;

        // 1. Calculate bounding box of the raw scene
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // 2. Center the raw scene geometry so its origin is perfectly aligned
        scene.position.set(-center.x, -center.y, -center.z);

        // 3. Scale the wrapper so the skybox is exactly 2000 units across
        // This guarantees it fits perfectly inside the camera's far plane (5000)
        // while being way bigger than the arena.
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const targetScale = 2000 / maxDim;
            wrapperRef.current.scale.set(targetScale, targetScale, targetScale);
        }

        // 4. Safely fix all materials
        scene.traverse((child) => {
            if (child.isMesh) {
                child.frustumCulled = false;
                child.renderOrder = -100; // Render behind everything else

                const fixMaterial = (mat) => {
                    mat.fog = false;             // Ignore the black scene fog
                    mat.side = THREE.DoubleSide; // Render both inside and outside faces
                    mat.depthWrite = false;      // Don't obscure characters
                    mat.needsUpdate = true;
                };

                if (Array.isArray(child.material)) {
                    child.material.forEach(fixMaterial);
                } else if (child.material) {
                    fixMaterial(child.material);
                }
            }
        });
    }, [scene]);

    // 5. Keep the skybox perfectly centered on the camera
    useFrame((state) => {
        if (wrapperRef.current) {
            wrapperRef.current.position.copy(state.camera.position);
        }
    });

    return (
        <group ref={wrapperRef} visible={isVisible}>
            <primitive object={scene} />
        </group>
    );
}
