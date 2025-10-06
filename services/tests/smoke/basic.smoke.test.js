const request = require('supertest');
const createTestApp = require('../test-server');
const User = require('../../models/User');
const Expense = require('../../models/Expense');
const Group = require('../../models/Group');

// Create test app instance
const app = createTestApp();

describe('🔥 Smoke Tests - Basic Functionality', () => {
  let testUser;
  let authToken;
  let testUser2;
  let authToken2;

  beforeEach(async () => {
    // Create test users for smoke tests
    testUser = new User(global.testUtils.createTestUser({
      name: 'Smoke Test User',
      email: 'smoke@test.com'
    }));
    await testUser.save();
    authToken = global.testUtils.generateToken(testUser._id);

    testUser2 = new User(global.testUtils.createTestUser({
      name: 'Smoke Test User 2',
      email: 'smoke2@test.com'
    }));
    await testUser2.save();
    authToken2 = global.testUtils.generateToken(testUser2._id);
  });

  describe('🏥 Server Health', () => {
    test('should respond to health check', async () => {
      const response = await request(app)
        .get('/v1/healthz')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
    });

    test('should handle 404 routes gracefully', async () => {
      const response = await request(app)
        .get('/v1/nonexistent-route')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });

    test('should return proper CORS headers', async () => {
      const response = await request(app)
        .options('/v1/health')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-credentials');
    });
  });

  describe('🔐 Authentication Smoke Tests', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        name: 'New Smoke User',
        email: 'newsmoke@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    test('should login existing user successfully', async () => {
      const loginData = {
        email: 'smoke@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('email', loginData.email);
    });

    test('should reject invalid credentials', async () => {
      const loginData = {
        email: 'smoke@test.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    test('should protect routes with authentication', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('token');
    });

    test('should accept valid authentication token', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('👤 User Management Smoke Tests', () => {
    test('should get user profile', async () => {
      const response = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).not.toHaveProperty('password');
    });

    test('should update user profile', async () => {
      const updateData = {
        name: 'Updated Smoke User',
        phoneNumber: '+1234567890'
      };

      const response = await request(app)
        .patch('/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', updateData.name);
      expect(response.body.data).toHaveProperty('phoneNumber', updateData.phoneNumber);
    });

    test('should search for users', async () => {
      const response = await request(app)
        .get('/v1/users/search?q=Smoke')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should add and remove friends', async () => {
      // Add friend
      const addResponse = await request(app)
        .post(`/v1/users/friends`)
        .send({ friendId: testUser2._id })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(addResponse.body).toHaveProperty('success', true);

      // Verify friend was added
      const profileResponse = await request(app)
        .get('/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.data.friends).toContain(testUser2._id.toString());

      // Remove friend
      await request(app)
        .delete(`/v1/users/friends/${testUser2._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('💰 Expense Management Smoke Tests', () => {
    beforeEach(async () => {
      // Add testUser2 as friend for expense tests
      testUser.friends.push(testUser2._id);
      await testUser.save();
    });

    test('should create a new expense', async () => {

      const expenseData = {
        description: 'Smoke Test Expense',
        amount: 100,
        splitWith: [
          { user: testUser._id, amount: 50 },
          { user: testUser2._id, amount: 50 }
        ],
        category: 'food'
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('description', expenseData.description);
      expect(response.body.data).toHaveProperty('amount', expenseData.amount);
      expect(response.body.data).toHaveProperty('paidBy');
      expect(response.body.data).toHaveProperty('splitWith');
    });

    test('should get user expenses', async () => {
      // Create a test expense first
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser._id,
        [testUser._id, testUser2._id]
      ));
      await expense.save();

      const response = await request(app)
        .get('/v1/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should get expense by ID', async () => {
      // Create a test expense first
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser._id,
        [testUser._id, testUser2._id]
      ));
      await expense.save();

      const response = await request(app)
        .get(`/v1/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('_id', expense._id.toString());
    });

    test('should settle an expense', async () => {
      // Create a test expense first
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser._id,
        [testUser._id, testUser2._id]
      ));
      await expense.save();

      const response = await request(app)
        .post(`/v1/expenses/${expense._id}/settle`)
        .set('Authorization', `Bearer ${authToken2}`) // testUser2 settles
        .send({ userId: testUser._id }) // Settle with testUser
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    test('should get balance with another user', async () => {
      // Create a test expense first
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser._id,
        [testUser._id, testUser2._id]
      ));
      await expense.save();

      const response = await request(app)
        .get(`/v1/users/friends/${testUser2._id}/balance`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('balance');
      expect(typeof response.body.data.balance).toBe('number');
    });
  });

  describe('👥 Group Management Smoke Tests', () => {
    test('should create a new group', async () => {
      const groupData = {
        name: 'Smoke Test Group',
        description: 'A test group for smoke testing'
      };

      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('name', groupData.name);
      expect(response.body.data).toHaveProperty('createdBy');
      expect(response.body.data.members).toHaveLength(1); // Creator is automatically added
    });

    test('should get user groups', async () => {
      // Create a test group first
      const group = new Group(global.testUtils.createTestGroup(testUser._id));
      await group.save();

      const response = await request(app)
        .get('/v1/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should get group by ID', async () => {
      // Create a test group first
      const group = new Group(global.testUtils.createTestGroup(testUser._id));
      await group.save();

      const response = await request(app)
        .get(`/v1/groups/${group._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('_id', group._id.toString());
    });

    test('should add member to group', async () => {
      // Create a test group first
      const group = new Group(global.testUtils.createTestGroup(testUser._id));
      await group.save();

      const response = await request(app)
        .post(`/v1/groups/${group._id}/members`)
        .send({ memberEmail: testUser2.email })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.members).toHaveLength(2);
    });

    test('should create group expense', async () => {
      // Create a test group with both users
      const group = new Group(global.testUtils.createTestGroup(
        testUser._id,
        [testUser._id, testUser2._id]
      ));
      await group.save();

      const expenseData = {
        description: 'Group Smoke Test Expense',
        amount: 200,
        splitWith: [
          { user: testUser._id, amount: 100 },
          { user: testUser2._id, amount: 100 }
        ],
        category: 'food',
        group: group._id
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      if (response.body.data.group) {
        expect(response.body.data).toHaveProperty('group', group._id.toString());
      }
    });
  });

  describe('🚨 Error Handling Smoke Tests', () => {
    test('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({}) // Empty body
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    test('should handle invalid ObjectId format', async () => {
      const response = await request(app)
        .get('/v1/expenses/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle non-existent resources', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/v1/expenses/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('not found');
    });

    test('should handle unauthorized access', async () => {
      // Create expense with testUser
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser._id,
        [testUser2._id]
      ));
      await expense.save();

      // Try to access with different user who is not involved
      const testUser3 = new User(global.testUtils.createTestUser({
        email: 'unauthorized@test.com'
      }));
      await testUser3.save();
      const unauthorizedToken = global.testUtils.generateToken(testUser3._id);

      const response = await request(app)
        .get(`/v1/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('📊 Data Validation Smoke Tests', () => {
    test('should validate email format', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('email');
    });

    test('should validate password length', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123' // Too short
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Password');
    });

    test('should validate expense amount', async () => {
      const expenseData = {
        description: 'Test Expense',
        amount: -50, // Negative amount
        splitWith: [{ user: testUser2._id, amount: 25 }]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should validate required fields for expenses', async () => {
      const expenseData = {
        // Missing description and amount
        splitWith: [{ user: testUser2._id, amount: 25 }]
      };

      const response = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    test('should validate group name length', async () => {
      const groupData = {
        name: 'A'.repeat(101), // Too long
        description: 'Test group'
      };

      const response = await request(app)
        .post('/v1/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('🔄 Concurrent Operations Smoke Tests', () => {
    test('should handle concurrent user registrations', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        const userData = {
          name: `Concurrent User ${i}`,
          email: `concurrent${i}@test.com`,
          password: 'password123'
        };
        
        promises.push(
          request(app)
            .post('/v1/auth/register')
            .send(userData)
        );
      }

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
      });
    });

    test('should handle concurrent expense creations', async () => {
      // Add testUser2 as friend for both users
      testUser.friends.push(testUser2._id);
      testUser2.friends.push(testUser._id);
      await testUser.save();
      await testUser2.save();

      const promises = [];
      
      for (let i = 0; i < 3; i++) {
        const amount = 100;
        const expenseData = {
          description: `Concurrent Expense ${i}`,
          amount: amount,
          splitWith: [{ user: testUser._id, amount: 50 }, { user: testUser2._id, amount: 50 }],
          category: 'food'
        };
        
        promises.push(
          request(app)
            .post('/v1/expenses')
            .set('Authorization', `Bearer ${authToken}`)
            .send(expenseData)
        );
      }

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
      });
    });
  });

  describe('🎯 Performance Smoke Tests', () => {
    test('should respond to health check within reasonable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/v1/healthz')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should handle multiple simultaneous requests', async () => {
      const promises = [];
      const requestCount = 10;
      
      for (let i = 0; i < requestCount; i++) {
        promises.push(
          request(app)
            .get('/v1/healthz')
            .expect(200)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      expect(responses).toHaveLength(requestCount);
      responses.forEach(response => {
        expect(response.body).toHaveProperty('success', true);
      });
      
      // Should handle all requests within reasonable time
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 10 requests
    });
  });
});