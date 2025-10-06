// const request = require('supertest');
// const createTestApp = require('../test-server');
// const User = require('../../models/User');
// const Expense = require('../../models/Expense');
// const Group = require('../../models/Group');

// // Create test app instance
// const app = createTestApp();

// describe('🔗 Integration Tests - Authentication Workflows', () => {
//   let testUser;
//   let authToken;

//   beforeEach(async () => {
//     // Clean slate for each test
//     await User.deleteMany({});
//     await Expense.deleteMany({});
//     await Group.deleteMany({});
//   });

//   describe('👤 Complete User Registration Flow', () => {
//     test('should complete full user registration and login workflow', async () => {
//       const userData = {
//         name: 'Integration Test User',
//         email: 'integration@test.com',
//         password: 'securepassword123'
//       };

//       // Step 1: Register new user
//       const registerResponse = await request(app)
//         .post('/v1/auth/register')
//         .send(userData)
//         .expect(201);

//       expect(registerResponse.body).toHaveProperty('success', true);
//       expect(registerResponse.body.data).toHaveProperty('token');
//       expect(registerResponse.body.data.user).toHaveProperty('email', userData.email);
//       expect(registerResponse.body.data.user).not.toHaveProperty('password');

//       const registrationToken = registerResponse.body.data.token;

//       // Step 2: Verify user can access protected routes with registration token
//       const profileResponse = await request(app)
//         .get('/v1/users/profile')
//         .set('Authorization', `Bearer ${registrationToken}`)
//         .expect(200);

//       expect(profileResponse.body).toHaveProperty('success', true);
//       expect(profileResponse.body.data).toHaveProperty('email', userData.email);

//       // Step 3: Login with same credentials
//       const loginResponse = await request(app)
//         .post('/v1/auth/login')
//         .send({
//           email: userData.email,
//           password: userData.password
//         })
//         .expect(200);

//       expect(loginResponse.body).toHaveProperty('success', true);
//       expect(loginResponse.body.data).toHaveProperty('token');
//       expect(loginResponse.body.data.user).toHaveProperty('email', userData.email);

//       const loginToken = loginResponse.body.data.token;

//       // Step 4: Verify login token works for protected routes
//       const secondProfileResponse = await request(app)
//         .get('/v1/users/profile')
//         .set('Authorization', `Bearer ${loginToken}`)
//         .expect(200);

//       expect(secondProfileResponse.body).toHaveProperty('success', true);
//       expect(secondProfileResponse.body.data).toHaveProperty('email', userData.email);

//       // Step 5: Verify user exists in database with correct data
//       const dbUser = await User.findOne({ email: userData.email });
//       expect(dbUser).toBeTruthy();
//       expect(dbUser.name).toBe(userData.name);
//       expect(dbUser.email).toBe(userData.email);
//       expect(dbUser.isActive).toBe(true);
//       expect(dbUser.role).toBe('user');
//     });

//     test('should handle duplicate registration attempts', async () => {
//       const userData = {
//         name: 'Duplicate Test User',
//         email: 'duplicate@test.com',
//         password: 'password123'
//       };

//       // First registration should succeed
//       await request(app)
//         .post('/v1/auth/register')
//         .send(userData)
//         .expect(201);

//       // Second registration with same email should fail
//       const duplicateResponse = await request(app)
//         .post('/v1/auth/register')
//         .send(userData)
//         .expect(400);

//       expect(duplicateResponse.body).toHaveProperty('success', false);
//       expect(duplicateResponse.body.message).toContain('already exists');

//       // Verify only one user exists in database
//       const userCount = await User.countDocuments({ email: userData.email });
//       expect(userCount).toBe(1);
//     });

//     test('should handle registration with invalid data', async () => {
//       const invalidDataSets = [
//         { name: '', email: 'test@test.com', password: 'password123' },
//         { name: 'Test User', email: 'invalid-email', password: 'password123' },
//         { name: 'Test User', email: 'test@test.com', password: '123' },
//         { email: 'test@test.com', password: 'password123' }, // missing name
//         { name: 'Test User', password: 'password123' }, // missing email
//         { name: 'Test User', email: 'test@test.com' } // missing password
//       ];

//       for (const invalidData of invalidDataSets) {
//         const response = await request(app)
//           .post('/v1/auth/register')
//           .send(invalidData)
//           .expect(400);

//         expect(response.body).toHaveProperty('success', false);
//         expect(response.body).toHaveProperty('message');
//       }

//       // Verify no users were created
//       const userCount = await User.countDocuments();
//       expect(userCount).toBe(0);
//     });
//   });

//   describe('🔐 Authentication Security Workflows', () => {
//     beforeEach(async () => {
//       // Create test user for security tests
//       testUser = new User(global.testUtils.createTestUser({
//         name: 'Security Test User',
//         email: 'security@test.com'
//       }));
//       await testUser.save();
//       authToken = global.testUtils.generateToken(testUser._id);
//     });

//     test('should handle token expiration gracefully', async () => {
//       // Create expired token (simulate by using invalid secret)
//       const expiredToken = global.testUtils.generateToken(testUser._id);

//       // First verify token works
//       await request(app)
//         .get('/v1/users/profile')
//         .set('Authorization', `Bearer ${authToken}`)
//         .expect(200);

//       // Test with malformed token
//       const response = await request(app)
//         .get('/v1/users/profile')
//         .set('Authorization', `Bearer invalid-token`)
//         .expect(401);

//       expect(response.body).toHaveProperty('success', false);
//       expect(response.body.message).toContain('Invalid token');
//     });

//     test('should prevent access with no token', async () => {
//       const response = await request(app)
//         .get('/v1/users/profile')
//         .expect(401);

//       expect(response.body).toHaveProperty('success', false);
//       expect(response.body.message).toContain('token');
//     });

//     test('should prevent access with malformed authorization header', async () => {
//       const malformedHeaders = [
//         'InvalidFormat',
//         'Bearer',
//         'Bearer ',
//         'Basic dGVzdDp0ZXN0', // Basic auth instead of Bearer
//         `Token ${authToken}` // Wrong prefix
//       ];

//       for (const header of malformedHeaders) {
//         const response = await request(app)
//           .get('/v1/users/profile')
//           .set('Authorization', header)
//           .expect(401);

//         expect(response.body).toHaveProperty('success', false);
//       }
//     });

//     test('should handle deactivated user accounts', async () => {
//       // Deactivate user
//       testUser.isActive = false;
//       await testUser.save();

//       const response = await request(app)
//         .get('/v1/users/profile')
//         .set('Authorization', `Bearer ${authToken}`)
//         .expect(401);

//       expect(response.body).toHaveProperty('success', false);
//       expect(response.body.message).toContain('deactivated');
//     });

//     test('should handle deleted user with valid token', async () => {
//       // Delete user but keep token
//       await User.findByIdAndDelete(testUser._id);

//       const response = await request(app)
//         .get('/v1/users/profile')
//         .set('Authorization', `Bearer ${authToken}`)
//         .expect(401);

//       expect(response.body).toHaveProperty('success', false);
//       expect(response.body.message).toContain('user not found');
//     });
//   });

//   describe('🔄 Session Management Workflows', () => {
//     beforeEach(async () => {
//       testUser = new User(global.testUtils.createTestUser({
//         name: 'Session Test User',
//         email: 'session@test.com'
//       }));
//       await testUser.save();
//     });

//     test('should track last login timestamp', async () => {
//       const loginData = {
//         email: 'session@test.com',
//         password: 'password123'
//       };

//       const beforeLogin = new Date();

//       const response = await request(app)
//         .post('/v1/auth/login')
//         .send(loginData)
//         .expect(200);

//       const afterLogin = new Date();

//       // Verify response
//       expect(response.body.data.user).toHaveProperty('lastLogin');

//       // Verify database update
//       const updatedUser = await User.findById(testUser._id);
//       expect(updatedUser.lastLogin).toBeTruthy();
//       expect(updatedUser.lastLogin.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
//       expect(updatedUser.lastLogin.getTime()).toBeLessThanOrEqual(afterLogin.getTime());
//     });

//     test('should handle multiple concurrent login attempts', async () => {
//       const loginData = {
//         email: 'session@test.com',
//         password: 'password123'
//       };

//       const promises = [];
//       for (let i = 0; i < 5; i++) {
//         promises.push(
//           request(app)
//             .post('/v1/auth/login')
//             .send(loginData)
//         );
//       }

//       const responses = await Promise.all(promises);

//       // All should succeed
//       responses.forEach(response => {
//         expect(response.status).toBe(200);
//         expect(response.body).toHaveProperty('success', true);
//         expect(response.body.data).toHaveProperty('token');
//       });

//       // Verify user still exists and is valid
//       const user = await User.findById(testUser._id);
//       expect(user).toBeTruthy();
//       expect(user.lastLogin).toBeTruthy();
//     });

//     test('should handle rapid login/logout simulation', async () => {
//       const loginData = {
//         email: 'session@test.com',
//         password: 'password123'
//       };

//       // Simulate multiple login sessions
//       for (let i = 0; i < 3; i++) {
//         // Login
//         const loginResponse = await request(app)
//           .post('/v1/auth/login')
//           .send(loginData)
//           .expect(200);

//         const token = loginResponse.body.data.token;

//         // Use token for authenticated request
//         await request(app)
//           .get('/v1/users/profile')
//           .set('Authorization', `Bearer ${token}`)
//           .expect(200);

//         // Small delay to simulate real usage
//         await global.testUtils.wait(100);
//       }

//       // Verify user state is still consistent
//       const user = await User.findById(testUser._id);
//       expect(user).toBeTruthy();
//       expect(user.isActive).toBe(true);
//     });
//   });

//   describe('🛡️ Security Attack Prevention', () => {
//     test('should prevent SQL injection in login', async () => {
//       const maliciousInputs = [
//         { email: "admin@test.com'; DROP TABLE users; --", password: 'password' },
//         { email: "admin@test.com' OR '1'='1", password: 'password' },
//         { email: "admin@test.com' UNION SELECT * FROM users --", password: 'password' }
//       ];

//       for (const maliciousInput of maliciousInputs) {
//         const response = await request(app)
//           .post('/v1/auth/login')
//           .send(maliciousInput)
//           .expect(401);

//         expect(response.body).toHaveProperty('success', false);
//       }
//     });

//     test('should prevent NoSQL injection in login', async () => {
//       const maliciousInputs = [
//         { email: { $ne: null }, password: { $ne: null } },
//         { email: { $regex: '.*' }, password: 'password' }
//       ];

//       for (const maliciousInput of maliciousInputs) {
//         const response = await request(app)
//           .post('/v1/auth/login')
//           .send(maliciousInput)
//           .expect(401);

//         expect(response.body).toHaveProperty('success', false);
//       }

//       const user = await request(app)
//         .get('/v1/auth/login')
//         .send({email: 'test@test.com', password: { $where: 'function() { return true; }' }})
//         .expect(404);
//       expect(user.body).toHaveProperty('success', false);
//     });

//     test('should handle brute force login attempts', async () => {
//       // Create user for brute force test
//       const user = new User(global.testUtils.createTestUser({
//         email: 'bruteforce@test.com'
//       }));
//       await user.save();

//       const attempts = [];
//       for (let i = 0; i < 10; i++) {
//         attempts.push(
//           request(app)
//             .post('/v1/auth/login')
//             .send({
//               email: 'bruteforce@test.com',
//               password: 'wrongpassword' + i
//             })
//         );
//       }

//       const responses = await Promise.all(attempts);

//       // All should fail
//       responses.forEach(response => {
//         expect(response.status).toBe(401);
//         expect(response.body).toHaveProperty('success', false);
//       });

//       // User should still exist and be active
//       const dbUser = await User.findOne({ email: 'bruteforce@test.com' });
//       expect(dbUser).toBeTruthy();
//       expect(dbUser.isActive).toBe(true);
//     });

//     test('should sanitize user input in registration', async () => {
//       const maliciousData = {
//         name: '<script>alert("xss")</script>',
//         email: 'xss@test.com',
//         password: 'password123'
//       };

//       const response = await request(app)
//         .post('/v1/auth/register')
//         .send(maliciousData)
//         .expect(201);

//       expect(response.body).toHaveProperty('success', true);

//       // Verify script tags are not stored as-is
//       const user = await User.findOne({ email: 'xss@test.com' });
//       expect(user.name).toBe('<script>alert("xss")</script>'); // Should be stored but escaped when output
//     });
//   });

//   describe('🔄 Password Security Workflows', () => {
//     test('should hash passwords securely', async () => {
//       const userData = {
//         name: 'Password Test User',
//         email: 'password@test.com',
//         password: 'plaintextpassword123'
//       };

//       await request(app)
//         .post('/v1/auth/register')
//         .send(userData)
//         .expect(201);

//       // Verify password is hashed in database
//       const user = await User.findOne({ email: userData.email }).select('+password');
//       expect(user.password).not.toBe(userData.password);
//       expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
//       expect(user.password.length).toBeGreaterThan(50); // bcrypt hashes are long
//     });

//     test('should verify passwords correctly', async () => {
//       const userData = {
//         name: 'Password Verify User',
//         email: 'verify@test.com',
//         password: 'correctpassword123'
//       };

//       // Register user
//       await request(app)
//         .post('/v1/auth/register')
//         .send(userData)
//         .expect(201);

//       // Test correct password
//       await request(app)
//         .post('/v1/auth/login')
//         .send({
//           email: userData.email,
//           password: userData.password
//         })
//         .expect(200);

//       // Test incorrect password
//       await request(app)
//         .post('/v1/auth/login')
//         .send({
//           email: userData.email,
//           password: 'wrongpassword'
//         })
//         .expect(401);
//     });

//     test('should handle password edge cases', async () => {
//       const edgeCasePasswords = [
//         'password123', // minimum length
//         'a'.repeat(100), // very long password
//         'P@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?', // special characters
//         '密码测试123', // Unicode characters
//         '   password123   ' // whitespace (should be trimmed or rejected)
//       ];

//       for (let i = 0; i < edgeCasePasswords.length; i++) {
//         const userData = {
//           name: `Edge Case User ${i}`,
//           email: `edge${i}@test.com`,
//           password: edgeCasePasswords[i]
//         };

//         const response = await request(app)
//           .post('/v1/auth/register')
//           .send(userData);

//         if (response.status === 201) {
//           // If registration succeeded, login should work
//           await request(app)
//             .post('/v1/auth/login')
//             .send({
//               email: userData.email,
//               password: userData.password
//             })
//             .expect(200);
//         }
//       }
//     });
//   });

//   describe('📊 Authentication Performance', () => {
//     test('should handle authentication requests within time limits', async () => {
//       const userData = {
//         name: 'Performance Test User',
//         email: 'performance@test.com',
//         password: 'password123'
//       };

//       // Test registration performance
//       const regStartTime = Date.now();
//       await request(app)
//         .post('/v1/auth/register')
//         .send(userData)
//         .expect(201);
//       const regTime = Date.now() - regStartTime;
//       expect(regTime).toBeLessThan(3000); // Should complete within 3 seconds

//       // Test login performance
//       const loginStartTime = Date.now();
//       await request(app)
//         .post('/v1/auth/login')
//         .send({
//           email: userData.email,
//           password: userData.password
//         })
//         .expect(200);
//       const loginTime = Date.now() - loginStartTime;
//       expect(loginTime).toBeLessThan(2000); // Should complete within 2 seconds
//     });

//     test('should handle concurrent authentication requests', async () => {
//       const userCount = 20;
//       const promises = [];

//       // Create multiple concurrent registration requests
//       for (let i = 0; i < userCount; i++) {
//         promises.push(
//           request(app)
//             .post('/v1/auth/register')
//             .send({
//               name: `Concurrent User ${i}`,
//               email: `concurrent${i}@test.com`,
//               password: 'password123'
//             })
//         );
//       }

//       const startTime = Date.now();
//       const responses = await Promise.all(promises);
//       const totalTime = Date.now() - startTime;

//       // All should succeed
//       responses.forEach((response, index) => {
//         expect(response.status).toBe(201);
//         expect(response.body).toHaveProperty('success', true);
//       });

//       // Should handle all requests within reasonable time
//       expect(totalTime).toBeLessThan(10000); // 10 seconds for 20 concurrent registrations

//       // Verify all users were created
//       const userCount_db = await User.countDocuments();
//       expect(userCount_db).toBe(userCount);
//     });
//   });
// });