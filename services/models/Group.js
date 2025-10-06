const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a group name'],
    trim: true,
    maxlength: [100, 'Group name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters'],
    default: ''
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Group must have a creator']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
groupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before findOneAndUpdate
groupSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Virtual to get member count
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual to check if user is admin
groupSchema.virtual('admins').get(function() {
  return this.members.filter(member => member.role === 'admin');
});

// Instance method to check if user is member
groupSchema.methods.isMember = function(userId) {
  return this.members.some(member => {
    // Handle both populated and unpopulated user field
    const memberUserId = member.user._id || member.user;
    return memberUserId.toString() === userId.toString();
  });
};

// Instance method to check if user is admin
groupSchema.methods.isAdmin = function(userId) {
  const member = this.members.find(member => {
    // Handle both populated and unpopulated user field
    const memberUserId = member.user._id || member.user;
    return memberUserId.toString() === userId.toString();
  });
  return member && member.role === 'admin';
};

// Instance method to add member
groupSchema.methods.addMember = function(userId, role = 'member') {
  // Check if user is already a member
  if (this.isMember(userId)) {
    throw new Error('User is already a member of this group');
  }
  
  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date()
  });
};

// Instance method to remove member
groupSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(member => {
    // Handle both populated and unpopulated user field
    const memberUserId = member.user._id || member.user;
    return memberUserId.toString() === userId.toString();
  });
  if (memberIndex === -1) {
    throw new Error('User is not a member of this group');
  }
  
  this.members.splice(memberIndex, 1);
};

// Instance method to update member role
groupSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(member => {
    // Handle both populated and unpopulated user field
    const memberUserId = member.user._id || member.user;
    return memberUserId.toString() === userId.toString();
  });
  if (!member) {
    throw new Error('User is not a member of this group');
  }
  
  member.role = newRole;
};

// Static method to get groups for a user
groupSchema.statics.getGroupsForUser = function(userId) {
  return this.find({
    'members.user': userId,
    isActive: true
  }).populate('members.user', 'name email profileImage').populate('createdBy', 'name email');
};

// Static method to get group with populated members
groupSchema.statics.getGroupWithMembers = function(groupId) {
  return this.findById(groupId)
    .populate('members.user', 'name email profileImage')
    .populate('createdBy', 'name email');
};

module.exports = mongoose.model('Group', groupSchema);
