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
        const finalScanUrl = req.file 
            ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
            : req.body.scan_url || null;

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

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        res.json({ imageUrl, filename: req.file.filename });
    } catch (err) {
        console.error('Erreur lors de l\'upload de l\'image:', err);
        res.status(500).json({ error: "Erreur lors de l'upload de l'image." });
    }
};

// Récupérer tous les animaux d'un joueur + les modèles 3D
exports.getUserCreatures = async (req, res) => {
    try {
        const userId = req.params.id;

        // 1. Récupération des données brutes enrichies
        // On sélectionne toutes les colonnes de la créature (c.*)
        // et on y ajoute les infos de l'espèce associée (s.name, s.model_path)
        const query = `
            SELECT
                c.*,
                s.name AS species_name,
                s.type AS species_type,
                s.rarity AS species_rarity,
                s.average_weight AS species_average_weight,
                s.average_life_expectancy AS species_average_life_expectancy,
                s.average_weight AS weight,
                s.average_life_expectancy AS lifespan,
                s.model_path AS species_model_path
            FROM public."CREATURE" c
            JOIN public."SPECIES" s ON c.species_id = s.id
            WHERE c.player_id = $1;
        `;

        const result = await db.query(query, [userId]);

        // 2. Construction dynamique de la base de l'URL pour les assets statiques
        // req.protocol = http ou https
        // req.get('host') = domaine ou IP + port (ex: 192.168.1.15:3001)
        // Résultat final attendu : "http://192.168.1.15:3001/models/"
        const baseUrl = `${req.protocol}://${req.get('host')}/models/`;

        // 3. Formatage du payload de sortie (Data Mapping)
        // On itère sur chaque ligne SQL pour assembler l'URL absolue du modèle 3D
        const creaturesWithModels = result.rows.map(creature => ({
            ...creature, // On conserve l'intégralité des données d'origine (id, stats, etc.)
            // On crée la nouvelle clé avec le modèle3D
            model_3d_url: creature.species_model_path ? `${baseUrl}${creature.species_model_path}` : null
        }));

        // 4. Envoi de la réponse JSON enrichie au client (Code HTTP 200 implicite)
        res.json(creaturesWithModels);

    } catch (err) {
        console.error('Erreur SQL dans getUserCreatures :', err);
        res.status(500).json({ error: "Erreur interne lors de la récupération de la collection." });
    }
};

// Récupérer les détails d'un seul animal du joueur + le modèle 3D
exports.getUserCreatureDetails = async (req, res) => {
    try {
        const userId = req.params.id;
        const creatureId = req.params.creatureid;

        const query = `
            SELECT
                c.*,
                s.name AS species_name,
                s.type AS species_type,
                s.rarity AS species_rarity,
                s.average_weight AS species_average_weight,
                s.average_life_expectancy AS species_average_life_expectancy,
                s.average_weight AS weight,
                s.average_life_expectancy AS lifespan,
                s.model_path AS species_model_path
            FROM public."CREATURE" c
            JOIN public."SPECIES" s ON c.species_id = s.id
            WHERE c.player_id = $1 AND c.id = $2;
        `;

        const result = await db.query(query, [userId, creatureId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Créature non trouvée ou n'appartenant pas à ce joueur." });
        }

        const creature = result.rows[0];
        const baseUrl = `${req.protocol}://${req.get('host')}/models/`;

        // Assemblage de l'objet de retour
        const creatureDetails = {
            ...creature,
            model_3d_url: creature.species_model_path ? `${baseUrl}${creature.species_model_path}` : null
        };

        res.json(creatureDetails);

    } catch (err) {
        console.error('Erreur SQL dans getUserCreatureDetails :', err);
        res.status(500).json({ error: "Erreur interne lors de la récupération des détails de la créature." });
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
