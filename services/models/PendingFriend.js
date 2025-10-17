const mongoose = require('mongoose');

const pendingFriendSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^[a-zA-Z0-9](?:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/,
      'Please provide a valid email'
    ]
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'AddedBy user ID is required']
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

// Ensure at least email or phoneNumber is provided
pendingFriendSchema.pre('save', function(next) {
  if (!this.email && !this.phoneNumber) {
    return next(new Error('Either email or phone number must be provided'));
  }
  this.updatedAt = Date.now();
  next();
});

// Create compound index to prevent duplicate pending friends for same user
pendingFriendSchema.index({ addedBy: 1, email: 1 }, { sparse: true });
pendingFriendSchema.index({ addedBy: 1, phoneNumber: 1 }, { sparse: true });

module.exports = mongoose.model('PendingFriend', pendingFriendSchema);