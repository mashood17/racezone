const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { logLap, getLapsForEntry, deleteLastLap } = require('../controllers/lapController');

router.post('/', protect, logLap);
router.get('/entry/:entry_id', getLapsForEntry);
router.delete('/entry/:entry_id/last', protect, deleteLastLap);

module.exports = router;