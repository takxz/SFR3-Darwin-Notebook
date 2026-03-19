
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { SlashMaterial } from '../../utils/Shaders';

export function SlashEffect({ active, position }) {
    const mesh = useRef();
    
    useFrame((state) => {
        if (!mesh.current) return;
        mesh.current.material.time = state.clock.elapsedTime;
        mesh.current.material.opacity = THREE.MathUtils.lerp(mesh.current.material.opacity, active ? 1.0 : 0.0, 0.2);
        
        if (active) {
            mesh.current.scale.setScalar(THREE.MathUtils.lerp(mesh.current.scale.x, 1.2, 0.4));
        } else {
            mesh.current.scale.setScalar(0.8);
        }
    });

    return (
        <mesh ref={mesh} position={position} rotation={[0, 0, Math.PI / 4]}>
            <torusGeometry args={[4, 0.05, 16, 100, Math.PI / 1.5]} />
            <primitive object={new SlashMaterial()} attach="material" transparent />
        </mesh>
    );
}

export function ImpactParticles({ position, trigger }) {
    const mesh = useRef();
    const particles = useMemo(() => {
        const p = [];
        for (let i = 0; i < 30; i++) {
            p.push({
                pos: new THREE.Vector3(),
                vel: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
                alive: 0
            });
        }
        return p;
    }, []);

    useFrame(() => {
        if (!mesh.current) return;
        const dummy = new THREE.Object3D();
        particles.forEach((p, i) => {
            if (trigger && p.alive <= 0) {
                p.pos.copy(position);
                p.alive = 1.0;
            }
            if (p.alive > 0) {
                p.pos.add(p.vel);
                p.alive -= 0.05;
                const s = Math.sin(p.alive * Math.PI) * 0.15;
                dummy.position.copy(p.pos);
                dummy.scale.set(s, s, s);
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
        <instancedMesh ref={mesh} args={[null, null, 30]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </instancedMesh>
    );
}
