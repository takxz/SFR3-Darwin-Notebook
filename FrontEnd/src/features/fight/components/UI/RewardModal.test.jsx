import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RewardModal } from './RewardModal';
import colors from '@/assets/constants/colors.json';

// Mock Lucide icons
jest.mock('lucide-react-native', () => ({
    Trophy: () => null,
    Star: () => null,
    Coins: () => null,
    PawPrint: () => null,
}));

describe('RewardModal', () => {
    const mockRewards = {
        xp: 50,
        bioTokens: 10,
        isWinner: true,
        playerLeveledUp: true,
        newPLevel: 2,
        creatureLeveledUp: true,
        newCLevel: 3,
    };

    it('ne doit rien afficher si rewards est null', () => {
        const { toJSON } = render(<RewardModal visible={true} rewards={null} onClose={jest.fn()} />);
        expect(toJSON()).toBeNull();
    });

    it('doit afficher les récompenses de victoire correctement', () => {
        render(<RewardModal visible={true} rewards={mockRewards} onClose={jest.fn()} />);
        
        expect(screen.getByText('VICTOIRE !')).toBeTruthy();
        expect(screen.getByText('+50 XP')).toBeTruthy();
        expect(screen.getByText('+10')).toBeTruthy();
        expect(screen.getByText('NIVEAU SUPÉRIEUR !')).toBeTruthy();
        expect(screen.getByText('ANIMAL LEVEL UP !')).toBeTruthy();
    });

    it('doit afficher les récompenses de défaite correctement', () => {
        const defeatRewards = { ...mockRewards, isWinner: false, playerLeveledUp: false, creatureLeveledUp: false };
        render(<RewardModal visible={true} rewards={defeatRewards} onClose={jest.fn()} />);
        
        expect(screen.getByText('DÉFAITE')).toBeTruthy();
        expect(screen.getByText('Le combat était rude... Voici tout de même vos gains :')).toBeTruthy();
    });

    it('doit appeler onClose quand on appuie sur CONTINUER', () => {
        const onClose = jest.fn();
        render(<RewardModal visible={true} rewards={mockRewards} onClose={onClose} />);
        
        fireEvent.press(screen.getByText('CONTINUER'));
        expect(onClose).toHaveBeenCalled();
    });
});
