const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

const sendOTPEmail = async (toEmail, otp, type = 'verify') => {
    const transporter = createTransporter();

    const isReset = type === 'reset';
    const subject = isReset ? 'رمز إعادة تعيين كلمة المرور - Health Sync' : 'رمز التحقق - Health Sync';
    const title = isReset ? 'إعادة تعيين كلمة المرور' : 'تحقق من بريدك الإلكتروني';
    const desc = isReset
        ? 'تلقيت هذا البريد لأنك طلبت إعادة تعيين كلمة المرور. الرمز صالح لمدة 30 دقيقة.'
        : 'أدخل الرمز التالي لتفعيل حسابك. الرمز صالح لمدة 5 دقائق.';

    const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #2563eb; margin-bottom: 8px;">🏥 Health Sync</h2>
        <h3 style="color: #111827;">${title}</h3>
        <p style="color: #6b7280;">${desc}</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</span>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">إذا لم تطلب هذا، تجاهل هذا البريد.</p>
    </div>`;

    await transporter.sendMail({
        from: `"Health Sync" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject,
        html
    });
};

module.exports = { sendOTPEmail };

const sendMedicalReportEmail = async (toEmail, data) => {
    const transporter = createTransporter();
    const { profile, medications, appointments, vitals, documents } = data;
    const date = new Date().toLocaleDateString('ar-EG');

    const medsRows = medications.length > 0
        ? medications.map(m => `<tr><td>${m.name}</td><td>${m.dosage || '-'}</td><td>${m.frequency || '-'}</td><td>${m.status === 'active' ? '✅ نشط' : m.status}</td></tr>`).join('')
        : '<tr><td colspan="4" style="text-align:center">لا توجد أدوية</td></tr>';

    const apptRows = appointments.length > 0
        ? appointments.map(a => `<tr><td>${a.doctor_name}</td><td>${a.doctor_specialty || '-'}</td><td>${a.appointment_date}</td><td>${a.status}</td></tr>`).join('')
        : '<tr><td colspan="4" style="text-align:center">لا توجد مواعيد</td></tr>';

    const vitalsRows = vitals.length > 0
        ? vitals.map(v => `<tr><td>${v.recorded_date}</td><td>${v.blood_sugar || '-'}</td><td>${v.blood_pressure_systolic || '-'}/${v.blood_pressure_diastolic || '-'}</td><td>${v.heart_rate || '-'}</td><td>${v.temperature || '-'}</td></tr>`).join('')
        : '<tr><td colspan="5" style="text-align:center">لا توجد قراءات</td></tr>';

    const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; color: #1f2937;">
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">🏥 Health Sync</h1>
            <p style="color: #bfdbfe; margin: 8px 0 0;">الملف الطبي الشامل</p>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1d4ed8; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">👤 البيانات الشخصية</h2>
            <table style="width:100%; border-collapse: collapse;">
                <tr><td style="padding:6px; color:#6b7280;">الاسم</td><td style="padding:6px; font-weight:bold;">${profile.full_name || '-'}</td><td style="padding:6px; color:#6b7280;">العمر</td><td style="padding:6px; font-weight:bold;">${profile.age || '-'}</td></tr>
                <tr><td style="padding:6px; color:#6b7280;">الهاتف</td><td style="padding:6px;">${profile.phone || '-'}</td><td style="padding:6px; color:#6b7280;">المدينة</td><td style="padding:6px;">${profile.city || '-'}</td></tr>
                <tr><td style="padding:6px; color:#6b7280;">فصيلة الدم</td><td style="padding:6px; font-weight:bold; color:#dc2626;">${profile.blood_type || '-'}</td><td style="padding:6px; color:#6b7280;">الطبيب المعالج</td><td style="padding:6px;">${profile.family_doctor_name || '-'}</td></tr>
                <tr><td style="padding:6px; color:#6b7280;">الأمراض المزمنة</td><td colspan="3" style="padding:6px;">${profile.chronic_conditions || 'لا يوجد'}</td></tr>
                <tr><td style="padding:6px; color:#6b7280;">الحساسية</td><td colspan="3" style="padding:6px;">${profile.allergies || 'لا يوجد'}</td></tr>
                <tr><td style="padding:6px; color:#6b7280;">جهة الطوارئ</td><td colspan="3" style="padding:6px;">${profile.emergency_contact_name || '-'} — ${profile.emergency_contact_phone || '-'}</td></tr>
            </table>

            <h2 style="color: #1d4ed8; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 24px;">💊 الأدوية (${medications.length})</h2>
            <table style="width:100%; border-collapse: collapse; font-size: 14px;">
                <thead><tr style="background:#dbeafe;"><th style="padding:8px; text-align:right;">الدواء</th><th style="padding:8px; text-align:right;">الجرعة</th><th style="padding:8px; text-align:right;">التكرار</th><th style="padding:8px; text-align:right;">الحالة</th></tr></thead>
                <tbody>${medsRows}</tbody>
            </table>

            <h2 style="color: #1d4ed8; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 24px;">📅 المواعيد الأخيرة</h2>
            <table style="width:100%; border-collapse: collapse; font-size: 14px;">
                <thead><tr style="background:#dbeafe;"><th style="padding:8px; text-align:right;">الطبيب</th><th style="padding:8px; text-align:right;">التخصص</th><th style="padding:8px; text-align:right;">التاريخ</th><th style="padding:8px; text-align:right;">الحالة</th></tr></thead>
                <tbody>${apptRows}</tbody>
            </table>

            <h2 style="color: #1d4ed8; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 24px;">📊 آخر القراءات الحيوية</h2>
            <table style="width:100%; border-collapse: collapse; font-size: 14px;">
                <thead><tr style="background:#dbeafe;"><th style="padding:8px; text-align:right;">التاريخ</th><th style="padding:8px; text-align:right;">سكر الدم</th><th style="padding:8px; text-align:right;">ضغط الدم</th><th style="padding:8px; text-align:right;">القلب</th><th style="padding:8px; text-align:right;">الحرارة</th></tr></thead>
                <tbody>${vitalsRows}</tbody>
            </table>

            <p style="color:#9ca3af; font-size:12px; margin-top:24px; text-align:center;">
                تم إنشاء هذا الملف بتاريخ ${date} بواسطة Health Sync<br>
                ⚠️ هذا الملف سري ومخصص للاستخدام الطبي فقط
            </p>
        </div>
    </div>`;

    await transporter.sendMail({
        from: `"Health Sync" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `الملف الطبي الشامل - ${profile.full_name} - ${date}`,
        html
    });
};

module.exports = { sendOTPEmail, sendMedicalReportEmail };
