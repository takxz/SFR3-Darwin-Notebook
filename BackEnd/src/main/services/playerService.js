const fs = require('fs').promises;
const path = require('path');
const playerRepository = require('../repositories/playerRepository');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

/**
 * @file playerService.js
 * @description Service pour la logique métier liée à l'entité Player.
 * Ce service orchestre les opérations mais délègue l'accès aux données
 * au playerRepository.
 */

const purgeExpiredAccounts = async () => {
    try {
        const purgeData = await playerRepository.findExpiredPlayersWithCreatures();

        if (purgeData.length === 0) {
            console.log('[RGPD] Aucun compte expiré à purger.');
            return;
        }

        const playerIdsToDelete = new Set(purgeData.map(p => p.player_id));
        const filePathsToDelete = purgeData
            .filter(p => p.scan_url && !p.scan_url.startsWith('http'))
            .map(p => path.join(UPLOADS_DIR, p.scan_url));

        const unlinkPromises = filePathsToDelete.map(filePath =>
            fs.unlink(filePath).catch(err => {
                if (err.code !== 'ENOENT') {
                    console.error(`[RGPD] Erreur lors de la suppression du fichier ${filePath}:`, err);
                }
            })
        );
        await Promise.allSettled(unlinkPromises);
        console.log(`[RGPD] ${filePathsToDelete.length} fichiers de créatures traités pour suppression.`);

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

/**
 * Lance le processus de suppression d'un compte joueur.
 * @param {number} playerId - L'ID du joueur.
 */
const requestAccountDeletion = async (playerId) => {
    // La logique métier ici est simple : juste appeler le repository.
    // Mais dans le futur, on pourrait vouloir ajouter des étapes (ex: envoyer un email).
    // C'est pourquoi cette abstraction est utile.
    await playerRepository.setDeletionTimestamp(playerId);
};

/**
 * Annule le processus de suppression d'un compte joueur.
 * @param {number} playerId - L'ID du joueur.
 */
const cancelAccountDeletion = async (playerId) => {
    await playerRepository.clearDeletionTimestamp(playerId);
};


module.exports = {
    purgeExpiredAccounts,
    requestAccountDeletion,
    cancelAccountDeletion,
};
