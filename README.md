# TalentHive - Freelancing Platform

A comprehensive freelancing platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js) and TypeScript.

## Features

- **Three User Roles**: Admin, Freelancer, and Client with role-based access control
- **Project Management**: Complete project lifecycle from posting to completion
- **Proposal System**: Freelancers can submit proposals with custom pricing
- **Secure Payments**: Stripe integration with escrow system
- **Real-time Messaging**: Socket.io powered communication
- **Review System**: Rating and feedback for completed projects
- **Responsive Design**: Mobile-first approach with Material-UI
- **Time Tracking**: Integrated productivity monitoring
- **Organization Support**: Team accounts with budget controls

## Tech Stack

### Backend
- Node.js with Express.js
- TypeScript
- MongoDB with Mongoose
- Redis for caching
- Socket.io for real-time features
- JWT authentication
- Stripe for payments
- SendGrid for emails
- Cloudinary for file storage

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Redux Toolkit for state management
- Material-UI (MUI) v5 for components
- React Router v6
- TanStack Query (React Query) for server state
- Socket.io client for real-time features
- Formik + Yup for forms and validation
- Vitest for testing

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Redis
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/talenthive-platform.git
cd talenthive-platform
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
cd ..
```

3. Set up environment variables:
```bash
# Copy example files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Edit the .env files with your configuration
# Make sure to update:
# - Database connection strings
# - JWT secrets (use strong, unique keys)
# - Stripe API keys
# - SendGrid API key
# - Cloudinary credentials
```

4. Start the development servers:
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run server:dev  # Backend only
npm run client:dev  # Frontend only
```

### Using Docker

1. Start with Docker Compose:
```bash
docker-compose up -d
```

This will start:
- MongoDB on port 27017
- Redis on port 6379
- Backend API on port 5000
- Frontend app on port 3000

## Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications for production
- `npm run test` - Run tests for both applications
- `npm run lint` - Lint both applications
- `npm run format` - Format code with Prettier
- `npm run seed` - Seed database with sample data
- `npm run validate-data` - Validate database data integrity
- `npm run server:dev` - Start backend only
- `npm run client:dev` - Start frontend only
- `npm run server:build` - Build backend only
- `npm run client:build` - Build frontend only
- `npm run server:test` - Run backend tests only
- `npm run client:test` - Run frontend tests only
- `npm run server:lint` - Lint backend only
- `npm run client:lint` - Lint frontend only

### Backend (server/)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run Jest tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run seed` - Seed database with sample data
- `npm run validate-data` - Validate database data integrity

### Frontend (client/)
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run build:check` - Build with TypeScript type checking
- `npm run preview` - Preview production build
- `npm run test` - Run Vitest tests
- `npm run test:ui` - Run Vitest with UI interface
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix

## Project Structure

```
talenthive-platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # Generic UI components
│   │   │   ├── auth/       # Authentication components
│   │   │   ├── layout/     # Layout components
│   │   │   └── ...         # Feature-specific components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store and slices
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   ├── theme/          # Material-UI theme
│   │   └── test/           # Vitest test files
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # Express routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration files
│   │   ├── types/          # TypeScript type definitions
│   │   ├── scripts/        # Database seeding and utilities
│   │   └── test/           # Jest test files
│   └── package.json
├── scripts/                # Database and deployment scripts
├── docker-compose.yml      # Docker configuration
└── package.json           # Root package.json
```

## Development Workflow

### Code Quality
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier with 2-space indentation, single quotes
- **Git Hooks**: Husky with lint-staged for pre-commit checks
- **Type Safety**: Strict TypeScript configuration

### Testing Strategy
- **Backend**: Jest with Supertest for API testing
- **Frontend**: Vitest with Testing Library for component testing
- **Coverage**: Aim for >80% test coverage
- **E2E**: Manual testing workflow documented in `/test automation`

### Path Aliases
Both frontend and backend use path aliases for cleaner imports:
```typescript
// Instead of: import { User } from '../../../types/user'
import { User } from '@/types/user'
```

## API Documentation

The API follows RESTful conventions and is available at `/api/v1/`. Key endpoints include:

- `/auth` - Authentication (login, register, logout, refresh)
- `/users` - User management and profiles
- `/projects` - Project CRUD operations
- `/proposals` - Proposal management
- `/contracts` - Contract and milestone management
- `/payments` - Payment processing with Stripe
- `/messages` - Real-time messaging
- `/reviews` - Rating and review system
- `/notifications` - User notifications
- `/admin` - Administrative functions
- `/upload` - File upload to Cloudinary

Complete API documentation is available in `/docs/API-DOCUMENTATION.md`.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Environment Variables

### Required Environment Variables

**Server (.env)**:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (minimum 32 characters)
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `STRIPE_SECRET_KEY` - Stripe secret key for payments
- `SENDGRID_API_KEY` - SendGrid API key for emails
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - Cloudinary credentials

**Client (.env)**:
- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:5000/api/v1)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `VITE_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name

See `.env.example` files for complete configuration options.

## License

This project is licensed under the MIT License.

## Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Kill processes on ports 3000 and 5000
npx kill-port 3000 5000
```

**MongoDB connection issues**:
- Ensure MongoDB is running locally or update `MONGODB_URI` in `.env`
- For Docker: `docker-compose up mongodb -d`

**Redis connection issues**:
- Ensure Redis is running locally or update Redis config in `.env`
- For Docker: `docker-compose up redis -d`

**Build errors**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear client/server node_modules
cd client && rm -rf node_modules package-lock.json && npm install
cd ../server && rm -rf node_modules package-lock.json && npm install
```

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the API documentation at `/api/v1/docs` when server is running