const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Route protégée pour obtenir son propre profil
router.get('/profile', authMiddleware, userController.getProfile);

// Route pour obtenir le profil public de quelqu'un d'autre
router.get('/:id', authMiddleware, userController.getUserById);

// Route pour ajouter une créature à l'utilisateur connecté avec upload d'image
router.post('/creatures/add', authMiddleware, upload.single('image'), userController.addCreature);

// Upload d'image de créature
router.post('/creatures/upload', authMiddleware, upload.single('image'), userController.uploadCreatureImage);

// Route pour obtenir toutes les créatures d'un joueur par son ID
router.get('/:id/creatures', authMiddleware, userController.getUserCreatures);

// Route pour obtenir une créature d'un joueur par leur ID respectif
router.get('/:id/creatures/:creatureid', authMiddleware, userController.getUserCreatureDetails);

//Route pour avoir les dernières captures des joueurs
router.get('/creatures/last-captured', authMiddleware, userController.getLastCapturedCreatures)

module.exports = router;
