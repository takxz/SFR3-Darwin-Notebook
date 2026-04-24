import React from 'react';
import renderer from 'react-test-renderer';
import TargetGolem from './TargetGolem';

const mockUseFrame = jest.fn();

jest.mock('@react-three/fiber/native', () => ({
    useFrame: (...args) => mockUseFrame(...args),
}));

const createVec3 = () => ({
    set: jest.fn().mockReturnThis(),
    copy: jest.fn().mockReturnThis(),
});

const createColorMock = () => ({
    set: jest.fn(),
});

jest.mock('three', () => ({
    Vector3: jest.fn(() => createVec3()),
    MathUtils: {
        lerp: jest.fn((a, b, t) => a + (b - a) * t),
    },
    Box3: jest.fn(() => ({
        setFromObject: jest.fn().mockReturnThis(),
        getSize: jest.fn().mockReturnValue({ x: 10, y: 10, z: 10 }),
        getCenter: jest.fn().mockReturnValue(createVec3()),
    })),
    Color: jest.fn(() => createColorMock()),
}));

const mockMaterial = {
    emissive: createColorMock(),
    emissiveIntensity: 0,
    clone: jest.fn(),
    needsUpdate: false,
};
mockMaterial.clone.mockReturnValue(mockMaterial);

const mockMesh = {
    isMesh: true,
    frustumCulled: true,
    matrixAutoUpdate: false,
    isSkinnedMesh: false,
    geometry: { computeBoundingSphere: jest.fn() },
    material: mockMaterial,
};

const mockModel = {
    traverse: jest.fn((cb) => cb(mockMesh)),
    clone: jest.fn(),
};
mockModel.clone.mockReturnValue(mockModel);

jest.mock('@react-three/drei/native', () => ({
    useFBX: jest.fn(() => mockModel),
}));

jest.mock('@/features/fight/constants/FightAssets', () => ({
    FBX_ASSETS: {
        HERO: 'mock-hero.fbx',
        ENEMY: 'mock-enemy.fbx',
    },
}));

function create(element) {
    let instance;
    renderer.act(() => { instance = renderer.create(element); });
    return instance;
}

function renderTargetGolem(props = {}) {
    const ref = React.createRef();
    const defaultProps = {
        attackTrigger: false,
        damageTrigger: false,
        color: '#ff0000',
        isSpecialAttack: false,
        ...props,
    };
    create(<TargetGolem ref={ref} {...defaultProps} />);
    return ref;
}

describe('TargetGolem', () => {
    beforeEach(() => {
        mockUseFrame.mockClear();
        mockModel.traverse.mockClear();
    });

    it('se rend sans erreur avec les props par défaut', () => {
        expect(() => renderTargetGolem()).not.toThrow();
    });

    it('se rend sans erreur en mode attaque', () => {
        expect(() => renderTargetGolem({ attackTrigger: true })).not.toThrow();
    });

    it('se rend sans erreur en mode dégât', () => {
        expect(() => renderTargetGolem({ damageTrigger: true })).not.toThrow();
    });

    it('se rend sans erreur en mode spécial', () => {
        expect(() => renderTargetGolem({ isSpecialAttack: true })).not.toThrow();
    });

    it('se rend sans erreur en mode dégât + spécial (flash rouge)', () => {
        expect(() =>
            renderTargetGolem({ damageTrigger: true, isSpecialAttack: true })
        ).not.toThrow();
    });

    it('se rend sans erreur avec une couleur de thème personnalisée', () => {
        expect(() => renderTargetGolem({ color: '#00ff88' })).not.toThrow();
    });

    it('enregistre un callback useFrame', () => {
        renderTargetGolem();
        expect(mockUseFrame).toHaveBeenCalledTimes(1);
        expect(typeof mockUseFrame.mock.calls[0][0]).toBe('function');
    });

    it('traverse le modèle pour cloner les matériaux', () => {
        renderTargetGolem();
        expect(mockModel.traverse).toHaveBeenCalledTimes(1);
    });

    it('le callback useFrame ne lève pas d\'erreur quand le ref est null', () => {
        renderTargetGolem();
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
    });

    it('le callback useFrame met à jour la position quand le ref est défini', () => {
        const ref = React.createRef();
        create(
            <TargetGolem ref={ref} attackTrigger={false} damageTrigger={false} color="#ff0000" isSpecialAttack={false} />
        );
        const callback = mockUseFrame.mock.calls[0][0];

        const mockRefCurrent = {
            rotation: { z: 0 },
            position: { x: 0, y: 0, z: -15 },
        };
        Object.defineProperty(ref, 'current', { value: mockRefCurrent, writable: true });

        expect(() => callback({})).not.toThrow();
    });

    it('applique un flash orange en cas de dégât sans mode spécial', () => {
        const ref = React.createRef();
        create(
            <TargetGolem ref={ref} attackTrigger={false} damageTrigger={true} color="#ff8800" isSpecialAttack={false} />
        );
        const callback = mockUseFrame.mock.calls[0][0];

        const mockRefCurrent = {
            rotation: { z: 0 },
            position: { x: 0, y: 0, z: -15 },
        };
        Object.defineProperty(ref, 'current', { value: mockRefCurrent, writable: true });

        expect(() => callback({})).not.toThrow();
    });

    it('applique un flash rouge en cas de dégât en mode spécial', () => {
        const ref = React.createRef();
        create(
            <TargetGolem ref={ref} attackTrigger={false} damageTrigger={true} color="#ff0000" isSpecialAttack={true} />
        );
        const callback = mockUseFrame.mock.calls[0][0];

        const mockRefCurrent = {
            rotation: { z: 0 },
            position: { x: 0, y: 0, z: -15 },
        };
        Object.defineProperty(ref, 'current', { value: mockRefCurrent, writable: true });

        expect(() => callback({})).not.toThrow();
    });
});
