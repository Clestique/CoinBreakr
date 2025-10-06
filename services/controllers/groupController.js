const Group = require('../models/Group');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create a new group
const createGroup = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, members = [] } = req.body;
    const userId = req.user._id;

    // Create group with creator as admin
    const group = new Group({
      name,
      description: description || '',
      createdBy: userId,
      members: [{
        user: userId,
        role: 'admin',
        joinedAt: new Date()
      }]
    });

    // Add additional members if provided
    if (members && members.length > 0) {
      // Validate that all member IDs exist and are friends of the creator
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      for (const memberId of members) {
        // Check if the member ID is valid and is a friend of the creator
        if (user.friends.includes(memberId)) {
          // Check if member exists
          const memberUser = await User.findById(memberId);
          if (memberUser) {
            group.members.push({
              user: memberId,
              role: 'member',
              joinedAt: new Date()
            });
          }
        }
      }
    }

    await group.save();

    // Populate the group data
    await group.populate([
      { path: 'members.user', select: 'name email profileImage' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating group',
      error: error.message
    });
  }
};

// Get all groups for a user
const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.getGroupsForUser(userId);

    res.status(200).json({
      success: true,
      message: 'Groups retrieved successfully',
      data: groups
    });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving groups',
      error: error.message
    });
  }
};

// Get a specific group
const getGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;

    const group = await Group.getGroupWithMembers(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a member of the group
    if (!group.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this group'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Group retrieved successfully',
      data: group
    });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving group',
      error: error.message
    });
  }
};

// Update a group
const updateGroup = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const groupId = req.params.id;
    const userId = req.user._id;
    const { name, description } = req.body;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a member of the group
    if (!group.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this group'
      });
    }

    // Update group fields
    if (name !== undefined) group.name = name;
    if (description !== undefined) group.description = description;

    await group.save();

    // Populate the updated group data
    await group.populate([
      { path: 'members.user', select: 'name email profileImage' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Group updated successfully',
      data: group
    });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating group',
      error: error.message
    });
  }
};

// Delete a group
const deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Only the creator can delete the group
    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the group creator can delete the group'
      });
    }

    // Soft delete by setting isActive to false
    group.isActive = false;
    await group.save();

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting group',
      error: error.message
    });
  }
};

// Add member to group
const addMember = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const groupId = req.params.id;
    const userId = req.user._id;
    const { memberEmail, role = 'member' } = req.body;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a member of the group
    if (!group.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this group'
      });
    }

    // Find the user to add by email
    const userToAdd = await User.findOne({ email: memberEmail });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found with the provided email'
      });
    }

    // Check if user is already a member
    if (group.isMember(userToAdd._id)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this group'
      });
    }

    // Add the member
    group.addMember(userToAdd._id, role);
    await group.save();

    // Populate the updated group data
    await group.populate([
      { path: 'members.user', select: 'name email profileImage' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      data: group
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding member',
      error: error.message
    });
  }
};

// Remove member from group
const removeMember = async (req, res) => {
  try {
    const groupId = req.params.id;
    const memberId = req.params.memberId;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a member of the group
    if (!group.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this group'
      });
    }

    // Users can only remove themselves, or admins can remove others
    if (memberId !== userId && !group.isAdmin(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only remove yourself from the group'
      });
    }

    // Check if the member exists in the group
    if (!group.isMember(memberId)) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this group'
      });
    }

    // Remove the member
    group.removeMember(memberId);
    await group.save();

    // Populate the updated group data
    await group.populate([
      { path: 'members.user', select: 'name email profileImage' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      data: group
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing member',
      error: error.message
    });
  }
};

// Leave group (user removes themselves)
const leaveGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a member of the group
    if (!group.isMember(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Remove the user from the group
    group.removeMember(userId);
    await group.save();

    res.status(200).json({
      success: true,
      message: 'You have left the group successfully'
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while leaving group',
      error: error.message
    });
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  leaveGroup
};