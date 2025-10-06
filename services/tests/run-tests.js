#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test suite configurations
const testSuites = {
  smoke: {
    name: 'Smoke Tests',
    pattern: 'smoke',
    description: 'Basic functionality and health checks',
    color: colors.green
  },
  database: {
    name: 'Database Tests',
    pattern: 'database',
    description: 'Data integrity and consistency tests',
    color: colors.blue
  },
  integration: {
    name: 'Integration Tests',
    pattern: 'integration',
    description: 'End-to-end workflow testing',
    color: colors.cyan
  },
  'edge-cases': {
    name: 'Edge Case Tests',
    pattern: 'edge-cases',
    description: 'Security and validation edge cases',
    color: colors.yellow
  },
  performance: {
    name: 'Performance Tests',
    pattern: 'performance',
    description: 'Load and stress testing',
    color: colors.magenta
  },
  load: {
    name: 'Load Tests',
    pattern: 'load',
    description: 'System performance under load',
    color: colors.cyan
  },
  stress: {
    name: 'Stress Tests',
    pattern: 'stress',
    description: 'System breaking point analysis',
    color: colors.red
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const suiteToRun = args.find(arg => arg.startsWith('--')) ? args.find(arg => arg.startsWith('--')).substring(2) : null;

// Display banner
function displayBanner() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    CoinBreakr Test Suite                     ║');
  console.log('║                  Comprehensive API Testing                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);
}

// Display test suite information
function displayTestSuiteInfo(suite) {
  const config = testSuites[suite];
  if (!config) return;

  console.log(`${config.color}${colors.bright}`);
  console.log(`🧪 Running ${config.name}`);
  console.log(`📋 ${config.description}`);
  console.log(`${colors.reset}\n`);
}

// Display available test suites
function displayAvailableSuites() {
  console.log(`${colors.bright}Available Test Suites:${colors.reset}\n`);
  
  Object.entries(testSuites).forEach(([key, config]) => {
    console.log(`${config.color}${colors.bright}${key.padEnd(15)}${colors.reset} - ${config.description}`);
  });
  
  console.log(`\n${colors.bright}Usage:${colors.reset}`);
  console.log(`  node tests/run-tests.js                    # Run all tests`);
  console.log(`  node tests/run-tests.js --smoke           # Run smoke tests only`);
  console.log(`  node tests/run-tests.js --database        # Run database tests only`);
  console.log(`  node tests/run-tests.js --integration     # Run integration tests only`);
  console.log(`  node tests/run-tests.js --edge-cases      # Run edge case tests only`);
  console.log(`  node tests/run-tests.js --performance     # Run performance tests only`);
  console.log('');
}

// Run Jest with specific pattern
function runJest(pattern = null, suiteName = 'All Tests') {
  return new Promise((resolve, reject) => {
    const jestArgs = [
      '--verbose',
      '--colors',
      '--forceExit',
      '--detectOpenHandles',
      '--maxWorkers=1'
    ];

    if (pattern) {
      jestArgs.push('--testPathPattern', pattern);
    }

    console.log(`${colors.bright}Starting ${suiteName}...${colors.reset}\n`);
    
    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    jest.on('close', (code) => {
      if (code === 0) {
        console.log(`\n${colors.green}${colors.bright}✅ ${suiteName} completed successfully!${colors.reset}\n`);
        resolve(code);
      } else {
        console.log(`\n${colors.red}${colors.bright}❌ ${suiteName} failed with exit code ${code}${colors.reset}\n`);
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });

    jest.on('error', (error) => {
      console.error(`\n${colors.red}${colors.bright}❌ Error running ${suiteName}:${colors.reset}`, error);
      reject(error);
    });
  });
}

// Run specific test suite
async function runTestSuite(suite) {
  const config = testSuites[suite];
  if (!config) {
    console.error(`${colors.red}❌ Unknown test suite: ${suite}${colors.reset}`);
    displayAvailableSuites();
    process.exit(1);
  }

  displayTestSuiteInfo(suite);
  
  try {
    await runJest(config.pattern, config.name);
    console.log(`${colors.green}${colors.bright}🎉 ${config.name} completed successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}${colors.bright}💥 ${config.name} failed!${colors.reset}`);
    process.exit(1);
  }
}

// Run all test suites
async function runAllTests() {
  console.log(`${colors.bright}Running Complete Test Suite${colors.reset}\n`);
  
  const suitesToRun = ['smoke', 'database', 'integration', 'edge-cases', 'performance', 'load', 'stress'];
  let failedSuites = [];
  
  for (const suite of suitesToRun) {
    try {
      displayTestSuiteInfo(suite);
      await runJest(testSuites[suite].pattern, testSuites[suite].name);
    } catch (error) {
      failedSuites.push(suite);
      console.error(`${colors.red}${colors.bright}💥 ${testSuites[suite].name} failed!${colors.reset}\n`);
    }
  }
  
  // Display final results
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      Test Results Summary                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);
  
  if (failedSuites.length === 0) {
    console.log(`${colors.green}${colors.bright}🎉 All test suites passed successfully!${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}❌ ${failedSuites.length} test suite(s) failed:${colors.reset}`);
    failedSuites.forEach(suite => {
      console.log(`${colors.red}   • ${testSuites[suite].name}${colors.reset}`);
    });
    process.exit(1);
  }
}

// Display system information
function displaySystemInfo() {
  console.log(`${colors.bright}System Information:${colors.reset}`);
  console.log(`  Node.js: ${process.version}`);
  console.log(`  Platform: ${process.platform}`);
  console.log(`  Architecture: ${process.arch}`);
  console.log(`  Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB used`);
  console.log('');
}

// Main execution
async function main() {
  displayBanner();
  displaySystemInfo();
  
  if (args.includes('--help') || args.includes('-h')) {
    displayAvailableSuites();
    return;
  }
  
  try {
    if (suiteToRun && testSuites[suiteToRun]) {
      await runTestSuite(suiteToRun);
    } else if (suiteToRun) {
      console.error(`${colors.red}❌ Unknown test suite: ${suiteToRun}${colors.reset}\n`);
      displayAvailableSuites();
      process.exit(1);
    } else {
      await runAllTests();
    }
  } catch (error) {
    console.error(`${colors.red}${colors.bright}💥 Test execution failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}${colors.bright}⚠️  Test execution interrupted by user${colors.reset}`);
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log(`\n${colors.yellow}${colors.bright}⚠️  Test execution terminated${colors.reset}`);
  process.exit(143);
});

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}${colors.bright}💥 Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = {
  runJest,
  runTestSuite,
  runAllTests,
  testSuites
};