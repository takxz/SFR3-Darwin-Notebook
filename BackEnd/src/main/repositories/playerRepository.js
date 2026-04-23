const db = require('../config/db');

/**
 * @file playerRepository.js
 * @description Repository pour l'entité PLAYER. Centralise l'accès aux données.
 */

const findExpiredPlayersWithCreatures = async () => {
    const query = `
        SELECT
            p.id AS player_id,
            c.scan_url
        FROM
            public."PLAYER" p
        LEFT JOIN
            public."CREATURE" c ON p.id = c.player_id
        WHERE
            p.deletion_requested_at IS NOT NULL
            AND p.deletion_requested_at <= NOW() - INTERVAL '30 days';
    `;
    const { rows } = await db.query(query);
    return rows;
};

const deleteCreaturesByPlayerIds = async (playerIds) => {
    if (playerIds.length === 0) return;
    await db.query('DELETE FROM public."CREATURE" WHERE player_id = ANY($1::int[])', [playerIds]);
};

const deletePlayersByIds = async (playerIds) => {
    if (playerIds.length === 0) return;
    await db.query('DELETE FROM public."PLAYER" WHERE id = ANY($1::int[])', [playerIds]);
};

/**
 * Marque un joueur pour suppression en ajoutant un timestamp.
 * @param {number} playerId - L'ID du joueur.
 * @returns {Promise<void>}
 */
const setDeletionTimestamp = async (playerId) => {
    // Cette première requête assure que la colonne existe, une bonne pratique pour la robustesse.
    await db.query(`ALTER TABLE public."PLAYER" ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ`);
    await db.query(
        `UPDATE public."PLAYER" SET deletion_requested_at = NOW() WHERE id = $1`,
        [playerId]
    );
};

/**
 * Annule la demande de suppression pour un joueur.
 * @param {number} playerId - L'ID du joueur.
 * @returns {Promise<void>}
 */
const clearDeletionTimestamp = async (playerId) => {
    await db.query(
        `UPDATE public."PLAYER" SET deletion_requested_at = NULL WHERE id = $1`,
        [playerId]
    );
};

module.exports = {
    findExpiredPlayersWithCreatures,
    deleteCreaturesByPlayerIds,
    deletePlayersByIds,
    setDeletionTimestamp,
    clearDeletionTimestamp,
};
