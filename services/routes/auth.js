const express = require('express');
const router = express.Router();
const { signup, login, getProfile, updateProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/signup', signup);
router.post('/', login);

// Protected routes
router.get('/', authenticateToken, getProfile);
router.patch('/', authenticateToken, updateProfile);

module.exports = router;