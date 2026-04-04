const express = require('express');
const router = express.Router();
const { create, getMyReservations, cancel } = require('../controllers/reservationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',     protect, create);
router.get('/my',    protect, getMyReservations);
router.delete('/:id', protect, cancel);

module.exports = router;
