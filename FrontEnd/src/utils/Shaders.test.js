// Mock @react-three/drei/native before importing Shaders
jest.mock('@react-three/drei/native', () => ({
  shaderMaterial: jest.fn((uniforms, vertexShader, fragmentShader) => {
    return {
      uniforms,
      vertexShader,
      fragmentShader,
      type: 'ShaderMaterial',
    };
  }),
}));

import { shaderMaterial } from '@react-three/drei/native';
import { SlashMaterial } from './Shaders';

describe('Shaders', () => {
  describe('SlashMaterial', () => {
    it('doit créer un shader material avec shaderMaterial', () => {
      expect(shaderMaterial).toHaveBeenCalled();
    });

    it('doit passer les uniforms corrects (time et opacity)', () => {
      const [uniforms] = shaderMaterial.mock.calls[0];

      expect(uniforms).toEqual({
        time: 0,
        opacity: 0,
      });
    });

    it('doit initialiser time à 0', () => {
      const [uniforms] = shaderMaterial.mock.calls[0];
      expect(uniforms.time).toBe(0);
    });

    it('doit initialiser opacity à 0', () => {
      const [uniforms] = shaderMaterial.mock.calls[0];
      expect(uniforms.opacity).toBe(0);
    });

    it('doit passer un vertex shader en deuxième argument', () => {
      const [, vertexShader] = shaderMaterial.mock.calls[0];

      expect(vertexShader).toBeDefined();
      expect(typeof vertexShader).toBe('string');
      expect(vertexShader.length).toBeGreaterThan(0);
    });

    it('doit passer un fragment shader en troisième argument', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];

      expect(fragmentShader).toBeDefined();
      expect(typeof fragmentShader).toBe('string');
      expect(fragmentShader.length).toBeGreaterThan(0);
    });

    it('doit retourner un matériau shader', () => {
      expect(SlashMaterial).toBeDefined();
      expect(SlashMaterial).toHaveProperty('type');
      expect(SlashMaterial.type).toBe('ShaderMaterial');
    });
  });

  describe('Vertex Shader', () => {
    it('doit déclarer une varying vec2 vUv', () => {
      const [, vertexShader] = shaderMaterial.mock.calls[0];
      expect(vertexShader).toContain('varying vec2 vUv');
    });

    it('doit assigner uv à vUv', () => {
      const [, vertexShader] = shaderMaterial.mock.calls[0];
      expect(vertexShader).toContain('vUv = uv');
    });

    it('doit calculer gl_Position avec la matrice de projection', () => {
      const [, vertexShader] = shaderMaterial.mock.calls[0];
      expect(vertexShader).toContain('gl_Position');
      expect(vertexShader).toContain('projectionMatrix');
    });

    it('doit utiliser modelViewMatrix', () => {
      const [, vertexShader] = shaderMaterial.mock.calls[0];
      expect(vertexShader).toContain('modelViewMatrix');
    });

    it('doit avoir une fonction main', () => {
      const [, vertexShader] = shaderMaterial.mock.calls[0];
      expect(vertexShader).toContain('void main()');
    });

    it('doit convertir la position en vec4', () => {
      const [, vertexShader] = shaderMaterial.mock.calls[0];
      expect(vertexShader).toContain('vec4(position, 1.0)');
    });
  });

  describe('Fragment Shader', () => {
    it('doit déclarer le uniform float time', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];
      expect(fragmentShader).toContain('uniform float time');
    });

    it('doit déclarer le uniform float opacity', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];
      expect(fragmentShader).toContain('uniform float opacity');
    });

    it('doit déclarer la varying vec2 vUv', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];
      expect(fragmentShader).toContain('varying vec2 vUv');
    });

    it('doit utiliser sin pour créer du bruit', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];
      expect(fragmentShader).toContain('sin(');
    });

    it('doit multiplier vUv.x par 20.0 pour créer des vagues', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];
      expect(fragmentShader).toContain('vUv.x * 20.0');
    });

    it('doit multiplier time par 10.0 pour l\'animation', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];
      expect(fragmentShader).toContain('time * 10.0');
    });

    it('doit normaliser le bruit avec * 0.5 + 0.5', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];
      expect(fragmentShader).toContain('* 0.5 + 0.5');
    });

    it('doit utiliser mix pour interpoler entre deux couleurs', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];
      expect(fragmentShader).toContain('mix(');
    });

    it('doit utiliser la couleur orange (1.0, 0.5, 0.0)', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];
      expect(fragmentShader).toContain('1.0, 0.5, 0.0');
    });

    it('doit utiliser la couleur rouge (1.0, 0.0, 0.0)', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];
      expect(fragmentShader).toContain('1.0, 0.0, 0.0');
    });

    it('doit créer un vec3 pour la couleur de feu', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];
      expect(fragmentShader).toContain('vec3(');
    });

    it('doit définir gl_FragColor avec la couleur et l\'opacité', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];
      expect(fragmentShader).toContain('gl_FragColor');
      expect(fragmentShader).toContain('vec4(');
    });

    it('doit multiplier l\'opacité par le bruit pour l\'animation', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];
      expect(fragmentShader).toContain('opacity * noise');
    });

    it('doit avoir une fonction main', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];
      expect(fragmentShader).toContain('void main()');
    });
  });

  describe('Uniforms Interface', () => {
    it('doit exposer les uniforms correctement', () => {
      const uniforms = SlashMaterial.uniforms;
      expect(uniforms).toHaveProperty('time');
      expect(uniforms).toHaveProperty('opacity');
    });

    it('les uniforms doivent être des nombres', () => {
      const [uniforms] = shaderMaterial.mock.calls[0];
      expect(typeof uniforms.time).toBe('number');
      expect(typeof uniforms.opacity).toBe('number');
    });

    it('doit initialiser tous les uniforms à 0', () => {
      const [uniforms] = shaderMaterial.mock.calls[0];
      Object.values(uniforms).forEach(value => {
        expect(value).toBe(0);
      });
    });
  });

  describe('Shader Structure', () => {
    it('le vertex shader doit avoir la structure GLSL standard', () => {
      const [, vertexShader] = shaderMaterial.mock.calls[0];
      expect(vertexShader).toContain('void main()');
      expect(vertexShader).toContain('{');
      expect(vertexShader).toContain('}');
    });

    it('le fragment shader doit avoir la structure GLSL standard', () => {
      const [, , fragmentShader] = shaderMaterial.mock.calls[0];
      expect(fragmentShader).toContain('void main()');
      expect(fragmentShader).toContain('{');
      expect(fragmentShader).toContain('}');
    });

    it('doit avoir une déclaration de varying cohérente', () => {
      const [, vertexShader, fragmentShader] = shaderMaterial.mock.calls[0];
      expect(vertexShader).toContain('varying vec2 vUv');
      expect(fragmentShader).toContain('varying vec2 vUv');
    });
  });
});
