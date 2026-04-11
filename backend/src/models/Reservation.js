// T-08 | Mustafa Göçmen | Sprint 1
// Reservation model — create with conflict check, list, cancel

const pool = require('../config/db');

const MAX_CAPACITY = 20;

const Reservation = {
  // POST /api/reservations — create with conflict check
  async create({ userId, name, date, startTime, playerCount }) {
    // Normalise time: "14:00" → "14:00:00"
    const startTimeFull = startTime.length === 5 ? `${startTime}:00` : startTime;
    const endHour = String(parseInt(startTime.split(':')[0]) + 1).padStart(2, '0');
    const endTime = `${endHour}:00:00`;

    // Conflict check — sum active players for this slot
    const [rows] = await pool.execute(
      `SELECT COALESCE(SUM(player_count), 0) AS booked
       FROM reservations
       WHERE reservation_date = ? AND start_time = ? AND status = 'active'`,
      [date, startTimeFull]
    );

    const booked = Number(rows[0].booked);
    if (booked + playerCount > MAX_CAPACITY) {
      return null; // slot full
    }

    const [result] = await pool.execute(
      `INSERT INTO reservations
         (user_id, reservation_name, reservation_date, start_time, end_time, player_count)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, date, startTimeFull, endTime, playerCount]
    );

    return {
      id: result.insertId,
      userId,
      name,
      date,
      startTime: startTimeFull,
      endTime,
      playerCount,
      status: 'active',
    };
  },

  // GET /api/reservations/my
  async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT id, reservation_name AS name,
              DATE_FORMAT(reservation_date, '%Y-%m-%d') AS date,
              TIME_FORMAT(start_time, '%H:%i') AS startTime,
              TIME_FORMAT(end_time, '%H:%i') AS endTime,
              player_count AS players, status, created_at
       FROM reservations
       WHERE user_id = ? AND status = 'active'
       ORDER BY reservation_date ASC, start_time ASC`,
      [userId]
    );
    return rows;
  },

  // GET /api/reservations/:id
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, user_id, reservation_name AS name,
              DATE_FORMAT(reservation_date, '%Y-%m-%d') AS date,
              TIME_FORMAT(start_time, '%H:%i') AS startTime,
              TIME_FORMAT(end_time, '%H:%i') AS endTime,
              player_count AS players, status, created_at
       FROM reservations WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  // DELETE /api/reservations/:id (soft delete)
  async cancel(id, userId) {
    const [result] = await pool.execute(
      `UPDATE reservations SET status = 'cancelled'
       WHERE id = ? AND user_id = ? AND status = 'active'`,
      [id, userId]
    );
    return result.affectedRows > 0;
  },
};

module.exports = Reservation;
