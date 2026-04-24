import React from 'react';
import renderer from 'react-test-renderer';
import { SlashEffect, ImpactParticles } from './Impacts';

const mockUseFrame = jest.fn();

jest.mock('@react-three/fiber/native', () => ({
    useFrame: (...args) => mockUseFrame(...args),
}));

jest.mock('three', () => ({
    Vector3: jest.fn((x = 0, y = 0, z = 0) => ({
        x, y, z,
        set: jest.fn().mockReturnThis(),
        copy: jest.fn().mockReturnThis(),
        add: jest.fn().mockReturnThis(),
        multiplyScalar: jest.fn().mockReturnThis(),
    })),
    Object3D: jest.fn(() => ({
        position: { set: jest.fn(), copy: jest.fn() },
        scale: { set: jest.fn() },
        lookAt: jest.fn(),
        updateMatrix: jest.fn(),
        matrix: {},
    })),
    AdditiveBlending: 2,
    DoubleSide: 2,
    MathUtils: { lerp: jest.fn((a, b, t) => a + (b - a) * t) },
}));

jest.mock('@/utils/Shaders', () => ({
    SlashMaterial: jest.fn().mockImplementation(() => ({
        time: 0,
        opacity: 1,
        transparent: true,
    })),
}));

function create(element) {
    let instance;
    renderer.act(() => { instance = renderer.create(element); });
    return instance;
}

describe('SlashEffect', () => {
    beforeEach(() => mockUseFrame.mockClear());

    it('se rend sans erreur quand inactif', () => {
        expect(() => create(<SlashEffect active={false} position={[0, 0, 0]} />)).not.toThrow();
    });

    it('se rend sans erreur quand actif', () => {
        expect(() => create(<SlashEffect active={true} position={[0, 0.5, -13]} />)).not.toThrow();
    });

    it('se rend avec une position personnalisée', () => {
        expect(() => create(<SlashEffect active={true} position={[5, 2, -10]} />)).not.toThrow();
    });

    it('enregistre un callback useFrame', () => {
        create(<SlashEffect active={false} position={[0, 0, 0]} />);
        expect(mockUseFrame).toHaveBeenCalledTimes(1);
        expect(typeof mockUseFrame.mock.calls[0][0]).toBe('function');
    });

    it('le callback useFrame ne lève pas d\'erreur quand le mesh est null', () => {
        create(<SlashEffect active={false} position={[0, 0, 0]} />);
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({ clock: { elapsedTime: 1 } })).not.toThrow();
    });

    it('instancie SlashMaterial pour le matériau du mesh', () => {
        const { SlashMaterial } = require('@/utils/Shaders');
        SlashMaterial.mockClear();
        create(<SlashEffect active={false} position={[0, 0, 0]} />);
        expect(SlashMaterial).toHaveBeenCalledTimes(1);
    });
});

describe('ImpactParticles', () => {
    const mockPosition = { x: 0, y: 0.5, z: -13 };

    beforeEach(() => mockUseFrame.mockClear());

    it('se rend sans erreur avec trigger=false', () => {
        expect(() => create(<ImpactParticles position={mockPosition} trigger={false} />)).not.toThrow();
    });

    it('se rend sans erreur avec trigger=true', () => {
        expect(() => create(<ImpactParticles position={mockPosition} trigger={true} />)).not.toThrow();
    });

    it('enregistre un callback useFrame', () => {
        create(<ImpactParticles position={mockPosition} trigger={false} />);
        expect(mockUseFrame).toHaveBeenCalledTimes(1);
    });

    it('crée 100 particules (200 appels à Vector3) via useMemo', () => {
        const { Vector3 } = require('three');
        Vector3.mockClear();
        create(<ImpactParticles position={mockPosition} trigger={false} />);
        expect(Vector3).toHaveBeenCalledTimes(200);
    });

    it('le callback useFrame ne lève pas d\'erreur quand le mesh est null', () => {
        create(<ImpactParticles position={mockPosition} trigger={false} />);
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
    });
});

// ─── SlashEffect avec mesh défini ────────────────────────────────────────────

describe('SlashEffect - mesh défini via createNodeMock', () => {
    beforeEach(() => mockUseFrame.mockClear());

    function createWithMesh(active) {
        const mockMesh = {
            material: { time: 0, opacity: 0 },
            scale: { x: 0.5, setScalar: jest.fn() },
        };
        let instance;
        renderer.act(() => {
            instance = renderer.create(
                <SlashEffect active={active} position={[0, 0.5, -13]} />,
                { createNodeMock: (el) => el.type === 'mesh' ? mockMesh : null }
            );
        });
        return { instance, mockMesh };
    }

    it('exécute le corps du callback quand active=true et mesh défini', () => {
        const { mockMesh } = createWithMesh(true);
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({ clock: { elapsedTime: 1.5 } })).not.toThrow();
        expect(mockMesh.material.time).toBe(1.5);
        expect(mockMesh.scale.setScalar).toHaveBeenCalled();
    });

    it('exécute le corps du callback quand active=false et mesh défini', () => {
        const { mockMesh } = createWithMesh(false);
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({ clock: { elapsedTime: 2 } })).not.toThrow();
        expect(mockMesh.material.time).toBe(2);
        expect(mockMesh.scale.setScalar).toHaveBeenCalledWith(0.5);
    });

    it('appelle setScalar avec la valeur lerp en mode actif', () => {
        const { MathUtils } = require('three');
        MathUtils.lerp.mockClear();
        const { mockMesh } = createWithMesh(true);
        const callback = mockUseFrame.mock.calls[0][0];
        callback({ clock: { elapsedTime: 1 } });
        expect(MathUtils.lerp).toHaveBeenCalled();
    });
});

// ─── ImpactParticles avec mesh défini ────────────────────────────────────────

describe('ImpactParticles - mesh défini via createNodeMock', () => {
    const mockPosition = { x: 0, y: 0.5, z: -13 };

    beforeEach(() => mockUseFrame.mockClear());

    function createWithMesh(trigger) {
        const mockMesh = {
            setMatrixAt: jest.fn(),
            instanceMatrix: { needsUpdate: false },
        };
        let instance;
        renderer.act(() => {
            instance = renderer.create(
                <ImpactParticles position={mockPosition} trigger={trigger} />,
                { createNodeMock: (el) => el.type === 'instancedMesh' ? mockMesh : null }
            );
        });
        return { instance, mockMesh };
    }

    it('exécute le forEach et met à jour instanceMatrix quand trigger=false (particules mortes)', () => {
        const { mockMesh } = createWithMesh(false);
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
        expect(mockMesh.setMatrixAt).toHaveBeenCalled();
        expect(mockMesh.instanceMatrix.needsUpdate).toBe(true);
    });

    it('active les particules quand trigger=true (alive=0 → 1)', () => {
        const { mockMesh } = createWithMesh(true);
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
        expect(mockMesh.setMatrixAt).toHaveBeenCalled();
        expect(mockMesh.instanceMatrix.needsUpdate).toBe(true);
    });

    it('gère les particules déjà vivantes lors du deuxième appel (alive > 0, trigger=true)', () => {
        const { mockMesh } = createWithMesh(true);
        const callback = mockUseFrame.mock.calls[0][0];
        callback({});
        mockMesh.setMatrixAt.mockClear();
        expect(() => callback({})).not.toThrow();
        expect(mockMesh.setMatrixAt).toHaveBeenCalled();
    });

    it('appelle setMatrixAt 100 fois (une par particule)', () => {
        const { mockMesh } = createWithMesh(false);
        const callback = mockUseFrame.mock.calls[0][0];
        callback({});
        expect(mockMesh.setMatrixAt).toHaveBeenCalledTimes(100);
    });
});
