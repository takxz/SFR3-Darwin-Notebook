import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { SlashMaterial } from '@/utils/Shaders';



export function SlashEffect({ active, position }) {
    const mesh = useRef();
    
    useFrame((state) => {
        if (!mesh.current) return;
        mesh.current.material.time = state.clock.elapsedTime;
        mesh.current.material.opacity = THREE.MathUtils.lerp(mesh.current.material.opacity, active ? 1.0 : 0.0, 0.2);
        
        if (active) {
            mesh.current.scale.setScalar(THREE.MathUtils.lerp(mesh.current.scale.x, 2.5, 0.6)); // PLUS GRAND !
        } else {
            mesh.current.scale.setScalar(0.5);
        }
    });

    return (
        <mesh ref={mesh} position={position} rotation={[0, 0, Math.PI / 4]}>
            <torusGeometry args={[8, 0.15, 16, 100, Math.PI / 1.2]} />
            <primitive object={new SlashMaterial()} attach="material" transparent />
        </mesh>
    );
}

export function ImpactParticles({ position, trigger }) {
    const mesh = useRef();
    const PARTICLE_COUNT = 100; // ON TRIPLE LE NOMBRE !

    const particles = useMemo(() => {
        const p = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            p.push({
                pos: new THREE.Vector3(),
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 25, // EXPLOSION PLUS LARGE
                    (Math.random() - 0.5) * 25, 
                    (Math.random() - 0.5) * 25
                ),
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
                p.pos.set(
                    position.x + (Math.random() - 0.5) * 4, 
                    position.y + (Math.random() - 0.5) * 4, 
                    position.z + (Math.random() - 0.5) * 4
                );
                p.alive = 1.0;
                // Re-randomiser la vélocité pour chaque explosion
                p.vel.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30);
            }
            if (p.alive > 0) {
                p.pos.add(p.vel);
                p.vel.multiplyScalar(0.85); // Décélération forte pour l'impact
                p.alive -= 0.08; // Vie courte (environ 12 frames = 200ms)
                const s = Math.sin(p.alive * Math.PI) * 0.6; // Plus gros éclats
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
        <instancedMesh ref={mesh} args={[null, null, PARTICLE_COUNT]}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial 
                color="#ffffff" 
                transparent 
                opacity={1.0} 
                blending={THREE.AdditiveBlending} // EFFET BRILLANT / ÉTINCELLE
                depthWrite={false}
            />
        </instancedMesh>
    );
}

export function StunStars({ active, position }) {
    const group = useRef();
    
    useFrame((state) => {
        if (!group.current) return;
        const time = state.clock.elapsedTime;
        
        // Rotation rapide du cercle
        group.current.rotation.y = time * 5.0;
        
        // Bobbing vertical sinusoïdal (optionnel)
        // Correction : position est un tableau [x, y, z]
        group.current.position.y = position[1] + Math.sin(time * 3) * 0.2;
        
        // Apparition / Disparition fluide
        const targetScale = active ? 1.0 : 0.0;
        group.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    });

    return (
        <group ref={group} position={position}>
            {/* 4 petites étoiles jaunes qui tournent */}
            {[0, 1, 2, 3].map((i) => (
                <mesh key={i} position={[Math.cos((i * Math.PI * 2) / 4) * 4, 0, Math.sin((i * Math.PI * 2) / 4) * 4]}>
                    <octahedronGeometry args={[0.4, 0]} />
                    <meshBasicMaterial color="#ffee00" />
                </mesh>
            ))}
        </group>
    );
}
