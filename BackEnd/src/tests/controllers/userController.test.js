const userController = require('../../main/controllers/userController');
const userService = require('../../main/services/userService');
const db = require('../../main/config/db'); // Gardé pour les tests non refactorisés
const fs = require('fs');

// --- Mocks ---
// On mock le service pour isoler le contrôleur. C'est la cible principale de nos nouveaux tests.
jest.mock('../../main/services/userService');

// On garde les anciens mocks pour les fonctions non encore refactorisées.
jest.mock('../../main/config/db', () => ({
    query: jest.fn()
}));
jest.mock('fs', () => ({
    existsSync: jest.fn(),
    unlinkSync: jest.fn(),
}));


describe('userController', () => {
    let req, res;

    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});

        req = {
            user: {},
            params: {},
            body: {},
            protocol: 'http',
            get: jest.fn().mockReturnValue('localhost:3001'),
            file: undefined
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterAll(() => {
        console.error.mockRestore();
    });

    // ==========================================
    // Tests pour les fonctions refactorisées
    // ==========================================

    describe('getProfile (refactorisé)', () => {
        it('doit appeler le service et renvoyer le profil (200)', async () => {
            req.user.id = 'uuid-123';
            const mockUser = { id: 'uuid-123', pseudo: 'DrDarwin' };
            
            // On configure le mock du service pour qu'il retourne notre utilisateur
            userService.getProfile.mockResolvedValue(mockUser);

            await userController.getProfile(req, res);

            // On vérifie que le contrôleur a bien appelé le service avec le bon ID
            expect(userService.getProfile).toHaveBeenCalledWith('uuid-123');
            expect(userService.getProfile).toHaveBeenCalledTimes(1);

            // On vérifie que la réponse HTTP est correcte
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

        it('doit renvoyer 404 si le service ne trouve pas d\'utilisateur', async () => {
            req.user.id = 'ghost-id';
            // Le service renvoie null si l'utilisateur n'est pas trouvé
            userService.getProfile.mockResolvedValue(null);

            await userController.getProfile(req, res);

            expect(userService.getProfile).toHaveBeenCalledWith('ghost-id');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "Utilisateur non trouvé." });
        });

        it('doit renvoyer 500 si le service lève une exception', async () => {
            req.user.id = 'uuid-123';
            userService.getProfile.mockRejectedValue(new Error('Service error'));

            await userController.getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('deleteAccount (refactorisé)', () => {
        it('doit appeler le service de suppression et renvoyer 200', async () => {
            req.user.id = 'uuid-123';
            // Le service ne renvoie rien (Promise<void>), donc on le mocke pour qu'il se résolve
            userService.requestAccountDeletion.mockResolvedValue();

            await userController.deleteAccount(req, res);

            expect(userService.requestAccountDeletion).toHaveBeenCalledWith('uuid-123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('30 jours') }));
        });
    });

    describe('cancelDeleteAccount (refactorisé)', () => {
        it('doit appeler le service d\'annulation et renvoyer 200', async () => {
            req.user.id = 'uuid-123';
            userService.cancelAccountDeletion.mockResolvedValue();

            await userController.cancelDeleteAccount(req, res);

            expect(userService.cancelAccountDeletion).toHaveBeenCalledWith('uuid-123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Demande de suppression annulée." });
        });
    });

    describe('purgeExpiredAccounts (refactorisé)', () => {
        it('doit appeler le service de purge', async () => {
            userService.purgeExpiredAccounts.mockResolvedValue();
            
            await userController.purgeExpiredAccounts();

            // On vérifie juste que le service a été appelé, car cette fonction ne renvoie pas de réponse HTTP
            expect(userService.purgeExpiredAccounts).toHaveBeenCalledTimes(1);
        });
    });


    // ==========================================
    // Anciens tests pour les fonctions non encore refactorisées
    // (On ne les touche pas pour l'instant)
    // ==========================================

    describe('getUserById', () => {
        it('doit renvoyer le profil public (200) via le paramètre d\'URL', async () => {
            req.params.id = 'target-456';
            const mockUser = { id: 'target-456', pseudo: 'PlayerTwo' };
            db.query.mockResolvedValue({ rows: [mockUser] });
            await userController.getUserById(req, res);
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });
    });

    describe('addCreature', () => {
        it('doit insérer une créature avec les stats de base de l\'espèce (201)', async () => {
            const mockSpecies = { id: 1, name: 'Souris', base_stat_atq: 10 };
            const mockCreature = { id: 100, gamification_name: 'Pikachu' };
            db.query
                .mockResolvedValueOnce({ rows: [mockSpecies] })
                .mockResolvedValueOnce({ rows: [mockCreature] });
            await userController.addCreature(req, res);
            expect(db.query).toHaveBeenCalledTimes(2);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockCreature);
        });
    });

    describe('uploadCreatureImage', () => {
        it('doit générer l\'URL absolue (200)', async () => {
            req.file = { filename: 'beast.png' };
            await userController.uploadCreatureImage(req, res);
            expect(res.json).toHaveBeenCalledWith({
                imageUrl: 'http://localhost:3001/uploads/beast.png',
                filename: 'beast.png'
            });
        });
    });

    describe('getUserCreatures', () => {
        it('doit renvoyer la collection enrichie (200)', async () => {
            req.params.id = 'uuid-123';
            const mockDbRows = [{ id: 'c-1', species_name: 'Alpaca', species_model_path: 'alpaca' }];
            db.query.mockResolvedValue({ rows: mockDbRows });
            await userController.getUserCreatures(req, res);
            const expectedPayload = [{
                id: 'c-1',
                species_name: 'Alpaca',
                species_model_path: 'alpaca',
                model_url: '/models/alpaca'
            }];
            expect(res.json).toHaveBeenCalledWith(expectedPayload);
        });
    });
});
