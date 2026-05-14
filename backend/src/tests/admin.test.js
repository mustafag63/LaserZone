process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');

jest.mock('../config/db', () => {
  const users = [
    { id: 1, username: 'admin', role: 'admin' },
    { id: 2, username: 'customer', role: 'customer' },
  ];
  const reservations = [];
  const groups = [];

  function toRow(reservation) {
    const user = users.find(u => u.id === reservation.user_id);
    return {
      id: reservation.id,
      userId: reservation.user_id,
      name: reservation.reservation_name,
      date: reservation.reservation_date,
      startTime: reservation.start_time.slice(0, 5),
      endTime: reservation.end_time.slice(0, 5),
      players: reservation.player_count,
      status: reservation.status,
      created_at: reservation.created_at || '2030-01-01T00:00:00.000Z',
      username: user?.username || 'unknown',
    };
  }

  const execute = jest.fn(async (sql, params = []) => {
    if (/CREATE TABLE/i.test(sql)) return [[], []];

    if (/SELECT r\.id, r\.user_id AS userId/i.test(sql)) {
      const reservation = reservations.find(r => r.id === params[0]);
      return [reservation ? [toRow(reservation)] : []];
    }

    if (/SELECT r\.id, r\.reservation_name AS name/i.test(sql)) {
      let rows = reservations;
      if (/r\.status = \?/i.test(sql)) {
        rows = rows.filter(r => r.status === params[0]);
      }
      if (/r\.reservation_date = \?/i.test(sql)) {
        const dateParam = params[params.length - 1];
        rows = rows.filter(r => r.reservation_date === dateParam);
      }
      return [rows.map(toRow)];
    }

    if (/COALESCE\(SUM\(player_count\)/i.test(sql)) {
      const [date, startTime, excludeId] = params;
      const booked = reservations
        .filter(r => r.reservation_date === date && r.start_time === startTime)
        .filter(r => r.status === 'active' && r.id !== excludeId)
        .reduce((sum, r) => sum + r.player_count, 0);
      return [[{ booked }]];
    }

    if (/COALESCE\(SUM\(current_count\)/i.test(sql)) {
      const [date, startTime] = params;
      const booked = groups
        .filter(g => g.reservation_date === date && g.start_time === startTime)
        .filter(g => ['open', 'closed'].includes(g.status))
        .reduce((sum, g) => sum + g.current_count, 0);
      return [[{ booked }]];
    }

    if (/UPDATE reservations SET status = 'active'/i.test(sql)) {
      const reservation = reservations.find(r => r.id === params[0] && r.status !== 'active');
      if (!reservation) return [{ affectedRows: 0 }];
      reservation.status = 'active';
      return [{ affectedRows: 1 }];
    }

    if (/UPDATE reservations SET status = 'cancelled'/i.test(sql)) {
      const reservation = reservations.find(
        r => r.id === params[0] && r.status !== 'cancelled' && r.status !== 'completed'
      );
      if (!reservation) return [{ affectedRows: 0 }];
      reservation.status = 'cancelled';
      return [{ affectedRows: 1 }];
    }

    return [[]];
  });

  execute._seedReservation = reservation => reservations.push(reservation);
  execute._seedGroup = group => groups.push(group);
  execute._clear = () => {
    reservations.length = 0;
    groups.length = 0;
  };

  return { execute, query: execute };
});

const db = require('../config/db');

const makeToken = (role = 'admin', id = 1) =>
  jwt.sign({ id, username: role, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

function reservation(overrides = {}) {
  return {
    id: 10,
    user_id: 2,
    reservation_name: 'Team Night',
    reservation_date: '2030-06-15',
    start_time: '14:00:00',
    end_time: '15:00:00',
    player_count: 5,
    status: 'active',
    ...overrides,
  };
}

afterEach(() => db.execute._clear());

describe('Admin reservation API', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/admin/reservations');
    expect(res.status).toBe(401);
  });

  it('rejects non-admin users', async () => {
    const res = await request(app)
      .get('/api/admin/reservations')
      .set('Authorization', `Bearer ${makeToken('customer', 2)}`);
    expect(res.status).toBe(403);
  });

  it('lists reservations with status and date filters', async () => {
    db.execute._seedReservation(reservation({ id: 1, status: 'active' }));
    db.execute._seedReservation(reservation({ id: 2, status: 'cancelled' }));
    db.execute._seedReservation(reservation({ id: 3, status: 'active', reservation_date: '2030-06-16' }));

    const res = await request(app)
      .get('/api/admin/reservations?status=active&date=2030-06-15')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.reservations).toHaveLength(1);
    expect(res.body.reservations[0]).toMatchObject({ id: 1, status: 'active', username: 'customer' });
  });

  it('cancels an active reservation', async () => {
    db.execute._seedReservation(reservation({ id: 20, status: 'active' }));

    const res = await request(app)
      .put('/api/admin/reservations/20/cancel')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.reservation.status).toBe('cancelled');
  });

  it('approves a cancelled reservation when capacity is available', async () => {
    db.execute._seedReservation(reservation({ id: 30, status: 'cancelled' }));

    const res = await request(app)
      .put('/api/admin/reservations/30/approve')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.reservation.status).toBe('active');
  });

  it('does not approve when restoring the reservation would exceed capacity', async () => {
    db.execute._seedReservation(reservation({ id: 40, status: 'cancelled', player_count: 5 }));
    db.execute._seedReservation(reservation({ id: 41, status: 'active', player_count: 18 }));

    const res = await request(app)
      .put('/api/admin/reservations/40/approve')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/slot is full/i);
  });

  it('returns 400 for invalid reservation IDs', async () => {
    const res = await request(app)
      .put('/api/admin/reservations/not-a-number/cancel')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
  });
});
