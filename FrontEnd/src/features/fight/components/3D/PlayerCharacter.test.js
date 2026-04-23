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
