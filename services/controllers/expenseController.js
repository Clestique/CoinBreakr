const Expense = require('../models/Expense');
const User = require('../models/User');
const Group = require('../models/Group');

// @desc    Create new expense
const createExpense = async (req, res) => {
  try {
    const { description, amount, currency, splitWith, category, date, groupId } = req.body;

    // Validate required fields
    if (!description || !amount || !splitWith || splitWith.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Description, amount, and at least one split partner are required'
      });
    }

    // Validate splitWith array structure
    for (const split of splitWith) {
      if (!split.user || !split.amount) {
        return res.status(400).json({
          success: false,
          message: 'Each split must have both user and amount'
        });
      }
      
      // Convert string numbers to numbers
      const numericAmount = parseFloat(split.amount);
      if (isNaN(numericAmount)) {
        return res.status(400).json({
          success: false,
          message: 'Split amount must be a valid number'
        });
      }
      split.amount = numericAmount;
      
      if (split.amount < 0) {
        return res.status(400).json({
          success: false,
          message: 'Split amount cannot be negative'
        });
      }
    }

    // Validate and convert amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a valid number greater than 0'
      });
    }

    // If groupId is provided, validate group membership
    let group = null;
    if (groupId) {
      group = await Group.findById(groupId);
      if (!group) {
        return res.status(400).json({
          success: false,
          message: 'Group not found'
        });
      }
      
      // Check if user is a member of the group
      if (!group.isMember(req.userId)) {
        return res.status(400).json({
          success: false,
          message: 'You are not a member of this group'
        });
      }
    }

    // Check if all split partners are valid
    const user = await User.findById(req.userId);
    const splitUserIds = splitWith.map(split => split.user);
    
    for (const userId of splitUserIds) {
      // Allow the person who paid to split with themselves
      if (userId !== req.userId.toString()) {
        if (groupId) {
          // For group expenses, check if user is a group member
          if (!group.isMember(userId)) {
            return res.status(400).json({
              success: false,
              message: 'All split partners must be members of the group'
            });
          }
        }
      }
    }

    // Calculate total split amount
    const totalSplitAmount = splitWith.reduce((total, split) => total + split.amount, 0);
    
    // Validate that split amounts match the total expense amount
    if (Math.abs(totalSplitAmount - numericAmount) > 0.01) {
      return res.status(408).json({
        success: false,
        message: `${totalSplitAmount} ${numericAmount}`
      });
    }

    // Validate and parse date
    let parsedDate = new Date();
    if (date) {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }
    }

    // Create expense
    const expense = new Expense({
      description,
      amount: numericAmount,
      currency: currency || 'USD',
      paidBy: req.userId,
      splitWith,
      category: category || 'other',
      date: parsedDate,
      group: groupId || null
    });

    await expense.save();

    // Populate the expense with user details
    await expense.populate('paidBy', 'name email');
    await expense.populate('splitWith.user', 'name email');
    if (groupId) {
      await expense.populate('group', 'name');
    }

    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's expenses
const getUserExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, friendId, settled } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      $or: [
        { paidBy: req.userId },
        { 'splitWith.user': req.userId }
      ]
    };

    // Filter by friend if specified
    if (friendId) {
      query = {
        $and: [
          query,
          {
            $or: [
              { paidBy: req.userId, 'splitWith.user': friendId },
              { paidBy: friendId, 'splitWith.user': req.userId }
            ]
          }
        ]
      };
    }

    // Filter by settlement status
    if (settled !== undefined) {
      query.isSettled = settled === 'true';
    }

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email profileImage')
      .populate('splitWith.user', 'name email profileImage')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get expense by ID
const getExpenseById = async (req, res) => {
  try {
    // Validate MongoDB ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID format'
      });
    }

    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name email profileImage')
      .populate('splitWith.user', 'name email profileImage');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user is involved in this expense
    const isInvolved = expense.paidBy._id.toString() === req.userId.toString() || 
                      expense.splitWith.some(split => split.user._id.toString() === req.userId.toString());

    if (!isInvolved) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this expense'
      });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update expense
const updateExpense = async (req, res) => {
  try {
    const { description, amount, currency, splitWith, category, date } = req.body;

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user is the one who paid
    if (expense.paidBy.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the person who paid can update this expense'
      });
    }

    // Check if expense is already settled
    if (expense.isSettled) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a settled expense'
      });
    }

    // Validate split amounts if provided
    if (splitWith) {
      const totalSplitAmount = splitWith.reduce((total, split) => total + split.amount, 0);
      const expenseAmount = amount || expense.amount;
      
      if (Math.abs(totalSplitAmount - expenseAmount) > 0.01) {
        return res.status(400).json({
          success: false,
          message: 'Split amounts must equal the total expense amount'
        });
      }
    }

    // Update expense
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        ...(description && { description }),
        ...(amount && { amount }),
        ...(currency && { currency }),
        ...(splitWith && { splitWith }),
        ...(category && { category }),
        ...(date && { date: new Date(date) })
      },
      { new: true, runValidators: true }
    ).populate('paidBy', 'name email profileImage')
     .populate('splitWith.user', 'name email profileImage');

    res.status(200).json({
      success: true,
      data: updatedExpense,
      message: 'Expense updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete expense
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user is the one who paid
    if (expense.paidBy.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the person who paid can delete this expense'
      });
    }

    // Check if expense is already settled
    if (expense.isSettled) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a settled expense'
      });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Settle expense split
const settleExpenseSplit = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user is involved in this expense
    const isInvolved = expense.paidBy.toString() === req.userId.toString() || 
                      expense.splitWith.some(split => split.user.toString() === req.userId.toString());

    if (!isInvolved) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to settle this expense'
      });
    }

    // Check if the user to settle with is in the split
    const splitToSettle = expense.splitWith.find(split => split.user.toString() === userId);
    if (!splitToSettle) {
      return res.status(400).json({
        success: false,
        message: 'User is not part of this expense split'
      });
    }

    // Check if already settled
    if (splitToSettle.settled) {
      return res.status(400).json({
        success: false,
        message: 'This split is already settled'
      });
    }

    // Settle the split
    const settled = expense.settleSplit(userId);
    
    if (settled) {
      await expense.save();
      
      // Populate the updated expense
      await expense.populate('paidBy', 'name email profileImage');
      await expense.populate('splitWith.user', 'name email profileImage');

      res.json({
        success: true,
        data: expense,
        message: 'Split settled successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to settle split'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get expenses between two users
const getExpensesBetweenUsers = async (req, res) => {
  try {
    const { friendId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Check if users are friends
    const user = await User.findById(req.userId);
    if (!user.friends.includes(friendId)) {
      return res.status(400).json({
        success: false,
        message: 'User is not your friend'
      });
    }

    const expenses = await Expense.getExpensesBetweenUsers(req.userId, friendId)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments({
      $or: [
        { paidBy: req.userId, 'splitWith.user': friendId },
        { paidBy: friendId, 'splitWith.user': req.userId }
      ]
    });

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get group expenses
const getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 10, settled } = req.query;
    const skip = (page - 1) * limit;

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a member of the group
    if (!group.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this group'
      });
    }

    let query = { group: groupId };

    // Filter by settlement status
    if (settled !== undefined) {
      query.isSettled = settled === 'true';
    }

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email profileImage')
      .populate('splitWith.user', 'name email profileImage')
      .populate('group', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get group balance summary
const getGroupBalance = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a member of the group
    if (!group.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this group'
      });
    }

    const expenses = await Expense.getGroupExpenses(groupId);
    const balances = {};

    // Calculate balances for each member
    for (const member of group.members) {
      const userId = member.user.toString();
      balances[userId] = await Expense.getUserGroupBalance(userId, groupId);
    }

    // Get member details
    await group.populate('members.user', 'name email profileImage');

    res.json({
      success: true,
      data: {
        group: {
          _id: group._id,
          name: group.name,
          members: group.members
        },
        balances,
        totalExpenses: expenses.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createExpense,
  getUserExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  settleExpenseSplit,
  getExpensesBetweenUsers,
  getGroupExpenses,
  getGroupBalance
};