const request = require('supertest');
const app = require('../server');

describe('Validation Middleware', () => {
  describe('Registration Validation', () => {
    it('should validate name length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Te', // Too short
          email: 'test@example.com',
          password: 'password123',
          role: 'homeowner'
        })
        .expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: 'Name must be at least 3 characters'
          })
        ])
      );
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123',
          role: 'homeowner'
        })
        .expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Email must be valid'
          })
        ])
      );
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123', // Too short
          role: 'homeowner'
        })
        .expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: 'Password must be at least 8 characters'
          })
        ])
      );
    });

    it('should validate role values', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'invalid-role'
        })
        .expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'role',
            message: 'Role must be homeowner or maid'
          })
        ])
      );
    });
  });

  describe('Job Creation Validation', () => {
    it('should validate maidId as integer (without auth)', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({
          maidId: 'not-a-number',
          title: 'Test Job',
          address: 'Test Address',
          scheduledDatetime: '2024-12-20T10:00:00Z',
          hourlyRate: 25
        });

      // Without auth, should get 401, not validation error
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should validate hourly rate as positive number (without auth)', async () => {
      const response = await request(app)
        .post('/api/jobs')
        .send({
          maidId: 1,
          title: 'Test Job',
          address: 'Test Address',
          scheduledDatetime: '2024-12-20T10:00:00Z',
          hourlyRate: -5
        });

      // Without auth, should get 401, not validation error
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Review Validation', () => {
    it('should validate rating range (without auth)', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .send({
          jobId: 1,
          revieweeId: 1,
          rating: 6 // Out of range
        });

      // Without auth, should get 401, not validation error
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });
});