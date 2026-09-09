const jwt = require('jsonwebtoken');
const { pool } = require('../Config/db');
const ResponseFormatter = require('../Utils/responseFormatter');

const protect = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        if (!token) {
            return ResponseFormatter.unauthorized(res, 'الرجاء تسجيل الدخول أولاً');
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const [userRows] = await pool.execute(
            'SELECT id, full_name, email, phone, age, city, blood_type, chronic_conditions, allergies, is_verified FROM users WHERE id = ?',
            [decoded.id]
        );
        
        if (userRows.length === 0) {
            return ResponseFormatter.unauthorized(res, 'المستخدم غير موجود');
        }
        
        if (!userRows[0].is_verified) {
            return ResponseFormatter.unauthorized(res, 'الرجاء تفعيل البريد الإلكتروني أولاً');
        }
        
        req.user = userRows[0];
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return ResponseFormatter.unauthorized(res, 'رمز الدخول غير صالح');
        }
        if (error.name === 'TokenExpiredError') {
            return ResponseFormatter.unauthorized(res, 'انتهت صلاحية الجلسة');
        }
        console.error('Auth middleware error:', error);
        return ResponseFormatter.error(res, 'فشل التحقق', 500);
    }
};

module.exports = { protect };