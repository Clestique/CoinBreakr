// const request = require('supertest');
// const createTestApp = require('../test-server');
// const User = require('../../models/User');
// const Expense = require('../../models/Expense');
// const Group = require('../../models/Group');

// // Create test app instance
// const app = createTestApp();

// describe('💥 Stress Tests - System Breaking Points', () => {
//   let testUsers = [];
//   let authTokens = [];

//   beforeAll(async () => {
//     // Create users for stress testing
//     const userPromises = [];
//     for (let i = 0; i < 100; i++) {
//       const user = new User(global.testUtils.createTestUser({
//         name: `Stress Test User ${i}`,
//         email: `stress${i}@test.com`
//       }));
//       userPromises.push(user.save());
//     }
    
//     testUsers = await Promise.all(userPromises);
//     authTokens = testUsers.map(user => global.testUtils.generateToken(user._id));
//   }, 120000); // 2 minutes timeout for setup

//   beforeEach(async () => {
//     // Clean up data but keep users
//     await Expense.deleteMany({});
//     await Group.deleteMany({});
//   });

//   describe('🔥 High Concurrency Stress Tests', () => {
//     test('should handle extreme concurrent user registrations', async () => {
//       const concurrentRegistrations = 200;
//       const promises = [];
//       const startTime = Date.now();

//       for (let i = 0; i < concurrentRegistrations; i++) {
//         promises.push(
//           request(app)
//             .post('/v1/auth/register')
//             .send({
//               name: `Stress Registration User ${i}`,
//               email: `stressreg${i}@test.com`,
//               password: 'password123'
//             })
//         );
//       }

//       const responses = await Promise.all(promises);
//       const totalTime = Date.now() - startTime;

//       const successfulRegistrations = responses.filter(r => r.status === 201).length;
//       const failedRegistrations = responses.filter(r => r.status !== 201).length;

//       console.log(`Extreme Concurrent Registrations:
//         Total: ${concurrentRegistrations}
//         Successful: ${successfulRegistrations}
//         Failed: ${failedRegistrations}
//         Success Rate: ${((successfulRegistrations / concurrentRegistrations) * 100).toFixed(2)}%
//         Total Time: ${totalTime}ms
//         Registrations/sec: ${(successfulRegistrations / (totalTime / 1000)).toFixed(2)}`);

//       // Should handle at least 80% of concurrent registrations successfully
//       expect(successfulRegistrations / concurrentRegistrations).toBeGreaterThan(0.8);
//       expect(totalTime).toBeLessThan(120000); // Within 2 minutes
//     }, 150000);

//     test('should handle massive concurrent expense creation', async () => {
//       const concurrentExpenses = 500;
//       const promises = [];
//       const startTime = Date.now();

//       for (let i = 0; i < concurrentExpenses; i++) {
//         const userIndex = i % authTokens.length;
//         const friendIndex = (i + 1) % authTokens.length;

//         promises.push(
//           request(app)
//             .post('/v1/expenses')
//             .set('Authorization', `Bearer ${authTokens[userIndex]}`)
//             .send({
//               description: `Stress Expense ${i}`,
//               amount: Math.floor(Math.random() * 1000) + 10,
//               splitWith: [{ user: testUsers[friendIndex]._id, amount: Math.floor(Math.random() * 100) + 5 }],
//               category: ['food', 'transport', 'entertainment', 'shopping', 'utilities'][i % 5]
//             })
//         );
//       }

//       const responses = await Promise.all(promises);
//       const totalTime = Date.now() - startTime;

//       const successfulCreations = responses.filter(r => r.status === 201).length;
//       const failedCreations = responses.filter(r => r.status !== 201).length;

//       console.log(`Massive Concurrent Expense Creation:
//         Total: ${concurrentExpenses}
//         Successful: ${successfulCreations}
//         Failed: ${failedCreations}
//         Success Rate: ${((successfulCreations / concurrentExpenses) * 100).toFixed(2)}%
//         Total Time: ${totalTime}ms
//         Expenses/sec: ${(successfulCreations / (totalTime / 1000)).toFixed(2)}`);

//       // Should handle at least 70% of concurrent expense creations
//       expect(successfulCreations / concurrentExpenses).toBeGreaterThan(0.7);
//       expect(totalTime).toBeLessThan(180000); // Within 3 minutes

//       // Verify expenses were actually created in database
//       const dbExpenseCount = await Expense.countDocuments();
//       expect(dbExpenseCount).toBe(successfulCreations);
//     }, 200000);

//     test('should handle concurrent mixed operations under extreme load', async () => {
//       const operationsPerType = 100;
//       const promises = [];
//       const startTime = Date.now();

//       // Create a mix of different operations
//       for (let i = 0; i < operationsPerType; i++) {
//         const userIndex = i % authTokens.length;

//         // Authentication requests
//         promises.push(
//           request(app)
//             .post('/v1/auth/login')
//             .send({
//               email: `stress${userIndex}@test.com`,
//               password: 'password123'
//             })
//         );

//         // Profile requests
//         promises.push(
//           request(app)
//             .get('/v1/users/profile')
//             .set('Authorization', `Bearer ${authTokens[userIndex]}`)
//         );

//         // Search requests
//         promises.push(
//           request(app)
//             .get('/v1/users/search?q=Stress')
//             .set('Authorization', `Bearer ${authTokens[userIndex]}`)
//         );

//         // Expense creation
//         promises.push(
//           request(app)
//             .post('/v1/expenses')
//             .set('Authorization', `Bearer ${authTokens[userIndex]}`)
//             .send({
//               description: `Mixed Stress Expense ${i}`,
//               amount: Math.floor(Math.random() * 200) + 10,
//               splitWith: [{ user: testUsers[(userIndex + 1) % testUsers.length]._id, amount: 25 }],
//               category: 'food'
//             })
//         );

//         // Health checks
//         promises.push(
//           request(app).get('/v1/healthz')
//         );
//       }

//       const responses = await Promise.all(promises);
//       const totalTime = Date.now() - startTime;

//       const totalOperations = promises.length;
//       const successfulOperations = responses.filter(r => r.status < 400).length;
//       const failedOperations = responses.filter(r => r.status >= 400).length;

//       console.log(`Mixed Operations Under Extreme Load:
//         Total Operations: ${totalOperations}
//         Successful: ${successfulOperations}
//         Failed: ${failedOperations}
//         Success Rate: ${((successfulOperations / totalOperations) * 100).toFixed(2)}%
//         Total Time: ${totalTime}ms
//         Operations/sec: ${(successfulOperations / (totalTime / 1000)).toFixed(2)}`);

//       // Should handle at least 85% of mixed operations successfully
//       expect(successfulOperations / totalOperations).toBeGreaterThan(0.85);
//       expect(totalTime).toBeLessThan(240000); // Within 4 minutes
//     }, 300000);
//   });

//   describe('📊 Database Stress Tests', () => {
//     test('should handle massive data insertion', async () => {
//       const massiveDataCount = 5000;
//       const batchSize = 100;
//       const batches = Math.ceil(massiveDataCount / batchSize);

//       const startTime = Date.now();

//       for (let batch = 0; batch < batches; batch++) {
//         const expenses = [];
//         const currentBatchSize = Math.min(batchSize, massiveDataCount - (batch * batchSize));

//         for (let i = 0; i < currentBatchSize; i++) {
//           const globalIndex = (batch * batchSize) + i;
//           expenses.push({
//             description: `Massive Data Expense ${globalIndex}`,
//             amount: Math.floor(Math.random() * 1000) + 10,
//             paidBy: testUsers[globalIndex % testUsers.length]._id,
//             splitWith: [{
//               user: testUsers[(globalIndex + 1) % testUsers.length]._id,
//               amount: Math.floor(Math.random() * 100) + 5,
//               settled: Math.random() > 0.5
//             }],
//             category: ['food', 'transport', 'entertainment', 'shopping', 'utilities'][globalIndex % 5],
//             date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
//           });
//         }

//         await Expense.insertMany(expenses);
        
//         // Log progress
//         if ((batch + 1) % 10 === 0) {
//           console.log(`Inserted batch ${batch + 1}/${batches} (${((batch + 1) * batchSize)} expenses)`);
//         }
//       }

//       const totalTime = Date.now() - startTime;
//       const finalCount = await Expense.countDocuments();

//       console.log(`Massive Data Insertion:
//         Target: ${massiveDataCount}
//         Actual: ${finalCount}
//         Total Time: ${totalTime}ms
//         Insertions/sec: ${(finalCount / (totalTime / 1000)).toFixed(2)}`);

//       expect(finalCount).toBe(massiveDataCount);
//       expect(totalTime).toBeLessThan(300000); // Within 5 minutes
//     }, 360000);

//     test('should handle complex queries on large dataset', async () => {
//       // First create a substantial dataset
//       const datasetSize = 2000;
//       const expenses = [];

//       for (let i = 0; i < datasetSize; i++) {
//         expenses.push({
//           description: `Query Stress Expense ${i}`,
//           amount: Math.floor(Math.random() * 500) + 10,
//           paidBy: testUsers[i % testUsers.length]._id,
//           splitWith: [{
//             user: testUsers[(i + 1) % testUsers.length]._id,
//             amount: Math.floor(Math.random() * 100) + 5,
//             settled: Math.random() > 0.5
//           }],
//           category: ['food', 'transport', 'entertainment', 'shopping', 'utilities'][i % 5],
//           date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
//         });
//       }

//       await Expense.insertMany(expenses);

//       // Test complex queries under stress
//       const complexQueries = [
//         {
//           name: 'Complex aggregation with multiple stages',
//           query: () => Expense.aggregate([
//             { $match: { amount: { $gte: 50 } } },
//             { $lookup: { from: 'users', localField: 'paidBy', foreignField: '_id', as: 'payer' } },
//             { $unwind: '$payer' },
//             { $group: { 
//               _id: { category: '$category', month: { $month: '$date' } },
//               totalAmount: { $sum: '$amount' },
//               avgAmount: { $avg: '$amount' },
//               count: { $sum: 1 },
//               payers: { $addToSet: '$payer.name' }
//             }},
//             { $sort: { totalAmount: -1 } },
//             { $limit: 50 }
//           ])
//         },
//         {
//           name: 'Multi-collection join with filtering',
//           query: () => Expense.find({ 
//             amount: { $gte: 100, $lte: 400 },
//             category: { $in: ['food', 'entertainment'] }
//           })
//           .populate('paidBy', 'name email')
//           .populate('splitWith.user', 'name email')
//           .sort({ date: -1 })
//           .limit(100)
//         },
//         {
//           name: 'Text search simulation',
//           query: () => Expense.find({
//             $or: [
//               { description: { $regex: 'stress', $options: 'i' } },
//               { description: { $regex: 'expense', $options: 'i' } }
//             ]
//           }).populate('paidBy splitWith.user')
//         },
//         {
//           name: 'Date range with complex conditions',
//           query: () => Expense.find({
//             date: { 
//               $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
//               $lte: new Date()
//             },
//             $or: [
//               { amount: { $gte: 200 } },
//               { 'splitWith.settled': false }
//             ]
//           }).populate('paidBy splitWith.user')
//         }
//       ];

//       for (const queryTest of complexQueries) {
//         const queryStartTime = Date.now();
//         const results = await queryTest.query();
//         const queryTime = Date.now() - queryStartTime;

//         console.log(`${queryTest.name}: ${queryTime}ms (${results.length} results)`);
//         expect(queryTime).toBeLessThan(10000); // Complex queries under 10 seconds
//         expect(results.length).toBeGreaterThan(0);
//       }
//     }, 180000);

//     test('should handle concurrent database operations under stress', async () => {
//       const concurrentDbOps = 200;
//       const promises = [];
//       const startTime = Date.now();

//       for (let i = 0; i < concurrentDbOps; i++) {
//         const userIndex = i % testUsers.length;
        
//         // Mix of different database operations
//         switch (i % 5) {
//           case 0:
//             // Create expense
//             promises.push(
//               Expense.create({
//                 description: `Concurrent DB Stress Expense ${i}`,
//                 amount: Math.floor(Math.random() * 200) + 10,
//                 paidBy: testUsers[userIndex]._id,
//                 splitWith: [{
//                   user: testUsers[(userIndex + 1) % testUsers.length]._id,
//                   amount: 25,
//                   settled: false
//                 }],
//                 category: 'food'
//               })
//             );
//             break;
//           case 1:
//             // Find and populate
//             promises.push(
//               User.findById(testUsers[userIndex]._id).populate('friends')
//             );
//             break;
//           case 2:
//             // Aggregation
//             promises.push(
//               Expense.aggregate([
//                 { $match: { paidBy: testUsers[userIndex]._id } },
//                 { $group: { _id: '$category', total: { $sum: '$amount' } } }
//               ])
//             );
//             break;
//           case 3:
//             // Update operation
//             promises.push(
//               User.findByIdAndUpdate(
//                 testUsers[userIndex]._id,
//                 { lastLogin: new Date() },
//                 { new: true }
//               )
//             );
//             break;
//           case 4:
//             // Count operation
//             promises.push(
//               Expense.countDocuments({ paidBy: testUsers[userIndex]._id })
//             );
//             break;
//         }
//       }

//       const results = await Promise.all(promises);
//       const totalTime = Date.now() - startTime;

//       const successfulOps = results.filter(r => r !== null && r !== undefined).length;

//       console.log(`Concurrent Database Operations Under Stress:
//         Total Operations: ${concurrentDbOps}
//         Successful: ${successfulOps}
//         Success Rate: ${((successfulOps / concurrentDbOps) * 100).toFixed(2)}%
//         Total Time: ${totalTime}ms
//         Operations/sec: ${(successfulOps / (totalTime / 1000)).toFixed(2)}`);

//       expect(successfulOps / concurrentDbOps).toBeGreaterThan(0.9); // 90% success rate
//       expect(totalTime).toBeLessThan(120000); // Within 2 minutes
//     }, 150000);
//   });

//   describe('💾 Memory Stress Tests', () => {
//     test('should handle memory-intensive operations without leaks', async () => {
//       const iterations = 10;
//       const operationsPerIteration = 100;
//       const memorySnapshots = [];

//       for (let iteration = 0; iteration < iterations; iteration++) {
//         const promises = [];

//         // Create memory-intensive operations
//         for (let i = 0; i < operationsPerIteration; i++) {
//           const userIndex = i % authTokens.length;
          
//           promises.push(
//             request(app)
//               .get('/v1/users/search?q=Stress')
//               .set('Authorization', `Bearer ${authTokens[userIndex]}`)
//           );

//           promises.push(
//             request(app)
//               .post('/v1/expenses')
//               .set('Authorization', `Bearer ${authTokens[userIndex]}`)
//               .send({
//                 description: `Memory Stress Expense ${iteration}-${i}`,
//                 amount: Math.floor(Math.random() * 100) + 10,
//                 splitWith: [{ user: testUsers[(userIndex + 1) % testUsers.length]._id, amount: 25 }],
//                 category: 'food'
//               })
//           );
//         }

//         await Promise.all(promises);

//         // Force garbage collection if available
//         if (global.gc) {
//           global.gc();
//         }

//         const memoryUsage = process.memoryUsage();
//         memorySnapshots.push({
//           iteration,
//           heapUsed: memoryUsage.heapUsed,
//           heapTotal: memoryUsage.heapTotal,
//           external: memoryUsage.external
//         });

//         console.log(`Iteration ${iteration + 1}: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB heap used`);

//         // Small delay between iterations
//         await global.testUtils.wait(2000);
//       }

//       // Analyze memory trend
//       const initialMemory = memorySnapshots[0].heapUsed;
//       const finalMemory = memorySnapshots[memorySnapshots.length - 1].heapUsed;
//       const memoryIncrease = finalMemory - initialMemory;
//       const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

//       console.log(`Memory Stress Test Results:
//         Initial Memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB
//         Final Memory: ${(finalMemory / 1024 / 1024).toFixed(2)}MB
//         Net Increase: ${memoryIncreaseMB.toFixed(2)}MB
//         Operations Performed: ${iterations * operationsPerIteration * 2}`);

//       // Memory increase should be reasonable (less than 100MB for all operations)
//       expect(memoryIncreaseMB).toBeLessThan(100);

//       // Check for memory leaks (no continuous increase)
//       const midpointMemory = memorySnapshots[Math.floor(iterations / 2)].heapUsed;
//       const midToEndIncrease = (finalMemory - midpointMemory) / 1024 / 1024;
//       expect(midToEndIncrease).toBeLessThan(50); // Less than 50MB increase in second half
//     }, 300000);

//     test('should handle large payload processing', async () => {
//       const largePayloads = [
//         {
//           name: 'Large description',
//           data: {
//             description: 'A'.repeat(1000), // 1KB description
//             amount: 100,
//             splitWith: Array(20).fill().map((_, i) => ({
//               user: testUsers[i % testUsers.length]._id,
//               amount: 5
//             })),
//             category: 'food'
//           }
//         },
//         {
//           name: 'Many splits',
//           data: {
//             description: 'Expense with many splits',
//             amount: 1000,
//             splitWith: Array(50).fill().map((_, i) => ({
//               user: testUsers[i % testUsers.length]._id,
//               amount: 20
//             })),
//             category: 'food'
//           }
//         }
//       ];

//       for (const payload of largePayloads) {
//         const initialMemory = process.memoryUsage().heapUsed;
        
//         const response = await request(app)
//           .post('/v1/expenses')
//           .set('Authorization', `Bearer ${authTokens[0]}`)
//           .send(payload.data)
//           .expect(201);

//         const finalMemory = process.memoryUsage().heapUsed;
//         const memoryIncrease = (finalMemory - initialMemory) / 1024;

//         console.log(`${payload.name}: ${memoryIncrease.toFixed(2)}KB memory increase`);
        
//         expect(response.body).toHaveProperty('success', true);
//         expect(memoryIncrease).toBeLessThan(10240); // Less than 10MB per large payload
//       }
//     });
//   });

//   describe('🌊 Rate Limiting and Throttling Tests', () => {
//     test('should handle rapid successive requests from same user', async () => {
//       const rapidRequests = 100;
//       const promises = [];
//       const startTime = Date.now();

//       // Send many requests rapidly from the same user
//       for (let i = 0; i < rapidRequests; i++) {
//         promises.push(
//           request(app)
//             .get('/v1/users/profile')
//             .set('Authorization', `Bearer ${authTokens[0]}`)
//         );
//       }

//       const responses = await Promise.all(promises);
//       const totalTime = Date.now() - startTime;

//       const successfulRequests = responses.filter(r => r.status === 200).length;
//       const rateLimitedRequests = responses.filter(r => r.status === 429).length;
//       const otherErrors = responses.filter(r => r.status !== 200 && r.status !== 429).length;

//       console.log(`Rapid Successive Requests:
//         Total: ${rapidRequests}
//         Successful: ${successfulRequests}
//         Rate Limited: ${rateLimitedRequests}
//         Other Errors: ${otherErrors}
//         Total Time: ${totalTime}ms
//         Requests/sec: ${(rapidRequests / (totalTime / 1000)).toFixed(2)}`);

//       // Should handle requests efficiently (either succeed or rate limit properly)
//       expect(successfulRequests + rateLimitedRequests).toBe(rapidRequests);
//       expect(otherErrors).toBe(0);
//     });

//     test('should handle burst traffic patterns', async () => {
//       const burstSize = 50;
//       const burstCount = 5;
//       const burstInterval = 2000; // 2 seconds between bursts

//       const allResults = [];

//       for (let burst = 0; burst < burstCount; burst++) {
//         const burstPromises = [];
//         const burstStartTime = Date.now();

//         // Create burst of requests
//         for (let i = 0; i < burstSize; i++) {
//           const userIndex = i % authTokens.length;
//           burstPromises.push(
//             request(app)
//               .get('/v1/users/search?q=Burst')
//               .set('Authorization', `Bearer ${authTokens[userIndex]}`)
//           );
//         }

//         const burstResponses = await Promise.all(burstPromises);
//         const burstTime = Date.now() - burstStartTime;

//         const burstSuccessful = burstResponses.filter(r => r.status === 200).length;
        
//         allResults.push({
//           burst: burst + 1,
//           successful: burstSuccessful,
//           total: burstSize,
//           time: burstTime
//         });

//         console.log(`Burst ${burst + 1}: ${burstSuccessful}/${burstSize} successful in ${burstTime}ms`);

//         // Wait between bursts (except for the last one)
//         if (burst < burstCount - 1) {
//           await global.testUtils.wait(burstInterval);
//         }
//       }

//       // Analyze overall burst handling
//       const totalSuccessful = allResults.reduce((sum, result) => sum + result.successful, 0);
//       const totalRequests = burstCount * burstSize;
//       const successRate = (totalSuccessful / totalRequests) * 100;

//       console.log(`Burst Traffic Summary:
//         Total Bursts: ${burstCount}
//         Total Requests: ${totalRequests}
//         Total Successful: ${totalSuccessful}
//         Success Rate: ${successRate.toFixed(2)}%`);

//       expect(successRate).toBeGreaterThan(80); // At least 80% success rate for burst traffic
//     });
//   });

//   describe('🔥 Breaking Point Tests', () => {
//     test('should identify maximum concurrent connections', async () => {
//       const maxConcurrency = 1000;
//       const stepSize = 100;
//       const breakingPoint = { connections: 0, successRate: 0 };

//       for (let concurrency = stepSize; concurrency <= maxConcurrency; concurrency += stepSize) {
//         const promises = [];
//         const startTime = Date.now();

//         for (let i = 0; i < concurrency; i++) {
//           const userIndex = i % authTokens.length;
//           promises.push(
//             request(app)
//               .get('/v1/healthz')
//               .timeout(30000) // 30 second timeout
//           );
//         }

//         try {
//           const responses = await Promise.all(promises);
//           const totalTime = Date.now() - startTime;
//           const successful = responses.filter(r => r.status === 200).length;
//           const successRate = (successful / concurrency) * 100;

//           console.log(`Concurrency ${concurrency}: ${successful}/${concurrency} successful (${successRate.toFixed(1)}%) in ${totalTime}ms`);

//           if (successRate >= 90) {
//             breakingPoint.connections = concurrency;
//             breakingPoint.successRate = successRate;
//           } else {
//             console.log(`Breaking point reached at ${concurrency} concurrent connections`);
//             break;
//           }
//         } catch (error) {
//           console.log(`Error at ${concurrency} concurrent connections: ${error.message}`);
//           break;
//         }

//         // Small delay between tests
//         await global.testUtils.wait(5000);
//       }

//       console.log(`Maximum Concurrent Connections: ${breakingPoint.connections} (${breakingPoint.successRate.toFixed(1)}% success rate)`);
      
//       // Should handle at least 200 concurrent connections with 90% success rate
//       expect(breakingPoint.connections).toBeGreaterThanOrEqual(200);
//     }, 600000); // 10 minutes timeout

//     test('should handle system resource exhaustion gracefully', async () => {
//       const resourceExhaustionTests = [
//         {
//           name: 'CPU intensive operations',
//           operation: () => request(app)
//             .get('/v1/expenses/analytics/category')
//             .set('Authorization', `Bearer ${authTokens[0]}`)
//         },
//         {
//           name: 'Memory intensive operations',
//           operation: () => request(app)
//             .get('/v1/users/search?q=Stress')
//             .set('Authorization', `Bearer ${authTokens[0]}`)
//         },
//         {
//           name: 'Database intensive operations',
//           operation: () => request(app)
//             .post('/v1/expenses')
//             .set('Authorization', `Bearer ${authTokens[0]}`)
//             .send({
//               description: 'Resource exhaustion test expense',
//               amount: Math.floor(Math.random() * 100) + 10,
//               splitWith: [{ user: testUsers[1]._id, amount: 25 }],
//               category: 'food'
//             })
//         }
//       ];

//       for (const test of resourceExhaustionTests) {
//         const concurrentOps = 50;
//         const promises = [];
//         const startTime = Date.now();

//         for (let i = 0; i < concurrentOps; i++) {
//           promises.push(test.operation());
//         }

//         const responses = await Promise.all(promises);
//         const totalTime = Date.now() - startTime;
//         const successful = responses.filter(r => r.status < 400).length;
//         const successRate = (successful / concurrentOps) * 100;

//         console.log(`${test.name}: ${successful}/${concurrentOps} successful (${successRate.toFixed(1)}%) in ${totalTime}ms`);

//         // Should maintain at least 70% success rate under resource pressure
//         expect(successRate).toBeGreaterThan(70);
//       }
//     });
//   });
// });