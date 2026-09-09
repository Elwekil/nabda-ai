const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('./db');

// Don't load dotenv here - it's already loaded in app.js
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️ Google OAuth credentials not found. Google login will be disabled.');
} else {
    passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            const googleId = profile.id;
            const fullName = profile.displayName;
            const profileImage = profile.photos?.[0]?.value;

            // Check if user exists by google_id or email
            const [existing] = await pool.execute(
                'SELECT * FROM users WHERE google_id = ? OR email = ?',
                [googleId, email]
            );

            if (existing.length > 0) {
                const user = existing[0];
                // Update google_id if logged in before with email
                if (!user.google_id) {
                    await pool.execute(
                        'UPDATE users SET google_id = ?, auth_provider = ?, is_verified = TRUE WHERE id = ?',
                        [googleId, 'google', user.id]
                    );
                }
                return done(null, user);
            }

            // Create new user
            const [result] = await pool.execute(
                `INSERT INTO users (full_name, email, google_id, auth_provider, is_verified, profile_image, password)
                 VALUES (?, ?, ?, 'google', TRUE, ?, '')`,
                [fullName, email, googleId, profileImage || null]
            );

            const [newUser] = await pool.execute('SELECT * FROM users WHERE id = ?', [result.insertId]);
            return done(null, newUser[0]);
        } catch (err) {
            return done(err, null);
        }
    }));
}

module.exports = passport;
