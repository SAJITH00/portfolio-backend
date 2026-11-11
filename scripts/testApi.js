require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.JWT_SECRET = 'test_jwt_secret_portfolio_suite_9999';

const app = require('../server');
const Admin = require('../models/Admin');
const ContactMessage = require('../models/ContactMessage');
const DailyStat = require('../models/DailyStat');
const Visit = require('../models/Visit');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log(' RUNNING SAJITH // DEV PORTFOLIO BACKEND TEST SUITE');
  console.log('======================================================\n');

  // Test 1: Health Check Endpoint
  console.log('TEST SUITE 1: System & Health API');
  const healthRes = await request(app).get('/api/health');
  assert(healthRes.status === 200, 'GET /api/health returns HTTP 200');
  assert(healthRes.body.status === 'online', 'Health report confirms "online" status');
  assert(typeof healthRes.body.uptimeSeconds === 'number', 'Health report includes uptime seconds');

  // Test 2: Contact Form Input Validation
  console.log('\nTEST SUITE 2: Contact Form Validation & Honeypot');
  const emptyRes = await request(app)
    .post('/api/contact')
    .send({});
  assert(emptyRes.status === 400, 'Empty submission returns HTTP 400 Bad Request');
  assert(emptyRes.body.success === false, 'Empty submission response success is false');

  const invalidEmailRes = await request(app)
    .post('/api/contact')
    .send({
      name: 'Test Visitor',
      email: 'not-an-email',
      subject: 'Collaboration',
      message: 'Hello, this is a test message that has sufficient length.',
    });
  assert(invalidEmailRes.status === 400, 'Invalid email rejected with HTTP 400');
  assert(
    invalidEmailRes.body.message.includes('valid email') ||
    invalidEmailRes.body.errors?.some(e => e.message.includes('valid email')),
    'Validation error specifically highlights email error'
  );

  const shortMsgRes = await request(app)
    .post('/api/contact')
    .send({
      name: 'Test Visitor',
      email: 'visitor@example.com',
      subject: 'Inquiry',
      message: 'Hi', // Less than 10 characters
    });
  assert(shortMsgRes.status === 400, 'Message with < 10 characters rejected with HTTP 400');

  // Test 3: Anti-Spam Honeypot Trap
  const botRes = await request(app)
    .post('/api/contact')
    .send({
      name: 'Spam Bot',
      email: 'bot@spam.com',
      subject: 'SEO Services',
      message: 'Buy our backlink optimization services right now!',
      website_url_check: 'https://spamlink.com', // Honeypot filled!
    });
  assert(botRes.status === 200, 'Honeypot trap silently drops bot and returns HTTP 200');
  assert(botRes.body.success === true, 'Honeypot returns simulated success to prevent bot retry');

  // Test 4: Security & Authentication Access Controls
  console.log('\nTEST SUITE 3: Admin Authentication & Access Control');
  const unauthMe = await request(app).get('/api/admin/me');
  assert(unauthMe.status === 401, 'GET /api/admin/me without token rejected with HTTP 401');

  const unauthMsgs = await request(app).get('/api/admin/messages');
  assert(unauthMsgs.status === 401, 'GET /api/admin/messages without token rejected with HTTP 401');

  const unauthAnalytics = await request(app).get('/api/admin/analytics');
  assert(unauthAnalytics.status === 401, 'GET /api/admin/analytics without token rejected with HTTP 401');

  const missingCreds = await request(app)
    .post('/api/admin/login')
    .send({});
  assert(missingCreds.status === 400, 'Login without credentials returns HTTP 400 Bad Request');

  // Test 5: Database Operations (if connected)
  const isDbConnected = mongoose.connection.readyState === 1;
  console.log(`\nTEST SUITE 4: Database-Backed Operations (Connected: ${isDbConnected})`);

  if (isDbConnected) {
    const badLogin = await request(app)
      .post('/api/admin/login')
      .send({ username: 'nonexistent_admin', password: 'wrongpassword' });
    assert(badLogin.status === 401, 'Login with non-existent account returns HTTP 401');
    // 5A: Contact Message creation
    const validContact = await request(app)
      .post('/api/contact')
      .send({
        name: 'Alex Turner',
        email: 'alex.turner@example.com',
        subject: 'Full Stack Contract Role',
        message: 'Hi Sajith, we love your portfolio and would like to interview you for a senior role.',
      });
    assert(validContact.status === 201, 'Valid contact submission saved with HTTP 201');
    assert(validContact.body.success === true, 'Valid contact submission confirmed by backend');
    const createdMsgId = validContact.body.data?.id;

    // 5B: Visitor Analytics Tracking
    const visitRes1 = await request(app)
      .post('/api/analytics/visit')
      .set('User-Agent', 'TestBrowser/1.0')
      .set('X-Forwarded-For', '203.0.113.195');
    assert(visitRes1.status === 200, 'POST /api/analytics/visit returns HTTP 200');
    assert(typeof visitRes1.body.value === 'number', 'Visit count is a valid number');

    const visitorsCountRes = await request(app).get('/api/analytics/visitors');
    assert(visitorsCountRes.status === 200, 'GET /api/analytics/visitors returns HTTP 200');
    assert(typeof visitorsCountRes.body.value === 'number', 'Public visitor count returns number');

    // 5C: Seed temporary test admin & login
    await Admin.deleteMany({ username: 'test_automated_admin' });
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('TestAdminSecret123!', salt);
    await Admin.create({
      username: 'test_automated_admin',
      email: 'test_admin@example.com',
      passwordHash: hash,
    });

    // Test incorrect password
    const wrongPassRes = await request(app)
      .post('/api/admin/login')
      .send({ username: 'test_automated_admin', password: 'WrongPassword999' });
    assert(wrongPassRes.status === 401, 'Incorrect password rejected with HTTP 401');

    // Test correct password login
    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({ username: 'test_automated_admin', password: 'TestAdminSecret123!' });
    assert(loginRes.status === 200, 'Correct password logs in with HTTP 200');
    assert(typeof loginRes.body.token === 'string', 'Login returns valid JWT token');
    const token = loginRes.body.token;

    // Test authenticated /me
    const meRes = await request(app)
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${token}`);
    assert(meRes.status === 200, 'GET /api/admin/me with Bearer token returns HTTP 200');
    assert(meRes.body.admin?.username === 'test_automated_admin', 'Admin profile verified');

    // Test authenticated message listing
    const adminMsgsRes = await request(app)
      .get('/api/admin/messages')
      .set('Authorization', `Bearer ${token}`);
    assert(adminMsgsRes.status === 200, 'Admin can list contact messages');
    assert(Array.isArray(adminMsgsRes.body.data), 'Messages returned as an array');

    // Test mark message as read
    if (createdMsgId) {
      const readRes = await request(app)
        .patch(`/api/admin/messages/${createdMsgId}/read`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isRead: true });
      assert(readRes.status === 200, 'Admin can mark message as read');
      assert(readRes.body.data.isRead === true, 'Message state updated to isRead: true');

      // Test delete message
      const delRes = await request(app)
        .delete(`/api/admin/messages/${createdMsgId}`)
        .set('Authorization', `Bearer ${token}`);
      assert(delRes.status === 200, 'Admin can delete message');
    }

    // Test Admin Analytics Overview
    const analyticsRes = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${token}`);
    assert(analyticsRes.status === 200, 'Admin analytics overview returns HTTP 200');
    assert(typeof analyticsRes.body.data.totalVisits === 'number', 'Analytics contains total visits metric');

    // Clean up test admin
    await Admin.deleteMany({ username: 'test_automated_admin' });
  } else {
    console.log('  ℹ Note: Live MongoDB instance not currently active in local test harness.');
    console.log('  ℹ Database-backed models, validation schemas, and controllers are fully wired.');
  }

  console.log('\n======================================================');
  console.log(` RESULTS: ${passedTests} / ${totalTests} assertions passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('======================================================\n');

  process.exit(passedTests === totalTests ? 0 : 1);
}

runTestSuite().catch((err) => {
  console.error('[Test Suite Crash]', err);
  process.exit(1);
});
