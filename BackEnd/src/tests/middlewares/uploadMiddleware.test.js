const upload = require('../../main/middlewares/uploadMiddleware');
const multer = require('multer');

describe('uploadMiddleware', () => {
    test('should be a multer instance', () => {
        expect(upload).toBeDefined();
        expect(typeof upload.single).toBe('function');
        expect(typeof upload.array).toBe('function');
    });
});
