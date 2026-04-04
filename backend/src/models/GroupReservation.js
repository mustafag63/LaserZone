// T-12 | Mustafa Göçmen | Sprint 1
// Group reservation model

const pool = require('../config/db');

const GroupReservation = {
  async createTables() {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS group_reservations (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        leader_user_id    INT NOT NULL,
        reservation_name  VARCHAR(100) NOT NULL,
        reservation_date  DATE NOT NULL,
        start_time        TIME NOT NULL,
        end_time          TIME NOT NULL,
        party_size        INT NOT NULL,
        current_count     INT NOT NULL DEFAULT 0,
        status            ENUM('open','closed','cancelled') NOT NULL DEFAULT 'open',
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leader_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS join_requests (
        id                      INT AUTO_INCREMENT PRIMARY KEY,
        group_reservation_id    INT NOT NULL,
        user_id                 INT NOT NULL,
        player_count            INT NOT NULL,
        status                  ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
        created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_request (group_reservation_id, user_id),
        FOREIGN KEY (group_reservation_id) REFERENCES group_reservations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  },

  // Create a new open group reservation
  async create({ leaderUserId, name, date, startTime, partySize, leaderPlayerCount }) {
    const startTimeFull = startTime.length === 5 ? `${startTime}:00` : startTime;
    const endHour = String(parseInt(startTime.split(':')[0]) + 1).padStart(2, '0');
    const endTime = `${endHour}:00:00`;

    const [result] = await pool.execute(
      `INSERT INTO group_reservations
         (leader_user_id, reservation_name, reservation_date, start_time, end_time, party_size, current_count)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [leaderUserId, name, date, startTimeFull, endTime, partySize, leaderPlayerCount]
    );

    return {
      id: result.insertId,
      leaderUserId,
      name,
      date,
      startTime: startTimeFull,
      endTime,
      partySize,
      currentCount: leaderPlayerCount,
      status: 'open',
    };
  },

  // List all open groups (for browsing)
  async findOpen() {
    const [rows] = await pool.execute(
      `SELECT g.id, g.reservation_name AS name, g.reservation_date AS date,
              g.start_time AS startTime, g.end_time AS endTime,
              g.party_size AS partySize, g.current_count AS currentCount,
              g.status, g.created_at,
              u.username AS leaderUsername
       FROM group_reservations g
       JOIN users u ON u.id = g.leader_user_id
       WHERE g.status = 'open'
       ORDER BY g.reservation_date ASC, g.start_time ASC`
    );
    return rows;
  },

  // Get single group by id
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT g.id, g.leader_user_id AS leaderUserId,
              g.reservation_name AS name, g.reservation_date AS date,
              g.start_time AS startTime, g.end_time AS endTime,
              g.party_size AS partySize, g.current_count AS currentCount,
              g.status, g.created_at,
              u.username AS leaderUsername
       FROM group_reservations g
       JOIN users u ON u.id = g.leader_user_id
       WHERE g.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  // Get groups led by a specific user
  async findByLeader(leaderUserId) {
    const [rows] = await pool.execute(
      `SELECT id, reservation_name AS name, reservation_date AS date,
              start_time AS startTime, end_time AS endTime,
              party_size AS partySize, current_count AS currentCount,
              status, created_at
       FROM group_reservations
       WHERE leader_user_id = ? AND status != 'cancelled'
       ORDER BY reservation_date ASC, start_time ASC`,
      [leaderUserId]
    );
    return rows;
  },

  // Cancel a group (leader only)
  async cancel(id, leaderUserId) {
    const [result] = await pool.execute(
      `UPDATE group_reservations SET status = 'cancelled'
       WHERE id = ? AND leader_user_id = ? AND status = 'open'`,
      [id, leaderUserId]
    );
    return result.affectedRows > 0;
  },

  // Update current_count and auto-close when full
  async updateCount(id, newCount, partySize) {
    const newStatus = newCount >= partySize ? 'closed' : 'open';
    await pool.execute(
      `UPDATE group_reservations SET current_count = ?, status = ? WHERE id = ?`,
      [newCount, newStatus, id]
    );
    return newStatus;
  },
};

module.exports = GroupReservation;
