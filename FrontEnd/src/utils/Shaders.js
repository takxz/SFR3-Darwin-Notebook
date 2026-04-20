
import { shaderMaterial } from '@react-three/drei/native';
import * as THREE from 'three';

export const SlashMaterial = shaderMaterial(
    { time: 0, opacity: 0 },
    `
    precision mediump float;
    varying vec2 vUv;
    void main() {
      vUv = uv; 
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    `
    precision mediump float;
    uniform float time;
    uniform float opacity;
    varying vec2 vUv;
    void main() {
      float noise = sin(vUv.x * 20.0 + time * 10.0) * 0.5 + 0.5;
      vec3 fireColor = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.0, 0.0), noise);
      gl_FragColor = vec4(fireColor, opacity * noise);
    }
    `
);
