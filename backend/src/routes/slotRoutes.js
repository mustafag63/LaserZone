const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');

// Public endpoint — no auth required for browsing availability
router.get('/availability', slotController.getAvailability);

module.exports = router;
