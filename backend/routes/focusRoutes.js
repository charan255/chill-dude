const express = require('express');
const router = express.Router();
const focusController = require('../controllers/focusController');

router.get('/priority-tasks', focusController.getPriorityTasks);
router.get('/urgency', focusController.getUrgency);
router.get('/adaptive-plan', focusController.getAdaptivePlan);
router.get('/weekly-productivity', focusController.getWeeklyProductivity);

module.exports = router;
