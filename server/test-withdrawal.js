/**
 * Simple test script to verify Stripe development mode withdrawal functionality
 * Run with: node test-withdrawal.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

// Test configuration
const TEST_CONFIG = {
  // You'll need to replace this with a real JWT token for a freelancer user
  freelancerToken: 'YOUR_FREELANCER_JWT_TOKEN_HERE',
  baseURL: BASE_URL,
};

async function testWithdrawalFlow() {
  console.log(' Testing Stripe Development Mode Withdrawal Flow\n');

  try {
    const headers = {
      'Authorization': `Bearer ${TEST_CONFIG.freelancerToken}`,
      'Content-Type': 'application/json',
    };

    // 1. Check development status
    console.log(' Checking development status...');
    const statusResponse = await axios.get(`${BASE_URL}/dev/status`, { headers });
    console.log(' Status:', statusResponse.data.data.environment);
    console.log('   Transactions:', statusResponse.data.data.transactions);
    console.log();

    // 2. Create mock Stripe account
    console.log(' Creating mock Stripe Connect account...');
    try {
      const connectResponse = await axios.post(`${BASE_URL}/payments/connect/create`, {}, { headers });
      console.log(' Mock account created:', connectResponse.data.data.message || 'Success');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(' Account already exists or user already has one');
      } else {
        throw error;
      }
    }
    console.log();

    // 3. Check connect status
    console.log(' Checking Stripe Connect status...');
    const connectStatusResponse = await axios.get(`${BASE_URL}/payments/connect/status`, { headers });
    console.log(' Connect status:', connectStatusResponse.data.data);
    console.log();

    // 4. Setup test transactions
    console.log(' Setting up test transactions...');
    const setupResponse = await axios.post(`${BASE_URL}/dev/setup-withdrawal-test`, {}, { headers });
    console.log(' Test transactions created:', setupResponse.data.data.summary);
    console.log();

    // 5. Check earnings
    console.log(' Checking earnings...');
    const earningsResponse = await axios.get(`${BASE_URL}/payments/earnings`, { headers });
    console.log(' Earnings:', earningsResponse.data.data);
    console.log();

    // 6. Request withdrawal
    console.log(' Requesting withdrawal...');
    const payoutResponse = await axios.post(`${BASE_URL}/payments/payout/request`, {}, { headers });
    console.log(' Withdrawal successful:', payoutResponse.data.message);
    console.log('   Payout details:', {
      id: payoutResponse.data.data.payout.id,
      amount: `$${payoutResponse.data.data.payout.amount / 100}`,
      status: payoutResponse.data.data.payout.status,
    });
    console.log();

    // 7. Check earnings after withdrawal
    console.log(' Checking earnings after withdrawal...');
    const finalEarningsResponse = await axios.get(`${BASE_URL}/payments/earnings`, { headers });
    console.log(' Final earnings:', finalEarningsResponse.data.data);
    console.log();

    console.log(' All tests passed! Withdrawal flow working correctly in development mode.');

  } catch (error) {
    console.error(' Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n Make sure to replace YOUR_FREELANCER_JWT_TOKEN_HERE with a real JWT token');
      console.log('   You can get this by logging in as a freelancer user and copying the token from localStorage');
    }
  }
}

// Helper function to clean up test data
async function cleanupTestData() {
  console.log(' Cleaning up test data...');
  
  try {
    const headers = {
      'Authorization': `Bearer ${TEST_CONFIG.freelancerToken}`,
      'Content-Type': 'application/json',
    };

    const response = await axios.delete(`${BASE_URL}/dev/mock-transactions`, { headers });
    console.log(' Cleanup successful:', response.data.message);
  } catch (error) {
    console.error(' Cleanup failed:', error.response?.data || error.message);
  }
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'cleanup') {
    cleanupTestData();
  } else if (command === 'test') {
    testWithdrawalFlow();
  } else {
    console.log('Usage:');
    console.log('  node test-withdrawal.js test    - Run withdrawal flow test');
    console.log('  node test-withdrawal.js cleanup - Clean up test data');
    console.log('');
    console.log('Before running, update the freelancerToken in the script with a real JWT token.');
  }
}

module.exports = { testWithdrawalFlow, cleanupTestData };