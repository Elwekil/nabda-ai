const { pool } = require('../Config/db');

/**
 * AuditLogger - HIPAA compliance audit logging utility
 * Logs all medical data operations for security tracking and compliance
 */
class AuditLogger {
  /**
   * Log an audit event to the database
   * @param {Object} event - The audit event object
   * @param {number} event.userId - The user ID performing the action
   * @param {string} event.type - The event type (e.g., 'IMAGE_ANALYSIS', 'SOS_TRIGGERED')
   * @param {Object} event.data - Additional event data (will be stored as JSON)
   * @param {string} event.ipAddress - The IP address of the request
   * @param {string} event.userAgent - The user agent string from the request
   * @returns {Promise<void>}
   */
  static async log(event) {
    try {
      const { userId, type, data, ipAddress, userAgent } = event;

      // Validate required fields
      if (!userId || !type) {
        console.error('❌ AuditLogger: userId and type are required');
        return;
      }

      // Insert audit log entry
      await pool.execute(
        `INSERT INTO audit_logs (user_id, event_type, event_data, ip_address, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          type,
          JSON.stringify(data || {}),
          ipAddress || null,
          userAgent || null
        ]
      );

      console.log(`✅ Audit log recorded: ${type} for user ${userId}`);
    } catch (error) {
      // Don't throw errors - audit logging should not break the main flow
      console.error('❌ AuditLogger error:', error.message);
    }
  }

  /**
   * Helper method to extract IP address from Express request
   * @param {Object} req - Express request object
   * @returns {string} IP address
   */
  static getIpAddress(req) {
    return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || null;
  }

  /**
   * Helper method to extract user agent from Express request
   * @param {Object} req - Express request object
   * @returns {string} User agent string
   */
  static getUserAgent(req) {
    return req.get('user-agent') || null;
  }

  /**
   * Convenience method to log from Express request
   * @param {Object} req - Express request object
   * @param {string} type - Event type
   * @param {Object} data - Additional event data
   * @returns {Promise<void>}
   */
  static async logFromRequest(req, type, data = {}) {
    await this.log({
      userId: req.user?.id,
      type,
      data,
      ipAddress: this.getIpAddress(req),
      userAgent: this.getUserAgent(req)
    });
  }
}

module.exports = AuditLogger;
