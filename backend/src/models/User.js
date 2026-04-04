const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  // Create users table (run once during setup)
  createTable: async () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        username    VARCHAR(50) NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        role        ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(sql);
  },

  findByUsername: async (username) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      'SELECT id, username, role, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  create: async ({ username, password, role = 'customer' }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );
    return { id: result.insertId, username, role };
  },

  verifyPassword: async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
};

module.exports = User;
