// T-08 | Mustafa Göçmen | Sprint 1
// Reservation creation API with conflict check

const Reservation = require('../models/Reservation');
const Slot = require('../models/Slot');
const PastEvent = require('../models/PastEvent');

// POST /api/reservations
const create = async (req, res) => {
  try {
    const { name, date, time, players } = req.body;
    const userId = req.user.id;

    if (!name || !date || !time || players === undefined) {
      return res.status(400).json({ message: 'name, date, time and players are required.' });
    }

    const playerCount = parseInt(players);
    if (isNaN(playerCount) || playerCount < 3 || playerCount > 20) {
      return res.status(400).json({ message: 'Players must be between 3 and 20.' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ message: 'Reservation name must be at least 2 characters.' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return res.status(400).json({ message: 'Reservation date must be today or in the future.' });
    }

    const slotValidation = await Slot.validateBookableTime(date, time);
    if (!slotValidation.valid) {
      return res.status(400).json({ message: slotValidation.message });
    }

    const reservation = await Reservation.create({
      userId,
      name: name.trim(),
      date,
      startTime: time,
      playerCount,
    });

    if (!reservation) {
      return res.status(409).json({ message: 'This slot is fully booked. Please choose another time.' });
    }

    return res.status(201).json({
      message: 'Reservation created successfully.',
      reservation,
    });
  } catch (err) {
    console.error('[createReservation]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/reservations/my
const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.findByUserId(req.user.id);
    return res.status(200).json({ reservations });
  } catch (err) {
    console.error('[getMyReservations]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET /api/reservations/history
const getHistory = async (req, res) => {
  try {
    const events = await PastEvent.findByUserId(req.user.id);
    return res.status(200).json({ events });
  } catch (err) {
    console.error('[getReservationHistory]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// DELETE /api/reservations/:id
const cancel = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid reservation ID.' });
    }

    const cancelled = await Reservation.cancel(id, req.user.id);
    if (!cancelled) {
      return res.status(404).json({ message: 'Reservation not found or already cancelled.' });
    }

    return res.status(200).json({ message: 'Reservation cancelled successfully.' });
  } catch (err) {
    console.error('[cancelReservation]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/reservations/:id
const update = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid reservation ID.' });

    const { date, time, players } = req.body;
    if (!date || !time || players === undefined) {
      return res.status(400).json({ message: 'date, time and players are required.' });
    }

    const playerCount = parseInt(players);
    if (isNaN(playerCount) || playerCount < 3 || playerCount > 20) {
      return res.status(400).json({ message: 'Players must be between 3 and 20.' });
    }

    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return res.status(400).json({ message: 'Reservation date must be today or in the future.' });
    }

    const slotValidation = await Slot.validateBookableTime(date, time);
    if (!slotValidation.valid) {
      return res.status(400).json({ message: slotValidation.message });
    }

    const result = await Reservation.update(id, req.user.id, { date, startTime: time, playerCount });

    if (result === null) return res.status(409).json({ message: 'This slot is fully booked. Please choose another time.' });
    if (result === false) return res.status(404).json({ message: 'Reservation not found or already cancelled.' });

    return res.status(200).json({ message: 'Reservation updated successfully.', reservation: result });
  } catch (err) {
    console.error('[updateReservation]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { create, getMyReservations, getHistory, cancel, update };
