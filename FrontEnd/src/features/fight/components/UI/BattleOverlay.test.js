import React from 'react';
import { Animated } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BattleOverlay } from './BattleOverlay';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('expo-linear-gradient', () => {
    const { View } = require('react-native');
    return { LinearGradient: ({ children, ...props }) => <View {...props}>{children}</View> };
});

jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
    MaterialCommunityIcons: () => null,
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const defaultStats = { hp: 100, maxHp: 100, opHp: 100, opMaxHp: 100, specialCooldown: 0 };

function makeProps(overrides = {}) {
    return {
        hit: 0,
        combo: 0,
        isSpecial: false,
        isIntro: true,
        cinematicAnim: new Animated.Value(1),
        comboScaleAnim: new Animated.Value(1),
        stats: defaultStats,
        turn: null,
        isMyTurn: false,
        sendAction: jest.fn(),
        triggerHit: jest.fn(),
        triggerSpecial: jest.fn(),
        onFlee: jest.fn(),
        onQuit: jest.fn(),
        ...overrides,
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BattleOverlay', () => {
    describe('État Intro / Matchmaking', () => {
        it('doit se rendre sans erreur en mode intro', () => {
            expect(() => render(<BattleOverlay {...makeProps()} />)).not.toThrow();
        });

        it('doit afficher le texte de matchmaking', () => {
            render(<BattleOverlay {...makeProps({ isIntro: true })} />);
            expect(screen.getByText('MATCHMAKING EN COURS...')).toBeTruthy();
        });

        it('doit afficher le badge ennemi en intro', () => {
            render(<BattleOverlay {...makeProps({ isIntro: true })} />);
            expect(screen.getByTestId('enemy-badge')).toBeTruthy();
        });

        it('ne doit pas afficher le HUD de tour en mode intro', () => {
            render(<BattleOverlay {...makeProps({ isIntro: true })} />);
            expect(screen.queryByText('VOTRE TOUR')).toBeNull();
            expect(screen.queryByText('ATTENTE ADVERSAIRE...')).toBeNull();
        });

        it('ne doit pas afficher les boutons d\'action en mode intro', () => {
            render(<BattleOverlay {...makeProps({ isIntro: true })} />);
            expect(screen.queryByText('Attaque')).toBeNull();
            expect(screen.queryByText('Défense')).toBeNull();
        });
    });

    describe('État de combat (isIntro=false)', () => {
        it('doit se rendre sans erreur en mode combat', () => {
            expect(() => render(<BattleOverlay {...makeProps({ isIntro: false })} />)).not.toThrow();
        });

        it('doit afficher le tableau de stats ATK/DEF/SPD/SPC', () => {
            render(<BattleOverlay {...makeProps({ isIntro: false })} />);
            // Nested Text: "ATK " + <Text>55</Text> — match with regex
            expect(screen.getByText(/ATK/)).toBeTruthy();
            expect(screen.getByText(/DEF/)).toBeTruthy();
            expect(screen.getByText(/SPD/)).toBeTruthy();
            expect(screen.getByText(/SPC/)).toBeTruthy();
        });

        it('doit afficher "VOTRE TOUR" quand c\'est le tour du joueur', () => {
            render(<BattleOverlay {...makeProps({ isIntro: false, isMyTurn: true })} />);
            expect(screen.getByText('VOTRE TOUR')).toBeTruthy();
        });

        it('doit afficher "ATTENTE ADVERSAIRE..." quand ce n\'est pas le tour du joueur', () => {
            render(<BattleOverlay {...makeProps({ isIntro: false, isMyTurn: false })} />);
            expect(screen.getByText('ATTENTE ADVERSAIRE...')).toBeTruthy();
        });

        it('doit afficher les HP du héros et du golem', () => {
            render(<BattleOverlay {...makeProps({ isIntro: false })} />);
            expect(screen.getByTestId('hero-health-bar')).toBeTruthy();
            expect(screen.getByTestId('enemy-health-bar')).toBeTruthy();
        });

        it('doit afficher les boutons d\'action', () => {
            render(<BattleOverlay {...makeProps({ isIntro: false })} />);
            expect(screen.getByText('Attaque')).toBeTruthy();
            expect(screen.getByText('Défense')).toBeTruthy();
            expect(screen.getByText('Spécial')).toBeTruthy();
            expect(screen.getByText('Fuir')).toBeTruthy();
            expect(screen.getByText('Passer')).toBeTruthy();
        });
    });

    describe('BERSERK RAGE', () => {
        it('doit afficher BERSERK RAGE quand isSpecial=true', () => {
            render(<BattleOverlay {...makeProps({ isIntro: false, isSpecial: true })} />);
            expect(screen.getByText('BERSERK RAGE')).toBeTruthy();
        });

        it('ne doit pas afficher BERSERK RAGE quand isSpecial=false', () => {
            render(<BattleOverlay {...makeProps({ isIntro: false, isSpecial: false })} />);
            expect(screen.queryByText('BERSERK RAGE')).toBeNull();
        });
    });

    describe('Combo', () => {
        it('doit afficher le compteur combo quand combo > 1', () => {
            render(<BattleOverlay {...makeProps({ combo: 5 })} />);
            expect(screen.getByText('5')).toBeTruthy();
            expect(screen.getByText('ULTRA COMBO!')).toBeTruthy();
        });

        it('ne doit pas afficher ULTRA COMBO! quand combo <= 1', () => {
            render(<BattleOverlay {...makeProps({ combo: 1 })} />);
            expect(screen.queryByText('ULTRA COMBO!')).toBeNull();
        });

        it('ne doit pas afficher ULTRA COMBO! quand combo = 0', () => {
            render(<BattleOverlay {...makeProps({ combo: 0 })} />);
            expect(screen.queryByText('ULTRA COMBO!')).toBeNull();
        });
    });

    // Les tests de résultats ont été supprimés car ils sont maintenant gérés par RewardModal

    describe('Actions', () => {
        it('doit appeler sendAction("ATTACK") quand Attaque est pressé', () => {
            const sendAction = jest.fn();
            render(<BattleOverlay {...makeProps({ isIntro: false, isMyTurn: true, sendAction })} />);
            fireEvent.press(screen.getByText('Attaque'));
            expect(sendAction).toHaveBeenCalledWith('ATTACK');
        });

        it('doit appeler sendAction("DEFEND") quand Défense est pressé', () => {
            const sendAction = jest.fn();
            render(<BattleOverlay {...makeProps({ isIntro: false, isMyTurn: true, sendAction })} />);
            fireEvent.press(screen.getByText('Défense'));
            expect(sendAction).toHaveBeenCalledWith('DEFEND');
        });

        it('doit appeler sendAction("HEAL") quand Passer est pressé', () => {
            const sendAction = jest.fn();
            render(<BattleOverlay {...makeProps({ isIntro: false, isMyTurn: true, sendAction })} />);
            fireEvent.press(screen.getByText('Passer'));
            expect(sendAction).toHaveBeenCalledWith('HEAL');
        });
    });
});
