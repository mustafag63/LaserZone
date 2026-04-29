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
        id               INT AUTO_INCREMENT PRIMARY KEY,
        user_id          INT NOT NULL,
        reservation_name VARCHAR(100) NOT NULL DEFAULT '',
        reservation_date DATE NOT NULL,
        start_time       TIME NOT NULL,
        end_time         TIME NOT NULL,
        player_count     INT NOT NULL DEFAULT 3,
        status           ENUM('active', 'cancelled') NOT NULL DEFAULT 'active',
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
      for (const minute of [0, 30]) {
        const startH = String(hour).padStart(2, '0');
        const startM = String(minute).padStart(2, '0');
        const endMinute = minute + 30;
        const endH = endMinute === 60 ? String(hour + 1).padStart(2, '0') : startH;
        const endM = endMinute === 60 ? '00' : '30';
        slots.push({
          date,
          start_time: `${startH}:${startM}:00`,
          end_time: `${endH}:${endM}:00`,
        });
      }
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
   * Get start_times that already have an active group reservation.
   * A slot with a group is fully taken — no other group or reservation allowed.
   */
  async getGroupTakenSlots(date) {
    const [rows] = await pool.execute(
      `SELECT start_time FROM group_reservations
       WHERE reservation_date = ? AND status IN ('open', 'closed')`,
      [date]
    );
    const taken = new Set();
    for (const row of rows) taken.add(row.start_time);
    return taken;
  },

  /**
   * Get availability for a single date.
   * A slot is unavailable if it already has a group OR capacity is exhausted.
   */
  async getAvailability(date) {
    const slots = this.generateSlots(date);
    const bookedRows = await this.getBookedCounts(date);
    const groupTaken = await this.getGroupTakenSlots(date);

    const bookedMap = {};
    for (const row of bookedRows) {
      const key = `${row.start_time}-${row.end_time}`;
      bookedMap[key] = Number(row.booked);
    }

    return slots.map(slot => {
      const key = `${slot.start_time}-${slot.end_time}`;
      const booked = bookedMap[key] || 0;
      const hasGroup = groupTaken.has(slot.start_time);
      const available = hasGroup ? 0 : MAX_CAPACITY - booked;
      return {
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_capacity: MAX_CAPACITY,
        booked: hasGroup ? MAX_CAPACITY : booked,
        available,
        is_available: !hasGroup && available > 0,
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
