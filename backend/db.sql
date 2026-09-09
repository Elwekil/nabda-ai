-- =============================================
-- قاعدة بيانات نظام إدارة الصحة الشخصي
-- =============================================

CREATE DATABASE IF NOT EXISTS health_sync;
USE health_sync;

-- =============================================
-- جدول المستخدمين (users)
-- 
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    age INT,
    city VARCHAR(100),
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    chronic_conditions TEXT,
    allergies TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    family_doctor_name VARCHAR(255),
    family_doctor_phone VARCHAR(20),
    profile_image VARCHAR(500),
    google_id VARCHAR(255),
    auth_provider ENUM('local', 'google') DEFAULT 'local',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_is_verified (is_verified)
);

-- =============================================
-- جدول رموز OTP
-- =============================================
CREATE TABLE IF NOT EXISTS otp_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_otp_code (otp_code),
    INDEX idx_expires_at (expires_at)
);

-- =============================================
-- جدول إعادة تعيين كلمة المرور
-- =============================================
CREATE TABLE IF NOT EXISTS password_resets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    reset_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_email (email),
    INDEX idx_email (email),
    INDEX idx_reset_code (reset_code)
);

-- =============================================
-- جدول الأدوية
-- =============================================
CREATE TABLE IF NOT EXISTS medications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    time_of_day TIME,
    start_date DATE,
    end_date DATE,
    status ENUM('active', 'completed', 'paused') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_time_of_day (time_of_day)
);

-- =============================================
-- جدول المواعيد
-- =============================================
CREATE TABLE IF NOT EXISTS appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    doctor_specialty VARCHAR(255),
    clinic_name VARCHAR(255),
    clinic_address TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME,
    notes TEXT,
    status ENUM('upcoming', 'completed', 'cancelled') DEFAULT 'upcoming',
    notified_24h BOOLEAN DEFAULT FALSE,
    notified_1h BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status)
);

-- =============================================
-- جدول العلامات الحيوية
-- =============================================
CREATE TABLE IF NOT EXISTS vitals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    blood_sugar DECIMAL(6,2),
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    heart_rate INT,
    temperature DECIMAL(4,1),
    pain_level INT,
    weight DECIMAL(6,2),
    height DECIMAL(5,2),
    notes TEXT,
    recorded_date DATE NOT NULL,
    recorded_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_recorded_date (recorded_date),
    INDEX idx_recorded_date_time (recorded_date, recorded_time)
);

-- =============================================
-- جدول المستندات الطبية
-- =============================================
CREATE TABLE IF NOT EXISTS medical_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INT,
    document_type VARCHAR(50) DEFAULT 'other',
    upload_date DATE NOT NULL,
    ai_analysis TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_document_type (document_type),
    INDEX idx_upload_date (upload_date)
);

-- =============================================
-- جدول أحداث SOS
-- =============================================
CREATE TABLE IF NOT EXISTS sos_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    location_lat DECIMAL(10,7),
    location_lng DECIMAL(10,7),
    location_address VARCHAR(500),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);



CREATE TABLE IF NOT EXISTS sos_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    location_lat DECIMAL(10,7),
    location_lng DECIMAL(10,7),
    location_address VARCHAR(500),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- =============================================
-- فهارس إضافية لتحسين الأداء
-- =============================================
CREATE INDEX idx_medications_user_status ON medications(user_id, status);
CREATE INDEX idx_appointments_user_date ON appointments(user_id, appointment_date);
CREATE INDEX idx_vitals_user_date ON vitals(user_id, recorded_date);
CREATE INDEX idx_documents_user_date ON medical_documents(user_id, upload_date);

-- عرض جميع الجداول
SHOW TABLES;