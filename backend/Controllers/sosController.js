const { pool } = require('../Config/db');
const ResponseFormatter = require('../Utils/responseFormatter');
const { triggerSOSEmergency } = require('../Services/sosService');

// Inline audit logger — writes to audit_logs table (created by migrateAI.js)
async function logAuditEvent(userId, eventType, eventData, req) {
    try {
        await pool.execute(
            `INSERT INTO audit_logs (user_id, event_type, event_data, ip_address, user_agent, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
                userId,
                eventType,
                JSON.stringify(eventData || {}),
                (req && req.ip) || null,
                (req && req.headers && req.headers['user-agent']) || null,
            ]
        );
    } catch (err) {
        // Non-fatal — log to console but don't block the response
        console.error('Audit log failed:', err.message);
    }
}

// @desc    Trigger SOS - get full medical profile + notify emergency contact
// @route   POST /api/sos
// @access  Private
const triggerSOS = async (req, res) => {
    try {
        const userId = req.user.id;
        const { location } = req.body; // { lat, lng, address } optional

        // Get full user medical profile
        const [users] = await pool.execute(
            `SELECT full_name, phone, age, blood_type, chronic_conditions, allergies,
                    emergency_contact_name, emergency_contact_phone,
                    family_doctor_name, family_doctor_phone
             FROM users WHERE id = ?`,
            [userId]
        );
        if (users.length === 0) return ResponseFormatter.notFound(res, 'User');
        const profile = users[0];

        // Get active medications
        const [medications] = await pool.execute(
            `SELECT name, dosage, frequency FROM medications 
             WHERE user_id = ? AND status = 'active'`,
            [userId]
        );

        // Get latest vitals
        const [vitals] = await pool.execute(
            `SELECT blood_sugar, blood_pressure_systolic, blood_pressure_diastolic, 
                    heart_rate, temperature, recorded_date
             FROM vitals WHERE user_id = ? 
             ORDER BY recorded_date DESC, recorded_time DESC LIMIT 1`,
            [userId]
        );

        // Get upcoming appointments
        const [appointments] = await pool.execute(
            `SELECT doctor_name, doctor_specialty, appointment_date, appointment_time
             FROM appointments 
             WHERE user_id = ? AND status = 'upcoming' AND appointment_date >= CURDATE()
             ORDER BY appointment_date ASC LIMIT 3`,
            [userId]
        );

        // Build the medical summary message
        const timestamp = new Date().toLocaleString('ar-EG');
        const locationText = location?.address
            ? `📍 الموقع: ${location.address}`
            : location?.lat
            ? `📍 الإحداثيات: ${location.lat}, ${location.lng}`
            : '📍 الموقع: غير محدد';

        const medicationsText = medications.length > 0
            ? medications.map(m => `• ${m.name} - ${m.dosage} (${m.frequency})`).join('\n')
            : 'لا توجد أدوية نشطة';

        const vitalsText = vitals.length > 0
            ? `سكر الدم: ${vitals[0].blood_sugar || '-'} | ضغط: ${vitals[0].blood_pressure_systolic || '-'}/${vitals[0].blood_pressure_diastolic || '-'} | قلب: ${vitals[0].heart_rate || '-'} bpm`
            : 'لا توجد قراءات';

        const sosMessage = `🚨 طلب مساعدة طارئة - ${timestamp}

👤 المريض: ${profile.full_name}
📞 هاتف: ${profile.phone || 'غير محدد'}
🎂 العمر: ${profile.age || 'غير محدد'}
🩸 فصيلة الدم: ${profile.blood_type || 'غير محددة'}
${locationText}

🏥 المعلومات الطبية:
• الأمراض المزمنة: ${profile.chronic_conditions || 'لا يوجد'}
• الحساسية: ${profile.allergies || 'لا يوجد'}

💊 الأدوية النشطة:
${medicationsText}

📊 آخر قراءات حيوية:
${vitalsText}

👨‍⚕️ الطبيب المعالج: ${profile.family_doctor_name || 'غير محدد'} - ${profile.family_doctor_phone || ''}`;

        // Log SOS event in DB (optional - if table exists)
        try {
            await pool.execute(
                `INSERT INTO sos_events (user_id, location_lat, location_lng, location_address, message, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [userId, location?.lat || null, location?.lng || null, location?.address || null, sosMessage]
            );
        } catch (dbErr) {
            // Table might not exist yet, continue anyway
            console.warn('SOS log table not found, skipping log:', dbErr.message);
        }

        return ResponseFormatter.success(res, {
            message: sosMessage,
            emergencyContact: {
                name: profile.emergency_contact_name || null,
                phone: profile.emergency_contact_phone || null
            },
            familyDoctor: {
                name: profile.family_doctor_name || null,
                phone: profile.family_doctor_phone || null
            },
            medicalProfile: {
                bloodType: profile.blood_type,
                chronicConditions: profile.chronic_conditions,
                allergies: profile.allergies,
                activeMedications: medications,
                latestVitals: vitals[0] || null,
                upcomingAppointments: appointments
            }
        }, 'تم إرسال إشارة الاستغاثة');
    } catch (error) {
        console.error('SOS trigger error:', error);
        return ResponseFormatter.error(res, 'فشل في إرسال إشارة الاستغاثة', 500);
    }
};

// @desc    Trigger SOS emergency — notify all emergency contacts with medical snapshot
// @route   POST /api/sos/emergency
// @access  Private
const triggerEmergency = async (req, res) => {
    try {
        const userId = req.user.id;
        const location = req.body.location ?? null;

        const result = await triggerSOSEmergency(userId, location);

        await logAuditEvent(userId, 'SOS_TRIGGERED', {
            emergencyId: result.emergencyId,
            contactsNotified: result.contactsNotified,
            hasLocation: location !== null,
        }, req);

        return ResponseFormatter.success(res, {
            emergencyId: result.emergencyId,
            contactsNotified: result.contactsNotified,
            timestamp: result.timestamp,
        }, 'تم إرسال إشارة الطوارئ بنجاح');
    } catch (error) {
        console.error('Trigger emergency error:', error);
        if (error.message === 'No emergency contacts configured') {
            return ResponseFormatter.badRequest(res, 'لا توجد جهات اتصال طارئة مضافة');
        }
        return ResponseFormatter.error(res, 'فشل في إرسال إشارة الطوارئ', 500);
    }
};

module.exports = { triggerSOS, triggerEmergency };
