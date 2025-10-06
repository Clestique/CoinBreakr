const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Test environment setup
let mongoServer;

// Global test utilities
global.testUtils = {
  // Generate JWT token for testing
  generateToken: (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h'
    });
  },

  // Create test user data
  createTestUser: (overrides = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    ...overrides
  }),

  // Create test expense data
  createTestExpense: (paidBy, splitWith = [], overrides = {}) => ({
    description: 'Test Expense',
    amount: 100,
    currency: 'USD',
    paidBy,
    splitWith: splitWith.map(user => ({
      user: user._id || user,
      amount: 50,
      settled: false
    })),
    category: 'food',
    date: new Date(),
    ...overrides
  }),

  // Create test group data
  createTestGroup: (createdBy, members = [], overrides = {}) => ({
    name: 'Test Group',
    description: 'Test group description',
    createdBy,
    members: [
      { user: createdBy, role: 'admin', joinedAt: new Date() },
      ...members.map(member => ({
        user: member._id || member,
        role: 'member',
        joinedAt: new Date()
      }))
    ],
    ...overrides
  }),

  // Wait for a specified time
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate random string
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  // Generate random email
  randomEmail: () => {
    return `test${Math.random().toString(36).substring(2, 15)}@example.com`;
  }
};

// Setup before all tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing';

  // Close existing connection if any
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create({
    instance: {
      port: 27017 + Math.floor(Math.random() * 1000), // Random port to avoid conflicts
      dbName: 'coinbreakr-test'
    }
  });

  const mongoUri = mongoServer.getUri();
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('🧪 Test database connected');
}, 60000);

// Cleanup after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  
  // Stop MongoDB Memory Server
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('🧪 Test database disconnected');
}, 60000);

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection in tests:', err);
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception in tests:', err);
});

// Increase timeout for all tests
jest.setTimeout(30000);

module.exports = {
  mongoServer
};