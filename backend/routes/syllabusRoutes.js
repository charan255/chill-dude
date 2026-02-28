const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabusController');

// Intelligence Engine Endpoints
router.get('/weak-subjects', syllabusController.getWeakSubjects);
router.get('/focus-recommendation', syllabusController.getFocusRecommendation);
router.get('/progress-trend', syllabusController.getProgressTrend);
router.get('/:subjectId/smart-plan', syllabusController.getSmartChapterPlan);

module.exports = router;
