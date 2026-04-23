const fs = require('fs');

/**
 * Scanne un répertoire et crée un registre associant les noms de modèles à leurs noms de fichiers complets.
 * Cette fonction est "pure" : elle ne dépend que de ses entrées et n'a pas d'effets de bord.
 * C'est idéal pour la testabilité et la prévisibilité.
 *
 * @param {string} modelsDirectory - Le chemin absolu vers le dossier des modèles.
 * @returns {Map<string, string>} Un nouveau registre (Map) des modèles.
 */
function createModelRegistry(modelsDirectory) {
    const registry = new Map();
    try {
        if (!fs.existsSync(modelsDirectory)) {
            console.warn(`⚠️ Dossier des modèles introuvable: ${modelsDirectory}`);
            return registry;
        }

        const files = fs.readdirSync(modelsDirectory);
        files.forEach(file => {
            const match = file.match(/^(.*)\.(glb|fbx)$/);
            if (match) {
                const modelName = match[1];
                registry.set(modelName, file);
            }
        });
        
        console.log(`✅ ${registry.size} modèles 3D indexés et prêts à être servis.`);
    } catch (err) {
        console.error('❌ Erreur lors de la création du registre des modèles:', err);
    }
    return registry;
}

module.exports = { createModelRegistry };
