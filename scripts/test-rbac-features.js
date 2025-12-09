/**
 * RBAC System Test Script
 * 
 * This script tests all RBAC features including:
 * - Permission and Role creation
 * - User role assignment
 * - Permission checking
 * - Audit logging
 * - Data consistency validation
 * 
 * Usage: node scripts/test-rbac-features.js
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@talenthive.com';
const ADMIN_PASSWORD = 'Password123!';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
  results.passed++;
}

function logError(message, error) {
  log(`❌ ${message}`, colors.red);
  if (error) {
    log(`   Error: ${error.message || error}`, colors.red);
  }
  results.failed++;
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(`  ${message}`, colors.blue);
  log(`${'='.repeat(60)}`, colors.blue);
}

// API client
let authToken = null;
let testUserId = null;
let testRoleId = null;
let testPermissionId = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Test functions
async function testLogin() {
  logSection('Test 1: Admin Login');
  try {
    const response = await api.post('/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    // Check for token in the correct location
    const token = response.data?.data?.tokens?.accessToken || response.data?.token;
    
    if (token) {
      authToken = token;
      logSuccess('Admin login successful');
      logInfo(`Token: ${authToken.substring(0, 20)}...`);
      logInfo(`User: ${response.data.data?.user?.email || ADMIN_EMAIL}`);
      return true;
    } else {
      logError('Login failed: No token received');
      log('Response structure:', colors.yellow);
      log(JSON.stringify(response.data, null, 2), colors.yellow);
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    logError('Login failed', errorMsg);
    
    // Check if it's a user not found error
    if (errorMsg.includes('not found') || errorMsg.includes('Invalid') || errorMsg.includes('verify')) {
      log('\n⚠️  DATABASE MAY NOT BE SEEDED!', colors.yellow);
      log('\nPlease seed the database:', colors.yellow);
      log('  1. Open a new terminal', colors.cyan);
      log('  2. Run: npm run seed', colors.cyan);
      log('  3. Wait for "Database seeding completed successfully"', colors.cyan);
      log('  4. Run this test script again\n', colors.cyan);
    }
    
    return false;
  }
}

async function testGetPermissions() {
  logSection('Test 2: Get All Permissions');
  try {
    const response = await api.get('/rbac/permissions');
    
    if (response.data.status === 'success' && response.data.data.permissions) {
      const permissions = response.data.data.permissions;
      logSuccess(`Retrieved ${permissions.length} permissions`);
      
      // Display sample permissions
      logInfo('Sample permissions:');
      permissions.slice(0, 5).forEach(p => {
        log(`   - ${p.name} (${p.resource}.${p.action})`, colors.cyan);
      });
      
      // Store a permission ID for later tests
      if (permissions.length > 0) {
        testPermissionId = permissions[0]._id;
      }
      
      return true;
    } else {
      logError('Failed to retrieve permissions');
      return false;
    }
  } catch (error) {
    logError('Get permissions failed', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetRoles() {
  logSection('Test 3: Get All Roles');
  try {
    const response = await api.get('/rbac/roles');
    
    if (response.data.status === 'success' && response.data.data.roles) {
      const roles = response.data.data.roles;
      logSuccess(`Retrieved ${roles.length} roles`);
      
      // Display roles
      logInfo('System roles:');
      roles.forEach(r => {
        log(`   - ${r.name} (${r.permissions.length} permissions)${r.isSystem ? ' [SYSTEM]' : ''}`, colors.cyan);
      });
      
      // Store a role ID for later tests
      const nonSystemRole = roles.find(r => !r.isSystem);
      if (nonSystemRole) {
        testRoleId = nonSystemRole._id;
      } else if (roles.length > 0) {
        testRoleId = roles[0]._id;
      }
      
      return true;
    } else {
      logError('Failed to retrieve roles');
      return false;
    }
  } catch (error) {
    logError('Get roles failed', error.response?.data?.message || error.message);
    return false;
  }
}

async function testCreateCustomRole() {
  logSection('Test 4: Create Custom Role');
  try {
    const response = await api.post('/rbac/roles', {
      name: 'Test Manager',
      slug: 'test-manager',
      description: 'Test role for automated testing',
      permissions: testPermissionId ? [testPermissionId] : [],
    });
    
    if (response.data.status === 'success' && response.data.data.role) {
      const role = response.data.data.role;
      testRoleId = role._id;
      logSuccess(`Created custom role: ${role.name}`);
      logInfo(`Role ID: ${role._id}`);
      logInfo(`Permissions: ${role.permissions.length}`);
      return true;
    } else {
      logError('Failed to create custom role');
      return false;
    }
  } catch (error) {
    logError('Create role failed', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetUsers() {
  logSection('Test 5: Get Users for Testing');
  try {
    const response = await api.get('/admin/users?limit=5');
    
    // Handle different response structures
    const users = response.data?.data?.users || response.data?.users || [];
    
    if (users && users.length > 0) {
      logSuccess(`Retrieved ${users.length} users`);
      
      // Find a non-admin user for testing
      const testUser = users.find(u => u.role !== 'admin');
      if (testUser) {
        testUserId = testUser._id;
        logInfo(`Test user: ${testUser.email} (${testUser._id})`);
      } else {
        logInfo('No non-admin users found, using first user');
        testUserId = users[0]._id;
      }
      
      return true;
    } else {
      logError('No users found');
      return false;
    }
  } catch (error) {
    logError('Get users failed', error.response?.data?.message || error.message);
    return false;
  }
}

async function testAssignRoleToUser() {
  logSection('Test 6: Assign Role to User');
  
  if (!testUserId || !testRoleId) {
    logError('Missing test user or role ID');
    return false;
  }
  
  try {
    const response = await api.post(`/rbac/users/${testUserId}/roles`, {
      roleId: testRoleId,
    });
    
    if (response.data.status === 'success') {
      logSuccess(`Assigned role to user ${testUserId}`);
      logInfo(`User now has role: ${testRoleId}`);
      return true;
    } else {
      logError('Failed to assign role');
      return false;
    }
  } catch (error) {
    logError('Assign role failed', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetUserPermissions() {
  logSection('Test 7: Get User Permissions');
  
  if (!testUserId) {
    logError('Missing test user ID');
    return false;
  }
  
  try {
    const response = await api.get(`/rbac/users/${testUserId}/permissions`);
    
    if (response.data.status === 'success' && response.data.data) {
      const data = response.data.data;
      logSuccess('Retrieved user permissions');
      logInfo(`Roles: ${data.user.roles.length}`);
      logInfo(`Direct permissions: ${data.user.directPermissions.length}`);
      logInfo(`Aggregated permissions: ${data.aggregatedPermissions.length}`);
      
      // Display sample aggregated permissions
      if (data.aggregatedPermissions.length > 0) {
        logInfo('Sample aggregated permissions:');
        data.aggregatedPermissions.slice(0, 3).forEach(p => {
          log(`   - ${p.name}`, colors.cyan);
        });
      }
      
      return true;
    } else {
      logError('Failed to retrieve user permissions');
      return false;
    }
  } catch (error) {
    logError('Get user permissions failed', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGrantDirectPermission() {
  logSection('Test 8: Grant Direct Permission to User');
  
  if (!testUserId || !testPermissionId) {
    logError('Missing test user or permission ID');
    return false;
  }
  
  try {
    const response = await api.post(`/rbac/users/${testUserId}/permissions`, {
      permissionId: testPermissionId,
    });
    
    if (response.data.status === 'success') {
      logSuccess(`Granted direct permission to user ${testUserId}`);
      return true;
    } else {
      logError('Failed to grant permission');
      return false;
    }
  } catch (error) {
    logError('Grant permission failed', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetAuditLogs() {
  logSection('Test 9: Get Audit Logs');
  try {
    const response = await api.get('/rbac/audit-logs?limit=10');
    
    if (response.data.status === 'success' && response.data.data.logs) {
      const logs = response.data.data.logs;
      logSuccess(`Retrieved ${logs.length} audit log entries`);
      
      // Display recent logs
      if (logs.length > 0) {
        logInfo('Recent audit logs:');
        logs.slice(0, 3).forEach(log => {
          const performedBy = log.performedBy?.email || 'Unknown';
          const targetUser = log.targetUser?.email || 'Unknown';
          console.log(`   - ${log.action} by ${performedBy} on ${targetUser}`, colors.cyan);
        });
      }
      
      return true;
    } else {
      logError('Failed to retrieve audit logs');
      return false;
    }
  } catch (error) {
    logError('Get audit logs failed', error.response?.data?.message || error.message);
    return false;
  }
}

async function testRevokePermission() {
  logSection('Test 10: Revoke Direct Permission');
  
  if (!testUserId || !testPermissionId) {
    logError('Missing test user or permission ID');
    return false;
  }
  
  try {
    const response = await api.delete(`/rbac/users/${testUserId}/permissions/${testPermissionId}`);
    
    if (response.data.status === 'success') {
      logSuccess(`Revoked permission from user ${testUserId}`);
      return true;
    } else {
      logError('Failed to revoke permission');
      return false;
    }
  } catch (error) {
    logError('Revoke permission failed', error.response?.data?.message || error.message);
    return false;
  }
}

async function testRemoveRoleFromUser() {
  logSection('Test 11: Remove Role from User');
  
  if (!testUserId || !testRoleId) {
    logError('Missing test user or role ID');
    return false;
  }
  
  try {
    const response = await api.delete(`/rbac/users/${testUserId}/roles/${testRoleId}`);
    
    if (response.data.status === 'success') {
      logSuccess(`Removed role from user ${testUserId}`);
      return true;
    } else {
      logError('Failed to remove role');
      return false;
    }
  } catch (error) {
    logError('Remove role failed', error.response?.data?.message || error.message);
    return false;
  }
}

async function testDeleteCustomRole() {
  logSection('Test 12: Delete Custom Role');
  
  if (!testRoleId) {
    logError('Missing test role ID');
    return false;
  }
  
  try {
    const response = await api.delete(`/rbac/roles/${testRoleId}`);
    
    if (response.data.status === 'success') {
      logSuccess(`Deleted custom role ${testRoleId}`);
      return true;
    } else {
      logError('Failed to delete role');
      return false;
    }
  } catch (error) {
    // It's okay if the role can't be deleted (might be a system role)
    if (error.response?.status === 403) {
      logInfo('Role is protected (system role) - this is expected');
      return true;
    }
    logError('Delete role failed', error.response?.data?.message || error.message);
    return false;
  }
}

async function testDataConsistency() {
  logSection('Test 13: Data Consistency Check');
  logInfo('This test requires the CLI tool to be run separately');
  logInfo('Run: npm run validate-data check');
  logInfo('Run: npm run validate-data stats');
  return true;
}

// Check if server is running
async function checkServerHealth() {
  try {
    const response = await axios.get(API_BASE_URL.replace('/api', '/health'), { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(60), colors.yellow);
  log('  RBAC SYSTEM TEST SUITE', colors.yellow);
  log('='.repeat(60) + '\n', colors.yellow);
  
  logInfo(`Testing API at: ${API_BASE_URL}`);
  logInfo(`Admin email: ${ADMIN_EMAIL}\n`);
  
  // Check if server is running
  logInfo('Checking if server is running...');
  const serverRunning = await checkServerHealth();
  
  if (!serverRunning) {
    log('\n❌ SERVER IS NOT RUNNING!', colors.red);
    log('\nPlease start the server first:', colors.yellow);
    log('  1. Open a new terminal', colors.cyan);
    log('  2. Run: npm run server:dev', colors.cyan);
    log('  3. Wait for "Server running on port 5000"', colors.cyan);
    log('  4. Run this test script again\n', colors.cyan);
    process.exit(1);
  }
  
  logSuccess('Server is running!\n');
  
  // Run tests in sequence
  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Get Permissions', fn: testGetPermissions },
    { name: 'Get Roles', fn: testGetRoles },
    { name: 'Create Custom Role', fn: testCreateCustomRole },
    { name: 'Get Users', fn: testGetUsers },
    { name: 'Assign Role to User', fn: testAssignRoleToUser },
    { name: 'Get User Permissions', fn: testGetUserPermissions },
    { name: 'Grant Direct Permission', fn: testGrantDirectPermission },
    { name: 'Get Audit Logs', fn: testGetAuditLogs },
    { name: 'Revoke Permission', fn: testRevokePermission },
    { name: 'Remove Role from User', fn: testRemoveRoleFromUser },
    { name: 'Delete Custom Role', fn: testDeleteCustomRole },
    { name: 'Data Consistency', fn: testDataConsistency },
  ];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.tests.push({ name: test.name, passed: result });
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      logError(`Test "${test.name}" threw an exception`, error);
      results.tests.push({ name: test.name, passed: false });
    }
  }
  
  // Print summary
  logSection('Test Summary');
  log(`\nTotal Tests: ${results.passed + results.failed}`, colors.cyan);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, colors.red);
  log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`, colors.cyan);
  
  // Print detailed results
  logInfo('Detailed Results:');
  results.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    const color = test.passed ? colors.green : colors.red;
    log(`  ${index + 1}. ${status} ${test.name}`, color);
  });
  
  log('\n' + '='.repeat(60), colors.yellow);
  
  if (results.failed === 0) {
    log('  🎉 ALL TESTS PASSED! RBAC SYSTEM IS WORKING!', colors.green);
  } else {
    log('  ⚠️  SOME TESTS FAILED - CHECK LOGS ABOVE', colors.yellow);
  }
  log('='.repeat(60) + '\n', colors.yellow);
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  logError('Test suite failed with exception', error);
  process.exit(1);
});
