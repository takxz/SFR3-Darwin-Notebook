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

// Ajouter une créature à un utilisateur (gère aussi l'upload d'image)
exports.addCreature = async (req, res) => {
    try {
        const { 
            species_id, 
            player_id, 
            gamification_name, 
            scan_quality, 
            gps_location,
            stat_atq,
            stat_def,
            stat_pv,
            stat_speed
        } = req.body;

        const userId = player_id || req.user.id;
        let finalScanUrl = req.body.scan_url || null;

        // Si une image a été envoyée, on génère son URL
        if (req.file) {
            const protocol = req.protocol;
            const host = req.get('host');
            finalScanUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
        }

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
            finalScanUrl,
            scan_quality || null,
            gps_location || null,
            stat_atq || species.base_stat_atq,
            stat_def || species.base_stat_def,
            stat_pv || species.base_stat_pv,
            stat_speed || species.base_stat_speed
        ]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erreur lors de l\'ajout de la créature:', err);
        res.status(500).json({ error: "Erreur lors de l'ajout de la créature." });
    }
};

// Gérer l'upload d'image et retourner l'URL publique
exports.uploadCreatureImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Aucun fichier n'a été fourni." });
        }

        // Construire l'URL de l'image
        // On récupère le protocole (http/https) et l'hôte (IP ou domaine)
        const protocol = req.protocol;
        const host = req.get('host');
        const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        res.json({
            imageUrl: imageUrl,
            filename: req.file.filename
        });
    } catch (err) {
        console.error('Erreur lors de l\'upload de l\'image:', err);
        res.status(500).json({ error: "Erreur lors de l'upload de l'image." });
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

// Récupérer les détails d'un seul animal du joueur
exports.getUserCreatureDetails = async(req, res) => {
    try {
        const userId = req.params.id;
        const creatureId = req.params.creatureid;

        const query = `
            SELECT c.*, s.name as species_name, s.type as species_type, s.rarity as species_rarity
            FROM "CREATURE" c
                     JOIN "SPECIES" s ON c.species_id = s.id
            WHERE c.player_id = $1 AND c.id = $2;
        `;

        const result = await db.query(query, [userId, creatureId]);

        // Vérification vitale : la créature existe-t-elle ?
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Créature introuvable pour ce joueur." });
        }

        res.json(result.rows[0])

    } catch (err) {
        console.error('Erreur lors de la récupération des détails de la créature', err);
        res.status(500).json({error: "Erreur lors de la récupération des détails de la créature."});
    }
};

exports.getLastCapturedCreatures = async (req, res) => {
    try {
    const query = `select p.pseudo,  c.id, c.player_id, c.gamification_name, 
            c.scan_url, c.scan_quality, c.gps_location, c.scan_date
            FROM public."CREATURE" c
            left join public."PLAYER" p
            on p.id = c.player_id
            order by scan_date desc
            fetch first 5 rows only;`

    const result = await db.query(query)

    res.json(result.rows)
    } catch (err) {
        console.error('Erreur lors de la récupération des 5 dernières créatures capturées:', err);
        res.status(500).json({ error: "Erreur lors de la récupération des 5 dernières créatures capturées"})
    }
}
