
import React from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei/native';
import { TEXTURE_ASSETS } from '../../constants/FightAssets';


export function MossyFloor() {
    const texture = useTexture(TEXTURE_ASSETS.GROUND);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.82, 0]}>
            <planeGeometry args={[200, 200]} />
            <meshStandardMaterial
                map={texture}
                roughness={1}
            />
        </mesh>
    );
}

export function ForestBackground() {
    const texture = useTexture(TEXTURE_ASSETS.BACKGROUND);
    return (
        <group>
            <mesh position={[0, 15, -45]}>
                <planeGeometry args={[180, 100]} />
                <meshBasicMaterial
                    map={texture}
                    transparent
                    opacity={0.9}
                />
            </mesh>
            <mesh position={[0, 10, -85]}>
                <planeGeometry args={[400, 200]} />
                <meshStandardMaterial color="#051a0d" />
            </mesh>
        </group>
    );
}
