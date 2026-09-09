const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../Config/db');
const ResponseFormatter = require('../Utils/responseFormatter');
const { sendOTPEmail } = require('../Utils/emailService');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const normalizeEmail = (email = '') => email.trim().toLowerCase();
const isDevelopment = ['development', 'dev', 'test'].includes(process.env.NODE_ENV);

const createOtpPayload = ({ email, userId, otp, expiresIn = '5 minutes' }) => ({
    email,
    ...(userId ? { userId } : {}),
    requiresOTP: true,
    expiresIn,
    ...(isDevelopment ? { otp } : {})
});

const issueOtpCode = async (db, email, type = 'verify', minutes = 5) => {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + minutes * 60000);

    if (type === 'verify') {
        await db.execute('DELETE FROM otp_codes WHERE email = ?', [email]);
        await db.execute(
            'INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (?, ?, ?)',
            [email, otp, expiresAt]
        );
    } else {
        await db.execute(
            `INSERT INTO password_resets (email, reset_code, expires_at)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE reset_code = ?, expires_at = ?, is_used = FALSE`,
            [email, otp, expiresAt, otp, expiresAt]
        );
    }

    try {
        await sendOTPEmail(email, otp, type);
    } catch (mailErr) {
        console.error('Email send failed:', mailErr.message);
    }

    return { otp, expiresAt };
};

// @desc    Google OAuth callback - generate JWT and redirect to frontend
// @route   GET /api/auth/google/callback (called by passport)
const googleCallback = async (req, res) => {
    try {
        const user = req.user;
        const token = generateToken(user.id);
        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/success?token=${token}&userId=${user.id}`);
    } catch (error) {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
    }
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
    let connection;
    try {
        const { full_name, email, phone, password, age, city, blood_type } = req.body;
        const normalizedEmail = normalizeEmail(email);
        const normalizedName = full_name?.trim();
        const normalizedPhone = phone?.trim() || null;
        const normalizedCity = city?.trim() || null;

        if (!normalizedName || !normalizedEmail || !password) {
            return ResponseFormatter.badRequest(res, 'Full name, email, and password are required');
        }

        // Check if user exists
        const [existing] = await pool.execute(
            'SELECT id, is_verified FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (existing.length > 0) {
            if (existing[0].is_verified) {
                return ResponseFormatter.conflict(res, 'Email already registered');
            }

            const { otp } = await issueOtpCode(pool, normalizedEmail, 'verify', 5);

            return ResponseFormatter.success(
                res,
                createOtpPayload({
                    email: normalizedEmail,
                    userId: existing[0].id,
                    otp
                }),
                'Account already exists but is not verified. A new OTP has been sent.'
            );
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const [result] = await connection.execute(
            `INSERT INTO users (full_name, email, phone, password, age, city, blood_type)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [normalizedName, normalizedEmail, normalizedPhone, hashedPassword, age || null, normalizedCity, blood_type || null]
        );

        const { otp } = await issueOtpCode(connection, normalizedEmail, 'verify', 5);
        await connection.commit();
        console.log(`📧 OTP for ${email}: ${otp}`);

        return ResponseFormatter.created(res, {
            ...createOtpPayload({
                email: normalizedEmail,
                userId: result.insertId,
                otp
            })
        }, 'Account created successfully. Please verify your email with the OTP sent');

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Signup error:', error);
        return ResponseFormatter.error(res, 'Failed to create account', 500);
    } finally {
        connection?.release();
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = normalizeEmail(email);

        // Check OTP
        const [otpRows] = await pool.execute(
            `SELECT * FROM otp_codes
             WHERE email = ? AND otp_code = ? AND is_used = FALSE AND expires_at > NOW()`,
            [normalizedEmail, otp]
        );

        if (otpRows.length === 0) {
            const [activeOtpRows] = await pool.execute(
                `SELECT id FROM otp_codes
                 WHERE email = ? AND is_used = FALSE AND expires_at > NOW()
                 ORDER BY id DESC LIMIT 1`,
                [normalizedEmail]
            );

            if (activeOtpRows.length === 0) {
                return ResponseFormatter.badRequest(
                    res,
                    'No active verification code found. Please resend the verification code.'
                );
            }

            return ResponseFormatter.badRequest(res, 'Invalid or expired OTP code');
        }

        // Mark OTP as used
        await pool.execute('UPDATE otp_codes SET is_used = TRUE WHERE id = ?', [otpRows[0].id]);

        // Verify user
        await pool.execute('UPDATE users SET is_verified = TRUE WHERE email = ?', [normalizedEmail]);

        // Get user data
        const [userRows] = await pool.execute(
            'SELECT id, full_name, email, phone, age, city, blood_type FROM users WHERE email = ?',
            [normalizedEmail]
        );

        const user = userRows[0];
        const token = generateToken(user.id);

        return ResponseFormatter.success(res, {
            user,
            token,
            expiresIn: process.env.JWT_EXPIRE
        }, 'Email verified successfully');

    } catch (error) {
        console.error('OTP verification error:', error);
        return ResponseFormatter.error(res, 'Failed to verify OTP', 500);
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = normalizeEmail(email);

        const [userRows] = await pool.execute(
            'SELECT id, full_name FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (userRows.length === 0) {
            return ResponseFormatter.notFound(res, 'User');
        }

        const { otp } = await issueOtpCode(pool, normalizedEmail, 'verify', 5);
        console.log(`📧 New OTP for ${email}: ${otp}`);

        return ResponseFormatter.success(res, {
            ...createOtpPayload({
                email: normalizedEmail,
                userId: userRows[0].id,
                otp
            })
        }, 'New OTP code sent successfully');

    } catch (error) {
        console.error('Resend OTP error:', error);
        return ResponseFormatter.error(res, 'Failed to resend OTP', 500);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        const [userRows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (userRows.length === 0) {
            return ResponseFormatter.unauthorized(res, 'Invalid email or password');
        }

        const user = userRows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return ResponseFormatter.unauthorized(res, 'Invalid email or password');
        }

        if (!user.is_verified) {
            return ResponseFormatter.unauthorized(res, 'Please verify your email first');
        }

        const token = generateToken(user.id);

        // Remove sensitive data
        const { password: _, ...userData } = user;

        return ResponseFormatter.success(res, {
            user: userData,
            token,
            expiresIn: process.env.JWT_EXPIRE
        }, 'Login successful');

    } catch (error) {
        console.error('Login error:', error);
        return ResponseFormatter.error(res, 'Failed to login', 500);
    }
};

// @desc    Check authentication status
// @route   GET /api/auth/check-auth
// @access  Public
const checkAuth = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return ResponseFormatter.unauthorized(res, 'No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [userRows] = await pool.execute(
            'SELECT id, full_name, email, phone, age, city, blood_type, profile_image FROM users WHERE id = ?',
            [decoded.id]
        );

        if (userRows.length === 0) {
            return ResponseFormatter.unauthorized(res, 'User not found');
        }

        return ResponseFormatter.success(res, {
            user: userRows[0],
            authenticated: true
        }, 'Authentication valid');

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return ResponseFormatter.unauthorized(res, 'Invalid token');
        }
        if (error.name === 'TokenExpiredError') {
            return ResponseFormatter.unauthorized(res, 'Token expired');
        }
        return ResponseFormatter.error(res, 'Authentication failed', 500);
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
    return ResponseFormatter.success(res, null, 'Logged out successfully');
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail) {
            return ResponseFormatter.badRequest(res, 'البريد الإلكتروني مطلوب');
        }

        // Check if user exists
        const [users] = await pool.execute(
            'SELECT id, full_name, email FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (users.length === 0) {
            // For security, don't reveal if email exists or not
            return ResponseFormatter.success(res, null, 'إذا كان البريد الإلكتروني مسجلاً، ستتلقى رابط إعادة تعيين كلمة المرور');
        }

        const user = users[0];

        // Generate reset token (6-digit OTP)
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 30 * 60000); // 30 minutes expiry

        // Save reset code in database
        await pool.execute(
            `INSERT INTO password_resets (email, reset_code, expires_at)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE reset_code = ?, expires_at = ?, is_used = FALSE`,
            [normalizedEmail, resetCode, expiresAt, resetCode, expiresAt]
        );

        // Send reset code email
        try {
            await sendOTPEmail(normalizedEmail, resetCode, 'reset');
        } catch (mailErr) {
            console.error('Email send failed:', mailErr.message);
        }
        console.log(`📧 Password reset code for ${email}: ${resetCode}`);

        return ResponseFormatter.success(res, {
            email: normalizedEmail,
            resetCode,
            expiresIn: '30 minutes'
        }, 'تم إرسال رمز إعادة تعيين كلمة المرور');

    } catch (error) {
        console.error('Forgot password error:', error);
        return ResponseFormatter.error(res, 'فشل في إرسال رابط إعادة التعيين', 500);
    }
};

// @desc    Verify reset code
// @route   POST /api/auth/verify-reset-code
// @access  Public
const verifyResetCode = async (req, res) => {
    try {
        const { email, resetCode } = req.body;
        const normalizedEmail = normalizeEmail(email);

        // Check if reset code exists and is valid
        const [resetRows] = await pool.execute(
            `SELECT * FROM password_resets
             WHERE email = ? AND reset_code = ? AND is_used = FALSE AND expires_at > NOW()`,
            [normalizedEmail, resetCode]
        );

        if (resetRows.length === 0) {
            return ResponseFormatter.badRequest(res, 'رمز إعادة التعيين غير صحيح أو منتهي الصلاحية');
        }

        // Generate temporary token for password reset
        const resetToken = jwt.sign(
            { email: normalizedEmail, purpose: 'password_reset' },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        return ResponseFormatter.success(res, {
            resetToken,
            email: normalizedEmail
        }, 'تم التحقق من الرمز بنجاح');

    } catch (error) {
        console.error('Verify reset code error:', error);
        return ResponseFormatter.error(res, 'فشل في التحقق من الرمز', 500);
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return ResponseFormatter.badRequest(res, 'جميع الحقول مطلوبة');
        }

        if (newPassword.length < 6) {
            return ResponseFormatter.badRequest(res, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }

        // Verify reset token
        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch (error) {
            return ResponseFormatter.badRequest(res, 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية');
        }

        if (decoded.purpose !== 'password_reset') {
            return ResponseFormatter.badRequest(res, 'رابط غير صالح');
        }

        const email = normalizeEmail(decoded.email);

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        await pool.execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        // Invalidate all existing sessions (optional)
        // Delete all password reset requests for this email
        await pool.execute(
            'DELETE FROM password_resets WHERE email = ?',
            [email]
        );

        return ResponseFormatter.success(res, null, 'تم تغيير كلمة المرور بنجاح');

    } catch (error) {
        console.error('Reset password error:', error);
        return ResponseFormatter.error(res, 'فشل في تغيير كلمة المرور', 500);
    }
};


module.exports = {
    signup,
    verifyOTP,
    resendOTP,
    login,
    checkAuth,
    logout,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    googleCallback
};
