# Stripe Test Mode (Option 4)

This document explains how to use Stripe functionality in test mode with auto-approved test data, providing real Stripe integration without requiring manual verification.

## Overview

In test mode, the application uses real Stripe APIs but with special test data that Stripe automatically approves. This provides:

- **Real Stripe Integration**: Uses actual Stripe Connect APIs and flows
- **Instant Approval**: Test data is automatically approved by Stripe
- **No Manual Verification**: No need to provide real SSN, bank details, or identity documents
- **Safe Testing**: No real money is involved, all transactions are simulated

## Configuration

### Environment Variables

The system automatically detects test mode when:

```bash
# In server/.env
NODE_ENV=development
STRIPE_SECRET_KEY=sk_test_... # Any test key (starts with sk_test_)

# Remove or comment out mock mode
# MOCK_STRIPE_CONNECT=false
```

### What Happens in Test Mode

When test mode is detected:

1. **Account Creation**: Creates real Stripe Express accounts with auto-approved test data
2. **Instant Verification**: Uses Stripe's test SSN (0000) and test bank account details
3. **Real API Responses**: Gets actual Stripe API responses and webhooks
4. **Test Payouts**: Processes real Stripe payouts (but no actual money moves)

## Test Data Used

The system automatically uses these Stripe-approved test values:

```javascript
// Auto-approved test data
{
  ssn_last_4: '0000',           // Test SSN that always approves
  phone: '+16505551234',        // Test phone number
  routing_number: '110000000',  // Test bank routing number
  account_number: '000123456789', // Test bank account number
  address: {
    line1: '123 Test Street',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94102',
    country: 'US'
  }
}
```

## API Endpoints

All standard Stripe endpoints work normally:

- `POST /api/v1/payments/stripe-connect/onboard` - Creates Stripe Express account with test data
- `GET /api/v1/payments/stripe-connect/status` - Returns real Stripe account status
- `POST /api/v1/payments/payout/request` - Processes real Stripe test payouts
- `GET /api/v1/payments/earnings` - Shows earnings from transactions

## Testing Workflow

### 1. Setup Test Mode

```bash
# Ensure test mode is enabled
echo "NODE_ENV=development" >> server/.env
# Ensure you're using test Stripe keys (sk_test_...)

# Start the server
cd server
npm run dev

# Start the client
cd client
npm run dev
```

### 2. Test Stripe Connect Flow

1. Navigate to `http://localhost:3000/dashboard/earnings` as a freelancer
2. Click "Set Up Payments" 
3. You'll be redirected to Stripe's real onboarding flow
4. The form will be pre-filled with test data that auto-approves
5. Complete the flow (usually just clicking "Continue" a few times)
6. Return to the earnings page - account should be verified and ready

### 3. Test Withdrawals

1. Create test transactions using the "Create Test Data" button
2. Check that earnings show up correctly
3. Click "Request Payout" to test withdrawal
4. Real Stripe payout will be created (but no money moves)

## Advantages Over Mock Mode

| Feature | Mock Mode | Test Mode |
|---------|-----------|-----------|
| Stripe Integration | Fake | Real |
| API Responses | Simulated | Actual Stripe |
| Webhooks | None | Real Stripe webhooks |
| Verification Flow | Skipped | Real but auto-approved |
| Payout Processing | Database only | Real Stripe payouts |
| Error Handling | Limited | Full Stripe errors |

## Production Deployment

When deploying to production:

1. Set `NODE_ENV=production`
2. Use live Stripe keys (`sk_live_...`)
3. Remove test data utilities
4. Users will need real verification

## Troubleshooting

### Account Not Auto-Approving

If the test account requires additional verification:
- Check that you're using test Stripe keys
- Verify `NODE_ENV=development`
- Check server logs for test data being applied

### Payouts Failing

- Ensure the Stripe account shows as verified in the dashboard
- Check that test bank account was added successfully
- Verify there are released transactions to withdraw

### Real Money Concerns

- Test mode never involves real money
- All transactions are simulated by Stripe
- Test bank accounts don't connect to real banks
- Payouts show as "paid" but no actual transfer occurs

## API Endpoints

### Standard Stripe Endpoints (Modified for Dev)

- `POST /api/v1/payments/connect/create` - Creates mock Stripe account
- `GET /api/v1/payments/connect/status` - Returns mock verified status
- `POST /api/v1/payments/payout/request` - Processes mock payout
- `GET /api/v1/payments/earnings` - Shows earnings from transactions

### Development-Only Endpoints

These endpoints are only available when `NODE_ENV=development` or `MOCK_STRIPE_CONNECT=true`:

#### Get Development Status
```http
GET /api/v1/dev/status
Authorization: Bearer <token>
```

Returns current user's development status including transactions and environment settings.

#### Create Mock Transaction
```http
POST /api/v1/dev/mock-transaction
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100,
  "status": "released"
}
```

Creates a single mock transaction for testing.

#### Create Multiple Mock Transactions
```http
POST /api/v1/dev/mock-transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "transactions": [
    { "amount": 100, "status": "released" },
    { "amount": 250, "status": "released" },
    { "amount": 75, "status": "held_in_escrow" }
  ]
}
```

#### Quick Test Setup
```http
POST /api/v1/dev/setup-withdrawal-test
Authorization: Bearer <token>
```

Creates a set of test transactions in various states for withdrawal testing.

#### Clean Up Mock Data
```http
DELETE /api/v1/dev/mock-transactions
Authorization: Bearer <token>
```

Removes all mock transactions created for testing.

## Testing Workflow

### 1. Setup Development Environment

```bash
# Ensure development mode is enabled
echo "NODE_ENV=development" >> server/.env
echo "MOCK_STRIPE_CONNECT=true" >> server/.env

# Start the server
cd server
npm run dev

# Start the client (in another terminal)
cd client
npm run dev
```

### 2. Access Earnings Page

1. Navigate to `http://localhost:3000`
2. Login as a freelancer user
3. Go to `http://localhost:3000/dashboard/earnings`
4. You should see the earnings dashboard

### 3. Create Test Data (Development Only)

The earnings page includes a "Create Test Data" button in development mode that will:
- Create sample transactions in different states
- Set up realistic earnings data for testing
- Allow you to test the withdrawal flow

Alternatively, use the API directly:

### 4. Check Earnings

```bash
# View available earnings
curl -X GET http://localhost:5000/api/v1/payments/earnings \
  -H "Authorization: Bearer <freelancer_token>"
```

### 5. Request Withdrawal

```bash
# Request payout of available funds
curl -X POST http://localhost:5000/api/v1/payments/payout/request \
  -H "Authorization: Bearer <freelancer_token>"
```

## Transaction States

- `pending` - Payment initiated but not confirmed
- `processing` - Payment being processed
- `held_in_escrow` - Payment held in escrow (not available for withdrawal)
- `released` - Payment released from escrow (available for withdrawal)
- `paid_out` - Payment withdrawn by freelancer
- `refunded` - Payment refunded to client
- `failed` - Payment failed
- `cancelled` - Payment cancelled

## Mock Data Structure

Mock transactions include:
- Realistic fee calculations (10% platform commission + 2.9% + $0.30 processing fee)
- Proper status tracking
- Metadata indicating they're mock transactions
- Automatic cleanup capabilities

## Security Notes

- Development endpoints are automatically disabled in production
- Mock transactions are clearly marked in metadata
- All development helpers include environment checks
- Real Stripe keys can still be used for testing real integrations

## Troubleshooting

### No Available Balance

If withdrawal fails with "No available balance":
1. Check if you have transactions with `released` status
2. Use `/api/v1/dev/status` to see transaction breakdown
3. Create test transactions with `/api/v1/dev/setup-withdrawal-test`

### Mock Mode Not Working

1. Verify environment variables are set correctly
2. Check server logs for "Using mock payout (development mode)"
3. Ensure you're using development environment file

### Cleanup After Testing

```bash
# Remove all mock transactions
curl -X DELETE http://localhost:5000/api/v1/dev/mock-transactions \
  -H "Authorization: Bearer <token>"
```

## Production Deployment

When deploying to production:
1. Set `NODE_ENV=production`
2. Remove or set `MOCK_STRIPE_CONNECT=false`
3. Ensure real Stripe keys are configured
4. Development endpoints will be automatically disabled