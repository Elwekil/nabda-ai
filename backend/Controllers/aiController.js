const { pool } = require('../Config/db');
const ResponseFormatter = require('../Utils/responseFormatter');
const { chat } = require('../Utils/aiClient');
const sanitizeHtml = require('sanitize-html');
const { chatWithMedicalAI } = require('../Services/aiChatService');
const { exportMedicalFileToPDF, fetchCompleteMedicalFile } = require('../Services/medicalExportService');

// Inline audit logger — writes to audit_logs table (created by migrateAI.js)
async function logAuditEvent(userId, eventType, eventData, req) {
    try {
        await pool.execute(
            `INSERT INTO audit_logs (user_id, event_type, event_data, ip_address, user_agent, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
                userId,
                eventType,
                JSON.stringify(eventData),
                req.ip || req.connection.remoteAddress,
                req.get('user-agent') || 'unknown',
            ]
        );
    } catch (err) {
        // Non-fatal — log to console but don't block the response
        console.error('Audit log failed:', err.message);
    }
}

// ─── Drug Interaction Check ───────────────────────────────────────────────────
const checkDrugInteraction = async (req, res) => {
    try {
        const userId = req.user.id;
        const [medications] = await pool.execute(
            `SELECT name, dosage, frequency FROM medications WHERE user_id = ? AND status = 'active'`,
            [userId]
        );

        if (medications.length < 2) {
            return ResponseFormatter.success(res, {
                hasInteractions: false,
                message: 'تحتاج إلى دواءين على الأقل للتحقق من التعارض',
                interactions: [], medications
            }, 'لا يوجد تعارض');
        }

        const medList = medications.map(m => `${m.name} (${m.dosage || '-'})`).join('\n');
        const systemMsg = `أنت صيدلاني خبير. أجب دائماً بـ JSON صحيح فقط بدون أي نص خارج الـ JSON.`;
        const userMsg = `افحص التعارضات الدوائية بين هذه الأدوية:\n${medList}\n\nأجب بهذا JSON فقط:\n{"hasInteractions":true,"severity":"high","interactions":[{"drug1":"","drug2":"","severity":"high","description":"","recommendation":""}],"safeToTake":true,"generalAdvice":""}`;

        const raw = await chat(
            [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }],
            { json: true }
        );
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid JSON');
        const result = JSON.parse(jsonMatch[0]);

        return ResponseFormatter.success(res, { ...result, medications }, 'تم فحص التعارضات');
    } catch (error) {
        console.error('Drug interaction error:', error);
        return ResponseFormatter.error(res, 'فشل في فحص التعارضات الدوائية', 500);
    }
};

// ─── AI Medical Chatbot ───────────────────────────────────────────────────────
const medicalChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { message, history = [] } = req.body;
        if (!message?.trim()) return ResponseFormatter.badRequest(res, 'الرسالة مطلوبة');

        const [users] = await pool.execute(
            `SELECT full_name, age, blood_type, chronic_conditions, allergies FROM users WHERE id = ?`,
            [userId]
        );
        const profile = users[0] || {};

        const [medications] = await pool.execute(
            `SELECT name FROM medications WHERE user_id = ? AND status = 'active' LIMIT 10`,
            [userId]
        );

        const systemMsg = `أنت مساعد طبي ذكي اسمك "د. سينا". تتحدث بالعربية بشكل ودود ومهني.

معلومات المريض:
- الاسم: ${profile.full_name || 'غير محدد'}
- العمر: ${profile.age || 'غير محدد'}
- فصيلة الدم: ${profile.blood_type || 'غير محددة'}
- الأمراض المزمنة: ${profile.chronic_conditions || 'لا يوجد'}
- الحساسية: ${profile.allergies || 'لا يوجد'}
- الأدوية الحالية: ${medications.length > 0 ? medications.map(m => m.name).join('، ') : 'لا يوجد'}

قواعد:
1. اسأل عن تفاصيل الأعراض قبل أي توصية
2. قدم أفضل 3 علاجات مقترحة مع شرح كل منها
3. نبّه دائماً بضرورة مراجعة الطبيب
4. خذ في الاعتبار الأمراض المزمنة والأدوية الحالية
5. إذا كانت الأعراض خطيرة، اطلب التوجه للطوارئ فوراً`;

        const messages = [
            { role: 'system', content: systemMsg },
            ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: message }
        ];

        const reply = await chat(messages, { maxTokens: 1500 });
        return ResponseFormatter.success(res, { reply, timestamp: new Date().toISOString() }, 'تم الرد');
    } catch (error) {
        console.error('Medical chat error:', error);
        return ResponseFormatter.error(res, 'فشل في الرد، حاول مرة أخرى', 500);
    }
};

// ─── AI Chat Diagnosis (Feature 4) ───────────────────────────────────────────
const chatDiagnosis = async (req, res) => {
    try {
        const userId = req.user.id;
        const { message, history = [] } = req.body;

        // Validate message: non-empty and max 2000 chars
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return ResponseFormatter.badRequest(res, 'الرسالة مطلوبة');
        }

        if (message.length > 2000) {
            return ResponseFormatter.badRequest(res, 'الرسالة طويلة جداً (الحد الأقصى 2000 حرف)');
        }

        // Sanitize message with sanitize-html
        const sanitizedMessage = sanitizeHtml(message, {
            allowedTags: [],
            allowedAttributes: {}
        });

        // Fetch user's medical context
        const [users] = await pool.execute(
            `SELECT age, blood_type, chronic_conditions, allergies FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return ResponseFormatter.notFound(res, 'User');
        }

        const profile = users[0];

        // Fetch current medications
        const [medications] = await pool.execute(
            `SELECT name, dosage FROM medications WHERE user_id = ? AND status = 'active'`,
            [userId]
        );

        // Fetch recent vitals
        const [vitals] = await pool.execute(
            `SELECT blood_sugar, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, recorded_date 
             FROM vitals WHERE user_id = ? ORDER BY recorded_date DESC LIMIT 5`,
            [userId]
        );

        // Build medical context
        const context = {
            userId: userId,
            age: profile.age,
            gender: null, // Gender column doesn't exist in users table
            bloodType: profile.blood_type,
            chronicConditions: profile.chronic_conditions ? profile.chronic_conditions.split(',').map(c => c.trim()) : [],
            allergies: profile.allergies ? profile.allergies.split(',').map(a => a.trim()) : [],
            currentMedications: medications,
            recentVitals: vitals
        };

        // Call chatWithMedicalAI service
        const result = await chatWithMedicalAI(sanitizedMessage, history, context);

        // Audit log
        await logAuditEvent(userId, 'AI_CHAT_DIAGNOSIS', {
            messageLength: sanitizedMessage.length,
            urgencyLevel: result.urgencyLevel,
            requiresMoreInfo: result.requiresMoreInfo
        }, req);

        return ResponseFormatter.success(res, result, 'تم التشخيص بنجاح');
    } catch (error) {
        console.error('Chat diagnosis error:', error);
        return ResponseFormatter.error(res, 'فشل في التشخيص، حاول مرة أخرى', 500);
    }
};

// ─── Export Medical File by Email ─────────────────────────────────────────────
const exportMedicalFile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email } = req.body;
        if (!email) return ResponseFormatter.badRequest(res, 'البريد الإلكتروني مطلوب');

        const [users] = await pool.execute(
            `SELECT full_name, email, phone, age, city, blood_type, chronic_conditions, allergies,
                    emergency_contact_name, emergency_contact_phone, family_doctor_name, family_doctor_phone
             FROM users WHERE id = ?`, [userId]
        );
        if (users.length === 0) return ResponseFormatter.notFound(res, 'User');

        const [medications] = await pool.execute(
            `SELECT name, dosage, frequency, time_of_day, start_date, status, notes FROM medications WHERE user_id = ? ORDER BY status, name`, [userId]
        );
        const [appointments] = await pool.execute(
            `SELECT doctor_name, doctor_specialty, clinic_name, appointment_date, appointment_time, status FROM appointments WHERE user_id = ? ORDER BY appointment_date DESC LIMIT 10`, [userId]
        );
        const [vitals] = await pool.execute(
            `SELECT blood_sugar, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, recorded_date FROM vitals WHERE user_id = ? ORDER BY recorded_date DESC LIMIT 5`, [userId]
        );
        const [documents] = await pool.execute(
            `SELECT file_name, document_type, upload_date FROM medical_documents WHERE user_id = ? ORDER BY upload_date DESC`, [userId]
        );

        const { sendMedicalReportEmail } = require('../Utils/emailService');
        await sendMedicalReportEmail(email, { profile: users[0], medications, appointments, vitals, documents });

        return ResponseFormatter.success(res, null, `تم إرسال الملف الطبي إلى ${email} بنجاح`);
    } catch (error) {
        console.error('Export medical file error:', error);
        return ResponseFormatter.error(res, 'فشل في إرسال الملف الطبي', 500);
    }
};

// ─── Export Medical File (Feature 4 - Enhanced) ───────────────────────────────
const exportMedicalFilePDF = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, sessionId } = req.body;

        // Validate email format
        if (!email || typeof email !== 'string') {
            return ResponseFormatter.badRequest(res, 'البريد الإلكتروني مطلوب');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return ResponseFormatter.badRequest(res, 'صيغة البريد الإلكتروني غير صحيحة');
        }

        // Call exportMedicalFileToPDF service
        const result = await exportMedicalFileToPDF(userId, email, sessionId);

        // Audit log
        await logAuditEvent(userId, 'MEDICAL_FILE_EXPORT', {
            email: email,
            sessionId: sessionId || null,
            emailSent: result.emailSent,
            pdfPath: result.pdfPath
        }, req);

        return ResponseFormatter.success(res, {
            emailSent: result.emailSent,
            timestamp: result.timestamp
        }, `تم تصدير الملف الطبي وإرساله إلى ${email}`);
    } catch (error) {
        console.error('Export medical file PDF error:', error);
        return ResponseFormatter.error(res, 'فشل في تصدير الملف الطبي', 500);
    }
};

// ─── Get Medical Context (Feature 4) ──────────────────────────────────────────
const getMedicalContext = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch complete medical context for frontend
        const medicalFile = await fetchCompleteMedicalFile(userId);

        if (!medicalFile) {
            return ResponseFormatter.notFound(res, 'Medical file');
        }

        // Build context object for frontend
        const context = {
            personalInfo: {
                fullName: medicalFile.personalInfo.full_name,
                age: medicalFile.personalInfo.age,
                gender: null, // Gender column doesn't exist in users table
                bloodType: medicalFile.personalInfo.blood_type,
                phone: medicalFile.personalInfo.phone,
                email: medicalFile.personalInfo.email,
                city: medicalFile.personalInfo.city
            },
            chronicConditions: medicalFile.chronicConditions,
            allergies: medicalFile.allergies,
            currentMedications: medicalFile.medications.filter(m => m.status === 'active').map(m => ({
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency
            })),
            recentVitals: medicalFile.vitals.slice(0, 5).map(v => ({
                bloodSugar: v.blood_sugar,
                bloodPressure: v.blood_pressure_systolic && v.blood_pressure_diastolic 
                    ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}` 
                    : null,
                heartRate: v.heart_rate,
                temperature: v.temperature,
                recordedDate: v.recorded_date
            })),
            emergencyContacts: medicalFile.emergencyContacts,
            familyDoctor: {
                name: medicalFile.personalInfo.family_doctor_name,
                phone: medicalFile.personalInfo.family_doctor_phone
            }
        };

        return ResponseFormatter.success(res, context, 'تم جلب السياق الطبي بنجاح');
    } catch (error) {
        console.error('Get medical context error:', error);
        return ResponseFormatter.error(res, 'فشل في جلب السياق الطبي', 500);
    }
};

module.exports = { checkDrugInteraction, medicalChat, exportMedicalFile, chatDiagnosis, exportMedicalFilePDF, getMedicalContext };
