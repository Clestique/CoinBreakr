const request = require('supertest');
const app = require('../test-server');

describe('Smoke Tests - Basic Functionality', () => {
  describe('Server Health', () => {
    it('should start server and respond to health check', async () => {
      const response = await request(app)
        .get('/v1/healthz')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('healthy');
    });

    it('should handle 404 routes gracefully', async () => {
      const response = await request(app)
        .get('/v1/nonexistent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication Smoke Tests', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Smoke Test User',
        email: 'smoketest@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.token).toBeDefined();
    });

    it('should login with valid credentials', async () => {
      // First register a user
      const userData = {
        name: 'Login Test User',
        email: 'logintest@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);

      // Then login with the same credentials
      const loginData = {
        email: 'logintest@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'smoketest@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('User Management Smoke Tests', () => {
    let token;

    beforeEach(async () => {
      // Register and login a user for these tests
      const userData = {
        name: 'Smoke Test User',
        email: 'smoketest@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/v1/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'smoketest@example.com', password: 'password123' });
      token = loginResponse.body.data.token;
    });

    it('should get user profile', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Smoke Test User');
    });

    it('should search for users', async () => {
      const response = await request(app)
        .get('/v1/users/search?query=Smoke')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get friends list', async () => {
      const response = await request(app)
        .get('/v1/users/friends')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should get balances', async () => {
      const response = await request(app)
        .get('/v1/users/balances')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Expense Management Smoke Tests', () => {
    let token, friendToken, friendId, userId;

    beforeEach(async () => {
      // Create main user
      const userData = {
        name: 'Smoke Test User',
        email: 'smoketest@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/v1/auth/register')
        .send(userData);

      // Create a friend user
      const friendData = {
        name: 'Smoke Test Friend',
        email: 'smokefriend@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/v1/auth/register')
        .send(friendData);

      const friendLoginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'smokefriend@example.com', password: 'password123' });
      
      friendToken = friendLoginResponse.body.data.token;
      friendId = friendLoginResponse.body.data.user.id;

      // Login main user
      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'smoketest@example.com', password: 'password123' });
      token = loginResponse.body.data.token;
      userId = loginResponse.body.data.user.id;

      // Add friend
      await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token}`)
        .send({ friendId });
    });

    it('should create an expense', async () => {
      const expenseData = {
        description: 'Smoke test dinner',
        amount: 100.00,
        currency: 'USD',
        category: 'food',
        splitWith: [
          {
            user: friendId,
            amount: 100.00
          }
        ]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(expenseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(expenseData.description);
    });

    it('should get user expenses', async () => {
      const response = await request(app)
        .get('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should get expense by ID', async () => {
      // First create an expense
      const expenseData = {
        description: 'Smoke test expense',
        amount: 50.00,
        splitWith: [
          {
            user: friendId,
            amount: 50.00
          }
        ]
      };

      const createResponse = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(expenseData)
        .expect(201);

      const expenseId = createResponse.body.data._id;

      // Get the expense
      const response = await request(app)
        .get(`/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(expenseId);
    });

    it('should update an expense', async () => {
      // First create an expense
      const expenseData = {
        description: 'Original expense',
        amount: 60.00,
        splitWith: [
          {
            user: friendId,
            amount: 60.00
          }
        ]
      };

      const createResponse = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(expenseData)
        .expect(201);

      const expenseId = createResponse.body.data._id;

      // Update the expense
      const updateData = {
        description: 'Updated expense'
      };

      const response = await request(app)
        .put(`/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should settle an expense', async () => {
      // First create an expense
      const expenseData = {
        description: 'Settlement test expense',
        amount: 40.00,
        splitWith: [
          {
            user: userId,
            amount: 20.00
          },
          {
            user: friendId,
            amount: 20.00
          }
        ]
      };

      const createResponse = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(expenseData)
        .expect(201);

      const expenseId = createResponse.body.data._id;

      // Settle the expense
      const response = await request(app)
        .patch(`/v1/expenses/${expenseId}/settle`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: friendId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('settled');
    });

    it('should delete an expense', async () => {
      // First create an expense
      const expenseData = {
        description: 'Deletion test expense',
        amount: 30.00,
        splitWith: [
          {
            user: friendId,
            amount: 30.00
          }
        ]
      };

      const createResponse = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(expenseData)
        .expect(201);

      const expenseId = createResponse.body.data._id;

      // Delete the expense
      const response = await request(app)
        .delete(`/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should get expenses between friends', async () => {
      const response = await request(app)
        .get(`/v1/expenses/between/${friendId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Friend Management Smoke Tests', () => {
    let token, friendId;

    beforeEach(async () => {
      // Create main user
      const userData = {
        name: 'Smoke Test User',
        email: 'smoketest@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/v1/auth/register')
        .send(userData);

      // Create a friend user
      const friendData = {
        name: 'Friend Test User',
        email: 'friendtest@example.com',
        password: 'password123'
      };

      const friendResponse = await request(app)
        .post('/v1/auth/register')
        .send(friendData);
      friendId = friendResponse.body.data.user.id;

      // Login main user
      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'smoketest@example.com', password: 'password123' });
      token = loginResponse.body.data.token;
    });

    it('should add a friend', async () => {
      const response = await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token}`)
        .send({ friendId })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('successfully');
    });

    it('should get balance with friend', async () => {
      // First add the friend
      await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token}`)
        .send({ friendId });

      const response = await request(app)
        .get(`/v1/users/friends/${friendId}/balance`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBeDefined();
    });

    it('should remove a friend', async () => {
      // First add the friend
      await request(app)
        .post('/v1/users/friends')
        .set('Authorization', `Bearer ${token}`)
        .send({ friendId });

      const response = await request(app)
        .delete(`/v1/users/friends/${friendId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      expect(response.body).toEqual({});
    });
  });

  describe('Error Handling Smoke Tests', () => {
    it('should handle missing authentication', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    it('should handle invalid authentication', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed request body', async () => {
      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', 'Bearer invalid-token')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400); // Malformed JSON should return 400

      expect(response.body.success).toBe(false);
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({ name: 'Test User' }) // Missing email and password
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Data Validation Smoke Tests', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('valid email');
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123' // Too short
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('6 characters');
    });

    it('should validate expense amount', async () => {
      // First register a user
      const userData = {
        name: 'Validation Test User',
        email: 'validationtest@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/v1/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'validationtest@example.com', password: 'password123' });
      const token = loginResponse.body.data.token;

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Test expense',
          amount: -100, // Negative amount
          splitWith: [{ user: '507f1f77bcf86cd799439011', amount: -50 }]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Response Format Smoke Tests', () => {
    it('should return consistent response format for success', async () => {
      const response = await request(app)
        .get('/v1/healthz')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
    });

    it('should return consistent response format for errors', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return pagination info for list endpoints', async () => {
      // First register a user
      const userData = {
        name: 'Pagination Test User',
        email: 'paginationtest@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/v1/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'paginationtest@example.com', password: 'password123' });
      const token = loginResponse.body.data.token;

      const response = await request(app)
        .get('/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('current');
      expect(response.body.pagination).toHaveProperty('pages');
      expect(response.body.pagination).toHaveProperty('total');
    });
  });
});