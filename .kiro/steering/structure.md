# Project Structure & Organization

## Root Level Structure
```
talenthive-platform/
├── client/                 # React frontend application
├── server/                 # Node.js backend API
├── scripts/                # Database and deployment scripts
├── .kiro/                  # Kiro IDE configuration and specs
├── docker-compose.yml      # Multi-service Docker setup
└── package.json           # Root package with workspace scripts
```

## Backend Structure (`server/src/`)
```
server/src/
├── config/                 # Database, Redis, and service configurations
├── controllers/            # Route handlers and business logic
├── middleware/             # Custom Express middleware (auth, error handling, rate limiting)
├── models/                 # Mongoose schemas and model definitions
├── routes/                 # Express route definitions
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions (JWT, email, upload, logger)
├── scripts/                # Database seeding and maintenance scripts
├── test/                   # Jest test files
└── index.ts               # Application entry point
```

## Frontend Structure (`client/src/`)
```
client/src/
├── components/             # Reusable UI components
│   ├── auth/              # Authentication-related components
│   ├── contracts/         # Contract and milestone management
│   ├── layout/            # Header, footer, navigation components
│   ├── profile/           # User profile management
│   ├── projects/          # Project creation and management
│   ├── proposals/         # Proposal submission and review
│   └── ui/                # Generic UI components
├── pages/                 # Route-level page components
│   └── auth/              # Login and registration pages
├── store/                 # Redux store configuration
│   └── slices/            # Redux Toolkit slices
├── services/              # API service layer
├── hooks/                 # Custom React hooks
├── theme/                 # Material-UI theme configuration
├── test/                  # Vitest test files
└── main.tsx              # Application entry point
```

## Naming Conventions

### Files & Directories
- **Components**: PascalCase (e.g., `UserProfile.tsx`, `ProjectCard.tsx`)
- **Pages**: PascalCase with "Page" suffix (e.g., `DashboardPage.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useAuth.ts`)
- **Services**: camelCase (e.g., `api.ts`, `authService.ts`)
- **Types**: camelCase files, PascalCase interfaces (e.g., `user.ts` contains `IUser`)
- **Directories**: kebab-case for multi-word (e.g., `auth-forms/`)

### Code Conventions
- **Interfaces**: Prefix with `I` (e.g., `IUser`, `IProject`)
- **Types**: PascalCase (e.g., `UserRole`, `ProjectStatus`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Functions**: camelCase (e.g., `getUserById`, `validateEmail`)

## Import Organization
1. External libraries (React, Express, etc.)
2. Internal modules using path aliases (`@/components`, `@/utils`)
3. Relative imports (`./`, `../`)
4. Type-only imports at the end

## Component Organization
- Each major feature has its own component directory
- Shared/generic components go in `ui/` directory
- Components are organized by domain (auth, projects, proposals, etc.)
- Step-based components use nested `steps/` directories