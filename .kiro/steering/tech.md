# Technology Stack & Build System

## Architecture
Full-stack MERN application with TypeScript, following a monorepo structure with separate client and server directories.

## Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis
- **Authentication**: JWT with refresh tokens
- **File Storage**: Cloudinary
- **Payments**: Stripe integration
- **Email**: SendGrid
- **Real-time**: Socket.io
- **Testing**: Jest with Supertest
- **Validation**: express-validator

## Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit with Redux Persist
- **UI Library**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **Server State**: TanStack Query (React Query)
- **Forms**: Formik + Yup validation
- **Testing**: Vitest with Testing Library
- **HTTP Client**: Axios

## Development Tools
- **Code Formatting**: Prettier (single quotes, 100 char width, 2 spaces)
- **Linting**: ESLint with TypeScript rules
- **Git Hooks**: Husky with lint-staged
- **Containerization**: Docker with docker-compose

## Common Commands

### Development
```bash
npm run dev              # Start both frontend and backend
npm run server:dev       # Backend only (port 5000)
npm run client:dev       # Frontend only (port 3000)
```

### Building
```bash
npm run build           # Build both applications
npm run server:build    # Build backend TypeScript
npm run client:build    # Build frontend for production
```

### Testing
```bash
npm test               # Run all tests
npm run server:test    # Backend Jest tests
npm run client:test    # Frontend Vitest tests
```

### Database
```bash
npm run seed           # Seed database with sample data
```

### Docker
```bash
docker-compose up -d   # Start all services (MongoDB, Redis, API, Frontend)
```

## Path Aliases
- Backend: `@/*` maps to `src/*` with specific aliases for controllers, models, etc.
- Frontend: `@/*` maps to `src/*` with aliases for components, pages, hooks, etc.