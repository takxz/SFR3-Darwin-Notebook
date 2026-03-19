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

// Obtenir le profil public de n'importe quel utilisateur par son ID
exports.getUserById = async (req, res) => {
    try {
        const targetId = req.params.id;

        const result = await db.query(
            'SELECT id, pseudo, player_level, bio_token FROM "PLAYER" WHERE id = $1',
            [targetId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erreur lors de la récupération du profil public:', err);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

// Ajouter un animal à un utilisateur (l'utilisateur connecté ou spécifié par player_id dans le body)
exports.addCreature = async (req, res) => {
    try {
        const { 
            species_id, 
            player_id, 
            gamification_name, 
            scan_url, 
            scan_quality, 
            gps_location 
        } = req.body;

        const userId = player_id || req.user.id;

        // 1. Récupérer les informations de l'espèce pour les stats de base
        const speciesQuery = await db.query('SELECT * FROM "SPECIES" WHERE id = $1', [species_id]);
        if (speciesQuery.rows.length === 0) {
            return res.status(404).json({ error: "Espèce non trouvée." });
        }
        const species = speciesQuery.rows[0];

        // 2. Insérer la nouvelle créature
        const query = `
            INSERT INTO "CREATURE" (
                species_id, 
                player_id, 
                gamification_name, 
                scan_url, 
                scan_quality, 
                gps_location, 
                stat_atq, 
                stat_def, 
                stat_pv, 
                stat_speed,
                creature_level,
                experience
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, 0)
            RETURNING *;
        `;

        const result = await db.query(query, [
            species_id,
            userId,
            gamification_name || species.name,
            scan_url || null,
            scan_quality || null,
            gps_location || null,
            species.base_stat_atq,
            species.base_stat_def,
            species.base_stat_pv,
            species.base_stat_speed
        ]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erreur lors de l\'ajout de la créature:', err);
        res.status(500).json({ error: "Erreur lors de l'ajout de la créature." });
    }
};

// Récupérer tous les animaux d'un joueur
exports.getUserCreatures = async (req, res) => {
    try {
        const userId = req.params.id;

        const query = `
            SELECT c.*, s.name as species_name, s.type as species_type, s.rarity as species_rarity
            FROM "CREATURE" c
            JOIN "SPECIES" s ON c.species_id = s.id
            WHERE c.player_id = $1;
        `;

        const result = await db.query(query, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des créatures:', err);
        res.status(500).json({ error: "Erreur lors de la récupération des créatures." });
    }
};
