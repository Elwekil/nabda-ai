const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const buildMessage = (message, retryAfter) => ({
    success: false,
    message,
    retryAfter
});

const getUserOrIpKey = (req) => req.user?.id || ipKeyGenerator(req);

const getEmailAwareKey = (req) => {
    const ipPart = ipKeyGenerator(req);
    const email =
        typeof req.body?.email === 'string'
            ? req.body.email.trim().toLowerCase()
            : '';

    return email ? `${ipPart}:${email}` : ipPart;
};

const createLimiter = ({
    windowMs,
    max,
    message,
    retryAfter,
    skipSuccessfulRequests = false,
    keyGenerator
}) =>
    rateLimit({
        windowMs,
        max,
        skipSuccessfulRequests,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        keyGenerator,
        message: buildMessage(message, retryAfter)
    });

const generalLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests. Please try again later.',
    retryAfter: '15 minutes'
});

// Kept for compatibility with older imports/tests.
const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    keyGenerator: getEmailAwareKey,
    message: 'Too many authentication attempts. Please try again later.',
    retryAfter: '15 minutes'
});

const signupLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    keyGenerator: getEmailAwareKey,
    message: 'Too many signup attempts. Please try again later.',
    retryAfter: '15 minutes'
});

const loginLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    keyGenerator: getEmailAwareKey,
    message: 'Too many login attempts. Please try again later.',
    retryAfter: '15 minutes'
});

const otpLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyGenerator: getEmailAwareKey,
    message: 'Too many OTP requests. Please try again in an hour.',
    retryAfter: '1 hour'
});

const forgotPasswordLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyGenerator: getEmailAwareKey,
    message: 'Too many password reset requests. Please wait before trying again.',
    retryAfter: '15 minutes'
});

const verifyResetCodeLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    keyGenerator: getEmailAwareKey,
    message: 'Too many reset code verification attempts. Please try again later.',
    retryAfter: '15 minutes'
});

const resetPasswordLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    keyGenerator: getEmailAwareKey,
    message: 'Too many password reset attempts. Please try again later.',
    retryAfter: '15 minutes'
});

const aiLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many AI requests. Please try again later.',
    retryAfter: '15 minutes'
});

const sosLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyGenerator: getUserOrIpKey,
    message: 'SOS request limit reached. Please try again in an hour.',
    retryAfter: '1 hour'
});

module.exports = {
    rateLimiter: generalLimiter,
    authLimiter,
    signupLimiter,
    loginLimiter,
    otpLimiter,
    forgotPasswordLimiter,
    verifyResetCodeLimiter,
    resetPasswordLimiter,
    aiLimiter,
    sosLimiter
};
