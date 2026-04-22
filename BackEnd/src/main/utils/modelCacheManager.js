const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// On définit le chemin une seule fois. 
// __dirname est ici /BackEnd/utils, donc on remonte d'un cran.
const MODELS_DIR = path.join(__dirname, '../../assets/fight/models');

const modelCache = new Map();

/**
 * Calcule le hash unique d'un fichier (ETag)
 */
const getFileHash = (filePath) => {
    try {
        const stats = fs.statSync(filePath);
        const hashInput = `${filePath}:${stats.size}:${stats.mtimeMs}`;
        return crypto.createHash('md5').update(hashInput).digest('hex').substring(0, 8);
    } catch (err) {
        console.error(`⚠️ Impossible de générer le hash pour le fichier ${filePath} :`, err.message);
        return null;
    }
};

/**
 * Scanne le dossier et remplit la Map de cache
 */
const initializeModelCache = () => {
    try {
        if (!fs.existsSync(MODELS_DIR)) return console.warn("⚠️ Dossier modèles non trouvé.");

        const files = fs.readdirSync(MODELS_DIR);
        const modelNames = new Set(files.map(f => f.replace(/\.(glb|fbx)$/, '')));

        modelNames.forEach(baseName => {
            const glbPath = path.join(MODELS_DIR, `${baseName}.glb`);
            const fbxPath = path.join(MODELS_DIR, `${baseName}.fbx`);

            let filePath, ext;
            if (fs.existsSync(glbPath)) { filePath = glbPath; ext = 'glb'; }
            else if (fs.existsSync(fbxPath)) { filePath = fbxPath; ext = 'fbx'; }

            if (filePath) {
                const hash = getFileHash(filePath);
                modelCache.set(baseName, { ext, hash, filePath, etag: `"${hash}"` });
            }
        });
        console.log(`✅ ${modelCache.size} modèles 3D indexés.`);
    } catch (err) {
        console.error('❌ Erreur initialisation cache:', err);
    }
};

// EXPORTS pour le serveur et les tests
module.exports = {
    modelCache,
    initializeModelCache,
    getFileHash
};

// LOGIQUE CLI (uniquement si lancé directement via 'node utils/...')
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args[0] === '--list') {
        initializeModelCache();
        console.table(Array.from(modelCache.entries()).map(([k, v]) => ({ Nom: k, ETag: v.etag })));
    }
}
