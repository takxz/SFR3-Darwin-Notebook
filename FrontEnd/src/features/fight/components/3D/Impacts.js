import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { SlashMaterial } from '@/utils/Shaders';



export function SlashEffect({ active, position }) {
    const mesh = useRef();
    
    // Memoize material to prevent shader recompilation on every render for Mali GPUs
    const material = useMemo(() => {
        const mat = new SlashMaterial();
        mat.transparent = true;
        mat.depthWrite = false;
        return mat;
    }, []);
    
    useFrame((state, delta) => {
        if (!mesh.current) return;
        mesh.current.material.time = state.clock.elapsedTime;
        mesh.current.material.opacity = THREE.MathUtils.lerp(mesh.current.material.opacity, active ? 1.0 : 0.0, 0.2 * delta * 60);
        
        if (active) {
            mesh.current.scale.setScalar(THREE.MathUtils.lerp(mesh.current.scale.x, 2.5, 0.6 * delta * 60)); // PLUS GRAND !
        } else {
            mesh.current.scale.setScalar(0.5);
        }
    });

    return (
        <mesh ref={mesh} position={position} rotation={[0, 0, Math.PI / 4]} frustumCulled={false}>
            <torusGeometry args={[8, 0.15, 16, 100, Math.PI / 1.2]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
}

export function ImpactParticles({ position, trigger }) {
    const mesh = useRef();
    const PARTICLE_COUNT = 100; // ON TRIPLE LE NOMBRE !
    
    // Move dummy outside of useFrame to prevent rapid memory leaks causing stuttering
    const dummy = useMemo(() => new THREE.Object3D(), []);

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

    useFrame((state, delta) => {
        if (!mesh.current) return;
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
                // Ajuster la position et l'amortissement en fonction du framerate
                p.pos.add(p.vel.clone().multiplyScalar(delta * 60));
                p.vel.multiplyScalar(1 - ((1 - 0.85) * delta * 60)); // Décélération indépendante
                p.alive -= 0.08 * delta * 60; // Vie corrigée pour être identique sur 120Hz
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
        <instancedMesh ref={mesh} args={[null, null, PARTICLE_COUNT]} frustumCulled={false}>
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
