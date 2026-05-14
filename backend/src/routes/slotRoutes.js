const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public endpoint — no auth required for browsing availability
router.get('/availability', slotController.getAvailability);

// Admin slot management
router.get('/settings', protect, adminOnly, slotController.getSettings);
router.put('/settings', protect, adminOnly, slotController.updateSettings);
router.get('/blocks', protect, adminOnly, slotController.getBlocks);
router.post('/blocks', protect, adminOnly, slotController.createBlock);
router.delete('/blocks/:id', protect, adminOnly, slotController.deleteBlock);

module.exports = router;
