const userService = require('../../main/services/userService');
const userRepository = require('../../main/repositories/userRepository');
const fs = require('fs').promises;

// --- Mocks ---
jest.mock('../../main/repositories/userRepository', () => ({
    findProfileById: jest.fn(),
    findPublicProfileById: jest.fn(),
    setDeletionTimestamp: jest.fn(),
    clearDeletionTimestamp: jest.fn(),
    findExpiredUsersWithCreatureScans: jest.fn(),
    deleteUsersByIds: jest.fn(),
}));

jest.mock('fs', () => ({
    promises: {
        unlink: jest.fn(),
    }
}));

describe('userService', () => {

    beforeEach(() => {
        // On réinitialise tous les mocks avant chaque test pour garantir l'isolation
        jest.resetAllMocks();
    });

    // ==========================================
    // 1. getProfile
    // ==========================================
    describe('getProfile', () => {
        it('doit appeler userRepository.findProfileById et renvoyer le résultat', async () => {
            const mockProfile = { id: 1, pseudo: 'TestUser' };
            // Arrange: On dit au mock du repository quoi retourner
            userRepository.findProfileById.mockResolvedValue(mockProfile);

            // Act: On appelle la fonction du service
            const result = await userService.getProfile(1);

            // Assert: On vérifie que le service a bien appelé le repository et renvoyé la bonne valeur
            expect(userRepository.findProfileById).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockProfile);
        });
    });

    // ==========================================
    // 2. getPublicProfileById
    // ==========================================
    describe('getPublicProfileById', () => {
        it('doit appeler userRepository.findPublicProfileById et renvoyer le résultat', async () => {
            const mockProfile = { id: 2, pseudo: 'PublicUser' };
            userRepository.findPublicProfileById.mockResolvedValue(mockProfile);

            const result = await userService.getPublicProfileById(2);

            expect(userRepository.findPublicProfileById).toHaveBeenCalledWith(2);
            expect(result).toEqual(mockProfile);
        });
    });

    // ==========================================
    // 3. requestAccountDeletion
    // ==========================================
    describe('requestAccountDeletion', () => {
        it('doit appeler userRepository.setDeletionTimestamp', async () => {
            userRepository.setDeletionTimestamp.mockResolvedValue();

            await userService.requestAccountDeletion(3);

            expect(userRepository.setDeletionTimestamp).toHaveBeenCalledWith(3);
        });
    });

    // ==========================================
    // 4. cancelAccountDeletion
    // ==========================================
    describe('cancelAccountDeletion', () => {
        it('doit appeler userRepository.clearDeletionTimestamp', async () => {
            userRepository.clearDeletionTimestamp.mockResolvedValue();

            await userService.cancelAccountDeletion(4);

            expect(userRepository.clearDeletionTimestamp).toHaveBeenCalledWith(4);
        });
    });

    // ==========================================
    // 5. purgeExpiredAccounts
    // ==========================================
    describe('purgeExpiredAccounts', () => {
        it('doit supprimer les utilisateurs et les fichiers locaux correspondants', async () => {
            const mockPurgeData = [
                { user_id: 1, scan_url: 'image1.jpg' },
                { user_id: 1, scan_url: 'image2.jpg' },
                { user_id: 2, scan_url: 'http://external.com/image.png' },
                { user_id: 3, scan_url: null },
                { user_id: 4, scan_url: 'image4.jpg' },
            ];
            // On utilise le nom de fonction correct
            userRepository.findExpiredUsersWithCreatureScans.mockResolvedValue(mockPurgeData);
            fs.unlink.mockResolvedValue();
            userRepository.deleteUsersByIds.mockResolvedValue();

            await userService.purgeExpiredAccounts();

            // On vérifie l'appel à la bonne fonction
            expect(userRepository.findExpiredUsersWithCreatureScans).toHaveBeenCalledTimes(1);
            
            expect(fs.unlink).toHaveBeenCalledTimes(3);
            expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('image1.jpg'));
            expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('image2.jpg'));
            expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('image4.jpg'));

            const expectedUserIdsToDelete = [1, 2, 3, 4];
            expect(userRepository.deleteUsersByIds).toHaveBeenCalledWith(
                expect.arrayContaining(expectedUserIdsToDelete)
            );
        });

        it('ne doit rien faire si aucun utilisateur n\'est à purger', async () => {
            // On utilise le nom de fonction correct
            userRepository.findExpiredUsersWithCreatureScans.mockResolvedValue([]);

            // Act
            await userService.purgeExpiredAccounts();

            // Assert: On vérifie qu'aucune opération de suppression n'a été lancée
            expect(fs.unlink).not.toHaveBeenCalled();
            expect(userRepository.deleteUsersByIds).not.toHaveBeenCalled();
        });
    });
});
