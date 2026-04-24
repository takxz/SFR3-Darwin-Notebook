import { getModelForCreature, AVAILABLE_MODELS } from './FightAssets';

describe('FightAssets getModelForCreature', () => {
    it('returns exact match if modelPath exists', () => {
        expect(getModelForCreature('Shark')).toBe(AVAILABLE_MODELS['shark']);
        expect(getModelForCreature('bull')).toBe(AVAILABLE_MODELS['bull']);
    });
    
    it('returns fox for feline types', () => {
        expect(getModelForCreature('Unknown', 'Félin', 'Panthera')).toBe(AVAILABLE_MODELS['fox']);
        expect(getModelForCreature('Unknown', 'Mammifère', 'Felidae')).toBe(AVAILABLE_MODELS['fox']);
        expect(getModelForCreature('Unknown', 'chat', '')).toBe(AVAILABLE_MODELS['fox']);
    });

    it('returns wolf for canines', () => {
        expect(getModelForCreature('Unknown', 'Chien')).toBe(AVAILABLE_MODELS['wolf']);
        expect(getModelForCreature('Unknown', '', 'Canidae')).toBe(AVAILABLE_MODELS['wolf']);
    });

    it('returns koi for fish except shark', () => {
        expect(getModelForCreature('Unknown', 'Poisson')).toBe(AVAILABLE_MODELS['koi']);
        expect(getModelForCreature('Unknown', 'Poisson', 'Selachimorpha')).toBe(AVAILABLE_MODELS['shark']);
    });

    it('returns goose for birds', () => {
        expect(getModelForCreature('Unknown', 'Oiseau')).toBe(AVAILABLE_MODELS['goose']);
        expect(getModelForCreature('Unknown', '', 'Aves')).toBe(AVAILABLE_MODELS['goose']);
    });

    it('returns spider for bugs', () => {
        expect(getModelForCreature('Unknown', 'Insecte')).toBe(AVAILABLE_MODELS['spider']);
        expect(getModelForCreature('Unknown', 'Arachnide')).toBe(AVAILABLE_MODELS['spider']);
    });

    it('returns frog for amphibians', () => {
        expect(getModelForCreature('Unknown', 'Amphibien')).toBe(AVAILABLE_MODELS['frog']);
        expect(getModelForCreature('Unknown', 'grenouille')).toBe(AVAILABLE_MODELS['frog']);
    });

    it('returns rat for rodents', () => {
        expect(getModelForCreature('Unknown', 'Rongeur')).toBe(AVAILABLE_MODELS['rat']);
        expect(getModelForCreature('Unknown', '', 'Rodentia')).toBe(AVAILABLE_MODELS['rat']);
    });

    it('returns horse, deer, cow for specific herbivores', () => {
        expect(getModelForCreature(null, null, 'Equidae')).toBe(AVAILABLE_MODELS['horse']);
        expect(getModelForCreature(null, null, 'Cervidae')).toBe(AVAILABLE_MODELS['deer']);
        expect(getModelForCreature(null, null, 'Bovidae')).toBe(AVAILABLE_MODELS['cow']);
    });

    it('returns pig for unknown types', () => {
        expect(getModelForCreature('Unknown', 'Alien', 'Unknown')).toBe(AVAILABLE_MODELS['pig']);
    });
    
    it('handles undefined/null inputs safely', () => {
        expect(getModelForCreature()).toBe(AVAILABLE_MODELS['pig']);
    });
});
