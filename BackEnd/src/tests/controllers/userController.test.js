const userController = require('../../main/controllers/userController');
const userService = require('../../main/services/userService');
const db = require('../../main/config/db');
const fs = require('fs');

// --- Mocks ---
jest.mock('../../main/services/userService');
jest.mock('../../main/config/db', () => ({ query: jest.fn() }));
jest.mock('fs', () => ({ existsSync: jest.fn(), unlinkSync: jest.fn() }));

describe('userController', () => {
    let req, res;

    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});

        req = {
            user: {}, params: {}, body: {},
            protocol: 'http', get: jest.fn().mockReturnValue('localhost:3001'),
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

    describe('Profile & Accounts', () => {
        it('getProfile: success', async () => {
            req.user.id = 'u1';
            userService.getProfile.mockResolvedValue({ id: 'u1' });
            await userController.getProfile(req, res);
            expect(res.json).toHaveBeenCalled();
        });

        it('getProfile: 404', async () => {
            userService.getProfile.mockResolvedValue(null);
            await userController.getProfile(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('getProfile: 500', async () => {
            userService.getProfile.mockRejectedValue(new Error('Err'));
            await userController.getProfile(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('deleteAccount: success', async () => {
            req.user.id = 'u1';
            userService.requestAccountDeletion.mockResolvedValue();
            await userController.deleteAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('deleteAccount: 500', async () => {
            userService.requestAccountDeletion.mockRejectedValue(new Error('Err'));
            await userController.deleteAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('cancelDeleteAccount: success', async () => {
            req.user.id = 'u1';
            userService.cancelAccountDeletion.mockResolvedValue();
            await userController.cancelDeleteAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('cancelDeleteAccount: 500', async () => {
            userService.cancelAccountDeletion.mockRejectedValue(new Error('Err'));
            await userController.cancelDeleteAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('getUserById: success', async () => {
            req.params.id = 'u2';
            userService.getPublicProfileById.mockResolvedValue({ id: 'u2' });
            await userController.getUserById(req, res);
            expect(res.json).toHaveBeenCalled();
        });

        it('getUserById: 404', async () => {
            userService.getPublicProfileById.mockResolvedValue(null);
            await userController.getUserById(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('getUserById: 500', async () => {
            userService.getPublicProfileById.mockRejectedValue(new Error('Err'));
            await userController.getUserById(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('Creatures & Collection', () => {
        it('addCreature: success with XP logic', async () => {
            req.body = { species_id: 1, player_id: 'u1' };
            db.query
                .mockResolvedValueOnce({ rows: [{ id: 1, rarity: 'Rare', name: 'N' }] }) // species
                .mockResolvedValueOnce({ rows: [{ id: 100 }] }) // creature
                .mockResolvedValueOnce({ rows: [{ xp: 10, player_level: 1, bio_token: '5' }] }) // player
                .mockResolvedValueOnce({}); // update
            await userController.addCreature(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('addCreature: error during XP update (catch)', async () => {
            req.body = { species_id: 1 };
            db.query
                .mockResolvedValueOnce({ rows: [{ id: 1, rarity: 'Commun' }] })
                .mockResolvedValueOnce({ rows: [{ id: 100 }] })
                .mockRejectedValueOnce(new Error('XP Error'));
            await userController.addCreature(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('getUserCreatures: success', async () => {
            req.params.id = 'u1';
            db.query.mockResolvedValue({ rows: [{ id: 'c1', scan_url: 's.jpg', species_model_path: 'p' }] });
            await userController.getUserCreatures(req, res);
            expect(res.json).toHaveBeenCalled();
        });

        it('getUserCreatures: 500', async () => {
            db.query.mockRejectedValue(new Error('Err'));
            await userController.getUserCreatures(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('getUserCreatureDetails: 404', async () => {
            req.params = { id: 'u1', creatureid: 'c1' };
            db.query.mockResolvedValue({ rows: [] });
            await userController.getUserCreatureDetails(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('getUserCreatureDetails: 500', async () => {
            db.query.mockRejectedValue(new Error('Err'));
            await userController.getUserCreatureDetails(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('Plants', () => {
        it('getUserPlants: success', async () => {
            req.params.id = 'u1';
            db.query.mockResolvedValue({ rows: [{ id: 'p1', scan_url: 's.jpg' }] });
            await userController.getUserPlants(req, res);
            expect(res.json).toHaveBeenCalled();
        });

        it('getUserPlants: 500', async () => {
            db.query.mockRejectedValue(new Error('Err'));
            await userController.getUserPlants(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('linkPlantToCreature: success', async () => {
            req.params = { id: 'u1', creatureid: 'c1' };
            req.body = { plantLinkId: 'p1' };
            db.query
                .mockResolvedValueOnce({ rows: [{ stat_pv: 10 }] }) // plant
                .mockResolvedValueOnce({ rows: [{ id: 'c1' }] }); // update
            await userController.linkPlantToCreature(req, res);
            expect(res.json).toHaveBeenCalled();
        });

        it('linkPlantToCreature: 404 creature', async () => {
            req.params = { id: 'u1', creatureid: 'c1' };
            req.body = { plantLinkId: 'p1' };
            db.query
                .mockResolvedValueOnce({ rows: [{ stat_pv: 10 }] }) // plant
                .mockResolvedValueOnce({ rows: [] }); // update fail
            await userController.linkPlantToCreature(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('unlinkPlantFromCreature: success', async () => {
            req.params = { id: 'u1', creatureid: 'c1' };
            db.query
                .mockResolvedValueOnce({ rows: [{ species_id: 1 }] }) // check
                .mockResolvedValueOnce({ rows: [{ base_stat_pv: 10 }] }) // base stats
                .mockResolvedValueOnce({ rows: [{ id: 'c1' }] }); // update
            await userController.unlinkPlantFromCreature(req, res);
            expect(res.json).toHaveBeenCalled();
        });
    });

    describe('Upload & Misc', () => {
        it('uploadCreatureImage: success', async () => {
            req.file = { filename: 'f.jpg' };
            await userController.uploadCreatureImage(req, res);
            expect(res.json).toHaveBeenCalled();
        });

        it('uploadCreatureImage: 400', async () => {
            req.file = null;
            await userController.uploadCreatureImage(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('getLastCapturedCreatures: success', async () => {
            db.query.mockResolvedValue({ rows: [{ scan_url: 's.jpg' }] });
            await userController.getLastCapturedCreatures(req, res);
            expect(res.json).toHaveBeenCalled();
        });

        it('getLastCapturedCreatures: 500', async () => {
            db.query.mockRejectedValue(new Error('Err'));
            await userController.getLastCapturedCreatures(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
