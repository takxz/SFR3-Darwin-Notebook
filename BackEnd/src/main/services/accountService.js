const fs = require('fs').promises;
const path = require('path');
const playerRepository = require('../repositories/playerRepository');
const db = require('../config/db');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const purgeExpiredAccounts = async () => {
    try {
        // Étape 1 : Demander au Repository les données nécessaires.
        const purgeData = await playerRepository.findExpiredPlayersWithCreatures();

        if (purgeData.length === 0) {
            console.log('[RGPD] Aucun compte expiré à purger.');
            return;
        }

        // Étape 2 : Préparer les listes d'IDs et de fichiers à supprimer.
        const playerIdsToDelete = new Set();
        const filePathsToDelete = [];

        for (const row of purgeData) {
            playerIdsToDelete.add(row.player_id);

            if (row.scan_url && !row.scan_url.startsWith('http')) {
                const filePath = path.join(UPLOADS_DIR, row.scan_url);
                filePathsToDelete.push(filePath);
            }
        }

        // Étape 3 : Supprimer les fichiers de manière asynchrone et non-bloquante.
        const unlinkPromises = filePathsToDelete.map(filePath =>
            fs.unlink(filePath).catch(err => {
                if (err.code !== 'ENOENT') {
                    console.error(`[RGPD] Erreur lors de la suppression du fichier ${filePath}:`, err);
                }
            })
        );
        await Promise.allSettled(unlinkPromises);
        console.log(`[RGPD] ${filePathsToDelete.length} fichiers de créatures traités pour suppression.`);

        // Étape 4 : Supprimer les joueurs en une seule requête "bulk".
        const playerIdsArray = Array.from(playerIdsToDelete);
        if (playerIdsArray.length > 0) {
            await playerRepository.deleteCreaturesByPlayerIds(playerIdsArray);
            await playerRepository.deletePlayersByIds(playerIdsArray);
            console.log(`[RGPD] ${playerIdsArray.length} comptes joueurs supprimés définitivement.`);
        }

    } catch (err) {
        console.error('[RGPD] Erreur lors du processus de purge des comptes expirés:', err);
    }
};

module.exports = {
    purgeExpiredAccounts,
};
