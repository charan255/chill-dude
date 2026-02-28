const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');

router.patch('/:id', subjectController.updateChapter);
router.delete('/:id', subjectController.deleteChapter);

module.exports = router;
