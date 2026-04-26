require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const authRoutes          = require('./routes/authRoutes');
const slotRoutes          = require('./routes/slotRoutes');
const reservationRoutes   = require('./routes/reservationRoutes');
const groupRoutes         = require('./routes/groupRoutes');
const notificationRoutes  = require('./routes/notificationRoutes');
const Notification        = require('./models/Notification');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',          authRoutes);
app.use('/api/slots',         slotRoutes);
app.use('/api/reservations',  reservationRoutes);
app.use('/api/groups',        groupRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5001;

// Only start listening when run directly (not during tests)
if (require.main === module) {
  pool.getConnection()
    .then(async conn => {
      conn.release();
      console.log('Database connection OK');
      await Notification.createTable();
      app.listen(PORT, () => {
        console.log(`LaserZone API running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('---------------------------------------------');
      console.error('DATABASE CONNECTION FAILED — server not started');
      console.error(`  DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
      console.error(`  DB_USER: ${process.env.DB_USER || 'root'}`);
      console.error(`  DB_NAME: ${process.env.DB_NAME || 'laserzone'}`);
      console.error('');
      console.error('Fix: copy backend/.env.example to backend/.env');
      console.error('     and fill in your database credentials.');
      console.error('---------------------------------------------');
      console.error(err.message);
      process.exit(1);
    });
}

module.exports = app;
