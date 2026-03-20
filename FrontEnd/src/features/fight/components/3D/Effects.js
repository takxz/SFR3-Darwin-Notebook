
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

export function ZaWarudoOverlay({ progress }) {
    const mesh = useRef();
    const dir = useMemo(() => new THREE.Vector3(), []);
    
    useFrame((state) => {
        if (!mesh.current || progress <= 0) return;
        state.camera.getWorldDirection(dir);
        mesh.current.position.copy(state.camera.position).add(dir.multiplyScalar(0.2));
        mesh.current.quaternion.copy(state.camera.quaternion);
        
        const s = progress * 40; 
        mesh.current.scale.set(s, s, 1);
        mesh.current.material.opacity = Math.min(progress * 1.5, 1.0);
    });

    return (
        <mesh ref={mesh} frustumCulled={false} renderOrder={999}>
            <circleGeometry args={[1, 64]} />
            <meshBasicMaterial 
                color="#ffffff"
                transparent 
                depthTest={false}
                depthWrite={false}
                blending={THREE.DifferenceBlending}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}

export function VoxelSpeedLines({ active }) {
    const mesh = useRef();
    const lines = useMemo(() => {
        const p = [];
        for (let i = 0; i < 40; i++) {
            p.push({
                pos: new THREE.Vector3((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 150),
                speed: 4 + Math.random() * 8
            });
        }
        return p;
    }, []);

    const dummy = new THREE.Object3D();
    useFrame(() => {
        if (!mesh.current) return;
        lines.forEach((l, i) => {
            if (active) {
                l.pos.z += l.speed;
                if (l.pos.z > 60) l.pos.z = -100;
                dummy.position.copy(l.pos);
                dummy.scale.set(0.1, 0.1, 120);
                dummy.lookAt(0, 1.5, 0);
                dummy.updateMatrix();
                mesh.current.setMatrixAt(i, dummy.matrix);
            } else {
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                mesh.current.setMatrixAt(i, dummy.matrix);
            }
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, 40]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </instancedMesh>
    );
}
