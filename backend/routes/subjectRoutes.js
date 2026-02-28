const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');

// Subjects
router.get('/', subjectController.getSubjects);
router.post('/', subjectController.createSubject);
router.put('/:id', subjectController.updateSubject);
router.delete('/:id', subjectController.deleteSubject);

// Chapters
router.post('/:subjectId/chapters', subjectController.createChapter);

// Assignments
router.post('/:subjectId/assignments', subjectController.createAssignment);

module.exports = router;
