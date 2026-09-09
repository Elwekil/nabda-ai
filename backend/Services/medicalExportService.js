const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { pool } = require('../Config/db');
const { sendOTPEmail } = require('../Utils/emailService');
const nodemailer = require('nodemailer');

/**
 * Fetch complete medical file for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Complete medical file data
 */
async function fetchCompleteMedicalFile(userId) {
    const connection = await pool.getConnection();
    
    try {
        // Fetch personal info
        const [users] = await connection.query(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            throw new Error('User not found');
        }
        
        const personalInfo = users[0];
        
        // Fetch medications
        const [medications] = await connection.query(
            'SELECT * FROM medications WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        
        // Fetch appointments
        const [appointments] = await connection.query(
            'SELECT * FROM appointments WHERE user_id = ? ORDER BY appointment_date DESC LIMIT 10',
            [userId]
        );
        
        // Fetch vitals
        const [vitals] = await connection.query(
            'SELECT * FROM vitals WHERE user_id = ? ORDER BY recorded_date DESC, recorded_time DESC LIMIT 10',
            [userId]
        );
        
        // Fetch documents
        const [documents] = await connection.query(
            'SELECT * FROM medical_documents WHERE user_id = ? ORDER BY upload_date DESC LIMIT 10',
            [userId]
        );
        
        return {
            personalInfo,
            medications,
            appointments,
            vitals,
            documents,
            chronicConditions: personalInfo.chronic_conditions ? personalInfo.chronic_conditions.split(',').map(c => c.trim()) : [],
            allergies: personalInfo.allergies ? personalInfo.allergies.split(',').map(a => a.trim()) : [],
            emergencyContacts: [
                {
                    name: personalInfo.emergency_contact_name,
                    phone: personalInfo.emergency_contact_phone,
                    relationship: 'طوارئ'
                }
            ].filter(c => c.name && c.phone)
        };
    } finally {
        connection.release();
    }
}

/**
 * Fetch chat session by session ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object|null>} Chat session data or null
 */
async function fetchChatSession(sessionId) {
    const connection = await pool.getConnection();
    
    try {
        // Check if table exists
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'ai_chat_sessions'"
        );
        
        if (tables.length === 0) {
            console.warn('ai_chat_sessions table does not exist');
            return null;
        }
        
        const [sessions] = await connection.query(
            'SELECT * FROM ai_chat_sessions WHERE session_id = ?',
            [sessionId]
        );
        
        if (sessions.length === 0) {
            return null;
        }
        
        const session = sessions[0];
        
        // Parse JSON fields
        return {
            ...session,
            messages: JSON.parse(session.messages || '[]'),
            medicalContext: JSON.parse(session.medical_context || '{}'),
            diagnosisResult: session.diagnosis_result ? JSON.parse(session.diagnosis_result) : null
        };
    } catch (error) {
        console.error('Error fetching chat session:', error);
        return null;
    } finally {
        connection.release();
    }
}

/**
 * Send email with PDF attachment
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Email result
 */
async function sendEmailWithAttachment(options) {
    const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    
    try {
        await transporter.sendMail({
            from: `"Health Sync" <${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.body,
            attachments: [
                {
                    filename: path.basename(options.attachment),
                    path: options.attachment
                }
            ]
        });
        
        return { success: true };
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Build email body for medical file export
 * @param {string} fullName - User's full name
 * @returns {string} HTML email body
 */
function buildEmailBody(fullName) {
    return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; border-radius: 12px; text-align: center;">
            <h1 style="color: white; margin: 0;">🏥 Health Sync</h1>
            <p style="color: #bfdbfe; margin: 8px 0 0;">الملف الطبي الكامل</p>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; margin-top: 20px;">
            <h2 style="color: #1d4ed8;">مرحباً ${fullName}</h2>
            <p style="color: #6b7280;">تجد مرفقاً ملفك الطبي الكامل بصيغة PDF.</p>
            <p style="color: #6b7280;">يحتوي الملف على:</p>
            <ul style="color: #6b7280;">
                <li>المعلومات الشخصية</li>
                <li>التاريخ الطبي</li>
                <li>الأدوية الحالية</li>
                <li>العلامات الحيوية</li>
                <li>المواعيد الطبية</li>
                <li>المستندات الطبية</li>
                <li>جهات الاتصال الطارئة</li>
            </ul>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
                ⚠️ هذا الملف سري ومخصص للاستخدام الطبي فقط. يرجى الاحتفاظ به في مكان آمن.
            </p>
        </div>
    </div>
    `;
}

/**
 * Save export record to database
 * @param {Object} record - Export record data
 * @returns {Promise<void>}
 */
async function saveExportRecord(record) {
    const connection = await pool.getConnection();
    
    try {
        // Check if table exists, if not skip saving
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'medical_file_exports'"
        );
        
        if (tables.length === 0) {
            console.warn('medical_file_exports table does not exist, skipping export record');
            return;
        }
        
        await connection.query(
            `INSERT INTO medical_file_exports 
            (user_id, session_id, email, pdf_path, file_size, status) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                record.userId,
                record.sessionId || null,
                record.email,
                record.pdfPath,
                record.fileSize,
                record.status
            ]
        );
    } catch (error) {
        console.error('Error saving export record:', error);
        // Don't throw error, just log it
    } finally {
        connection.release();
    }
}

/**
 * Update chat session export status
 * @param {string} sessionId - Session ID
 * @param {Object} updates - Update data
 * @returns {Promise<void>}
 */
async function updateChatSession(sessionId, updates) {
    const connection = await pool.getConnection();
    
    try {
        // Check if table exists, if not skip updating
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'ai_chat_sessions'"
        );
        
        if (tables.length === 0) {
            console.warn('ai_chat_sessions table does not exist, skipping session update');
            return;
        }
        
        await connection.query(
            'UPDATE ai_chat_sessions SET exported = ?, exported_at = ? WHERE session_id = ?',
            [updates.exported, updates.exportedAt, sessionId]
        );
    } catch (error) {
        console.error('Error updating chat session:', error);
        // Don't throw error, just log it
    } finally {
        connection.release();
    }
}

/**
 * Export complete medical file to PDF and send via email
 * @param {number} userId - User ID
 * @param {string} email - Email address to send PDF
 * @param {string} [sessionId] - Optional chat session ID
 * @returns {Promise<Object>} Export result
 */
async function exportMedicalFileToPDF(userId, email, sessionId) {
    // Validate inputs
    if (!userId || !email) {
        throw new Error('userId and email are required');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }
    
    // Step 1: Fetch complete medical data
    const medicalFile = await fetchCompleteMedicalFile(userId);
    
    if (!medicalFile) {
        throw new Error('Medical file not found');
    }
    
    // Step 2: Fetch chat session if provided
    let chatSession = null;
    if (sessionId) {
        chatSession = await fetchChatSession(sessionId);
    }
    
    // Step 3: Generate PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    // Ensure exports directory exists
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    // Step 4: Save PDF to file system
    const timestamp = Date.now();
    const fileName = `medical_file_${userId}_${timestamp}.pdf`;
    const pdfPath = path.join(exportsDir, fileName);
    
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);
    
    // Register Arabic font (using built-in font for now)
    // Note: For proper Arabic support, you would need to register an Arabic font
    
    // Add header
    doc.fontSize(20).text('Health Sync - Complete Medical File', { align: 'center' });
    doc.fontSize(14).text(medicalFile.personalInfo.full_name || 'N/A', { align: 'center' });
    doc.fontSize(10).text(new Date().toLocaleDateString('ar-EG'), { align: 'center' });
    doc.moveDown(2);
    
    // Add personal information section
    doc.fontSize(16).text('Personal Information', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Name: ${medicalFile.personalInfo.full_name || 'N/A'}`);
    doc.text(`Age: ${medicalFile.personalInfo.age || 'N/A'}`);
    doc.text(`Blood Type: ${medicalFile.personalInfo.blood_type || 'N/A'}`);
    doc.text(`Phone: ${medicalFile.personalInfo.phone || 'N/A'}`);
    doc.text(`Email: ${medicalFile.personalInfo.email || 'N/A'}`);
    doc.text(`City: ${medicalFile.personalInfo.city || 'N/A'}`);
    doc.moveDown(1);
    
    // Add medical history section
    doc.fontSize(16).text('Medical History', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Chronic Conditions: ${medicalFile.chronicConditions.join(', ') || 'None'}`);
    doc.text(`Allergies: ${medicalFile.allergies.join(', ') || 'None'}`);
    doc.text(`Family Doctor: ${medicalFile.personalInfo.family_doctor_name || 'N/A'}`);
    doc.text(`Family Doctor Phone: ${medicalFile.personalInfo.family_doctor_phone || 'N/A'}`);
    doc.moveDown(1);
    
    // Add medications section
    doc.fontSize(16).text(`Current Medications (${medicalFile.medications.length})`, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    
    if (medicalFile.medications.length > 0) {
        medicalFile.medications.forEach((med, index) => {
            doc.text(`${index + 1}. ${med.name}`);
            doc.text(`   Dosage: ${med.dosage || 'N/A'}`);
            doc.text(`   Frequency: ${med.frequency || 'N/A'}`);
            doc.text(`   Status: ${med.status}`);
            if (med.notes) {
                doc.text(`   Notes: ${med.notes}`);
            }
            doc.moveDown(0.5);
        });
    } else {
        doc.text('No medications recorded');
    }
    doc.moveDown(1);
    
    // Add vitals section
    doc.fontSize(16).text('Recent Vital Signs', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    
    if (medicalFile.vitals.length > 0) {
        medicalFile.vitals.forEach((vital, index) => {
            doc.text(`${index + 1}. Date: ${vital.recorded_date} ${vital.recorded_time || ''}`);
            if (vital.blood_sugar) doc.text(`   Blood Sugar: ${vital.blood_sugar} mg/dL`);
            if (vital.blood_pressure_systolic && vital.blood_pressure_diastolic) {
                doc.text(`   Blood Pressure: ${vital.blood_pressure_systolic}/${vital.blood_pressure_diastolic} mmHg`);
            }
            if (vital.heart_rate) doc.text(`   Heart Rate: ${vital.heart_rate} bpm`);
            if (vital.temperature) doc.text(`   Temperature: ${vital.temperature} °C`);
            if (vital.weight) doc.text(`   Weight: ${vital.weight} kg`);
            doc.moveDown(0.5);
        });
    } else {
        doc.text('No vital signs recorded');
    }
    doc.moveDown(1);
    
    // Add appointments section
    doc.fontSize(16).text('Medical Appointments', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    
    if (medicalFile.appointments.length > 0) {
        medicalFile.appointments.forEach((appt, index) => {
            doc.text(`${index + 1}. Doctor: ${appt.doctor_name}`);
            doc.text(`   Specialty: ${appt.doctor_specialty || 'N/A'}`);
            doc.text(`   Date: ${appt.appointment_date} ${appt.appointment_time || ''}`);
            doc.text(`   Status: ${appt.status}`);
            if (appt.clinic_name) doc.text(`   Clinic: ${appt.clinic_name}`);
            doc.moveDown(0.5);
        });
    } else {
        doc.text('No appointments recorded');
    }
    doc.moveDown(1);
    
    // Add documents section
    doc.fontSize(16).text('Medical Documents', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    
    if (medicalFile.documents.length > 0) {
        medicalFile.documents.forEach((document, index) => {
            doc.text(`${index + 1}. ${document.file_name}`);
            doc.text(`   Type: ${document.document_type || 'N/A'}`);
            doc.text(`   Upload Date: ${document.upload_date}`);
            if (document.ai_analysis) {
                doc.text(`   AI Analysis: ${document.ai_analysis.substring(0, 200)}...`);
            }
            doc.moveDown(0.5);
        });
    } else {
        doc.text('No documents uploaded');
    }
    doc.moveDown(1);
    
    // Add AI diagnosis if available
    if (chatSession && chatSession.diagnosisResult) {
        doc.addPage();
        doc.fontSize(16).text('AI Diagnosis', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        
        const diagnosis = chatSession.diagnosisResult;
        
        if (diagnosis.possibleConditions && diagnosis.possibleConditions.length > 0) {
            doc.text('Possible Conditions:');
            diagnosis.possibleConditions.forEach((condition, index) => {
                doc.text(`${index + 1}. ${condition.name} (${condition.probability}%)`);
                doc.text(`   ${condition.description}`);
                doc.moveDown(0.3);
            });
        }
        
        if (diagnosis.recommendedTreatments && diagnosis.recommendedTreatments.length > 0) {
            doc.moveDown(0.5);
            doc.text('Recommended Treatments:');
            diagnosis.recommendedTreatments.forEach((treatment, index) => {
                doc.text(`${index + 1}. ${treatment.name}`);
                doc.text(`   ${treatment.description}`);
                doc.moveDown(0.3);
            });
        }
        
        doc.moveDown(1);
    }
    
    // Add emergency contacts section
    doc.fontSize(16).text('Emergency Contacts', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    
    if (medicalFile.emergencyContacts.length > 0) {
        medicalFile.emergencyContacts.forEach((contact, index) => {
            doc.text(`${index + 1}. ${contact.name}`);
            doc.text(`   Phone: ${contact.phone}`);
            doc.text(`   Relationship: ${contact.relationship}`);
            doc.moveDown(0.5);
        });
    } else {
        doc.text('No emergency contacts configured');
    }
    doc.moveDown(2);
    
    // Add footer
    doc.fontSize(10).text('Generated by Health Sync', { align: 'center' });
    doc.fontSize(9).text('This report is for informational purposes only and does not replace professional medical advice.', 
        { align: 'center', color: 'gray' });
    
    // Finalize PDF
    doc.end();
    
    // Wait for PDF to be written
    await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
    
    // Get file size
    const stats = fs.statSync(pdfPath);
    const fileSize = stats.size;
    
    // Step 5: Send email with PDF attachment
    const emailResult = await sendEmailWithAttachment({
        to: email,
        subject: 'ملفك الطبي الكامل - Health Sync',
        body: buildEmailBody(medicalFile.personalInfo.full_name),
        attachment: pdfPath
    });
    
    // Step 6: Save export record
    await saveExportRecord({
        userId: userId,
        sessionId: sessionId,
        email: email,
        pdfPath: pdfPath,
        fileSize: fileSize,
        status: emailResult.success ? 'sent' : 'failed'
    });
    
    // Step 7: Update chat session if provided
    if (sessionId) {
        await updateChatSession(sessionId, { 
            exported: true, 
            exportedAt: new Date() 
        });
    }
    
    // Return result (pdfPath returned even if email fails)
    const result = {
        success: true,
        emailSent: emailResult.success,
        pdfPath: pdfPath,
        timestamp: new Date()
    };
    
    return result;
}

module.exports = {
    exportMedicalFileToPDF,
    fetchCompleteMedicalFile,
    fetchChatSession
};
