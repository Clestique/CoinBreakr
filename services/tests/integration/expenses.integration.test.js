const request = require('supertest');
const createTestApp = require('../test-server');
const User = require('../../models/User');
const Expense = require('../../models/Expense');
const Group = require('../../models/Group');

// Create test app instance
const app = createTestApp();

describe('🔗 Integration Tests - Expense Management Workflows', () => {
  let testUser1, testUser2, testUser3;
  let authToken1, authToken2, authToken3;
  let testGroup;

  beforeEach(async () => {
    // Clean slate for each test
    await User.deleteMany({});
    await Expense.deleteMany({});
    await Group.deleteMany({});

    // Create test users
    testUser1 = new User(global.testUtils.createTestUser({
      name: 'Expense User 1',
      email: 'expense1@test.com'
    }));
    await testUser1.save();
    authToken1 = global.testUtils.generateToken(testUser1._id);

    testUser2 = new User(global.testUtils.createTestUser({
      name: 'Expense User 2',
      email: 'expense2@test.com'
    }));
    await testUser2.save();
    authToken2 = global.testUtils.generateToken(testUser2._id);

    testUser3 = new User(global.testUtils.createTestUser({
      name: 'Expense User 3',
      email: 'expense3@test.com'
    }));
    await testUser3.save();
    authToken3 = global.testUtils.generateToken(testUser3._id);

    // Add friendships
    testUser1.friends.push(testUser2._id, testUser3._id);
    testUser2.friends.push(testUser1._id, testUser3._id);
    testUser3.friends.push(testUser1._id, testUser2._id);
    await testUser1.save();
    await testUser2.save();
    await testUser3.save();

    // Create test group
    testGroup = new Group(global.testUtils.createTestGroup(
      testUser1._id,
      [testUser2._id, testUser3._id]
    ));
    await testGroup.save();
  });

  describe('💰 Complete Expense Lifecycle', () => {
    test('should complete full expense workflow: create -> view -> settle -> verify', async () => {
      const expenseData = {
        description: 'Integration Test Dinner',
        amount: 120,
        splitWith: [
          { user: testUser2._id, amount: 40 },
          { user: testUser3._id, amount: 40 }
        ],
        category: 'food',
        date: new Date().toISOString()
      };

      // Step 1: Create expense
      const createResponse = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(expenseData)
        .expect(201);

      expect(createResponse.body).toHaveProperty('success', true);
      expect(createResponse.body).toHaveProperty('data');
      const expenseId = createResponse.body.data._id;
      expect(createResponse.body.data).toHaveProperty('description', expenseData.description);
      expect(createResponse.body.data).toHaveProperty('amount', expenseData.amount);
      expect(createResponse.body.data.splitWith).toHaveLength(2);

      // Step 2: Verify expense appears in creator's list
      const user1ExpensesResponse = await request(app)
        .get('/v1/expenses')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(user1ExpensesResponse.body.data).toHaveLength(1);
      expect(user1ExpensesResponse.body.data[0]).toHaveProperty('_id', expenseId);

      // Step 3: Verify expense appears in other users' lists
      const user2ExpensesResponse = await request(app)
        .get('/v1/expenses')
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(user2ExpensesResponse.body.data).toHaveLength(1);
      expect(user2ExpensesResponse.body.data[0]).toHaveProperty('_id', expenseId);

      // Step 4: Get expense details
      const expenseDetailResponse = await request(app)
        .get(`/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(expenseDetailResponse.body.data).toHaveProperty('_id', expenseId);
      expect(expenseDetailResponse.body.data).toHaveProperty('isSettled', false);

      // Step 5: User 2 settles their part
      const settleResponse = await request(app)
        .put(`/v1/expenses/${expenseId}/settle`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(settleResponse.body).toHaveProperty('success', true);

      // Step 6: Verify settlement status
      const afterSettleResponse = await request(app)
        .get(`/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      const user2Split = afterSettleResponse.body.data.splitWith.find(
        s => s.user._id === testUser2._id.toString()
      );
      expect(user2Split.settled).toBe(true);
      expect(user2Split.settledAt).toBeTruthy();

      // Step 7: User 3 settles their part
      await request(app)
        .put(`/v1/expenses/${expenseId}/settle`)
        .set('Authorization', `Bearer ${authToken3}`)
        .expect(200);

      // Step 8: Verify expense is fully settled
      const fullySettledResponse = await request(app)
        .get(`/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(fullySettledResponse.body.data.isSettled).toBe(true);
      expect(fullySettledResponse.body.data.settledAt).toBeTruthy();
      fullySettledResponse.body.data.splitWith.forEach(split => {
        expect(split.settled).toBe(true);
      });

      // Step 9: Verify balances are calculated correctly
      const balance1to2Response = await request(app)
        .get(`/v1/expenses/balance/${testUser2._id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(balance1to2Response.body.data.balance).toBe(40);

      const balance1to3Response = await request(app)
        .get(`/v1/expenses/balance/${testUser3._id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(balance1to3Response.body.data.balance).toBe(40);
    });

    test('should handle complex multi-user expense scenarios', async () => {
      // Scenario: Multiple expenses between different combinations of users
      const expenses = [
        {
          payer: testUser1._id,
          payerToken: authToken1,
          description: 'Dinner - User 1 pays',
          amount: 90,
          splitWith: [
            { user: testUser2._id, amount: 30 },
            { user: testUser3._id, amount: 30 }
          ]
        },
        {
          payer: testUser2._id,
          payerToken: authToken2,
          description: 'Movie - User 2 pays',
          amount: 60,
          splitWith: [
            { user: testUser1._id, amount: 20 },
            { user: testUser3._id, amount: 20 }
          ]
        },
        {
          payer: testUser3._id,
          payerToken: authToken3,
          description: 'Coffee - User 3 pays',
          amount: 30,
          splitWith: [
            { user: testUser1._id, amount: 10 },
            { user: testUser2._id, amount: 10 }
          ]
        }
      ];

      // Create all expenses
      const createdExpenses = [];
      for (const expense of expenses) {
        const response = await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${expense.payerToken}`)
          .send({
            description: expense.description,
            amount: expense.amount,
            splitWith: expense.splitWith,
            category: 'entertainment'
          })
          .expect(201);

        createdExpenses.push(response.body.data);
      }

      // Verify all users see all expenses
      for (const token of [authToken1, authToken2, authToken3]) {
        const expensesResponse = await request(app)
          .get('/v1/expenses')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(expensesResponse.body.data).toHaveLength(3);
      }

      // Calculate expected balances
      // User 1: Paid 90, owes 30 (20+10) = net +60
      // User 2: Paid 60, owes 40 (30+10) = net +20  
      // User 3: Paid 30, owes 50 (30+20) = net -20

      const balance1to2Response = await request(app)
        .get(`/v1/expenses/balance/${testUser2._id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      const balance1to3Response = await request(app)
        .get(`/v1/expenses/balance/${testUser3._id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      // User 1 should be owed money from both users
      expect(balance1to2Response.body.data.balance).toBe(20); // 30 - 10 = 20
      expect(balance1to3Response.body.data.balance).toBe(20); // 30 - 10 = 20
    });

    test('should handle expense updates and modifications', async () => {
      // Create initial expense
      const expenseData = {
        description: 'Initial Expense',
        amount: 100,
        splitWith: [{ user: testUser2._id, amount: 50 }],
        category: 'food'
      };

      const createResponse = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(expenseData)
        .expect(201);

      const expenseId = createResponse.body.data._id;

      // Update expense description and category
      const updateData = {
        description: 'Updated Expense Description',
        category: 'entertainment'
      };

      const updateResponse = await request(app)
        .put(`/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.data).toHaveProperty('description', updateData.description);
      expect(updateResponse.body.data).toHaveProperty('category', updateData.category);
      expect(updateResponse.body.data).toHaveProperty('amount', 100); // Unchanged

      // Verify update persisted
      const getResponse = await request(app)
        .get(`/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(getResponse.body.data).toHaveProperty('description', updateData.description);
      expect(getResponse.body.data).toHaveProperty('category', updateData.category);
    });

    test('should prevent unauthorized expense modifications', async () => {
      // User 1 creates expense
      const expenseData = {
        description: 'User 1 Expense',
        amount: 100,
        splitWith: [{ user: testUser2._id, amount: 50 }]
      };

      const createResponse = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(expenseData)
        .expect(201);

      const expenseId = createResponse.body.data._id;

      // User 3 (not involved) tries to update expense
      const unauthorizedUpdate = await request(app)
        .put(`/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken3}`)
        .send({ description: 'Unauthorized Update' })
        .expect(403);

      expect(unauthorizedUpdate.body).toHaveProperty('success', false);

      // User 3 tries to delete expense
      const unauthorizedDelete = await request(app)
        .delete(`/v1/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${authToken3}`)
        .expect(403);

      expect(unauthorizedDelete.body).toHaveProperty('success', false);
    });
  });

  describe('👥 Group Expense Workflows', () => {
    test('should handle group expense creation and management', async () => {
      const groupExpenseData = {
        description: 'Group Dinner',
        amount: 150,
        splitWith: [
          { user: testUser2._id, amount: 50 },
          { user: testUser3._id, amount: 50 }
        ],
        category: 'food',
        group: testGroup._id
      };

      // Create group expense
      const createResponse = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(groupExpenseData)
        .expect(201);

      expect(createResponse.body.data).toHaveProperty('group', testGroup._id.toString());

      // Get group expenses
      const groupExpensesResponse = await request(app)
        .get(`/v1/groups/${testGroup._id}/expenses`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(groupExpensesResponse.body.data).toHaveLength(1);
      expect(groupExpensesResponse.body.data[0]).toHaveProperty('group', testGroup._id.toString());

      // Verify all group members can see the expense
      for (const token of [authToken1, authToken2, authToken3]) {
        const memberExpensesResponse = await request(app)
          .get('/v1/expenses')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(memberExpensesResponse.body.data).toHaveLength(1);
      }
    });

    test('should calculate group balances correctly', async () => {
      // Create multiple group expenses
      const groupExpenses = [
        {
          description: 'Group Expense 1',
          amount: 120,
          payer: authToken1,
          splitWith: [
            { user: testUser2._id, amount: 40 },
            { user: testUser3._id, amount: 40 }
          ]
        },
        {
          description: 'Group Expense 2',
          amount: 90,
          payer: authToken2,
          splitWith: [
            { user: testUser1._id, amount: 30 },
            { user: testUser3._id, amount: 30 }
          ]
        }
      ];

      for (const expense of groupExpenses) {
        await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${expense.payer}`)
          .send({
            description: expense.description,
            amount: expense.amount,
            splitWith: expense.splitWith,
            group: testGroup._id,
            category: 'food'
          })
          .expect(201);
      }

      // Get group balance summary
      const groupBalanceResponse = await request(app)
        .get(`/v1/groups/${testGroup._id}/balances`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(groupBalanceResponse.body).toHaveProperty('success', true);
      expect(groupBalanceResponse.body).toHaveProperty('data');
      expect(Array.isArray(groupBalanceResponse.body.data)).toBe(true);

      // Verify individual balances
      const user1Balance = groupBalanceResponse.body.data.find(
        b => b.user._id === testUser1._id.toString()
      );
      const user2Balance = groupBalanceResponse.body.data.find(
        b => b.user._id === testUser2._id.toString()
      );
      const user3Balance = groupBalanceResponse.body.data.find(
        b => b.user._id === testUser3._id.toString()
      );

      expect(user1Balance).toBeTruthy();
      expect(user2Balance).toBeTruthy();
      expect(user3Balance).toBeTruthy();

      // Total balances should sum to zero
      const totalBalance = user1Balance.balance + user2Balance.balance + user3Balance.balance;
      expect(Math.abs(totalBalance)).toBeLessThan(0.01); // Account for floating point precision
    });

    test('should handle group member permissions for expenses', async () => {
      // Non-group member tries to create group expense
      const outsiderUser = new User(global.testUtils.createTestUser({
        email: 'outsider@test.com'
      }));
      await outsiderUser.save();
      const outsiderToken = global.testUtils.generateToken(outsiderUser._id);

      const unauthorizedExpense = await request(app)
        .post('/v1/expenses')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          description: 'Unauthorized Group Expense',
          amount: 100,
          splitWith: [{ user: testUser1._id, amount: 50 }],
          group: testGroup._id
        })
        .expect(403);

      expect(unauthorizedExpense.body).toHaveProperty('success', false);

      // Non-group member tries to view group expenses
      const unauthorizedView = await request(app)
        .get(`/v1/groups/${testGroup._id}/expenses`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(403);

      expect(unauthorizedView.body).toHaveProperty('success', false);
    });
  });

  describe('📊 Expense Analytics and Reporting', () => {
    beforeEach(async () => {
      // Create sample expenses for analytics
      const sampleExpenses = [
        { amount: 50, category: 'food', date: new Date('2023-01-15') },
        { amount: 30, category: 'transport', date: new Date('2023-01-20') },
        { amount: 100, category: 'food', date: new Date('2023-02-10') },
        { amount: 25, category: 'entertainment', date: new Date('2023-02-15') },
        { amount: 75, category: 'food', date: new Date('2023-03-05') }
      ];

      for (const expense of sampleExpenses) {
        await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${authToken1}`)
          .send({
            description: `Sample ${expense.category} expense`,
            amount: expense.amount,
            splitWith: [{ user: testUser2._id, amount: expense.amount / 2 }],
            category: expense.category,
            date: expense.date.toISOString()
          })
          .expect(201);
      }
    });

    test('should provide expense analytics by category', async () => {
      const analyticsResponse = await request(app)
        .get('/v1/expenses/analytics/category')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(analyticsResponse.body).toHaveProperty('success', true);
      expect(analyticsResponse.body).toHaveProperty('data');
      expect(Array.isArray(analyticsResponse.body.data)).toBe(true);

      const foodCategory = analyticsResponse.body.data.find(c => c._id === 'food');
      expect(foodCategory).toBeTruthy();
      expect(foodCategory.totalAmount).toBe(225); // 50 + 100 + 75
      expect(foodCategory.count).toBe(3);
    });

    test('should provide expense analytics by time period', async () => {
      const monthlyAnalytics = await request(app)
        .get('/v1/expenses/analytics/monthly?year=2023')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(monthlyAnalytics.body).toHaveProperty('success', true);
      expect(monthlyAnalytics.body).toHaveProperty('data');

      const januaryData = monthlyAnalytics.body.data.find(m => m.month === 1);
      const februaryData = monthlyAnalytics.body.data.find(m => m.month === 2);
      const marchData = monthlyAnalytics.body.data.find(m => m.month === 3);

      expect(januaryData.totalAmount).toBe(80); // 50 + 30
      expect(februaryData.totalAmount).toBe(125); // 100 + 25
      expect(marchData.totalAmount).toBe(75); // 75
    });

    test('should provide expense summary statistics', async () => {
      const summaryResponse = await request(app)
        .get('/v1/expenses/summary')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(summaryResponse.body).toHaveProperty('success', true);
      expect(summaryResponse.body.data).toHaveProperty('totalExpenses');
      expect(summaryResponse.body.data).toHaveProperty('totalAmount');
      expect(summaryResponse.body.data).toHaveProperty('averageAmount');
      expect(summaryResponse.body.data).toHaveProperty('expenseCount');
      expect(summaryResponse.body.data).toHaveProperty('categorySummary');

      expect(summaryResponse.body.data.totalAmount).toBe(280); // Sum of all amounts
      expect(summaryResponse.body.data.expenseCount).toBe(5);
      expect(summaryResponse.body.data.averageAmount).toBe(56); // 280 / 5
    });
  });

  describe('🔍 Expense Search and Filtering', () => {
    beforeEach(async () => {
      // Create diverse expenses for search testing
      const searchExpenses = [
        { description: 'Pizza dinner with friends', amount: 45, category: 'food' },
        { description: 'Uber ride to airport', amount: 25, category: 'transport' },
        { description: 'Movie tickets', amount: 30, category: 'entertainment' },
        { description: 'Grocery shopping', amount: 80, category: 'food' },
        { description: 'Coffee meeting', amount: 15, category: 'food' }
      ];

      for (const expense of searchExpenses) {
        await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${authToken1}`)
          .send({
            description: expense.description,
            amount: expense.amount,
            splitWith: [{ user: testUser2._id, amount: expense.amount / 2 }],
            category: expense.category
          })
          .expect(201);
      }
    });

    test('should search expenses by description', async () => {
      const searchResponse = await request(app)
        .get('/v1/expenses/search?q=pizza')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(searchResponse.body.data).toHaveLength(1);
      expect(searchResponse.body.data[0].description).toContain('Pizza');
    });

    test('should filter expenses by category', async () => {
      const foodExpensesResponse = await request(app)
        .get('/v1/expenses?category=food')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(foodExpensesResponse.body.data).toHaveLength(3);
      foodExpensesResponse.body.data.forEach(expense => {
        expect(expense.category).toBe('food');
      });
    });

    test('should filter expenses by amount range', async () => {
      const rangeResponse = await request(app)
        .get('/v1/expenses?minAmount=20&maxAmount=50')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      rangeResponse.body.data.forEach(expense => {
        expect(expense.amount).toBeGreaterThanOrEqual(20);
        expect(expense.amount).toBeLessThanOrEqual(50);
      });
    });

    test('should filter expenses by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const dateRangeResponse = await request(app)
        .get(`/v1/expenses?startDate=${yesterday.toISOString()}&endDate=${tomorrow.toISOString()}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(dateRangeResponse.body.data.length).toBeGreaterThan(0);
      dateRangeResponse.body.data.forEach(expense => {
        const expenseDate = new Date(expense.date);
        expect(expenseDate.getTime()).toBeGreaterThanOrEqual(yesterday.getTime());
        expect(expenseDate.getTime()).toBeLessThanOrEqual(tomorrow.getTime());
      });
    });

    test('should combine multiple filters', async () => {
      const combinedFilterResponse = await request(app)
        .get('/v1/expenses?category=food&minAmount=40')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      combinedFilterResponse.body.data.forEach(expense => {
        expect(expense.category).toBe('food');
        expect(expense.amount).toBeGreaterThanOrEqual(40);
      });
    });

    test('should paginate search results', async () => {
      const page1Response = await request(app)
        .get('/v1/expenses?page=1&limit=3')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(page1Response.body.data).toHaveLength(3);
      expect(page1Response.body).toHaveProperty('pagination');
      expect(page1Response.body.pagination.current).toBe(1);

      const page2Response = await request(app)
        .get('/v1/expenses?page=2&limit=3')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(page2Response.body.data).toHaveLength(2); // Remaining expenses
      expect(page2Response.body.pagination.current).toBe(2);
    });
  });

  describe('⚡ Expense Performance Tests', () => {
    test('should handle expense operations within performance limits', async () => {
      const operations = [
        () => request(app).get('/v1/expenses').set('Authorization', `Bearer ${authToken1}`),
        () => request(app).post('/v1/expenses').set('Authorization', `Bearer ${authToken1}`).send({
          description: 'Performance Test Expense',
          amount: 50,
          splitWith: [{ user: testUser2._id, amount: 25 }]
        }),
        () => request(app).get('/v1/expenses/summary').set('Authorization', `Bearer ${authToken1}`)
      ];

      for (const operation of operations) {
        const startTime = Date.now();
        const response = await operation();
        const responseTime = Date.now() - startTime;

        expect(response.status).toBeLessThan(400);
        expect(responseTime).toBeLessThan(3000); // Should complete within 3 seconds
      }
    });

    test('should handle large numbers of expenses efficiently', async () => {
      // Create many expenses
      const expensePromises = [];
      for (let i = 0; i < 100; i++) {
        expensePromises.push(
          request(app)
            .post('/v1/expenses')
            .set('Authorization', `Bearer ${authToken1}`)
            .send({
              description: `Bulk Expense ${i}`,
              amount: Math.floor(Math.random() * 100) + 10,
              splitWith: [{ user: testUser2._id, amount: 25 }],
              category: ['food', 'transport', 'entertainment'][i % 3]
            })
        );
      }

      const startTime = Date.now();
      await Promise.all(expensePromises);
      const creationTime = Date.now() - startTime;

      // Test retrieval performance
      const retrievalStartTime = Date.now();
      const expensesResponse = await request(app)
        .get('/v1/expenses?limit=50')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);
      const retrievalTime = Date.now() - retrievalStartTime;

      expect(expensesResponse.body.data).toHaveLength(50);
      expect(creationTime).toBeLessThan(60000); // 60 seconds for 100 expenses
      expect(retrievalTime).toBeLessThan(3000); // 3 seconds to retrieve 50 expenses
    });
  });
});