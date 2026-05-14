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

// GET /api/admin/reports/occupancy
// T-30 | Begüm Rana Türkoğlu | Sprint 3
// Query params: range = 'week' | 'month' (default: 'week')
const getOccupancyReport = async (req, res) => {
  try {
    const range = req.query.range === 'month' ? 30 : 7;

    // --- 1. Status summary (active / cancelled / completed) ---
    const [statusRows] = await pool.execute(`
      SELECT status, COUNT(*) AS count
      FROM reservations
      WHERE reservation_date >= CURDATE() - INTERVAL ? DAY
      GROUP BY status
    `, [range]);

    const statusSummary = { active: 0, cancelled: 0, completed: 0 };
    for (const row of statusRows) {
      if (row.status in statusSummary) statusSummary[row.status] = Number(row.count);
    }

    // --- 2. Daily occupancy (player_count per day) ---
    const [dailyRows] = await pool.execute(`
      SELECT
        DATE_FORMAT(reservation_date, '%Y-%m-%d') AS day,
        COALESCE(SUM(player_count), 0)            AS players
      FROM reservations
      WHERE reservation_date >= CURDATE() - INTERVAL ? DAY
        AND status = 'active'
      GROUP BY day
      ORDER BY day ASC
    `, [range]);

    // --- 3. Busiest hours (slot-level player counts) ---
    const [hourRows] = await pool.execute(`
      SELECT
        TIME_FORMAT(start_time, '%H:00') AS hour,
        COALESCE(SUM(player_count), 0)  AS players
      FROM reservations
      WHERE reservation_date >= CURDATE() - INTERVAL ? DAY
        AND status = 'active'
      GROUP BY hour
      ORDER BY players DESC
      LIMIT 5
    `, [range]);

    // --- 4. Total players in period ---
    const [totalRows] = await pool.execute(`
      SELECT COALESCE(SUM(player_count), 0) AS totalPlayers
      FROM reservations
      WHERE reservation_date >= CURDATE() - INTERVAL ? DAY
        AND status = 'active'
    `, [range]);

    // --- 5. Group reservation summary ---
    const [groupRows] = await pool.execute(`
      SELECT
        COUNT(*)                              AS totalGroups,
        COALESCE(SUM(current_count), 0)       AS totalGroupPlayers,
        COALESCE(AVG(current_count / NULLIF(party_size, 0) * 100), 0) AS avgFillRate
      FROM group_reservations
      WHERE reservation_date >= CURDATE() - INTERVAL ? DAY
        AND status IN ('open', 'closed')
    `, [range]);

    return res.status(200).json({
      range,
      statusSummary,
      dailyOccupancy: dailyRows,
      busiestHours: hourRows,
      totalPlayers: Number(totalRows[0].totalPlayers),
      groupSummary: {
        totalGroups: Number(groupRows[0].totalGroups),
        totalGroupPlayers: Number(groupRows[0].totalGroupPlayers),
        avgFillRate: Math.round(Number(groupRows[0].avgFillRate)),
      },
    });
  } catch (err) {
    console.error('[getOccupancyReport]', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { getAllReservations, approveReservation, cancelReservation, getOccupancyReport };
