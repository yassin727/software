const request = require('supertest');
const app = require('../server');

describe('Jobs Endpoints', () => {
  let homeownerToken;
  let maidToken;
  let maidId;

  beforeAll(async () => {
    // This is a simplified test - in real tests you'd set up test database
    // For now, we'll test the validation and structure
  });

  describe('POST /api/jobs', () => {
    it('should reject job creation without authentication', async () => {
      const jobData = {
        maidId: 1,
        title: 'House Cleaning',
        description: 'Clean the entire house',
        address: '123 Test St',
        scheduledDatetime: '2024-12-20T10:00:00Z',
        hourlyRate: 25.00
      };

      const response = await request(app)
        .post('/api/jobs')
        .send(jobData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject job creation with invalid data', async () => {
      const jobData = {
        maidId: 'invalid', // Should be integer
        title: '', // Required field
        hourlyRate: -5 // Should be positive
      };

      const response = await request(app)
        .post('/api/jobs')
        .send(jobData);

      // Without auth, should get 401, not validation error
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/jobs/my', () => {
    it('should reject without authentication', async () => {
      const response = await request(app)
        .get('/api/jobs/my')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/jobs/checkin', () => {
    it('should reject checkin without authentication', async () => {
      const response = await request(app)
        .post('/api/jobs/checkin')
        .send({ jobId: 1 })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject checkin with invalid data', async () => {
      const response = await request(app)
        .post('/api/jobs/checkin')
        .send({ jobId: 'invalid' });

      // Without auth, should get 401, not validation error
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/jobs/checkout', () => {
    it('should reject checkout without required fields', async () => {
      const response = await request(app)
        .post('/api/jobs/checkout')
        .send({});

      // Without auth, should get 401, not validation error
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });
});