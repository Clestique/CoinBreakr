const faker = require('faker');

module.exports = {
  // Generate realistic test data
  generateUserData,
  generateExpenseData,
  generateGroupData,
  
  // Custom authentication flow
  authenticateUser,
  
  // Performance monitoring
  trackResponseTime,
  trackMemoryUsage,
  
  // Error handling
  handleAuthError,
  handleValidationError,
  
  // Data validation
  validateResponse,
  validateExpenseData,
  
  // Cleanup functions
  cleanupTestData
};

/**
 * Generate realistic user data for testing
 */
function generateUserData(context, events, done) {
  context.vars.userData = {
    name: faker.name.findName(),
    email: faker.internet.email().toLowerCase(),
    password: 'ArtilleryTest123!',
    phoneNumber: faker.phone.phoneNumber(),
    profileImage: faker.image.avatar()
  };
  
  // Store for later use
  context.vars.testEmail = context.vars.userData.email;
  context.vars.testPassword = context.vars.userData.password;
  
  return done();
}

/**
 * Generate realistic expense data
 */
function generateExpenseData(context, events, done) {
  const categories = ['food', 'transport', 'entertainment', 'shopping', 'utilities', 'travel'];
  const descriptions = [
    'Dinner at restaurant',
    'Uber ride',
    'Movie tickets',
    'Grocery shopping',
    'Coffee meeting',
    'Gas station',
    'Concert tickets',
    'Lunch with team',
    'Taxi to airport',
    'Online shopping'
  ];
  
  const amount = faker.random.number({ min: 10, max: 500 });
  const splitAmount = faker.random.number({ min: 5, max: amount / 2 });
  
  context.vars.expenseData = {
    description: faker.random.arrayElement(descriptions),
    amount: amount,
    category: faker.random.arrayElement(categories),
    splitWith: [
      {
        user: context.vars.userId || '507f1f77bcf86cd799439011', // Fallback ObjectId
        amount: splitAmount
      }
    ],
    date: faker.date.recent(30).toISOString() // Within last 30 days
  };
  
  return done();
}

/**
 * Generate group data
 */
function generateGroupData(context, events, done) {
  const groupNames = [
    'Weekend Trip',
    'Office Lunch',
    'Birthday Party',
    'Movie Night',
    'Study Group',
    'Vacation Planning',
    'Team Building',
    'Family Dinner'
  ];
  
  context.vars.groupData = {
    name: faker.random.arrayElement(groupNames) + ' ' + faker.random.number({ min: 1, max: 999 }),
    description: faker.lorem.sentence(),
    members: [] // Will be populated with actual user IDs
  };
  
  return done();
}

/**
 * Handle authentication flow
 */
function authenticateUser(context, events, done) {
  // Store authentication token for subsequent requests
  if (context.vars.authResponse && context.vars.authResponse.data) {
    context.vars.authToken = context.vars.authResponse.data.token;
    context.vars.userId = context.vars.authResponse.data.user.id;
    
    // Set default headers for authenticated requests
    context.vars.authHeaders = {
      'Authorization': `Bearer ${context.vars.authToken}`,
      'Content-Type': 'application/json'
    };
  }
  
  return done();
}

/**
 * Track response times for performance analysis
 */
function trackResponseTime(context, events, done) {
  const startTime = Date.now();
  
  // Store start time for this request
  context.vars.requestStartTime = startTime;
  
  // Add event listener for response
  events.on('response', function(response) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Log slow responses
    if (responseTime > 2000) {
      console.log(`Slow response detected: ${responseTime}ms for ${response.request.uri.path}`);
    }
    
    // Store response time for analysis
    context.vars.lastResponseTime = responseTime;
  });
  
  return done();
}

/**
 * Track memory usage during tests
 */
function trackMemoryUsage(context, events, done) {
  const memoryUsage = process.memoryUsage();
  
  context.vars.memoryStats = {
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
    external: Math.round(memoryUsage.external / 1024 / 1024), // MB
    timestamp: Date.now()
  };
  
  // Log memory warnings
  if (context.vars.memoryStats.heapUsed > 500) { // 500MB threshold
    console.log(`High memory usage detected: ${context.vars.memoryStats.heapUsed}MB`);
  }
  
  return done();
}

/**
 * Handle authentication errors
 */
function handleAuthError(context, events, done) {
  events.on('response', function(response) {
    if (response.statusCode === 401) {
      console.log('Authentication failed - token may be expired or invalid');
      
      // Clear invalid token
      delete context.vars.authToken;
      delete context.vars.authHeaders;
      
      // Mark for re-authentication
      context.vars.needsReauth = true;
    }
  });
  
  return done();
}

/**
 * Handle validation errors
 */
function handleValidationError(context, events, done) {
  events.on('response', function(response) {
    if (response.statusCode === 400) {
      try {
        const body = JSON.parse(response.body);
        if (body.message) {
          console.log(`Validation error: ${body.message}`);
        }
      } catch (e) {
        console.log('Validation error - unable to parse response body');
      }
    }
  });
  
  return done();
}

/**
 * Validate API responses
 */
function validateResponse(context, events, done) {
  events.on('response', function(response) {
    try {
      const body = JSON.parse(response.body);
      
      // Check for required fields in successful responses
      if (response.statusCode < 400) {
        if (!body.hasOwnProperty('success')) {
          console.log('Warning: Response missing "success" field');
        }
        
        if (body.success && !body.hasOwnProperty('data') && !body.hasOwnProperty('message')) {
          console.log('Warning: Successful response missing "data" or "message" field');
        }
      }
      
      // Store response for further validation
      context.vars.lastResponse = body;
      
    } catch (e) {
      if (response.statusCode < 400) {
        console.log('Warning: Response is not valid JSON');
      }
    }
  });
  
  return done();
}

/**
 * Validate expense-specific data
 */
function validateExpenseData(context, events, done) {
  if (context.vars.lastResponse && context.vars.lastResponse.data) {
    const expense = context.vars.lastResponse.data;
    
    // Validate expense structure
    const requiredFields = ['_id', 'description', 'amount', 'paidBy', 'splitWith'];
    for (const field of requiredFields) {
      if (!expense.hasOwnProperty(field)) {
        console.log(`Warning: Expense missing required field: ${field}`);
      }
    }
    
    // Validate amount is positive
    if (expense.amount && expense.amount <= 0) {
      console.log('Warning: Expense amount should be positive');
    }
    
    // Validate splitWith array
    if (expense.splitWith && Array.isArray(expense.splitWith)) {
      expense.splitWith.forEach((split, index) => {
        if (!split.user || !split.amount) {
          console.log(`Warning: Split ${index} missing user or amount`);
        }
        if (split.amount <= 0) {
          console.log(`Warning: Split ${index} amount should be positive`);
        }
      });
    }
  }
  
  return done();
}

/**
 * Cleanup test data (for development environment)
 */
function cleanupTestData(context, events, done) {
  // Only cleanup in development/test environments
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    // Store IDs for cleanup
    if (context.vars.lastResponse && context.vars.lastResponse.data) {
      const data = context.vars.lastResponse.data;
      
      if (data._id) {
        if (!context.vars.createdIds) {
          context.vars.createdIds = [];
        }
        context.vars.createdIds.push(data._id);
      }
    }
  }
  
  return done();
}

// Utility functions for Artillery scenarios
module.exports.utils = {
  /**
   * Generate random test data
   */
  randomTestData: function() {
    return {
      string: faker.lorem.word(),
      number: faker.random.number({ min: 1, max: 1000 }),
      email: faker.internet.email(),
      phone: faker.phone.phoneNumber(),
      date: faker.date.recent().toISOString(),
      boolean: faker.random.boolean(),
      uuid: faker.random.uuid()
    };
  },
  
  /**
   * Validate ObjectId format
   */
  isValidObjectId: function(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },
  
  /**
   * Generate realistic amounts for expenses
   */
  generateExpenseAmount: function() {
    const ranges = [
      { min: 5, max: 25, weight: 30 },    // Small expenses (coffee, snacks)
      { min: 25, max: 100, weight: 40 },  // Medium expenses (meals, transport)
      { min: 100, max: 500, weight: 25 }, // Large expenses (shopping, entertainment)
      { min: 500, max: 2000, weight: 5 }  // Very large expenses (travel, electronics)
    ];
    
    const totalWeight = ranges.reduce((sum, range) => sum + range.weight, 0);
    let random = faker.random.number({ min: 1, max: totalWeight });
    
    for (const range of ranges) {
      if (random <= range.weight) {
        return faker.random.number({ min: range.min, max: range.max });
      }
      random -= range.weight;
    }
    
    return faker.random.number({ min: 10, max: 100 }); // Fallback
  },
  
  /**
   * Generate realistic split amounts
   */
  generateSplitAmounts: function(totalAmount, userCount) {
    const splits = [];
    let remainingAmount = totalAmount;
    
    for (let i = 0; i < userCount - 1; i++) {
      const maxSplit = Math.floor(remainingAmount * 0.8); // Max 80% of remaining
      const minSplit = Math.max(1, Math.floor(totalAmount * 0.05)); // Min 5% of total
      const splitAmount = faker.random.number({ min: minSplit, max: maxSplit });
      
      splits.push(splitAmount);
      remainingAmount -= splitAmount;
    }
    
    // Last user gets remaining amount
    if (remainingAmount > 0) {
      splits.push(remainingAmount);
    }
    
    return splits;
  }
};
