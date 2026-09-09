/**
 * SOS Emergency Service
 * Handles emergency triggering, medical file fetching, and contact notification
 */
const { pool } = require('../Config/db');
const { sendMedicalReportEmail } = require('../Utils/emailService');
const { formatLocation } = require('../Utils/geolocationService');

/**
 * Fetch complete medical file for a user
 * Joins users, medications, appointments, vitals, documents, emergency_contacts
 */
const fetchCompleteMedicalFile = async (userId) => {
    // Personal info
    const [users] = await pool.execute(
        `SELECT id, full_name, phone, age, blood_type, city,
                chronic_conditions, allergies, family_doctor_name, family_doctor_phone,
                emergency_contact_name, emergency_contact_phone
         FROM users WHERE id = ?`,
        [userId]
    );
    if (users.length === 0) throw new Error('User not found');
    const personalInfo = users[0];

    // Active medications
    const [medications] = await pool.execute(
        `SELECT id, name, dosage, frequency, start_date, end_date, status, notes
         FROM medications WHERE user_id = ? AND status = 'active'`,
        [userId]
    );

    // Upcoming appointments
    const [appointments] = await pool.execute(
        `SELECT id, doctor_name, doctor_specialty, appointment_date, appointment_time, status, notes
         FROM appointments
         WHERE user_id = ? AND status = 'upcoming' AND appointment_date >= CURDATE()
         ORDER BY appointment_date ASC LIMIT 5`,
        [userId]
    );

    // Latest 5 vitals
    const [vitals] = await pool.execute(
        `SELECT id, blood_sugar, blood_pressure_systolic, blood_pressure_diastolic,
                heart_rate, temperature, weight, recorded_date, recorded_time
         FROM vitals WHERE user_id = ?
         ORDER BY recorded_date DESC, recorded_time DESC LIMIT 5`,
        [userId]
    );

    // Latest 5 documents
    const [documents] = await pool.execute(
        `SELECT id, document_type, file_name, upload_date
         FROM medical_documents WHERE user_id = ?
         ORDER BY upload_date DESC LIMIT 5`,
        [userId]
    );

    // Emergency contacts (from users table)
    const emergencyContacts = [];
    if (personalInfo.emergency_contact_name && personalInfo.emergency_contact_phone) {
        emergencyContacts.push({
            name: personalInfo.emergency_contact_name,
            phone: personalInfo.emergency_contact_phone,
            email: null,
            relationship: 'Emergency Contact',
            is_primary: true
        });
    }

    return {
        personalInfo,
        currentMedications: medications,
        upcomingAppointments: appointments,
        recentVitals: vitals,
        recentDocuments: documents,
        emergencyContacts
    };
};

/**
 * Fetch emergency contacts for a user
 */
const fetchEmergencyContacts = async (userId) => {
    const [contacts] = await pool.execute(
        `SELECT id, name, phone, email, relationship, is_primary
         FROM emergency_contacts WHERE user_id = ?
         ORDER BY is_primary DESC`,
        [userId]
    );
    return contacts;
};

/**
 * Send emergency email to a contact with the medical snapshot
 */
const sendEmergencyEmail = async (contact, snapshot) => {
    if (!contact.email) {
        throw new Error(`No email for contact ${contact.name}`);
    }

    const { personalInfo, currentMedications, upcomingAppointments, recentVitals, location } = snapshot;
    const timestamp = new Date().toLocaleString('ar-EG');

    // Use local geocoding to get area name from coordinates
    const locationText = location && location.latitude != null
        ? formatLocation(location)
        : 'غير محدد';

    const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; color: #1f2937;">
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🚨 طلب مساعدة طارئة</h1>
            <p style="color: #fecaca; margin: 8px 0 0;">Health Sync — نظام الطوارئ الطبية</p>
        </div>
        <div style="background: #fef2f2; padding: 16px; border: 2px solid #dc2626; text-align: center;">
            <p style="color: #dc2626; font-size: 18px; font-weight: bold; margin: 0;">
                ⚠️ يحتاج ${personalInfo.full_name} إلى مساعدة طارئة!
            </p>
            <p style="color: #6b7280; margin: 8px 0 0;">الوقت: ${timestamp} | الموقع: ${locationText}</p>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb;">
            <h2 style="color: #dc2626; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">👤 البيانات الشخصية</h2>
            <table style="width:100%; border-collapse: collapse;">
                <tr><td style="padding:6px; color:#6b7280;">الاسم</td><td style="padding:6px; font-weight:bold;">${personalInfo.full_name || '-'}</td>
                    <td style="padding:6px; color:#6b7280;">العمر</td><td style="padding:6px; font-weight:bold;">${personalInfo.age || '-'}</td></tr>
                <tr><td style="padding:6px; color:#6b7280;">الهاتف</td><td style="padding:6px;">${personalInfo.phone || '-'}</td>
                    <td style="padding:6px; color:#6b7280;">فصيلة الدم</td><td style="padding:6px; font-weight:bold; color:#dc2626;">${personalInfo.blood_type || '-'}</td></tr>
                <tr><td style="padding:6px; color:#6b7280;">الأمراض المزمنة</td><td colspan="3" style="padding:6px;">${personalInfo.chronic_conditions || 'لا يوجد'}</td></tr>
                <tr><td style="padding:6px; color:#6b7280;">الحساسية</td><td colspan="3" style="padding:6px;">${personalInfo.allergies || 'لا يوجد'}</td></tr>
                <tr><td style="padding:6px; color:#6b7280;">الطبيب المعالج</td><td colspan="3" style="padding:6px;">${personalInfo.family_doctor_name || '-'} — ${personalInfo.family_doctor_phone || '-'}</td></tr>
            </table>

            <h2 style="color: #dc2626; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 24px;">💊 الأدوية النشطة (${currentMedications.length})</h2>
            ${currentMedications.length > 0
                ? `<table style="width:100%; border-collapse: collapse; font-size: 14px;">
                    <thead><tr style="background:#fee2e2;"><th style="padding:8px; text-align:right;">الدواء</th><th style="padding:8px; text-align:right;">الجرعة</th><th style="padding:8px; text-align:right;">التكرار</th></tr></thead>
                    <tbody>${currentMedications.map(m => `<tr><td style="padding:6px;">${m.name}</td><td style="padding:6px;">${m.dosage || '-'}</td><td style="padding:6px;">${m.frequency || '-'}</td></tr>`).join('')}</tbody>
                   </table>`
                : '<p style="color:#6b7280;">لا توجد أدوية نشطة</p>'
            }

            <h2 style="color: #dc2626; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 24px;">📊 آخر القراءات الحيوية</h2>
            ${recentVitals.length > 0
                ? `<table style="width:100%; border-collapse: collapse; font-size: 14px;">
                    <thead><tr style="background:#fee2e2;"><th style="padding:8px; text-align:right;">التاريخ</th><th style="padding:8px; text-align:right;">سكر الدم</th><th style="padding:8px; text-align:right;">ضغط الدم</th><th style="padding:8px; text-align:right;">القلب</th></tr></thead>
                    <tbody>${recentVitals.map(v => `<tr><td style="padding:6px;">${v.recorded_date}</td><td style="padding:6px;">${v.blood_sugar || '-'}</td><td style="padding:6px;">${v.blood_pressure_systolic || '-'}/${v.blood_pressure_diastolic || '-'}</td><td style="padding:6px;">${v.heart_rate || '-'}</td></tr>`).join('')}</tbody>
                   </table>`
                : '<p style="color:#6b7280;">لا توجد قراءات حيوية</p>'
            }

            <p style="color:#9ca3af; font-size:12px; margin-top:24px; text-align:center;">
                تم إرسال هذا البريد تلقائياً بواسطة نظام Health Sync للطوارئ<br>
                ⚠️ هذا البريد سري ومخصص لجهة الطوارئ المحددة فقط
            </p>
        </div>
    </div>`;

    const transporter = require('nodemailer').createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: `"Health Sync Emergency" <${process.env.EMAIL_USER}>`,
        to: contact.email,
        subject: `🚨 طلب مساعدة طارئة - ${personalInfo.full_name}`,
        html
    });
};

/**
 * Send emergency SMS fallback (stub — integrate with SMS provider as needed)
 */
const sendEmergencySMS = async (phone, emergencyId, location) => {
    // Placeholder: integrate with Twilio or similar SMS provider
    // For now, log and return failure so the caller records it
    console.warn(`[SOS] SMS fallback not configured. Would send to ${phone} for emergency ${emergencyId}`);
    return { success: false };
};

/**
 * Main SOS trigger function — Algorithm 2 from design
 * @param {number} userId
 * @param {object|null} location - { latitude, longitude, accuracy, address } or null
 * @returns {Promise<{success: boolean, emergencyId: string, contactsNotified: number, timestamp: Date}>}
 */
const triggerSOSEmergency = async (userId, location) => {
    // Step 1: Generate unique emergency ID
    const emergencyId = crypto.randomUUID();

    // Step 2: Fetch complete medical file
    const medicalFile = await fetchCompleteMedicalFile(userId);

    // Step 3: Get emergency contacts from medical file
    const contacts = medicalFile.emergencyContacts;

    // Step 4: Throw if no contacts configured
    if (!contacts || contacts.length === 0) {
        throw new Error('No emergency contacts configured');
    }

    // Step 5: Build medical file snapshot
    const snapshot = {
        personalInfo: medicalFile.personalInfo,
        currentMedications: medicalFile.currentMedications,
        upcomingAppointments: medicalFile.upcomingAppointments,
        recentVitals: medicalFile.recentVitals,
        recentDocuments: medicalFile.recentDocuments,
        location: location || null,
        timestamp: new Date()
    };

    // Step 6: Notify all contacts in parallel using Promise.allSettled
    const notificationPromises = contacts.map(async (contact) => {
        // Try email first
        try {
            await sendEmergencyEmail(contact, snapshot);
            return {
                contactId: contact.id,
                method: 'email',
                status: 'sent',
                sentAt: new Date()
            };
        } catch (emailErr) {
            console.warn(`[SOS] Email failed for contact ${contact.id} (${contact.name}):`, emailErr.message);

            // Fallback to SMS
            try {
                const smsResult = await sendEmergencySMS(contact.phone, emergencyId, location);
                if (smsResult.success) {
                    return {
                        contactId: contact.id,
                        method: 'sms',
                        status: 'sent',
                        sentAt: new Date()
                    };
                }
                throw new Error('SMS also failed');
            } catch (smsErr) {
                console.error(`[SOS] Both email and SMS failed for contact ${contact.id} (${contact.name}):`, smsErr.message);
                return {
                    contactId: contact.id,
                    method: 'failed',
                    status: 'failed',
                    sentAt: new Date()
                };
            }
        }
    });

    const results = await Promise.allSettled(notificationPromises);

    const notificationStatus = results.map((r) =>
        r.status === 'fulfilled' ? r.value : { contactId: null, method: 'failed', status: 'failed', sentAt: new Date() }
    );

    const contactsNotified = notificationStatus.filter((n) => n.status === 'sent').length;

    // Step 8: Save emergency log to sos_emergency_logs
    await pool.execute(
        `INSERT INTO sos_emergency_logs
            (user_id, emergency_id, location_latitude, location_longitude, location_accuracy,
             medical_file_snapshot, contacts_notified, notification_status, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
            userId,
            emergencyId,
            location?.latitude ?? null,
            location?.longitude ?? null,
            location?.accuracy ?? null,
            JSON.stringify(snapshot),
            JSON.stringify(contacts),
            JSON.stringify(notificationStatus)
        ]
    );

    // Step 9: Return EmergencyResponse
    return {
        success: true,
        emergencyId,
        contactsNotified,
        timestamp: new Date()
    };
};

module.exports = {
    triggerSOSEmergency,
    fetchCompleteMedicalFile,
    sendEmergencyEmail
};
