// T-05 | Tuna Öcal | Sprint 1
// Implement availability query API – unit tests

process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const app = require('../app');

// Mock database pool
jest.mock('../config/db', () => {
  const reservations = [];

  const execute = jest.fn(async (sql, params) => {
    // CREATE TABLE — no-op
    if (/CREATE TABLE/i.test(sql)) return [[], []];

    // SELECT booked counts for availability
    if (/SELECT start_time, end_time/i.test(sql)) {
      const date = params[0];
      const grouped = {};
      for (const r of reservations) {
        if (r.reservation_date === date && r.status === 'active') {
          const key = `${r.start_time}-${r.end_time}`;
          grouped[key] = grouped[key] || { start_time: r.start_time, end_time: r.end_time, booked: 0 };
          grouped[key].booked += r.player_count;
        }
      }
      return [Object.values(grouped)];
    }

    return [[]];
  });

  // Helper to seed reservations in tests
  execute._seedReservation = (r) => reservations.push(r);
  execute._clearReservations = () => reservations.length = 0;

  return { execute, query: execute };
});

const db = require('../config/db');

afterEach(() => {
  db.execute._clearReservations();
});

describe('Slot Availability API', () => {
  describe('GET /api/slots/availability?date=', () => {
    it('returns 12 slots for a valid date (10:00–22:00)', async () => {
      const res = await request(app).get('/api/slots/availability?date=2026-04-01');
      expect(res.status).toBe(200);
      expect(res.body.date).toBe('2026-04-01');
      expect(res.body.slots).toHaveLength(12);
    });

    it('each slot has correct structure', async () => {
      const res = await request(app).get('/api/slots/availability?date=2026-04-01');
      const slot = res.body.slots[0];
      expect(slot).toHaveProperty('date', '2026-04-01');
      expect(slot).toHaveProperty('start_time', '10:00:00');
      expect(slot).toHaveProperty('end_time', '11:00:00');
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
      expect(res.body.availability['2026-04-01']).toHaveLength(12);
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
});
