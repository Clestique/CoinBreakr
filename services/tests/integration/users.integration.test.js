// const request = require('supertest');
// const createTestApp = require('../test-server');
// const User = require('../../models/User');
// const Expense = require('../../models/Expense');
// const Group = require('../../models/Group');

// // Create test app instance
// const app = createTestApp();

// describe('🔗 Integration Tests - User Management Workflows', () => {
//   let testUser1, testUser2, testUser3;
//   let authToken1, authToken2, authToken3;

//   beforeEach(async () => {
//     // Clean slate for each test
//     await User.deleteMany({});
//     await Expense.deleteMany({});
//     await Group.deleteMany({});

//     // Create test users
//     testUser1 = new User(global.testUtils.createTestUser({
//       name: 'Integration User 1',
//       email: 'user1@integration.test'
//     }));
//     await testUser1.save();
//     authToken1 = global.testUtils.generateToken(testUser1._id);

//     testUser2 = new User(global.testUtils.createTestUser({
//       name: 'Integration User 2',
//       email: 'user2@integration.test'
//     }));
//     await testUser2.save();
//     authToken2 = global.testUtils.generateToken(testUser2._id);

//     testUser3 = new User(global.testUtils.createTestUser({
//       name: 'Integration User 3',
//       email: 'user3@integration.test'
//     }));
//     await testUser3.save();
//     authToken3 = global.testUtils.generateToken(testUser3._id);
//   });

//   describe('👥 Complete Friend Management Workflow', () => {
//     test('should complete full friend lifecycle: search -> add -> interact -> remove', async () => {
//       // Step 1: Search for users
//       const searchResponse = await request(app)
//         .get('/v1/users/search?q=Integration User 2')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       expect(searchResponse.body).toHaveProperty('success', true);
//       expect(searchResponse.body).toHaveProperty('data');
//       expect(Array.isArray(searchResponse.body.data)).toBe(true);
      
//       const foundUser = searchResponse.body.data.find(u => u.email === 'user2@integration.test');
//       expect(foundUser).toBeTruthy();
//       expect(foundUser).toHaveProperty('_id', testUser2._id.toString());

//       // Step 2: Add friend
//       const addFriendResponse = await request(app)
//         .post(`/v1/users/friends`)
//         .send({friendId: testUser2._id})
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       expect(addFriendResponse.body).toHaveProperty('success', true);

//       // Step 3: Verify friend was added in profile
//       const profileResponse = await request(app)
//         .get('/v1/users/profile')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       expect(profileResponse.body.data.friends).toContainEqual(testUser2._id.toString());

//       // Step 4: Get friends list
//       const friendsResponse = await request(app)
//         .get('/v1/users/friends')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       expect(friendsResponse.body).toHaveProperty('success', true);
//       expect(friendsResponse.body).toHaveProperty('data');
//       expect(Array.isArray(friendsResponse.body.data)).toBe(true);
      
//       const friend = friendsResponse.body.data.find(f => f._id === testUser2._id.toString());
//       expect(friend).toBeTruthy();
//       expect(friend).toHaveProperty('name', 'Integration User 2');

//       // Step 5: Create expense with friend to test interaction
//       const expenseData = {
//         description: 'Friend Integration Test Expense',
//         amount: 100,
//         splitWith: [{ user: testUser2._id, amount: 50 }, { user: testUser1._id, amount: 50 }],
//         category: 'food'
//       };

//       const expenseResponse = await request(app)
//         .post('/v1/expenses')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .send(expenseData)
//         .expect(201);

//       expect(expenseResponse.body).toHaveProperty('success', true);
//       expect(expenseResponse.body).toHaveProperty('data');

//       // Step 6: Check balance with friend
//       const balanceResponse = await request(app)
//         .get(`/v1/users/friends/${testUser2._id}/balance`)
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       expect(balanceResponse.body).toHaveProperty('success', true);
//       expect(balanceResponse.body).toHaveProperty('data');
//       expect(typeof balanceResponse.body.data.balance).toBe('number');

//       // Step 7: Remove friend
//       const removeFriendResponse = await request(app)
//         .delete(`/v1/users/friends/${testUser2._id}`)
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       expect(removeFriendResponse.body).toHaveProperty('success', true);

//       // Step 8: Verify friend was removed
//       const finalProfileResponse = await request(app)
//         .get('/v1/users/profile')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       expect(finalProfileResponse.body.data.friends).not.toContainEqual(testUser2._id.toString());
//     });

//     test('should handle bidirectional friend relationships', async () => {
//       // User 1 adds User 2 as friend
//       await request(app)
//         .post(`/v1/users/friends`)
//         .send({friendId: testUser2._id})
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       // Both should see each other as friends
//       const user1Friends = await request(app)
//         .get('/v1/users/friends')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       const user2Friends = await request(app)
//         .get('/v1/users/friends')
//         .set('Authorization', `Bearer ${authToken2}`)
//         .expect(200);

//       expect(user1Friends.body.data.some(f => f._id === testUser2._id.toString())).toBe(true);
//       expect(user2Friends.body.data.some(f => f._id === testUser1._id.toString())).toBe(true);

//       // Create expense between friends from both sides
//       await request(app)
//         .post('/v1/expenses')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .send({
//           description: 'User 1 pays for User 2',
//           amount: 50,
//           splitWith: [{ user: testUser2._id, amount: 25 }, { user: testUser1._id, amount: 25 }]
//         })
//         .expect(201);

//       await request(app)
//         .post('/v1/expenses')
//         .set('Authorization', `Bearer ${authToken2}`)
//         .send({
//           description: 'User 2 pays for User 1',
//           amount: 30,
//           splitWith: [{ user: testUser1._id, amount: 15 }, { user: testUser2._id, amount: 15 }]
//         })
//         .expect(201);

//       // Check balances from both perspectives
//       const balance1to2 = await request(app)
//         .get(`/v1/users/friends/${testUser2._id}/balance`)
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       const balance2to1 = await request(app)
//         .get(`/v1/users/friends/${testUser1._id}/balance`)
//         .set('Authorization', `Bearer ${authToken2}`)
//         .expect(200);

//       // Balances should be opposite of each other
//       expect(balance1to2.body.data.balance).toBe(-balance2to1.body.data.balance);
//     });

//     test('should prevent duplicate friend additions', async () => {
//       // Add friend first time
//       await request(app)
//         .post(`/v1/users/friends`)
//         .send({friendId: testUser2._id})
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       // Try to add same friend again
//       const duplicateResponse = await request(app)
//         .post(`/v1/users/friends`)
//         .send({friendId: testUser2._id})
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(400);

//       expect(duplicateResponse.body).toHaveProperty('success', false);
//       expect(duplicateResponse.body.message).toContain('already');

//       // Verify only one friendship exists
//       const friendsResponse = await request(app)
//         .get('/v1/users/friends')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       const friendCount = friendsResponse.body.data.filter(f => f._id === testUser2._id.toString()).length;
//       expect(friendCount).toBe(1);
//     });

//     test('should prevent self-friendship', async () => {
//       const response = await request(app)
//         .post(`/v1/users/friends`)
//         .send({friendId: testUser1._id})
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(400);

//       expect(response.body).toHaveProperty('success', false);
//       expect(response.body.message).toContain('yourself');
//     });
//   });

//   describe('🔍 User Search and Discovery', () => {
//     test('should search users by name with various queries', async () => {
//       const searchQueries = [
//         'Integration',
//         'User',
//         'Integration User',
//         'user 2',
//         'INTEGRATION', // case insensitive
//         'integr' // partial match
//       ];

//       for (const query of searchQueries) {
//         const response = await request(app)
//           .get(`/v1/users/search?q=${encodeURIComponent(query)}`)
//           .set('Authorization', `Bearer ${authToken1}`)
//           .expect(200);

//         expect(response.body).toHaveProperty('success', true);
//         expect(response.body).toHaveProperty('data');
//         expect(Array.isArray(response.body.data)).toBe(true);
//         expect(response.body.data.length).toBeGreaterThan(0);
//       }
//     });

//     test('should search users by email', async () => {
//       const response = await request(app)
//         .get('/v1/users/search?q=user2@integration.test')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       expect(response.body.data).toHaveLength(1);
//       expect(response.body.data[0]).toHaveProperty('email', 'user2@integration.test');
//     });

//     test('should exclude current user from search results', async () => {
//       const response = await request(app)
//         .get('/v1/users/search?q=Integration User 1')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       // Should not include the searching user themselves
//       const selfInResults = response.body.data.some(u => u._id === testUser1._id.toString());
//       expect(selfInResults).toBe(false);
//     });

//     test('should handle empty search queries', async () => {
//       const response = await request(app)
//         .get('/v1/users/search?q=')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(400);

//       expect(response.body).toHaveProperty('success', false);
//     });

//     test('should handle search with no results', async () => {
//       const response = await request(app)
//         .get('/v1/users/search?q=NonexistentUser12345')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       expect(response.body).toHaveProperty('success', true);
//       expect(response.body.data).toHaveLength(0);
//     });

//     test('should paginate search results', async () => {
//       // Create many users for pagination test
//       const users = [];
//       for (let i = 0; i < 25; i++) {
//         const user = new User(global.testUtils.createTestUser({
//           name: `Pagination User ${i}`,
//           email: `pagination${i}@test.com`
//         }));
//         users.push(user);
//       }
//       await User.insertMany(users);

//       // Test first page
//       const page1Response = await request(app)
//         .get('/v1/users/search?q=Pagination&page=1&limit=10')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       expect(page1Response.body.data).toHaveLength(10);
//       expect(page1Response.body).toHaveProperty('pagination');
//       expect(page1Response.body.pagination.current).toBe(1);

//       // Test second page
//       const page2Response = await request(app)
//         .get('/v1/users/search?q=Pagination&page=2&limit=10')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       expect(page2Response.body.data).toHaveLength(10);
//       expect(page2Response.body.pagination.current).toBe(2);

//       // Results should be different
//       const page1Ids = page1Response.body.data.map(u => u._id);
//       const page2Ids = page2Response.body.data.map(u => u._id);
//       const overlap = page1Ids.filter(id => page2Ids.includes(id));
//       expect(overlap).toHaveLength(0);
//     });
//   });

//   describe('👤 Profile Management Workflows', () => {
//     test('should complete profile update workflow', async () => {
//       const updateData = {
//         name: 'Updated Integration User 1',
//         phoneNumber: '+1234567890',
//         profileImage: 'https://example.com/new-avatar.jpg'
//       };

//       // Update profile
//       const updateResponse = await request(app)
//         .patch('/v1/users/profile')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .send(updateData)
//         .expect(200);

//       expect(updateResponse.body).toHaveProperty('success', true);
//       expect(updateResponse.body.data).toHaveProperty('name', updateData.name);
//       expect(updateResponse.body.data).toHaveProperty('phoneNumber', updateData.phoneNumber);
//       expect(updateResponse.body.data).toHaveProperty('profileImage', updateData.profileImage);

//       // Verify changes persisted
//       const profileResponse = await request(app)
//         .get('/v1/users/profile')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       expect(profileResponse.body.data).toHaveProperty('name', updateData.name);
//       expect(profileResponse.body.data).toHaveProperty('phoneNumber', updateData.phoneNumber);
//       expect(profileResponse.body.data).toHaveProperty('profileImage', updateData.profileImage);

//       // Verify in database
//       const dbUser = await User.findById(testUser1._id);
//       expect(dbUser.name).toBe(updateData.name);
//       expect(dbUser.phoneNumber).toBe(updateData.phoneNumber);
//       expect(dbUser.profileImage).toBe(updateData.profileImage);
//     });

//     test('should handle partial profile updates', async () => {
//       const originalProfile = await request(app)
//         .get('/v1/users/profile')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       // Update only name
//       await request(app)
//         .patch('/v1/users/profile')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .send({ name: 'Only Name Updated' })
//         .expect(200);

//       // Update only phone
//       await request(app)
//         .patch('/v1/users/profile')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .send({ phoneNumber: '+9876543210' })
//         .expect(200);

//       // Verify final state
//       const finalProfile = await request(app)
//         .get('/v1/users/profile')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       expect(finalProfile.body.data.name).toBe('Only Name Updated');
//       expect(finalProfile.body.data.phoneNumber).toBe('+9876543210');
//       expect(finalProfile.body.data.email).toBe(originalProfile.body.data.email); // Unchanged
//     });

//     test('should validate profile update data', async () => {
//       const invalidUpdates = [
//         { name: '' }, // Empty name
//         { name: 'A'.repeat(51) }, // Name too long
//         { phoneNumber: 'invalid-phone' }, // Invalid phone format
//         { email: 'newemail@test.com' }, // Email updates not allowed
//         { role: 'admin' }, // Role updates not allowed
//         { _id: 'new-id' } // ID updates not allowed
//       ];

//       for (const invalidUpdate of invalidUpdates) {
//         const response = await request(app)
//           .patch('/v1/users/profile')
//           .set('Authorization', `Bearer ${authToken1}`)
//           .send(invalidUpdate);

//         expect(response.status).toBe(400);
//         expect(response.body).toHaveProperty('success', false);
//       }
//     });

//     test('should handle concurrent profile updates', async () => {
//       const updates = [
//         { name: 'Concurrent Update 1' },
//         { phoneNumber: '+1111111111' },
//         { profileImage: 'https://example.com/image1.jpg' }
//       ];

//       const promises = updates.map(update =>
//         request(app)
//           .patch('/v1/users/profile')
//           .set('Authorization', `Bearer ${authToken1}`)
//           .send(update)
//       );

//       const responses = await Promise.all(promises);

//       // All updates should succeed
//       responses.forEach(response => {
//         expect(response.status).toBe(200);
//         expect(response.body).toHaveProperty('success', true);
//       });

//       // Final profile should have the last update for each field
//       const finalProfile = await request(app)
//         .get('/v1/users/profile')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       // At least one of the updates should be present
//       const hasUpdate = updates.some(update => {
//         return Object.keys(update).every(key => 
//           finalProfile.body.data[key] === update[key]
//         );
//       });
//       expect(hasUpdate).toBe(true);
//     });
//   });

//   describe('📊 User Statistics and Analytics', () => {
//     // Future feature
//     // test('should track user activity metrics', async () => {
//     //   // Create some activity
//     //   await request(app)
//     //     .post(`/v1/users/friends/${testUser2._id}`)
//     //     .set('Authorization', `Bearer ${authToken1}`)
//     //     .expect(200);

//     //   await request(app)
//     //     .post('/v1/expenses')
//     //     .set('Authorization', `Bearer ${authToken1}`)
//     //     .send({
//     //       description: 'Activity Test Expense',
//     //       amount: 100,
//     //       splitWith: [{ user: testUser2._id, amount: 50 }]
//     //     })
//     //     .expect(201);

//     //   // Get user stats
//     //   const statsResponse = await request(app)
//     //     .get('/v1/users/stats')
//     //     .set('Authorization', `Bearer ${authToken1}`)
//     //     .expect(200);

//     //   expect(statsResponse.body).toHaveProperty('success', true);
//     //   expect(statsResponse.body).toHaveProperty('data');
//     //   expect(statsResponse.body.data).toHaveProperty('friendsCount');
//     //   expect(statsResponse.body.data).toHaveProperty('expensesCount');
//     //   expect(statsResponse.body.data).toHaveProperty('totalAmountPaid');
//     //   expect(statsResponse.body.data).toHaveProperty('totalAmountOwed');
//     // });

//     test('should calculate user balances correctly', async () => {
//       // First, make users friends
//       await request(app)
//         .post('/v1/users/friends')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .send({ friendId: testUser2._id })
//         .expect(200);

//       // Create expenses with different users
//       await request(app)
//         .post('/v1/expenses')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .send({
//           description: 'User 1 pays 100, User 2 owes 50',
//           amount: 100,
//           splitWith: [{ user: testUser2._id, amount: 50 }, { user: testUser1._id, amount: 50 }]
//         })
//         .expect(201);

//       await request(app)
//         .post('/v1/expenses')
//         .set('Authorization', `Bearer ${authToken2}`)
//         .send({
//           description: 'User 2 pays 60, User 1 owes 30',
//           amount: 60,
//           splitWith: [{ user: testUser1._id, amount: 30 }, { user: testUser2._id, amount: 30 }]
//         })
//         .expect(201);

//       // Check balances
//       const balanceResponse = await request(app)
//         .get('/v1/users/balances')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       expect(balanceResponse.body).toHaveProperty('success', true);
//       expect(balanceResponse.body).toHaveProperty('data');
//       expect(Array.isArray(balanceResponse.body.data)).toBe(true);

//       const balanceWithUser2 = balanceResponse.body.data.find(b => 
//         b.friend._id.toString() === testUser2._id.toString()
//       );
//       expect(balanceWithUser2).toBeTruthy();
//       expect(balanceWithUser2.balance).toBe(20); // 50 - 30 = 20
//     });
//   });

//   describe('🔒 User Privacy and Security', () => {
//     test('should not expose sensitive user data in search', async () => {
//       const response = await request(app)
//         .get('/v1/users/search?q=Integration')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);

//       response.body.data.forEach(user => {
//         expect(user).not.toHaveProperty('password');
//         expect(user).not.toHaveProperty('friends');
//         expect(user).not.toHaveProperty('lastLogin');
//         expect(user).not.toHaveProperty('isActive');
//         expect(user).toHaveProperty('_id');
//         expect(user).toHaveProperty('name');
//         expect(user).toHaveProperty('email');
//         expect(user).toHaveProperty('profileImage');
//       });
//     });
//   });

//   describe('⚡ User Performance Tests', () => {
//     test('should handle user operations within performance limits', async () => {
//       const operations = [
//         () => request(app).get('/v1/users/profile').set('Authorization', `Bearer ${authToken1}`),
//         () => request(app).get('/v1/users/search?q=Integration').set('Authorization', `Bearer ${authToken1}`),
//         () => request(app).get('/v1/users/friends').set('Authorization', `Bearer ${authToken1}`),
//         () => request(app).patch('/v1/users/profile').set('Authorization', `Bearer ${authToken1}`).send({ name: 'Performance Test' })
//       ];

//       for (const operation of operations) {
//         const startTime = Date.now();
//         const response = await operation();
//         const responseTime = Date.now() - startTime;

//         expect(response.status).toBeLessThan(400);
//         expect(responseTime).toBeLessThan(2000); // Should complete within 2 seconds
//       }
//     });

//     test('should handle large friend lists efficiently', async () => {
//       // Create many users to add as friends
//       const manyUsers = [];
//       for (let i = 0; i < 50; i++) {
//         const user = new User(global.testUtils.createTestUser({
//           name: `Friend ${i}`,
//           email: `friend${i}@test.com`
//         }));
//         manyUsers.push(user);
//       }
//       await User.insertMany(manyUsers);

//       // Add all as friends
//       const startTime = Date.now();
//       for (const user of manyUsers.slice(0, 20)) { // Add first 20
//         await request(app)
//           .post(`/v1/users/friends`)
//           .send({friendId: user._id})
//           .set('Authorization', `Bearer ${authToken1}`)
//           .expect(200);
//       }
//       const addTime = Date.now() - startTime;

//       // Get friends list
//       const listStartTime = Date.now();
//       const friendsResponse = await request(app)
//         .get('/v1/users/friends')
//         .set('Authorization', `Bearer ${authToken1}`)
//         .expect(200);
//       const listTime = Date.now() - listStartTime;

//       expect(friendsResponse.body.data).toHaveLength(20);
//       expect(addTime).toBeLessThan(30000); // 30 seconds for 20 friend additions
//       expect(listTime).toBeLessThan(2000); // 2 seconds to list friends
//     });
//   });
// });