import React from 'react';
import renderer from 'react-test-renderer';
import PlayerCharacter from './PlayerCharacter';

const mockUseFrame = jest.fn();

jest.mock('@react-three/fiber/native', () => ({
    useFrame: (...args) => mockUseFrame(...args),
}));

const mockModel = {
    traverse: jest.fn(),
    clone: jest.fn(),
};
mockModel.clone.mockReturnValue(mockModel);

jest.mock('@react-three/drei/native', () => ({
    useFBX: jest.fn(() => mockModel),
}));

jest.mock('three', () => ({
    Vector3: jest.fn((x = 0, y = 0, z = 0) => ({
        x, y, z,
        set: jest.fn().mockReturnThis(),
        lerp: jest.fn().mockReturnThis(),
        distanceTo: jest.fn(() => 0),
    })),
    Euler: jest.fn(() => ({})),
    Quaternion: jest.fn(() => ({
        setFromEuler: jest.fn().mockReturnThis(),
        slerp: jest.fn(),
    })),
    MathUtils: { lerp: jest.fn((a, b, t) => a + (b - a) * t) },
}));

function renderPC(props = {}) {
    const defaultProps = {
        attackTrigger: false,
        damageTrigger: false,
        isSpecialAttack: false,
        isFinisher: false,
        ...props,
    };
    let instance;
    renderer.act(() => { instance = renderer.create(<PlayerCharacter {...defaultProps} />); });
    return instance;
}

describe('PlayerCharacter', () => {
    beforeEach(() => {
        mockUseFrame.mockClear();
        mockModel.traverse.mockClear();
        mockModel.clone.mockClear();
    });

    it('se rend sans erreur avec les props par défaut', () => {
        expect(() => renderPC()).not.toThrow();
    });

    it('se rend sans erreur en mode attaque', () => {
        expect(() => renderPC({ attackTrigger: true })).not.toThrow();
    });

    it('se rend sans erreur en mode dégât', () => {
        expect(() => renderPC({ damageTrigger: true })).not.toThrow();
    });

    it('se rend sans erreur en mode spécial', () => {
        expect(() => renderPC({ isSpecialAttack: true })).not.toThrow();
    });

    it('se rend sans erreur en mode finisher', () => {
        expect(() => renderPC({ isFinisher: true })).not.toThrow();
    });

    it('clone le modèle héros via useFBX', () => {
        renderPC();
        expect(mockModel.clone).toHaveBeenCalledTimes(1);
    });

    it('traverse le modèle pour configurer la géométrie', () => {
        renderPC();
        expect(mockModel.traverse).toHaveBeenCalledTimes(1);
    });

    it('enregistre un callback useFrame', () => {
        renderPC();
        expect(mockUseFrame).toHaveBeenCalledTimes(1);
        expect(typeof mockUseFrame.mock.calls[0][0]).toBe('function');
    });

    it('le callback useFrame ne lève pas d\'erreur en mode normal', () => {
        renderPC();
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
    });

    it('le callback useFrame ne lève pas d\'erreur en mode finisher', () => {
        renderPC({ isFinisher: true });
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
    });

    it('le callback useFrame ne lève pas d\'erreur en mode spécial', () => {
        renderPC({ isSpecialAttack: true });
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
    });
});

// ─── useEffect traverse callback ─────────────────────────────────────────────

describe('PlayerCharacter useEffect traverse', () => {
    beforeEach(() => {
        mockUseFrame.mockClear();
        mockModel.traverse.mockClear();
        mockModel.clone.mockClear();
    });

    it('configure frustumCulled et matrixAutoUpdate sur un enfant non-mesh', () => {
        const child = { frustumCulled: true, matrixAutoUpdate: false, isMesh: false };
        mockModel.traverse.mockImplementationOnce((cb) => cb(child));
        renderPC();
        expect(child.frustumCulled).toBe(false);
        expect(child.matrixAutoUpdate).toBe(true);
    });

    it('configure isSkinnedMesh et calcule la boundingSphere pour un mesh', () => {
        const childMesh = {
            frustumCulled: true,
            matrixAutoUpdate: false,
            isMesh: true,
            isSkinnedMesh: true,
            geometry: { computeBoundingSphere: jest.fn() },
        };
        mockModel.traverse.mockImplementationOnce((cb) => cb(childMesh));
        renderPC();
        expect(childMesh.isSkinnedMesh).toBe(false);
        expect(childMesh.geometry.computeBoundingSphere).toHaveBeenCalledTimes(1);
    });
});

// ─── useFrame callback avec groupRef défini ───────────────────────────────────

describe('PlayerCharacter useFrame - groupRef défini', () => {
    beforeEach(() => {
        mockUseFrame.mockClear();
        mockModel.traverse.mockClear();
        mockModel.clone.mockClear();
    });

    function renderWithGroupRef(props = {}) {
        const mockGroup = {
            position: { lerp: jest.fn(), distanceTo: jest.fn(() => 3), x: 0, y: -1.8, z: 10 },
            lookAt: jest.fn(),
            quaternion: { slerp: jest.fn() },
        };
        const defaultProps = {
            attackTrigger: false,
            damageTrigger: false,
            isSpecialAttack: false,
            isFinisher: false,
            ...props,
        };
        let instance;
        renderer.act(() => {
            instance = renderer.create(
                <PlayerCharacter {...defaultProps} />,
                { createNodeMock: (el) => el.type === 'group' ? mockGroup : null }
            );
        });
        return { instance, mockGroup };
    }

    it('mode normal idle : lerp vers position repos et slerp quaternion', () => {
        const { mockGroup } = renderWithGroupRef();
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
        expect(mockGroup.position.lerp).toHaveBeenCalled();
        expect(mockGroup.quaternion.slerp).toHaveBeenCalled();
    });

    it('mode normal attackTrigger=true : lerp vers position attaque', () => {
        const { mockGroup } = renderWithGroupRef({ attackTrigger: true });
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
        expect(mockGroup.position.lerp).toHaveBeenCalled();
    });

    it('mode normal damageTrigger=true : lerp vers position recul', () => {
        const { mockGroup } = renderWithGroupRef({ damageTrigger: true });
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
        expect(mockGroup.position.lerp).toHaveBeenCalled();
    });

    it('mode normal dist > 5 : utilise vitesse de lerp 0.15', () => {
        const { mockGroup } = renderWithGroupRef();
        mockGroup.position.distanceTo.mockReturnValue(10);
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
        expect(mockGroup.position.lerp).toHaveBeenCalled();
    });

    it('mode spécial sans attackTrigger : lerp et lookAt vers golem', () => {
        const { mockGroup } = renderWithGroupRef({ isSpecialAttack: true });
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
        expect(mockGroup.position.lerp).toHaveBeenCalled();
        expect(mockGroup.lookAt).toHaveBeenCalledWith(0, 1.5, -15);
    });

    it('mode spécial avec attackTrigger=true : choisit nouvelle position sur arc', () => {
        const { mockGroup } = renderWithGroupRef({ isSpecialAttack: true, attackTrigger: true });
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
        expect(mockGroup.lookAt).toHaveBeenCalledWith(0, 1.5, -15);
        // Second call: lastHitRef.current = true → skip inner if
        expect(() => callback({})).not.toThrow();
    });

    it('mode finisher sans attackTrigger : lerp et lookAt vers golem', () => {
        const { mockGroup } = renderWithGroupRef({ isFinisher: true });
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
        expect(mockGroup.position.lerp).toHaveBeenCalled();
        expect(mockGroup.lookAt).toHaveBeenCalledWith(0, 0, -15);
    });

    it('mode finisher avec attackTrigger=true : set position coup de grâce', () => {
        const { mockGroup } = renderWithGroupRef({ isFinisher: true, attackTrigger: true });
        const callback = mockUseFrame.mock.calls[0][0];
        expect(() => callback({})).not.toThrow();
        expect(mockGroup.position.lerp).toHaveBeenCalled();
        expect(mockGroup.lookAt).toHaveBeenCalledWith(0, 0, -15);
        // Second call: lastHitRef.current = true → skip inner if (cover right-false of &&)
        mockGroup.position.lerp.mockClear();
        expect(() => callback({})).not.toThrow();
        expect(mockGroup.position.lerp).toHaveBeenCalled();
    });
});
