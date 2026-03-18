const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route protégée pour obtenir son propre profil
router.get('/profile', authMiddleware, userController.getProfile);

// Route pour obtenir le profil public de quelqu'un d'autre
router.get('/:id', authMiddleware, userController.getUserById);

module.exports = router;
