const AuditLogger = require('./auditLogger');
const { pool } = require('../Config/db');

async function testAuditLogger() {
  try {
    console.log('🧪 Testing AuditLogger...\n');

    // Test 1: Log a simple event
    console.log('Test 1: Logging IMAGE_ANALYSIS event...');
    await AuditLogger.log({
      userId: 1,
      type: 'IMAGE_ANALYSIS',
      data: { documentId: 123, imageType: 'lab_report' },
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    });

    // Test 2: Log SOS event
    console.log('Test 2: Logging SOS_TRIGGERED event...');
    await AuditLogger.log({
      userId: 1,
      type: 'SOS_TRIGGERED',
      data: { location: { lat: 30.0444, lng: 31.2357 } },
      ipAddress: '10.0.0.1'
    });

    // Test 3: Log with minimal data
    console.log('Test 3: Logging DRUG_INTERACTION_CHECK event...');
    await AuditLogger.log({
      userId: 1,
      type: 'DRUG_INTERACTION_CHECK',
      data: { medications: ['Aspirin', 'Warfarin'], severity: 'critical' }
    });

    // Test 4: Test logFromRequest helper
    console.log('Test 4: Testing logFromRequest helper...');
    const mockReq = {
      user: { id: 1 },
      ip: '127.0.0.1',
      get: (header) => header === 'user-agent' ? 'TestAgent/1.0' : null
    };
    await AuditLogger.logFromRequest(mockReq, 'MEDICAL_FILE_EXPORT', { format: 'PDF' });

    // Verify logs were created
    console.log('\n📊 Verifying logs in database...');
    const [rows] = await pool.execute(
      'SELECT * FROM audit_logs WHERE user_id = 1 ORDER BY timestamp DESC LIMIT 4'
    );

    console.log(`\n✅ Found ${rows.length} audit log entries:`);
    rows.forEach((row, index) => {
      console.log(`\n${index + 1}. Event Type: ${row.event_type}`);
      console.log(`   User ID: ${row.user_id}`);
      console.log(`   IP Address: ${row.ip_address || 'N/A'}`);
      console.log(`   User Agent: ${row.user_agent || 'N/A'}`);
      console.log(`   Event Data: ${row.event_data}`);
      console.log(`   Timestamp: ${row.timestamp}`);
    });

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

testAuditLogger();
