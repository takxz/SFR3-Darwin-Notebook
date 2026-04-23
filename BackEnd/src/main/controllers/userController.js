const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

async function purgePlayerData(userId) {
    const creatures = await db.query('SELECT scan_url FROM public."CREATURE" WHERE player_id = $1', [userId]);
    for (const creature of creatures.rows) {
        if (creature.scan_url) {
            const filename = creature.scan_url.split('/uploads/').pop();
            if (filename) {
                const filePath = path.join(UPLOADS_DIR, filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }
    }
    await db.query('DELETE FROM public."PLAYER" WHERE id = $1', [userId]);
}

exports.purgeExpiredAccounts = async () => {
    try {
        await db.query(`ALTER TABLE public."PLAYER" ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ`);
        const result = await db.query(
            `SELECT id FROM public."PLAYER" WHERE deletion_requested_at IS NOT NULL AND deletion_requested_at <= NOW() - INTERVAL '30 days'`
        );
        for (const row of result.rows) {
            await purgePlayerData(row.id);
            console.log(`[RGPD] Compte ${row.id} supprimé définitivement.`);
        }
    } catch (err) {
        console.error('[RGPD] Erreur purge comptes expirés:', err);
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        await db.query(`ALTER TABLE public."PLAYER" ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ`);
        await db.query(
            `UPDATE public."PLAYER" SET deletion_requested_at = NOW() WHERE id = $1`,
            [userId]
        );
        res.status(200).json({ message: "Votre compte sera supprimé définitivement dans 30 jours. Vous pouvez annuler cette demande en vous reconnectant." });
    } catch (err) {
        console.error('Erreur lors de la demande de suppression du compte:', err);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

exports.cancelDeleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        await db.query(
            `UPDATE public."PLAYER" SET deletion_requested_at = NULL WHERE id = $1`,
            [userId]
        );
        res.status(200).json({ message: "Demande de suppression annulée." });
    } catch (err) {
        console.error('Erreur lors de l\'annulation de la suppression:', err);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

// Reconstruit l'URL publique à partir d'un scan_url stocké en base.
// Retourne l'URL telle quelle si c'est déjà une URL absolue (ancienne donnée ou source externe),
// sinon préfixe avec l'URL de base + "/uploads/".
const buildScanUrl = (req, storedValue) => {
    if (!storedValue) return null;
    if (/^https?:\/\//i.test(storedValue)) return storedValue;
    return `${req.protocol}://${req.get('host')}/uploads/${storedValue}`;
};

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
            scientific_name,
            scan_quality, 
            gps_location,
            stat_atq,
            stat_def,
            stat_pv,
            stat_speed
        } = req.body;

        const userId = player_id || req.user.id;
        // On stocke uniquement le nom du fichier en base pour les uploads locaux.
        // Pour les URLs externes (ex: image renvoyée par l'API Python), on conserve l'URL telle quelle.
        let finalScanUrl = req.body.scan_url || null;

        if (req.file) {
            finalScanUrl = req.file.filename;
        }

        // 1. Récupérer les informations de l'espèce pour les stats de base
        let speciesQuery = await db.query('SELECT * FROM "SPECIES" WHERE LOWER(latin_name) = LOWER($1)', [scientific_name]);
        let species;

        if (speciesQuery.rows.length > 0) {
            species = speciesQuery.rows[0];
        } else {
            speciesQuery = await db.query('SELECT * FROM "SPECIES" WHERE id = $1', [species_id]);
            if (speciesQuery.rows.length > 0) {
                species = speciesQuery.rows[0];
            } else {
                // Création d'une nouvelle espèce si non trouvée
                const insertSpecies = await db.query(
                    `INSERT INTO "SPECIES" (latin_name, name, type, rarity, base_stat_atq, base_stat_def, base_stat_pv, base_stat_speed)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                    [
                        scientific_name || 'Inconnu',
                        gamification_name || 'Inconnu',
                        'Inconnu', 
                        'Commun', 
                        stat_atq || 10, 
                        stat_def || 10, 
                        stat_pv || 10, 
                        stat_speed || 10,
                    ]
                );
                species = insertSpecies.rows[0];
            }
        }

        const actual_species_id = species.id;

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
            actual_species_id,
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
                s.average_weight AS weight,
                s.average_life_expectancy AS lifespan,
                s.model_path AS species_model_path
            FROM public."CREATURE" c
            JOIN public."SPECIES" s ON c.species_id = s.id
            WHERE c.player_id = $1
            ORDER BY c.scan_date DESC;
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
            scan_url: buildScanUrl(req, creature.scan_url),
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

// Récupérer toutes les plantes d'un joueur
exports.getUserPlants = async (req, res) => {
    try {
        const userId = req.params.id;

        const query = `
            SELECT
                c.*,
                s.name AS species_name,
                s.type AS species_type,
                s.rarity AS species_rarity,
                s.average_weight AS weight,
                s.average_life_expectancy AS lifespan
            FROM "CREATURE" c
            JOIN "SPECIES" s ON c.species_id = s.id
            WHERE c.player_id = $1 AND LOWER(s.type) IN ('plante', 'plant', 'flora');
        `;

        const result = await db.query(query, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Erreur lors de la récupération des plantes:', err);
        res.status(500).json({ error: "Erreur lors de la récupération des plantes." });
    }
};

// Récupérer les détails d'un seul animal du joueur + le modèle 3D
exports.getUserCreatureDetails = async(req, res) => {
    try {
        const userId = req.params.id;
        const creatureId = req.params.creatureid;

        const query = `
            SELECT
                c.*,
                c.plant_link_id AS "plantLinkId",
                s.name AS species_name,
                s.type AS species_type,
                s.rarity AS species_rarity,
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
            scan_url: buildScanUrl(req, creature.scan_url),
            model_3d_url: creature.species_model_path ? `${baseUrl}${creature.species_model_path}` : null
        };

        res.json(creatureDetails);

    } catch (err) {
        console.error('Erreur SQL dans getUserCreatureDetails :', err);
        res.status(500).json({ error: "Erreur interne lors de la récupération des détails de la créature." });
    }
};

// Lier une plante à une créature
exports.linkPlantToCreature = async (req, res) => {
    try {
        const userId = req.params.id;
        const creatureId = req.params.creatureid;
        const { plantLinkId } = req.body;

        if (!plantLinkId) {
            return res.status(400).json({ error: "L'ID de la plante (plantLinkId) est requis." });
        }

        // 1. Récupérer les stats de la plante
        const plantQuery = await db.query(
            `SELECT stat_pv, stat_atq, stat_def, stat_speed FROM "CREATURE" WHERE id = $1`,
            [plantLinkId]
        );

        if (plantQuery.rows.length === 0) {
            return res.status(404).json({ error: "Plante introuvable." });
        }

        const plant = plantQuery.rows[0];

        // 2. Mettre à jour l'animal en liant la plante ET en ajoutant ses stats
        const query = `
            UPDATE "CREATURE"
            SET 
                plant_link_id = $1,
                stat_pv = stat_pv + $2,
                stat_atq = stat_atq + $3,
                stat_def = stat_def + $4,
                stat_speed = stat_speed + $5
            WHERE id = $6 AND player_id = $7
            RETURNING *;
        `;

        const result = await db.query(query, [
            plantLinkId,
            plant.stat_pv || 0,
            plant.stat_atq || 0,
            plant.stat_def || 0,
            plant.stat_speed || 0,
            creatureId, 
            userId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Créature introuvable pour ce joueur." });
        }

        res.json({ message: "Plante liée avec succès.", creature: result.rows[0] });
    } catch (err) {
        console.error("Erreur lors de la liaison de la plante:", err);
        res.status(500).json({ error: "Erreur serveur lors de la mise à jour." });
    }
};

// Retirer la plante d'une créature
exports.unlinkPlantFromCreature = async (req, res) => {
    try {
        const userId = req.params.id;
        const creatureId = req.params.creatureid;

        // 1. Check if the creature has a linked plant
        const creatureQuery = await db.query(
            `SELECT plant_link_id, species_id FROM "CREATURE" WHERE id = $1 AND player_id = $2`,
            [creatureId, userId]
        );

        if (creatureQuery.rows.length === 0) {
            return res.status(404).json({ error: "Créature introuvable pour ce joueur." });
        }

        // 2. Fetch animal base stats
        const specieId = creatureQuery.rows[0].species_id;
        if (creatureQuery.rows.length > 0) {
            const baseStatsQuery = await db.query(
                `SELECT base_stat_pv, base_stat_atq, base_stat_def, base_stat_speed FROM "SPECIES" WHERE id = $1`,
                [specieId]
            );

            if (baseStatsQuery.rows.length > 0) {
                const baseStats = baseStatsQuery.rows[0];
                baseStatPv = baseStats.base_stat_pv || 0;
                baseStatAtq = baseStats.base_stat_atq || 0;
                baseStatDef = baseStats.base_stat_def || 0;
                baseStatSpeed = baseStats.base_stat_speed || 0;
            }
        }

        // 3. Remove the link and rollback the stats 
        const query = `
            UPDATE "CREATURE"
            SET 
                plant_link_id = NULL,
                stat_pv = $1,
                stat_atq = $2,
                stat_def = $3,
                stat_speed = $4
            WHERE id = $5 AND player_id = $6
            RETURNING *;
        `;

        const result = await db.query(query, [
            baseStatPv,
            baseStatAtq,
            baseStatDef,
            baseStatSpeed,
            creatureId, 
            userId
        ]);

        res.json({ message: "Plante retirée avec succès.", creature: result.rows[0] });
    } catch (err) {
        console.error("Erreur lors du retrait de la plante:", err);
        res.status(500).json({ error: "Erreur serveur lors de la mise à jour." });
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

    const rowsWithUrls = result.rows.map(row => ({
        ...row,
        scan_url: buildScanUrl(req, row.scan_url)
    }));

    res.json(rowsWithUrls)
    } catch (err) {
        console.error('Erreur lors de la récupération des 5 dernières créatures capturées:', err);
        res.status(500).json({ error: "Erreur lors de la récupération des 5 dernières créatures capturées"})
    }
}
