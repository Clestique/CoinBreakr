const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const healthRoutes = require('./health');

// Mount routes
router.use('/user', authRoutes);
router.use('/healthz', healthRoutes);

module.exports = router;