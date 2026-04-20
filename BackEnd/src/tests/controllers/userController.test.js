const userController = require('../../main/controllers/userController');
const db = require('../../main/config/db');

// Mock du module de base de données pour isoler le contrôleur
jest.mock('../../main/config/db', () => ({
    query: jest.fn()
}));

describe('userController', () => {
    let req, res;

    // Setup : Initialisation des objets Express factices avant chaque test
    beforeEach(() => {
        // 1. Reset global pour éviter les pollutions (doit être au début)
        jest.resetAllMocks();

        // 2. Re-déclenchement des mocks de console car resetAllMocks les a effacés
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

    // Teardown : Restauration du comportement natif après la suite de tests
    afterAll(() => {
        console.error.mockRestore();
    });


    // 1. getProfile
    describe('getProfile', () => {
        it('doit renvoyer le profil (200) si le payload JWT est valide et l\'utilisateur existe', async () => {
            req.user.id = 'uuid-123';
            const mockUser = { id: 'uuid-123', pseudo: 'DrDarwin' };
            db.query.mockResolvedValue({ rows: [mockUser] });

            await userController.getProfile(req, res);

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

        it('doit renvoyer 404 si l\'utilisateur en base ne correspond pas au token', async () => {
            req.user.id = 'ghost-id';
            db.query.mockResolvedValue({ rows: [] });

            await userController.getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "Utilisateur non trouvé." });
        });

        it('doit renvoyer 500 si la promesse de base de données est rejetée', async () => {
            req.user.id = 'uuid-123';
            db.query.mockRejectedValue(new Error('Connection timeout'));

            await userController.getProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });


    // 2. getUserById
    describe('getUserById', () => {
        it('doit renvoyer le profil public (200) via le paramètre d\'URL', async () => {
            req.params.id = 'target-456';
            const mockUser = { id: 'target-456', pseudo: 'PlayerTwo' };
            db.query.mockResolvedValue({ rows: [mockUser] });

            await userController.getUserById(req, res);

            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

        it('doit renvoyer 404 si l\'ID cible n\'existe pas en base', async () => {
            req.params.id = 'target-456';
            db.query.mockResolvedValue({ rows: [] });

            await userController.getUserById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });


    // 3. addCreature
    describe('addCreature', () => {
        beforeEach(() => {
            req.body = { species_id: 1, gamification_name: 'Pikachu' };
            req.user.id = 'uuid-123'; // Fallback par défaut
        });

        it('doit insérer une créature avec les stats de base de l\'espèce (201)', async () => {
            const mockSpecies = { id: 1, name: 'Souris', base_stat_atq: 10 };
            const mockCreature = { id: 100, gamification_name: 'Pikachu' };

            // Chainage des mocks : 1er appel (SELECT species), 2ème appel (INSERT creature)
            db.query
                .mockResolvedValueOnce({ rows: [mockSpecies] })
                .mockResolvedValueOnce({ rows: [mockCreature] });

            await userController.addCreature(req, res);

            expect(db.query).toHaveBeenCalledTimes(2);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockCreature);
        });

        it('doit construire et insérer l\'URL publique si un fichier (req.file) est fourni', async () => {
            req.file = { filename: 'scan123.jpg' };
            db.query
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })
                .mockResolvedValueOnce({ rows: [{ scan_url: 'http://localhost:3001/uploads/scan123.jpg' }] });

            await userController.addCreature(req, res);

            // Vérification des arguments passés à la requête d'insertion
            const insertQueryArgs = db.query.mock.calls[1][1];
            expect(insertQueryArgs).toContain('http://localhost:3001/uploads/scan123.jpg');
        });

        it('doit throw une 404 et stopper l\'insertion si l\'espèce parente est introuvable', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });

            await userController.addCreature(req, res);

            expect(db.query).toHaveBeenCalledTimes(1); // L'insertion ne doit pas s'exécuter
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "Espèce non trouvée." });
        });
    });


    // 4. uploadCreatureImage
    describe('uploadCreatureImage', () => {
        it('doit générer l\'URL absolue à partir de req.protocol et req.get("host") (200)', async () => {
            req.file = { filename: 'beast.png' };

            await userController.uploadCreatureImage(req, res);

            expect(res.json).toHaveBeenCalledWith({
                imageUrl: 'http://localhost:3001/uploads/beast.png',
                filename: 'beast.png'
            });
        });

        it('doit renvoyer une erreur de validation (400) si multer n\'a pas intercepté de fichier', async () => {
            req.file = undefined;

            await userController.uploadCreatureImage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Aucun fichier n'a été fourni." });
        });
    });


    // 5. getUserCreatures
    describe('getUserCreatures', () => {
        it('doit renvoyer un tableau JSON contenant la collection du joueur (200)', async () => {
            req.params.id = 'uuid-123';
            const mockCollection = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
            db.query.mockResolvedValue({ rows: mockCollection });

            await userController.getUserCreatures(req, res);

            expect(res.json).toHaveBeenCalledWith(mockCollection);
        });
    });


    // 6. getUserCreatureDetails
    describe('getUserCreatureDetails', () => {
        it('doit renvoyer un objet unique avec les métadonnées de l\'espèce via JOIN (200)', async () => {
            // Note : Attention à la casse de 'creatureid' selon ton routeur
            req.params = { id: 'uuid-123', creatureid: '99' };
            const mockCreature = { id: 99, species_name: 'Lion' };
            db.query.mockResolvedValue({ rows: [mockCreature] });

            await userController.getUserCreatureDetails(req, res);

            expect(res.json).toHaveBeenCalledWith(mockCreature);
        });

        it('doit renvoyer 404 si la clause WHERE (player_id AND id) ne match aucun tuple', async () => {
            req.params = { id: 'uuid-123', creatureid: '99' };
            db.query.mockResolvedValue({ rows: [] });

            await userController.getUserCreatureDetails(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
