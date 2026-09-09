const { pool } = require('../Config/db');
const ResponseFormatter = require('../Utils/responseFormatter');

// @desc    Get latest vitals for user
// @route   GET /api/vitals/latest
// @access  Private
const getLatestVitals = async (req, res) => {
    try {
        const [vitals] = await pool.execute(
            `SELECT id, blood_sugar, blood_pressure_systolic, blood_pressure_diastolic, 
                    heart_rate, temperature, pain_level, recorded_date, recorded_time, notes
             FROM vitals 
             WHERE user_id = ? 
             ORDER BY recorded_date DESC, recorded_time DESC 
             LIMIT 1`,
            [req.user.id]
        );
        
        if (vitals.length === 0) {
            return ResponseFormatter.success(res, null, 'No vitals recorded yet');
        }
        
        return ResponseFormatter.success(res, vitals[0], 'Latest vitals retrieved successfully');
        
    } catch (error) {
        console.error('Get latest vitals error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve vitals', 500);
    }
};

// @desc    Get vitals history (last 7 days)
// @route   GET /api/vitals/history
// @access  Private
const getVitalsHistory = async (req, res) => {
    try {
        const [vitals] = await pool.execute(
            `SELECT id, blood_sugar, blood_pressure_systolic, blood_pressure_diastolic, 
                    heart_rate, temperature, recorded_date
             FROM vitals 
             WHERE user_id = ? AND recorded_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             ORDER BY recorded_date ASC`,
            [req.user.id]
        );
        
        return ResponseFormatter.list(res, vitals, null, 'Vitals history retrieved successfully');
        
    } catch (error) {
        console.error('Get vitals history error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve vitals history', 500);
    }
};

// @desc    Get vitals by date range
// @route   GET /api/vitals/range
// @access  Private
const getVitalsByDateRange = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        let query = `SELECT id, blood_sugar, blood_pressure_systolic, blood_pressure_diastolic, 
                            heart_rate, temperature, pain_level, recorded_date, recorded_time
                     FROM vitals 
                     WHERE user_id = ?`;
        const params = [req.user.id];
        
        if (start_date) {
            query += ` AND recorded_date >= ?`;
            params.push(start_date);
        }
        
        if (end_date) {
            query += ` AND recorded_date <= ?`;
            params.push(end_date);
        }
        
        query += ` ORDER BY recorded_date DESC, recorded_time DESC`;
        
        const [vitals] = await pool.execute(query, params);
        
        return ResponseFormatter.list(res, vitals, null, 'Vitals retrieved successfully');
        
    } catch (error) {
        console.error('Get vitals by date range error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve vitals', 500);
    }
};

// @desc    Add new vitals
// @route   POST /api/vitals
// @access  Private
const addVitals = async (req, res) => {
    try {
        const { 
            blood_sugar, 
            blood_pressure_systolic, 
            blood_pressure_diastolic, 
            heart_rate, 
            temperature, 
            pain_level,
            weight,
            height,
            notes
        } = req.body;
        
        const [result] = await pool.execute(
            `INSERT INTO vitals (user_id, blood_sugar, blood_pressure_systolic, blood_pressure_diastolic, 
                                 heart_rate, temperature, pain_level, weight, height, notes, recorded_date, recorded_time) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), CURTIME())`,
            [req.user.id, blood_sugar, blood_pressure_systolic, blood_pressure_diastolic, 
             heart_rate, temperature, pain_level, weight, height, notes]
        );
        
        const [newVitals] = await pool.execute(
            'SELECT id, blood_sugar, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature, recorded_date FROM vitals WHERE id = ?',
            [result.insertId]
        );
        
        return ResponseFormatter.created(res, newVitals[0], 'Vitals recorded successfully');
        
    } catch (error) {
        console.error('Add vitals error:', error);
        return ResponseFormatter.error(res, 'Failed to record vitals', 500);
    }
};

// @desc    Update vitals
// @route   PUT /api/vitals/:id
// @access  Private
const updateVitals = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            blood_sugar, 
            blood_pressure_systolic, 
            blood_pressure_diastolic, 
            heart_rate, 
            temperature, 
            pain_level,
            weight,
            height,
            notes
        } = req.body;
        
        const [existing] = await pool.execute(
            'SELECT id FROM vitals WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        
        if (existing.length === 0) {
            return ResponseFormatter.notFound(res, 'Vitals record');
        }
        
        const updates = [];
        const values = [];
        
        if (blood_sugar !== undefined) { updates.push('blood_sugar = ?'); values.push(blood_sugar); }
        if (blood_pressure_systolic !== undefined) { updates.push('blood_pressure_systolic = ?'); values.push(blood_pressure_systolic); }
        if (blood_pressure_diastolic !== undefined) { updates.push('blood_pressure_diastolic = ?'); values.push(blood_pressure_diastolic); }
        if (heart_rate !== undefined) { updates.push('heart_rate = ?'); values.push(heart_rate); }
        if (temperature !== undefined) { updates.push('temperature = ?'); values.push(temperature); }
        if (pain_level !== undefined) { updates.push('pain_level = ?'); values.push(pain_level); }
        if (weight !== undefined) { updates.push('weight = ?'); values.push(weight); }
        if (height !== undefined) { updates.push('height = ?'); values.push(height); }
        if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
        
        if (updates.length === 0) {
            return ResponseFormatter.badRequest(res, 'No fields to update');
        }
        
        values.push(id);
        values.push(req.user.id);
        
        await pool.execute(
            `UPDATE vitals SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );
        
        const [updated] = await pool.execute(
            'SELECT id, blood_sugar, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, temperature FROM vitals WHERE id = ?',
            [id]
        );
        
        return ResponseFormatter.success(res, updated[0], 'Vitals updated successfully');
        
    } catch (error) {
        console.error('Update vitals error:', error);
        return ResponseFormatter.error(res, 'Failed to update vitals', 500);
    }
};

// @desc    Delete vitals
// @route   DELETE /api/vitals/:id
// @access  Private
const deleteVitals = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute(
            'DELETE FROM vitals WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return ResponseFormatter.notFound(res, 'Vitals record');
        }
        
        return ResponseFormatter.success(res, { id }, 'Vitals record deleted successfully');
        
    } catch (error) {
        console.error('Delete vitals error:', error);
        return ResponseFormatter.error(res, 'Failed to delete vitals record', 500);
    }
};

// @desc    Get vitals statistics (averages)
// @route   GET /api/vitals/stats
// @access  Private
const getVitalsStats = async (req, res) => {
    try {
        const [stats] = await pool.execute(
            `SELECT 
                AVG(blood_sugar) as avg_blood_sugar,
                AVG(blood_pressure_systolic) as avg_blood_pressure_systolic,
                AVG(blood_pressure_diastolic) as avg_blood_pressure_diastolic,
                AVG(heart_rate) as avg_heart_rate,
                AVG(temperature) as avg_temperature,
                COUNT(*) as total_readings,
                MAX(recorded_date) as last_reading_date
             FROM vitals 
             WHERE user_id = ? AND recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
            [req.user.id]
        );
        
        return ResponseFormatter.success(res, stats[0], 'Vitals statistics retrieved successfully');
        
    } catch (error) {
        console.error('Get vitals stats error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve vitals statistics', 500);
    }
};

module.exports = {
    getLatestVitals,
    getVitalsHistory,
    getVitalsByDateRange,
    addVitals,
    updateVitals,
    deleteVitals,
    getVitalsStats
};