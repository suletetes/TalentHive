# TalentHive Server-Side Documentation

## Complete Backend Architecture Guide

**Technology Stack**: Node.js + Express.js + TypeScript + MongoDB + Redis  
**Architecture Pattern**: Layered architecture with MVC pattern  
**Database**: MongoDB with Mongoose ODM + Redis for caching

---

## Table of Contents

1. [Project Structure Overview](#1-project-structure-overview)
2. [Application Entry Point](#2-application-entry-point)
3. [Configuration Layer](#3-configuration-layer)
4. [Database Models](#4-database-models)
5. [Controller Layer](#5-controller-layer)
6. [Service Layer](#6-service-layer)
7. [Middleware Layer](#7-middleware-layer)
8. [Route Definitions](#8-route-definitions)
9. [Utility Functions](#9-utility-functions)
10. [Testing Strategy](#10-testing-strategy)
11. [Security Implementation](#11-security-implementation)
12. [Performance Optimizations](#12-performance-optimizations)

---

## 1. Project Structure Overview

### 1.1 Root Directory Structure
```
server/
├── src/                   # Source code directory
├── dist/                  # Compiled JavaScript output (generated)
├── coverage/              # Test coverage reports (generated)
├── logs/                  # Application log files
├── node_modules/          # Dependencies (generated)
├── package.json          # Project dependencies and scripts
├── package-lock.json     # Dependency lock file
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Jest testing configuration
├── nodemon.json          # Nodemon development configuration
├── .env                  # Environment variables (development)
├── .env.development      # Development environment variables
├── .env.example          # Environment variables template
├── .eslintrc.js          # ESLint configuration
├── Dockerfile            # Docker container configuration
├── test-withdrawal.js    # Payment testing script
└── README.md             # Project documentation
```

### 1.2 Source Code Structure
```
src/
├── config/               # Configuration files
│   ├── database.ts       # MongoDB connection configuration
│   ├── redis.ts          # Redis connection setup
│   ├── socket.ts         # Socket.io configuration
│   ├── stripe.ts         # Stripe payment configuration
│   └── cloudinary.ts     # Cloudinary file storage config
├── controllers/          # Request handlers (MVC Controllers)
├── middleware/           # Express middleware functions
├── models/               # Database models (Mongoose schemas)
├── routes/               # API route definitions
├── services/             # Business logic services
├── utils/                # Utility functions and helpers
├── types/                # TypeScript type definitions
├── test/                 # Test files
├── scripts/              # Database seeding and utility scripts
├── jobs/                 # Background job definitions
└── index.ts              # Application entry point
```
## 2. Application Entry Point

### 2.1 index.ts - Server Bootstrap
```typescript
// src/index.ts - Main server entry point
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables first

import 'module-alias/register'; // Enable path aliases
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Internal imports
import { connectDB } from '@/config/database';
import { connectRedis } from '@/config/redis';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/errorHandler';
import { rateLimiter } from '@/middleware/rateLimiter';
import { socketService } from '@/services/socket.service';
import routes from '@/routes';

// Security and performance middleware
import { 
  apiRateLimiter, 
  sanitizeInput, 
  securityHeaders, 
  corsOptions, 
  validateRequest, 
  trackIP 
} from '@/middleware/security';
import { 
  requestTimer, 
  compressionCheck, 
  monitorMemory,
  noCache 
} from '@/middleware/performance';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Initialize socket service
socketService.setIO(io);

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
```

**Key Features:**
- **Environment Configuration**: Loads environment variables first
- **Module Aliases**: Enables clean import paths with @ prefix
- **HTTP Server**: Express.js with HTTP server for Socket.io
- **Socket.io Integration**: Real-time communication setup
- **Middleware Stack**: Security, performance, and logging middleware
- **Database Connections**: MongoDB and Redis initialization
- **Error Handling**: Global error handling middleware

### 2.2 Middleware Stack Configuration
```typescript
// Security middleware (applied first)
app.use(securityHeaders());           // Helmet.js security headers
app.use(cors(corsOptions));           // CORS with whitelist
app.use(trackIP);                     // IP tracking for analytics
app.use(sanitizeInput());             // Input sanitization
app.use(validateRequest);             // Request validation

// Performance middleware
app.use(requestTimer);                // Request timing
app.use(compression());               // Gzip compression
app.use(compressionCheck);            // Compression monitoring

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));             // Detailed dev logging
} else {
  app.use(morgan('combined'));        // Production logging
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiRateLimiter);     // API rate limiting

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
app.use('/api/v1', routes);           // Versioned API routes
app.use('/api', routes);              // Backward compatibility

// Error handling (must be last)
app.use(errorHandler);
```

### 2.3 Server Startup Process
```typescript
// Graceful shutdown handlers
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start server function
async function startServer() {
  try {
    // Connect to databases
    await connectDB();                // MongoDB connection
    await connectRedis();             // Redis connection
    
    // Start memory monitoring
    monitorMemory();
    
    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 API endpoint: http://localhost:${PORT}/api`);
      logger.info(`🔒 Security middleware active`);
      logger.info(`⚡ Performance monitoring enabled`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if not in test environment
if (NODE_ENV !== 'test') {
  startServer();
}

// Export for testing
export { app, io };
```
## 3. Configuration Layer

### 3.1 Database Configuration

#### 3.1.1 MongoDB Connection
```typescript
// src/config/database.ts
import mongoose from 'mongoose';
import { logger } from '@/utils/logger';

interface ConnectionOptions {
  maxPoolSize: number;
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
  family: number;
  bufferCommands: boolean;
  bufferMaxEntries: number;
}

const connectionOptions: ConnectionOptions = {
  maxPoolSize: 10,                    // Maximum number of connections
  serverSelectionTimeoutMS: 5000,    // How long to try selecting a server
  socketTimeoutMS: 45000,             // How long a send or receive can take
  family: 4,                          // Use IPv4, skip trying IPv6
  bufferCommands: false,              // Disable mongoose buffering
  bufferMaxEntries: 0,                // Disable mongoose buffering
};

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, connectionOptions);
    
    logger.info(`📦 MongoDB Connected: ${conn.connection.host}`);
    logger.info(`🗄️  Database: ${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Database health check
export const checkDBHealth = async (): Promise<boolean> => {
  try {
    const state = mongoose.connection.readyState;
    return state === 1; // 1 = connected
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

// Get database statistics
export const getDBStats = async () => {
  try {
    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
    };
  } catch (error) {
    logger.error('Failed to get database stats:', error);
    return null;
  }
};
```

#### 3.1.2 Redis Configuration
```typescript
// src/config/redis.ts
import { createClient, RedisClientType } from 'redis';
import { logger } from '@/utils/logger';

class RedisConnection {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis max reconnection attempts reached');
              return false;
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      // Event listeners
      this.client.on('connect', () => {
        logger.info('🔗 Redis connecting...');
      });

      this.client.on('ready', () => {
        logger.info('✅ Redis connected and ready');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        logger.error('❌ Redis connection error:', error);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.warn('🔌 Redis connection ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('🔄 Redis reconnecting...');
      });

      // Connect to Redis
      await this.client.connect();

    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Cache operations
  async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = this.getClient();
    if (ttl) {
      await client.setEx(key, ttl, value);
    } else {
      await client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    return await client.get(key);
  }

  async del(key: string): Promise<number> {
    const client = this.getClient();
    return await client.del(key);
  }

  async exists(key: string): Promise<number> {
    const client = this.getClient();
    return await client.exists(key);
  }

  async flushAll(): Promise<void> {
    const client = this.getClient();
    await client.flushAll();
  }

  // Session operations
  async setSession(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
    await this.set(`session:${sessionId}`, JSON.stringify(data), ttl);
  }

  async getSession(sessionId: string): Promise<any | null> {
    const data = await this.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }
}

const redisConnection = new RedisConnection();

export const connectRedis = async (): Promise<void> => {
  await redisConnection.connect();
};

export const getRedisClient = (): RedisClientType => {
  return redisConnection.getClient();
};

export const redisService = redisConnection;
```

### 3.2 External Service Configuration

#### 3.2.1 Stripe Configuration
```typescript
// src/config/stripe.ts
import Stripe from 'stripe';
import { logger } from '@/utils/logger';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
  telemetry: false,
});

// Stripe webhook configuration
export const stripeConfig = {
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  currency: process.env.DEFAULT_CURRENCY || 'usd',
  platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT || '5'),
  
  // Payment intent configuration
  paymentIntentDefaults: {
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    capture_method: 'manual' as const, // Manual capture for escrow
  },

  // Connect account configuration
  connectAccountDefaults: {
    type: 'express' as const,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  },
};

// Stripe helper functions
export const stripeHelpers = {
  // Create customer
  createCustomer: async (email: string, name: string) => {
    try {
      return await stripe.customers.create({
        email,
        name,
        metadata: {
          platform: 'talenthive',
        },
      });
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
      throw error;
    }
  },

  // Create connected account
  createConnectedAccount: async (email: string, country: string = 'US') => {
    try {
      return await stripe.accounts.create({
        ...stripeConfig.connectAccountDefaults,
        email,
        country,
        metadata: {
          platform: 'talenthive',
        },
      });
    } catch (error) {
      logger.error('Failed to create Stripe connected account:', error);
      throw error;
    }
  },

  // Calculate platform fee
  calculatePlatformFee: (amount: number): number => {
    return Math.round(amount * (stripeConfig.platformFeePercent / 100));
  },

  // Verify webhook signature
  verifyWebhookSignature: (payload: string, signature: string): Stripe.Event => {
    if (!stripeConfig.webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        stripeConfig.webhookSecret
      );
    } catch (error) {
      logger.error('Stripe webhook signature verification failed:', error);
      throw error;
    }
  },
};
```

#### 3.2.2 Cloudinary Configuration
```typescript
// src/config/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '@/utils/logger';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Validate configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  logger.warn('Cloudinary configuration incomplete. File upload may not work.');
}

// Upload presets
export const uploadPresets = {
  avatar: {
    folder: 'talenthive/avatars',
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 2000000, // 2MB
  },
  
  portfolio: {
    folder: 'talenthive/portfolio',
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 5000000, // 5MB
  },
  
  documents: {
    folder: 'talenthive/documents',
    resource_type: 'auto',
    allowed_formats: ['pdf', 'doc', 'docx', 'txt'],
    max_file_size: 10000000, // 10MB
  },
  
  project_attachments: {
    folder: 'talenthive/projects',
    resource_type: 'auto',
    max_file_size: 50000000, // 50MB
  },
};

// Cloudinary helper functions
export const cloudinaryHelpers = {
  // Upload file with preset
  uploadFile: async (file: Buffer, preset: keyof typeof uploadPresets, filename?: string) => {
    try {
      const options = {
        ...uploadPresets[preset],
        public_id: filename ? `${uploadPresets[preset].folder}/${filename}` : undefined,
      };

      const result = await cloudinary.uploader.upload(
        `data:image/upload;base64,${file.toString('base64')}`,
        options
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      logger.error('Cloudinary upload failed:', error);
      throw error;
    }
  },

  // Delete file
  deleteFile: async (publicId: string) => {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      logger.error('Cloudinary delete failed:', error);
      throw error;
    }
  },

  // Generate signed URL for direct upload
  generateSignedUrl: (preset: keyof typeof uploadPresets) => {
    const timestamp = Math.round(Date.now() / 1000);
    const params = {
      timestamp,
      ...uploadPresets[preset],
    };

    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

    return {
      url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY,
      ...params,
    };
  },
};

export { cloudinary };
```
## 4. Database Models

### 4.1 User Model Implementation

#### 4.1.1 User Schema Structure
```typescript
// src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, IUserModel } from '@/types/user';

// Embedded schema definitions
const timeSlotSchema = new Schema({
  start: { type: String, required: true },    // "09:00"
  end: { type: String, required: true },      // "17:00"
}, { _id: false });

const weeklyScheduleSchema = new Schema({
  monday: [timeSlotSchema],
  tuesday: [timeSlotSchema],
  wednesday: [timeSlotSchema],
  thursday: [timeSlotSchema],
  friday: [timeSlotSchema],
  saturday: [timeSlotSchema],
  sunday: [timeSlotSchema],
}, { _id: false });

const portfolioItemSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: [String],                           // Cloudinary URLs
  projectUrl: String,                         // Live project URL
  technologies: [String],                     // Tech stack used
  completedAt: { type: Date, required: true },
}, { timestamps: true });

const workExperienceSchema = new Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  startDate: { type: Date, required: true },
  endDate: Date,
  current: { type: Boolean, default: false },
  description: { type: String, maxlength: 2000 },
}, { timestamps: true });

const educationSchema = new Schema({
  degree: { type: String, required: true },
  institution: { type: String, required: true },
  fieldOfStudy: String,
  startDate: { type: Date, required: true },
  endDate: Date,
  description: { type: String, maxlength: 1000 },
}, { timestamps: true });

const languageSchema = new Schema({
  language: { type: String, required: true },
  proficiency: {
    type: String,
    enum: ['basic', 'conversational', 'fluent', 'native'],
    required: true,
  },
}, { _id: false });

const servicePackageSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  deliveryTime: { type: Number, required: true, min: 1 }, // days
  revisions: { type: Number, required: true, min: 0 },
  features: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const certificationSchema = new Schema({
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  dateEarned: { type: Date, required: true },
  expiryDate: Date,
  verificationUrl: String,
}, { _id: false });

// Main User Schema
const userSchema = new Schema<IUser>({
  // Authentication fields
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false, // Don't include in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'freelancer', 'client'],
    required: true,
  },

  // Basic profile information
  profile: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    avatar: String,                           // Cloudinary URL
    bio: { type: String, maxlength: 1000 },
    location: String,
    timezone: String,
  },

  // Freelancer-specific profile
  freelancerProfile: {
    title: String,                            // Professional title
    hourlyRate: { type: Number, min: 0 },
    skillRates: [{                           // Different rates for different skills
      skill: { type: String, required: true },
      rate: { type: Number, required: true, min: 0 },
    }],
    skills: [String],                        // Array of skill names
    experience: String,                      // Experience level
    portfolio: [portfolioItemSchema],
    workExperience: [workExperienceSchema],
    education: [educationSchema],
    languages: [languageSchema],
    availability: {
      status: {
        type: String,
        enum: ['available', 'busy', 'unavailable'],
        default: 'available',
      },
      schedule: weeklyScheduleSchema,
    },
    servicePackages: [servicePackageSchema],
    certifications: [certificationSchema],
    timeTracking: {
      isEnabled: { type: Boolean, default: false },
      screenshotFrequency: { type: Number, min: 1, max: 60 }, // minutes
      activityMonitoring: { type: Boolean, default: false },
    },
  },

  // Client-specific profile
  clientProfile: {
    companyName: String,
    industry: String,
    projectsPosted: { type: Number, default: 0, min: 0 },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    teamRole: {
      type: String,
      enum: ['owner', 'admin', 'member'],
    },
    budgetLimits: {
      daily: { type: Number, min: 0 },
      monthly: { type: Number, min: 0 },
      requiresApproval: { type: Boolean, default: false },
    },
    preferredVendors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },

  // Admin-specific profile
  adminProfile: {
    permissions: [{
      resource: { type: String, required: true },
      actions: [String],
    }],
    lastLoginAt: Date,
    accessLevel: {
      type: String,
      enum: ['super_admin', 'moderator', 'support'],
      default: 'support',
    },
  },

  // Rating and reputation
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0, min: 0 },
  },

  // Account status and verification
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'deactivated'],
    default: 'active',
  },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Featured freelancer fields
  isFeatured: { type: Boolean, default: false },
  featuredOrder: { type: Number, default: 0 },
  featuredSince: Date,

  // Stripe integration
  stripeCustomerId: String,
  stripeConnectedAccountId: String,

  // Authentication tokens
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLoginAt: Date,

  // Profile customization
  profileSlug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    maxlength: 50,
  },
  slugHistory: [{
    slug: { type: String, required: true },
    changedAt: { type: Date, required: true, default: Date.now },
  }],

  // Onboarding tracking
  onboardingCompleted: { type: Boolean, default: false },
  onboardingStep: { type: Number, default: 0 },
  onboardingSkippedAt: Date,

  // Analytics
  profileViews: { type: Number, default: 0, min: 0 },
  profileViewers: [{
    viewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    viewedAt: { type: Date, required: true, default: Date.now },
  }],

  // Theme preference
  themePreference: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
```

#### 4.1.2 User Schema Indexes and Methods
```typescript
// Indexes for performance optimization
userSchema.index({ email: 1 });                          // Unique email lookup
userSchema.index({ role: 1 });                           // Role-based queries
userSchema.index({ 'freelancerProfile.skills': 1 });     // Skill-based search
userSchema.index({ isActive: 1 });                       // Active users
userSchema.index({ isVerified: 1 });                     // Verified users
userSchema.index({ 'rating.average': -1 });              // Top-rated users
userSchema.index({ isFeatured: 1, featuredOrder: 1 });   // Featured freelancers
userSchema.index({ profileSlug: 1 });                    // Profile slug lookup
userSchema.index({ onboardingCompleted: 1 });            // Onboarding status
userSchema.index({ createdAt: -1 });                     // Recent users
userSchema.index({ lastLoginAt: -1 });                   // Active users

// Text search index for user profiles
userSchema.index({
  'profile.firstName': 'text',
  'profile.lastName': 'text',
  'freelancerProfile.title': 'text',
  'freelancerProfile.skills': 'text',
  'clientProfile.companyName': 'text',
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Virtual for profile completion percentage
userSchema.virtual('profileCompletion').get(function() {
  let completion = 0;
  const totalFields = 10;

  // Basic profile fields
  if (this.profile.firstName) completion++;
  if (this.profile.lastName) completion++;
  if (this.profile.avatar) completion++;
  if (this.profile.bio) completion++;
  if (this.profile.location) completion++;

  // Role-specific fields
  if (this.role === 'freelancer') {
    if (this.freelancerProfile?.title) completion++;
    if (this.freelancerProfile?.hourlyRate) completion++;
    if (this.freelancerProfile?.skills?.length) completion++;
    if (this.freelancerProfile?.portfolio?.length) completion++;
    if (this.freelancerProfile?.workExperience?.length) completion++;
  } else if (this.role === 'client') {
    if (this.clientProfile?.companyName) completion++;
    if (this.clientProfile?.industry) completion++;
    completion += 3; // Add remaining points for client
  }

  return Math.round((completion / totalFields) * 100);
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateRating = function(newRating: number) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
};

userSchema.methods.generateProfileSlug = function() {
  const baseSlug = `${this.profile.firstName}-${this.profile.lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  return `${baseSlug}-${this._id.toString().slice(-6)}`;
};

// Static methods
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveFreelancers = function(filters = {}) {
  return this.find({
    role: 'freelancer',
    isActive: true,
    isVerified: true,
    accountStatus: 'active',
    ...filters,
  }).select('-password');
};

userSchema.statics.findFeaturedFreelancers = function(limit = 10) {
  return this.find({
    role: 'freelancer',
    isFeatured: true,
    isActive: true,
    isVerified: true,
    accountStatus: 'active',
  })
  .sort({ featuredOrder: 1, 'rating.average': -1 })
  .limit(limit)
  .select('-password');
};

export const User = mongoose.model<IUser>('User', userSchema) as mongoose.Model<IUser> & IUserModel;
```
### 4.2 Project Model Implementation

#### 4.2.1 Project Schema Structure
```typescript
// src/models/Project.ts
import mongoose, { Schema } from 'mongoose';
import { IProject } from '@/types/project';

const milestoneSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'overdue'],
    default: 'pending',
  },
  deliverables: [String],                     // File URLs or descriptions
  completedAt: Date,
}, { timestamps: true });

const budgetSchema = new Schema({
  type: {
    type: String,
    enum: ['fixed', 'hourly'],
    required: true,
  },
  min: { type: Number, required: true, min: 0 },
  max: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
}, { _id: false });

const timelineSchema = new Schema({
  duration: { type: Number, required: true, min: 1 },
  unit: {
    type: String,
    enum: ['days', 'weeks', 'months'],
    required: true,
  },
  startDate: Date,
  endDate: Date,
}, { _id: false });

const projectSchema = new Schema<IProject>({
  // Basic project information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000,
  },
  
  // Project relationships
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  assignedFreelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  
  // Project categorization
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  },
  skills: [{
    type: Schema.Types.ObjectId,
    ref: 'Skill',
    index: true,
  }],
  
  // Project budget and timeline
  budget: {
    type: budgetSchema,
    required: true,
  },
  timeline: {
    type: timelineSchema,
    required: true,
  },
  
  // Project status and lifecycle
  status: {
    type: String,
    enum: [
      'draft',           // Being created
      'open',            // Published and accepting proposals
      'in_progress',     // Work has started
      'in_review',       // Work submitted for review
      'completed',       // Successfully completed
      'cancelled',       // Cancelled by client
      'disputed',        // Under dispute resolution
      'paused',          // Temporarily paused
    ],
    default: 'draft',
    index: true,
  },
  
  // Project requirements and deliverables
  requirements: [String],                     // List of requirements
  deliverables: [String],                     // Expected deliverables
  attachments: [String],                      // File URLs
  
  // Proposal and application settings
  applicationDeadline: {
    type: Date,
    required: true,
    index: true,
  },
  maxProposals: {
    type: Number,
    default: 50,
    min: 1,
    max: 100,
  },
  
  // Project metrics and analytics
  viewCount: { type: Number, default: 0, min: 0 },
  proposalCount: { type: Number, default: 0, min: 0 },
  bookmarkCount: { type: Number, default: 0, min: 0 },
  
  // Featured and promoted projects
  isFeatured: { type: Boolean, default: false },
  isUrgent: { type: Boolean, default: false },
  promotedUntil: Date,
  
  // Project milestones (for complex projects)
  milestones: [milestoneSchema],
  
  // Project settings
  isPublic: { type: Boolean, default: true },
  allowsMessages: { type: Boolean, default: true },
  requiresNDA: { type: Boolean, default: false },
  
  // Collaboration settings
  teamSize: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
  },
  collaborationType: {
    type: String,
    enum: ['individual', 'team', 'either'],
    default: 'individual',
  },
  
  // Location preferences
  locationPreference: {
    type: String,
    enum: ['remote', 'onsite', 'hybrid', 'no_preference'],
    default: 'remote',
  },
  preferredTimezones: [String],
  
  // Experience requirements
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'expert', 'any'],
    default: 'any',
  },
  
  // Project completion tracking
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  
  // Search and SEO
  tags: [String],                             // Additional search tags
  seoTitle: String,
  seoDescription: String,
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for performance
projectSchema.index({ status: 1, createdAt: -1 });       // Active projects by date
projectSchema.index({ client: 1, status: 1 });           // Client's projects
projectSchema.index({ category: 1, status: 1 });         // Category filtering
projectSchema.index({ skills: 1, status: 1 });           // Skill-based matching
projectSchema.index({ 'budget.min': 1, 'budget.max': 1 }); // Budget range
projectSchema.index({ applicationDeadline: 1 });         // Deadline filtering
projectSchema.index({ isFeatured: 1, createdAt: -1 });   // Featured projects
projectSchema.index({ isUrgent: 1, createdAt: -1 });     // Urgent projects
projectSchema.index({ viewCount: -1 });                  // Popular projects
projectSchema.index({ proposalCount: -1 });              // Most applied

// Text search index
projectSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  requirements: 'text',
});

// Compound indexes for complex queries
projectSchema.index({ 
  status: 1, 
  category: 1, 
  'budget.type': 1, 
  createdAt: -1 
});

// Virtual fields
projectSchema.virtual('isActive').get(function() {
  return ['open', 'in_progress'].includes(this.status);
});

projectSchema.virtual('isExpired').get(function() {
  return this.applicationDeadline < new Date() && this.status === 'open';
});

projectSchema.virtual('daysRemaining').get(function() {
  if (this.status !== 'open') return 0;
  const now = new Date();
  const deadline = new Date(this.applicationDeadline);
  const diffTime = deadline.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

projectSchema.virtual('budgetRange').get(function() {
  const { min, max, currency, type } = this.budget;
  const symbol = currency === 'USD' ? '$' : currency;
  
  if (type === 'fixed') {
    return min === max ? `${symbol}${min}` : `${symbol}${min} - ${symbol}${max}`;
  } else {
    return `${symbol}${min} - ${symbol}${max}/hr`;
  }
});

// Instance methods
projectSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

projectSchema.methods.addProposal = function() {
  this.proposalCount += 1;
  return this.save();
};

projectSchema.methods.removeProposal = function() {
  this.proposalCount = Math.max(0, this.proposalCount - 1);
  return this.save();
};

projectSchema.methods.canReceiveProposals = function() {
  return this.status === 'open' && 
         this.applicationDeadline > new Date() &&
         this.proposalCount < this.maxProposals;
};

projectSchema.methods.assignToFreelancer = function(freelancerId: string) {
  this.assignedFreelancer = freelancerId;
  this.status = 'in_progress';
  return this.save();
};

// Static methods
projectSchema.statics.findActiveProjects = function(filters = {}) {
  return this.find({
    status: 'open',
    applicationDeadline: { $gte: new Date() },
    ...filters,
  }).populate('client', 'profile rating')
    .populate('category', 'name')
    .populate('skills', 'name');
};

projectSchema.statics.findBySkills = function(skills: string[], limit = 20) {
  return this.find({
    status: 'open',
    skills: { $in: skills },
    applicationDeadline: { $gte: new Date() },
  }).limit(limit)
    .sort({ createdAt: -1 })
    .populate('client', 'profile rating')
    .populate('category', 'name')
    .populate('skills', 'name');
};

projectSchema.statics.findFeaturedProjects = function(limit = 10) {
  return this.find({
    status: 'open',
    isFeatured: true,
    applicationDeadline: { $gte: new Date() },
  }).limit(limit)
    .sort({ createdAt: -1 })
    .populate('client', 'profile rating')
    .populate('category', 'name')
    .populate('skills', 'name');
};

export const Project = mongoose.model<IProject>('Project', projectSchema);
```
### 4.3 Contract Model Implementation

#### 4.3.1 Contract Schema Structure
```typescript
// src/models/Contract.ts
import mongoose, { Schema } from 'mongoose';
import { IContract } from '@/types/contract';

const deliverableSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  fileUrl: String,                            // Cloudinary URL
  submittedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'revision_requested'],
    default: 'pending',
  },
  feedback: String,                           // Client feedback
  revisionCount: { type: Number, default: 0 },
}, { timestamps: true });

const milestoneSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: [
      'pending',           // Not started
      'in_progress',       // Work in progress
      'submitted',         // Submitted for review
      'approved',          // Approved by client
      'rejected',          // Rejected by client
      'paid',              // Payment released
      'disputed',          // Under dispute
    ],
    default: 'pending',
  },
  deliverables: [deliverableSchema],
  submittedAt: Date,
  approvedAt: Date,
  paidAt: Date,
  escrowAmount: { type: Number, default: 0 }, // Amount held in escrow
  notes: String,                              // Additional notes
}, { timestamps: true });

const paymentTermsSchema = new Schema({
  paymentSchedule: {
    type: String,
    enum: ['milestone', 'hourly', 'completion'],
    default: 'milestone',
  },
  currency: { type: String, default: 'USD' },
  platformFee: { type: Number, default: 5 },  // Percentage
  lateFeePercentage: { type: Number, default: 0 },
  paymentDueDays: { type: Number, default: 7 },
}, { _id: false });

const contractTermsSchema = new Schema({
  workDescription: { type: String, required: true },
  deliverables: [String],
  timeline: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    workingHours: String,                     // e.g., "9 AM - 5 PM EST"
    workingDays: [String],                    // e.g., ["Monday", "Tuesday", ...]
  },
  revisionPolicy: {
    maxRevisions: { type: Number, default: 3 },
    revisionFee: { type: Number, default: 0 },
  },
  intellectualProperty: {
    ownership: {
      type: String,
      enum: ['client', 'freelancer', 'shared'],
      default: 'client',
    },
    licenseTerms: String,
  },
  confidentiality: {
    isRequired: { type: Boolean, default: false },
    ndaUrl: String,                           // NDA document URL
  },
  cancellationPolicy: {
    noticePeriod: { type: Number, default: 7 }, // days
    cancellationFee: { type: Number, default: 0 },
    refundPolicy: String,
  },
}, { _id: false });

const signatureSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  signedAt: { type: Date, required: true, default: Date.now },
  ipAddress: String,
  userAgent: String,
  digitalSignature: String,                   // Encrypted signature
}, { _id: false });

const contractSchema = new Schema<IContract>({
  // Contract relationships
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  freelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  proposal: {
    type: Schema.Types.ObjectId,
    ref: 'Proposal',
    required: true,
  },

  // Contract identification
  contractNumber: {
    type: String,
    unique: true,
    required: true,
  },
  title: { type: String, required: true },
  description: String,

  // Financial terms
  totalAmount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  paymentTerms: paymentTermsSchema,

  // Contract status
  status: {
    type: String,
    enum: [
      'draft',             // Being prepared
      'pending_signatures', // Waiting for signatures
      'active',            // Signed and active
      'completed',         // Successfully completed
      'cancelled',         // Cancelled before completion
      'terminated',        // Terminated early
      'disputed',          // Under dispute resolution
      'expired',           // Expired without completion
    ],
    default: 'draft',
    index: true,
  },

  // Contract milestones
  milestones: [milestoneSchema],

  // Contract terms and conditions
  terms: contractTermsSchema,

  // Digital signatures
  signatures: [signatureSchema],
  allPartiesSigned: { type: Boolean, default: false },

  // Time tracking (for hourly contracts)
  timeTracking: {
    isEnabled: { type: Boolean, default: false },
    totalHours: { type: Number, default: 0 },
    billableHours: { type: Number, default: 0 },
    hourlyRate: Number,
  },

  // Contract dates
  signedAt: Date,
  startDate: Date,
  endDate: Date,
  completedAt: Date,
  cancelledAt: Date,
  terminatedAt: Date,

  // Escrow and payments
  escrowBalance: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },  // After platform fees

  // Dispute information
  disputeReason: String,
  disputeStatus: {
    type: String,
    enum: ['none', 'pending', 'in_review', 'resolved'],
    default: 'none',
  },
  disputeResolution: String,

  // Performance metrics
  clientSatisfaction: { type: Number, min: 1, max: 5 },
  freelancerSatisfaction: { type: Number, min: 1, max: 5 },
  onTimeCompletion: { type: Boolean },
  qualityRating: { type: Number, min: 1, max: 5 },

  // Additional metadata
  tags: [String],
  notes: String,
  attachments: [String],                      // Contract-related files

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for performance
contractSchema.index({ client: 1, status: 1 });
contractSchema.index({ freelancer: 1, status: 1 });
contractSchema.index({ project: 1 });
contractSchema.index({ status: 1, createdAt: -1 });
contractSchema.index({ contractNumber: 1 });
contractSchema.index({ 'milestones.status': 1 });
contractSchema.index({ disputeStatus: 1 });

// Virtual fields
contractSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

contractSchema.virtual('progress').get(function() {
  if (!this.milestones || this.milestones.length === 0) return 0;
  
  const completedMilestones = this.milestones.filter(m => m.status === 'paid').length;
  return Math.round((completedMilestones / this.milestones.length) * 100);
});

contractSchema.virtual('remainingAmount').get(function() {
  return this.totalAmount - this.totalPaid;
});

contractSchema.virtual('platformFeeAmount').get(function() {
  return Math.round(this.totalAmount * (this.paymentTerms.platformFee / 100));
});

contractSchema.virtual('freelancerEarnings').get(function() {
  return this.totalAmount - this.platformFeeAmount;
});

// Pre-save middleware to generate contract number
contractSchema.pre('save', async function(next) {
  if (this.isNew && !this.contractNumber) {
    const count = await mongoose.model('Contract').countDocuments();
    this.contractNumber = `TH-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Instance methods
contractSchema.methods.addSignature = function(userId: string, ipAddress?: string, userAgent?: string) {
  this.signatures.push({
    userId,
    signedAt: new Date(),
    ipAddress,
    userAgent,
  });

  // Check if all parties have signed
  const requiredSigners = [this.client.toString(), this.freelancer.toString()];
  const signers = this.signatures.map(s => s.userId.toString());
  
  this.allPartiesSigned = requiredSigners.every(signer => signers.includes(signer));
  
  if (this.allPartiesSigned && this.status === 'pending_signatures') {
    this.status = 'active';
    this.signedAt = new Date();
  }

  return this.save();
};

contractSchema.methods.approveMilestone = function(milestoneId: string) {
  const milestone = this.milestones.id(milestoneId);
  if (milestone && milestone.status === 'submitted') {
    milestone.status = 'approved';
    milestone.approvedAt = new Date();
    return this.save();
  }
  throw new Error('Milestone not found or not in submitted status');
};

contractSchema.methods.releaseMilestonePayment = function(milestoneId: string) {
  const milestone = this.milestones.id(milestoneId);
  if (milestone && milestone.status === 'approved') {
    milestone.status = 'paid';
    milestone.paidAt = new Date();
    this.totalPaid += milestone.amount;
    this.escrowBalance -= milestone.amount;
    
    // Check if contract is completed
    const allMilestonesPaid = this.milestones.every(m => m.status === 'paid');
    if (allMilestonesPaid && this.status === 'active') {
      this.status = 'completed';
      this.completedAt = new Date();
    }
    
    return this.save();
  }
  throw new Error('Milestone not found or not approved');
};

contractSchema.methods.initiateDispute = function(reason: string) {
  this.disputeReason = reason;
  this.disputeStatus = 'pending';
  this.status = 'disputed';
  return this.save();
};

// Static methods
contractSchema.statics.findActiveContracts = function(userId?: string) {
  const query: any = { status: 'active' };
  if (userId) {
    query.$or = [{ client: userId }, { freelancer: userId }];
  }
  return this.find(query)
    .populate('project', 'title')
    .populate('client', 'profile')
    .populate('freelancer', 'profile');
};

contractSchema.statics.findByContractNumber = function(contractNumber: string) {
  return this.findOne({ contractNumber })
    .populate('project')
    .populate('client', 'profile')
    .populate('freelancer', 'profile');
};

export const Contract = mongoose.model<IContract>('Contract', contractSchema);
```
## 5. Controller Layer

### 5.1 Authentication Controller

#### 5.1.1 Auth Controller Implementation
```typescript
// src/controllers/authController.ts
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '@/models/User';
import { logger } from '@/utils/logger';
import { sendEmail } from '@/services/email.service';
import { redisService } from '@/config/redis';
import { ApiError } from '@/utils/apiError';
import { asyncHandler } from '@/utils/asyncHandler';

// Generate JWT tokens
const generateTokens = (userId: string, role: string, email: string) => {
  const payload = { userId, role, email };
  
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
  
  return { accessToken, refreshToken };
};

// Store refresh token in Redis
const storeRefreshToken = async (userId: string, refreshToken: string) => {
  const ttl = 30 * 24 * 60 * 60; // 30 days in seconds
  await redisService.set(`refresh_token:${userId}`, refreshToken, ttl);
};

// User registration
export const register = asyncHandler(async (req: Request, res: Response) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }

  const { email, password, firstName, lastName, role, agreeToTerms } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  // Check terms agreement
  if (!agreeToTerms) {
    throw new ApiError(400, 'You must agree to the terms and conditions');
  }

  // Create new user
  const user = new User({
    email,
    password,
    role,
    profile: {
      firstName,
      lastName,
    },
  });

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await user.save();

  // Send verification email
  try {
    await sendEmail({
      to: email,
      subject: 'Verify Your TalentHive Account',
      template: 'email-verification',
      data: {
        firstName,
        verificationUrl: `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`,
      },
    });
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    // Don't fail registration if email fails
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(
    user._id.toString(),
    user.role,
    user.email
  );

  // Store refresh token
  await storeRefreshToken(user._id.toString(), refreshToken);

  // Log registration
  logger.info(`New user registered: ${email} (${role})`);

  // Return user data (without password)
  const userResponse = user.toObject();
  delete userResponse.password;

  res.status(201).json({
    status: 'success',
    message: 'Registration successful. Please check your email to verify your account.',
    data: {
      user: userResponse,
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });
});

// User login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }

  const { email, password, rememberMe } = req.body;

  // Find user and include password for comparison
  const user = await User.findByEmail(email).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check account status
  if (user.accountStatus !== 'active') {
    throw new ApiError(403, 'Account is suspended or deactivated');
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // Generate tokens
  const tokenExpiry = rememberMe ? '30d' : '7d';
  const { accessToken, refreshToken } = generateTokens(
    user._id.toString(),
    user.role,
    user.email
  );

  // Store refresh token
  await storeRefreshToken(user._id.toString(), refreshToken);

  // Log successful login
  logger.info(`User logged in: ${email}`);

  // Return user data (without password)
  const userResponse = user.toObject();
  delete userResponse.password;

  res.json({
    status: 'success',
    message: 'Login successful',
    data: {
      user: userResponse,
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
    },
  });
});

// Token refresh
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token is required');
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    const userId = decoded.userId;

    // Check if refresh token exists in Redis
    const storedToken = await redisService.get(`refresh_token:${userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Find user
    const user = await User.findById(userId);
    if (!user || user.accountStatus !== 'active') {
      throw new ApiError(401, 'User not found or account inactive');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id.toString(),
      user.role,
      user.email
    );

    // Store new refresh token
    await storeRefreshToken(user._id.toString(), newRefreshToken);

    res.json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, 'Invalid refresh token');
    }
    throw error;
  }
});

// User logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (userId) {
    // Remove refresh token from Redis
    await redisService.del(`refresh_token:${userId}`);
    
    // Log logout
    logger.info(`User logged out: ${req.user?.email}`);
  }

  res.json({
    status: 'success',
    message: 'Logout successful',
  });
});

// Email verification
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, 'Verification token is required');
  }

  // Find user with verification token
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  // Verify email
  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  logger.info(`Email verified for user: ${user.email}`);

  res.json({
    status: 'success',
    message: 'Email verified successfully',
  });
});

// Forgot password
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    // Don't reveal if email exists
    return res.json({
      status: 'success',
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // Send reset email
  try {
    await sendEmail({
      to: email,
      subject: 'Reset Your TalentHive Password',
      template: 'password-reset',
      data: {
        firstName: user.profile.firstName,
        resetUrl: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
      },
    });

    logger.info(`Password reset email sent to: ${email}`);
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    throw new ApiError(500, 'Failed to send password reset email');
  }

  res.json({
    status: 'success',
    message: 'If an account with that email exists, a password reset link has been sent.',
  });
});

// Reset password
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  // Find user with reset token
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Invalidate all existing refresh tokens
  await redisService.del(`refresh_token:${user._id}`);

  logger.info(`Password reset for user: ${user.email}`);

  res.json({
    status: 'success',
    message: 'Password reset successful. Please login with your new password.',
  });
});

// Get current user profile
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const user = await User.findById(userId)
    .populate('clientProfile.organizationId', 'name')
    .select('-password');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({
    status: 'success',
    data: { user },
  });
});

// Validate session
export const validateSession = asyncHandler(async (req: Request, res: Response) => {
  // If we reach here, the auth middleware has already validated the token
  res.json({
    status: 'success',
    message: 'Session is valid',
    data: {
      user: req.user,
      isAuthenticated: true,
    },
  });
});
```
### 5.2 Project Controller

#### 5.2.1 Project Controller Implementation
```typescript
// src/controllers/projectController.ts
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Project } from '@/models/Project';
import { User } from '@/models/User';
import { Proposal } from '@/models/Proposal';
import { logger } from '@/utils/logger';
import { ApiError } from '@/utils/apiError';
import { asyncHandler } from '@/utils/asyncHandler';
import { socketService } from '@/services/socket.service';

// Get all projects with filtering and pagination
export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    category,
    skills,
    budgetMin,
    budgetMax,
    budgetType,
    status = 'open',
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    featured,
    urgent,
  } = req.query;

  // Build filter query
  const filter: any = {};

  // Status filter
  if (status) {
    filter.status = status;
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Skills filter
  if (skills) {
    const skillsArray = Array.isArray(skills) ? skills : [skills];
    filter.skills = { $in: skillsArray };
  }

  // Budget filter
  if (budgetMin || budgetMax || budgetType) {
    filter.budget = {};
    if (budgetType) filter.budget.type = budgetType;
    if (budgetMin) filter.budget.min = { $gte: Number(budgetMin) };
    if (budgetMax) filter.budget.max = { $lte: Number(budgetMax) };
  }

  // Featured/urgent filters
  if (featured === 'true') filter.isFeatured = true;
  if (urgent === 'true') filter.isUrgent = true;

  // Search filter
  if (search) {
    filter.$text = { $search: search as string };
  }

  // Only show non-expired projects for open status
  if (status === 'open') {
    filter.applicationDeadline = { $gte: new Date() };
  }

  // Build sort object
  const sort: any = {};
  if (search) {
    sort.score = { $meta: 'textScore' }; // Text search relevance
  }
  sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  // Execute query with pagination
  const skip = (Number(page) - 1) * Number(limit);
  
  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('client', 'profile rating')
      .populate('category', 'name')
      .populate('skills', 'name')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Project.countDocuments(filter),
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / Number(limit));
  const hasNextPage = Number(page) < totalPages;
  const hasPrevPage = Number(page) > 1;

  res.json({
    status: 'success',
    data: {
      projects,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: totalPages,
        hasNextPage,
        hasPrevPage,
      },
    },
  });
});

// Get single project by ID
export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid project ID');
  }

  const project = await Project.findById(id)
    .populate('client', 'profile rating')
    .populate('category', 'name')
    .populate('skills', 'name')
    .populate('assignedFreelancer', 'profile rating');

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Increment view count (but not for the project owner)
  if (userId && project.client._id.toString() !== userId) {
    await project.incrementViewCount();
  }

  // Check if current user has submitted a proposal
  let userProposal = null;
  if (userId) {
    userProposal = await Proposal.findOne({
      project: id,
      freelancer: userId,
    }).select('status createdAt');
  }

  res.json({
    status: 'success',
    data: {
      project,
      userProposal,
    },
  });
});

// Create new project
export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }

  const userId = req.user?.userId;
  const userRole = req.user?.role;

  // Only clients can create projects
  if (userRole !== 'client' && userRole !== 'admin') {
    throw new ApiError(403, 'Only clients can create projects');
  }

  const projectData = {
    ...req.body,
    client: userId,
  };

  // Validate application deadline
  const deadline = new Date(projectData.applicationDeadline);
  if (deadline <= new Date()) {
    throw new ApiError(400, 'Application deadline must be in the future');
  }

  // Create project
  const project = new Project(projectData);
  await project.save();

  // Populate references
  await project.populate('client', 'profile rating');
  await project.populate('category', 'name');
  await project.populate('skills', 'name');

  // Update client's project count
  await User.findByIdAndUpdate(userId, {
    $inc: { 'clientProfile.projectsPosted': 1 },
  });

  // Emit real-time event for new project
  socketService.emitToAll('project:new', {
    projectId: project._id,
    title: project.title,
    category: project.category,
    skills: project.skills,
    budget: project.budget,
  });

  logger.info(`New project created: ${project.title} by user ${userId}`);

  res.status(201).json({
    status: 'success',
    message: 'Project created successfully',
    data: { project },
  });
});

// Update project
export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'Validation failed', errors.array());
  }

  const { id } = req.params;
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid project ID');
  }

  const project = await Project.findById(id);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Check permissions
  const isOwner = project.client.toString() === userId;
  const isAdmin = userRole === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'You can only update your own projects');
  }

  // Prevent updates if project is in progress or completed
  if (['in_progress', 'completed', 'cancelled'].includes(project.status)) {
    throw new ApiError(400, 'Cannot update project in current status');
  }

  // Update project
  const updatedProject = await Project.findByIdAndUpdate(
    id,
    { ...req.body, updatedAt: new Date() },
    { new: true, runValidators: true }
  )
    .populate('client', 'profile rating')
    .populate('category', 'name')
    .populate('skills', 'name');

  // Emit real-time update
  socketService.emitToRoom(`project:${id}`, 'project:updated', {
    projectId: id,
    changes: req.body,
  });

  logger.info(`Project updated: ${id} by user ${userId}`);

  res.json({
    status: 'success',
    message: 'Project updated successfully',
    data: { project: updatedProject },
  });
});

// Delete project
export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid project ID');
  }

  const project = await Project.findById(id);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Check permissions
  const isOwner = project.client.toString() === userId;
  const isAdmin = userRole === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, 'You can only delete your own projects');
  }

  // Prevent deletion if project has active proposals or contracts
  if (project.status === 'in_progress') {
    throw new ApiError(400, 'Cannot delete project that is in progress');
  }

  // Check for active proposals
  const proposalCount = await Proposal.countDocuments({
    project: id,
    status: { $in: ['pending', 'accepted'] },
  });

  if (proposalCount > 0) {
    throw new ApiError(400, 'Cannot delete project with active proposals');
  }

  // Delete project
  await Project.findByIdAndDelete(id);

  // Update client's project count
  await User.findByIdAndUpdate(project.client, {
    $inc: { 'clientProfile.projectsPosted': -1 },
  });

  // Delete related proposals
  await Proposal.deleteMany({ project: id });

  logger.info(`Project deleted: ${id} by user ${userId}`);

  res.json({
    status: 'success',
    message: 'Project deleted successfully',
  });
});

// Get project proposals
export const getProjectProposals = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const { page = 1, limit = 20, status, sortBy = 'createdAt' } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid project ID');
  }

  const project = await Project.findById(id);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Check if user is the project owner
  if (project.client.toString() !== userId) {
    throw new ApiError(403, 'You can only view proposals for your own projects');
  }

  // Build filter
  const filter: any = { project: id };
  if (status) {
    filter.status = status;
  }

  // Execute query with pagination
  const skip = (Number(page) - 1) * Number(limit);
  
  const [proposals, total] = await Promise.all([
    Proposal.find(filter)
      .populate('freelancer', 'profile rating freelancerProfile.title freelancerProfile.hourlyRate')
      .sort({ [sortBy as string]: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Proposal.countDocuments(filter),
  ]);

  res.json({
    status: 'success',
    data: {
      proposals,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

// Publish project (change status from draft to open)
export const publishProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  const project = await Project.findById(id);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Check ownership
  if (project.client.toString() !== userId) {
    throw new ApiError(403, 'You can only publish your own projects');
  }

  // Check if project is in draft status
  if (project.status !== 'draft') {
    throw new ApiError(400, 'Only draft projects can be published');
  }

  // Validate required fields for publishing
  if (!project.title || !project.description || !project.category || !project.skills.length) {
    throw new ApiError(400, 'Project must have title, description, category, and skills to be published');
  }

  // Update status
  project.status = 'open';
  await project.save();

  // Emit real-time event
  socketService.emitToAll('project:published', {
    projectId: project._id,
    title: project.title,
  });

  logger.info(`Project published: ${id} by user ${userId}`);

  res.json({
    status: 'success',
    message: 'Project published successfully',
    data: { project },
  });
});

// Get featured projects
export const getFeaturedProjects = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;

  const projects = await Project.findFeaturedProjects(Number(limit));

  res.json({
    status: 'success',
    data: { projects },
  });
});

// Get recommended projects for freelancer
export const getRecommendedProjects = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { limit = 20 } = req.query;

  // Get freelancer's skills
  const freelancer = await User.findById(userId).select('freelancerProfile.skills');
  if (!freelancer || !freelancer.freelancerProfile?.skills?.length) {
    return res.json({
      status: 'success',
      data: { projects: [] },
    });
  }

  // Find projects matching freelancer's skills
  const projects = await Project.findBySkills(
    freelancer.freelancerProfile.skills,
    Number(limit)
  );

  res.json({
    status: 'success',
    data: { projects },
  });
});
```