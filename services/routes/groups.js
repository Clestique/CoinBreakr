const express = require('express');
const { body } = require('express-validator');
const {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  leaveGroup
} = require('../controllers/groupController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createGroupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ max: 100 })
    .withMessage('Group name cannot be more than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters')
];

const updateGroupValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Group name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Group name cannot be more than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters')
];

const addMemberValidation = [
  body('memberEmail')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['member', 'admin'])
    .withMessage('Role must be either member or admin')
];

// Create a new group
router.post('/', authenticateToken, createGroupValidation, createGroup);

// Get all groups for the authenticated user
router.get('/', authenticateToken, getGroups);

// Get a specific group
router.get('/:id', authenticateToken, getGroup);

// Update a group
router.put('/:id', authenticateToken, updateGroupValidation, updateGroup);

// Delete a group (only creator can delete)
router.delete('/:id', authenticateToken, deleteGroup);

// Add a member to the group
router.post('/:id/members', authenticateToken, addMemberValidation, addMember);

// Remove a member from the group
router.patch('/:id/members/:memberId', authenticateToken, removeMember);

// Leave the group (user removes themselves)
router.post('/:id/leave', authenticateToken, leaveGroup);

module.exports = router;