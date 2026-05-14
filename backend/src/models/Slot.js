const pool = require('../config/db');

const DEFAULT_SETTINGS = {
  open_time: '10:00:00',
  close_time: '22:00:00',
  slot_duration_minutes: 30,
  max_capacity: 20,
  is_open: true,
};

function normalizeTime(value) {
  if (!value) return value;
  if (typeof value === 'string') return value.length === 5 ? `${value}:00` : value;
  return String(value).slice(0, 8);
}

function timeToMinutes(value) {
  const [hours, minutes] = normalizeTime(value).split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

function normalizeSettings(row = {}) {
  return {
    open_time: normalizeTime(row.open_time || DEFAULT_SETTINGS.open_time),
    close_time: normalizeTime(row.close_time || DEFAULT_SETTINGS.close_time),
    slot_duration_minutes: Number(row.slot_duration_minutes || DEFAULT_SETTINGS.slot_duration_minutes),
    max_capacity: Number(row.max_capacity || DEFAULT_SETTINGS.max_capacity),
    is_open: row.is_open === undefined ? DEFAULT_SETTINGS.is_open : Boolean(row.is_open),
  };
}

function overlaps(startA, endA, startB, endB) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(endA) > timeToMinutes(startB);
}

const Slot = {
  /**
   * Create reservations table if it doesn't exist.
   * Basic schema for availability checks; will be expanded in T-07/T-08.
   */
  async createTables() {
    await pool.execute(`
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
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS slot_settings (
        id                    TINYINT PRIMARY KEY DEFAULT 1,
        open_time             TIME NOT NULL DEFAULT '10:00:00',
        close_time            TIME NOT NULL DEFAULT '22:00:00',
        slot_duration_minutes INT NOT NULL DEFAULT 30,
        max_capacity          INT NOT NULL DEFAULT 20,
        is_open               BOOLEAN NOT NULL DEFAULT TRUE,
        updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.execute(`
      INSERT IGNORE INTO slot_settings
        (id, open_time, close_time, slot_duration_minutes, max_capacity, is_open)
      VALUES (1, '10:00:00', '22:00:00', 30, 20, TRUE)
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS slot_blocks (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        block_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time   TIME NOT NULL,
        reason     VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_slot_block (block_date, start_time, end_time)
      )
    `);
  },

  async createTable() {
    await this.createTables();
  },

  async getSettings() {
    const [rows] = await pool.execute(
      `SELECT open_time, close_time, slot_duration_minutes, max_capacity, is_open
       FROM slot_settings
       WHERE id = 1`
    );
    return normalizeSettings(rows[0]);
  },

  async updateSettings({ openTime, closeTime, slotDurationMinutes, maxCapacity, isOpen }) {
    const settings = normalizeSettings({
      open_time: openTime,
      close_time: closeTime,
      slot_duration_minutes: slotDurationMinutes,
      max_capacity: maxCapacity,
      is_open: isOpen,
    });

    await pool.execute(
      `INSERT INTO slot_settings
         (id, open_time, close_time, slot_duration_minutes, max_capacity, is_open)
       VALUES (1, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         open_time = VALUES(open_time),
         close_time = VALUES(close_time),
         slot_duration_minutes = VALUES(slot_duration_minutes),
         max_capacity = VALUES(max_capacity),
         is_open = VALUES(is_open)`,
      [
        settings.open_time,
        settings.close_time,
        settings.slot_duration_minutes,
        settings.max_capacity,
        settings.is_open ? 1 : 0,
      ]
    );

    return settings;
  },

  /**
   * Generate all possible time slots for a given date.
   */
  generateSlots(date, settings = DEFAULT_SETTINGS) {
    const normalized = normalizeSettings(settings);
    const slots = [];
    if (!normalized.is_open) return slots;

    const openMinutes = timeToMinutes(normalized.open_time);
    const closeMinutes = timeToMinutes(normalized.close_time);
    const duration = normalized.slot_duration_minutes;

    for (let start = openMinutes; start + duration <= closeMinutes; start += duration) {
      slots.push({
        date,
        start_time: minutesToTime(start),
        end_time: minutesToTime(start + duration),
      });
    }
    return slots;
  },

  /**
   * Get booked player counts per slot for a given date.
   */
  async getBookedCounts(date) {
    const sql = `
      SELECT start_time, COALESCE(SUM(player_count), 0) AS booked
      FROM reservations
      WHERE reservation_date = ? AND status = 'active'
      GROUP BY start_time
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
    for (const row of rows) taken.add(normalizeTime(row.start_time));
    return taken;
  },

  async getBlocks(date) {
    const [rows] = await pool.execute(
      `SELECT id,
              DATE_FORMAT(block_date, '%Y-%m-%d') AS date,
              TIME_FORMAT(start_time, '%H:%i') AS startTime,
              TIME_FORMAT(end_time, '%H:%i') AS endTime,
              reason, created_at
       FROM slot_blocks
       WHERE block_date = ?
       ORDER BY start_time ASC`,
      [date]
    );
    return rows;
  },

  async blockSlot({ date, startTime, endTime, reason = '' }) {
    const [result] = await pool.execute(
      `INSERT INTO slot_blocks (block_date, start_time, end_time, reason)
       VALUES (?, ?, ?, ?)`,
      [date, normalizeTime(startTime), normalizeTime(endTime), reason]
    );

    return {
      id: result.insertId,
      date,
      startTime: normalizeTime(startTime).slice(0, 5),
      endTime: normalizeTime(endTime).slice(0, 5),
      reason,
    };
  },

  async unblockSlot(id) {
    const [result] = await pool.execute(`DELETE FROM slot_blocks WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  },

  /**
   * Get availability for a single date.
   * A slot is unavailable if it already has a group OR capacity is exhausted.
   */
  async getAvailability(date) {
    const settings = await this.getSettings();
    const slots = this.generateSlots(date, settings);
    const bookedRows = await this.getBookedCounts(date);
    const groupTaken = await this.getGroupTakenSlots(date);
    const blocks = await this.getBlocks(date);

    const bookedMap = {};
    for (const row of bookedRows) {
      const key = normalizeTime(row.start_time);
      bookedMap[key] = Number(row.booked);
    }

    return slots.map(slot => {
      const key = normalizeTime(slot.start_time);
      const booked = bookedMap[key] || 0;
      const hasGroup = groupTaken.has(key);
      const block = blocks.find(b => overlaps(slot.start_time, slot.end_time, b.startTime, b.endTime));
      const isBlocked = Boolean(block);
      const available = hasGroup || isBlocked ? 0 : settings.max_capacity - booked;
      return {
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        max_capacity: settings.max_capacity,
        booked: hasGroup || isBlocked ? settings.max_capacity : booked,
        available,
        is_available: !hasGroup && !isBlocked && available > 0,
        is_blocked: isBlocked,
        block_reason: block?.reason || null,
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

  async validateBookableTime(date, startTime) {
    const settings = await this.getSettings();
    if (!settings.is_open) {
      return { valid: false, message: 'Reservations are currently closed.' };
    }

    const startTimeFull = normalizeTime(startTime);
    const start = timeToMinutes(startTimeFull);
    const end = start + settings.slot_duration_minutes;
    const open = timeToMinutes(settings.open_time);
    const close = timeToMinutes(settings.close_time);

    if (start < open || end > close) {
      return {
        valid: false,
        message: `Time must be between ${settings.open_time.slice(0, 5)} and ${settings.close_time.slice(0, 5)}.`,
      };
    }

    if ((start - open) % settings.slot_duration_minutes !== 0) {
      return { valid: false, message: `Time must match a ${settings.slot_duration_minutes}-minute slot.` };
    }

    const blocks = await this.getBlocks(date);
    const blocked = blocks.find(b => overlaps(startTimeFull, minutesToTime(end), b.startTime, b.endTime));
    if (blocked) {
      return { valid: false, message: 'This time slot is blocked by an admin.' };
    }

    return { valid: true, settings };
  },
};

module.exports = Slot;
