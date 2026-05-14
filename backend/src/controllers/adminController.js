// T-26 | Eylül Sena Altunsaray | Sprint 2
// Admin approve/cancel operations

const pool = require('../config/db');

const MAX_CAPACITY = 20;

async function findReservation(id) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.user_id AS userId, r.reservation_name AS name,
            DATE_FORMAT(r.reservation_date, '%Y-%m-%d') AS date,
            TIME_FORMAT(r.start_time, '%H:%i') AS startTime,
            TIME_FORMAT(r.end_time, '%H:%i') AS endTime,
            r.player_count AS players, r.status, r.created_at,
            u.username
     FROM reservations r
     JOIN users u ON r.user_id = u.id
     WHERE r.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function getBookedCount(date, startTime, excludeReservationId) {
  const startTimeFull = startTime.length === 5 ? `${startTime}:00` : startTime;

  const [reservations] = await pool.execute(
    `SELECT COALESCE(SUM(player_count), 0) AS booked
     FROM reservations
     WHERE reservation_date = ? AND start_time = ? AND status = 'active' AND id != ?`,
    [date, startTimeFull, excludeReservationId]
  );

  const [groups] = await pool.execute(
    `SELECT COALESCE(SUM(current_count), 0) AS booked
     FROM group_reservations
     WHERE reservation_date = ? AND start_time = ? AND status IN ('open', 'closed')`,
    [date, startTimeFull]
  );

  return Number(reservations[0].booked) + Number(groups[0].booked);
}

// GET /api/admin/reservations
const getAllReservations = async (req, res) => {
  try {
    const { status, date } = req.query;

    let sql = `
      SELECT r.id, r.reservation_name AS name,
             DATE_FORMAT(r.reservation_date, '%Y-%m-%d') AS date,
             TIME_FORMAT(r.start_time, '%H:%i') AS startTime,
             TIME_FORMAT(r.end_time, '%H:%i') AS endTime,
             r.player_count AS players, r.status, r.created_at,
             u.username
      FROM reservations r
      JOIN users u ON r.user_id = u.id
    `;
    const params = [];

    const conditions = [];
    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }
    if (date) {
      conditions.push('r.reservation_date = ?');
      params.push(date);
    }
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY r.reservation_date ASC, r.start_time ASC';

    const [rows] = await pool.execute(sql, params);
    return res.status(200).json({ reservations: rows });
  } catch (err) {
    console.error('[adminGetAllReservations]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/admin/reservations/:id/approve
const approveReservation = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid reservation ID.' });
    }

    const reservation = await findReservation(id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    if (reservation.status === 'active') {
      return res.status(409).json({ message: 'Reservation is already active.' });
    }
    if (reservation.status === 'completed') {
      return res.status(409).json({ message: 'Completed reservations cannot be approved.' });
    }

    const booked = await getBookedCount(reservation.date, reservation.startTime, id);
    if (booked + reservation.players > MAX_CAPACITY) {
      return res.status(409).json({ message: 'Cannot approve reservation because the slot is full.' });
    }

    const [result] = await pool.execute(
      `UPDATE reservations SET status = 'active' WHERE id = ? AND status != 'active' AND status != 'completed'`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({ message: 'Reservation could not be approved.' });
    }

    return res.status(200).json({
      message: 'Reservation approved successfully.',
      reservation: { ...reservation, status: 'active' },
    });
  } catch (err) {
    console.error('[adminApproveReservation]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// PUT /api/admin/reservations/:id/cancel
const cancelReservation = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid reservation ID.' });
    }

    const reservation = await findReservation(id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(409).json({ message: 'Reservation is already cancelled.' });
    }
    if (reservation.status === 'completed') {
      return res.status(409).json({ message: 'Completed reservations cannot be cancelled.' });
    }

    const [result] = await pool.execute(
      `UPDATE reservations SET status = 'cancelled' WHERE id = ? AND status != 'cancelled' AND status != 'completed'`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({ message: 'Reservation could not be cancelled.' });
    }

    return res.status(200).json({
      message: 'Reservation cancelled successfully.',
      reservation: { ...reservation, status: 'cancelled' },
    });
  } catch (err) {
    console.error('[adminCancelReservation]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getAllReservations, approveReservation, cancelReservation };
