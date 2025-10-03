const mongoose = require('mongoose');

// @desc    Health check endpoint
const healthCheck = async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get basic system info
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: dbStatus,
        name: mongoose.connection.name || 'unknown'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
      }
    };

    // If database is not connected, return 503
    if (dbStatus === 'disconnected') {
      return res.status(503).json({
        success: false,
        message: 'Service unavailable - database disconnected',
        data: healthData
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      data: healthData
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      data: {
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: error.message
      }
    });
  }
};

module.exports = {
  healthCheck
};