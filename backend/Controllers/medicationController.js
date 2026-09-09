const { pool } = require('../Config/db');
const ResponseFormatter = require('../Utils/responseFormatter');
const { checkDrugInteractionsLocally } = require('../Services/drugInteractionService');

// @desc    Get all medications
// @route   GET /api/medications
// @access  Private
const getMedications = async (req, res) => {
    try {
        const [medications] = await pool.execute(
            `SELECT id, name, dosage, frequency, time_of_day, start_date, end_date, status, notes 
             FROM medications 
             WHERE user_id = ? AND status = 'active'
             ORDER BY time_of_day ASC`,
            [req.user.id]
        );
        
        return ResponseFormatter.list(res, medications, null, null, null, 'Medications retrieved successfully');
        
    } catch (error) {
        console.error('Get medications error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve medications', 500);
    }
};

// @desc    Get medication by ID
// @route   GET /api/medications/:id
// @access  Private
const getMedicationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [medications] = await pool.execute(
            `SELECT id, name, dosage, frequency, time_of_day, start_date, end_date, status, notes 
             FROM medications 
             WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );
        
        if (medications.length === 0) {
            return ResponseFormatter.notFound(res, 'Medication');
        }
        
        return ResponseFormatter.success(res, medications[0], 'Medication retrieved successfully');
        
    } catch (error) {
        console.error('Get medication error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve medication', 500);
    }
};

// @desc    Add new medication
// @route   POST /api/medications
// @access  Private
const addMedication = async (req, res) => {
    try {
        const { name, dosage, frequency, time_of_day, start_date, end_date, notes } = req.body;
        
        if (!name) {
            return ResponseFormatter.validationError(res, { name: 'Medication name is required' });
        }
        
        const [result] = await pool.execute(
            `INSERT INTO medications (user_id, name, dosage, frequency, time_of_day, start_date, end_date, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, name, dosage, frequency, time_of_day, start_date, end_date, notes]
        );
        
        const [newMedication] = await pool.execute(
            'SELECT id, name, dosage, frequency, time_of_day, status FROM medications WHERE id = ?',
            [result.insertId]
        );
        
        return ResponseFormatter.created(res, newMedication[0], 'Medication added successfully');
        
    } catch (error) {
        console.error('Add medication error:', error);
        return ResponseFormatter.error(res, 'Failed to add medication', 500);
    }
};

// @desc    Update medication
// @route   PUT /api/medications/:id
// @access  Private
const updateMedication = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, dosage, frequency, time_of_day, start_date, end_date, notes, status } = req.body;
        
        const [existing] = await pool.execute(
            'SELECT id FROM medications WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        
        if (existing.length === 0) {
            return ResponseFormatter.notFound(res, 'Medication');
        }
        
        const updates = [];
        const values = [];
        
        if (name) { updates.push('name = ?'); values.push(name); }
        if (dosage) { updates.push('dosage = ?'); values.push(dosage); }
        if (frequency) { updates.push('frequency = ?'); values.push(frequency); }
        if (time_of_day) { updates.push('time_of_day = ?'); values.push(time_of_day); }
        if (start_date) { updates.push('start_date = ?'); values.push(start_date); }
        if (end_date) { updates.push('end_date = ?'); values.push(end_date); }
        if (notes) { updates.push('notes = ?'); values.push(notes); }
        if (status) { updates.push('status = ?'); values.push(status); }
        
        if (updates.length === 0) {
            return ResponseFormatter.badRequest(res, 'No fields to update');
        }
        
        values.push(id);
        values.push(req.user.id);
        
        await pool.execute(
            `UPDATE medications SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );
        
        const [updated] = await pool.execute(
            'SELECT id, name, dosage, frequency, time_of_day, status FROM medications WHERE id = ?',
            [id]
        );
        
        return ResponseFormatter.success(res, updated[0], 'Medication updated successfully');
        
    } catch (error) {
        console.error('Update medication error:', error);
        return ResponseFormatter.error(res, 'Failed to update medication', 500);
    }
};

// @desc    Update medication status
// @route   PUT /api/medications/:id/status
// @access  Private
const updateMedicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['active', 'completed', 'paused'].includes(status)) {
            return ResponseFormatter.validationError(res, { status: 'Invalid status value' });
        }
        
        const [result] = await pool.execute(
            `UPDATE medications SET status = ? WHERE id = ? AND user_id = ?`,
            [status, id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return ResponseFormatter.notFound(res, 'Medication');
        }
        
        return ResponseFormatter.success(res, { id, status }, 'Medication status updated successfully');
        
    } catch (error) {
        console.error('Update medication status error:', error);
        return ResponseFormatter.error(res, 'Failed to update medication status', 500);
    }
};

// @desc    Delete medication
// @route   DELETE /api/medications/:id
// @access  Private
const deleteMedication = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute(
            'DELETE FROM medications WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return ResponseFormatter.notFound(res, 'Medication');
        }
        
        return ResponseFormatter.success(res, { id }, 'Medication deleted successfully');
        
    } catch (error) {
        console.error('Delete medication error:', error);
        return ResponseFormatter.error(res, 'Failed to delete medication', 500);
    }
};

// @desc    Get medication statistics
// @route   GET /api/medications/stats
// @access  Private
const getMedicationStats = async (req, res) => {
    try {
        const [stats] = await pool.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused
             FROM medications 
             WHERE user_id = ?`,
            [req.user.id]
        );
        
        const adherence = stats[0].total > 0 
            ? Math.round((stats[0].active / stats[0].total) * 100) 
            : 0;
        
        return ResponseFormatter.success(res, {
            ...stats[0],
            adherenceRate: adherence,
            adherencePercentage: `${adherence}%`
        }, 'Medication statistics retrieved successfully');
        
    } catch (error) {
        console.error('Get medication stats error:', error);
        return ResponseFormatter.error(res, 'Failed to retrieve medication statistics', 500);
    }
};

// @desc    AI analysis for medication
// @route   POST /api/medications/analyze
// @access  Private
const analyzeMedicationAI = async (req, res) => {
    try {
        const { medicationId } = req.body;
        if (!medicationId) return ResponseFormatter.badRequest(res, 'medicationId مطلوب');

        const [meds] = await pool.execute(
            'SELECT * FROM medications WHERE id = ? AND user_id = ?',
            [medicationId, req.user.id]
        );
        if (meds.length === 0) return ResponseFormatter.notFound(res, 'Medication');

        const { analyzeMedication } = require('../Utils/medicationAI');
        const result = await analyzeMedication(meds[0], req.user);

        return ResponseFormatter.success(res, result, 'تم تحليل الدواء بنجاح');
    } catch (error) {
        console.error('Medication AI error:', error);
        return ResponseFormatter.error(res, 'فشل في تحليل الدواء', 500);
    }
};

// @desc    Check drug interactions locally
// @route   POST /api/medications/check-interactions-local
// @access  Private
const checkInteractionsLocal = async (req, res) => {
    try {
        const { medications } = req.body;

        if (!Array.isArray(medications) || medications.length < 2) {
            return res.json({
                safeToTake: true,
                hasInteractions: false,
                interactions: [],
                severity: 'none',
                recommendations: [],
                alternatives: []
            });
        }

        const result = await checkDrugInteractionsLocally(medications);
        return res.json(result);

    } catch (error) {
        console.error('Check interactions local error:', error);
        return ResponseFormatter.error(res, 'Failed to check drug interactions', 500);
    }
};

module.exports = {
    getMedications,
    getMedicationById,
    addMedication,
    updateMedication,
    updateMedicationStatus,
    deleteMedication,
    getMedicationStats,
    analyzeMedicationAI,
    checkInteractionsLocal
};
