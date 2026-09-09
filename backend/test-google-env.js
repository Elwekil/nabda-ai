const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Testing Google OAuth Environment Variables\n');
console.log('=====================================');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '***' + process.env.GOOGLE_CLIENT_SECRET.slice(-10) : 'NOT SET');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('=====================================\n');

if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('your_')) {
    console.log('❌ GOOGLE_CLIENT_ID is not set or has placeholder value');
} else {
    console.log('✅ GOOGLE_CLIENT_ID is set');
}

if (!process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET.includes('your_')) {
    console.log('❌ GOOGLE_CLIENT_SECRET is not set or has placeholder value');
} else {
    console.log('✅ GOOGLE_CLIENT_SECRET is set');
}

console.log('\n🔗 Test URL:');
console.log('http://localhost:5001/api/auth/google');
