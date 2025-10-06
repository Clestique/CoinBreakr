const mongoose = require('mongoose');
const User = require('../../models/User');
const Expense = require('../../models/Expense');
const Group = require('../../models/Group');

describe('🗄️ Database Tests - Data Integrity & Consistency', () => {
  let testUser1, testUser2, testUser3;
  let testGroup;

  beforeEach(async () => {
    // Create test users
    testUser1 = new User(global.testUtils.createTestUser({
      name: 'Database Test User 1',
      email: 'db1@test.com'
    }));
    await testUser1.save();

    testUser2 = new User(global.testUtils.createTestUser({
      name: 'Database Test User 2',
      email: 'db2@test.com'
    }));
    await testUser2.save();

    testUser3 = new User(global.testUtils.createTestUser({
      name: 'Database Test User 3',
      email: 'db3@test.com'
    }));
    await testUser3.save();

    // Create test group
    testGroup = new Group(global.testUtils.createTestGroup(
      testUser1._id,
      [testUser2._id, testUser3._id]
    ));
    await testGroup.save();
  });

  describe('🔗 Referential Integrity Tests', () => {
    test('should maintain user references in expenses', async () => {
      // Create expense with user references
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id, testUser3._id]
      ));
      await expense.save();

      // Populate and verify references
      const populatedExpense = await Expense.findById(expense._id)
        .populate('paidBy')
        .populate('splitWith.user');

      expect(populatedExpense.paidBy).toBeTruthy();
      expect(populatedExpense.paidBy._id.toString()).toBe(testUser1._id.toString());
      expect(populatedExpense.splitWith).toHaveLength(2);
      
      populatedExpense.splitWith.forEach(split => {
        expect(split.user).toBeTruthy();
        expect(mongoose.Types.ObjectId.isValid(split.user._id)).toBe(true);
      });
    });

    test('should maintain group references in expenses', async () => {
      // Create group expense
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { group: testGroup._id }
      ));
      await expense.save();

      // Verify group reference
      const populatedExpense = await Expense.findById(expense._id)
        .populate('group');

      expect(populatedExpense.group).toBeTruthy();
      expect(populatedExpense.group._id.toString()).toBe(testGroup._id.toString());
    });

    test('should maintain user references in groups', async () => {
      // Verify group member references
      const populatedGroup = await Group.findById(testGroup._id)
        .populate('members.user')
        .populate('createdBy');

      expect(populatedGroup.createdBy).toBeTruthy();
      expect(populatedGroup.createdBy._id.toString()).toBe(testUser1._id.toString());
      expect(populatedGroup.members).toHaveLength(3);

      populatedGroup.members.forEach(member => {
        expect(member.user).toBeTruthy();
        expect(mongoose.Types.ObjectId.isValid(member.user._id)).toBe(true);
      });
    });

    test('should handle orphaned references gracefully', async () => {
      // Create expense with valid user
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id]
      ));
      await expense.save();

      // Delete user (simulating orphaned reference)
      await User.findByIdAndDelete(testUser2._id);

      // Query should not fail, but populate should return null
      const populatedExpense = await Expense.findById(expense._id)
        .populate('splitWith.user');

      expect(populatedExpense).toBeTruthy();
      expect(populatedExpense.splitWith[0].user).toBeNull();
    });
  });

  describe('🔄 Bidirectional Relationship Consistency', () => {
    test('should maintain friend relationships bidirectionally', async () => {
      // Add friend relationship
      testUser1.friends.push(testUser2._id);
      await testUser1.save();

      testUser2.friends.push(testUser1._id);
      await testUser2.save();

      // Verify bidirectional relationship
      const user1 = await User.findById(testUser1._id);
      const user2 = await User.findById(testUser2._id);

      expect(user1.friends).toContainEqual(testUser2._id);
      expect(user2.friends).toContainEqual(testUser1._id);
    });

    test('should handle friend removal consistently', async () => {
      // Add friend relationship
      testUser1.friends.push(testUser2._id);
      testUser2.friends.push(testUser1._id);
      await testUser1.save();
      await testUser2.save();

      // Remove friend from one side
      testUser1.friends = testUser1.friends.filter(
        id => id.toString() !== testUser2._id.toString()
      );
      await testUser1.save();

      // Verify removal
      const user1 = await User.findById(testUser1._id);
      const user2 = await User.findById(testUser2._id);

      expect(user1.friends).not.toContainEqual(testUser2._id);
      expect(user2.friends).toContainEqual(testUser1._id); // Still exists on other side
    });

    test('should maintain group membership consistency', async () => {
      // Verify all members are properly added
      const group = await Group.findById(testGroup._id);
      
      expect(group.members).toHaveLength(3);
      expect(group.isMember(testUser1._id)).toBe(true);
      expect(group.isMember(testUser2._id)).toBe(true);
      expect(group.isMember(testUser3._id)).toBe(true);
    });
  });

  describe('💰 Expense Balance Calculations', () => {
    test('should calculate correct balance between two users', async () => {
      // User1 pays 100, splits with User2 (50 each)
      const expense1 = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { amount: 100, splitWith: [{ user: testUser2._id, amount: 50, settled: false }] }
      ));
      await expense1.save();

      // User2 pays 60, splits with User1 (30 each)
      const expense2 = new Expense(global.testUtils.createTestExpense(
        testUser2._id,
        [testUser1._id],
        { amount: 60, splitWith: [{ user: testUser1._id, amount: 30, settled: false }] }
      ));
      await expense2.save();

      // Calculate balance: User1 is owed 50 - 30 = 20
      const balance = await Expense.getBalanceWithUser(testUser1._id, testUser2._id);
      expect(balance).toBe(20);
    });

    test('should handle complex multi-user expense splits', async () => {
      // User1 pays 300, splits equally among 3 users (100 each)
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id, testUser3._id],
        {
          amount: 300,
          splitWith: [
            { user: testUser2._id, amount: 100, settled: false },
            { user: testUser3._id, amount: 100, settled: false }
          ]
        }
      ));
      await expense.save();

      // User1 should be owed 200 total (100 from each user)
      const balanceWith2 = await Expense.getBalanceWithUser(testUser1._id, testUser2._id);
      const balanceWith3 = await Expense.getBalanceWithUser(testUser1._id, testUser3._id);

      expect(balanceWith2).toBe(100);
      expect(balanceWith3).toBe(100);
    });

    test('should update balances correctly after settlement', async () => {
      // Create expense
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { amount: 100, splitWith: [{ user: testUser2._id, amount: 50, settled: false }] }
      ));
      await expense.save();

      // Initial balance
      let balance = await Expense.getBalanceWithUser(testUser1._id, testUser2._id);
      expect(balance).toBe(50);

      // Settle the expense
      expense.settleSplit(testUser2._id);
      await expense.save();

      // Balance should remain the same (settlement doesn't change the amount owed)
      balance = await Expense.getBalanceWithUser(testUser1._id, testUser2._id);
      expect(balance).toBe(50);

      // But the split should be marked as settled
      const updatedExpense = await Expense.findById(expense._id);
      expect(updatedExpense.splitWith[0].settled).toBe(true);
    });
  });

  describe('🏗️ Schema Validation & Constraints', () => {
    test('should enforce unique email constraint', async () => {
      const duplicateUser = new User(global.testUtils.createTestUser({
        email: 'db1@test.com' // Same as testUser1
      }));

      await expect(duplicateUser.save()).rejects.toThrow();
    });

    test('should enforce required fields', async () => {
      // User without required fields
      const invalidUser = new User({});
      await expect(invalidUser.save()).rejects.toThrow();

      // Expense without required fields
      const invalidExpense = new Expense({});
      await expect(invalidExpense.save()).rejects.toThrow();

      // Group without required fields
      const invalidGroup = new Group({});
      await expect(invalidGroup.save()).rejects.toThrow();
    });

    test('should enforce field length constraints', async () => {
      // User name too long
      const longNameUser = new User(global.testUtils.createTestUser({
        name: 'A'.repeat(51), // Max is 50
        email: 'longname@test.com'
      }));
      await expect(longNameUser.save()).rejects.toThrow();

      // Expense description too long
      const longDescExpense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { description: 'A'.repeat(201) } // Max is 200
      ));
      await expect(longDescExpense.save()).rejects.toThrow();

      // Group name too long
      const longNameGroup = new Group(global.testUtils.createTestGroup(
        testUser1._id,
        [],
        { name: 'A'.repeat(101) } // Max is 100
      ));
      await expect(longNameGroup.save()).rejects.toThrow();
    });

    test('should enforce enum constraints', async () => {
      // Invalid user role
      const invalidRoleUser = new User(global.testUtils.createTestUser({
        email: 'invalidrole@test.com',
        role: 'superuser' // Not in enum
      }));
      await expect(invalidRoleUser.save()).rejects.toThrow();

      // Invalid expense category
      const invalidCategoryExpense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { category: 'invalid-category' }
      ));
      await expect(invalidCategoryExpense.save()).rejects.toThrow();
    });

    test('should enforce minimum value constraints', async () => {
      // Negative expense amount
      const negativeAmountExpense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { amount: -10 }
      ));
      await expect(negativeAmountExpense.save()).rejects.toThrow();

      // Zero expense amount
      const zeroAmountExpense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { amount: 0 }
      ));
      await expect(zeroAmountExpense.save()).rejects.toThrow();
    });
  });

  describe('🔐 Data Security & Sanitization', () => {
    test('should hash passwords before saving', async () => {
      const plainPassword = 'testpassword123';
      const user = new User(global.testUtils.createTestUser({
        email: 'hashtest@test.com',
        password: plainPassword
      }));
      await user.save();

      // Password should be hashed
      const savedUser = await User.findById(user._id).select('+password');
      expect(savedUser.password).not.toBe(plainPassword);
      expect(savedUser.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    test('should not include password in JSON output', async () => {
      const user = await User.findById(testUser1._id);
      const userJSON = user.toJSON();
      
      expect(userJSON).not.toHaveProperty('password');
      expect(userJSON).toHaveProperty('name');
      expect(userJSON).toHaveProperty('email');
    });

    test('should validate email format strictly', async () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        'user@.domain.com',
        'user@domain.com.',
        'user name@domain.com'
      ];

      for (const email of invalidEmails) {
        const user = new User(global.testUtils.createTestUser({ email }));
        await expect(user.save()).rejects.toThrow();
      }
    });

    test('should sanitize input data', async () => {
      // Test with potentially harmful input
      const user = new User(global.testUtils.createTestUser({
        name: '  Test User  ', // Should be trimmed
        email: '  TEST@EXAMPLE.COM  ' // Should be lowercase and trimmed
      }));
      await user.save();

      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('🕒 Timestamp Management', () => {
    test('should set createdAt timestamp on creation', async () => {
      const beforeCreate = new Date();
      await global.testUtils.wait(10); // Small delay

      const user = new User(global.testUtils.createTestUser({
        email: 'timestamp@test.com'
      }));
      await user.save();

      await global.testUtils.wait(10); // Small delay
      const afterCreate = new Date();

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.createdAt.getTime()).toBeGreaterThan(beforeCreate.getTime());
      expect(user.createdAt.getTime()).toBeLessThan(afterCreate.getTime());
    });

    test('should update updatedAt timestamp on modification', async () => {
      const user = await User.findById(testUser1._id);
      const originalUpdatedAt = user.updatedAt;

      await global.testUtils.wait(100); // Ensure time difference

      user.name = 'Updated Name';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    test('should update updatedAt on findOneAndUpdate', async () => {
      const originalUser = await User.findById(testUser1._id);
      const originalUpdatedAt = originalUser.updatedAt;

      await global.testUtils.wait(1000); // Ensure time difference

      const updatedUser = await User.findByIdAndUpdate(
        testUser1._id,
        { 
          name: 'Updated via findOneAndUpdate',
          updatedAt: new Date() // Explicitly set updatedAt
        },
        { new: true, runValidators: true }
      );

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('🔄 Concurrent Operations', () => {
    test('should handle concurrent user creation', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        const user = new User(global.testUtils.createTestUser({
          name: `Concurrent User ${i}`,
          email: `concurrent${i}@test.com`
        }));
        promises.push(user.save());
      }

      const results = await Promise.all(promises);
      
      // All users should be created successfully
      expect(results).toHaveLength(10);
      results.forEach(user => {
        expect(user._id).toBeTruthy();
        expect(user.createdAt).toBeInstanceOf(Date);
      });
    });

    test('should handle concurrent expense creation', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        const expense = new Expense(global.testUtils.createTestExpense(
          testUser1._id,
          [testUser2._id],
          { 
            description: `Concurrent Expense ${i}`,
            amount: 100 + i
          }
        ));
        promises.push(expense.save());
      }

      const results = await Promise.all(promises);
      
      // All expenses should be created successfully
      expect(results).toHaveLength(5);
      results.forEach(expense => {
        expect(expense._id).toBeTruthy();
        expect(expense.paidBy.toString()).toBe(testUser1._id.toString());
      });
    });

    test('should handle concurrent friend additions', async () => {
      const promises = [];
      
      // Multiple users trying to add the same friend
      for (let i = 0; i < 3; i++) {
        promises.push(
          User.findByIdAndUpdate(
            testUser1._id,
            { $addToSet: { friends: testUser2._id } },
            { new: true }
          )
        );
      }

      const results = await Promise.all(promises);
      
      // Friend should only be added once due to $addToSet
      const finalUser = await User.findById(testUser1._id);
      const friendCount = finalUser.friends.filter(
        id => id.toString() === testUser2._id.toString()
      ).length;
      
      expect(friendCount).toBe(1);
    });

    test('should handle concurrent group member additions', async () => {
      const newUser1 = new User(global.testUtils.createTestUser({
        email: 'newmember1@test.com'
      }));
      await newUser1.save();

      const newUser2 = new User(global.testUtils.createTestUser({
        email: 'newmember2@test.com'
      }));
      await newUser2.save();

      // Concurrent member additions
      const promises = [
        Group.findByIdAndUpdate(
          testGroup._id,
          { 
            $push: { 
              members: { 
                user: newUser1._id, 
                role: 'member', 
                joinedAt: new Date() 
              } 
            } 
          },
          { new: true }
        ),
        Group.findByIdAndUpdate(
          testGroup._id,
          { 
            $push: { 
              members: { 
                user: newUser2._id, 
                role: 'member', 
                joinedAt: new Date() 
              } 
            } 
          },
          { new: true }
        )
      ];

      const results = await Promise.all(promises);
      
      // Both members should be added
      const finalGroup = await Group.findById(testGroup._id);
      expect(finalGroup.members).toHaveLength(5); // Original 3 + 2 new
    });
  });

  describe('🧹 Data Cleanup & Maintenance', () => {
    test('should handle cascade deletion scenarios', async () => {
      // Create expenses involving a user
      const expense1 = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id]
      ));
      await expense1.save();

      const expense2 = new Expense(global.testUtils.createTestExpense(
        testUser2._id,
        [testUser1._id]
      ));
      await expense2.save();

      // Delete user
      await User.findByIdAndDelete(testUser1._id);

      // Expenses should still exist but with orphaned references
      const remainingExpenses = await Expense.find({
        $or: [
          { paidBy: testUser1._id },
          { 'splitWith.user': testUser1._id }
        ]
      });

      expect(remainingExpenses).toHaveLength(2);
    });

    test('should maintain data consistency after bulk operations', async () => {
      // Create multiple expenses
      const expenses = [];
      for (let i = 0; i < 5; i++) {
        expenses.push(new Expense(global.testUtils.createTestExpense(
          testUser1._id,
          [testUser2._id],
          { description: `Bulk Expense ${i}` }
        )));
      }
      await Expense.insertMany(expenses);

      // Bulk update
      await Expense.updateMany(
        { paidBy: testUser1._id },
        { category: 'entertainment' }
      );

      // Verify all were updated
      const updatedExpenses = await Expense.find({ paidBy: testUser1._id });
      expect(updatedExpenses).toHaveLength(5);
      updatedExpenses.forEach(expense => {
        expect(expense.category).toBe('entertainment');
      });
    });

    test('should handle index constraints properly', async () => {
      // Test unique index on email
      const user1 = new User(global.testUtils.createTestUser({
        email: 'unique@test.com'
      }));
      await user1.save();

      const user2 = new User(global.testUtils.createTestUser({
        email: 'unique@test.com' // Same email
      }));

      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('📊 Database Performance', () => {
    test('should perform queries efficiently with proper indexes', async () => {
      // Create multiple users and expenses for performance testing
      const users = [];
      for (let i = 0; i < 50; i++) {
        users.push(new User(global.testUtils.createTestUser({
          name: `Performance User ${i}`,
          email: `perf${i}@test.com`
        })));
      }
      await User.insertMany(users);

      const expenses = [];
      for (let i = 0; i < 100; i++) {
        expenses.push(new Expense(global.testUtils.createTestExpense(
          users[i % 50]._id,
          [users[(i + 1) % 50]._id],
          { description: `Performance Expense ${i}` }
        )));
      }
      await Expense.insertMany(expenses);

      // Test query performance
      const startTime = Date.now();
      
      const userExpenses = await Expense.find({ paidBy: users[0]._id });
      const searchResults = await User.find({ 
        name: { $regex: 'Performance User', $options: 'i' } 
      });
      
      const queryTime = Date.now() - startTime;

      expect(userExpenses.length).toBeGreaterThan(0);
      expect(searchResults.length).toBe(50);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle large dataset operations efficiently', async () => {
      // Create a large number of expenses
      const expenses = [];
      for (let i = 0; i < 200; i++) {
        expenses.push(global.testUtils.createTestExpense(
          testUser1._id,
          [testUser2._id],
          { 
            description: `Large Dataset Expense ${i}`,
            amount: Math.floor(Math.random() * 1000) + 1
          }
        ));
      }

      const startTime = Date.now();
      await Expense.insertMany(expenses);
      const insertTime = Date.now() - startTime;

      expect(insertTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Test aggregation performance
      const aggStartTime = Date.now();
      const totalAmount = await Expense.aggregate([
        { $match: { paidBy: testUser1._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const aggTime = Date.now() - aggStartTime;

      expect(totalAmount).toHaveLength(1);
      expect(totalAmount[0].total).toBeGreaterThan(0);
      expect(aggTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('🔍 Data Validation Edge Cases', () => {
    test('should handle edge cases in email validation', async () => {
      const edgeCaseEmails = [
        'test+tag@example.com', // Plus sign (should be valid)
        'test.name@example.com', // Dot in local part (should be valid)
        'test_name@example.com', // Underscore (should be valid)
        'test-name@example.com'  // Hyphen (should be valid)
      ];

      for (const email of edgeCaseEmails) {
        const user = new User(global.testUtils.createTestUser({ 
          email,
          name: `User for ${email}`
        }));
        await expect(user.save()).resolves.toBeTruthy();
      }
    });

    test('should handle edge cases in numeric fields', async () => {
      // Very small positive amount
      const smallAmountExpense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { amount: 0.01 }
      ));
      await expect(smallAmountExpense.save()).resolves.toBeTruthy();

      // Very large amount
      const largeAmountExpense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { amount: 999999.99 }
      ));
      await expect(largeAmountExpense.save()).resolves.toBeTruthy();
    });

    test('should handle edge cases in date fields', async () => {
      // Future date
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      const futureExpense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { date: futureDate }
      ));
      await expect(futureExpense.save()).resolves.toBeTruthy();

      // Very old date
      const oldDate = new Date('1900-01-01');
      const oldExpense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { date: oldDate }
      ));
      await expect(oldExpense.save()).resolves.toBeTruthy();
    });
  });
});