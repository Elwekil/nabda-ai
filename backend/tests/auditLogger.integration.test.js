const AuditLogger = require('../Utils/auditLogger');
const { pool } = require('../Config/db');

describe('AuditLogger Integration Tests', () => {
  afterEach(async () => {
    // Clean up test data
    try {
      await pool.execute('DELETE FROM audit_logs WHERE user_id = 999');
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should log an audit event to the database', async () => {
    const event = {
      userId: 999,
      type: 'IMAGE_ANALYSIS',
      data: { documentId: 123, imageType: 'lab_report' },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    };

    await AuditLogger.log(event);

    const [rows] = await pool.execute(
      'SELECT * FROM audit_logs WHERE user_id = ? AND event_type = ?',
      [999, 'IMAGE_ANALYSIS']
    );

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].user_id).toBe(999);
    expect(rows[0].event_type).toBe('IMAGE_ANALYSIS');
    expect(rows[0].ip_address).toBe('192.168.1.1');
    expect(rows[0].user_agent).toBe('Mozilla/5.0');
    
    const eventData = JSON.parse(rows[0].event_data);
    expect(eventData.documentId).toBe(123);
    expect(eventData.imageType).toBe('lab_report');
  });

  it('should log SOS_TRIGGERED event', async () => {
    const event = {
      userId: 999,
      type: 'SOS_TRIGGERED',
      data: { location: { lat: 30.0444, lng: 31.2357 } },
      ipAddress: '10.0.0.1'
    };

    await AuditLogger.log(event);

    const [rows] = await pool.execute(
      'SELECT * FROM audit_logs WHERE user_id = ? AND event_type = ?',
      [999, 'SOS_TRIGGERED']
    );

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].event_type).toBe('SOS_TRIGGERED');
    
    const eventData = JSON.parse(rows[0].event_data);
    expect(eventData.location.lat).toBe(30.0444);
  });

  it('should use logFromRequest helper method', async () => {
    const mockReq = {
      user: { id: 999 },
      ip: '127.0.0.1',
      get: (header) => header === 'user-agent' ? 'TestAgent/1.0' : null
    };

    await AuditLogger.logFromRequest(mockReq, 'DRUG_INTERACTION_CHECK', {
      medications: ['Aspirin', 'Warfarin']
    });

    const [rows] = await pool.execute(
      'SELECT * FROM audit_logs WHERE user_id = ? AND event_type = ?',
      [999, 'DRUG_INTERACTION_CHECK']
    );

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].ip_address).toBe('127.0.0.1');
    expect(rows[0].user_agent).toBe('TestAgent/1.0');
    
    const eventData = JSON.parse(rows[0].event_data);
    expect(eventData.medications).toEqual(['Aspirin', 'Warfarin']);
  });
});
