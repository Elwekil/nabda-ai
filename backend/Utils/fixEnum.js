require('dotenv').config();
const { pool } = require('../Config/db');

async function fix() {
    try {
        await pool.execute(
            "ALTER TABLE medical_documents MODIFY COLUMN document_type ENUM('prescription','lab_test','lab_report','xray','medical_report','other') DEFAULT 'other'"
        );
        console.log('✅ document_type enum updated');
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

fix();
