const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAllDrivers, getDriver, createDriver, updateDriver, deleteDriver
} = require('../controllers/driverController');

router.get('/', getAllDrivers);
router.get('/:id', getDriver);
router.post('/', protect, createDriver);
router.put('/:id', protect, updateDriver);
router.delete('/:id', protect, deleteDriver);

module.exports = router;