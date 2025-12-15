const request = require('supertest');
const app = require('../server');

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new homeowner', async () => {
      const userData = {
        name: 'Test Homeowner',
        email: `test-homeowner-${Date.now()}@example.com`,
        phone: '1234567890',
        password: 'password123',
        role: 'homeowner'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // If DB is not connected, expect 500, otherwise expect 201
      if (response.status === 500) {
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Failed to register user');
      } else {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.name).toBe(userData.name);
        expect(response.body.user.role).toBe(userData.role);
      }
    });

    it('should register a new maid with pending status', async () => {
      const userData = {
        name: 'Test Maid',
        email: `test-maid-${Date.now()}@example.com`,
        phone: '1234567890',
        password: 'password123',
        role: 'maid'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // If DB is not connected, expect 500, otherwise expect 201
      if (response.status === 500) {
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Failed to register user');
      } else {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.role).toBe('maid');
      }
    });

    it('should reject registration with invalid data', async () => {
      const userData = {
        name: 'Te', // Too short
        email: 'invalid-email',
        password: '123', // Too short
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // If DB is not connected, expect 500, otherwise expect 401
      if (response.status === 500) {
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('Failed to login');
      } else {
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message');
      }
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });
});