import React from 'react';
import renderer from 'react-test-renderer';
import { ZaWarudoOverlay, VoxelSpeedLines } from './Effects';

const mockUseFrame = jest.fn();

jest.mock('@react-three/fiber/native', () => ({
    useFrame: (...args) => mockUseFrame(...args),
}));

const createVec3 = (x = 0, y = 0, z = 0) => ({
    x, y, z,
    set: jest.fn().mockReturnThis(),
    copy: jest.fn().mockReturnThis(),
    add: jest.fn().mockReturnThis(),
    multiplyScalar: jest.fn().mockReturnThis(),
});

jest.mock('three', () => ({
    Vector3: jest.fn((x, y, z) => createVec3(x, y, z)),
    Object3D: jest.fn(() => ({
        position: createVec3(),
        scale: { set: jest.fn() },
        lookAt: jest.fn(),
        updateMatrix: jest.fn(),
        matrix: {},
    })),
    DifferenceBlending: 5,
    AdditiveBlending: 2,
    DoubleSide: 2,
    MathUtils: {
        lerp: jest.fn((a, b, t) => a + (b - a) * t),
    },
}));

function create(element) {
    let instance;
    renderer.act(() => { instance = renderer.create(element); });
    return instance;
}

describe('ZaWarudoOverlay', () => {
    beforeEach(() => {
        mockUseFrame.mockClear();
    });

    it('se rend sans erreur avec progress=0', () => {
        expect(() => create(<ZaWarudoOverlay progress={0} />)).not.toThrow();
    });

    it('se rend sans erreur avec progress à 0.5', () => {
        expect(() => create(<ZaWarudoOverlay progress={0.5} />)).not.toThrow();
    });

    it('se rend sans erreur avec progress=1', () => {
        expect(() => create(<ZaWarudoOverlay progress={1} />)).not.toThrow();
    });

    it('enregistre un callback useFrame', () => {
        create(<ZaWarudoOverlay progress={0.5} />);
        expect(mockUseFrame).toHaveBeenCalledTimes(1);
        expect(typeof mockUseFrame.mock.calls[0][0]).toBe('function');
    });

    it('le callback useFrame ne lève pas d\'erreur quand progress <= 0', () => {
        create(<ZaWarudoOverlay progress={0} />);
        const callback = mockUseFrame.mock.calls[0][0];
        const mockState = {
            camera: {
                position: createVec3(),
                quaternion: {},
                getWorldDirection: jest.fn(),
            },
        };
        expect(() => callback(mockState)).not.toThrow();
    });

    it('le callback useFrame ne lève pas d\'erreur quand progress > 0', () => {
        create(<ZaWarudoOverlay progress={0.5} />);
        const callback = mockUseFrame.mock.calls[0][0];
        const mockCamera = {
            position: createVec3(1, 2, 3),
            quaternion: { copy: jest.fn() },
            getWorldDirection: jest.fn(),
        };
        expect(() => callback({ camera: mockCamera })).not.toThrow();
    });
});

describe('VoxelSpeedLines', () => {
    beforeEach(() => {
        mockUseFrame.mockClear();
    });

    it('se rend sans erreur quand inactive', () => {
        expect(() => create(<VoxelSpeedLines active={false} />)).not.toThrow();
    });

    it('se rend sans erreur quand active', () => {
        expect(() => create(<VoxelSpeedLines active={true} />)).not.toThrow();
    });

    it('enregistre un callback useFrame', () => {
        create(<VoxelSpeedLines active={false} />);
        expect(mockUseFrame).toHaveBeenCalledTimes(1);
    });

    it('crée 40 particules via useMemo', () => {
        const { Vector3 } = require('three');
        Vector3.mockClear();
        create(<VoxelSpeedLines active={false} />);
        expect(Vector3).toHaveBeenCalledTimes(40);
    });

    it('le callback useFrame ne lève pas d\'erreur en mode inactif', () => {
        create(<VoxelSpeedLines active={false} />);
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
    });
});

// ─── ZaWarudoOverlay avec mesh défini ────────────────────────────────────────

describe('ZaWarudoOverlay - mesh défini via createNodeMock', () => {
    beforeEach(() => {
        mockUseFrame.mockClear();
    });

    function createWithMesh(progress) {
        const mockMesh = {
            position: { copy: jest.fn().mockReturnThis(), add: jest.fn().mockReturnThis() },
            quaternion: { copy: jest.fn() },
            scale: { set: jest.fn() },
            material: { opacity: 0 },
        };
        let instance;
        renderer.act(() => {
            instance = renderer.create(
                <ZaWarudoOverlay progress={progress} />,
                { createNodeMock: (el) => el.type === 'mesh' ? mockMesh : null }
            );
        });
        return { instance, mockMesh };
    }

    it('exécute le corps du callback quand mesh est défini et progress > 0', () => {
        const { mockMesh } = createWithMesh(0.5);
        const callback = mockUseFrame.mock.calls[0][0];
        const mockCamera = {
            position: createVec3(1, 2, 3),
            quaternion: { copy: jest.fn() },
            getWorldDirection: jest.fn(),
        };
        expect(() => callback({ camera: mockCamera })).not.toThrow();
        expect(mockMesh.quaternion.copy).toHaveBeenCalled();
        expect(mockMesh.scale.set).toHaveBeenCalled();
    });

    it('met à jour l\'opacité selon progress', () => {
        const { mockMesh } = createWithMesh(0.8);
        const callback = mockUseFrame.mock.calls[0][0];
        const mockCamera = {
            position: createVec3(),
            quaternion: { copy: jest.fn() },
            getWorldDirection: jest.fn(),
        };
        callback({ camera: mockCamera });
        expect(mockMesh.material.opacity).toBeGreaterThan(0);
    });

    it('ne modifie pas le mesh quand progress <= 0 même si mesh est défini', () => {
        const { mockMesh } = createWithMesh(0);
        const callback = mockUseFrame.mock.calls[0][0];
        const mockCamera = {
            position: createVec3(),
            quaternion: { copy: jest.fn() },
            getWorldDirection: jest.fn(),
        };
        callback({ camera: mockCamera });
        expect(mockMesh.scale.set).not.toHaveBeenCalled();
    });
});

// ─── VoxelSpeedLines avec mesh défini ────────────────────────────────────────

describe('VoxelSpeedLines - mesh défini via createNodeMock', () => {
    beforeEach(() => {
        mockUseFrame.mockClear();
    });

    function createWithMesh(active) {
        const mockMesh = {
            setMatrixAt: jest.fn(),
            instanceMatrix: { needsUpdate: false },
        };
        let instance;
        renderer.act(() => {
            instance = renderer.create(
                <VoxelSpeedLines active={active} />,
                { createNodeMock: (el) => el.type === 'instancedMesh' ? mockMesh : null }
            );
        });
        return { instance, mockMesh };
    }

    it('exécute le forEach et met à jour instanceMatrix quand active=false', () => {
        const { mockMesh } = createWithMesh(false);
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
        expect(mockMesh.setMatrixAt).toHaveBeenCalled();
        expect(mockMesh.instanceMatrix.needsUpdate).toBe(true);
    });

    it('exécute le forEach et met à jour instanceMatrix quand active=true', () => {
        const { mockMesh } = createWithMesh(true);
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
        expect(mockMesh.setMatrixAt).toHaveBeenCalled();
        expect(mockMesh.instanceMatrix.needsUpdate).toBe(true);
    });

    it('appelle setMatrixAt 40 fois (une par particule)', () => {
        const { mockMesh } = createWithMesh(false);
        const callback = mockUseFrame.mock.calls[0][0];
        callback({});
        expect(mockMesh.setMatrixAt).toHaveBeenCalledTimes(40);
    });
});
