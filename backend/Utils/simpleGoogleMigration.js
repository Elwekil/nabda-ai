const mysql = require('mysql2/promise');
require('dotenv').config();

async function runSimpleMigration() {
    let connection;
    
    try {
        console.log('🔄 Starting Google OAuth migration...\n');
        
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'health_sync'
        });
        
        console.log('✅ Connected to database\n');
        
        // Check if google_id column exists
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? 
              AND TABLE_NAME = 'users' 
              AND COLUMN_NAME = 'google_id'
        `, [process.env.DB_NAME || 'health_sync']);
        
        if (columns.length === 0) {
            console.log('📝 Adding google_id column...');
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN google_id VARCHAR(255) AFTER profile_image
            `);
            console.log('✅ google_id column added\n');
        } else {
            console.log('✅ google_id column already exists\n');
        }
        
        // Check if auth_provider column exists
        const [authColumns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? 
              AND TABLE_NAME = 'users' 
              AND COLUMN_NAME = 'auth_provider'
        `, [process.env.DB_NAME || 'health_sync']);
        
        if (authColumns.length === 0) {
            console.log('📝 Adding auth_provider column...');
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN auth_provider ENUM('local', 'google') DEFAULT 'local' AFTER google_id
            `);
            console.log('✅ auth_provider column added\n');
        } else {
            console.log('✅ auth_provider column already exists\n');
        }
        
        // Add index for google_id
        try {
            await connection.query(`CREATE INDEX idx_google_id ON users(google_id)`);
            console.log('✅ Index idx_google_id created\n');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('✅ Index idx_google_id already exists\n');
            } else {
                throw error;
            }
        }
        
        // Add index for auth_provider
        try {
            await connection.query(`CREATE INDEX idx_auth_provider ON users(auth_provider)`);
            console.log('✅ Index idx_auth_provider created\n');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('✅ Index idx_auth_provider already exists\n');
            } else {
                throw error;
            }
        }
        
        // Verify
        const [finalColumns] = await connection.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? 
              AND TABLE_NAME = 'users' 
              AND COLUMN_NAME IN ('google_id', 'auth_provider')
        `, [process.env.DB_NAME || 'health_sync']);
        
        console.log('📋 Final verification:');
        finalColumns.forEach(col => {
            console.log(`   ✅ ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
        });
        
        console.log('\n✅ Migration completed successfully!\n');
        console.log('🎉 Google OAuth is now ready to use!');
        console.log('\nNext steps:');
        console.log('1. Start backend: npm start');
        console.log('2. Start frontend: cd ../Frontend && npm run dev');
        console.log('3. Test at: http://localhost:5173/login\n');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runSimpleMigration();
