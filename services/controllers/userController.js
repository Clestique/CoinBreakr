const mongoose = require('mongoose');
const User = require('../models/User');
const PendingFriend = require('../models/PendingFriend');
const Expense = require('../models/Expense');

// Auth & User Profile
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { name, profileImage, phoneNumber } = req.body;
        if (!name && !profileImage && !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'At least one field is required'
            });
        }

        // Update the user profile
        name && await User.findByIdAndUpdate(req.userId, { name }, { new: true, updatedAt: new Date() });
        phoneNumber && await User.findByIdAndUpdate(req.userId, { phoneNumber }, { new: true, updatedAt: new Date() });
        profileImage && await User.findByIdAndUpdate(req.userId, { profileImage }, { new: true, updatedAt: new Date() });

        return res.status(200).json({
            success: true,
            message: 'User profile updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        // Get user with password
        const user = await User.findById(req.userId).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        user.updatedAt = new Date();
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const searchUsers = async (req, res) => {
    try {
        const { userId, page, limit } = req.query;
        if (!userId || userId.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search term must be at least 2 characters long'
            });
        }

        // Convert to numbers
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;

        // Escape special regex characters to prevent errors
        const escapedQuery = userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const users = await User.find({
            $and: [
                { _id: { $ne: req.userId } }, // Exclude current user
                {
                    $or: [
                        { name: { $regex: escapedQuery, $options: 'i' } },
                        { email: { $regex: escapedQuery, $options: 'i' } }
                    ]
                }
            ]
        }).select('name email profileImage').limit(limitNum).skip((pageNum - 1) * limitNum);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: users,
            pagination: {
                current: pageNum,
                limit: limitNum,
                total: users.length
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

// Friends
const getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .populate('friends', 'name email phoneNumber profileImage')
            .populate('pendingFriends', 'name email phoneNumber')
            .select('friends pendingFriends');

        res.json({
            success: true,
            data: {
                friends: user.friends,
                pendingFriends: user.pendingFriends
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

const addFriend = async (req, res) => {
    try {
        const { friends } = req.body;

        if (!friends || !Array.isArray(friends) || friends.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Friends array is required and cannot be empty'
            });
        }

        // Validate friend objects
        for (const friend of friends) {
            if (!friend.name || (!friend.email && !friend.phoneNumber)) {
                return res.status(400).json({
                    success: false,
                    message: 'Each friend must have a name and either email or phone number'
                });
            }
        }

        // Get current user
        const user = await User.findById(req.userId);
        const results = [];
        const friendsToAdd = [];
        const pendingFriendsToAdd = [];

        for (const friendData of friends) {
            const { name, email, phoneNumber } = friendData;

            // Check if user exists in the database by email or phone
            let existingUser = null;
            if (email) {
                existingUser = await User.findOne({ email: email.toLowerCase() });
            }
            if (!existingUser && phoneNumber) {
                existingUser = await User.findOne({ phoneNumber });
            }

            if (existingUser) {
                // User exists in database
                if (existingUser._id.toString() === req.userId.toString()) {
                    results.push({
                        name,
                        email: email || '',
                        phoneNumber: phoneNumber || '',
                        success: false,
                        message: 'Cannot add yourself as a friend'
                    });
                    continue;
                }

                // Check if already friends
                if (user.friends.includes(existingUser._id)) {
                    results.push({
                        name,
                        email: email || '',
                        phoneNumber: phoneNumber || '',
                        success: false,
                        message: 'User is already your friend'
                    });
                    continue;
                }

                friendsToAdd.push(existingUser._id);
                results.push({
                    name,
                    email: email || '',
                    phoneNumber: phoneNumber || '',
                    success: true,
                    message: 'Friend added successfully',
                    type: 'existing_user'
                });
            } else {
                // User doesn't exist, check if already in pending friends
                let existingPending = null;
                if (email) {
                    existingPending = await PendingFriend.findOne({ 
                        addedBy: req.userId, 
                        email: email.toLowerCase() 
                    });
                }
                if (!existingPending && phoneNumber) {
                    existingPending = await PendingFriend.findOne({ 
                        addedBy: req.userId, 
                        phoneNumber 
                    });
                }

                if (existingPending) {
                    results.push({
                        name,
                        email: email || '',
                        phoneNumber: phoneNumber || '',
                        success: false,
                        message: 'Friend is already in your pending list'
                    });
                    continue;
                }

                // Create pending friend
                const pendingFriend = new PendingFriend({
                    name,
                    email: email || undefined,
                    phoneNumber: phoneNumber || undefined,
                    addedBy: req.userId
                });

                const savedPendingFriend = await pendingFriend.save();
                pendingFriendsToAdd.push(savedPendingFriend._id);

                results.push({
                    name,
                    email: email || '',
                    phoneNumber: phoneNumber || '',
                    success: true,
                    message: 'Friend added to pending list',
                    type: 'pending_friend'
                });
            }
        }

        // Add existing users as friends
        if (friendsToAdd.length > 0) {
            await User.findByIdAndUpdate(req.userId, {
                $addToSet: { friends: { $each: friendsToAdd } }
            });

            // Add current user to each friend's friend list
            for (const friendId of friendsToAdd) {
                await User.findByIdAndUpdate(friendId, {
                    $addToSet: { friends: req.userId }
                });
            }
        }

        // Add pending friends to user's pending list
        if (pendingFriendsToAdd.length > 0) {
            await User.findByIdAndUpdate(req.userId, {
                $addToSet: { pendingFriends: { $each: pendingFriendsToAdd } }
            });
        }

        res.status(200).json({
            success: true,
            message: `${friendsToAdd.length} friend(s) added, ${pendingFriendsToAdd.length} pending friend(s) created`,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const { type } = req.query; // 'friend' or 'pending'

        // Validate ObjectId format
        try {
            new mongoose.Types.ObjectId(friendId);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid friendId format'
            });
        }

        if (type === 'pending') {
            // Remove pending friend
            const pendingFriend = await PendingFriend.findById(friendId);
            if (!pendingFriend || pendingFriend.addedBy.toString() !== req.userId.toString()) {
                return res.status(404).json({
                    success: false,
                    message: 'Pending friend not found'
                });
            }

            // Remove from user's pending friends list
            await User.findByIdAndUpdate(req.userId, {
                $pull: { pendingFriends: friendId }
            });

            // Delete the pending friend record
            await PendingFriend.findByIdAndDelete(friendId);

            res.status(200).json({
                success: true,
                message: 'Pending friend removed successfully'
            });
        } else {
            // Remove regular friend
            if (friendId.toString() === req.userId.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot remove yourself as a friend'
                });
            }

            // Remove friend from both users
            await User.findByIdAndUpdate(req.userId, {
                $pull: { friends: friendId }
            });

            await User.findByIdAndUpdate(friendId, {
                $pull: { friends: req.userId }
            });

            res.status(200).json({
                success: true,
                message: 'Friend removed successfully'
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

// Balances
const getBalanceWithFriend = async (req, res) => {
    try {
        const { friendId } = req.params;

        // Check if users are friends
        const user = await User.findById(req.userId);
        if (!user.friends.includes(friendId)) {
            return res.status(400).json({
                success: false,
                message: 'User is not your friend'
            });
        }

        const balance = await Expense.getBalanceWithUser(req.userId, friendId);
        const friend = await User.findById(friendId).select('name profileImage');

        res.status(200).json({
            success: true,
            data: {
                friend,
                balance,
                message: balance > 0
                    ? `You are owed $${balance.toFixed(2)}`
                    : balance < 0
                        ? `You owe $${Math.abs(balance).toFixed(2)}`
                        : 'You are settled up'
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

const getAllBalances = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('friends', 'name profileImage');
        const balances = [];

        for (const friend of user.friends) {
            const balance = await Expense.getBalanceWithUser(req.userId, friend._id);
            if (balance !== 0) {
                balances.push({
                    friend,
                    balance,
                    message: balance > 0
                        ? `You are owed $${balance.toFixed(2)}`
                        : `You owe $${Math.abs(balance).toFixed(2)}`
                });
            }
        }

        res.status(200).json({
            success: true,
            data: balances
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Helper function to convert pending friends to regular friends when user joins
const convertPendingFriends = async (newUser) => {
    try {
        // Find all pending friends that match this user's email or phone
        const matchingPendingFriends = await PendingFriend.find({
            $or: [
                { email: newUser.email },
                { phoneNumber: newUser.phoneNumber }
            ]
        }).populate('addedBy');

        for (const pendingFriend of matchingPendingFriends) {
            const addedByUser = pendingFriend.addedBy;

            // Add mutual friendship
            await User.findByIdAndUpdate(addedByUser._id, {
                $addToSet: { friends: newUser._id },
                $pull: { pendingFriends: pendingFriend._id }
            });

            await User.findByIdAndUpdate(newUser._id, {
                $addToSet: { friends: addedByUser._id }
            });

            // Delete the pending friend record
            await PendingFriend.findByIdAndDelete(pendingFriend._id);
        }

        return matchingPendingFriends.length;
    } catch (error) {
        console.error('Error converting pending friends:', error);
        return 0;
    }
};

module.exports = {
    getUserProfile,
    searchUsers,
    addFriend,
    removeFriend,
    getFriends,
    getBalanceWithFriend,
    getAllBalances,
    updateUserProfile,
    changePassword,
    convertPendingFriends
};