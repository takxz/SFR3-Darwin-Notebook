const userRepository = require('../../main/repositories/userRepository');
const db = require('../../main/config/db');

// --- Mock ---
jest.mock('../../main/config/db', () => ({
    query: jest.fn(),
}));

describe('userRepository', () => {

    beforeEach(() => {
        jest.resetAllMocks();
    });

    // ==========================================
    // 1. getPublicProfileById
    // ==========================================
    describe('getPublicProfileById', () => {
        it('doit appeler db.query avec le bon ID utilisateur', async () => {
            const userId = 1;
            db.query.mockResolvedValue({ rows: [{ id: 1 }] });

            await userRepository.getPublicProfileById(userId);

            expect(db.query).toHaveBeenCalledTimes(1);
            // On vérifie que le paramètre est bien passé, sans se soucier de la requête exacte.
            expect(db.query).toHaveBeenCalledWith(expect.any(String), [userId]);
        });
    });

    // ==========================================
    // 2. findExpiredUsers
    // ==========================================
    describe('findExpiredUsers', () => {
        it('doit appeler db.query pour trouver les utilisateurs expirés', async () => {
            db.query.mockResolvedValue({ rows: [] });

            await userRepository.findExpiredUsersWithCreatureScans();

            // On vérifie juste que la fonction a été appelée, car elle n'a pas de paramètres.
            expect(db.query).toHaveBeenCalledTimes(1);
        });
    });

    // ==========================================
    // 3. deleteUsersByIds
    // ==========================================
    describe('deleteUsersByIds', () => {
        it('doit appeler db.query avec un tableau d\'IDs', async () => {
            const userIds = [10, 20, 30];
            db.query.mockResolvedValue({});

            await userRepository.deleteUsersByIds(userIds);

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(db.query).toHaveBeenCalledWith(expect.any(String), [userIds]);
        });

        it('ne doit pas appeler db.query si le tableau d\'IDs est vide', async () => {
            await userRepository.deleteUsersByIds([]);
            expect(db.query).not.toHaveBeenCalled();
        });
    });

    // ==========================================
    // 4. setDeletionTimestamp
    // ==========================================
    describe('setDeletionTimestamp', () => {
        it('doit appeler db.query avec le bon ID utilisateur', async () => {
            const userId = 4;
            db.query.mockResolvedValue({});

            await userRepository.setDeletionTimestamp(userId);

            // On vérifie que la requête UPDATE est bien appelée avec le bon ID.
            // Le ALTER TABLE est un détail d'implémentation qu'on peut ignorer.
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE'), // On peut être un peu plus précis si on veut
                [userId]
            );
        });
    });

    // ==========================================
    // 5. clearDeletionTimestamp
    // ==========================================
    describe('clearDeletionTimestamp', () => {
        it('doit appeler db.query avec le bon ID utilisateur', async () => {
            const userId = 5;
            db.query.mockResolvedValue({});

            await userRepository.clearDeletionTimestamp(userId);

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(db.query).toHaveBeenCalledWith(expect.any(String), [userId]);
        });
    });
});
