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
        getSize: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
        getCenter: jest.fn(() => ({ x: 5, y: 5, z: 5 })),
    })),
    Vector3: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
    DoubleSide: 2,
}));

function create(element, options) {
    let instance;
    renderer.act(() => { instance = renderer.create(element, options); });
    return instance;
}

// ─── CombatEnvironment ───────────────────────────────────────────────────────

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

// ─── CombatSkybox — rendu de base ────────────────────────────────────────────

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

    it('ne plante pas lors du démontage', () => {
        let instance;
        renderer.act(() => { instance = renderer.create(<CombatSkybox />); });
        expect(() => renderer.act(() => { instance.unmount(); })).not.toThrow();
    });

    it('le callback useFrame ne plante pas quand wrapperRef est null (guard actif)', () => {
        create(<CombatSkybox />);
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({ camera: { position: { x: 0, y: 0, z: 0 } } })).not.toThrow();
    });
});

// ─── CombatSkybox — useEffect avec wrapperRef défini ─────────────────────────

describe('CombatSkybox - useEffect avec wrapperRef défini', () => {
    function makeWrapper() {
        return {
            scale: { set: jest.fn() },
            position: { copy: jest.fn() },
        };
    }

    function createWithRef(props = {}, wrapper = makeWrapper()) {
        return {
            instance: create(
                <CombatSkybox {...props} />,
                { createNodeMock: (el) => el.type === 'group' ? wrapper : null }
            ),
            wrapper,
        };
    }

    beforeEach(() => {
        const { useGLTF } = require('@react-three/drei/native');
        useGLTF.mockReturnValue({ scene: mockSkyboxScene });
        mockSkyboxScene.traverse.mockClear();
        mockSkyboxScene.position.set.mockClear();
        mockUseFrame.mockClear();
    });

    it('centre la scène brute via scene.position.set', () => {
        createWithRef();
        expect(mockSkyboxScene.position.set).toHaveBeenCalledWith(-5, -5, -5);
    });

    it('traverse la scène pour fixer les matériaux', () => {
        createWithRef();
        expect(mockSkyboxScene.traverse).toHaveBeenCalledTimes(1);
    });

    it('n\'appelle pas scale.set quand maxDim=0 (évite la division par zéro)', () => {
        const { wrapper } = createWithRef();
        expect(wrapper.scale.set).not.toHaveBeenCalled();
    });

    it('appelle scale.set avec la bonne valeur quand maxDim > 0', () => {
        const { Box3 } = require('three');
        Box3.mockReturnValueOnce({
            setFromObject: jest.fn().mockReturnThis(),
            getSize: jest.fn(() => ({ x: 100, y: 200, z: 150 })),
            getCenter: jest.fn(() => ({ x: 5, y: 5, z: 5 })),
        });
        const { wrapper } = createWithRef();
        // targetScale = 2000 / max(100,200,150) = 2000/200 = 10
        expect(wrapper.scale.set).toHaveBeenCalledWith(10, 10, 10);
    });

    it('configure un enfant mesh avec un matériau unique', () => {
        const mat = { fog: true, side: 0, depthWrite: true, needsUpdate: false };
        const meshChild = { isMesh: true, frustumCulled: true, renderOrder: 0, material: mat };
        mockSkyboxScene.traverse.mockImplementationOnce((cb) => cb(meshChild));

        createWithRef();

        expect(meshChild.frustumCulled).toBe(false);
        expect(meshChild.renderOrder).toBe(-100);
        expect(mat.fog).toBe(false);
        expect(mat.side).toBe(2); // THREE.DoubleSide
        expect(mat.depthWrite).toBe(false);
        expect(mat.needsUpdate).toBe(true);
    });

    it('configure un enfant mesh avec un tableau de matériaux', () => {
        const mat1 = { fog: true, side: 0, depthWrite: true, needsUpdate: false };
        const mat2 = { fog: true, side: 0, depthWrite: true, needsUpdate: false };
        const meshChild = { isMesh: true, frustumCulled: true, renderOrder: 0, material: [mat1, mat2] };
        mockSkyboxScene.traverse.mockImplementationOnce((cb) => cb(meshChild));

        createWithRef();

        expect(mat1.fog).toBe(false);
        expect(mat1.depthWrite).toBe(false);
        expect(mat2.fog).toBe(false);
        expect(mat2.depthWrite).toBe(false);
    });

    it('ignore un enfant non-mesh (ne modifie pas son matériau)', () => {
        const nonMeshChild = { isMesh: false, material: { fog: true } };
        mockSkyboxScene.traverse.mockImplementationOnce((cb) => cb(nonMeshChild));

        createWithRef();

        expect(nonMeshChild.material.fog).toBe(true);
    });

    it('ne plante pas pour un enfant mesh sans matériau', () => {
        const meshNoMat = { isMesh: true, frustumCulled: true, renderOrder: 0, material: null };
        mockSkyboxScene.traverse.mockImplementationOnce((cb) => cb(meshNoMat));

        expect(() => createWithRef()).not.toThrow();
    });
});

// ─── CombatSkybox — useFrame avec wrapperRef défini ──────────────────────────

describe('CombatSkybox - useFrame avec wrapperRef défini', () => {
    beforeEach(() => {
        const { useGLTF } = require('@react-three/drei/native');
        useGLTF.mockReturnValue({ scene: mockSkyboxScene });
        mockSkyboxScene.traverse.mockClear();
        mockUseFrame.mockClear();
    });

    it('copie la position caméra sur le wrapper', () => {
        const mockWrapper = { scale: { set: jest.fn() }, position: { copy: jest.fn() } };
        create(
            <CombatSkybox />,
            { createNodeMock: (el) => el.type === 'group' ? mockWrapper : null }
        );

        const callback = mockUseFrame.mock.calls[0][0];
        const cameraPos = { x: 10, y: 5, z: -20 };
        callback({ camera: { position: cameraPos } });

        expect(mockWrapper.position.copy).toHaveBeenCalledWith(cameraPos);
    });

    it('appelle position.copy à chaque frame', () => {
        const mockWrapper = { scale: { set: jest.fn() }, position: { copy: jest.fn() } };
        create(
            <CombatSkybox />,
            { createNodeMock: (el) => el.type === 'group' ? mockWrapper : null }
        );

        const callback = mockUseFrame.mock.calls[0][0];
        callback({ camera: { position: { x: 0, y: 0, z: 0 } } });
        callback({ camera: { position: { x: 1, y: 1, z: 1 } } });

        expect(mockWrapper.position.copy).toHaveBeenCalledTimes(2);
    });
});
