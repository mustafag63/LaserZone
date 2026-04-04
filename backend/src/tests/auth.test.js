// T-04 | Mustafa Göçmen | Sprint 1
// Write authentication unit tests

process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const app = require('../app');

// Mock database pool so tests run without a real MySQL connection
jest.mock('../config/db', () => {
  const users = [];
  let nextId = 1;

  const query = jest.fn(async (sql, params) => {
    // CREATE TABLE — no-op
    if (/CREATE TABLE/i.test(sql)) return [[], []];

    // INSERT INTO users
    if (/INSERT INTO users/i.test(sql)) {
      const id = nextId++;
      users.push({ id, username: params[0], password: params[1], role: params[2] });
      return [{ insertId: id }];
    }

    // SELECT * FROM users WHERE username
    if (/SELECT \* FROM users WHERE username/i.test(sql)) {
      const user = users.find((u) => u.username === params[0]);
      return [[user].filter(Boolean)];
    }

    // SELECT id, username ... FROM users WHERE id
    if (/SELECT id, username/i.test(sql)) {
      const user = users.find((u) => u.id === params[0]);
      if (!user) return [[]];
      const { id, username, role } = user;
      return [[{ id, username, role }]];
    }

    return [[]];
  });

  return { query };
});

describe('Auth API', () => {
  const testUser = {
    username: 'mustafa63',
    password: 'secret123',
  };

  let token;

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns a JWT', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe(testUser.username);
      expect(res.body.user.role).toBe('customer');
      token = res.body.token;
    });

    it('rejects registration with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'onlyusername' });
      expect(res.status).toBe(400);
    });

    it('rejects registration with a username shorter than 3 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'ab', password: 'secret123' });
      expect(res.status).toBe(400);
    });

    it('rejects registration with a password shorter than 6 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: '123' });
      expect(res.status).toBe(400);
    });

    it('rejects duplicate username', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials and returns a JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: testUser.password });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      token = res.body.token;
    });

    it('rejects login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('rejects login with unknown username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'noone', password: 'secret123' });
      expect(res.status).toBe(401);
    });

    it('rejects login with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user with a valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe(testUser.username);
    });

    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 with an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(401);
    });
  });
});
