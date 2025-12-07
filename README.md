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
- Redux Toolkit for state management
- Material-UI (MUI) for components
- React Router v6
- React Query for server state
- Socket.io client
- Formik + Yup for forms

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Redis
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd talenthive-platform
```

2. Install dependencies:
```bash
npm install
cd server && npm install
cd ../client && npm install
```

3. Set up environment variables:
```bash
# Copy example files
cp server/.env.example server/.env
cp client/.env.example client/.env

# Edit the .env files with your configuration
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

### Backend (server/)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run test` - Run Jest tests
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with sample data

### Frontend (client/)
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run Vitest tests
- `npm run lint` - Run ESLint

## Project Structure

```
talenthive-platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store and slices
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── theme/          # Material-UI theme
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # Express routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration files
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── scripts/                # Database and deployment scripts
├── docker-compose.yml      # Docker configuration
└── package.json           # Root package.json
```

## API Documentation

The API follows RESTful conventions and is available at `/api/v1/`. Key endpoints include:

- `/auth` - Authentication (login, register, logout)
- `/users` - User management and profiles
- `/projects` - Project CRUD operations
- `/proposals` - Proposal management
- `/contracts` - Contract and milestone management
- `/payments` - Payment processing
- `/messages` - Real-time messaging
- `/reviews` - Rating and review system
- `/notifications` - User notifications
- `/admin` - Administrative functions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
