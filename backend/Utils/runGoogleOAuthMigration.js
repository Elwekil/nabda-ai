const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runGoogleOAuthMigration() {
    let connection;
    
    try {
        console.log('🔄 Starting Google OAuth migration...\n');
        
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'health_sync',
            multipleStatements: true
        });
        
        console.log('✅ Connected to database\n');
        
        // Read migration file
        const migrationPath = path.join(__dirname, '../migrations/add_google_oauth_columns.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📄 Executing migration script...\n');
        
        // Execute migration
        const [results] = await connection.query(migrationSQL);
        
        console.log('✅ Migration executed successfully!\n');
        
        // Verify columns exist
        const [columns] = await connection.query(`
            SELECT 
                COLUMN_NAME,
                COLUMN_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME = 'users'
              AND COLUMN_NAME IN ('google_id', 'auth_provider')
        `, [process.env.DB_NAME || 'health_sync']);
        
        if (columns.length > 0) {
            console.log('📋 Verified columns:');
            columns.forEach(col => {
                console.log(`   - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (Default: ${col.COLUMN_DEFAULT || 'NULL'})`);
            });
            console.log('');
        }
        
        // Verify indexes
        const [indexes] = await connection.query(`
            SHOW INDEX FROM users 
            WHERE Key_name IN ('idx_google_id', 'idx_auth_provider')
        `);
        
        if (indexes.length > 0) {
            console.log('📋 Verified indexes:');
            indexes.forEach(idx => {
                console.log(`   - ${idx.Key_name} on column ${idx.Column_name}`);
            });
            console.log('');
        }
        
        console.log('✅ Google OAuth migration completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('   1. Update your .env file with Google OAuth credentials');
        console.log('   2. Get credentials from: https://console.cloud.google.com/');
        console.log('   3. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env');
        console.log('   4. Restart your backend server');
        console.log('   5. Test Google login from the frontend\n');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run migration
runGoogleOAuthMigration();
