const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { errorMessageUserAlreadyExists } = require('../lib/fr.const');

exports.register = async (req, res) => {
    try {
        const { email, password, pseudo } = req.body;

        // 1. Vérifier si l'utilisateur existe déjà
        const userCheckEmail = await db.query('SELECT * FROM "PLAYER" WHERE email = $1', [email]);
        const userCheckPseudo = await db.query('SELECT * FROM "PLAYER" WHERE pseudo = $1', [pseudo]);

        if (userCheckEmail.rows.length > 0) {
            return res.status(409).json({ error: errorMessageUserAlreadyExists });
        }

        if (userCheckPseudo.rows.length > 0) {
            return res.status(410).json({ error: errorMessageUserAlreadyExists });
        }

        // 2. Hacher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insérer le nouvel utilisateur dans la base de données (l'ID UUID est généré automatiquement grâce à gen_random_uuid())
        const newUserQuery = `
            INSERT INTO "PLAYER" (email, password, pseudo) 
            VALUES ($1, $2, $3) 
            RETURNING id, email, pseudo, player_level;
        `;
        const newUserres = await db.query(newUserQuery, [email, hashedPassword, pseudo]);
        const newUser = newUserres.rows[0];

        // 4. Générer un token JWT pour la connexion automatique après inscription
        const token = jwt.sign(
            { id: newUser.id, pseudo: newUser.pseudo },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: "Inscription réussie",
            token,
            user: newUser
        });
    } catch (err) {
        console.error('Erreur lors de l\'inscription:', err);
        res.status(500).json({ error: "Erreur interne du serveur lors de l'inscription." });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Trouver l'utilisateur par e-mail
        const userQuery = await db.query('SELECT * FROM "PLAYER" WHERE email = $1', [email]);
        if (userQuery.rows.length === 0) {
            return res.status(400).json({ error: "Email ou mot de passe incorrect." });
        }

        const user = userQuery.rows[0];

        // 2. Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Email ou mot de passe incorrect." });
        }

        // 3. Générer le Token JWT
        const token = jwt.sign(
            { id: user.id, pseudo: user.pseudo },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: "Connexion réussie",
            token,
            user: {
                id: user.id,
                email: user.email,
                pseudo: user.pseudo,
                playerLevel: user.player_level
            }
        });
    } catch (err) {
        console.error('Erreur lors de la connexion:', err);
        res.status(500).json({ error: "Erreur interne du serveur lors de la connexion." });
    }
};
