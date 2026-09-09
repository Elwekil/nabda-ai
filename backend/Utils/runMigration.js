const { pool } = require('../Config/db');
const fs = require('fs');
const path = require('path');

async function runMigration(migrationFile) {
  try {
    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.execute(statement);
        console.log('✅ Executed:', statement.substring(0, 50) + '...');
      }
    }
    
    console.log(`✅ Migration ${migrationFile} completed successfully`);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrationFile = process.argv[2] || 'add_audit_logs_table.sql';
  runMigration(migrationFile);
}

module.exports = runMigration;
