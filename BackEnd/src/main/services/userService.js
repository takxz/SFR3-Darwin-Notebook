const fs = require('fs').promises;
const path = require('path');
const userRepository = require('../repositories/userRepository');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const purgeExpiredAccounts = async () => {
    try {
        // On appelle la fonction avec son nouveau nom, plus explicite
        const purgeData = await userRepository.findExpiredUsersWithCreatureScans();

        if (purgeData.length === 0) {
            console.log('[RGPD] Aucun compte expiré à purger.');
            return;
        }

        const userIdsToDelete = new Set(purgeData.map(u => u.user_id));
        const filePathsToDelete = purgeData
            .filter(u => u.scan_url && !u.scan_url.startsWith('http'))
            .map(u => path.join(UPLOADS_DIR, u.scan_url));

        const unlinkPromises = filePathsToDelete.map(filePath =>
            fs.unlink(filePath).catch(err => {
                if (err.code !== 'ENOENT') {
                    console.error(`[RGPD] Erreur lors de la suppression du fichier ${filePath}:`, err);
                }
            })
        );
        await Promise.allSettled(unlinkPromises);
        console.log(`[RGPD] ${filePathsToDelete.length} fichiers de créatures traités pour suppression.`);

        const userIdsArray = Array.from(userIdsToDelete);
        if (userIdsArray.length > 0) {
            await userRepository.deleteUsersByIds(userIdsArray);
            console.log(`[RGPD] ${userIdsArray.length} comptes utilisateurs (et leurs données associées) supprimés définitivement.`);
        }

    } catch (err) {
        console.error('[RGPD] Erreur lors du processus de purge des comptes expirés:', err);
    }
};

const requestAccountDeletion = async (userId) => {
    await userRepository.setDeletionTimestamp(userId);
};

const cancelAccountDeletion = async (userId) => {
    await userRepository.clearDeletionTimestamp(userId);
};

const getProfile = async (userId) => {
    return userRepository.getProfileById(userId);
};

const getPublicProfileById = async (userId) => {
    return userRepository.getPublicProfileById(userId);
};

module.exports = {
    purgeExpiredAccounts,
    requestAccountDeletion,
    cancelAccountDeletion,
    getProfile,
    getPublicProfileById,
};
