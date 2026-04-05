const mysql2 = require('mysql2/promise');

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'laserzone',
  waitForConnections: true,
  connectionLimit: 10,
};

if (process.env.DB_SOCKET) {
  poolConfig.socketPath = process.env.DB_SOCKET;
}

const pool = mysql2.createPool(poolConfig);

module.exports = pool;
