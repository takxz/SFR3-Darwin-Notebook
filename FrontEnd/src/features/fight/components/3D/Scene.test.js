import React from 'react';
import renderer from 'react-test-renderer';
import { DeviceMotion } from 'expo-sensors';
import Scene from './Scene';

jest.mock('@react-three/fiber/native', () => ({
    useFrame: jest.fn(),
}));

jest.mock('@react-three/drei/native', () => ({
    useProgress: jest.fn(() => ({ progress: 100 })),
    useGLTF: jest.fn(() => ({ scene: { traverse: jest.fn(), position: { set: jest.fn() } } })),
    useFBX: jest.fn(() => ({ traverse: jest.fn(), clone: jest.fn().mockReturnThis() })),
}));

jest.mock('expo-sensors', () => ({
    DeviceMotion: {
        addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
        setUpdateInterval: jest.fn(),
    },
}));

jest.mock('./PlayerCharacter', () => ({
    __esModule: true,
    default: jest.fn(() => null),
}));

jest.mock('./TargetGolem', () => {
    const { forwardRef } = require('react');
    return { __esModule: true, default: forwardRef(() => null) };
});

jest.mock('./Impacts', () => ({
    ImpactParticles: jest.fn(() => null),
    SlashEffect: jest.fn(() => null),
}));

jest.mock('../Environment/Level', () => ({
    CombatEnvironment: jest.fn(() => null),
    CombatSkybox: jest.fn(() => null),
}));

jest.mock('three', () => ({
    Vector3: jest.fn((x = 0, y = 0, z = 0) => ({
        x, y, z,
        set: jest.fn().mockReturnThis(),
        lerp: jest.fn().mockReturnThis(),
        copy: jest.fn().mockReturnThis(),
    })),
    MathUtils: { lerp: jest.fn((a, b, t) => a + (b - a) * t) },
}));

const defaultProps = {
    hitTrigger: false,
    enemyHitTrigger: false,
    triggerHit: false,
    isSpecialAttack: false,
    isBerserkStrike: false,
    isFinisher: false,
    combo: 0,
    isIntro: false,
    zawarudoProgress: 0,
    themeColor: '#ffffff',
};

function renderScene(props = {}) {
    let instance;
    renderer.act(() => {
        instance = renderer.create(<Scene {...defaultProps} {...props} />);
    });
    return instance;
}

function makeCamera() {
    return {
        fov: 55,
        position: { lerp: jest.fn(), x: 0, y: 0 },
        lookAt: jest.fn(),
    };
}

function makeState(camera) {
    return { camera, clock: { elapsedTime: 1 } };
}

describe('Scene', () => {
    beforeEach(() => {
        DeviceMotion.addListener.mockClear();
        DeviceMotion.setUpdateInterval.mockClear();
    });

    it('se monte sans erreur avec les props par défaut', () => {
        expect(() => renderScene()).not.toThrow();
    });

    it('se monte sans erreur en mode special', () => {
        expect(() => renderScene({ isSpecialAttack: true })).not.toThrow();
    });

    it('se monte sans erreur avec hitTrigger actif', () => {
        expect(() => renderScene({ hitTrigger: true })).not.toThrow();
    });

    it('se monte sans erreur avec enemyHitTrigger actif', () => {
        expect(() => renderScene({ enemyHitTrigger: true })).not.toThrow();
    });

    it('se monte sans erreur en mode finisher', () => {
        expect(() => renderScene({ isFinisher: true })).not.toThrow();
    });

    it('se monte sans erreur avec une couleur de thème personnalisée', () => {
        expect(() => renderScene({ themeColor: '#ff4400' })).not.toThrow();
    });

    it('souscrit aux événements DeviceMotion au montage', () => {
        renderScene();
        expect(DeviceMotion.addListener).toHaveBeenCalledTimes(1);
    });

    it('définit l\'intervalle DeviceMotion à 10ms', () => {
        renderScene();
        expect(DeviceMotion.setUpdateInterval).toHaveBeenCalledWith(10);
    });

    it('retire la souscription DeviceMotion au démontage', () => {
        const removeMock = jest.fn();
        DeviceMotion.addListener.mockReturnValueOnce({ remove: removeMock });
        let instance;
        renderer.act(() => {
            instance = renderer.create(<Scene {...defaultProps} />);
        });
        renderer.act(() => { instance.unmount(); });
        expect(removeMock).toHaveBeenCalledTimes(1);
    });

    it('rend CombatEnvironment invisible en mode spécial', () => {
        const { CombatEnvironment } = require('../Environment/Level');
        CombatEnvironment.mockClear();
        renderScene({ isSpecialAttack: true });
        expect(CombatEnvironment).toHaveBeenCalledTimes(1);
        expect(CombatEnvironment.mock.calls[0][0]).toMatchObject({ isVisible: false });
    });

    it('rend CombatEnvironment visible hors mode spécial', () => {
        const { CombatEnvironment } = require('../Environment/Level');
        CombatEnvironment.mockClear();
        renderScene({ isSpecialAttack: false });
        expect(CombatEnvironment).toHaveBeenCalledTimes(1);
        expect(CombatEnvironment.mock.calls[0][0]).toMatchObject({ isVisible: true });
    });
});

// ─── useFrame callback ────────────────────────────────────────────────────────

describe('Scene useFrame callback', () => {
    let useFrame;

    beforeEach(() => {
        useFrame = require('@react-three/fiber/native').useFrame;
        useFrame.mockClear();
        DeviceMotion.addListener.mockClear();
    });

    it('met à jour la caméra sans hitTrigger ni isSpecialAttack', () => {
        renderScene({ hitTrigger: false, isSpecialAttack: false });
        const callback = useFrame.mock.calls[0][0];
        const camera = makeCamera();
        expect(() => callback(makeState(camera))).not.toThrow();
        expect(camera.position.lerp).toHaveBeenCalledTimes(1);
        expect(camera.lookAt).toHaveBeenCalledTimes(1);
    });

    it('active le shake quand hitTrigger=true (couvre la branche shake > 0.05)', () => {
        renderScene({ hitTrigger: true, isSpecialAttack: false });
        const callback = useFrame.mock.calls[0][0];
        const camera = makeCamera();
        expect(() => callback(makeState(camera))).not.toThrow();
        // shake.current devient 4.0 > 0.05 donc camera.position.x est perturbé
        expect(camera.lookAt).toHaveBeenCalledTimes(1);
    });

    it('applique la rotation berserk quand isSpecialAttack=true', () => {
        renderScene({ isSpecialAttack: true });
        const callback = useFrame.mock.calls[0][0];
        const camera = makeCamera();
        expect(() => callback(makeState(camera))).not.toThrow();
        expect(camera.position.lerp).toHaveBeenCalledTimes(1);
    });

    it('gère hitTrigger=true avec isSpecialAttack=true (shake 12)', () => {
        renderScene({ hitTrigger: true, isSpecialAttack: true });
        const callback = useFrame.mock.calls[0][0];
        const camera = makeCamera();
        expect(() => callback(makeState(camera))).not.toThrow();
    });

    it('ajuste le FOV selon hitTrigger', () => {
        renderScene({ hitTrigger: true });
        const callback = useFrame.mock.calls[0][0];
        const camera = makeCamera();
        callback(makeState(camera));
        // MathUtils.lerp a été appelé pour le FOV
        const { MathUtils } = require('three');
        expect(MathUtils.lerp).toHaveBeenCalled();
    });
});

// ─── DeviceMotion listener callback ──────────────────────────────────────────

describe('Scene DeviceMotion callback', () => {
    beforeEach(() => {
        DeviceMotion.addListener.mockClear();
    });

    it('met à jour le parallax quand rotation est fournie', () => {
        let capturedCallback;
        DeviceMotion.addListener.mockImplementationOnce((cb) => {
            capturedCallback = cb;
            return { remove: jest.fn() };
        });
        renderScene();
        expect(capturedCallback).toBeDefined();
        expect(() => capturedCallback({ rotation: { beta: 0.5, gamma: 0.3 } })).not.toThrow();
    });

    it('ne plante pas si rotation est absent dans l\'événement', () => {
        let capturedCallback;
        DeviceMotion.addListener.mockImplementationOnce((cb) => {
            capturedCallback = cb;
            return { remove: jest.fn() };
        });
        renderScene();
        expect(() => capturedCallback({})).not.toThrow();
    });

    it('ne plante pas si rotation est null', () => {
        let capturedCallback;
        DeviceMotion.addListener.mockImplementationOnce((cb) => {
            capturedCallback = cb;
            return { remove: jest.fn() };
        });
        renderScene();
        expect(() => capturedCallback({ rotation: null })).not.toThrow();
    });
});
