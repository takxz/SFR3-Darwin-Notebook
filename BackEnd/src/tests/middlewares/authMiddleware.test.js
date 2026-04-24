const jwt = require('jsonwebtoken');
const authMiddleware = require('../../main/middlewares/authMiddleware');

describe('Auth Middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            header: jest.fn()
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        process.env.JWT_SECRET = 'test_secret';
    });

    it('should return 401 if no Authorization header is provided', () => {
        req.header.mockReturnValue(null);

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Accès refusé. Aucun token fourni." });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token format is invalid', () => {
        req.header.mockReturnValue('Bearer'); // Missing token part

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Format du token invalide." });
    });

    it('should return 401 if token is invalid', () => {
        req.header.mockReturnValue('Bearer invalid-token');
        
        // Mock jwt.verify to throw an error
        jest.spyOn(jwt, 'verify').mockImplementation(() => {
            throw new Error('invalid token');
        });

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Token invalide ou expiré." });
    });

    it('should call next and set req.user if token is valid', () => {
        const payload = { id: 'uuid-123', email: 'test@example.com' };
        const token = jwt.sign(payload, process.env.JWT_SECRET);
        req.header.mockReturnValue(`Bearer ${token}`);

        // Ensure we use the real verify or mock it to return payload
        jest.spyOn(jwt, 'verify').mockReturnValue(payload);

        authMiddleware(req, res, next);

        expect(req.user).toEqual(payload);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});
