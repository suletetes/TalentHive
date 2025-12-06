# TalentHive Server

Node.js/Express backend API for the TalentHive freelancing platform.

## Technology Stack

- Node.js 18+ with TypeScript
- Express.js web framework
- MongoDB with Mongoose ODM
- Redis for caching
- JWT authentication
- Stripe for payments
- Cloudinary for file storage
- Socket.io for real-time features
- Winston for logging
- Jest for testing

## Prerequisites

- Node.js 18 or higher
- MongoDB 5.0 or higher
- Redis 6.0 or higher
- npm or yarn package manager

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

## Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://localhost:27017/talenthive
MONGODB_TEST_URI=mongodb://localhost:27017/talenthive_test

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=TalentHive <noreply@yourdomain.com>

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment (Stripe)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MOCK_STRIPE_CONNECT=true

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Socket.io
SOCKET_CORS_ORIGIN=http://localhost:3000
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage
npm run test:coverage

# Build TypeScript
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Seed database
npm run seed
```

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # MongoDB connection
│   │   ├── redis.ts     # Redis connection
│   │   ├── socket.ts    # Socket.io setup
│   │   ├── stripe.ts    # Stripe configuration
│   │   └── cloudinary.ts # Cloudinary setup
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # Authentication
│   │   ├── errorHandler.ts # Error handling
│   │   ├── rateLimiter.ts # Rate limiting
│   │   └── security.ts  # Security headers
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   │   ├── email.service.ts
│   │   ├── notification.service.ts
│   │   ├── payment.service.ts
│   │   └── socket.service.ts
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   │   ├── jwt.ts       # JWT utilities
│   │   ├── logger.ts    # Winston logger
│   │   └── validation.ts # Input validation
│   ├── scripts/         # Database scripts
│   │   └── seed.ts      # Seed data
│   ├── test/            # Test files
│   └── index.ts         # Application entry
├── logs/                # Log files
├── .env                 # Environment variables
├── .env.example         # Environment template
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── README.md            # This file
```

## API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### API Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `GET /auth/verify-email/:token` - Verify email

#### Users
- `GET /users/me` - Get current user
- `PUT /users/me` - Update current user
- `GET /users/:id` - Get user by ID
- `GET /users/freelancers` - List freelancers
- `POST /users/upload-avatar` - Upload avatar

#### Projects
- `GET /projects` - List projects
- `POST /projects` - Create project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

#### Proposals
- `GET /proposals` - List proposals
- `POST /proposals/:projectId` - Submit proposal
- `GET /proposals/:id` - Get proposal details
- `PUT /proposals/:id` - Update proposal
- `DELETE /proposals/:id` - Delete proposal
- `POST /proposals/:id/accept` - Accept proposal

#### Contracts
- `GET /contracts` - List contracts
- `GET /contracts/:id` - Get contract details
- `PUT /contracts/:id` - Update contract
- `POST /contracts/:id/milestones/:milestoneId/submit` - Submit milestone
- `POST /contracts/:id/milestones/:milestoneId/approve` - Approve milestone

#### Payments
- `POST /payments/create-intent` - Create payment intent
- `POST /payments/confirm` - Confirm payment
- `POST /payments/release` - Release escrow
- `GET /payments/history` - Payment history

#### Messages
- `GET /messages/conversations` - List conversations
- `POST /messages/conversations` - Create conversation
- `GET /messages/conversations/:id/messages` - Get messages
- `POST /messages/conversations/:id/messages` - Send message

#### Notifications
- `GET /notifications` - List notifications
- `GET /notifications/unread-count` - Get unread count
- `PUT /notifications/:id/read` - Mark as read
- `PUT /notifications/mark-all-read` - Mark all as read

#### Reviews
- `GET /reviews` - List reviews
- `POST /reviews` - Create review
- `GET /reviews/:id` - Get review details

#### Admin
- `GET /admin/dashboard/stats` - Dashboard statistics
- `GET /admin/users` - List all users
- `PUT /admin/users/:id/status` - Update user status
- `GET /admin/analytics` - Platform analytics
- `GET /admin/transactions` - Transaction management

### Response Format

Success response:
```json
{
  "status": "success",
  "data": { ... },
  "message": "Operation successful"
}
```

Error response:
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [ ... ]
}
```

## Database

### MongoDB Collections
- users - User accounts
- projects - Project listings
- proposals - Freelancer proposals
- contracts - Work contracts
- payments - Payment transactions
- messages - Chat messages
- conversations - Message threads
- notifications - User notifications
- reviews - User reviews
- organizations - Team accounts
- skills - Skill taxonomy
- categories - Project categories

### Seeding Database

```bash
# Seed with sample data
npm run seed

# Seed with complete profiles
npm run seed:complete-profiles

# Seed work logs
npm run seed:work-logs
```

## Authentication

JWT-based authentication with refresh tokens:
1. User logs in with credentials
2. Server returns access token (1h) and refresh token (7d)
3. Client includes access token in Authorization header
4. When access token expires, use refresh token to get new one

## File Upload

Files are uploaded to Cloudinary:
- Images: Avatars, portfolio items
- Documents: Contracts, attachments
- Max file size: 10MB
- Supported formats: jpg, png, pdf, doc, docx

## Payment Processing

Stripe integration for secure payments:
1. Client creates payment intent
2. User completes payment with Stripe
3. Funds held in escrow
4. Released upon milestone approval
5. Platform commission deducted

## Real-time Features

Socket.io for real-time updates:
- New messages
- Notifications
- Proposal updates
- Contract status changes

### Socket Events
- `connection` - Client connected
- `disconnect` - Client disconnected
- `new_message` - New message received
- `new_notification` - New notification
- `typing` - User typing indicator

## Error Handling

Centralized error handling middleware:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

## Logging

Winston logger with multiple transports:
- Console (development)
- File (production)
- Error log (errors only)

Log levels: error, warn, info, http, debug

## Testing

Jest test framework with Supertest:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.ts

# Generate coverage report
npm run test:coverage
```

Test files located in `src/test/`

## Security

Security measures implemented:
- Helmet for security headers
- CORS configuration
- Rate limiting
- Input validation and sanitization
- MongoDB injection prevention
- XSS protection
- JWT token expiration
- Password hashing with bcrypt
- HTTPS in production

## Performance

Optimization strategies:
- Redis caching for frequent queries
- Database indexing
- Query optimization
- Connection pooling
- Compression middleware
- Pagination for large datasets

## Monitoring

Production monitoring:
- Winston logging
- Error tracking
- Performance metrics
- API response times
- Database query performance

## Deployment

### Environment Setup
1. Set production environment variables
2. Configure MongoDB Atlas
3. Configure Redis Cloud
4. Set up Stripe webhooks
5. Configure Cloudinary

### Build and Deploy
```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t talenthive-server .

# Run container
docker run -p 5000:5000 talenthive-server
```

## Troubleshooting

### Common Issues

**MongoDB connection failed**
- Check MongoDB is running
- Verify connection string
- Check network access

**Redis connection failed**
- Check Redis is running
- Verify Redis URL
- Check firewall settings

**Stripe webhook errors**
- Verify webhook secret
- Check endpoint URL
- Test with Stripe CLI

**Port already in use**
```bash
# Kill process on port 5000
npx kill-port 5000
```

## API Rate Limiting

Default rate limits:
- 100 requests per 15 minutes per IP
- Configurable via environment variables

## Contributing

1. Follow TypeScript best practices
2. Write tests for new features
3. Update API documentation
4. Follow existing code style
5. Submit pull request

## License

Proprietary - All rights reserved
