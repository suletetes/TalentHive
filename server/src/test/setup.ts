import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Mock Redis before any imports that use it
jest.mock('@/config/redis');

// Load environment variables
dotenv.config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-very-long-for-security';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-key-very-long-for-security';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'; // Longer expiry for tests
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
process.env.SENDGRID_API_KEY = 'SG.test-api-key-for-testing';
process.env.FROM_EMAIL = 'test@talenthive.com';
process.env.FROM_NAME = 'TalentHive Test';

// Mock Stripe
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_secret';

// Mock Cloudinary
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

let redisClient: any;

// Global test database connection
let isConnected = false;

// Setup test database before all tests
beforeAll(async () => {
  // Use local MongoDB for tests (avoids Windows MongoDB Memory Server issues)
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/talenthive_test';
  
  // Set the MongoDB URI for tests
  process.env.MONGODB_URI = mongoUri;
  
  // Force disconnect if already connected to ensure clean state
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  // Connect with fresh connection
  await mongoose.connect(mongoUri, {
    maxPoolSize: 1, // Limit connection pool for tests
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  
  isConnected = true;

  // Don't actually connect to Redis in tests - it's mocked
  redisClient = null;
}, 30000);

// Clean up after each test
afterEach(async () => {
  if (!isConnected || mongoose.connection.readyState !== 1) {
    return;
  }

  try {
    // Get all collections and clear them
    const collections = mongoose.connection.collections;
    const clearPromises = Object.keys(collections).map(async (collectionName) => {
      try {
        const collection = collections[collectionName];
        if (collection && typeof collectionName === 'string') {
          await collection.deleteMany({});
        }
      } catch (error) {
        // Ignore errors for collections that don't exist or can't be cleared
        console.warn(`Failed to clear collection ${collectionName}:`, error);
      }
    });
    
    await Promise.all(clearPromises);
  } catch (error) {
    console.warn('Error during test cleanup:', error);
  }
}, 10000);

// Cleanup after all tests
afterAll(async () => {
  if (isConnected && mongoose.connection.readyState !== 0) {
    try {
      // Drop the test database entirely
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
    } catch (error) {
      console.warn('Error during final cleanup:', error);
    }
  }
  
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.quit();
    } catch (error) {
      // Ignore errors during cleanup
    }
  }
  
  isConnected = false;
}, 30000);