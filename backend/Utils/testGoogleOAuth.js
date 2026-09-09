const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testGoogleOAuthSetup() {
    console.log('🔍 Testing Google OAuth Setup\n');
    console.log('=====================================\n');
    
    let connection;
    let allTestsPassed = true;
    
    try {
        // Test 1: Check environment variables
        console.log('📋 Test 1: Environment Variables');
        const requiredEnvVars = [
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET',
            'GOOGLE_CALLBACK_URL',
            'FRONTEND_URL',
            'JWT_SECRET'
        ];
        
        const missingVars = [];
        const placeholderVars = [];
        
        requiredEnvVars.forEach(varName => {
            const value = process.env[varName];
            if (!value) {
                missingVars.push(varName);
            } else if (value.includes('your_') || value.includes('change_this')) {
                placeholderVars.push(varName);
            }
        });
        
        if (missingVars.length > 0) {
            console.log('   ❌ Missing variables:', missingVars.join(', '));
            allTestsPassed = false;
        } else if (placeholderVars.length > 0) {
            console.log('   ⚠️  Placeholder values detected:', placeholderVars.join(', '));
            console.log('   Please update these with actual values from Google Cloud Console');
            allTestsPassed = false;
        } else {
            console.log('   ✅ All environment variables configured');
        }
        console.log('');
        
        // Test 2: Database connection
        console.log('📋 Test 2: Database Connection');
        try {
            connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'health_sync'
            });
            console.log('   ✅ Database connection successful');
        } catch (error) {
            console.log('   ❌ Database connection failed:', error.message);
            allTestsPassed = false;
            return;
        }
        console.log('');
        
        // Test 3: Check database schema
        console.log('📋 Test 3: Database Schema');
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME = 'users'
              AND COLUMN_NAME IN ('google_id', 'auth_provider', 'is_verified')
        `, [process.env.DB_NAME || 'health_sync']);
        
        const requiredColumns = ['google_id', 'auth_provider', 'is_verified'];
        const foundColumns = columns.map(col => col.COLUMN_NAME);
        const missingColumns = requiredColumns.filter(col => !foundColumns.includes(col));
        
        if (missingColumns.length > 0) {
            console.log('   ❌ Missing columns:', missingColumns.join(', '));
            console.log('   Run: node Utils/runGoogleOAuthMigration.js');
            allTestsPassed = false;
        } else {
            console.log('   ✅ All required columns exist');
            columns.forEach(col => {
                console.log(`      - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
            });
        }
        console.log('');
        
        // Test 4: Check indexes
        console.log('📋 Test 4: Database Indexes');
        const [indexes] = await connection.query(`
            SHOW INDEX FROM users 
            WHERE Key_name IN ('idx_google_id', 'idx_auth_provider', 'idx_email')
        `);
        
        const indexNames = [...new Set(indexes.map(idx => idx.Key_name))];
        console.log('   Found indexes:', indexNames.join(', '));
        
        if (indexNames.includes('idx_google_id') && indexNames.includes('idx_email')) {
            console.log('   ✅ Required indexes exist');
        } else {
            console.log('   ⚠️  Some indexes may be missing (not critical)');
        }
        console.log('');
        
        // Test 5: Check passport configuration
        console.log('📋 Test 5: Passport Configuration');
        try {
            const passportPath = require('path').join(__dirname, '../Config/passport.js');
            require(passportPath);
            console.log('   ✅ Passport configuration loaded successfully');
        } catch (error) {
            console.log('   ❌ Passport configuration error:', error.message);
            allTestsPassed = false;
        }
        console.log('');
        
        // Test 6: Check routes
        console.log('📋 Test 6: Authentication Routes');
        try {
            const authRoutes = require('../Routes/authRoutes');
            console.log('   ✅ Authentication routes loaded successfully');
        } catch (error) {
            console.log('   ❌ Authentication routes error:', error.message);
            allTestsPassed = false;
        }
        console.log('');
        
        // Test 7: Check dependencies
        console.log('📋 Test 7: Required Dependencies');
        const requiredPackages = [
            'passport',
            'passport-google-oauth20',
            'jsonwebtoken',
            'bcryptjs'
        ];
        
        const missingPackages = [];
        requiredPackages.forEach(pkg => {
            try {
                require(pkg);
            } catch (error) {
                missingPackages.push(pkg);
            }
        });
        
        if (missingPackages.length > 0) {
            console.log('   ❌ Missing packages:', missingPackages.join(', '));
            console.log('   Run: npm install', missingPackages.join(' '));
            allTestsPassed = false;
        } else {
            console.log('   ✅ All required packages installed');
        }
        console.log('');
        
        // Final summary
        console.log('=====================================');
        if (allTestsPassed) {
            console.log('✅ All tests passed! Google OAuth is ready to use.\n');
            console.log('Next steps:');
            console.log('1. Start backend: npm start');
            console.log('2. Start frontend: cd ../Frontend && npm run dev');
            console.log('3. Test login at: http://localhost:5173/login');
        } else {
            console.log('❌ Some tests failed. Please fix the issues above.\n');
            console.log('For help, see GOOGLE_OAUTH_SETUP.md');
        }
        console.log('=====================================\n');
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
        console.error(error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run tests
testGoogleOAuthSetup();
