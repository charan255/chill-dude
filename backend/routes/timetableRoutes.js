const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');

// Intelligence Endpoints
router.get('/available-slots', timetableController.getAvailableSlots);
router.get('/weekly-heatmap', timetableController.getWeeklyHeatmap);
router.get('/conflicts', timetableController.getConflicts);

// Standard Operations
router.get('/', timetableController.getTimetable);
router.post('/', timetableController.createTimetableEntry);
router.put('/:id', timetableController.updateTimetableEntry);
router.delete('/:id', timetableController.deleteTimetableEntry);

module.exports = router;
