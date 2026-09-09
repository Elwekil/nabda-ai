const ResponseFormatter = require('../Utils/responseFormatter');

const errorHandler = (err, req, res, next) => {
    console.error('خطأ:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    if (err.name === 'ValidationError') {
        return ResponseFormatter.validationError(res, err.errors, err.message);
    }

    if (err.code === 'ER_DUP_ENTRY') {
        return ResponseFormatter.conflict(res, 'هذا البريد الإلكتروني مسجل بالفعل');
    }

    if (err.code === 'ER_NO_REFERENCED_ROW') {
        return ResponseFormatter.badRequest(res, 'البيانات المرتبطة غير موجودة');
    }

    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'حدث خطأ في الخادم' 
        : err.message || 'حدث خطأ غير متوقع';

    return ResponseFormatter.error(res, message, statusCode);
};

module.exports = { errorHandler };