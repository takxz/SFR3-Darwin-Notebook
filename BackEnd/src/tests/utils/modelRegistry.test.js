const { createModelRegistry } = require('../../main/utils/modelRegistry');
const fs = require('fs');
const path = require('path');

// On décrit notre série de tests
describe('createModelRegistry', () => {

    // On crée un faux dossier de modèles pour notre test
    const FAKE_MODELS_DIR = path.join(__dirname, 'test_models');

    beforeAll(() => {
        // Avant les tests, on crée le dossier et des faux fichiers
        fs.mkdirSync(FAKE_MODELS_DIR, { recursive: true });
        fs.writeFileSync(path.join(FAKE_MODELS_DIR, 'Alpaca.glb'), 'data');
        fs.writeFileSync(path.join(FAKE_MODELS_DIR, 'Fox.fbx'), 'data');
        fs.writeFileSync(path.join(FAKE_MODELS_DIR, 'readme.txt'), 'data'); // Un fichier à ignorer
    });

    afterAll(() => {
        // Après les tests, on nettoie tout
        fs.rmSync(FAKE_MODELS_DIR, { recursive: true, force: true });
    });

    // Le test en lui-même
    it('devrait créer un registre correct à partir d\'un dossier', () => {
        const registry = createModelRegistry(FAKE_MODELS_DIR);

        // On vérifie que le registre a la bonne taille (ignore les .txt)
        expect(registry.size).toBe(2);

        // On vérifie que les associations sont correctes
        expect(registry.get('Alpaca')).toBe('Alpaca.glb');
        expect(registry.get('Fox')).toBe('Fox.fbx');
        expect(registry.get('readme')).toBeUndefined(); // Doit ignorer les autres fichiers
    });
});
