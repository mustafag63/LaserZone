const pool = require('../config/db');

const Notification = {
  async createTable() {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        user_id       INT NOT NULL,
        type          ENUM('join_request','request_approved','request_rejected','group_full','group_cancelled') NOT NULL,
        title         VARCHAR(200) NOT NULL,
        body          VARCHAR(500),
        is_read       BOOLEAN NOT NULL DEFAULT FALSE,
        ref_group_id  INT,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  },

  async create({ userId, type, title, body = null, refGroupId = null }) {
    const [result] = await pool.execute(
      `INSERT INTO notifications (user_id, type, title, body, ref_group_id) VALUES (?, ?, ?, ?, ?)`,
      [userId, type, title, body, refGroupId]
    );
    return { id: result.insertId, userId, type, title, body, refGroupId, isRead: false };
  },

  async findByUser(userId, limit = 30) {
    const safeLimit = parseInt(limit) || 30;
    const [rows] = await pool.execute(
      `SELECT id, type, title, body, is_read AS isRead, ref_group_id AS refGroupId, created_at AS createdAt
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ${safeLimit}`,
      [userId]
    );
    return rows;
  },

  async markAllRead(userId) {
    await pool.execute(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
  },

  async markRead(id, userId) {
    await pool.execute(
      `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
  },
};

module.exports = Notification;
