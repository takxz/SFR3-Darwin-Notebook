import React from 'react';
import renderer from 'react-test-renderer';
import { CombatEnvironment, CombatSkybox } from './Level';

const mockUseFrame = jest.fn();

jest.mock('@react-three/fiber/native', () => ({
    useFrame: (...args) => mockUseFrame(...args),
}));

const mockEnvScene = {
    traverse: jest.fn(),
    position: { set: jest.fn() },
};
const mockSkyboxScene = {
    traverse: jest.fn(),
    position: { set: jest.fn() },
};

jest.mock('@react-three/drei/native', () => ({
    useGLTF: jest.fn(),
}));

jest.mock('three', () => ({
    Box3: jest.fn(() => ({
        setFromObject: jest.fn().mockReturnThis(),
        // maxDim=0 évite l'appel à wrapperRef.current.scale.set (non dispo en test-renderer)
        getSize: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
        getCenter: jest.fn(() => ({ x: 5, y: 5, z: 5 })),
    })),
    Vector3: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
    DoubleSide: 2,
}));

function create(element) {
    let instance;
    renderer.act(() => { instance = renderer.create(element); });
    return instance;
}

// --- CombatEnvironment ---

describe('CombatEnvironment', () => {
    beforeEach(() => {
        const { useGLTF } = require('@react-three/drei/native');
        useGLTF.mockReturnValue({ scene: mockEnvScene });
        mockEnvScene.traverse.mockClear();
        mockEnvScene.position.set.mockClear();
    });

    it('se rend sans erreur avec isVisible=true (défaut)', () => {
        expect(() => create(<CombatEnvironment />)).not.toThrow();
    });

    it('se rend sans erreur avec isVisible=false', () => {
        expect(() => create(<CombatEnvironment isVisible={false} />)).not.toThrow();
    });

    it('charge la scène via useGLTF', () => {
        const { useGLTF } = require('@react-three/drei/native');
        useGLTF.mockClear();
        create(<CombatEnvironment />);
        expect(useGLTF).toHaveBeenCalledTimes(1);
    });

    it('transmet isVisible=true au groupe 3D', () => {
        const instance = create(<CombatEnvironment isVisible={true} />);
        const root = instance.toJSON();
        expect(root.props.visible).toBe(true);
    });

    it('transmet isVisible=false au groupe 3D', () => {
        const instance = create(<CombatEnvironment isVisible={false} />);
        const root = instance.toJSON();
        expect(root.props.visible).toBe(false);
    });

    it('applique la bonne position au groupe (55, -2, 40)', () => {
        const instance = create(<CombatEnvironment />);
        const root = instance.toJSON();
        expect(root.props.position).toEqual([55, -2, 40]);
    });

    it('applique le bon scale au groupe (3.63)', () => {
        const instance = create(<CombatEnvironment />);
        const root = instance.toJSON();
        expect(root.props.scale).toBe(3.63);
    });
});

// --- CombatSkybox ---

describe('CombatSkybox', () => {
    beforeEach(() => {
        const { useGLTF } = require('@react-three/drei/native');
        useGLTF.mockReturnValue({ scene: mockSkyboxScene });
        mockSkyboxScene.traverse.mockClear();
        mockSkyboxScene.position.set.mockClear();
        mockUseFrame.mockClear();
    });

    it('se rend sans erreur avec isVisible=true (défaut)', () => {
        expect(() => create(<CombatSkybox />)).not.toThrow();
    });

    it('se rend sans erreur avec isVisible=false', () => {
        expect(() => create(<CombatSkybox isVisible={false} />)).not.toThrow();
    });

    it('charge la scène via useGLTF', () => {
        const { useGLTF } = require('@react-three/drei/native');
        useGLTF.mockClear();
        create(<CombatSkybox />);
        expect(useGLTF).toHaveBeenCalledTimes(1);
    });

    it('enregistre un callback useFrame', () => {
        create(<CombatSkybox />);
        expect(mockUseFrame).toHaveBeenCalledTimes(1);
        expect(typeof mockUseFrame.mock.calls[0][0]).toBe('function');
    });

    it('le callback useFrame est bien une fonction', () => {
        create(<CombatSkybox />);
        const callback = mockUseFrame.mock.calls[0][0];
        expect(typeof callback).toBe('function');
    });

    it('transmet isVisible=true au groupe 3D', () => {
        const instance = create(<CombatSkybox isVisible={true} />);
        const root = instance.toJSON();
        expect(root.props.visible).toBe(true);
    });

    it('transmet isVisible=false au groupe 3D', () => {
        const instance = create(<CombatSkybox isVisible={false} />);
        const root = instance.toJSON();
        expect(root.props.visible).toBe(false);
    });

    it('ne plante pas quand le ref du wrapper est null (effet ignoré)', () => {
        // react-test-renderer ne définit pas les refs pour les éléments 3D custom.
        // Le guard `if (!wrapperRef.current) return` protège l'effet → aucun crash.
        expect(() => create(<CombatSkybox />)).not.toThrow();
    });

    it('ne plante pas lors du démontage', () => {
        let instance;
        renderer.act(() => { instance = renderer.create(<CombatSkybox />); });
        expect(() => renderer.act(() => { instance.unmount(); })).not.toThrow();
    });
});
