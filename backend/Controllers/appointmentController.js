const { pool } = require('../Config/db');
const ResponseFormatter = require('../Utils/responseFormatter');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
    try {
        const [appointments] = await pool.execute(
            `SELECT id, doctor_name, doctor_specialty, clinic_name, clinic_address, 
                    appointment_date, appointment_time, notes, status
             FROM appointments 
             WHERE user_id = ? 
             ORDER BY appointment_date ASC, appointment_time ASC`,
            [req.user.id]
        );
        
        return ResponseFormatter.list(res, appointments, null, null, null, 'Appointments retrieved successfully');
        
    } catch (error) {
        console.error('Get appointments error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve appointments', 500);
    }
};

// @desc    Get upcoming appointments
// @route   GET /api/appointments/upcoming
// @access  Private
const getUpcomingAppointments = async (req, res) => {
    try {
        const [appointments] = await pool.execute(
            `SELECT id, doctor_name, doctor_specialty, clinic_name, clinic_address, 
                    appointment_date, appointment_time, notes
             FROM appointments 
             WHERE user_id = ? AND status = 'upcoming' AND appointment_date >= CURDATE()
             ORDER BY appointment_date ASC, appointment_time ASC
             LIMIT 5`,
            [req.user.id]
        );
        
        return ResponseFormatter.list(res, appointments, null, null, null, 'Upcoming appointments retrieved successfully');
        
    } catch (error) {
        console.error('Get upcoming appointments error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve upcoming appointments', 500);
    }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [appointments] = await pool.execute(
            `SELECT id, doctor_name, doctor_specialty, clinic_name, clinic_address, 
                    appointment_date, appointment_time, notes, status
             FROM appointments 
             WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );
        
        if (appointments.length === 0) {
            return ResponseFormatter.notFound(res, 'Appointment');
        }
        
        return ResponseFormatter.success(res, appointments[0], 'Appointment retrieved successfully');
        
    } catch (error) {
        console.error('Get appointment error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve appointment', 500);
    }
};

// @desc    Add new appointment
// @route   POST /api/appointments
// @access  Private
const addAppointment = async (req, res) => {
    try {
        const { doctor_name, doctor_specialty, clinic_name, clinic_address, appointment_date, appointment_time, notes } = req.body;
        
        if (!doctor_name) {
            return ResponseFormatter.validationError(res, { doctor_name: 'Doctor name is required' });
        }
        if (!appointment_date) {
            return ResponseFormatter.validationError(res, { appointment_date: 'Appointment date is required' });
        }
        
        const [result] = await pool.execute(
            `INSERT INTO appointments (user_id, doctor_name, doctor_specialty, clinic_name, clinic_address, appointment_date, appointment_time, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, doctor_name, doctor_specialty, clinic_name, clinic_address, appointment_date, appointment_time, notes]
        );
        
        const [newAppointment] = await pool.execute(
            'SELECT id, doctor_name, doctor_specialty, appointment_date, appointment_time, status FROM appointments WHERE id = ?',
            [result.insertId]
        );
        
        return ResponseFormatter.created(res, newAppointment[0], 'Appointment added successfully');
        
    } catch (error) {
        console.error('Add appointment error:', error);
        return ResponseFormatter.error(res, 'Failed to add appointment', 500);
    }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctor_name, doctor_specialty, clinic_name, clinic_address, appointment_date, appointment_time, notes, status } = req.body;
        
        const [existing] = await pool.execute(
            'SELECT id FROM appointments WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        
        if (existing.length === 0) {
            return ResponseFormatter.notFound(res, 'Appointment');
        }
        
        const updates = [];
        const values = [];
        
        if (doctor_name) { updates.push('doctor_name = ?'); values.push(doctor_name); }
        if (doctor_specialty) { updates.push('doctor_specialty = ?'); values.push(doctor_specialty); }
        if (clinic_name) { updates.push('clinic_name = ?'); values.push(clinic_name); }
        if (clinic_address) { updates.push('clinic_address = ?'); values.push(clinic_address); }
        if (appointment_date) { updates.push('appointment_date = ?'); values.push(appointment_date); }
        if (appointment_time) { updates.push('appointment_time = ?'); values.push(appointment_time); }
        if (notes) { updates.push('notes = ?'); values.push(notes); }
        if (status) { updates.push('status = ?'); values.push(status); }
        
        if (updates.length === 0) {
            return ResponseFormatter.badRequest(res, 'No fields to update');
        }
        
        values.push(id);
        values.push(req.user.id);
        
        await pool.execute(
            `UPDATE appointments SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );
        
        const [updated] = await pool.execute(
            'SELECT id, doctor_name, doctor_specialty, appointment_date, appointment_time, status FROM appointments WHERE id = ?',
            [id]
        );
        
        return ResponseFormatter.success(res, updated[0], 'Appointment updated successfully');
        
    } catch (error) {
        console.error('Update appointment error:', error);
        return ResponseFormatter.error(res, 'Failed to update appointment', 500);
    }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private
const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['upcoming', 'completed', 'cancelled'].includes(status)) {
            return ResponseFormatter.validationError(res, { status: 'Invalid status value' });
        }
        
        const [result] = await pool.execute(
            `UPDATE appointments SET status = ? WHERE id = ? AND user_id = ?`,
            [status, id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return ResponseFormatter.notFound(res, 'Appointment');
        }
        
        return ResponseFormatter.success(res, { id, status }, 'Appointment status updated successfully');
        
    } catch (error) {
        console.error('Update appointment status error:', error);
        return ResponseFormatter.error(res, 'Failed to update appointment status', 500);
    }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute(
            'DELETE FROM appointments WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return ResponseFormatter.notFound(res, 'Appointment');
        }
        
        return ResponseFormatter.success(res, { id }, 'Appointment deleted successfully');
        
    } catch (error) {
        console.error('Delete appointment error:', error);
        return ResponseFormatter.error(res, 'Failed to delete appointment', 500);
    }
};

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats
// @access  Private
const getAppointmentStats = async (req, res) => {
    try {
        const [stats] = await pool.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'upcoming' THEN 1 ELSE 0 END) as upcoming,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
             FROM appointments 
             WHERE user_id = ?`,
            [req.user.id]
        );
        
        return ResponseFormatter.success(res, stats[0], 'Appointment statistics retrieved successfully');
        
    } catch (error) {
        console.error('Get appointment stats error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve appointment statistics', 500);
    }
};

module.exports = {
    getAppointments,
    getUpcomingAppointments,
    getAppointmentById,
    addAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    getAppointmentStats
};