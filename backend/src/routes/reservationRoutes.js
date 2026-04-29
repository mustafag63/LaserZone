const express = require('express');
const router = express.Router();
const { create, getMyReservations, cancel, update } = require('../controllers/reservationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',      protect, create);
router.get('/my',     protect, getMyReservations);
router.put('/:id',    protect, update);
router.delete('/:id', protect, cancel);

module.exports = router;
