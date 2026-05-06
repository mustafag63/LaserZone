// T-26 | Eylül Sena Altunsaray | Sprint 2
// Admin approve/cancel operations

const pool = require('../config/db');

// GET /api/admin/reservations
const getAllReservations = async (req, res) => {
  try {
    const { status, date } = req.query;

    let sql = `
      SELECT r.id, r.reservation_name AS name, r.reservation_date AS date,
             r.start_time AS startTime, r.end_time AS endTime,
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

    const [result] = await pool.execute(
      `UPDATE reservations SET status = 'active' WHERE id = ? AND status = 'cancelled'`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Reservation not found or already active.' });
    }

    return res.status(200).json({ message: 'Reservation approved successfully.' });
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

    const [result] = await pool.execute(
      `UPDATE reservations SET status = 'cancelled' WHERE id = ? AND status = 'active'`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Reservation not found or already cancelled.' });
    }

    return res.status(200).json({ message: 'Reservation cancelled successfully.' });
  } catch (err) {
    console.error('[adminCancelReservation]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getAllReservations, approveReservation, cancelReservation };
