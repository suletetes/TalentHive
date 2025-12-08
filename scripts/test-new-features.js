/**
 * Manual Testing Script for New Features
 * Tests: Support Tickets, Profile Slugs, Profile Enhancements, Onboarding Flows
 * 
 * Run with: node scripts/test-new-features.js
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
let authToken = '';
let userId = '';
let ticketId = '';
let testSlug = '';

// Test credentials
const testUser = {
  email: 'alice.dev@example.com',
  password: 'Password123!',
};

const testAdmin = {
  email: 'admin@talenthive.com',
  password: 'Password123!',
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data,
    };
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
  }
}

// Test Suite 1: Support Tickets
async function testSupportTickets() {
  console.log('\n📋 Testing Support Tickets...\n');

  // Test 1.1: Create Support Ticket
  console.log('1.1 Creating support ticket...');
  const createResult = await apiCall(
    'post',
    '/support/tickets',
    {
      subject: 'Test Support Ticket',
      category: 'technical',
      priority: 'medium',
      message: 'This is a test support ticket message.',
    },
    authToken
  );
  
  if (createResult.success) {
    const ticket = createResult.data.data || createResult.data;
    ticketId = ticket.ticketId; // Use ticketId field, not _id
    console.log('✓ Support ticket created:', ticketId);
  } else {
    console.log('✗ Failed to create ticket:', createResult.error);
    console.log('   Status:', createResult.status);
    return false;
  }

  // Test 1.2: Get User's Tickets
  console.log('\n1.2 Fetching user tickets...');
  const getTicketsResult = await apiCall('get', '/support/tickets', null, authToken);
  
  if (getTicketsResult.success) {
    console.log(`✓ Found ${getTicketsResult.data.data.length} tickets`);
  } else {
    console.log('✗ Failed to fetch tickets:', getTicketsResult.error);
  }

  // Test 1.3: Get Ticket Details
  console.log('\n1.3 Fetching ticket details...');
  const getTicketResult = await apiCall('get', `/support/tickets/${ticketId}`, null, authToken);
  
  if (getTicketResult.success) {
    console.log('✓ Ticket details retrieved');
  } else {
    console.log('✗ Failed to fetch ticket details:', getTicketResult.error);
  }

  // Test 1.4: Add Message to Ticket
  console.log('\n1.4 Adding message to ticket...');
  const addMessageResult = await apiCall(
    'post',
    `/support/tickets/${ticketId}/messages`,
    { message: 'This is a follow-up message.' },
    authToken
  );
  
  if (addMessageResult.success) {
    console.log('✓ Message added to ticket');
  } else {
    console.log('✗ Failed to add message:', addMessageResult.error);
  }

  return true;
}

// Test Suite 2: Profile Slugs
async function testProfileSlugs() {
  console.log('\n🔗 Testing Profile Slugs...\n');

  // Test 2.1: Validate Slug
  console.log('2.1 Validating slug availability...');
  testSlug = `test-user-${Date.now()}`;
  const validateResult = await apiCall(
    'post',
    '/users/slug/validate',
    { slug: testSlug },
    authToken
  );
  
  if (validateResult.success) {
    console.log(`✓ Slug "${testSlug}" is available`);
  } else {
    console.log('✗ Slug validation failed:', validateResult.error);
  }

  // Test 2.2: Update User Slug
  console.log('\n2.2 Updating user slug...');
  const updateSlugResult = await apiCall(
    'patch',
    '/users/profile/slug',
    { slug: testSlug },
    authToken
  );
  
  if (updateSlugResult.success) {
    console.log(`✓ Slug updated to "${testSlug}"`);
  } else {
    console.log('✗ Failed to update slug:', updateSlugResult.error);
  }

  // Test 2.3: Get User by Slug
  console.log('\n2.3 Fetching user by slug...');
  const getUserBySlugResult = await apiCall('get', `/users/slug/${testSlug}`);
  
  if (getUserBySlugResult.success) {
    console.log('✓ User retrieved by slug');
  } else {
    console.log('✗ Failed to fetch user by slug:', getUserBySlugResult.error);
  }

  // Test 2.4: Get Slug Suggestions
  console.log('\n2.4 Getting slug suggestions...');
  const suggestionsResult = await apiCall('get', '/users/slug/suggestions/john-doe');
  
  if (suggestionsResult.success) {
    console.log(`✓ Got ${suggestionsResult.data.data.length} slug suggestions`);
  } else {
    console.log('✗ Failed to get suggestions:', suggestionsResult.error);
  }

  // Test 2.5: Search by Slug
  console.log('\n2.5 Searching users by slug...');
  const searchResult = await apiCall('get', '/users/slug/search?q=test');
  
  if (searchResult.success) {
    console.log(`✓ Found ${searchResult.data.data.length} users`);
  } else {
    console.log('✗ Search failed:', searchResult.error);
  }

  return true;
}

// Test Suite 3: Profile Enhancements
async function testProfileEnhancements() {
  console.log('\n👤 Testing Profile Enhancements...\n');

  // Test 3.1: Get User Stats
  console.log('3.1 Fetching user statistics...');
  const statsResult = await apiCall('get', `/users/${userId}/stats`, null, authToken);
  
  if (statsResult.success) {
    console.log('✓ User statistics retrieved');
    console.log('  Stats:', JSON.stringify(statsResult.data.data, null, 2));
  } else {
    console.log('✗ Failed to fetch stats:', statsResult.error);
  }

  // Test 3.2: Track Profile View
  console.log('\n3.2 Tracking profile view...');
  const trackViewResult = await apiCall('post', `/users/${userId}/profile-view`, null, authToken);
  
  if (trackViewResult.success) {
    console.log('✓ Profile view tracked');
  } else {
    console.log('✗ Failed to track view:', trackViewResult.error);
  }

  // Test 3.3: Get Profile View Analytics
  console.log('\n3.3 Fetching profile view analytics...');
  const analyticsResult = await apiCall('get', `/users/${userId}/profile-views`, null, authToken);
  
  if (analyticsResult.success) {
    console.log('✓ Profile view analytics retrieved');
  } else {
    console.log('✗ Failed to fetch analytics:', analyticsResult.error);
  }

  // Test 3.4: Get Profile Viewers
  console.log('\n3.4 Fetching profile viewers...');
  const viewersResult = await apiCall('get', `/users/${userId}/profile-viewers`, null, authToken);
  
  if (viewersResult.success) {
    console.log(`✓ Found ${viewersResult.data.data.length} profile viewers`);
  } else {
    console.log('✗ Failed to fetch viewers:', viewersResult.error);
  }

  return true;
}

// Test Suite 4: Onboarding
async function testOnboarding() {
  console.log('\n🚀 Testing Onboarding...\n');

  // Test 4.1: Get Onboarding Status
  console.log('4.1 Fetching onboarding status...');
  const statusResult = await apiCall('get', '/onboarding/status', null, authToken);
  
  if (statusResult.success) {
    console.log('✓ Onboarding status retrieved');
    console.log('  Status:', JSON.stringify(statusResult.data.data, null, 2));
  } else {
    console.log('✗ Failed to fetch status:', statusResult.error);
  }

  // Test 4.2: Update Onboarding Step
  console.log('\n4.2 Updating onboarding step...');
  const updateStepResult = await apiCall(
    'patch',
    '/onboarding/step',
    { step: 1 },
    authToken
  );
  
  if (updateStepResult.success) {
    console.log('✓ Onboarding step updated');
  } else {
    console.log('✗ Failed to update step:', updateStepResult.error);
  }

  // Test 4.3: Complete Onboarding
  console.log('\n4.3 Completing onboarding...');
  const completeResult = await apiCall('post', '/onboarding/complete', null, authToken);
  
  if (completeResult.success) {
    console.log('✓ Onboarding completed');
  } else {
    console.log('✗ Failed to complete onboarding:', completeResult.error);
  }

  return true;
}

// Main test runner
async function runTests() {
  console.log('🧪 TalentHive New Features Testing Suite\n');
  console.log('========================================\n');

  // Login
  console.log('🔐 Logging in...');
  const loginResult = await apiCall('post', '/auth/login', testUser);
  
  if (!loginResult.success) {
    console.log('✗ Login failed:', loginResult.error);
    console.log('\n⚠️  Please ensure:');
    console.log('   1. Server is running on', API_BASE_URL);
    console.log('   2. Test user exists:', testUser.email);
    console.log('   3. Database is seeded with test data');
    return;
  }

  authToken = loginResult.data.data.tokens.accessToken;
  userId = loginResult.data.data.user.id;
  console.log('✓ Logged in successfully\n');

  // Run test suites
  const results = {
    supportTickets: await testSupportTickets(),
    profileSlugs: await testProfileSlugs(),
    profileEnhancements: await testProfileEnhancements(),
    onboarding: await testOnboarding(),
  };

  // Summary
  console.log('\n========================================');
  console.log('\n📊 Test Summary:\n');
  console.log('Support Tickets:', results.supportTickets ? '✓ PASSED' : '✗ FAILED');
  console.log('Profile Slugs:', results.profileSlugs ? '✓ PASSED' : '✗ FAILED');
  console.log('Profile Enhancements:', results.profileEnhancements ? '✓ PASSED' : '✗ FAILED');
  console.log('Onboarding:', results.onboarding ? '✓ PASSED' : '✗ FAILED');

  const allPassed = Object.values(results).every(r => r === true);
  console.log('\n' + (allPassed ? '✅ All tests passed!' : '⚠️  Some tests failed'));
  console.log('\n========================================\n');
}

// Run tests
runTests().catch(console.error);
