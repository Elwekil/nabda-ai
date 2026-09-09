/**
 * Run this once to add notification columns to appointments table
 * node Backend/Utils/migrate.js
 */
const { pool } = require('../Config/db');
require('dotenv').config();

async function migrate() {
    try {
        await pool.execute(`
            ALTER TABLE appointments 
            ADD COLUMN IF NOT EXISTS notified_24h TINYINT(1) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS notified_1h  TINYINT(1) DEFAULT 0
        `);
        console.log('✅ Migration done: added notified_24h, notified_1h to appointments');
    } catch (err) {
        // Columns might already exist
        console.log('Migration note:', err.message);
    }
    process.exit(0);
}

migrate();
