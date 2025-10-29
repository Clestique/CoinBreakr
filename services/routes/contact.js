const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    createContact
} = require('../controllers/contactController');

// Rate limiting for contact form submissions
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 contact submissions per windowMs
    message: {
        success: false,
        message: 'Too many contact submissions. Please wait 15 minutes before trying again.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in development
    skip: (req) => process.env.NODE_ENV !== 'production'
});

// Simple CORS headers middleware
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PATCH, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Public routes
router.post('/', contactLimiter, createContact);

module.exports = router;
