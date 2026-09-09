const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/authMiddleware');
const {
    getAppointments,
    getUpcomingAppointments,
    getAppointmentById,
    addAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    getAppointmentStats
} = require('../Controllers/appointmentController');

router.use(protect);

router.get('/', getAppointments);
router.get('/upcoming', getUpcomingAppointments);
router.get('/stats', getAppointmentStats);
router.get('/:id', getAppointmentById);
router.post('/', addAppointment);
router.put('/:id', updateAppointment);
router.put('/:id/status', updateAppointmentStatus);
router.delete('/:id', deleteAppointment);

module.exports = router;