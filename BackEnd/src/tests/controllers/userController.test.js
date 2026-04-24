const userController = require('../../main/controllers/userController');
const db = require('../../main/config/db');
const fs = require('fs');

// Mock du module de base de données pour isoler le contrôleur
jest.mock('../../main/config/db', () => ({
    query: jest.fn()
}));

jest.mock('fs', () => ({
    existsSync: jest.fn(),
    unlinkSync: jest.fn(),
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

        it('doit insérer uniquement le nom de fichier si un fichier (req.file) est fourni', async () => {
            req.file = { filename: 'scan123.jpg' };
            db.query
                .mockResolvedValueOnce({ rows: [{ id: 1 }] })
                .mockResolvedValueOnce({ rows: [{ scan_url: 'scan123.jpg' }] });

            await userController.addCreature(req, res);

            // Vérification des arguments passés à la requête d'insertion
            const insertQueryArgs = db.query.mock.calls[1][1];
            expect(insertQueryArgs).toContain('scan123.jpg');
            expect(insertQueryArgs).not.toContain('http://localhost:3001/uploads/scan123.jpg');
        });

        it('doit créer une nouvelle espèce et insérer la créature si l\'espèce parente est introuvable', async () => {
            // La logique du contrôleur a changé pour chercher par latin_name puis par id, puis créer
            // Ce test doit refléter ce nouveau comportement.
            req.body = {
                species_id: 999, // ID qui ne sera pas trouvé
                gamification_name: 'Pikachu',
                scientific_name: 'Mus musculus' // Nom scientifique pour la recherche
            };

            const mockNewSpecies = { id: 101, name: 'Pikachu', base_stat_atq: 10 };
            const mockCreature = { id: 100, gamification_name: 'Pikachu', species_id: 101 };

            db.query
                .mockResolvedValueOnce({ rows: [] }) // latin_name not found
                .mockResolvedValueOnce({ rows: [] }) // species_id not found
                .mockResolvedValueOnce({ rows: [mockNewSpecies] }) // species created
                .mockResolvedValueOnce({ rows: [mockCreature] }); // creature inserted

            await userController.addCreature(req, res);

            expect(db.query).toHaveBeenCalledTimes(4); // Les 4 requêtes doivent être exécutées
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockCreature);
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


    // ==========================================
    // 5. getUserCreatures
    // ==========================================
    describe('getUserCreatures', () => {
        it('doit renvoyer la collection enrichie avec les URLs des modèles 3D (200)', async () => {
            req.params.id = 'uuid-123';

            // Mock du retour SQL brut (ce qui sort du JOIN)
            const mockDbRows = [
                { id: 'c-1', species_name: 'Alpaca', species_model_path: 'alpaca', scan_url: 'scan1.jpg' },
                { id: 'c-2', species_name: 'Fougère', species_model_path: null, scan_url: null }
            ];
            db.query.mockResolvedValue({ rows: mockDbRows });

            await userController.getUserCreatures(req, res);

            // Le payload final attendu après le traitement du contrôleur
            const expectedPayload = [
                {
                    id: 'c-1',
                    species_name: 'Alpaca',
                    species_model_path: 'alpaca',
                    scan_url: 'scan1.jpg', // scan_url est renvoyé tel quel de la DB
                    model_url: '/models/alpaca' // model_url est généré
                },
                {
                    id: 'c-2',
                    species_name: 'Fougère',
                    species_model_path: null,
                    scan_url: null,
                    model_url: null
                }
            ];

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith(expectedPayload);
        });
    });

    // ==========================================
    // 6. getUserPlants
    // ==========================================
    describe('getUserPlants', () => {
        it('doit renvoyer la collection enrichie (200)', async () => {
            req.params.id = 'uuid-123';

            // Mock du retour SQL brut (ce qui sort du JOIN)
            const mockDbRows = [
                { id: 'c-2', species_name: 'Fougère', species_model_path: null }
            ];
            db.query.mockResolvedValue({ rows: mockDbRows });

            await userController.getUserPlants(req, res);

            // Le payload final attendu après le traitement du contrôleur
            const expectedPayload = [
                {
                    id: 'c-2',
                    species_name: 'Fougère',
                    species_model_path: null
                }
            ];

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith(expectedPayload);
        });
    });


    // ==========================================
    // 7. deleteAccount
    // ==========================================
    describe('deleteAccount', () => {
        it('doit marquer le compte pour suppression dans 30 jours (200)', async () => {
            req.user.id = 'uuid-123';
            db.query
                .mockResolvedValueOnce({}) // ALTER TABLE
                .mockResolvedValueOnce({}); // UPDATE deletion_requested_at

            await userController.deleteAccount(req, res);

            expect(db.query).toHaveBeenCalledTimes(2);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.stringContaining('30 jours') })
            );
        });

        it('doit renvoyer 500 si la requête DB échoue', async () => {
            req.user.id = 'uuid-123';
            db.query.mockRejectedValue(new Error('DB error'));

            await userController.deleteAccount(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Erreur interne du serveur." });
        });
    });


    // ==========================================
    // 8. cancelDeleteAccount
    // ==========================================
    describe('cancelDeleteAccount', () => {
        it('doit annuler la demande de suppression (200)', async () => {
            req.user.id = 'uuid-123';
            db.query.mockResolvedValue({});

            await userController.cancelDeleteAccount(req, res);

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('deletion_requested_at = NULL'),
                ['uuid-123']
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Demande de suppression annulée." });
        });

        it('doit renvoyer 500 si la requête DB échoue', async () => {
            req.user.id = 'uuid-123';
            db.query.mockRejectedValue(new Error('DB error'));

            await userController.cancelDeleteAccount(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Erreur interne du serveur." });
        });
    });


    // ==========================================
    // 9. purgeExpiredAccounts
    // ==========================================
    describe('purgeExpiredAccounts', () => {
        it('doit supprimer les fichiers images et le compte pour chaque compte expiré', async () => {
            const expiredPlayers = [{ id: 'uuid-expired' }];
            const creatures = [{ scan_url: 'http://ikdeksmp.fr:3001/uploads/creature-123.jpg' }];

            db.query
                .mockResolvedValueOnce({})                        // ALTER TABLE
                .mockResolvedValueOnce({ rows: expiredPlayers })  // SELECT comptes expirés
                .mockResolvedValueOnce({ rows: creatures })       // SELECT scan_url dans purgePlayerData
                .mockResolvedValueOnce({});                       // DELETE PLAYER dans purgePlayerData

            fs.existsSync.mockReturnValue(true);

            await userController.purgeExpiredAccounts();

            expect(fs.existsSync).toHaveBeenCalled();
            expect(fs.unlinkSync).toHaveBeenCalled();
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM public."PLAYER"'),
                ['uuid-expired']
            );
        });

        it('ne doit pas appeler unlinkSync si le fichier n\'existe pas sur le disque', async () => {
            db.query
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ rows: [{ id: 'uuid-expired' }] })
                .mockResolvedValueOnce({ rows: [{ scan_url: 'http://ikdeksmp.fr:3001/uploads/missing.jpg' }] })
                .mockResolvedValueOnce({});

            fs.existsSync.mockReturnValue(false);

            await userController.purgeExpiredAccounts();

            expect(fs.unlinkSync).not.toHaveBeenCalled();
        });

        it('ne doit rien supprimer s\'il n\'y a aucun compte expiré', async () => {
            db.query
                .mockResolvedValueOnce({})
                .mockResolvedValueOnce({ rows: [] });

            await userController.purgeExpiredAccounts();

            expect(db.query).toHaveBeenCalledTimes(2);
            expect(fs.unlinkSync).not.toHaveBeenCalled();
        });
    });


    // ==========================================
    // 10. getUserCreatureDetails
    // ==========================================
    describe('getUserCreatureDetails', () => {
        it('doit renvoyer un objet unique enrichi avec le modèle 3D via JOIN (200)', async () => {
            req.params = { id: 'uuid-123', creatureid: 'c-99' };

            // Mock de la ligne renvoyée par le JOIN
            const mockDbRow = {
                id: 'c-99',
                species_name: 'Lion',
                species_model_path: 'lion',
                scan_url: 'lion_scan.jpg' // Ajout de scan_url pour refléter la DB
            };
            db.query.mockResolvedValue({ rows: [mockDbRow] });

            await userController.getUserCreatureDetails(req, res);

            // Vérification du formatage par le contrôleur
            const expectedPayload = {
                id: 'c-99',
                species_name: 'Lion',
                species_model_path: 'lion',
                scan_url: 'lion_scan.jpg', // scan_url est renvoyé tel quel de la DB
                model_url: '/models/lion' // model_url est généré
            };

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith(expectedPayload);
        });

        it('doit renvoyer 404 si la créature n\'existe pas (ou n\'appartient pas au joueur)', async () => {
            req.params = { id: 'uuid-123', creatureid: 'ghost-99' };
            db.query.mockResolvedValue({ rows: [] });

            await userController.getUserCreatureDetails(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "Créature non trouvée ou n'appartenant pas à ce joueur." });
        });
    });

    // ==========================================
    // 11. linkPlantToCreature
    // ==========================================
    describe('linkPlantToCreature', () => {
        beforeEach(() => {
            req.params = { id: 'uuid-123', creatureid: 'c-1' };
            req.body = { plantLinkId: 'p-1' };
        });

        it('doit lier une plante et augmenter les stats (200)', async () => {
            const mockPlant = { stat_pv: 5, stat_atq: 2, stat_def: 1, stat_speed: 0 };
            const mockUpdatedCreature = { id: 'c-1', plant_link_id: 'p-1', stat_pv: 15 };

            db.query
                .mockResolvedValueOnce({ rows: [mockPlant] }) // SELECT plant
                .mockResolvedValueOnce({ rows: [mockUpdatedCreature] }); // UPDATE creature

            await userController.linkPlantToCreature(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: "Plante liée avec succès.",
                creature: mockUpdatedCreature
            }));
        });

        it('doit renvoyer 400 si plantLinkId est absent', async () => {
            req.body.plantLinkId = undefined;
            await userController.linkPlantToCreature(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('doit renvoyer 404 si la plante n\'existe pas', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });
            await userController.linkPlantToCreature(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: "Plante introuvable." });
        });

        it('doit renvoyer 500 en cas d\'erreur DB', async () => {
            db.query.mockRejectedValue(new Error('DB failure'));
            await userController.linkPlantToCreature(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ==========================================
    // 12. unlinkPlantFromCreature
    // ==========================================
    describe('unlinkPlantFromCreature', () => {
        beforeEach(() => {
            req.params = { id: 'uuid-123', creatureid: 'c-1' };
        });

        it('doit retirer la plante et remettre les stats de base (200)', async () => {
            const mockCreature = { id: 'c-1', species_id: 10 };
            const mockBaseStats = { base_stat_pv: 10, base_stat_atq: 5, base_stat_def: 5, base_stat_speed: 5 };
            const mockUpdatedCreature = { id: 'c-1', plant_link_id: null, stat_pv: 10 };

            db.query
                .mockResolvedValueOnce({ rows: [mockCreature] }) // SELECT creature
                .mockResolvedValueOnce({ rows: [mockBaseStats] }) // SELECT species base stats
                .mockResolvedValueOnce({ rows: [mockUpdatedCreature] }); // UPDATE creature

            await userController.unlinkPlantFromCreature(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                message: "Plante retirée avec succès."
            }));
        });

        it('doit renvoyer 404 si la créature est introuvable', async () => {
            db.query.mockResolvedValueOnce({ rows: [] });
            await userController.unlinkPlantFromCreature(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    // ==========================================
    // 13. getLastCapturedCreatures
    // ==========================================
    describe('getLastCapturedCreatures', () => {
        it('doit renvoyer les 5 dernières créatures avec URLs formattées', async () => {
            const mockRows = [
                { pseudo: 'Walid', gamification_name: 'Chat', scan_url: 'chat.jpg' }
            ];
            db.query.mockResolvedValue({ rows: mockRows });

            await userController.getLastCapturedCreatures(req, res);

            expect(res.json).toHaveBeenCalledWith([
                expect.objectContaining({
                    pseudo: 'Walid',
                    scan_url: expect.stringContaining('/uploads/chat.jpg')
                })
            ]);
        });

        it('doit renvoyer 500 en cas d\'erreur DB', async () => {
            db.query.mockRejectedValue(new Error('DB error'));
            await userController.getLastCapturedCreatures(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});

