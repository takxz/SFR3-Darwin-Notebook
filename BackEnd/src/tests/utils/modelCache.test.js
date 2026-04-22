const fs = require('fs');
const crypto = require('crypto');
const { modelCache, initializeModelCache, getFileHash } = require('../../main/utils/modelCacheManager');

// On mock uniquement les librairies externes
jest.mock('fs');
jest.mock('crypto');

describe('Model Cache System', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        modelCache.clear(); // Indispensable pour vider le cache entre chaque test

        // Configuration par défaut des mocks pour simuler un système de fichiers sain
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue(['Alpaca.glb', 'Bull.fbx']);
        fs.statSync.mockReturnValue({size: 1024000, mtimeMs: 1640995200000});

        // Mock du hash MD5 (retourne une chaîne longue pour tester la coupe à 8 caractères)
        crypto.createHash.mockReturnValue({
            update: jest.fn().mockReturnThis(),
            digest: jest.fn().mockReturnValue('a1b2c3d4abcdef')
        });
    });

    describe('getFileHash', () => {
        it('doit calculer le hash correctement (8 caractères)', () => {
            const result = getFileHash('/fake/path/Alpaca.glb');
            expect(result).toBe('a1b2c3d4');
        });

        it('doit retourner null et logger une erreur si le fichier est illisible', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            fs.statSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            const result = getFileHash('/fake/path/missing.glb');

            expect(result).toBeNull();
            // On vérifie que notre nouveau catch fait bien son job
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Impossible de générer le hash'),
                'Permission denied'
            );
        });
    });

    describe('initializeModelCache', () => {
        it('doit indexer les modèles et prioriser le GLB sur le FBX', () => {
            // On simule que le dossier 'models' existe, ainsi que les fichiers spécifiques
            fs.existsSync.mockImplementation((filePath) => {
                // On valide le dossier SI le chemin se termine exactement par 'models'
                if (filePath.endsWith('models')) return true;

                // On valide précisément les fichiers de test
                if (filePath.endsWith('Alpaca.glb') || filePath.endsWith('Alpaca.fbx')) return true;
                if (filePath.endsWith('Bull.fbx')) return true;

                return false;
            });

            initializeModelCache();

            expect(modelCache.size).toBe(2);

            // Vérification de la priorité
            expect(modelCache.get('Alpaca').ext).toBe('glb');
            expect(modelCache.get('Bull').ext).toBe('fbx');

            // Vérification du format de l'ETag
            expect(modelCache.get('Alpaca').etag).toBe('"a1b2c3d4"');
        });
    });
});
