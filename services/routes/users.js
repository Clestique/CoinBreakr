const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getUserProfile,
  updateUserProfile,
  searchUsers,
  addFriend,
  removeFriend,
  getFriends,
  getBalanceWithFriend,
  getAllBalances,
  changePassword,
  deactivateUserData
} = require('../controllers/userController');

// Get user profile
router.get('/profile', authenticateToken, getUserProfile);

// Update user profile
router.patch('/profile', authenticateToken, updateUserProfile);

// Change password
router.patch('/change-password', authenticateToken, changePassword);

// Search users
router.get('/', authenticateToken, searchUsers);

// Get friends
router.get('/friends', authenticateToken, getFriends);

// Add friend
router.post('/friends', authenticateToken, addFriend);

// Remove friend
router.delete('/friends/:friendId', authenticateToken, removeFriend);

// Get balance with friend
router.get('/friends/:friendId/balance', authenticateToken, getBalanceWithFriend);

// Get all balances
router.get('/balances', authenticateToken, getAllBalances);

// Delete all user data
router.delete('/deactivate-user', authenticateToken, deactivateUserData);

module.exports = router;