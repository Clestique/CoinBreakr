const mongoose = require('mongoose');
const User = require('../models/User');
const Expense = require('../models/Expense');
const bcrypt = require('bcryptjs');

// Auth & User Profile
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('name email profileImage phoneNumber').select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
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
        const { name, password, profileImage, phoneNumber } = req.body;
        if (!name && !password && !profileImage && !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'At least one field is required'
            });
        }

        // Update the user profile
        name && await User.findByIdAndUpdate(req.userId, { name }, { new: true });
        phoneNumber && await User.findByIdAndUpdate(req.userId, { phoneNumber }, { new: true });       
        profileImage && await User.findByIdAndUpdate(req.userId, { profileImage }, { new: true });
        // Update the user password
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            await User.findByIdAndUpdate(req.userId, { password: hashedPassword }, { new: true });
        }

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

const searchUsers = async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId || userId.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search term must be at least 2 characters long'
            });
        }

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
        }).select('name email profileImage').limit(20);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: users
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

        res.status(201).json({
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
    updateUserProfile,
    searchUsers,
    addFriend,
    removeFriend,
    getFriends,
    getBalanceWithFriend,
    getAllBalances
};