const db = require('../config/db');

const findExpiredUsersWithCreatureScans = async () => {
    const query = `
        SELECT
            p.id AS user_id,
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

const deleteUsersByIds = async (userIds) => {
    if (userIds.length === 0) return;
    await db.query('DELETE FROM public."PLAYER" WHERE id = ANY($1::int[])', [userIds]);
};

const setDeletionTimestamp = async (userId) => {
    await db.query(`ALTER TABLE public."PLAYER" ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ`);
    await db.query(
        `UPDATE public."PLAYER" SET deletion_requested_at = NOW() WHERE id = $1`,
        [userId]
    );
};

const clearDeletionTimestamp = async (userId) => {
    await db.query(
        `UPDATE public."PLAYER" SET deletion_requested_at = NULL WHERE id = $1`,
        [userId]
    );
};

const findProfileById = async (userId) => {
    const query = 'SELECT id, email, pseudo, player_level, xp, bio_token FROM "PLAYER" WHERE id = $1';
    const { rows } = await db.query(query, [userId]);
    return rows[0] || null;
};

const findPublicProfileById = async (userId) => {
    const query = 'SELECT id, email, pseudo, player_level, bio_token FROM "PLAYER" WHERE id = $1';
    const { rows } = await db.query(query, [userId]);
    return rows[0] || null;
};

const getProfileById = async (userId) => {
    const query = 'SELECT id, email, pseudo, player_level, bio_token, deletion_requested_at FROM "PLAYER" WHERE id = $1';
    const { rows } = await db.query(query, [userId]);
    return rows[0] || null;
};

module.exports = {
    findExpiredUsersWithCreatureScans, // Nom mis à jour
    deleteUsersByIds,
    findProfileById,
    setDeletionTimestamp,
    clearDeletionTimestamp,
    findPublicProfileById,
    getProfileById,
};
