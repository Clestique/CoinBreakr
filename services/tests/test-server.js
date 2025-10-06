const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import modules
const routes = require('../routes');
const errorHandler = require('../middleware/errorHandler');

// Create test app instance
function createTestApp() {
  const app = express();

  // Basic middleware for testing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Enable CORS for testing
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // Request logging for tests (optional)
  if (process.env.TEST_VERBOSE === 'true') {
    app.use((req, res, next) => {
      console.log(`[TEST] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
      next();
    });
  }

  // Routes
  app.use('/v1', routes);

  // Test-specific health endpoint
  app.get('/test/health', (req, res) => {
    res.json({
      success: true,
      message: 'Test server is running',
      timestamp: new Date().toISOString(),
      environment: 'test',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      collections: Object.keys(mongoose.connection.collections)
    });
  });

  // Test utilities endpoint
  app.get('/test/utils/reset', async (req, res) => {
    try {
      // Clear all collections
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
      
      res.json({
        success: true,
        message: 'Test database reset successfully',
        clearedCollections: Object.keys(collections)
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to reset test database',
        error: error.message
      });
    }
  });

  // Test data seeding endpoint
  app.post('/test/utils/seed', async (req, res) => {
    try {
      const { users = 0, expenses = 0, groups = 0 } = req.body;
      const User = require('../models/User');
      const Expense = require('../models/Expense');
      const Group = require('../models/Group');

      const createdData = {
        users: [],
        expenses: [],
        groups: []
      };

      // Create test users
      for (let i = 0; i < users; i++) {
        const user = new User({
          name: `Test User ${i + 1}`,
          email: `testuser${i + 1}@example.com`,
          password: 'password123'
        });
        await user.save();
        createdData.users.push(user._id);
      }

      // Create test groups
      if (groups > 0 && createdData.users.length > 0) {
        for (let i = 0; i < groups; i++) {
          const group = new Group({
            name: `Test Group ${i + 1}`,
            description: `Test group ${i + 1} description`,
            createdBy: createdData.users[0],
            members: [
              { user: createdData.users[0], role: 'admin' },
              ...createdData.users.slice(1, Math.min(3, createdData.users.length))
                .map(userId => ({ user: userId, role: 'member' }))
            ]
          });
          await group.save();
          createdData.groups.push(group._id);
        }
      }

      // Create test expenses
      if (expenses > 0 && createdData.users.length >= 2) {
        for (let i = 0; i < expenses; i++) {
          const paidBy = createdData.users[i % createdData.users.length];
          const splitWith = createdData.users
            .filter(id => id.toString() !== paidBy.toString())
            .slice(0, Math.min(2, createdData.users.length - 1))
            .map(userId => ({ user: userId, amount: 25 + (i * 5) }));

          const expense = new Expense({
            description: `Test Expense ${i + 1}`,
            amount: 50 + (i * 10),
            paidBy,
            splitWith,
            category: ['food', 'transport', 'entertainment'][i % 3],
            group: createdData.groups.length > 0 ? createdData.groups[i % createdData.groups.length] : null
          });
          await expense.save();
          createdData.expenses.push(expense._id);
        }
      }

      res.json({
        success: true,
        message: 'Test data seeded successfully',
        data: {
          usersCreated: createdData.users.length,
          expensesCreated: createdData.expenses.length,
          groupsCreated: createdData.groups.length
        },
        ids: createdData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to seed test data',
        error: error.message
      });
    }
  });

  // Test database stats endpoint
  app.get('/test/utils/stats', async (req, res) => {
    try {
      const User = require('../models/User');
      const Expense = require('../models/Expense');
      const Group = require('../models/Group');

      const stats = {
        users: await User.countDocuments(),
        expenses: await Expense.countDocuments(),
        groups: await Group.countDocuments(),
        collections: Object.keys(mongoose.connection.collections),
        connectionState: mongoose.connection.readyState,
        databaseName: mongoose.connection.name
      };

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get database stats',
        error: error.message
      });
    }
  });

  // Handle 404 routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Test route ${req.originalUrl} not found`
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}

// Export for use in tests
module.exports = createTestApp;

// If run directly, start test server
if (require.main === module) {
  const app = createTestApp();
  const PORT = process.env.TEST_PORT || 3001;
  
  app.listen(PORT, () => {
    console.log(`
🧪 Test Server Running!
📍 Environment: test
🌐 Port: ${PORT}
🔗 Local: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/test/health
🔧 Reset: http://localhost:${PORT}/test/utils/reset
📊 Stats: http://localhost:${PORT}/test/utils/stats
    `);
  });
}