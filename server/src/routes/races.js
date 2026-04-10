const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAllRaces, getActiveRace, getRaceDetail,
  createRace, updateRaceStatus, addDriverToRace, getHallOfFame
} = require('../controllers/raceController');

router.get('/', getAllRaces);
router.get('/active', getActiveRace);        
router.get('/hall-of-fame', getHallOfFame);  
router.get('/:id', getRaceDetail);
router.post('/', protect, createRace);
router.patch('/:id/status', protect, updateRaceStatus);
router.post('/:id/drivers', protect, addDriverToRace);

module.exports = router;