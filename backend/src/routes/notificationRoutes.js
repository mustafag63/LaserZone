const express = require('express');
const router = express.Router();
const { list, markAllRead, markRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',              protect, list);
router.put('/read-all',      protect, markAllRead);
router.put('/:id/read',      protect, markRead);

module.exports = router;
