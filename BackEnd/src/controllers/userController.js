const db = require('../config/db');

exports.getProfile = async (req, res) => {
    try {
        // req.user.id vient du middleware d'authentification
        const userId = req.user.id;

        const result = await db.query(
            'SELECT id, email, pseudo, player_level, bio_token FROM "PLAYER" WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erreur lors de la récupération du profil:', err);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
