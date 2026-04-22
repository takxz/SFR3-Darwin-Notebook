const authController = require('../../main/controllers/authController');
const db = require('../../main/config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mocks
jest.mock('../../main/config/db');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('register', () => {
        test('should return 409 if user with same email already exists', async () => {
            req.body = { email: 'test@example.com', password: 'password', pseudo: 'testuser' };
            // Premier appel : email existe
            db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            await authController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
        });

        test('should return 410 if user with same pseudo already exists', async () => {
            req.body = { email: 'test@example.com', password: 'password', pseudo: 'testuser' };
            // Premier appel : email n'existe pas
            db.query.mockResolvedValueOnce({ rows: [] });
            // Deuxième appel : pseudo existe
            db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            await authController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(410);
            expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
        });

        test('should successfully register a new user', async () => {
            req.body = { email: 'new@example.com', password: 'password', pseudo: 'newuser' };

            // Premier appel pour vérifier l'email : retourne 0 lignes
            db.query.mockResolvedValueOnce({ rows: [] });
            // Deuxième appel pour vérifier le pseudo : retourne 0 lignes
            db.query.mockResolvedValueOnce({ rows: [] });

            // Troisième appel pour l'insertion : retourne le nouvel utilisateur
            const newUser = { id: 'uuid-123', email: 'new@example.com', pseudo: 'newuser', player_level: 1 };
            db.query.mockResolvedValueOnce({ rows: [newUser] });

            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedPassword');
            jwt.sign.mockReturnValue('mock-token');

            process.env.JWT_SECRET = 'secret';

            await authController.register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: "Inscription réussie",
                token: 'mock-token',
                user: newUser
            });
        });
    });

    describe('login', () => {
        test('should return 400 if email is not found', async () => {
            req.body = { email: 'wrong@example.com', password: 'password' };
            db.query.mockResolvedValue({ rows: [] });

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Email ou mot de passe incorrect." });
        });

        test('should return 400 if password does not match', async () => {
            req.body = { email: 'test@example.com', password: 'wrongpassword' };
            db.query.mockResolvedValue({ rows: [{ id: 1, email: 'test@example.com', password: 'hashed' }] });
            bcrypt.compare.mockResolvedValue(false);

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Email ou mot de passe incorrect." });
        });

        test('should successfully login user with correct credentials', async () => {
            const user = { id: 1, email: 'test@example.com', password: 'hashed', pseudo: 'testuser', player_level: 2 };
            req.body = { email: 'test@example.com', password: 'password' };

            db.query.mockResolvedValue({ rows: [user] });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mock-token');

            await authController.login(req, res);

            expect(res.json).toHaveBeenCalledWith({
                message: "Connexion réussie",
                token: 'mock-token',
                user: {
                    id: user.id,
                    email: user.email,
                    pseudo: user.pseudo,
                    playerLevel: 2
                }
            });
        });
    });
});
