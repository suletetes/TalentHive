/**
 * Stripe Test Data Utilities
 * 
 * This file contains test data that Stripe automatically approves for testing.
 * Use these values in development/test mode to bypass verification requirements.
 * 
 * Reference: https://stripe.com/docs/connect/testing
 */

export const STRIPE_TEST_DATA = {
  // Test SSN that auto-approves
  SSN_LAST_4: '0000',
  
  // Test phone number
  PHONE: '+16505551234',
  
  // Test date of birth (must be 18+ years ago)
  DOB: {
    day: 1,
    month: 1,
    year: 1990,
  },
  
  // Test address
  ADDRESS: {
    line1: '123 Test Street',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94102',
    country: 'US',
  },
  
  // Test bank account details that auto-approve
  BANK_ACCOUNT: {
    routing_number: '110000000', // Test routing number
    account_number: '000123456789', // Test account number
    account_holder_type: 'individual' as const,
  },
  
  // Test business profile
  BUSINESS_PROFILE: {
    mcc: '5734', // Computer software stores
    product_description: 'Freelance services',
  },
  
  // Test individual data for different scenarios
  INDIVIDUALS: {
    // Standard test individual that auto-approves
    APPROVED: {
      first_name: 'Test',
      last_name: 'Freelancer',
      ssn_last_4: '0000',
      phone: '+16505551234',
      dob: {
        day: 1,
        month: 1,
        year: 1990,
      },
      address: {
        line1: '123 Test Street',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94102',
        country: 'US',
      },
    },
    
    // Test individual that requires additional verification (for testing edge cases)
    VERIFICATION_REQUIRED: {
      first_name: 'Verification',
      last_name: 'Required',
      ssn_last_4: '0001',
      phone: '+16505551235',
      dob: {
        day: 2,
        month: 2,
        year: 1991,
      },
      address: {
        line1: '456 Verification Street',
        city: 'Los Angeles',
        state: 'CA',
        postal_code: '90210',
        country: 'US',
      },
    },
  },
};

/**
 * Get test individual data based on user profile
 */
export const getTestIndividualData = (userProfile: any, userEmail: string) => {
  return {
    first_name: userProfile?.firstName || STRIPE_TEST_DATA.INDIVIDUALS.APPROVED.first_name,
    last_name: userProfile?.lastName || STRIPE_TEST_DATA.INDIVIDUALS.APPROVED.last_name,
    email: userEmail,
    phone: STRIPE_TEST_DATA.PHONE,
    ssn_last_4: STRIPE_TEST_DATA.SSN_LAST_4,
    dob: STRIPE_TEST_DATA.DOB,
    address: STRIPE_TEST_DATA.ADDRESS,
  };
};

/**
 * Check if we're in test mode
 */
export const isStripeTestMode = (): boolean => {
  return (
    process.env.NODE_ENV === 'development' || 
    process.env.STRIPE_SECRET_KEY?.includes('test') ||
    false
  );
};

/**
 * Get test bank account data
 */
export const getTestBankAccount = () => {
  return {
    object: 'bank_account' as const,
    country: 'US',
    currency: 'usd',
    ...STRIPE_TEST_DATA.BANK_ACCOUNT,
  };
};

/**
 * Test scenarios for different verification states
 */
export const TEST_SCENARIOS = {
  // Instant approval - use this for most testing
  INSTANT_APPROVAL: {
    description: 'Creates account that gets instantly approved',
    individual: STRIPE_TEST_DATA.INDIVIDUALS.APPROVED,
    expectedOutcome: 'charges_enabled: true, payouts_enabled: true',
  },
  
  // Requires verification - use this to test verification flows
  VERIFICATION_REQUIRED: {
    description: 'Creates account that requires additional verification',
    individual: STRIPE_TEST_DATA.INDIVIDUALS.VERIFICATION_REQUIRED,
    expectedOutcome: 'charges_enabled: false, requires additional documents',
  },
};

/**
 * Get a valid URL for Stripe business profile
 */
export const getValidBusinessUrl = (): string => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  
  // If empty or undefined, use default
  if (!clientUrl || clientUrl.trim() === '') {
    console.log('[URL_VALIDATION] CLIENT_URL is empty, using default');
    return 'http://localhost:3000';
  }
  
  const trimmedUrl = clientUrl.trim();
  
  // Check if URL already has protocol
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    console.log('[URL_VALIDATION] URL has protocol:', trimmedUrl);
    return trimmedUrl;
  }
  
  // Add http:// if missing (for development)
  const finalUrl = `http://${trimmedUrl}`;
  console.log('[URL_VALIDATION] Added protocol:', finalUrl);
  return finalUrl;
};

/**
 * Log test mode information
 */
export const logTestModeInfo = () => {
  if (isStripeTestMode()) {
    console.log('[STRIPE TEST MODE] Using Stripe test mode with auto-approved test data');
    console.log('[STRIPE TEST MODE] Test SSN last 4:', STRIPE_TEST_DATA.SSN_LAST_4);
    console.log('[STRIPE TEST MODE] Test routing number:', STRIPE_TEST_DATA.BANK_ACCOUNT.routing_number);
    console.log('[STRIPE TEST MODE] Test account number:', STRIPE_TEST_DATA.BANK_ACCOUNT.account_number);
    console.log('[STRIPE TEST MODE] Business URL:', getValidBusinessUrl());
    console.log('[STRIPE TEST MODE] CLIENT_URL env var:', process.env.CLIENT_URL);
  }
};