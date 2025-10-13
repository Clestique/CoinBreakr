const mongoose = require('mongoose');
const User = require('../models/User');
const Expense = require('../models/Expense');
const bcrypt = require('bcryptjs');

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
            .populate('friends', 'name email profileImage')
            .select('friends');

        res.json({
            success: true,
            data: user.friends
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
        const friendId = req.body.friendId;

        if (!friendId) {
            return res.status(400).json({
                success: false,
                message: 'Friend ID is required'
            });
        }

        if (friendId.toString() === req.userId.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot add yourself as a friend'
            });
        }

        // Check if friend exists
        let friend;
        try {
            friend = await User.findById(friendId);
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            throw error;
        }

        if (!friend) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already friends
        const user = await User.findById(req.userId);
        if (user.friends.includes(friendId)) {
            return res.status(400).json({
                success: false,
                message: 'User is already your friend'
            });
        }

        // Add friend to both users
        await User.findByIdAndUpdate(req.userId, {
            $addToSet: { friends: friendId }
        });

        await User.findByIdAndUpdate(friendId, {
            $addToSet: { friends: req.userId }
        });

        res.status(200).json({
            success: true,
            message: 'Friend added successfully'
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
        const friendId = req.params.friendId;

        // Validate ObjectId format
        try {
            new mongoose.Types.ObjectId(friendId);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid friendId format'
            });
        }

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

module.exports = {
    getUserProfile,
    searchUsers,
    addFriend,
    removeFriend,
    getFriends,
    getBalanceWithFriend,
    getAllBalances,
    updateUserProfile,
    changePassword
};