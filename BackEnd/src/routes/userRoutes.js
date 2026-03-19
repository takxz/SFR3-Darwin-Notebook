const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route protégée pour obtenir son propre profil
router.get('/profile', authMiddleware, userController.getProfile);

// Route pour obtenir le profil public de quelqu'un d'autre
router.get('/:id', authMiddleware, userController.getUserById);

// Route pour ajouter une créature à l'utilisateur connecté
router.post('/creatures/add', authMiddleware, userController.addCreature);

// Route pour obtenir toutes les créatures d'un joueur par son ID
router.get('/:id/creatures', authMiddleware, userController.getUserCreatures);

module.exports = router;
