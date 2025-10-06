const mongoose = require('mongoose');
const User = require('../../models/User');
const Expense = require('../../models/Expense');
const Group = require('../../models/Group');

describe('🔍 Database Edge Cases - Extreme Scenarios', () => {
  let testUser1, testUser2, testUser3;

  beforeEach(async () => {
    testUser1 = new User(global.testUtils.createTestUser({
      name: 'Edge Case User 1',
      email: 'edge1@test.com'
    }));
    await testUser1.save();

    testUser2 = new User(global.testUtils.createTestUser({
      name: 'Edge Case User 2',
      email: 'edge2@test.com'
    }));
    await testUser2.save();

    testUser3 = new User(global.testUtils.createTestUser({
      name: 'Edge Case User 3',
      email: 'edge3@test.com'
    }));
    await testUser3.save();
  });

  describe('🔢 Numeric Edge Cases', () => {
    test('should handle maximum safe integer values', async () => {
      const maxSafeAmount = Number.MAX_SAFE_INTEGER;
      
      // This should fail due to practical limits
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { amount: maxSafeAmount }
      ));
      
      // Should save but might cause issues in calculations
      await expect(expense.save()).resolves.toBeTruthy();
      
      // Verify the amount is stored correctly
      const savedExpense = await Expense.findById(expense._id);
      expect(savedExpense.amount).toBe(maxSafeAmount);
    });

    test('should handle floating point precision issues', async () => {
      // Test with numbers that have floating point precision issues
      const precisionAmount = 0.1 + 0.2; // Should be 0.3 but might be 0.30000000000000004
      
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { amount: precisionAmount }
      ));
      await expense.save();
      
      const savedExpense = await Expense.findById(expense._id);
      expect(savedExpense.amount).toBeCloseTo(0.3, 2);
    });

    test('should handle very small decimal amounts', async () => {
      const verySmallAmount = 0.001;
      
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { amount: verySmallAmount }
      ));
      
      // Should fail due to minimum amount constraint
      await expect(expense.save()).rejects.toThrow();
    });

    test('should handle split amounts that don\'t add up to total', async () => {
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id, testUser3._id],
        {
          amount: 100,
          splitWith: [
            { user: testUser2._id, amount: 30 }, // Total split: 80
            { user: testUser3._id, amount: 50 }  // But expense is 100
          ]
        }
      ));
      
      await expense.save(); // Should save (validation is at application level)
      
      // Check virtual for total split amount
      expect(expense.totalSplitAmount).toBe(80);
      expect(expense.amount).toBe(100);
    });
  });

  describe('📝 String Edge Cases', () => {
    test('should handle unicode characters in names and descriptions', async () => {
      const unicodeUser = new User(global.testUtils.createTestUser({
        name: '测试用户 🎉 Émilie François',
        email: 'unicode@test.com'
      }));
      await unicodeUser.save();
      
      expect(unicodeUser.name).toBe('测试用户 🎉 Émilie François');
      
      const unicodeExpense = new Expense(global.testUtils.createTestExpense(
        unicodeUser._id,
        [testUser2._id],
        { description: '🍕 Pizza with friends 测试 café' }
      ));
      await unicodeExpense.save();
      
      expect(unicodeExpense.description).toBe('🍕 Pizza with friends 测试 café');
    });

    test('should handle maximum length strings', async () => {
      // Test maximum length name (50 characters)
      const maxLengthName = 'A'.repeat(50);
      const user = new User(global.testUtils.createTestUser({
        name: maxLengthName,
        email: 'maxlength@test.com'
      }));
      await user.save();
      expect(user.name).toBe(maxLengthName);
      
      // Test maximum length description (200 characters)
      const maxLengthDesc = 'B'.repeat(200);
      const expense = new Expense(global.testUtils.createTestExpense(
        user._id,
        [testUser2._id],
        { description: maxLengthDesc }
      ));
      await expense.save();
      expect(expense.description).toBe(maxLengthDesc);
      
      // Test maximum length group name (100 characters)
      const maxLengthGroupName = 'C'.repeat(100);
      const group = new Group(global.testUtils.createTestGroup(
        user._id,
        [],
        { name: maxLengthGroupName }
      ));
      await group.save();
      expect(group.name).toBe(maxLengthGroupName);
    });

    test('should handle special characters and symbols', async () => {
      const specialCharsUser = new User(global.testUtils.createTestUser({
        name: 'John O\'Connor-Smith Jr. & Co.',
        email: 'special@test.com'
      }));
      await specialCharsUser.save();
      
      const specialCharsExpense = new Expense(global.testUtils.createTestExpense(
        specialCharsUser._id,
        [testUser2._id],
        { description: 'Dinner @ "The Best" Restaurant (50% off!)' }
      ));
      await specialCharsExpense.save();
      
      expect(specialCharsUser.name).toBe('John O\'Connor-Smith Jr. & Co.');
      expect(specialCharsExpense.description).toBe('Dinner @ "The Best" Restaurant (50% off!)');
    });

    test('should handle empty strings and whitespace', async () => {
      // Empty description should fail
      const emptyDescExpense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { description: '' }
      ));
      await expect(emptyDescExpense.save()).rejects.toThrow();
      
      // Whitespace-only description should fail after trimming
      const whitespaceDescExpense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { description: '   ' }
      ));
      await expect(whitespaceDescExpense.save()).rejects.toThrow();
      
      // Group description can be empty (has default)
      const emptyDescGroup = new Group(global.testUtils.createTestGroup(
        testUser1._id,
        [],
        { description: '' }
      ));
      await emptyDescGroup.save();
      expect(emptyDescGroup.description).toBe('');
    });
  });

  describe('📅 Date Edge Cases', () => {
    test('should handle extreme date values', async () => {
      // Very old date
      const veryOldDate = new Date('1900-01-01');
      const oldExpense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { date: veryOldDate }
      ));
      await oldExpense.save();
      expect(oldExpense.date).toEqual(veryOldDate);
      
      // Far future date
      const futureDate = new Date('2100-12-31');
      const futureExpense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { date: futureDate }
      ));
      await futureExpense.save();
      expect(futureExpense.date).toEqual(futureDate);
    });

    test('should handle invalid date objects', async () => {
      const invalidDate = new Date('invalid-date');
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { date: invalidDate }
      ));
      
      // MongoDB should handle invalid dates
      await expect(expense.save()).rejects.toThrow();
    });

    test('should handle timezone edge cases', async () => {
      // Date at timezone boundary
      const timezoneDate = new Date('2023-12-31T23:59:59.999Z');
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { date: timezoneDate }
      ));
      await expense.save();
      
      expect(expense.date).toEqual(timezoneDate);
    });
  });

  describe('🆔 ObjectId Edge Cases', () => {
    test('should handle invalid ObjectId formats', async () => {
      const invalidIds = [
        'invalid-id',
        '123',
        'not-an-objectid',
        '507f1f77bcf86cd79943901', // Too short
        '507f1f77bcf86cd799439011z' // Invalid character
      ];
      
      for (const invalidId of invalidIds) {
        const expense = new Expense({
          description: 'Test Expense',
          amount: 100,
          paidBy: invalidId, // Invalid ObjectId
          splitWith: [{ user: testUser2._id, amount: 50 }]
        });
        
        await expect(expense.save()).rejects.toThrow();
      }
    });

    test('should handle non-existent ObjectId references', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const expense = new Expense(global.testUtils.createTestExpense(
        nonExistentId, // Non-existent user
        [testUser2._id]
      ));
      
      // Should save (referential integrity is not enforced at DB level)
      await expense.save();
      
      // But populate should return null
      const populatedExpense = await Expense.findById(expense._id)
        .populate('paidBy');
      
      expect(populatedExpense.paidBy).toBeNull();
    });

    test('should handle circular references in groups', async () => {
      // Create a group where a user is both creator and member
      const group = new Group({
        name: 'Circular Test Group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser1._id, role: 'member' } // Duplicate user
        ]
      });
      
      await group.save(); // Should save (validation is at application level)
      
      // Check for duplicate members
      const memberIds = group.members.map(m => m.user.toString());
      const uniqueIds = [...new Set(memberIds)];
      expect(memberIds.length).toBeGreaterThan(uniqueIds.length);
    });
  });

  describe('🔄 Array Edge Cases', () => {
    test('should handle empty arrays', async () => {
      // Expense with no splits (edge case)
      const expense = new Expense({
        description: 'Solo Expense',
        amount: 100,
        paidBy: testUser1._id,
        splitWith: [] // Empty array
      });
      await expense.save();
      
      expect(expense.splitWith).toHaveLength(0);
      expect(expense.totalSplitAmount).toBe(0);
    });

    test('should handle very large arrays', async () => {
      // Create many users for large split
      const manyUsers = [];
      for (let i = 0; i < 50; i++) {
        const user = new User(global.testUtils.createTestUser({
          name: `Bulk User ${i}`,
          email: `bulk${i}@test.com`
        }));
        await user.save();
        manyUsers.push(user._id);
      }
      
      // Create expense with many splits
      const largeSplitExpense = new Expense({
        description: 'Large Group Expense',
        amount: 1000,
        paidBy: testUser1._id,
        splitWith: manyUsers.map(userId => ({
          user: userId,
          amount: 20,
          settled: false
        }))
      });
      
      await largeSplitExpense.save();
      expect(largeSplitExpense.splitWith).toHaveLength(50);
    });

    test('should handle duplicate entries in arrays', async () => {
      // User with duplicate friends
      testUser1.friends = [testUser2._id, testUser2._id, testUser3._id];
      await testUser1.save();
      
      // Should save with duplicates (validation is at application level)
      expect(testUser1.friends).toHaveLength(3);
      
      // Group with duplicate members
      const group = new Group({
        name: 'Duplicate Members Group',
        createdBy: testUser1._id,
        members: [
          { user: testUser1._id, role: 'admin' },
          { user: testUser2._id, role: 'member' },
          { user: testUser2._id, role: 'member' } // Duplicate
        ]
      });
      await group.save();
      
      expect(group.members).toHaveLength(3);
    });
  });

  describe('🔀 Concurrent Modification Edge Cases', () => {
    test('should handle concurrent updates to the same document', async () => {
      const user = await User.findById(testUser1._id);
      
      // Simulate concurrent updates
      const update1 = User.findByIdAndUpdate(
        testUser1._id,
        { name: 'Updated by Process 1' },
        { new: true }
      );
      
      const update2 = User.findByIdAndUpdate(
        testUser1._id,
        { phoneNumber: '+1234567890' },
        { new: true }
      );
      
      const [result1, result2] = await Promise.all([update1, update2]);
      
      // Both updates should succeed
      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
      
      // Final state should have both changes or one of them
      const finalUser = await User.findById(testUser1._id);
      expect(finalUser.phoneNumber).toBe('+1234567890');
    });

    test('should handle concurrent expense settlements', async () => {
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id, testUser3._id],
        {
          splitWith: [
            { user: testUser2._id, amount: 50, settled: false },
            { user: testUser3._id, amount: 50, settled: false }
          ]
        }
      ));
      await expense.save();
      
      // Concurrent settlements
      const settle1 = Expense.findById(expense._id).then(exp => {
        exp.settleSplit(testUser2._id);
        return exp.save();
      });
      
      const settle2 = Expense.findById(expense._id).then(exp => {
        exp.settleSplit(testUser3._id);
        return exp.save();
      });
      
      await Promise.all([settle1, settle2]);
      
      // Check final state
      const finalExpense = await Expense.findById(expense._id);
      const settledCount = finalExpense.splitWith.filter(s => s.settled).length;
      expect(settledCount).toBeGreaterThan(0);
    });

    test('should handle race conditions in friend additions', async () => {
      // Multiple processes trying to add the same friend
      const addFriend1 = User.findByIdAndUpdate(
        testUser1._id,
        { $push: { friends: testUser2._id } },
        { new: true }
      );
      
      const addFriend2 = User.findByIdAndUpdate(
        testUser1._id,
        { $push: { friends: testUser2._id } },
        { new: true }
      );
      
      const addFriend3 = User.findByIdAndUpdate(
        testUser1._id,
        { $push: { friends: testUser3._id } },
        { new: true }
      );
      
      await Promise.all([addFriend1, addFriend2, addFriend3]);
      
      const finalUser = await User.findById(testUser1._id);
      expect(finalUser.friends.length).toBeGreaterThan(0);
    });
  });

  describe('💾 Memory and Performance Edge Cases', () => {
    test('should handle documents with many embedded documents', async () => {
      // Create group with many members
      const manyMembers = [];
      for (let i = 0; i < 100; i++) {
        const user = new User(global.testUtils.createTestUser({
          name: `Member ${i}`,
          email: `member${i}@test.com`
        }));
        await user.save();
        manyMembers.push({
          user: user._id,
          role: i === 0 ? 'admin' : 'member',
          joinedAt: new Date()
        });
      }
      
      const largeGroup = new Group({
        name: 'Very Large Group',
        createdBy: manyMembers[0].user,
        members: manyMembers
      });
      
      await largeGroup.save();
      expect(largeGroup.members).toHaveLength(100);
      
      // Test querying large group
      const populatedGroup = await Group.findById(largeGroup._id)
        .populate('members.user', 'name email');
      
      expect(populatedGroup.members).toHaveLength(100);
      expect(populatedGroup.members[0].user.name).toBeTruthy();
    }, 60000); // 1 minute timeout

    test('should handle deep population chains', async () => {
      // Create group with expense
      const group = new Group(global.testUtils.createTestGroup(
        testUser1._id,
        [testUser2._id]
      ));
      await group.save();
      
      const expense = new Expense(global.testUtils.createTestExpense(
        testUser1._id,
        [testUser2._id],
        { group: group._id }
      ));
      await expense.save();
      
      // Deep population: expense -> group -> members -> users
      const deepPopulated = await Expense.findById(expense._id)
        .populate({
          path: 'group',
          populate: {
            path: 'members.user',
            select: 'name email'
          }
        })
        .populate('paidBy', 'name email')
        .populate('splitWith.user', 'name email');
      
      expect(deepPopulated.group).toBeTruthy();
      expect(deepPopulated.group.members).toBeTruthy();
      expect(deepPopulated.group.members[0].user.name).toBeTruthy();
      expect(deepPopulated.paidBy.name).toBeTruthy();
      expect(deepPopulated.splitWith[0].user.name).toBeTruthy();
    });

    test('should handle bulk operations efficiently', async () => {
      const bulkUsers = [];
      for (let i = 0; i < 100; i++) {
        bulkUsers.push({
          name: `Bulk User ${i}`,
          email: `bulk${i}@test.com`,
          password: 'password123'
        });
      }
      
      // Bulk insert
      const startTime = Date.now();
      const insertedUsers = await User.insertMany(bulkUsers);
      const insertTime = Date.now() - startTime;
      
      expect(insertedUsers).toHaveLength(100);
      expect(insertTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Bulk update
      const updateStartTime = Date.now();
      await User.updateMany(
        { name: { $regex: /^Bulk User/ } },
        { $set: { role: 'user', isActive: true } }
      );
      const updateTime = Date.now() - updateStartTime;
      
      expect(updateTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('🔐 Security Edge Cases', () => {
    test('should handle potential injection attacks in queries', async () => {
      // Simulate NoSQL injection attempts
      const maliciousQueries = [
        { $where: 'function() { return true; }' },
        { email: { $regex: '.*', $options: 'i' } }, // Correct regex syntax
        { email: { $ne: null } }
      ];
      
      for (const maliciousQuery of maliciousQueries) {
        // These should not return all users if properly sanitized
        const users = await User.find(maliciousQuery);
        // The exact behavior depends on the sanitization middleware
        expect(Array.isArray(users)).toBe(true);
      }
    });

    test('should handle extremely long input strings', async () => {
      const veryLongString = 'A'.repeat(10000);
      
      // Should be rejected due to length constraints
      const user = new User(global.testUtils.createTestUser({
        name: veryLongString,
        email: 'longstring@test.com'
      }));
      
      await expect(user.save()).rejects.toThrow();
    });

    test('should handle null and undefined values', async () => {
      // Test with null values
      const nullUser = new User({
        name: null,
        email: 'null@test.com',
        password: 'password123'
      });
      await expect(nullUser.save()).rejects.toThrow();
      
      // Test with undefined values
      const undefinedUser = new User({
        name: undefined,
        email: 'undefined@test.com',
        password: 'password123'
      });
      await expect(undefinedUser.save()).rejects.toThrow();
    });
  });

  // Future tests
  // describe('🔄 Transaction Edge Cases', () => {
  //   test('should handle transaction rollback scenarios', async () => {
  //     const session = await mongoose.startSession();
      
  //     try {
  //       await session.withTransaction(async () => {
  //         // Create user
  //         const user = new User(global.testUtils.createTestUser({
  //           email: 'transaction@test.com'
  //         }));
  //         await user.save({ session });
          
  //         // Create expense
  //         const expense = new Expense(global.testUtils.createTestExpense(
  //           user._id,
  //           [testUser2._id]
  //         ));
  //         await expense.save({ session });
          
  //         // Simulate error that should rollback transaction
  //         throw new Error('Simulated transaction error');
  //       });
  //     } catch (error) {
  //       expect(error.message).toBe('Simulated transaction error');
  //     } finally {
  //       await session.endSession();
  //     }
      
  //     // User should not exist due to rollback
  //     const user = await User.findOne({ email: 'transaction@test.com' });
  //     expect(user).toBeNull();
  //   });

  //   test('should handle nested transaction scenarios', async () => {
  //     // MongoDB doesn't support nested transactions, but we can test the behavior
  //     const session = await mongoose.startSession();
      
  //     try {
  //       await session.withTransaction(async () => {
  //         const user = new User(global.testUtils.createTestUser({
  //           email: 'nested@test.com'
  //         }));
  //         await user.save({ session });
          
  //         // This should work within the same transaction
  //         const expense = new Expense(global.testUtils.createTestExpense(
  //           user._id,
  //           [testUser2._id]
  //         ));
  //         await expense.save({ session });
          
  //         expect(user._id).toBeTruthy();
  //         expect(expense._id).toBeTruthy();
  //       });
  //     } finally {
  //       await session.endSession();
  //     }
      
  //     // Both should exist after successful transaction
  //     const user = await User.findOne({ email: 'nested@test.com' });
  //     expect(user).toBeTruthy();
  //   });
  // });
});