const { pool } = require('../Config/db');

/**
 * Notification Scheduler
 * Runs every minute, checks for upcoming appointments & medication times
 * and pushes real-time notifications via Socket.io
 */

let ioInstance = null;
let userSocketsRef = null;

const init = (io, userSockets) => {
    ioInstance = io;
    userSocketsRef = userSockets;
    startScheduler();
};

const sendToUser = (userId, event, payload) => {
    if (!ioInstance || !userSocketsRef) return;
    const socketId = userSocketsRef.get(String(userId));
    if (socketId) {
        ioInstance.to(socketId).emit(event, { ...payload, timestamp: new Date() });
    }
};

// ─── Appointment Reminders ────────────────────────────────────────────────────
// Fires 24h before AND 1h before the appointment
const checkAppointments = async () => {
    try {
        const [rows] = await pool.execute(`
            SELECT a.id, a.user_id, a.doctor_name, a.doctor_specialty,
                   a.clinic_name, a.appointment_date, a.appointment_time,
                   a.notified_24h, a.notified_1h
            FROM appointments a
            WHERE a.status = 'upcoming'
              AND a.appointment_date >= CURDATE()
              AND CONCAT(a.appointment_date, ' ', IFNULL(a.appointment_time, '00:00:00')) > NOW()
        `);

        const now = new Date();

        for (const appt of rows) {
            const apptDateTime = new Date(`${appt.appointment_date}T${appt.appointment_time || '00:00:00'}`);
            const diffMs = apptDateTime - now;
            const diffHours = diffMs / (1000 * 60 * 60);

            // 24h reminder (between 23.5h and 24.5h before)
            if (!appt.notified_24h && diffHours <= 24.5 && diffHours >= 23.5) {
                sendToUser(appt.user_id, 'appointment_reminder', {
                    type: 'appointment_24h',
                    appointmentId: appt.id,
                    doctorName: appt.doctor_name,
                    specialty: appt.doctor_specialty,
                    clinicName: appt.clinic_name,
                    date: appt.appointment_date,
                    time: appt.appointment_time,
                    message: `تذكير: لديك موعد مع ${appt.doctor_name} غداً الساعة ${appt.appointment_time || ''}`
                });
                await pool.execute('UPDATE appointments SET notified_24h = 1 WHERE id = ?', [appt.id]);
            }

            // 1h reminder (between 55min and 65min before)
            if (!appt.notified_1h && diffHours <= 1.08 && diffHours >= 0.9) {
                sendToUser(appt.user_id, 'appointment_reminder', {
                    type: 'appointment_1h',
                    appointmentId: appt.id,
                    doctorName: appt.doctor_name,
                    specialty: appt.doctor_specialty,
                    clinicName: appt.clinic_name,
                    date: appt.appointment_date,
                    time: appt.appointment_time,
                    message: `تنبيه: موعدك مع ${appt.doctor_name} بعد ساعة الساعة ${appt.appointment_time || ''}`
                });
                await pool.execute('UPDATE appointments SET notified_1h = 1 WHERE id = ?', [appt.id]);
            }
        }
    } catch (err) {
        console.error('Appointment scheduler error:', err.message);
    }
};

// ─── Medication Reminders ─────────────────────────────────────────────────────
// Maps time_of_day to hour ranges
const TIME_WINDOWS = {
    morning: { hour: 8,  label: 'الصباح' },
    noon:    { hour: 13, label: 'الظهر' },
    evening: { hour: 18, label: 'المساء' },
    night:   { hour: 22, label: 'قبل النوم' }
};

const checkMedications = async () => {
    try {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // Only fire at the exact hour (minute 0-2 window)
        if (currentMinute > 2) return;

        for (const [timeKey, { hour, label }] of Object.entries(TIME_WINDOWS)) {
            if (currentHour !== hour) continue;

            const [rows] = await pool.execute(`
                SELECT m.id, m.user_id, m.name, m.dosage, m.frequency
                FROM medications m
                WHERE m.status = 'active'
                  AND m.time_of_day = ?
                  AND (m.end_date IS NULL OR m.end_date >= CURDATE())
            `, [timeKey]);

            for (const med of rows) {
                sendToUser(med.user_id, 'medication_reminder', {
                    type: 'medication',
                    medicationId: med.id,
                    medicationName: med.name,
                    dosage: med.dosage,
                    timeLabel: label,
                    message: `حان وقت تناول دواء ${med.name} - ${med.dosage} (${label})`
                });
            }
        }
    } catch (err) {
        console.error('Medication scheduler error:', err.message);
    }
};

const startScheduler = () => {
    // Run every minute
    setInterval(async () => {
        await checkAppointments();
        await checkMedications();
    }, 60 * 1000);

    console.log('✅ Notification scheduler started');
};

module.exports = { init };
