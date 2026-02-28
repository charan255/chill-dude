const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');

// Intelligence Engine Endpoints
router.get('/prioritized', assignmentController.getPrioritizedAssignments);
router.get('/workload-summary', assignmentController.getWorkloadSummary);
router.get('/:id/chunks', assignmentController.getAssignmentChunks);

// Standard Operations
router.put('/:id', assignmentController.updateAssignment);
router.patch('/:id', assignmentController.updateAssignment);
router.delete('/:id', assignmentController.deleteAssignment);

module.exports = router;
