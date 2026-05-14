// T-05 | Tuna Öcal | Sprint 1
// Implement availability query API – unit tests

process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');

// Mock database pool
jest.mock('../config/db', () => {
  const reservations = [];
  const blocks = [];
  let nextBlockId = 1;
  const settings = {
    open_time: '10:00:00',
    close_time: '22:00:00',
    slot_duration_minutes: 30,
    max_capacity: 20,
    is_open: 1,
  };

  const execute = jest.fn(async (sql, params) => {
    // CREATE TABLE — no-op
    if (/CREATE TABLE/i.test(sql)) return [[], []];
    if (/INSERT IGNORE INTO slot_settings/i.test(sql)) return [{ affectedRows: 0 }];

    if (/FROM slot_settings/i.test(sql)) {
      return [[{ ...settings }]];
    }

    if (/INSERT INTO slot_settings/i.test(sql)) {
      const [openTime, closeTime, duration, capacity, isOpen] = params;
      settings.open_time = openTime;
      settings.close_time = closeTime;
      settings.slot_duration_minutes = duration;
      settings.max_capacity = capacity;
      settings.is_open = isOpen;
      return [{ affectedRows: 1 }];
    }

    if (/SELECT[\s\S]*FROM slot_blocks/i.test(sql)) {
      const date = params[0];
      return [blocks
        .filter(block => block.date === date)
        .map(block => ({
          id: block.id,
          date: block.date,
          startTime: block.startTime,
          endTime: block.endTime,
          reason: block.reason,
        }))];
    }

    if (/INSERT INTO slot_blocks/i.test(sql)) {
      const [date, startTime, endTime, reason] = params;
      const id = nextBlockId++;
      blocks.push({ id, date, startTime: startTime.slice(0, 5), endTime: endTime.slice(0, 5), reason });
      return [{ insertId: id }];
    }

    if (/DELETE FROM slot_blocks/i.test(sql)) {
      const index = blocks.findIndex(block => block.id === Number(params[0]));
      if (index === -1) return [{ affectedRows: 0 }];
      blocks.splice(index, 1);
      return [{ affectedRows: 1 }];
    }

    // SELECT booked counts for availability
    if (/FROM reservations/i.test(sql) && /GROUP BY start_time/i.test(sql)) {
      const date = params[0];
      const grouped = {};
      for (const r of reservations) {
        if (r.reservation_date === date && r.status === 'active') {
          const key = r.start_time;
          grouped[key] = grouped[key] || { start_time: r.start_time, booked: 0 };
          grouped[key].booked += r.player_count;
        }
      }
      return [Object.values(grouped)];
    }

    if (/FROM group_reservations/i.test(sql)) {
      return [[]];
    }

    return [[]];
  });

  // Helper to seed reservations in tests
  execute._seedReservation = (r) => reservations.push(r);
  execute._clearReservations = () => {
    reservations.length = 0;
    blocks.length = 0;
    nextBlockId = 1;
    settings.open_time = '10:00:00';
    settings.close_time = '22:00:00';
    settings.slot_duration_minutes = 30;
    settings.max_capacity = 20;
    settings.is_open = 1;
  };

  return { execute, query: execute };
});

const db = require('../config/db');

afterEach(() => {
  db.execute._clearReservations();
});

const makeToken = (role = 'admin') =>
  jwt.sign({ id: 1, username: role, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Slot Availability API', () => {
  describe('GET /api/slots/availability?date=', () => {
    it('returns 24 half-hour slots for a valid date (10:00–22:00)', async () => {
      const res = await request(app).get('/api/slots/availability?date=2026-04-01');
      expect(res.status).toBe(200);
      expect(res.body.date).toBe('2026-04-01');
      expect(res.body.slots).toHaveLength(24);
    });

    it('each slot has correct structure', async () => {
      const res = await request(app).get('/api/slots/availability?date=2026-04-01');
      const slot = res.body.slots[0];
      expect(slot).toHaveProperty('date', '2026-04-01');
      expect(slot).toHaveProperty('start_time', '10:00:00');
      expect(slot).toHaveProperty('end_time', '10:30:00');
      expect(slot).toHaveProperty('max_capacity', 20);
      expect(slot).toHaveProperty('booked', 0);
      expect(slot).toHaveProperty('available', 20);
      expect(slot).toHaveProperty('is_available', true);
    });

    it('reflects booked capacity correctly', async () => {
      db.execute._seedReservation({
        reservation_date: '2026-04-01',
        start_time: '10:00:00',
        end_time: '11:00:00',
        player_count: 8,
        status: 'active',
      });

      const res = await request(app).get('/api/slots/availability?date=2026-04-01');
      const slot = res.body.slots.find(s => s.start_time === '10:00:00');
      expect(slot.booked).toBe(8);
      expect(slot.available).toBe(12);
      expect(slot.is_available).toBe(true);
    });

    it('marks slot as unavailable when fully booked', async () => {
      db.execute._seedReservation({
        reservation_date: '2026-04-01',
        start_time: '14:00:00',
        end_time: '15:00:00',
        player_count: 20,
        status: 'active',
      });

      const res = await request(app).get('/api/slots/availability?date=2026-04-01');
      const slot = res.body.slots.find(s => s.start_time === '14:00:00');
      expect(slot.booked).toBe(20);
      expect(slot.available).toBe(0);
      expect(slot.is_available).toBe(false);
    });

    it('ignores cancelled reservations', async () => {
      db.execute._seedReservation({
        reservation_date: '2026-04-01',
        start_time: '10:00:00',
        end_time: '11:00:00',
        player_count: 5,
        status: 'cancelled',
      });

      const res = await request(app).get('/api/slots/availability?date=2026-04-01');
      const slot = res.body.slots.find(s => s.start_time === '10:00:00');
      expect(slot.booked).toBe(0);
      expect(slot.available).toBe(20);
    });

    it('returns 400 for invalid date format', async () => {
      const res = await request(app).get('/api/slots/availability?date=not-a-date');
      expect(res.status).toBe(400);
    });

    it('returns 400 for missing parameters', async () => {
      const res = await request(app).get('/api/slots/availability');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/slots/availability?start_date=&end_date=', () => {
    it('returns availability for a date range', async () => {
      const res = await request(app).get(
        '/api/slots/availability?start_date=2026-04-01&end_date=2026-04-03'
      );
      expect(res.status).toBe(200);
      expect(res.body.availability).toHaveProperty('2026-04-01');
      expect(res.body.availability).toHaveProperty('2026-04-02');
      expect(res.body.availability).toHaveProperty('2026-04-03');
      expect(res.body.availability['2026-04-01']).toHaveLength(24);
    });

    it('returns 400 if start_date is after end_date', async () => {
      const res = await request(app).get(
        '/api/slots/availability?start_date=2026-04-05&end_date=2026-04-01'
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 if range exceeds 30 days', async () => {
      const res = await request(app).get(
        '/api/slots/availability?start_date=2026-04-01&end_date=2026-06-01'
      );
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid date format in range', async () => {
      const res = await request(app).get(
        '/api/slots/availability?start_date=bad&end_date=2026-04-03'
      );
      expect(res.status).toBe(400);
    });
  });

  describe('Admin slot management', () => {
    it('requires admin access for settings', async () => {
      const res = await request(app).get('/api/slots/settings');
      expect(res.status).toBe(401);
    });

    it('returns current settings to admins', async () => {
      const res = await request(app)
        .get('/api/slots/settings')
        .set('Authorization', `Bearer ${makeToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.settings).toMatchObject({
        open_time: '10:00:00',
        close_time: '22:00:00',
        slot_duration_minutes: 30,
        max_capacity: 20,
      });
    });

    it('updates working hours and capacity', async () => {
      const res = await request(app)
        .put('/api/slots/settings')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({
          openTime: '12:00',
          closeTime: '18:00',
          slotDurationMinutes: 60,
          maxCapacity: 16,
          isOpen: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.settings).toMatchObject({
        open_time: '12:00:00',
        close_time: '18:00:00',
        slot_duration_minutes: 60,
        max_capacity: 16,
      });

      const availability = await request(app).get('/api/slots/availability?date=2026-04-01');
      expect(availability.body.slots).toHaveLength(6);
      expect(availability.body.slots[0]).toMatchObject({
        start_time: '12:00:00',
        end_time: '13:00:00',
        max_capacity: 16,
      });
    });

    it('blocks and unblocks a slot', async () => {
      const created = await request(app)
        .post('/api/slots/blocks')
        .set('Authorization', `Bearer ${makeToken()}`)
        .send({
          date: '2026-04-01',
          startTime: '14:00',
          endTime: '14:30',
          reason: 'Maintenance',
        });

      expect(created.status).toBe(201);

      const availability = await request(app).get('/api/slots/availability?date=2026-04-01');
      const blocked = availability.body.slots.find(slot => slot.start_time === '14:00:00');
      expect(blocked).toMatchObject({
        is_available: false,
        is_blocked: true,
        block_reason: 'Maintenance',
      });

      const deleted = await request(app)
        .delete(`/api/slots/blocks/${created.body.block.id}`)
        .set('Authorization', `Bearer ${makeToken()}`);
      expect(deleted.status).toBe(200);

      const afterDelete = await request(app).get('/api/slots/availability?date=2026-04-01');
      const unblocked = afterDelete.body.slots.find(slot => slot.start_time === '14:00:00');
      expect(unblocked.is_blocked).toBe(false);
    });
  });
});
