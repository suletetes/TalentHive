# TalentHive Client

React-based frontend application for the TalentHive freelancing platform.

## Technology Stack

- React 18 with TypeScript
- Material-UI (MUI) v5 for UI components
- Redux Toolkit for state management
- TanStack Query (React Query) for server state
- React Router v6 for routing
- Formik + Yup for form validation
- Vite for build tooling
- Socket.io for real-time features

## Prerequisites

- Node.js 18 or higher
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

Create a `.env` file in the client directory with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000

# App Configuration
VITE_APP_NAME=TalentHive
VITE_APP_VERSION=1.0.0

# External Services
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false
VITE_ENABLE_DEVTOOLS=true

# Environment
VITE_NODE_ENV=development
```

## Development

```bash
# Start development server (port 3000)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable React components
│   │   ├── admin/      # Admin-specific components
│   │   ├── auth/       # Authentication components
│   │   ├── contracts/  # Contract management
│   │   ├── layout/     # Layout components (Header, Footer)
│   │   ├── messaging/  # Real-time messaging
│   │   ├── notifications/ # Notification system
│   │   ├── payments/   # Payment components
│   │   ├── profile/    # User profile components
│   │   ├── projects/   # Project management
│   │   ├── proposals/  # Proposal system
│   │   ├── reviews/    # Review and rating
│   │   └── ui/         # Generic UI components
│   ├── hooks/          # Custom React hooks
│   │   └── api/        # API-specific hooks
│   ├── pages/          # Route-level page components
│   ├── services/       # API service layer
│   │   └── api/        # API service modules
│   ├── store/          # Redux store configuration
│   │   └── slices/     # Redux Toolkit slices
│   ├── theme/          # MUI theme configuration
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── .env                # Environment variables
├── .env.example        # Environment variables template
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── README.md           # This file
```

## Key Features

### User Roles
- Client: Post projects, hire freelancers, manage contracts
- Freelancer: Browse projects, submit proposals, deliver work
- Admin: Platform management, analytics, user oversight

### Core Functionality
- Project posting and browsing
- Proposal submission and review
- Contract management with milestones
- Secure payment processing with Stripe
- Real-time messaging with Socket.io
- Notification system
- Review and rating system
- Time tracking
- Organization management
- Admin analytics dashboard

## API Integration

The client communicates with the backend API through service modules located in `src/services/api/`. Each service handles a specific domain:

- `auth.service.ts` - Authentication and authorization
- `projects.service.ts` - Project management
- `proposals.service.ts` - Proposal system
- `contracts.service.ts` - Contract management
- `payments.service.ts` - Payment processing
- `messages.service.ts` - Messaging system
- `notifications.service.ts` - Notifications
- `users.service.ts` - User management
- `reviews.service.ts` - Review system

## State Management

### Redux Store
Global application state managed with Redux Toolkit:
- `auth` - Authentication state
- `ui` - UI preferences (theme, sidebar)

### React Query
Server state managed with TanStack Query:
- Automatic caching and refetching
- Optimistic updates
- Background synchronization

## Routing

Routes are defined in `App.tsx`:
- Public routes: Home, login, register, browse projects
- Protected routes: Dashboard, profile, projects, contracts
- Admin routes: Admin dashboard, user management, analytics

## Styling

Material-UI (MUI) v5 with custom theme:
- Light and dark mode support
- Responsive design with breakpoints
- Custom color palette
- Typography scale
- Component overrides

Theme configuration: `src/theme/index.ts`

## Testing

Tests are written using Vitest and React Testing Library:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Building for Production

```bash
# Build optimized production bundle
npm run build

# Output directory: dist/
```

The build process:
1. TypeScript compilation
2. Code splitting and tree shaking
3. Asset optimization
4. Source map generation

## Deployment

### Environment Setup
1. Set production environment variables
2. Update API URLs
3. Configure CDN for static assets

### Build and Deploy
```bash
# Build production bundle
npm run build

# Deploy dist/ directory to hosting service
# (Vercel, Netlify, AWS S3, etc.)
```

### Docker Deployment
```bash
# Build Docker image
docker build -t talenthive-client -f Dockerfile.prod .

# Run container
docker run -p 80:80 talenthive-client
```

## Performance Optimization

- Code splitting by route
- Lazy loading of components
- Image optimization with Cloudinary
- Bundle size monitoring
- React Query caching strategy

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill process on port 3000
npx kill-port 3000
```

**Module not found errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build errors**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run build
```

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Submit pull request

## License

Proprietary - All rights reserved
