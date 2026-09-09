/**
 * Unified Response Formatter
 * Consistent API response structure for all endpoints
 */

class ResponseFormatter {
    // Success Response
    static success(res, data = null, message = 'Operation completed successfully', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            statusCode,
            message,
            timestamp: new Date().toISOString(),
            data
        });
    }

    // Created Response
    static created(res, data = null, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }

    // No Content Response
    static noContent(res, message = 'No content available') {
        return res.status(204).json({
            success: true,
            statusCode: 204,
            message,
            timestamp: new Date().toISOString()
        });
    }

    // List Response with Pagination
    static list(res, items, total = null, page = null, limit = null, message = 'Data retrieved successfully') {
        const response = {
            success: true,
            statusCode: 200,
            message,
            timestamp: new Date().toISOString(),
            data: {
                items,
                total: total !== null ? total : (Array.isArray(items) ? items.length : 0),
                count: Array.isArray(items) ? items.length : 0
            }
        };

        if (page !== null && limit !== null && total !== null) {
            response.data.pagination = {
                currentPage: page,
                perPage: limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            };
        }

        return res.status(200).json(response);
    }

    // Error Response
    static error(res, message = 'An error occurred', statusCode = 500, errors = null) {
        const response = {
            success: false,
            statusCode,
            message,
            timestamp: new Date().toISOString()
        };
        
        if (errors) {
            response.errors = errors;
        }
        
        return res.status(statusCode).json(response);
    }

    // Validation Error
    static validationError(res, errors, message = 'Validation failed') {
        return this.error(res, message, 422, errors);
    }

    // Unauthorized Error
    static unauthorized(res, message = 'Unauthorized access') {
        return this.error(res, message, 401);
    }

    // Forbidden Error
    static forbidden(res, message = 'Access forbidden') {
        return this.error(res, message, 403);
    }

    // Not Found Error
    static notFound(res, resource = 'Resource', message = null) {
        const msg = message || `${resource} not found`;
        return this.error(res, msg, 404);
    }

    // Bad Request Error
    static badRequest(res, message = 'Bad request', errors = null) {
        return this.error(res, message, 400, errors);
    }

    // Conflict Error
    static conflict(res, message = 'Resource already exists', errors = null) {
        return this.error(res, message, 409, errors);
    }
}

module.exports = ResponseFormatter;