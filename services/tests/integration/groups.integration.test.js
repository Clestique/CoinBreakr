// const request = require('supertest');
// const createTestApp = require('../test-server');
// const User = require('../../models/User');
// const Expense = require('../../models/Expense');
// const Group = require('../../models/Group');

// // Create test app instance
// const app = createTestApp();

// describe('🔗 Integration Tests - Group Management Workflows', () => {
//   let testUsers = [];
//   let authTokens = [];
//   let testGroup;

//   beforeEach(async () => {
//     // Clean slate for each test
//     await User.deleteMany({});
//     await Expense.deleteMany({});
//     await Group.deleteMany({});

//     // Create test users
//     const userPromises = [];
//     for (let i = 0; i < 5; i++) {
//       const user = new User(global.testUtils.createTestUser({
//         name: `Group Test User ${i + 1}`,
//         email: `groupuser${i + 1}@test.com`
//       }));
//       userPromises.push(user.save());
//     }

//     testUsers = await Promise.all(userPromises);
//     authTokens = testUsers.map(user => global.testUtils.generateToken(user._id));

//     // Add friendships between users
//     for (let i = 0; i < testUsers.length; i++) {
//       for (let j = 0; j < testUsers.length; j++) {
//         if (i !== j) {
//           testUsers[i].friends.push(testUsers[j]._id);
//         }
//       }
//       await testUsers[i].save();
//     }
//   });

//   describe('👥 Complete Group Lifecycle', () => {
//     test('should complete full group workflow: create -> add members -> expenses -> settle -> analytics', async () => {
//       // Step 1: Create group
//       const groupData = {
//         name: 'Integration Test Group',
//         description: 'A comprehensive test group for integration testing'
//       };

//       const createResponse = await request(app)
//         .post('/v1/groups')
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .send(groupData)
//         .expect(201);

//       expect(createResponse.body).toHaveProperty('success', true);
//       expect(createResponse.body).toHaveProperty('data');
//       const groupId = createResponse.body.data._id;
//       expect(createResponse.body.data).toHaveProperty('name', groupData.name);
//       expect(createResponse.body.data.members).toHaveLength(1); // Creator only

//       // Step 2: Add members to group
//       for (let i = 1; i < 4; i++) { // Add 3 more members
//         const addMemberResponse = await request(app)
//           .post(`/v1/groups/${groupId}/members`)
//           .set('Authorization', `Bearer ${authTokens[0]}`)
//           .send({ userId: testUsers[i]._id })
//           .expect(200);

//         expect(addMemberResponse.body).toHaveProperty('success', true);
//       }

//       // Step 3: Verify group membership
//       const groupDetailResponse = await request(app)
//         .get(`/v1/groups/${groupId}`)
//         .set('Authorization', `Bearer ${authTokens[1]}`)
//         .expect(200);

//       expect(groupDetailResponse.body.data.members).toHaveLength(4);

//       // Step 4: Create group expenses
//       const groupExpenses = [
//         {
//           description: 'Group Dinner',
//           amount: 200,
//           payer: 0,
//           splits: [
//             { user: 1, amount: 50 },
//             { user: 2, amount: 50 },
//             { user: 3, amount: 50 }
//           ]
//         },
//         {
//           description: 'Group Activity',
//           amount: 120,
//           payer: 1,
//           splits: [
//             { user: 0, amount: 30 },
//             { user: 2, amount: 30 },
//             { user: 3, amount: 30 }
//           ]
//         },
//         {
//           description: 'Group Transport',
//           amount: 80,
//           payer: 2,
//           splits: [
//             { user: 0, amount: 20 },
//             { user: 1, amount: 20 },
//             { user: 3, amount: 20 }
//           ]
//         }
//       ];

//       const createdExpenseIds = [];
//       for (const expense of groupExpenses) {
//         const expenseResponse = await request(app)
//           .post('/v1/expenses')
//           .set('Authorization', `Bearer ${authTokens[expense.payer]}`)
//           .send({
//             description: expense.description,
//             amount: expense.amount,
//             splitWith: expense.splits.map(split => ({
//               user: testUsers[split.user]._id,
//               amount: split.amount
//             })),
//             category: 'food',
//             group: groupId
//           })
//           .expect(201);

//         createdExpenseIds.push(expenseResponse.body.data._id);
//       }

//       // Step 5: Verify group expenses
//       const groupExpensesResponse = await request(app)
//         .get(`/v1/groups/${groupId}/expenses`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .expect(200);

//       expect(groupExpensesResponse.body.data).toHaveLength(3);

//       // Step 6: Calculate group balances
//       const groupBalancesResponse = await request(app)
//         .get(`/v1/groups/${groupId}/balances`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .expect(200);

//       expect(groupBalancesResponse.body).toHaveProperty('success', true);
//       expect(groupBalancesResponse.body.data).toHaveLength(4);

//       // Verify balance calculations
//       const balances = groupBalancesResponse.body.data;
//       const totalBalance = balances.reduce((sum, balance) => sum + balance.balance, 0);
//       expect(Math.abs(totalBalance)).toBeLessThan(0.01); // Should sum to zero (within floating point precision)

//       // Step 7: Settle some expenses
//       for (let i = 0; i < 2; i++) { // Settle first 2 expenses
//         await request(app)
//           .put(`/v1/expenses/${createdExpenseIds[i]}/settle`)
//           .set('Authorization', `Bearer ${authTokens[1]}`) // User 1 settles
//           .expect(200);

//         await request(app)
//           .put(`/v1/expenses/${createdExpenseIds[i]}/settle`)
//           .set('Authorization', `Bearer ${authTokens[2]}`) // User 2 settles
//           .expect(200);
//       }

//       // Step 8: Get group analytics
//       const groupAnalyticsResponse = await request(app)
//         .get(`/v1/groups/${groupId}/analytics`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .expect(200);

//       expect(groupAnalyticsResponse.body).toHaveProperty('success', true);
//       expect(groupAnalyticsResponse.body.data).toHaveProperty('totalExpenses');
//       expect(groupAnalyticsResponse.body.data).toHaveProperty('totalAmount');
//       expect(groupAnalyticsResponse.body.data).toHaveProperty('settledAmount');
//       expect(groupAnalyticsResponse.body.data).toHaveProperty('pendingAmount');

//       // Step 9: Update group settings
//       const updateResponse = await request(app)
//         .put(`/v1/groups/${groupId}`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .send({
//           name: 'Updated Integration Test Group',
//           description: 'Updated description for integration testing'
//         })
//         .expect(200);

//       expect(updateResponse.body.data).toHaveProperty('name', 'Updated Integration Test Group');

//       // Step 10: Remove a member
//       const removeMemberResponse = await request(app)
//         .delete(`/v1/groups/${groupId}/members/${testUsers[3]._id}`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .expect(200);

//       expect(removeMemberResponse.body).toHaveProperty('success', true);

//       // Verify member was removed
//       const finalGroupResponse = await request(app)
//         .get(`/v1/groups/${groupId}`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .expect(200);

//       expect(finalGroupResponse.body.data.members).toHaveLength(3);
//     });

//     test('should handle group permissions and access control', async () => {
//       // Create group with user 0
//       const groupResponse = await request(app)
//         .post('/v1/groups')
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .send({
//           name: 'Permission Test Group',
//           description: 'Testing group permissions'
//         })
//         .expect(201);

//       const groupId = groupResponse.body.data._id;

//       // Add user 1 as member
//       await request(app)
//         .post(`/v1/groups/${groupId}/members`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .send({ userId: testUsers[1]._id })
//         .expect(200);

//       // Test admin permissions (user 0)
//       await request(app)
//         .put(`/v1/groups/${groupId}`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .send({ name: 'Updated by Admin' })
//         .expect(200);

//       // Test member permissions (user 1) - should not be able to update group
//       await request(app)
//         .put(`/v1/groups/${groupId}`)
//         .set('Authorization', `Bearer ${authTokens[1]}`)
//         .send({ name: 'Updated by Member' })
//         .expect(403);

//       // Test non-member permissions (user 2) - should not be able to view group
//       await request(app)
//         .get(`/v1/groups/${groupId}`)
//         .set('Authorization', `Bearer ${authTokens[2]}`)
//         .expect(403);

//       // Test member can create expenses in group
//       await request(app)
//         .post('/v1/expenses')
//         .set('Authorization', `Bearer ${authTokens[1]}`)
//         .send({
//           description: 'Member Created Expense',
//           amount: 50,
//           splitWith: [{ user: testUsers[0]._id, amount: 25 }],
//           group: groupId
//         })
//         .expect(201);

//       // Test non-member cannot create expenses in group
//       await request(app)
//         .post('/v1/expenses')
//         .set('Authorization', `Bearer ${authTokens[2]}`)
//         .send({
//           description: 'Non-member Expense',
//           amount: 50,
//           splitWith: [{ user: testUsers[0]._id, amount: 25 }],
//           group: groupId
//         })
//         .expect(403);
//     });

//     test('should handle complex group member management', async () => {
//       // Create group
//       const groupResponse = await request(app)
//         .post('/v1/groups')
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .send({
//           name: 'Member Management Test',
//           description: 'Testing complex member operations'
//         })
//         .expect(201);

//       const groupId = groupResponse.body.data._id;

//       // Add multiple members
//       for (let i = 1; i < testUsers.length; i++) {
//         await request(app)
//           .post(`/v1/groups/${groupId}/members`)
//           .set('Authorization', `Bearer ${authTokens[0]}`)
//           .send({ userId: testUsers[i]._id })
//           .expect(200);
//       }

//       // Promote member to admin
//       await request(app)
//         .put(`/v1/groups/${groupId}/members/${testUsers[1]._id}`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .send({ role: 'admin' })
//         .expect(200);

//       // Verify promotion
//       const groupAfterPromotion = await request(app)
//         .get(`/v1/groups/${groupId}`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .expect(200);

//       const promotedMember = groupAfterPromotion.body.data.members.find(
//         m => m.user._id === testUsers[1]._id.toString()
//       );
//       expect(promotedMember.role).toBe('admin');

//       // New admin should be able to add members
//       const newUser = new User(global.testUtils.createTestUser({
//         email: 'newmember@test.com'
//       }));
//       await newUser.save();

//       await request(app)
//         .post(`/v1/groups/${groupId}/members`)
//         .set('Authorization', `Bearer ${authTokens[1]}`)
//         .send({ userId: newUser._id })
//         .expect(200);

//       // Test bulk member operations
//       const memberIds = testUsers.slice(2, 4).map(u => u._id);
//       await request(app)
//         .delete(`/v1/groups/${groupId}/members/bulk`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .send({ userIds: memberIds })
//         .expect(200);

//       // Verify bulk removal
//       const finalGroup = await request(app)
//         .get(`/v1/groups/${groupId}`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .expect(200);

//       expect(finalGroup.body.data.members.length).toBeLessThan(testUsers.length);
//     });
//   });

//   describe('💰 Group Financial Management', () => {
//     beforeEach(async () => {
//       // Create a test group for financial tests
//       const groupResponse = await request(app)
//         .post('/v1/groups')
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .send({
//           name: 'Financial Test Group',
//           description: 'Group for testing financial operations'
//         })
//         .expect(201);

//       testGroup = groupResponse.body.data;

//       // Add all users to the group
//       for (let i = 1; i < testUsers.length; i++) {
//         await request(app)
//           .post(`/v1/groups/${testGroup._id}/members`)
//           .set('Authorization', `Bearer ${authTokens[0]}`)
//           .send({ userId: testUsers[i]._id })
//           .expect(200);
//       }
//     });

//     test('should handle complex expense splitting scenarios', async () => {
//       // Scenario 1: Unequal splits
//       const unequalSplitResponse = await request(app)
//         .post('/v1/expenses')
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .send({
//           description: 'Unequal Split Expense',
//           amount: 100,
//           splitWith: [
//             { user: testUsers[1]._id, amount: 60 }, // User 1 owes more
//             { user: testUsers[2]._id, amount: 20 }, // User 2 owes less
//             { user: testUsers[3]._id, amount: 20 }  // User 3 owes less
//           ],
//           group: testGroup._id,
//           category: 'food'
//         })
//         .expect(201);

//       // Scenario 2: Percentage-based splits (simulated)
//       const percentageAmount = 200;
//       const percentageSplitResponse = await request(app)
//         .post('/v1/expenses')
//         .set('Authorization', `Bearer ${authTokens[1]}`)
//         .send({
//           description: 'Percentage Split Expense',
//           amount: percentageAmount,
//           splitWith: [
//             { user: testUsers[0]._id, amount: percentageAmount * 0.4 }, // 40%
//             { user: testUsers[2]._id, amount: percentageAmount * 0.3 }, // 30%
//             { user: testUsers[3]._id, amount: percentageAmount * 0.3 }  // 30%
//           ],
//           group: testGroup._id,
//           category: 'entertainment'
//         })
//         .expect(201);

//       // Scenario 3: Expense with exclusions (some members don't participate)
//       const exclusionSplitResponse = await request(app)
//         .post('/v1/expenses')
//         .set('Authorization', `Bearer ${authTokens[2]}`)
//         .send({
//           description: 'Partial Group Expense',
//           amount: 60,
//           splitWith: [
//             { user: testUsers[0]._id, amount: 30 }, // Only users 0 and 1 participate
//             { user: testUsers[1]._id, amount: 30 }
//           ],
//           group: testGroup._id,
//           category: 'transport'
//         })
//         .expect(201);

//       // Verify all expenses were created
//       const groupExpensesResponse = await request(app)
//         .get(`/v1/groups/${testGroup._id}/expenses`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .expect(200);

//       expect(groupExpensesResponse.body.data).toHaveLength(3);

//       // Calculate and verify balances
//       const balancesResponse = await request(app)
//         .get(`/v1/groups/${testGroup._id}/balances`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .expect(200);

//       const balances = balancesResponse.body.data;
//       expect(balances).toHaveLength(testUsers.length);

//       // Verify balance calculations are correct
//       const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);
//       expect(Math.abs(totalBalance)).toBeLessThan(0.01); // Should sum to zero
//     });

//     test('should handle group expense settlements and reconciliation', async () => {
//       // Create multiple expenses
//       const expenses = [
//         { payer: 0, amount: 120, description: 'Group Lunch' },
//         { payer: 1, amount: 80, description: 'Group Transport' },
//         { payer: 2, amount: 200, description: 'Group Activity' }
//       ];

//       const createdExpenses = [];
//       for (const expense of expenses) {
//         const response = await request(app)
//           .post('/v1/expenses')
//           .set('Authorization', `Bearer ${authTokens[expense.payer]}`)
//           .send({
//             description: expense.description,
//             amount: expense.amount,
//             splitWith: testUsers
//               .filter((_, i) => i !== expense.payer)
//               .slice(0, 3)
//               .map(user => ({ user: user._id, amount: expense.amount / 4 })),
//             group: testGroup._id,
//             category: 'food'
//           })
//           .expect(201);

//         createdExpenses.push(response.body.data);
//       }

//       // Get initial balances
//       const initialBalancesResponse = await request(app)
//         .get(`/v1/groups/${testGroup._id}/balances`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .expect(200);

//       // Settle expenses progressively
//       for (let i = 0; i < createdExpenses.length; i++) {
//         const expense = createdExpenses[i];
        
//         // Each user settles their part
//         for (let j = 0; j < testUsers.length; j++) {
//           if (j !== expenses[i].payer) { // Skip the payer
//             await request(app)
//               .put(`/v1/expenses/${expense._id}/settle`)
//               .set('Authorization', `Bearer ${authTokens[j]}`)
//               .expect(200);
//           }
//         }

//         // Check settlement status
//         const expenseDetailResponse = await request(app)
//           .get(`/v1/expenses/${expense._id}`)
//           .set('Authorization', `Bearer ${authTokens[0]}`)
//           .expect(200);

//         expect(expenseDetailResponse.body.data.isSettled).toBe(true);
//       }

//       // Get final balances after settlements
//       const finalBalancesResponse = await request(app)
//         .get(`/v1/groups/${testGroup._id}/balances`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .expect(200);

//       // Balances should remain the same (settlement doesn't change who owes what)
//       expect(finalBalancesResponse.body.data).toHaveLength(initialBalancesResponse.body.data.length);

//       // Get settlement summary
//       const settlementSummaryResponse = await request(app)
//         .get(`/v1/groups/${testGroup._id}/settlements`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .expect(200);

//       expect(settlementSummaryResponse.body).toHaveProperty('success', true);
//       expect(settlementSummaryResponse.body.data).toHaveProperty('totalSettled');
//       expect(settlementSummaryResponse.body.data).toHaveProperty('pendingSettlements');
//     });

//     test('should provide comprehensive group financial analytics', async () => {
//       // Create diverse expenses over time
//       const expenseCategories = ['food', 'transport', 'entertainment', 'shopping', 'utilities'];
//       const expenseData = [];

//       for (let i = 0; i < 20; i++) {
//         const payer = i % testUsers.length;
//         const amount = Math.floor(Math.random() * 200) + 20;
//         const category = expenseCategories[i % expenseCategories.length];
        
//         const response = await request(app)
//           .post('/v1/expenses')
//           .set('Authorization', `Bearer ${authTokens[payer]}`)
//           .send({
//             description: `${category} expense ${i + 1}`,
//             amount: amount,
//             splitWith: testUsers
//               .filter((_, idx) => idx !== payer)
//               .slice(0, 2)
//               .map(user => ({ user: user._id, amount: amount / 3 })),
//             group: testGroup._id,
//             category: category,
//             date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
//           })
//           .expect(201);

//         expenseData.push(response.body.data);
//       }

//       // Get comprehensive analytics
//       const analyticsTests = [
//         {
//           endpoint: `/v1/groups/${testGroup._id}/analytics`,
//           name: 'Overall group analytics'
//         },
//         {
//           endpoint: `/v1/groups/${testGroup._id}/analytics/category`,
//           name: 'Category breakdown'
//         },
//         {
//           endpoint: `/v1/groups/${testGroup._id}/analytics/monthly`,
//           name: 'Monthly spending trends'
//         },
//         {
//           endpoint: `/v1/groups/${testGroup._id}/analytics/members`,
//           name: 'Member spending analysis'
//         }
//       ];

//       for (const test of analyticsTests) {
//         const response = await request(app)
//           .get(test.endpoint)
//           .set('Authorization', `Bearer ${authTokens[0]}`)
//           .expect(200);

//         expect(response.body).toHaveProperty('success', true);
//         expect(response.body).toHaveProperty('data');
//         console.log(`${test.name}: ✓`);
//       }

//       // Test filtered analytics
//       const filteredAnalyticsResponse = await request(app)
//         .get(`/v1/groups/${testGroup._id}/analytics?category=food&startDate=${new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()}`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .expect(200);

//       expect(filteredAnalyticsResponse.body).toHaveProperty('success', true);
//     });
//   });

//   describe('🔄 Group Activity and Notifications', () => {
//     beforeEach(async () => {
//       // Create test group
//       const groupResponse = await request(app)
//         .post('/v1/groups')
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .send({
//           name: 'Activity Test Group',
//           description: 'Group for testing activity tracking'
//         })
//         .expect(201);

//       testGroup = groupResponse.body.data;

//       // Add members
//       for (let i = 1; i < 4; i++) {
//         await request(app)
//           .post(`/v1/groups/${testGroup._id}/members`)
//           .set('Authorization', `Bearer ${authTokens[0]}`)
//           .send({ userId: testUsers[i]._id })
//           .expect(200);
//       }
//     });

//     test('should track group activity and generate activity feed', async () => {
//       // Generate various activities
//       const activities = [
//         // Member joins
//         () => request(app)
//           .post(`/v1/groups/${testGroup._id}/members`)
//           .set('Authorization', `Bearer ${authTokens[0]}`)
//           .send({ userId: testUsers[4]._id }),
        
//         // Expense creation
//         () => request(app)
//           .post('/v1/expenses')
//           .set('Authorization', `Bearer ${authTokens[1]}`)
//           .send({
//             description: 'Activity Test Expense',
//             amount: 100,
//             splitWith: [{ user: testUsers[0]._id, amount: 50 }],
//             group: testGroup._id
//           }),
        
//         // Group update
//         () => request(app)
//           .put(`/v1/groups/${testGroup._id}`)
//           .set('Authorization', `Bearer ${authTokens[0]}`)
//           .send({ description: 'Updated group description' }),
        
//         // Expense settlement
//         () => request(app)
//           .put(`/v1/expenses/${testGroup._id}/settle`) // This will fail but generate activity
//           .set('Authorization', `Bearer ${authTokens[2]}`)
//       ];

//       // Execute activities
//       for (const activity of activities) {
//         try {
//           await activity();
//         } catch (error) {
//           // Some activities may fail, but should still generate activity logs
//         }
//         await global.testUtils.wait(100); // Small delay between activities
//       }

//       // Get activity feed
//       const activityResponse = await request(app)
//         .get(`/v1/groups/${testGroup._id}/activity`)
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .expect(200);

//       expect(activityResponse.body).toHaveProperty('success', true);
//       expect(activityResponse.body).toHaveProperty('data');
//       expect(Array.isArray(activityResponse.body.data)).toBe(true);
//     });

//     test('should handle group notifications and alerts', async () => {
//       // Create expense that should trigger notifications
//       const expenseResponse = await request(app)
//         .post('/v1/expenses')
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .send({
//           description: 'Notification Test Expense',
//           amount: 200,
//           splitWith: [
//             { user: testUsers[1]._id, amount: 50 },
//             { user: testUsers[2]._id, amount: 50 },
//             { user: testUsers[3]._id, amount: 50 }
//           ],
//           group: testGroup._id,
//           category: 'food'
//         })
//         .expect(201);

//       // Check notifications for each member
//       for (let i = 1; i < 4; i++) {
//         const notificationsResponse = await request(app)
//           .get('/v1/users/notifications')
//           .set('Authorization', `Bearer ${authTokens[i]}`)
//           .expect(200);

//         expect(notificationsResponse.body).toHaveProperty('success', true);
//         expect(notificationsResponse.body).toHaveProperty('data');
//       }

//       // Mark notifications as read
//       const markReadResponse = await request(app)
//         .put('/v1/users/notifications/read')
//         .set('Authorization', `Bearer ${authTokens[1]}`)
//         .send({ notificationIds: ['all'] })
//         .expect(200);

//       expect(markReadResponse.body).toHaveProperty('success', true);
//     });
//   });

//   describe('📊 Group Performance and Scalability', () => {
//     test('should handle groups with many members efficiently', async () => {
//       // Create many users for large group test
//       const manyUsers = [];
//       for (let i = 0; i < 50; i++) {
//         const user = new User(global.testUtils.createTestUser({
//           name: `Large Group User ${i}`,
//           email: `largegroup${i}@test.com`
//         }));
//         await user.save();
//         manyUsers.push(user);
//       }

//       // Create large group
//       const largeGroupResponse = await request(app)
//         .post('/v1/groups')
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .send({
//           name: 'Large Test Group',
//           description: 'Group with many members for performance testing'
//         })
//         .expect(201);

//       const largeGroupId = largeGroupResponse.body.data._id;

//       // Add many members
//       const startTime = Date.now();
//       const memberPromises = [];
//       for (let i = 0; i < 30; i++) { // Add 30 members
//         memberPromises.push(
//           request(app)
//             .post(`/v1/groups/${largeGroupId}/members`)
//             .set('Authorization', `Bearer ${authTokens[0]}`)
//             .send({ userId: manyUsers[i]._id })
//         );
//       }

//       const memberResponses = await Promise.all(memberPromises);
//       const memberAddTime = Date.now() - startTime;

//       // All member additions should succeed
//       memberResponses.forEach(response => {
//         expect(response.status).toBe(200);
//       });

//       console.log(`Added 30 members in ${memberAddTime}ms`);
//       expect(memberAddTime).toBeLessThan(30000); // Should complete within 30 seconds

//       // Test group operations with large membership
//       const operationTests = [
//         {
//           name: 'Get group details',
//           operation: () => request(app)
//             .get(`/v1/groups/${largeGroupId}`)
//             .set('Authorization', `Bearer ${authTokens[0]}`)
//         },
//         {
//           name: 'Get group members',
//           operation: () => request(app)
//             .get(`/v1/groups/${largeGroupId}/members`)
//             .set('Authorization', `Bearer ${authTokens[0]}`)
//         },
//         {
//           name: 'Create group expense',
//           operation: () => request(app)
//             .post('/v1/expenses')
//             .set('Authorization', `Bearer ${authTokens[0]}`)
//             .send({
//               description: 'Large Group Expense',
//               amount: 500,
//               splitWith: manyUsers.slice(0, 10).map(user => ({ user: user._id, amount: 50 })),
//               group: largeGroupId
//             })
//         }
//       ];

//       for (const test of operationTests) {
//         const opStartTime = Date.now();
//         const response = await test.operation();
//         const opTime = Date.now() - opStartTime;

//         expect(response.status).toBeLessThan(400);
//         console.log(`${test.name}: ${opTime}ms`);
//         expect(opTime).toBeLessThan(5000); // Each operation under 5 seconds
//       }
//     });

//     test('should handle concurrent group operations', async () => {
//       // Create base group
//       const groupResponse = await request(app)
//         .post('/v1/groups')
//         .set('Authorization', `Bearer ${authTokens[0]}`)
//         .send({
//           name: 'Concurrent Operations Group',
//           description: 'Testing concurrent operations'
//         })
//         .expect(201);

//       const groupId = groupResponse.body.data._id;

//       // Perform concurrent operations
//       const concurrentOps = [];

//       // Add members concurrently
//       for (let i = 1; i < testUsers.length; i++) {
//         concurrentOps.push(
//           request(app)
//             .post(`/v1/groups/${groupId}/members`)
//             .set('Authorization', `Bearer ${authTokens[0]}`)
//             .send({ userId: testUsers[i]._id })
//         );
//       }

//       // Create expenses concurrently
//       for (let i = 0; i < 5; i++) {
//         concurrentOps.push(
//           request(app)
//             .post('/v1/expenses')
//             .set('Authorization', `Bearer ${authTokens[i % testUsers.length]}`)
//             .send({
//               description: `Concurrent Expense ${i}`,
//               amount: Math.floor(Math.random() * 100) + 20,
//               splitWith: [{ user: testUsers[(i + 1) % testUsers.length]._id, amount: 25 }],
//               group: groupId
//             })
//         );
//       }

//       // Update group concurrently (should handle conflicts)
//       for (let i = 0; i < 3; i++) {
//         concurrentOps.push(
//           request(app)
//             .put(`/v1/groups/${groupId}`)
//             .set('Authorization', `Bearer ${authTokens[0]}`)
//             .send({ description: `Concurrent update ${i}` })
//         );
//       }

//       const startTime = Date.now();
//       const responses = await Promise.all(concurrentOps);
//       const totalTime = Date.now() - startTime;

//       const successfulOps = responses.filter(r => r.status < 400).length;
//       const failedOps = responses.filter(r => r.status >= 400).length;

//       console.log(`Concurrent Operations:
//         Total: ${concurrentOps.length}
//         Successful: ${successfulOps}
//         Failed: ${failedOps}
//         Success Rate: ${((successfulOps / concurrentOps.length) * 100).toFixed(2)}%
//         Total Time: ${totalTime}ms`);

//       // Should handle at least 80% of concurrent operations successfully
//       expect(successfulOps / concurrentOps.length).toBeGreaterThan(0.8);
//       expect(totalTime).toBeLessThan(15000); // Within 15 seconds
//     });
//   });
// });
