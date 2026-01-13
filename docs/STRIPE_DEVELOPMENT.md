# Stripe Development Mode

This document explains how to use Stripe functionality in development mode without requiring full verification.

## Overview

In development mode, the application bypasses Stripe verification requirements to allow freelancers to test withdrawal functionality without setting up real Stripe Connect accounts.

## Configuration

### Environment Variables

Set these environment variables to enable development mode:

```bash
# In server/.env or server/.env.development
NODE_ENV=development
MOCK_STRIPE_CONNECT=true
```

### What Gets Bypassed

When `MOCK_STRIPE_CONNECT=true` or `NODE_ENV=development`:

1. **Account Creation**: Creates mock Stripe Connect accounts instead of real ones
2. **Verification**: Skips all Stripe verification requirements
3. **Payouts**: Processes mock payouts without actual money transfer
4. **Account Status**: Returns mock "verified" status for all accounts

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
```

### 2. Create Mock Stripe Account (Freelancer)

```bash
# Login as a freelancer and create mock Stripe account
curl -X POST http://localhost:5000/api/v1/payments/connect/create \
  -H "Authorization: Bearer <freelancer_token>"
```

### 3. Create Test Transactions

```bash
# Create some released transactions for withdrawal testing
curl -X POST http://localhost:5000/api/v1/dev/setup-withdrawal-test \
  -H "Authorization: Bearer <freelancer_token>"
```

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