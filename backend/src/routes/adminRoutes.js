// T-26 | Eylül Sena Altunsaray | Sprint 2

const express = require('express');
const router = express.Router();
const { getAllReservations, approveReservation, cancelReservation } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/reservations',             protect, adminOnly, getAllReservations);
router.put('/reservations/:id/approve', protect, adminOnly, approveReservation);
router.put('/reservations/:id/cancel',  protect, adminOnly, cancelReservation);

module.exports = router;
