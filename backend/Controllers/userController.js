const { pool } = require('../Config/db');
const ResponseFormatter = require('../Utils/responseFormatter');
const path = require('path');
const fs = require('fs');

const getProfile = async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT id, full_name, email, phone, age, city, blood_type, chronic_conditions, allergies, 
                    emergency_contact_name, emergency_contact_phone, family_doctor_name, family_doctor_phone,
                    profile_image, created_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );
        if (users.length === 0) return ResponseFormatter.notFound(res, 'User');
        return ResponseFormatter.success(res, users[0], 'Profile retrieved successfully');
    } catch (error) {
        console.error('Get profile error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve profile', 500);
    }
};

const updateProfile = async (req, res) => {
    try {
        const { full_name, phone, age, city, blood_type, chronic_conditions, allergies,
                emergency_contact_name, emergency_contact_phone, family_doctor_name, family_doctor_phone } = req.body;

        const updates = [];
        const values = [];

        if (full_name)               { updates.push('full_name = ?');               values.push(full_name); }
        if (phone)                   { updates.push('phone = ?');                   values.push(phone); }
        if (age)                     { updates.push('age = ?');                     values.push(age); }
        if (city)                    { updates.push('city = ?');                    values.push(city); }
        if (blood_type)              { updates.push('blood_type = ?');              values.push(blood_type); }
        if (chronic_conditions)      { updates.push('chronic_conditions = ?');      values.push(chronic_conditions); }
        if (allergies)               { updates.push('allergies = ?');               values.push(allergies); }
        if (emergency_contact_name)  { updates.push('emergency_contact_name = ?');  values.push(emergency_contact_name); }
        if (emergency_contact_phone) { updates.push('emergency_contact_phone = ?'); values.push(emergency_contact_phone); }
        if (family_doctor_name)      { updates.push('family_doctor_name = ?');      values.push(family_doctor_name); }
        if (family_doctor_phone)     { updates.push('family_doctor_phone = ?');     values.push(family_doctor_phone); }

        if (updates.length === 0) return ResponseFormatter.badRequest(res, 'No fields to update');

        values.push(req.user.id);
        await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        const [updated] = await pool.execute(
            'SELECT id, full_name, email, phone, age, city, blood_type, profile_image FROM users WHERE id = ?',
            [req.user.id]
        );
        return ResponseFormatter.success(res, updated[0], 'Profile updated successfully');
    } catch (error) {
        console.error('Update profile error:', error);
        return ResponseFormatter.error(res, 'Failed to update profile', 500);
    }
};

const uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) return ResponseFormatter.validationError(res, { file: 'Image is required' });

        // Delete old image if exists
        const [rows] = await pool.execute('SELECT profile_image FROM users WHERE id = ?', [req.user.id]);
        if (rows[0]?.profile_image) {
            const oldPath = path.join(__dirname, '..', rows[0].profile_image);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        const imagePath = `/uploads/profiles/${req.file.filename}`;
        await pool.execute('UPDATE users SET profile_image = ? WHERE id = ?', [imagePath, req.user.id]);

        return ResponseFormatter.success(res, { profile_image: imagePath }, 'Profile image updated successfully');
    } catch (error) {
        console.error('Upload profile image error:', error);
        return ResponseFormatter.error(res, 'Failed to upload profile image', 500);
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const [medications] = await pool.execute(
            'SELECT COUNT(*) as count FROM medications WHERE user_id = ? AND status = "active"', [req.user.id]);
        const [appointments] = await pool.execute(
            'SELECT COUNT(*) as count FROM appointments WHERE user_id = ? AND status = "upcoming" AND appointment_date >= CURDATE()', [req.user.id]);
        const [documents] = await pool.execute(
            'SELECT COUNT(*) as count FROM medical_documents WHERE user_id = ? AND upload_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)', [req.user.id]);
        const [vitals] = await pool.execute(
            `SELECT blood_sugar, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, recorded_date
             FROM vitals WHERE user_id = ? ORDER BY recorded_date DESC, recorded_time DESC LIMIT 1`, [req.user.id]);

        return ResponseFormatter.success(res, {
            activeMedications: medications[0].count,
            upcomingAppointments: appointments[0].count,
            recentDocuments: documents[0].count,
            latestVitals: vitals[0] || null
        }, 'Dashboard statistics retrieved successfully');
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve dashboard statistics', 500);
    }
};

const getHealthReport = async (req, res) => {
    try {
        const userId = req.user.id;

        const [profileRows] = await pool.execute(
            `SELECT full_name, age, blood_type, chronic_conditions, allergies FROM users WHERE id = ?`,
            [userId]
        );
        const profile = profileRows[0] || {};

        const [vitalsStats] = await pool.execute(
            `SELECT AVG(blood_sugar) as avg_blood_sugar,
                    AVG(blood_pressure_systolic) as avg_blood_pressure_systolic,
                    AVG(blood_pressure_diastolic) as avg_blood_pressure_diastolic,
                    AVG(heart_rate) as avg_heart_rate,
                    COUNT(*) as total_readings
             FROM vitals WHERE user_id = ? AND recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
            [userId]
        );

        const [medications] = await pool.execute(
            `SELECT name, dosage, frequency FROM medications WHERE user_id = ? AND status = 'active'`,
            [userId]
        );

        const [apptStats] = await pool.execute(
            `SELECT COUNT(*) as total,
                    SUM(CASE WHEN status='upcoming' AND appointment_date >= CURDATE() THEN 1 ELSE 0 END) as upcoming,
                    SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed
             FROM appointments WHERE user_id = ?`,
            [userId]
        );

        const [docCount] = await pool.execute(
            `SELECT COUNT(*) as count FROM medical_documents WHERE user_id = ?`,
            [userId]
        );

        const { generateHealthReport } = require('../Utils/healthAnalysis');
        const report = await generateHealthReport({
            profile,
            vitalsStats: vitalsStats[0],
            medications,
            appointments: apptStats[0],
            documents: docCount[0].count
        });

        return ResponseFormatter.success(res, report, 'تم توليد التقرير الصحي بنجاح');
    } catch (error) {
        console.error('Health report error:', error);
        return ResponseFormatter.error(res, 'فشل في توليد التقرير الصحي', 500);
    }
};

// @desc    Export medical file to PDF and send via email
// @route   POST /api/users/export-medical-file
// @access  Private
const exportMedicalFile = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return ResponseFormatter.badRequest(res, 'البريد الإلكتروني مطلوب');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return ResponseFormatter.badRequest(res, 'صيغة البريد الإلكتروني غير صحيحة');
        }

        // Import the export service
        const { exportMedicalFileToPDF } = require('../Services/medicalExportService');

        // Export and send
        const result = await exportMedicalFileToPDF(req.user.id, email);

        if (result.success) {
            return ResponseFormatter.success(res, {
                sent: true,
                email: email,
                fileSize: result.fileSize
            }, 'تم إرسال الملف الطبي بنجاح إلى البريد الإلكتروني');
        } else {
            return ResponseFormatter.error(res, 'فشل في إرسال الملف الطبي: ' + result.error, 500);
        }
    } catch (error) {
        console.error('Export medical file error:', error);
        return ResponseFormatter.error(res, 'فشل في تصدير الملف الطبي', 500);
    }
};

module.exports = { getProfile, updateProfile, uploadProfileImage, getDashboardStats, getHealthReport, exportMedicalFile };
