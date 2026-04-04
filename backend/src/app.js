require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes        = require('./routes/authRoutes');
const slotRoutes        = require('./routes/slotRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const groupRoutes       = require('./routes/groupRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',         authRoutes);
app.use('/api/slots',        slotRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/groups',       groupRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

// Only start listening when run directly (not during tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`LaserZone API running on port ${PORT}`);
  });
}

module.exports = app;
