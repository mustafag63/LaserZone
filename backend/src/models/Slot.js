const pool = require('../config/db');

// Default operating hours and slot config
const DEFAULT_OPEN_HOUR = 10;  // 10:00
const DEFAULT_CLOSE_HOUR = 22; // 22:00
const MAX_CAPACITY = 20;       // players per slot

const Slot = {
  /**
   * Create reservations table if it doesn't exist.
   * Basic schema for availability checks; will be expanded in T-07/T-08.
   */
  async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS reservations (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        user_id        INT NOT NULL,
        reservation_date DATE NOT NULL,
        start_time     TIME NOT NULL,
        end_time       TIME NOT NULL,
        player_count   INT NOT NULL DEFAULT 1,
        status         ENUM('active', 'cancelled') NOT NULL DEFAULT 'active',
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
    await pool.execute(sql);
  },

  /**
   * Generate all possible time slots for a given date.
   */
  generateSlots(date) {
    const slots = [];
    for (let hour = DEFAULT_OPEN_HOUR; hour < DEFAULT_CLOSE_HOUR; hour++) {
      const startTime = `${String(hour).padStart(2, '0')}:00:00`;
      const endTime = `${String(hour + 1).padStart(2, '0')}:00:00`;
      slots.push({ date, start_time: startTime, end_time: endTime });
    }
    return slots;
  },

  /**
   * Get booked player counts per slot for a given date.
   */
  async getBookedCounts(date) {
    const sql = `
      SELECT start_time, end_time, COALESCE(SUM(player_count), 0) AS booked
      FROM reservations
      WHERE reservation_date = ? AND status = 'active'
      GROUP BY start_time, end_time
    `;
    const [rows] = await pool.execute(sql, [date]);
    return rows;
  },

  /**
   * Get availability for a single date.
   * Returns array of slots with capacity info.
   */
  async getAvailability(date) {
    const slots = this.generateSlots(date);
    const bookedRows = await this.getBookedCounts(date);

    const bookedMap = {};
    for (const row of bookedRows) {
      const key = `${row.start_time}-${row.end_time}`;
      bookedMap[key] = Number(row.booked);
    }

    return slots.map(slot => {
      const key = `${slot.start_time}-${slot.end_time}`;
      const booked = bookedMap[key] || 0;
      const available = MAX_CAPACITY - booked;
      return {
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_capacity: MAX_CAPACITY,
        booked,
        available,
        is_available: available > 0,
      };
    });
  },

  /**
   * Get availability for a date range (inclusive).
   */
  async getAvailabilityRange(startDate, endDate) {
    const result = {};
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      result[dateStr] = await this.getAvailability(dateStr);
    }

    return result;
  },
};

module.exports = Slot;
