const express = require('express');
const Joi = require('joi');
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

// Validation schemas using Joi
const createGroupSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Group name is required',
    'string.min': 'Group name cannot be empty',
    'string.max': 'Group name cannot be more than 100 characters'
  }),
  description: Joi.string().trim().max(500).optional().messages({
    'string.max': 'Description cannot be more than 500 characters'
  }),
  members: Joi.array().items(Joi.string()).optional()
});

const updateGroupSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'Group name cannot be empty',
    'string.min': 'Group name cannot be empty',
    'string.max': 'Group name cannot be more than 100 characters'
  }),
  description: Joi.string().trim().max(500).optional().messages({
    'string.max': 'Description cannot be more than 500 characters'
  })
});

const addMemberSchema = Joi.object({
  memberEmail: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address'
  }),
  role: Joi.string().valid('member', 'admin').optional().default('member').messages({
    'any.only': 'Role must be either member or admin'
  })
});

// Middleware function to validate request body
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    req.body = value; // Use the validated and sanitized data
    next();
  };
};

// Create a new group
router.post('/', authenticateToken, validateBody(createGroupSchema), createGroup);

// Get all groups for the authenticated user
router.get('/', authenticateToken, getGroups);

// Get a specific group
router.get('/:id', authenticateToken, getGroup);

// Update a group
router.put('/:id', authenticateToken, validateBody(updateGroupSchema), updateGroup);

// Delete a group (only creator can delete)
router.delete('/:id', authenticateToken, deleteGroup);

// Add a member to the group
router.post('/:id/members', authenticateToken, validateBody(addMemberSchema), addMember);

// Remove a member from the group
router.delete('/:id/members/:memberId', authenticateToken, removeMember);

// Leave the group (user removes themselves)
router.delete('/:id/leave', authenticateToken, leaveGroup);

module.exports = router;