const request = require('supertest');
const createTestApp = require('../test-server');
const User = require('../../models/User');
const Expense = require('../../models/Expense');
const Group = require('../../models/Group');

// Create test app instance
const app = createTestApp();

describe('⚡ Performance Tests - Load Testing', () => {
  let testUsers = [];
  let authTokens = [];

  beforeAll(async () => {
    // Create multiple test users for load testing
    const userPromises = [];
    for (let i = 0; i < 50; i++) {
      const user = new User(global.testUtils.createTestUser({
        name: `Load Test User ${i}`,
        email: `loadtest${i}@test.com`
      }));
      userPromises.push(user.save());
    }
    
    testUsers = await Promise.all(userPromises);
    authTokens = testUsers.map(user => global.testUtils.generateToken(user._id));
  }, 60000);

  beforeEach(async () => {
    // Clean expenses and groups for each test
    await Expense.deleteMany({});
    await Group.deleteMany({});
  });

  describe('🚀 API Response Time Tests', () => {
    test('should handle authentication requests within acceptable time', async () => {
      const iterations = 100;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await request(app)
          .post('/v1/auth/login')
          .send({
            email: `loadtest${i % 10}@test.com`,
            password: 'password123'
          })
          .expect(200);
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      console.log(`Authentication Performance:
        Average: ${averageResponseTime.toFixed(2)}ms
        Min: ${minResponseTime}ms
        Max: ${maxResponseTime}ms
        95th percentile: ${responseTimes.sort((a, b) => a - b)[Math.floor(iterations * 0.95)]}ms`);

      expect(averageResponseTime).toBeLessThan(2000); // Average under 2 seconds
      expect(maxResponseTime).toBeLessThan(5000); // Max under 5 seconds
    });

    test('should handle profile requests with consistent performance', async () => {
      const iterations = 200;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const tokenIndex = i % authTokens.length;
        const startTime = Date.now();
        
        await request(app)
          .get('/v1/users/profile')
          .set('Authorization', `Bearer ${authTokens[tokenIndex]}`)
          .expect(200);
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];

      console.log(`Profile Request Performance:
        Average: ${averageResponseTime.toFixed(2)}ms
        95th percentile: ${p95ResponseTime}ms`);

      expect(averageResponseTime).toBeLessThan(1000); // Average under 1 second
      expect(p95ResponseTime).toBeLessThan(2000); // 95% under 2 seconds
    });

    test('should handle expense creation under load', async () => {
      const iterations = 100;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const userIndex = i % authTokens.length;
        const friendIndex = (i + 1) % authTokens.length;
        
        const startTime = Date.now();
        
        await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${authTokens[userIndex]}`)
          .send({
            description: `Load Test Expense ${i}`,
            amount: Math.floor(Math.random() * 100) + 10,
            splitWith: [{ user: testUsers[friendIndex]._id, amount: 25 }],
            category: 'food'
          })
          .expect(201);
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      }

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];

      console.log(`Expense Creation Performance:
        Average: ${averageResponseTime.toFixed(2)}ms
        95th percentile: ${p95ResponseTime}ms`);

      expect(averageResponseTime).toBeLessThan(3000); // Average under 3 seconds
      expect(p95ResponseTime).toBeLessThan(5000); // 95% under 5 seconds
    });
  });

  describe('🔄 Concurrent Request Handling', () => {
    test('should handle concurrent authentication requests', async () => {
      const concurrentRequests = 50;
      const promises = [];

      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .post('/v1/auth/login')
            .send({
              email: `loadtest${i % 10}@test.com`,
              password: 'password123'
            })
        );
      }

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
      });

      const averageTimePerRequest = totalTime / concurrentRequests;
      
      console.log(`Concurrent Authentication Performance:
        Total time: ${totalTime}ms
        Average per request: ${averageTimePerRequest.toFixed(2)}ms
        Requests per second: ${(concurrentRequests / (totalTime / 1000)).toFixed(2)}`);

      expect(totalTime).toBeLessThan(30000); // All requests within 30 seconds
      expect(averageTimePerRequest).toBeLessThan(1000); // Average under 1 second per request
    });

    test('should handle concurrent expense creation', async () => {
      const concurrentRequests = 30;
      const promises = [];

      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        const userIndex = i % authTokens.length;
        const friendIndex = (i + 1) % authTokens.length;

        promises.push(
          request(app)
            .post('/v1/expenses')
            .set('Authorization', `Bearer ${authTokens[userIndex]}`)
            .send({
              description: `Concurrent Expense ${i}`,
              amount: Math.floor(Math.random() * 100) + 10,
              splitWith: [{ user: testUsers[friendIndex]._id, amount: 25 }],
              category: ['food', 'transport', 'entertainment'][i % 3]
            })
        );
      }

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
      });

      console.log(`Concurrent Expense Creation Performance:
        Total time: ${totalTime}ms
        Requests per second: ${(concurrentRequests / (totalTime / 1000)).toFixed(2)}`);

      expect(totalTime).toBeLessThan(45000); // All requests within 45 seconds

      // Verify all expenses were created
      const expenseCount = await Expense.countDocuments();
      expect(expenseCount).toBe(concurrentRequests);
    });

    test('should handle concurrent user search requests', async () => {
      const concurrentRequests = 100;
      const searchQueries = ['Load', 'Test', 'User', 'loadtest', 'performance'];
      const promises = [];

      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        const query = searchQueries[i % searchQueries.length];
        const tokenIndex = i % authTokens.length;

        promises.push(
          request(app)
            .get(`/v1/users/search?q=${query}`)
            .set('Authorization', `Bearer ${authTokens[tokenIndex]}`)
        );
      }

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
      });

      console.log(`Concurrent Search Performance:
        Total time: ${totalTime}ms
        Requests per second: ${(concurrentRequests / (totalTime / 1000)).toFixed(2)}`);

      expect(totalTime).toBeLessThan(20000); // All requests within 20 seconds
    });

    test('should handle mixed concurrent operations', async () => {
      const operationsPerType = 20;
      const promises = [];

      const startTime = Date.now();

      // Mix of different operations
      for (let i = 0; i < operationsPerType; i++) {
        const tokenIndex = i % authTokens.length;
        
        // Profile requests
        promises.push(
          request(app)
            .get('/v1/users/profile')
            .set('Authorization', `Bearer ${authTokens[tokenIndex]}`)
        );

        // Search requests
        promises.push(
          request(app)
            .get('/v1/users/search?q=Load')
            .set('Authorization', `Bearer ${authTokens[tokenIndex]}`)
        );

        // Expense creation
        promises.push(
          request(app)
            .post('/v1/expenses')
            .set('Authorization', `Bearer ${authTokens[tokenIndex]}`)
            .send({
              description: `Mixed Operation Expense ${i}`,
              amount: 50,
              splitWith: [{ user: testUsers[(i + 1) % testUsers.length]._id, amount: 25 }],
              category: 'food'
            })
        );

        // Health checks
        promises.push(
          request(app).get('/v1/healthz')
        );
      }

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // Count successful responses
      const successfulResponses = responses.filter(r => r.status < 400).length;
      const totalRequests = promises.length;

      console.log(`Mixed Operations Performance:
        Total requests: ${totalRequests}
        Successful: ${successfulResponses}
        Success rate: ${((successfulResponses / totalRequests) * 100).toFixed(2)}%
        Total time: ${totalTime}ms
        Requests per second: ${(totalRequests / (totalTime / 1000)).toFixed(2)}`);

      expect(successfulResponses / totalRequests).toBeGreaterThan(0.95); // 95% success rate
      expect(totalTime).toBeLessThan(60000); // All requests within 60 seconds
    });
  });

//   describe('📊 Database Performance Under Load', () => {
//     test('should handle large dataset queries efficiently', async () => {
//       // Create a large dataset
//       const expenseCount = 1000;
//       const expenses = [];

//       for (let i = 0; i < expenseCount; i++) {
//         expenses.push({
//           description: `Dataset Expense ${i}`,
//           amount: Math.floor(Math.random() * 200) + 10,
//           paidBy: testUsers[i % testUsers.length]._id,
//           splitWith: [{
//             user: testUsers[(i + 1) % testUsers.length]._id,
//             amount: Math.floor(Math.random() * 50) + 5,
//             settled: Math.random() > 0.5
//           }],
//           category: ['food', 'transport', 'entertainment', 'shopping', 'utilities'][i % 5],
//           date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) // Random date within last year
//         });
//       }

//       const insertStartTime = Date.now();
//       await Expense.insertMany(expenses);
//       const insertTime = Date.now() - insertStartTime;

//       console.log(`Dataset Creation: ${insertTime}ms for ${expenseCount} expenses`);

//       // Test various query performance
//       const queryTests = [
//         {
//           name: 'Simple pagination',
//           query: () => Expense.find().limit(50).populate('paidBy splitWith.user')
//         },
//         {
//           name: 'Category filtering',
//           query: () => Expense.find({ category: 'food' }).populate('paidBy splitWith.user')
//         },
//         {
//           name: 'Amount range filtering',
//           query: () => Expense.find({ amount: { $gte: 50, $lte: 150 } }).populate('paidBy splitWith.user')
//         },
//         {
//           name: 'Date range filtering',
//           query: () => Expense.find({ 
//             date: { 
//               $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
//               $lte: new Date()
//             }
//           }).populate('paidBy splitWith.user')
//         },
//         {
//           name: 'User-specific expenses',
//           query: () => Expense.find({ paidBy: testUsers[0]._id }).populate('paidBy splitWith.user')
//         }
//       ];

//       for (const test of queryTests) {
//         const queryStartTime = Date.now();
//         const results = await test.query();
//         const queryTime = Date.now() - queryStartTime;

//         console.log(`${test.name}: ${queryTime}ms (${results.length} results)`);
//         expect(queryTime).toBeLessThan(5000); // Each query under 5 seconds
//       }
//     });

//     test('should handle concurrent database operations', async () => {
//       const concurrentOperations = 50;
//       const promises = [];

//       const startTime = Date.now();

//       for (let i = 0; i < concurrentOperations; i++) {
//         const userIndex = i % testUsers.length;
        
//         // Mix of read and write operations
//         if (i % 3 === 0) {
//           // Create expense
//           promises.push(
//             Expense.create({
//               description: `Concurrent DB Expense ${i}`,
//               amount: Math.floor(Math.random() * 100) + 10,
//               paidBy: testUsers[userIndex]._id,
//               splitWith: [{
//                 user: testUsers[(userIndex + 1) % testUsers.length]._id,
//                 amount: 25,
//                 settled: false
//               }],
//               category: 'food'
//             })
//           );
//         } else if (i % 3 === 1) {
//           // Read user profile
//           promises.push(
//             User.findById(testUsers[userIndex]._id).populate('friends')
//           );
//         } else {
//           // Count expenses
//           promises.push(
//             Expense.countDocuments({ paidBy: testUsers[userIndex]._id })
//           );
//         }
//       }

//       const results = await Promise.all(promises);
//       const totalTime = Date.now() - startTime;

//       console.log(`Concurrent DB Operations Performance:
//         Operations: ${concurrentOperations}
//         Total time: ${totalTime}ms
//         Operations per second: ${(concurrentOperations / (totalTime / 1000)).toFixed(2)}`);

//       expect(totalTime).toBeLessThan(30000); // All operations within 30 seconds
//       expect(results.length).toBe(concurrentOperations);
//     });

//     test('should maintain performance with complex aggregations', async () => {
//       // Create sample data for aggregation
//       const sampleExpenses = [];
//       for (let i = 0; i < 500; i++) {
//         sampleExpenses.push({
//           description: `Aggregation Test Expense ${i}`,
//           amount: Math.floor(Math.random() * 200) + 10,
//           paidBy: testUsers[i % testUsers.length]._id,
//           splitWith: [{
//             user: testUsers[(i + 1) % testUsers.length]._id,
//             amount: Math.floor(Math.random() * 50) + 5,
//             settled: Math.random() > 0.5
//           }],
//           category: ['food', 'transport', 'entertainment'][i % 3],
//           date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
//         });
//       }
//       await Expense.insertMany(sampleExpenses);

//       const aggregationTests = [
//         {
//           name: 'Category totals',
//           pipeline: [
//             { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
//             { $sort: { total: -1 } }
//           ]
//         },
//         {
//           name: 'Monthly spending',
//           pipeline: [
//             {
//               $group: {
//                 _id: {
//                   year: { $year: '$date' },
//                   month: { $month: '$date' }
//                 },
//                 total: { $sum: '$amount' },
//                 count: { $sum: 1 }
//               }
//             },
//             { $sort: { '_id.year': -1, '_id.month': -1 } }
//           ]
//         },
//         {
//           name: 'User spending summary',
//           pipeline: [
//             { $group: { _id: '$paidBy', totalPaid: { $sum: '$amount' }, expenseCount: { $sum: 1 } } },
//             { $sort: { totalPaid: -1 } },
//             { $limit: 10 }
//           ]
//         }
//       ];

//       for (const test of aggregationTests) {
//         const startTime = Date.now();
//         const results = await Expense.aggregate(test.pipeline);
//         const queryTime = Date.now() - startTime;

//         console.log(`${test.name}: ${queryTime}ms (${results.length} results)`);
//         expect(queryTime).toBeLessThan(3000); // Aggregations under 3 seconds
//         expect(results.length).toBeGreaterThan(0);
//       }
//     });
//   });

//   describe('💾 Memory Usage Tests', () => {
//     test('should handle memory efficiently during bulk operations', async () => {
//       const initialMemory = process.memoryUsage();
      
//       // Perform memory-intensive operations
//       const bulkOperations = [];
//       for (let i = 0; i < 100; i++) {
//         bulkOperations.push(
//           request(app)
//             .post('/v1/expenses')
//             .set('Authorization', `Bearer ${authTokens[i % authTokens.length]}`)
//             .send({
//               description: `Memory Test Expense ${i}`,
//               amount: Math.floor(Math.random() * 100) + 10,
//               splitWith: [{ user: testUsers[(i + 1) % testUsers.length]._id, amount: 25 }],
//               category: 'food'
//             })
//         );
//       }

//       await Promise.all(bulkOperations);
      
//       const finalMemory = process.memoryUsage();
//       const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
//       const memoryIncreaseKB = memoryIncrease / 1024;

//       console.log(`Memory Usage:
//         Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
//         Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
//         Increase: ${memoryIncreaseKB.toFixed(2)}KB`);

//       // Memory increase should be reasonable (less than 50MB for 100 operations)
//       expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
//     });

//     test('should handle garbage collection efficiently', async () => {
//       const iterations = 5;
//       const memorySnapshots = [];

//       for (let i = 0; i < iterations; i++) {
//         // Perform operations that create temporary objects
//         const promises = [];
//         for (let j = 0; j < 20; j++) {
//           promises.push(
//             request(app)
//               .get('/v1/users/search?q=Load')
//               .set('Authorization', `Bearer ${authTokens[j % authTokens.length]}`)
//           );
//         }
        
//         await Promise.all(promises);
        
//         // Force garbage collection if available
//         if (global.gc) {
//           global.gc();
//         }
        
//         memorySnapshots.push(process.memoryUsage().heapUsed);
        
//         // Small delay between iterations
//         await global.testUtils.wait(1000);
//       }

//       // Memory should not continuously increase
//       const memoryTrend = memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0];
//       const memoryTrendMB = memoryTrend / 1024 / 1024;

//       console.log(`Memory Trend: ${memoryTrendMB.toFixed(2)}MB over ${iterations} iterations`);
      
//       // Memory increase should be minimal (less than 20MB over iterations)
//       expect(Math.abs(memoryTrendMB)).toBeLessThan(20);
//     });
//   });

  describe('🌐 Network Performance Tests', () => {
    test('should handle varying payload sizes efficiently', async () => {
      const payloadSizes = [
        { size: 'small', description: 'Small expense', splitCount: 1 },
        { size: 'medium', description: 'A'.repeat(100), splitCount: 5 },
        { size: 'large', description: 'A'.repeat(200), splitCount: 10 }
      ];

      for (const payload of payloadSizes) {
        const splitWith = [];
        for (let i = 0; i < payload.splitCount; i++) {
          splitWith.push({
            user: testUsers[i % testUsers.length]._id,
            amount: Math.floor(Math.random() * 20) + 5
          });
        }

        const startTime = Date.now();
        
        const response = await request(app)
          .post('/v1/expenses')
          .set('Authorization', `Bearer ${authTokens[0]}`)
          .send({
            description: payload.description,
            amount: 100,
            splitWith,
            category: 'food'
          })
          .expect(201);

        const responseTime = Date.now() - startTime;
        
        console.log(`${payload.size} payload: ${responseTime}ms`);
        expect(responseTime).toBeLessThan(5000); // All payload sizes under 5 seconds
      }
    });

    test('should handle request timeouts gracefully', async () => {
      // Test with a reasonable timeout
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve({ timeout: true }), 10000); // 10 second timeout
      });

      const requestPromise = request(app)
        .get('/v1/users/search?q=Load')
        .set('Authorization', `Bearer ${authTokens[0]}`)
        .then(response => ({ response }));

      const result = await Promise.race([requestPromise, timeoutPromise]);

      if (result.timeout) {
        console.log('Request timed out after 10 seconds');
        expect(true).toBe(false); // Fail the test if request times out
      } else {
        expect(result.response.status).toBe(200);
        console.log('Request completed within timeout');
      }
    });
  });
});