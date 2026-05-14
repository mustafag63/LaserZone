// T-10 | Mustafa Göçmen | Sprint 1
// Write reservation integration tests

process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const app     = require('../app');
const jwt     = require('jsonwebtoken');

// ─── Mock database ────────────────────────────────────────────────────────────
jest.mock('../config/db', () => {
  const reservations = [];
  const pastEvents = [];
  let nextId = 1;

  const execute = jest.fn(async (sql, params) => {
    // CREATE TABLE — no-op
    if (/CREATE TABLE/i.test(sql)) return [[], []];
    if (/INSERT IGNORE INTO past_events/i.test(sql)) {
      const [dateLimit, sameDate, timeLimit] = params;
      for (const r of reservations) {
        const ended = r.reservation_date < dateLimit || (r.reservation_date === sameDate && r.end_time <= timeLimit);
        const exists = pastEvents.some(e => e.source_type === 'reservation' && e.source_id === r.id && e.user_id === r.user_id);
        if (r.status === 'active' && ended && !exists) {
          pastEvents.push({
            id: pastEvents.length + 1,
            source_type: 'reservation',
            source_id: r.id,
            user_id: r.user_id,
            event_name: r.reservation_name,
            event_date: r.reservation_date,
            start_time: r.start_time,
            end_time: r.end_time,
            player_count: r.player_count,
          });
        }
      }
      return [{ affectedRows: 1 }];
    }
    if (/UPDATE reservations[\s\S]*SET status = 'completed'/i.test(sql)) {
      const [dateLimit, sameDate, timeLimit] = params;
      let affectedRows = 0;
      for (const r of reservations) {
        const ended = r.reservation_date < dateLimit || (r.reservation_date === sameDate && r.end_time <= timeLimit);
        if (r.status === 'active' && ended) {
          r.status = 'completed';
          affectedRows += 1;
        }
      }
      return [{ affectedRows }];
    }
    if (/FROM past_events/i.test(sql)) {
      return [pastEvents
        .filter(e => e.user_id === params[0])
        .map(e => ({
          id: e.id,
          sourceType: e.source_type,
          sourceId: e.source_id,
          name: e.event_name,
          date: e.event_date,
          startTime: e.start_time.slice(0, 5),
          endTime: e.end_time.slice(0, 5),
          players: e.player_count,
          completedAt: '2030-01-01T00:00:00.000Z',
        }))];
    }
    if (/FROM group_reservations/i.test(sql) && /leader_user_id/i.test(sql)) return [{ affectedRows: 0 }];
    if (/FROM slot_settings/i.test(sql)) {
      return [[{
        open_time: '10:00:00',
        close_time: '22:00:00',
        slot_duration_minutes: 30,
        max_capacity: 20,
        is_open: 1,
      }]];
    }
    if (/FROM slot_blocks/i.test(sql)) return [[]];

    if (/COALESCE\(SUM\(current_count\)/i.test(sql)) {
      return [[{ booked: 0 }]];
    }

    // Conflict check: COALESCE(SUM(player_count))
    if (/COALESCE\(SUM/i.test(sql)) {
      const [date, startTime] = params;
      const booked = reservations
        .filter(r => r.reservation_date === date && r.start_time === startTime && r.status === 'active')
        .reduce((sum, r) => sum + r.player_count, 0);
      return [[{ booked }]];
    }

    // INSERT INTO reservations
    if (/INSERT INTO reservations/i.test(sql)) {
      const id = nextId++;
      const [userId, name, date, startTime, endTime, playerCount] = params;
      reservations.push({ id, user_id: userId, reservation_name: name, reservation_date: date, start_time: startTime, end_time: endTime, player_count: playerCount, status: 'active' });
      return [{ insertId: id }];
    }

    // SELECT reservations by user_id
    if (/WHERE user_id = \? AND status/i.test(sql)) {
      const rows = reservations
        .filter(r => r.user_id === params[0] && r.status === 'active')
        .map(r => ({
          id: r.id,
          name: r.reservation_name,
          date: r.reservation_date,
          startTime: r.start_time,
          endTime: r.end_time,
          players: r.player_count,
          status: r.status,
        }));
      return [rows];
    }

    // UPDATE … status = 'cancelled'
    if (/UPDATE reservations SET status/i.test(sql)) {
      const [id, userId] = params;
      const r = reservations.find(r => r.id === id && r.user_id === userId && r.status === 'active');
      if (r) { r.status = 'cancelled'; return [{ affectedRows: 1 }]; }
      return [{ affectedRows: 0 }];
    }

    // SELECT … FROM reservations WHERE id = ?
    if (/FROM reservations WHERE id/i.test(sql)) {
      const r = reservations.find(r => r.id === params[0]);
      if (!r) return [[]];
      return [[{ ...r, name: r.reservation_name, date: r.reservation_date }]];
    }

    return [[]];
  });

  execute._seed  = (r) => reservations.push(r);
  execute._clear = () => { reservations.length = 0; pastEvents.length = 0; nextId = 1; };

  return { execute, query: execute };
});

const db = require('../config/db');

// Helper: create signed JWT for a user
const makeToken = (userId = 1) =>
  jwt.sign({ id: userId, username: 'testuser', role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1h' });

afterEach(() => db.execute._clear());

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Reservation API', () => {
  const token = makeToken(1);

  const valid = {
    name:    'Birthday Party',
    date:    '2030-06-15',
    time:    '14:00',
    players: 5,
  };

  // ── POST /api/reservations ────────────────────────────────────────────────
  describe('POST /api/reservations', () => {
    it('creates a reservation and returns 201', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send(valid);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('reservation');
      expect(res.body.reservation.name).toBe(valid.name);
      expect(res.body.reservation.playerCount).toBe(valid.players);
      expect(res.body.reservation.status).toBe('active');
    });

    it('returns 401 without a token', async () => {
      const res = await request(app).post('/api/reservations').send(valid);
      expect(res.status).toBe(401);
    });

    it('returns 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', date: '2030-06-15' }); // missing time & players
      expect(res.status).toBe(400);
    });

    it('returns 400 when reservation name is too short', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...valid, name: 'X' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when players < 3', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...valid, players: 2 });
      expect(res.status).toBe(400);
    });

    it('returns 400 when players > 20', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...valid, players: 21 });
      expect(res.status).toBe(400);
    });

    it('returns 400 for a past date', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...valid, date: '2020-01-01' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for time outside operating hours (too early)', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...valid, time: '08:00' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for time outside operating hours (too late)', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...valid, time: '22:00' });
      expect(res.status).toBe(400);
    });

    it('returns 409 when slot is fully booked (20/20)', async () => {
      db.execute._seed({
        id: 99, user_id: 2,
        reservation_name: 'Full Group',
        reservation_date: valid.date,
        start_time: '14:00:00', end_time: '15:00:00',
        player_count: 20, status: 'active',
      });

      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send(valid);
      expect(res.status).toBe(409);
    });

    it('returns 409 when new players would exceed capacity (18 + 5 > 20)', async () => {
      db.execute._seed({
        id: 98, user_id: 2,
        reservation_name: 'Large Group',
        reservation_date: valid.date,
        start_time: '14:00:00', end_time: '15:00:00',
        player_count: 18, status: 'active',
      });

      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send(valid); // 5 players → 18 + 5 = 23
      expect(res.status).toBe(409);
    });

    it('succeeds when remaining capacity is enough (10 + 5 = 15 ≤ 20)', async () => {
      db.execute._seed({
        id: 97, user_id: 2,
        reservation_name: 'Small Group',
        reservation_date: valid.date,
        start_time: '14:00:00', end_time: '15:00:00',
        player_count: 10, status: 'active',
      });

      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send(valid);
      expect(res.status).toBe(201);
    });

    it('ignores cancelled reservations in conflict check', async () => {
      db.execute._seed({
        id: 96, user_id: 2,
        reservation_name: 'Cancelled',
        reservation_date: valid.date,
        start_time: '14:00:00', end_time: '15:00:00',
        player_count: 20, status: 'cancelled', // should be ignored
      });

      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send(valid);
      expect(res.status).toBe(201);
    });
  });

  // ── GET /api/reservations/my ──────────────────────────────────────────────
  describe('GET /api/reservations/my', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/reservations/my');
      expect(res.status).toBe(401);
    });

    it('returns an empty array when user has no reservations', async () => {
      const res = await request(app)
        .get('/api/reservations/my')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.reservations).toEqual([]);
    });

    it('returns only the authenticated user\'s reservations', async () => {
      // user 1 books a slot
      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send(valid);

      // user 2 books a different slot
      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${makeToken(2)}`)
        .send({ ...valid, time: '15:00' });

      const res = await request(app)
        .get('/api/reservations/my')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.reservations).toHaveLength(1);
    });
  });

  describe('GET /api/reservations/history', () => {
    it('stores past active reservations as completed events', async () => {
      db.execute._seed({
        id: 60, user_id: 1,
        reservation_name: 'Past Game',
        reservation_date: '2020-06-15',
        start_time: '10:00:00', end_time: '11:00:00',
        player_count: 4, status: 'active',
      });

      const res = await request(app)
        .get('/api/reservations/history')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(1);
      expect(res.body.events[0]).toMatchObject({
        sourceType: 'reservation',
        sourceId: 60,
        name: 'Past Game',
        date: '2020-06-15',
        players: 4,
      });
    });

    it('does not expose another user past events', async () => {
      db.execute._seed({
        id: 61, user_id: 2,
        reservation_name: 'Other Past Game',
        reservation_date: '2020-06-15',
        start_time: '10:00:00', end_time: '11:00:00',
        player_count: 4, status: 'active',
      });

      const res = await request(app)
        .get('/api/reservations/history')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.events).toEqual([]);
    });
  });

  // ── DELETE /api/reservations/:id ─────────────────────────────────────────
  describe('DELETE /api/reservations/:id', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).delete('/api/reservations/1');
      expect(res.status).toBe(401);
    });

    it('cancels own reservation and returns 200', async () => {
      const created = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send(valid);

      const { id } = created.body.reservation;

      const res = await request(app)
        .delete(`/api/reservations/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('returns 404 for a non-existent reservation', async () => {
      const res = await request(app)
        .delete('/api/reservations/9999')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('cannot cancel another user\'s reservation', async () => {
      db.execute._seed({
        id: 50, user_id: 99,
        reservation_name: 'Other User',
        reservation_date: '2030-06-15',
        start_time: '10:00:00', end_time: '11:00:00',
        player_count: 3, status: 'active',
      });

      const res = await request(app)
        .delete('/api/reservations/50')
        .set('Authorization', `Bearer ${token}`); // user 1, not user 99
      expect(res.status).toBe(404);
    });

    it('returns 400 for an invalid (non-numeric) ID', async () => {
      const res = await request(app)
        .delete('/api/reservations/abc')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });
});
