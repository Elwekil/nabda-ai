/**
 * Migration script for Medical AI Enhancements
 * Creates all new tables required for AI features
 * Run with: node Backend/Utils/migrateAI.js
 */
const { pool } = require('../Config/db');
require('dotenv').config();

const tables = [
  {
    name: 'medical_image_analysis',
    sql: `
      CREATE TABLE IF NOT EXISTS medical_image_analysis (
        id INT PRIMARY KEY AUTO_INCREMENT,
        document_id INT NOT NULL,
        user_id INT NOT NULL,
        image_type ENUM('lab_report', 'xray', 'prescription', 'medical_report', 'unknown'),
        extracted_text TEXT,
        extracted_values JSON,
        analysis TEXT,
        treatment_suggestions JSON,
        confidence DECIMAL(5,2),
        warnings JSON,
        analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES medical_documents(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_document (user_id, document_id)
      )
    `
  },
  {
    name: 'sos_emergency_logs',
    sql: `
      CREATE TABLE IF NOT EXISTS sos_emergency_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        emergency_id VARCHAR(36) UNIQUE NOT NULL,
        location_latitude DECIMAL(10, 8),
        location_longitude DECIMAL(11, 8),
        location_accuracy DECIMAL(10, 2),
        medical_file_snapshot JSON NOT NULL,
        contacts_notified JSON NOT NULL,
        notification_status JSON NOT NULL,
        triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        status ENUM('active', 'resolved', 'cancelled') DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_status (user_id, status),
        INDEX idx_emergency_id (emergency_id)
      )
    `
  },
  {
    name: 'drug_interactions',
    sql: `
      CREATE TABLE IF NOT EXISTS drug_interactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        drug1_name VARCHAR(255) NOT NULL,
        drug2_name VARCHAR(255) NOT NULL,
        interaction_type VARCHAR(100),
        severity ENUM('mild', 'moderate', 'severe', 'critical') NOT NULL,
        description TEXT NOT NULL,
        effects JSON,
        mechanism TEXT,
        recommendation TEXT NOT NULL,
        evidence VARCHAR(50),
        reference_links JSON,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_drug_pair (drug1_name, drug2_name),
        INDEX idx_severity (severity),
        UNIQUE KEY unique_interaction (drug1_name, drug2_name)
      )
    `
  },
  {
    name: 'drug_alternatives',
    sql: `
      CREATE TABLE IF NOT EXISTS drug_alternatives (
        id INT PRIMARY KEY AUTO_INCREMENT,
        original_drug VARCHAR(255) NOT NULL,
        alternative_drug VARCHAR(255) NOT NULL,
        reason TEXT,
        effectiveness_percentage INT,
        side_effects JSON,
        INDEX idx_original (original_drug)
      )
    `
  },
  {
    name: 'ai_chat_sessions',
    sql: `
      CREATE TABLE IF NOT EXISTS ai_chat_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        session_id VARCHAR(36) UNIQUE NOT NULL,
        messages JSON NOT NULL,
        medical_context JSON NOT NULL,
        diagnosis_result JSON,
        exported BOOLEAN DEFAULT FALSE,
        exported_at TIMESTAMP NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL,
        status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_session (user_id, session_id),
        INDEX idx_status (status)
      )
    `
  },
  {
    name: 'medical_file_exports',
    sql: `
      CREATE TABLE IF NOT EXISTS medical_file_exports (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        session_id VARCHAR(36),
        email VARCHAR(255) NOT NULL,
        pdf_path VARCHAR(500),
        file_size INT,
        exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_exports (user_id, exported_at)
      )
    `
  },
  {
    name: 'audit_logs',
    sql: `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        event_type VARCHAR(100) NOT NULL,
        event_data JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_event (user_id, event_type),
        INDEX idx_created_at (created_at)
      )
    `
  }
];

async function migrate() {
  let hasError = false;

  for (const table of tables) {
    try {
      await pool.execute(table.sql);
      console.log(`✅ Table created (or already exists): ${table.name}`);
    } catch (err) {
      console.error(`❌ Failed to create table ${table.name}:`, err.message);
      hasError = true;
    }
  }

  if (hasError) {
    console.error('\n⚠️  Migration completed with errors.');
    process.exit(1);
  } else {
    console.log('\n✅ All AI tables migrated successfully.');
    process.exit(0);
  }
}

migrate();
