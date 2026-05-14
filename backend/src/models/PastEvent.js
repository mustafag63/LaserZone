const pool = require('../config/db');

function currentDateTime() {
  const now = new Date();
  return {
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().slice(0, 8),
  };
}

const PastEvent = {
  async createTable() {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS past_events (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        source_type  ENUM('reservation', 'group') NOT NULL,
        source_id    INT NOT NULL,
        user_id      INT NOT NULL,
        event_name   VARCHAR(100) NOT NULL,
        event_date   DATE NOT NULL,
        start_time   TIME NOT NULL,
        end_time     TIME NOT NULL,
        player_count INT NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_past_event (source_type, source_id, user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  },

  async syncCompleted(now = currentDateTime()) {
    await this.createTable();

    await pool.execute(
      `INSERT IGNORE INTO past_events
         (source_type, source_id, user_id, event_name, event_date, start_time, end_time, player_count)
       SELECT 'reservation', r.id, r.user_id, r.reservation_name, r.reservation_date,
              r.start_time, r.end_time, r.player_count
       FROM reservations r
       WHERE r.status = 'active'
         AND (r.reservation_date < ? OR (r.reservation_date = ? AND r.end_time <= ?))`,
      [now.date, now.date, now.time]
    );

    await pool.execute(
      `UPDATE reservations
       SET status = 'completed'
       WHERE status = 'active'
         AND (reservation_date < ? OR (reservation_date = ? AND end_time <= ?))`,
      [now.date, now.date, now.time]
    );

    await pool.execute(
      `INSERT IGNORE INTO past_events
         (source_type, source_id, user_id, event_name, event_date, start_time, end_time, player_count)
       SELECT 'group', g.id, g.leader_user_id, g.reservation_name, g.reservation_date,
              g.start_time, g.end_time, g.current_count
       FROM group_reservations g
       WHERE g.status IN ('open', 'closed')
         AND (g.reservation_date < ? OR (g.reservation_date = ? AND g.end_time <= ?))`,
      [now.date, now.date, now.time]
    );
  },

  async findByUserId(userId) {
    await this.syncCompleted();

    const [rows] = await pool.execute(
      `SELECT id, source_type AS sourceType, source_id AS sourceId,
              event_name AS name,
              DATE_FORMAT(event_date, '%Y-%m-%d') AS date,
              TIME_FORMAT(start_time, '%H:%i') AS startTime,
              TIME_FORMAT(end_time, '%H:%i') AS endTime,
              player_count AS players, completed_at AS completedAt
       FROM past_events
       WHERE user_id = ?
       ORDER BY event_date DESC, start_time DESC`,
      [userId]
    );

    return rows;
  },
};

module.exports = PastEvent;
