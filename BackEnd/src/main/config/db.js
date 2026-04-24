const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });

// Validation des variables d'environnement
const requiredEnv = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);

if (missingEnv.length > 0) {
    console.warn(`[DB] ⚠️ Variables d'environnement manquantes : ${missingEnv.join(', ')}`);
}

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    // Optimisation : ajout de timeouts pour éviter les connexions fantômes
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
});

pool.on('connect', () => {
    console.log(`[DB] ✅ Connecté à la base de données : ${process.env.DB_NAME} sur ${process.env.DB_HOST}`);
});

pool.on('error', (err, client) => {
    console.error('Erreur inattendue sur la base de données PostgreSQL', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
