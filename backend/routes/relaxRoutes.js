const express = require('express');
const router = express.Router();
const relaxController = require('../controllers/relaxController');

router.get('/stats', relaxController.getStats);
router.post('/session', relaxController.addSession);
router.get('/analytics', relaxController.getAnalytics);
router.get('/reflections', relaxController.getReflections);
router.post('/reflection', relaxController.addReflection);

module.exports = router;
