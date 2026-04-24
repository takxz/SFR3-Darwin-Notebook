const db = require('./src/main/config/db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkSchema() {
    console.log("--- DB CONNECTION CHECK ---");
    console.log("User:", process.env.DB_USER);
    console.log("Host:", process.env.DB_HOST);
    console.log("DB Name:", process.env.DB_NAME);
    console.log("Port:", process.env.DB_PORT);
    console.log("Password length:", process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
    console.log("---------------------------");

    try {
        console.log("Testing connection...");
        const res = await db.query('SELECT NOW()');
        console.log("Connection SUCCESS! Server time:", res.rows[0].now);

        console.log("\nChecking PLAYER table...");
        const playerCols = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'PLAYER'
        `);
        console.table(playerCols.rows);

        process.exit(0);
    } catch (err) {
        console.error("\n[CONNECTION FAILED]");
        console.error("Error Code:", err.code);
        console.error("Message:", err.message);
        process.exit(1);
    }
}

checkSchema();
