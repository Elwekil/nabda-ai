const express = require('express');
const router = express.Router();
const passport = require('../Config/passport');
const {
    signup, verifyOTP, resendOTP, login, checkAuth, logout,
    forgotPassword, verifyResetCode, resetPassword, googleCallback
} = require('../Controllers/authController');
const { protect } = require('../Middleware/authMiddleware');
const {
    signupLimiter,
    loginLimiter,
    otpLimiter,
    forgotPasswordLimiter,
    verifyResetCodeLimiter,
    resetPasswordLimiter
} = require('../Middleware/rateLimiter');

// Public routes
router.post('/signup', signupLimiter, signup);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);
router.post('/login', loginLimiter, login);

// Password reset
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/verify-reset-code', verifyResetCodeLimiter, verifyResetCode);
router.post('/reset-password', resetPasswordLimiter, resetPassword);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_auth_failed' }),
    googleCallback
);

// Protected routes
router.get('/check-auth', checkAuth);
router.post('/logout', protect, logout);

module.exports = router;
